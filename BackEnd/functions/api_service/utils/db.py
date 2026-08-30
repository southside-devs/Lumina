"""
Lumina — Universal Data Store Engine
Supports dual-mode execution:
  1. Zoho Catalyst Cloud Mode: Queries Catalyst Data Store via ZCQL.
  2. Local Standalone Mode: Queries in-memory SQLite database populated with
     real synthetic CSV datasets (5,000+ FIRs, 31 Districts, 200 Stations, Accused, Victims).
"""

import os
import sqlite3
import threading
import csv
import logging

logger = logging.getLogger("lumina.db")

# Path discovery for synthetic data CSVs
DATA_DIR_CANDIDATES = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "DataBase", "synthetic")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", "synthetic")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "DataBase", "synthetic")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "synthetic")),
]

_LOCAL_DB_CONN = None
_LOCAL_DB_LOCK = threading.Lock()


def _get_local_sqlite_connection():
    """Build and cache an in-memory SQLite database from synthetic CSV files."""
    global _LOCAL_DB_CONN
    if _LOCAL_DB_CONN is not None:
        return _LOCAL_DB_CONN

    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.row_factory = sqlite3.Row

    # Locate CSV data folder
    csv_dir = None
    for candidate in DATA_DIR_CANDIDATES:
        if os.path.exists(candidate) and os.path.exists(os.path.join(candidate, "districts.csv")):
            csv_dir = candidate
            break

    if csv_dir:
        logger.info(f"Loading synthetic datasets from: {csv_dir}")
        table_files = {
            "District": "districts.csv",
            "Police_Station": "police_stations.csv",
            "FIR": "firs.csv",
            "Accused": "accused.csv",
            "Victim": "victims.csv",
            "Case_Accused": "case_accused.csv",
            "Risk_Score": "risk_scores.csv",
        }

        for table_name, file_name in table_files.items():
            file_path = os.path.join(csv_dir, file_name)
            if os.path.exists(file_path):
                try:
                    with open(file_path, "r", encoding="utf-8-sig") as f:
                        reader = csv.DictReader(f)
                        headers = list(reader.fieldnames or [])
                        if not headers:
                            continue

                        has_rowid = "ROWID" in headers
                        cols = list(headers)
                        if not has_rowid:
                            cols.append("ROWID")

                        col_defs = [f'"{c}" TEXT' for c in cols]
                        conn.execute(f'CREATE TABLE IF NOT EXISTS "{table_name}" ({", ".join(col_defs)})')

                        rows_to_insert = []
                        for idx, row in enumerate(reader, start=1):
                            if not has_rowid:
                                row["ROWID"] = row.get("ID") or str(idx)
                            rows_to_insert.append([row.get(c, "") for c in cols])

                        if rows_to_insert:
                            placeholders = ", ".join(["?"] * len(cols))
                            col_names = ", ".join([f'"{c}"' for c in cols])
                            conn.executemany(
                                f'INSERT INTO "{table_name}" ({col_names}) VALUES ({placeholders})',
                                rows_to_insert
                            )
                    logger.info(f"Loaded table '{table_name}'.")
                except Exception as e:
                    logger.warning(f"Failed to load {file_name} into SQLite: {e}")
    else:
        logger.warning("No synthetic CSV directory found; SQLite DB initialized empty.")

    _LOCAL_DB_CONN = conn
    return _LOCAL_DB_CONN


class DataStore:
    """Wrapper around Catalyst Data Store ZCQL operations with automatic local fallback."""

    def __init__(self, request=None):
        self.use_cloud = False
        self.zcql = None
        self.app = None

        # Attempt to initialize Catalyst SDK
        try:
            import zcatalyst_sdk
            try:
                self.app = zcatalyst_sdk.get_app()
            except Exception:
                try:
                    self.app = zcatalyst_sdk.initialize()
                except Exception:
                    self.app = zcatalyst_sdk.initialize(request)
            self.zcql = self.app.zcql()
            self.use_cloud = True
        except Exception as e:
            logger.debug(f"Catalyst SDK cloud mode unavailable ({e}), using local SQLite engine.")
            self.use_cloud = False

    def execute_query(self, query):
        """
        Execute a query against Catalyst Data Store (ZCQL) or local SQLite engine.
        Returns a list of dict rows formatted identically in both modes.
        """
        if self.use_cloud and self.zcql:
            try:
                logger.debug(f"Executing ZCQL: {query}")
                return self.zcql.execute_query(query)
            except Exception as e:
                logger.warning(f"ZCQL failed ({e}), falling back to local SQLite execution.")

        # Local SQLite execution
        return self._execute_local_sqlite(query)

    def _execute_local_sqlite(self, query):
        """Translate and execute ZCQL-compatible SQL in local SQLite."""
        conn = _get_local_sqlite_connection()
        normalized_query = query.replace("\\'", "''")
        with _LOCAL_DB_LOCK:
            cursor = conn.cursor()
            cursor.execute(normalized_query)
            if normalized_query.strip().upper().startswith("SELECT"):
                rows = cursor.fetchall()
                return [dict(row) for row in rows]
            conn.commit()
            return [{"status": "success", "rows_affected": cursor.rowcount}]

    # ── SELECT helpers ──────────────────────────────────────────────────

    def get_all(self, table, limit=100, offset=0, order_by="ROWID", order_dir="ASC"):
        """Fetch all rows from a table with pagination."""
        query = (
            f"SELECT * FROM {table} "
            f"ORDER BY {order_by} {order_dir} "
            f"LIMIT {limit} OFFSET {offset}"
        )
        return self.execute_query(query)

    def get_by_id(self, table, row_id):
        """Fetch a single row by its ROWID."""
        query = f"SELECT * FROM {table} WHERE ROWID = {row_id}"
        results = self.execute_query(query)
        if results:
            return results[0]
        return None

    def get_by_column(self, table, column, value):
        """Fetch rows matching a specific column value."""
        if isinstance(value, str):
            value = f"'{_escape(value)}'"
        query = f"SELECT * FROM {table} WHERE {column} = {value}"
        return self.execute_query(query)

    def count(self, table, where_clause=None):
        """Count rows in a table, optionally filtered."""
        query = f"SELECT COUNT(*) FROM {table}"
        if where_clause:
            query += f" WHERE {where_clause}"
        result = self.execute_query(query)
        if result:
            first = result[0]
            if isinstance(first, dict):
                for v in first.values():
                    if isinstance(v, dict):
                        for val in v.values():
                            return int(val)
                    return int(v)
        return 0

    # ── INSERT helpers ──────────────────────────────────────────────────

    def insert(self, table, data):
        columns = ", ".join(data.keys())
        values = ", ".join(_format_value(v) for v in data.values())
        query = f"INSERT INTO {table} ({columns}) VALUES ({values})"
        return self.execute_query(query)

    def bulk_insert(self, table, rows):
        results = []
        for row in rows:
            results.append(self.insert(table, row))
        return results

    # ── UPDATE helpers ──────────────────────────────────────────────────

    def update(self, table, row_id, data):
        set_clause = ", ".join(
            f"{k} = {_format_value(v)}" for k, v in data.items()
        )
        query = f"UPDATE {table} SET {set_clause} WHERE ROWID = {row_id}"
        return self.execute_query(query)

    # ── DELETE helpers ──────────────────────────────────────────────────

    def delete(self, table, row_id):
        query = f"DELETE FROM {table} WHERE ROWID = {row_id}"
        return self.execute_query(query)


def _escape(value):
    if isinstance(value, str):
        return value.replace("'", "''")
    return value


def _format_value(value):
    if value is None:
        return "NULL"
    elif isinstance(value, bool):
        return "1" if value else "0"
    elif isinstance(value, (int, float)):
        return str(value)
    else:
        return f"'{_escape(str(value))}'"
