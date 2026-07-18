"""
Lumina — ETL Cron Function
Catalyst Cron-triggered function for batch data ingestion.

Runs on a nightly schedule (configured in catalyst-config.json).
Workflow:
  1. List CSV files in Catalyst Stratus (pending-ingestion folder)
  2. Download and parse each CSV with pandas
  3. Validate and normalize rows
  4. Bulk insert into Catalyst Data Store tables
  5. Move processed files to an archive folder
"""

import io
import logging
from datetime import datetime

import pandas as pd
import zcatalyst_sdk

# ── Logging ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(name)s %(levelname)s: %(message)s",
)
logger = logging.getLogger("lumina.etl")

# ── Constants ───────────────────────────────────────────────────────────
STRATUS_PENDING_FOLDER = "pending-ingestion"
STRATUS_ARCHIVE_FOLDER = "archived"

# Maps CSV filename patterns to Data Store table names and required columns
TABLE_MAPPING = {
    "districts": {
        "table": "District",
        "required": ["Name", "Code", "Population"],
        "optional": ["Latitude", "Longitude"],
    },
    "police_stations": {
        "table": "Police_Station",
        "required": ["District_ID", "Name"],
        "optional": ["Jurisdiction_Area", "Latitude", "Longitude"],
    },
    "firs": {
        "table": "FIR",
        "required": ["Station_ID", "FIR_Number", "Date", "Crime_Group",
                      "Latitude", "Longitude"],
        "optional": ["Crime_Subgroup", "Narrative", "Status"],
    },
    "accused": {
        "table": "Accused",
        "required": ["Name"],
        "optional": ["DOB", "Gender", "Occupation", "Arrest_Count"],
    },
    "victims": {
        "table": "Victim",
        "required": ["FIR_ID", "Name"],
        "optional": ["DOB", "Gender", "Socioeconomic_Status"],
    },
    "case_accused": {
        "table": "Case_Accused",
        "required": ["FIR_ID", "Accused_ID"],
        "optional": ["Involvement_Type"],
    },
    "risk_scores": {
        "table": "Risk_Score",
        "required": ["District_ID", "Crime_Type", "Score", "Forecast_Date"],
        "optional": [],
    },
}


def handler(request):
    """
    Catalyst Cron handler — entry point for the scheduled ETL job.

    Args:
        request: Catalyst cron request object.
    """
    logger.info("=" * 60)
    logger.info("Lumina ETL Cron Job started")
    logger.info(f"Timestamp: {datetime.utcnow().isoformat()}")
    logger.info("=" * 60)

    try:
        app = zcatalyst_sdk.initialize(request)
        stratus = app.stratus()
        zcql = app.zcql()

        # Step 1: List files in the pending-ingestion folder
        logger.info(f"Listing files in Stratus: {STRATUS_PENDING_FOLDER}/")
        try:
            files = stratus.get_all_folders()
            pending_files = _get_pending_files(stratus, STRATUS_PENDING_FOLDER)
        except Exception as e:
            logger.warning(f"Could not list Stratus files: {e}")
            pending_files = []

        if not pending_files:
            logger.info("No pending files found. ETL job complete.")
            return {"status": "ok", "message": "No files to process"}

        logger.info(f"Found {len(pending_files)} file(s) to process")

        results = {
            "processed": 0,
            "failed": 0,
            "total_rows": 0,
            "errors": [],
        }

        # Step 2-4: Process each file
        for file_info in pending_files:
            try:
                file_name = file_info.get("file_name", "unknown")
                logger.info(f"Processing: {file_name}")

                # Determine target table from filename
                table_key = _match_table(file_name)
                if not table_key:
                    logger.warning(f"No table mapping for: {file_name}")
                    results["errors"].append(f"Unknown file type: {file_name}")
                    results["failed"] += 1
                    continue

                mapping = TABLE_MAPPING[table_key]

                # Download file content
                file_content = stratus.download_file(file_info["id"])

                # Parse CSV
                df = pd.read_csv(io.BytesIO(file_content))
                logger.info(
                    f"  Parsed {len(df)} rows, columns: {list(df.columns)}"
                )

                # Validate required columns
                missing = [
                    c for c in mapping["required"]
                    if c not in df.columns
                ]
                if missing:
                    msg = f"Missing required columns in {file_name}: {missing}"
                    logger.error(msg)
                    results["errors"].append(msg)
                    results["failed"] += 1
                    continue

                # Clean and normalize
                df = _clean_dataframe(df, mapping)

                # Bulk insert into Data Store
                rows_inserted = _bulk_insert(
                    zcql, mapping["table"], df, mapping
                )
                logger.info(
                    f"  Inserted {rows_inserted} rows into {mapping['table']}"
                )

                results["processed"] += 1
                results["total_rows"] += rows_inserted

                # Step 5: Archive the processed file
                _archive_file(stratus, file_info)

            except Exception as e:
                logger.exception(f"Failed to process {file_name}: {e}")
                results["errors"].append(f"{file_name}: {str(e)}")
                results["failed"] += 1

        logger.info("=" * 60)
        logger.info(f"ETL complete: {results}")
        logger.info("=" * 60)

        return {"status": "ok", "results": results}

    except Exception as e:
        logger.exception(f"ETL job failed: {e}")
        return {"status": "error", "message": str(e)}


def _get_pending_files(stratus, folder_name):
    """List all CSV files in the pending-ingestion Stratus folder."""
    try:
        folder = stratus.get_folder(folder_name)
        if folder:
            files = stratus.get_all_files(folder["id"])
            return [
                f for f in files
                if f.get("file_name", "").endswith(".csv")
            ]
    except Exception:
        pass
    return []


def _match_table(filename):
    """
    Match a filename to a table mapping key.
    E.g., 'firs_2025_batch1.csv' -> 'firs'
    """
    filename_lower = filename.lower()
    for key in TABLE_MAPPING:
        if key in filename_lower:
            return key
    return None


def _clean_dataframe(df, mapping):
    """Clean and normalize a DataFrame for insertion."""
    # Keep only known columns
    all_columns = mapping["required"] + mapping["optional"]
    valid_cols = [c for c in df.columns if c in all_columns]
    df = df[valid_cols].copy()

    # Drop rows with missing required fields
    df = df.dropna(subset=mapping["required"])

    # Strip whitespace from string columns
    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = df[col].str.strip()

    # Remove the synthetic 'ID' column if present (Data Store uses ROWID)
    if "ID" in df.columns:
        df = df.drop(columns=["ID"])

    return df


def _bulk_insert(zcql, table_name, df, mapping):
    """Insert DataFrame rows into a Catalyst Data Store table via ZCQL."""
    inserted = 0
    all_columns = mapping["required"] + mapping["optional"]

    for _, row in df.iterrows():
        try:
            cols = []
            vals = []
            for col in all_columns:
                if col in row.index and pd.notna(row[col]):
                    cols.append(col)
                    vals.append(_format_value(row[col]))

            if cols:
                query = (
                    f"INSERT INTO {table_name} "
                    f"({', '.join(cols)}) "
                    f"VALUES ({', '.join(vals)})"
                )
                zcql.execute_query(query)
                inserted += 1

        except Exception as e:
            logger.warning(f"Insert failed for row in {table_name}: {e}")

    return inserted


def _archive_file(stratus, file_info):
    """Move a processed file to the archive folder."""
    try:
        # In Catalyst Stratus, we can't truly "move" files,
        # so we delete from pending after successful processing.
        stratus.delete_file(file_info["id"])
        logger.info(f"  Archived (deleted from pending): {file_info.get('file_name')}")
    except Exception as e:
        logger.warning(f"  Failed to archive file: {e}")


def _format_value(value):
    """Format a Python/pandas value for ZCQL insertion."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return "NULL"
    elif isinstance(value, bool):
        return "true" if value else "false"
    elif isinstance(value, (int, float)):
        return str(value)
    else:
        escaped = str(value).replace("'", "\\'")
        return f"'{escaped}'"
