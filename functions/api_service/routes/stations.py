"""
Lumina — Police Stations API Routes
GET  /api/stations       — List stations (paginated, filterable by district)
GET  /api/stations/<id>  — Get station by ID
POST /api/stations       — Create a new station
"""

from utils.db import DataStore
from utils.response import success, created, not_found, bad_request, paginated
from utils.validators import validate_station

TABLE = "Police_Station"


def handle(request, path_parts):
    """Route dispatcher for /api/stations endpoints."""
    db = DataStore(request)

    if request.method == "GET":
        if len(path_parts) == 2:
            return list_stations(request, db)
        elif len(path_parts) == 3:
            return get_station(db, path_parts[2])

    elif request.method == "POST":
        if len(path_parts) == 2:
            return create_station(request, db)

    return bad_request("Invalid endpoint or method")


def list_stations(request, db):
    """List police stations with optional district filter."""
    limit = int(request.args.get("limit", 100))
    offset = int(request.args.get("offset", 0))
    district_id = request.args.get("district_id")

    if district_id:
        query = (
            f"SELECT * FROM {TABLE} "
            f"WHERE District_ID = {int(district_id)} "
            f"ORDER BY Name ASC LIMIT {limit} OFFSET {offset}"
        )
        results = db.execute_query(query)
        count_query = (
            f"SELECT COUNT(ROWID) FROM {TABLE} "
            f"WHERE District_ID = {int(district_id)}"
        )
    else:
        results = db.get_all(TABLE, limit=limit, offset=offset, order_by="Name")
        count_query = None

    rows = [_extract(r) for r in results]

    if count_query:
        total_result = db.execute_query(count_query)
        total = _extract_count(total_result)
    else:
        total = db.count(TABLE)

    return paginated(rows, total, limit, offset)


def get_station(db, station_id):
    """Get a single station by ROWID."""
    try:
        row_id = int(station_id)
    except ValueError:
        return bad_request("Invalid station ID")

    result = db.get_by_id(TABLE, row_id)
    if not result:
        return not_found(f"Station with ID {row_id} not found")

    return success(_extract(result))


def create_station(request, db):
    """Create a new police station."""
    data = request.get_json(silent=True)
    if not data:
        return bad_request("Request body must be valid JSON")

    errors = validate_station(data)
    if errors:
        return bad_request("Validation failed", details=errors)

    row = {
        "District_ID": int(data["District_ID"]),
        "Name": data["Name"],
    }
    if data.get("Jurisdiction_Area"):
        row["Jurisdiction_Area"] = data["Jurisdiction_Area"]
    if data.get("Latitude") is not None:
        row["Latitude"] = float(data["Latitude"])
    if data.get("Longitude") is not None:
        row["Longitude"] = float(data["Longitude"])

    result = db.insert(TABLE, row)
    return created(result, message="Police station created")


def _extract(row):
    """Extract station fields from a ZCQL result row."""
    if isinstance(row, dict) and TABLE in row:
        return row[TABLE]
    return row


def _extract_count(result):
    """Extract count value from ZCQL aggregate result."""
    if result:
        first = result[0]
        if isinstance(first, dict):
            for v in first.values():
                if isinstance(v, dict):
                    for val in v.values():
                        return int(val)
                return int(v)
    return 0
