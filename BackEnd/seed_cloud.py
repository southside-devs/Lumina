"""
Lumina — Seed Cloud Catalyst DataStore Script
Populates districts and police stations into the deployed Catalyst Cloud database.

Usage:
    python seed_cloud.py
"""

import csv
import json
import urllib.request
import urllib.error
from pathlib import Path

API_BASE_URL = "https://lumina-60078984780.development.catalystserverless.in/server/api_service/api"
DEMO_KEY = "lumina-demo-ksp-2026"
SYNTHETIC_DIR = Path(__file__).resolve().parent.parent / "DataBase" / "synthetic"

HEADERS = {
    "Content-Type": "application/json",
    "X-Lumina-Demo-Key": DEMO_KEY,
}


def post_record(endpoint, payload):
    url = f"{API_BASE_URL}/{endpoint}"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=HEADERS, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            res_body = resp.read().decode("utf-8")
            return json.loads(res_body)
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8")
        print(f"  [ERROR {e.code}] {url}: {err}")
        return None
    except Exception as e:
        print(f"  [EXC] {url}: {e}")
        return None


def seed_districts():
    csv_path = SYNTHETIC_DIR / "districts.csv"
    if not csv_path.exists():
        print(f"CSV not found: {csv_path}")
        return

    print("--- Seeding Districts ---")
    count = 0
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            payload = {
                "Name": row["Name"],
                "Code": row["Code"],
                "Population": int(row["Population"]),
                "Latitude": float(row["Latitude"]),
                "Longitude": float(row["Longitude"]),
            }
            res = post_record("districts", payload)
            if res and res.get("status") in ("success", "created"):
                count += 1
    print(f"[OK] Seeded {count} Districts")


def seed_police_stations():
    csv_path = SYNTHETIC_DIR / "police_stations.csv"
    if not csv_path.exists():
        print(f"CSV not found: {csv_path}")
        return

    print("--- Seeding Police Stations (Top 30) ---")
    count = 0
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= 30:  # Seed top 30 for fast seeding
                break
            payload = {
                "District_ID": int(row["District_ID"]),
                "Name": row["Name"],
                "Jurisdiction_Area": row["Jurisdiction_Area"],
                "Latitude": float(row["Latitude"]),
                "Longitude": float(row["Longitude"]),
            }
            res = post_record("stations", payload)
            if res and res.get("status") in ("success", "created"):
                count += 1
    print(f"[OK] Seeded {count} Police Stations")


def seed_firs():
    csv_path = SYNTHETIC_DIR / "firs.csv"
    if not csv_path.exists():
        print(f"CSV not found: {csv_path}")
        return

    print("--- Seeding FIRs (Top 50) ---")
    count = 0
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= 50:  # Seed top 50
                break
            payload = {
                "Station_ID": int(row["Station_ID"]),
                "FIR_Number": i + 1,
                "Incident_Date": row["Date"],
                "Crime_Group": row["Crime_Group"],
                "Crime_Subgroup": row["Crime_Subgroup"],
                "Latitude": float(row["Latitude"]),
                "Longitude": float(row["Longitude"]),
                "Narrative": row["Narrative"],
                "Status": row["Status"],
            }
            res = post_record("firs", payload)
            if res and res.get("status") in ("success", "created"):
                count += 1
    print(f"[OK] Seeded {count} FIRs")


def seed_accused():
    csv_path = SYNTHETIC_DIR / "accused.csv"
    if not csv_path.exists():
        print(f"CSV not found: {csv_path}")
        return

    print("--- Seeding Accused (Top 30) ---")
    count = 0
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= 30:
                break
            payload = {
                "Name": row["Name"],
                "DOB": row["DOB"],
                "Gender": row["Gender"],
                "Occupation": row["Occupation"],
                "Arrest_Count": int(row["Arrest_Count"]),
            }
            res = post_record("accused", payload)
            if res and res.get("status") in ("success", "created"):
                count += 1
    print(f"[OK] Seeded {count} Accused")


def seed_victims():
    csv_path = SYNTHETIC_DIR / "victims.csv"
    if not csv_path.exists():
        print(f"CSV not found: {csv_path}")
        return

    print("--- Seeding Victims (Top 30) ---")
    count = 0
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= 30:
                break
            payload = {
                "FIR_ID": int(row["FIR_ID"]),
                "Name": row["Name"],
                "DOB": row["DOB"],
                "Gender": row["Gender"],
                "Socioeconomic_Status": row["Socioeconomic_Status"],
            }
            res = post_record("victims", payload)
            if res and res.get("status") in ("success", "created"):
                count += 1
    print(f"[OK] Seeded {count} Victims")


if __name__ == "__main__":
    print("Starting Catalyst DataStore Cloud Seeding...")
    seed_districts()
    seed_police_stations()
    seed_firs()
    seed_accused()
    seed_victims()
    print("Seeding completed!")
