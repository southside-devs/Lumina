"""
Lumina — Data Store Helper
Wraps Catalyst ZCQL operations with connection management and error handling.
"""

import zcatalyst_sdk
import logging

logger = logging.getLogger("lumina.db")


class DataStore:
    """Wrapper around Catalyst Data Store ZCQL operations."""

    def __init__(self, request):
        """Initialize Catalyst app from the incoming request context."""
        self.app = zcatalyst_sdk.initialize(req=request)

        self.zcql = self.app.zcql()

    def execute_query(self, query):
        """
        Execute a ZCQL query and return results.

        Args:
            query: ZCQL query string (SELECT, INSERT, UPDATE, DELETE).

        Returns:
            List of result rows for SELECT, or operation status for DML.

        Raises:
            Exception: If the query fails.
        """
        try:
            logger.debug(f"Executing ZCQL: {query}")
            result = self.zcql.execute_query(query)
            return result
        except Exception as e:
            logger.error(f"ZCQL query failed: {query} | Error: {str(e)}")
            raise

    # ── SELECT helpers ──────────────────────────────────────────────────

    def get_all(self, table, limit=100, offset=0, order_by="ROWID",
                order_dir="ASC"):
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
        query = f"SELECT COUNT(ROWID) FROM {table}"
        if where_clause:
            query += f" WHERE {where_clause}"
        result = self.execute_query(query)
        if result:
            # ZCQL returns count in a specific format
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
        """
        Insert a single row into a table.

        Args:
            table: Table name.
            data: Dict of column_name -> value.

        Returns:
            Query result.
        """
        columns = ", ".join(data.keys())
        values = ", ".join(_format_value(v) for v in data.values())
        query = f"INSERT INTO {table} ({columns}) VALUES ({values})"
        return self.execute_query(query)

    def bulk_insert(self, table, rows):
        """
        Insert multiple rows into a table.
        Note: ZCQL doesn't support multi-row INSERT natively,
        so this executes individual inserts.

        Args:
            table: Table name.
            rows: List of dicts with column_name -> value.

        Returns:
            List of results for each insert.
        """
        results = []
        for row in rows:
            result = self.insert(table, row)
            results.append(result)
        return results

    # ── UPDATE helpers ──────────────────────────────────────────────────

    def update(self, table, row_id, data):
        """
        Update a row by ROWID.

        Args:
            table: Table name.
            row_id: ROWID of the row to update.
            data: Dict of column_name -> new_value.

        Returns:
            Query result.
        """
        set_clause = ", ".join(
            f"{k} = {_format_value(v)}" for k, v in data.items()
        )
        query = f"UPDATE {table} SET {set_clause} WHERE ROWID = {row_id}"
        return self.execute_query(query)

    # ── DELETE helpers ──────────────────────────────────────────────────

    def delete(self, table, row_id):
        """Delete a row by ROWID."""
        query = f"DELETE FROM {table} WHERE ROWID = {row_id}"
        return self.execute_query(query)

    # ── Aggregation helpers (for dashboard) ─────────────────────────────

    def aggregate(self, query):
        """Execute a raw aggregation query (for dashboard endpoints)."""
        return self.execute_query(query)


# ── Private helpers ─────────────────────────────────────────────────────

def _escape(value):
    """Escape single quotes in string values for ZCQL."""
    if isinstance(value, str):
        return value.replace("'", "\\'")
    return value


def _format_value(value):
    """Format a Python value for ZCQL query interpolation."""
    if value is None:
        return "NULL"
    elif isinstance(value, bool):
        return "true" if value else "false"
    elif isinstance(value, (int, float)):
        return str(value)
    else:
        return f"'{_escape(str(value))}'"
