"""
=============================================================================
Lumina — Catalyst Data Store Provisioning Script
=============================================================================

Automates the creation of all 7 Data Store tables and their columns
using the Zoho Catalyst Management REST API.

Then optionally seeds the tables by uploading the synthetic CSV data
via the ZCQL bulk INSERT API.

Usage:
    python DataBase/provision_datastore.py

Prerequisites:
    pip install requests
=============================================================================
"""

import os
import sys
import json
import time
import csv
import requests
from pathlib import Path

# ── CONFIG ────────────────────────────────────────────────────────────────────
PROJECT_ID   = os.environ.get("CATALYST_PROJECT_ID", "")
ACCESS_TOKEN = os.environ.get("CATALYST_ACCESS_TOKEN", "")
ZOHO_DOMAIN  = os.environ.get("ZOHO_DOMAIN", "zoho.in")

SEED_DATA    = os.environ.get("SEED_DATA", "false").lower() == "true"
CSV_DIR      = Path(__file__).resolve().parent.parent / "data" / "synthetic"
BASE_URL     = f"https://api.catalyst.{ZOHO_DOMAIN}/baas/v1/project/{PROJECT_ID}"

SCHEMA = {
    "District": [
        ("Name",        "TEXT",    True),
        ("Code",        "TEXT",    True),
        ("Population",  "NUMBER",  True),
        ("Latitude",    "DECIMAL", False),
        ("Longitude",   "DECIMAL", False),
    ],
    "Police_Station": [
        ("District_ID",       "NUMBER",  True),
        ("Name",              "TEXT",    True),
        ("Jurisdiction_Area", "TEXT",    False),
        ("Latitude",          "DECIMAL", False),
        ("Longitude",         "DECIMAL", False),
    ],
    "FIR": [
        ("Station_ID",     "NUMBER",  True),
        ("FIR_Number",     "TEXT",    True),
        ("Date",           "TEXT",    True),
        ("Crime_Group",    "TEXT",    True),
        ("Crime_Subgroup", "TEXT",    False),
        ("Latitude",       "DECIMAL", True),
        ("Longitude",      "DECIMAL", True),
        ("Narrative",      "CLOB",    False),
        ("Status",         "TEXT",    True),
    ],
    "Accused": [
        ("Name",         "TEXT",   True),
        ("DOB",          "TEXT",   False),
        ("Gender",       "TEXT",   False),
        ("Occupation",   "TEXT",   False),
        ("Arrest_Count", "NUMBER", True),
    ],
    "Victim": [
        ("FIR_ID",               "NUMBER", True),
        ("Name",                 "TEXT",   True),
        ("DOB",                  "TEXT",   False),
        ("Gender",               "TEXT",   False),
        ("Socioeconomic_Status", "TEXT",   False),
    ],
    "Case_Accused": [
        ("FIR_ID",           "NUMBER", True),
        ("Accused_ID",       "NUMBER", True),
        ("Involvement_Type", "TEXT",   True),
    ],
    "Risk_Score": [
        ("District_ID",   "NUMBER",  True),
        ("Crime_Type",    "TEXT",    True),
        ("Score",         "DECIMAL", True),
        ("Forecast_Date", "TEXT",    True),
    ],
}

TABLE_ORDER = [
    "District", "Police_Station", "FIR", "Accused",
    "Victim", "Case_Accused", "Risk_Score",
]

CSV_MAP = {
    "District":       "districts.csv",
    "Police_Station": "police_stations.csv",
    "FIR":            "firs.csv",
    "Accused":        "accused.csv",
    "Victim":         "victims.csv",
    "Case_Accused":   "case_accused.csv",
    "Risk_Score":     "risk_scores.csv",
}

# ── API Helpers ───────────────────────────────────────────────────────────────
def _headers():
    return {
        "Authorization": f"Zoho-oauthtoken {ACCESS_TOKEN}",
        "Content-Type":  "application/json",
        "Accept":        "application/json",
    }

def api_get(path):
    r = requests.get(f"{BASE_URL}{path}", headers=_headers(), timeout=30)
    if r.status_code == 401:
        print("\n[ERROR] 401 Unauthorized. Your token has expired or is invalid.")
        sys.exit(1)
    r.raise_for_status()
    return r.json()

def api_post(path, body):
    r = requests.post(f"{BASE_URL}{path}", headers=_headers(), json=body, timeout=30)
    r.raise_for_status()
    return r.json()

def log(msg, level="INFO"):
    icon = {"INFO": "✔", "WARN": "⚠", "ERROR": "✖", "STEP": "►"}.get(level, "•")
    print(f"  {icon}  {msg}")

# ── Operations ────────────────────────────────────────────────────────────────
def provision_tables():
    print("\n► STEP 1 — Creating Data Store tables\n")
    try:
        result = api_get("/table")
        existing = {t["table_name"]: t["table_id"] for t in result.get("data", [])}
    except Exception as e:
        existing = {}

    for table_name in TABLE_ORDER:
        columns = SCHEMA[table_name]
        if table_name in existing:
            log(f"{table_name} — already exists, skipping", "WARN")
            continue

        try:
            print(f"\n  Creating: {table_name}")
            result = api_post("/table", {"table_name": table_name})
            table_id = result["data"]["table_id"]
            log(f"Table created (ID: {table_id})")

            for col_name, data_type, mandatory in columns:
                try:
                    api_post(f"/table/{table_id}/column", {
                        "column_name":   col_name,
                        "data_type":     data_type,
                        "is_mandatory":  mandatory,
                        "is_searchable": True,
                    })
                    flag = " [required]" if mandatory else ""
                    log(f"  + {col_name:<25} {data_type}{flag}")
                    time.sleep(0.2)
                except Exception as e:
                    log(f"  Column {col_name} failed: {e}", "ERROR")
        except Exception as e:
            log(f"Failed to create {table_name}: {e}", "ERROR")
        time.sleep(0.5)
    print("\n  ✔ All tables created.\n")

def seed_table(table_name, csv_path):
    if not csv_path.exists():
        log(f"CSV not found: {csv_path.name} — skipping {table_name}", "WARN")
        return 0

    valid_cols = [col[0] for col in SCHEMA[table_name]]
    inserted = failed = 0
    with open(csv_path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    log(f"Seeding {table_name}: {len(rows)} rows ...")
    for i, row in enumerate(rows):
        try:
            cols, vals = [], []
            for col in valid_cols:
                v = row.get(col, "")
                if v in (None, "", "nan", "NaN"):
                    continue
                cols.append(col)
                if str(v).replace('.', '', 1).isdigit():
                    vals.append(str(v))
                else:
                    escaped = str(v).replace("'", "''")
                    vals.append(f"'{escaped}'")

            if not cols: continue
            api_post("/zcql", {"query": f"INSERT INTO {table_name} ({', '.join(cols)}) VALUES ({', '.join(vals)})"})
            inserted += 1
            if (i + 1) % 200 == 0: log(f"  {i + 1}/{len(rows)} rows done...")
            time.sleep(0.05)
        except Exception as e:
            failed += 1
            if failed <= 3: log(f"  Row {i+1} failed: {e}", "WARN")
    log(f"  ✔ {table_name}: {inserted} inserted, {failed} failed")
    return inserted

def seed_all():
    print("\n► STEP 2 — Seeding tables with synthetic data\n")
    if not CSV_DIR.exists(): return
    total = sum(seed_table(t, CSV_DIR / CSV_MAP[t]) for t in TABLE_ORDER)
    print(f"\n  Total rows inserted: {total}")

def main():
    if not PROJECT_ID or not ACCESS_TOKEN:
        print("\n[ERROR] Missing CATALYST_PROJECT_ID or CATALYST_ACCESS_TOKEN env vars")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("  Lumina — Catalyst Data Store Provisioner")
    print("=" * 60)
    print(f"\n  API Domain : api.catalyst.{ZOHO_DOMAIN}")

    try:
        api_get("/table")
        log("\nTesting API connectivity ... Connected ✔")
    except Exception as e:
        sys.exit(1)

    provision_tables()
    if SEED_DATA: seed_all()

if __name__ == "__main__":
    main()
