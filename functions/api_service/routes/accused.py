"""
Lumina — Accused API Routes
GET  /api/accused       — List accused (paginated)
GET  /api/accused/<id>  — Get accused by ID (with case history)
POST /api/accused       — Create a new accused
PUT  /api/accused/<id>  — Update accused details
"""

from utils.db import DataStore
from utils.response import success, created, not_found, bad_request, paginated
from utils.validators import validate_accused

TABLE = "Accused"


def handle(request, path_parts):
    """Route dispatcher for /api/accused endpoints."""
    db = DataStore(request)

    if request.method == "GET":
        if len(path_parts) == 2:
            return list_accused(request, db)
        elif len(path_parts) == 3:
            return get_accused(db, path_parts[2])

    elif request.method == "POST":
        if len(path_parts) == 2:
            return create_accused(request, db)

    elif request.method == "PUT":
        if len(path_parts) == 3:
            return update_accused(request, db, path_parts[2])

    return bad_request("Invalid endpoint or method")


def list_accused(request, db):
    """List accused with pagination and optional repeat-offender filter."""
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))
    repeat_only = request.args.get("repeat_offenders", "").lower() == "true"

    if repeat_only:
        query = (
            f"SELECT * FROM {TABLE} "
            f"WHERE Arrest_Count >= 2 "
            f"ORDER BY Arrest_Count DESC LIMIT {limit} OFFSET {offset}"
        )
        results = db.execute_query(query)
        total = _extract_count(
            db.execute_query(
                f"SELECT COUNT(ROWID) FROM {TABLE} WHERE Arrest_Count >= 2"
            )
        )
    else:
        results = db.get_all(TABLE, limit=limit, offset=offset, order_by="Name")
        total = db.count(TABLE)

    rows = [_extract(r) for r in results]
    return paginated(rows, total, limit, offset)


def get_accused(db, accused_id):
    """Get a single accused by ROWID with their case history."""
    try:
        row_id = int(accused_id)
    except ValueError:
        return bad_request("Invalid accused ID")

    result = db.get_by_id(TABLE, row_id)
    if not result:
        return not_found(f"Accused with ID {row_id} not found")

    accused_data = _extract(result)

    # Fetch case history (FIRs linked to this accused)
    cases_query = (
        f"SELECT * FROM Case_Accused "
        f"WHERE Accused_ID = {row_id}"
    )
    try:
        cases = db.execute_query(cases_query)
        accused_data["cases"] = [_extract_table(c, "Case_Accused") for c in cases]
    except Exception:
        accused_data["cases"] = []

    return success(accused_data)


def create_accused(request, db):
    """Create a new accused profile."""
    data = request.get_json(silent=True)
    if not data:
        return bad_request("Request body must be valid JSON")

    errors = validate_accused(data)
    if errors:
        return bad_request("Validation failed", details=errors)

    row = {"Name": data["Name"]}
    if data.get("DOB"):
        row["DOB"] = data["DOB"]
    if data.get("Gender"):
        row["Gender"] = data["Gender"]
    if data.get("Occupation"):
        row["Occupation"] = data["Occupation"]
    row["Arrest_Count"] = int(data.get("Arrest_Count", 0))

    result = db.insert(TABLE, row)
    return created(result, message="Accused profile created")


def update_accused(request, db, accused_id):
    """Update an existing accused profile."""
    try:
        row_id = int(accused_id)
    except ValueError:
        return bad_request("Invalid accused ID")

    existing = db.get_by_id(TABLE, row_id)
    if not existing:
        return not_found(f"Accused with ID {row_id} not found")

    data = request.get_json(silent=True)
    if not data:
        return bad_request("Request body must be valid JSON")

    update_fields = {}
    updatable = ["Name", "DOB", "Gender", "Occupation", "Arrest_Count"]
    for field in updatable:
        if field in data:
            update_fields[field] = data[field]

    if not update_fields:
        return bad_request("No valid fields to update")

    if "Arrest_Count" in update_fields:
        update_fields["Arrest_Count"] = int(update_fields["Arrest_Count"])

    result = db.update(TABLE, row_id, update_fields)
    return success(result, message="Accused profile updated")


def _extract(row):
    if isinstance(row, dict) and TABLE in row:
        return row[TABLE]
    return row


def _extract_table(row, table_name):
    if isinstance(row, dict) and table_name in row:
        return row[table_name]
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
