"""
Lumina — Districts API Routes
GET  /api/districts       — List all districts (paginated)
GET  /api/districts/<id>  — Get district by ID
POST /api/districts       — Create a new district
"""

from utils.db import DataStore
from utils.response import success, created, not_found, bad_request, paginated
from utils.validators import validate_district

TABLE = "District"


def handle(request, path_parts):
    """Route dispatcher for /api/districts endpoints."""
    db = DataStore(request)

    if request.method == "GET":
        if len(path_parts) == 2:
            # GET /api/districts
            return list_districts(request, db)
        elif len(path_parts) == 3:
            # GET /api/districts/<id>
            return get_district(db, path_parts[2])

    elif request.method == "POST":
        if len(path_parts) == 2:
            # POST /api/districts
            return create_district(request, db)

    return bad_request("Invalid endpoint or method")


def list_districts(request, db):
    """List all districts with optional pagination."""
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))

    results = db.get_all(TABLE, limit=limit, offset=offset)
    total = db.count(TABLE)

    rows = [_extract(r) for r in results]
    return paginated(rows, total, limit, offset)


def get_district(db, district_id):
    """Get a single district by ROWID."""
    try:
        row_id = int(district_id)
    except ValueError:
        return bad_request("Invalid district ID")

    result = db.get_by_id(TABLE, row_id)
    if not result:
        return not_found(f"District with ID {row_id} not found")

    return success(_extract(result))


def create_district(request, db):
    """Create a new district."""
    data = request.get_json(silent=True)
    if not data:
        return bad_request("Request body must be valid JSON")

    errors = validate_district(data)
    if errors:
        return bad_request("Validation failed", details=errors)

    row = {
        "Name": data["Name"],
        "Code": data["Code"],
        "Population": int(data["Population"]),
    }
    if data.get("Latitude") is not None:
        row["Latitude"] = float(data["Latitude"])
    if data.get("Longitude") is not None:
        row["Longitude"] = float(data["Longitude"])

    result = db.insert(TABLE, row)
    return created(result, message="District created")


def _extract(row):
    """Extract district fields from a ZCQL result row."""
    if isinstance(row, dict) and TABLE in row:
        return row[TABLE]
    return row
