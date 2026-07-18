"""
Lumina — Victims API Routes
GET  /api/victims       — List victims (paginated, filterable by FIR)
GET  /api/victims/<id>  — Get victim by ID
POST /api/victims       — Create a new victim
"""

from utils.db import DataStore
from utils.response import success, created, not_found, bad_request, paginated
from utils.validators import validate_victim

TABLE = "Victim"


def handle(request, path_parts):
    """Route dispatcher for /api/victims endpoints."""
    db = DataStore(request)

    if request.method == "GET":
        if len(path_parts) == 2:
            return list_victims(request, db)
        elif len(path_parts) == 3:
            return get_victim(db, path_parts[2])

    elif request.method == "POST":
        if len(path_parts) == 2:
            return create_victim(request, db)

    return bad_request("Invalid endpoint or method")


def list_victims(request, db):
    """List victims with optional FIR filter."""
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))
    fir_id = request.args.get("fir_id")

    if fir_id:
        query = (
            f"SELECT * FROM {TABLE} "
            f"WHERE FIR_ID = {int(fir_id)} "
            f"ORDER BY ROWID ASC LIMIT {limit} OFFSET {offset}"
        )
        results = db.execute_query(query)
        total = _extract_count(
            db.execute_query(
                f"SELECT COUNT(ROWID) FROM {TABLE} WHERE FIR_ID = {int(fir_id)}"
            )
        )
    else:
        results = db.get_all(TABLE, limit=limit, offset=offset)
        total = db.count(TABLE)

    rows = [_extract(r) for r in results]
    return paginated(rows, total, limit, offset)


def get_victim(db, victim_id):
    """Get a single victim by ROWID."""
    try:
        row_id = int(victim_id)
    except ValueError:
        return bad_request("Invalid victim ID")

    result = db.get_by_id(TABLE, row_id)
    if not result:
        return not_found(f"Victim with ID {row_id} not found")

    return success(_extract(result))


def create_victim(request, db):
    """Create a new victim record."""
    data = request.get_json(silent=True)
    if not data:
        return bad_request("Request body must be valid JSON")

    errors = validate_victim(data)
    if errors:
        return bad_request("Validation failed", details=errors)

    row = {
        "FIR_ID": int(data["FIR_ID"]),
        "Name": data["Name"],
    }
    if data.get("DOB"):
        row["DOB"] = data["DOB"]
    if data.get("Gender"):
        row["Gender"] = data["Gender"]
    if data.get("Socioeconomic_Status"):
        row["Socioeconomic_Status"] = data["Socioeconomic_Status"]

    result = db.insert(TABLE, row)
    return created(result, message="Victim record created")


def _extract(row):
    if isinstance(row, dict) and TABLE in row:
        return row[TABLE]
    return row


def _extract_count(result):
    if result:
        first = result[0]
        if isinstance(first, dict):
            for v in first.values():
                if isinstance(v, dict):
                    for val in v.values():
                        return int(val)
                return int(v)
    return 0
