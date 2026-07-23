"""
Lumina — FIR API Routes
GET  /api/firs            — List FIRs (paginated, filterable)
GET  /api/firs/<id>       — Get FIR by ID
GET  /api/firs/search     — Search FIRs by crime type, date range, station
POST /api/firs            — Create a new FIR
PUT  /api/firs/<id>       — Update an existing FIR
"""

from utils.db import DataStore
from utils.response import (
    success, created, not_found, bad_request, paginated, method_not_allowed,
)
from utils.validators import validate_fir
from utils.auth import ROLES, check_roles, check_any_authenticated

TABLE = "FIR"


def handle(request, path_parts):
    """Route dispatcher for /api/firs endpoints."""
    db = DataStore(request)

    if request.method == "GET":
        # Any authenticated user can read FIRs
        auth_error = check_any_authenticated(request)
        if auth_error:
            return auth_error
        if len(path_parts) == 2:
            return list_firs(request, db)
        elif len(path_parts) == 3:
            if path_parts[2] == "search":
                return search_firs(request, db)
            else:
                return get_fir(db, path_parts[2])

    elif request.method == "POST":
        # Officers and above can create FIRs
        auth_error = check_roles(request, ROLES.OFFICER, ROLES.SHO, ROLES.ADMIN)
        if auth_error:
            return auth_error
        if len(path_parts) == 2:
            return create_fir(request, db)

    elif request.method == "PUT":
        # Only SHO and Admin can update FIRs (e.g. change status)
        auth_error = check_roles(request, ROLES.SHO, ROLES.ADMIN)
        if auth_error:
            return auth_error
        if len(path_parts) == 3 and path_parts[2] != "search":
            return update_fir(request, db, path_parts[2])

    return bad_request("Invalid endpoint or method")


def list_firs(request, db):
    """List FIRs with pagination and optional filters."""
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))
    station_id = request.args.get("station_id")
    crime_group = request.args.get("crime_group")
    status = request.args.get("status")

    # Build WHERE clause from filters
    conditions = []
    if station_id:
        conditions.append(f"Station_ID = {int(station_id)}")
    if crime_group:
        conditions.append(f"Crime_Group = '{crime_group}'")
    if status:
        conditions.append(f"Status = '{status}'")

    where = " AND ".join(conditions) if conditions else ""
    where_sql = f"WHERE {where}" if where else ""

    query = (
        f"SELECT * FROM {TABLE} {where_sql} "
        f"ORDER BY Incident_Date DESC LIMIT {limit} OFFSET {offset}"
    )
    results = db.execute_query(query)

    count_query = f"SELECT COUNT(ROWID) FROM {TABLE} {where_sql}"
    total = _extract_count(db.execute_query(count_query))

    rows = [_extract(r) for r in results]
    return paginated(rows, total, limit, offset)


def get_fir(db, fir_id):
    """Get a single FIR by ROWID with related data."""
    try:
        row_id = int(fir_id)
    except ValueError:
        return bad_request("Invalid FIR ID")

    result = db.get_by_id(TABLE, row_id)
    if not result:
        return not_found(f"FIR with ID {row_id} not found")

    fir_data = _extract(result)

    # Fetch related victims
    victims_query = f"SELECT * FROM Victim WHERE FIR_ID = {row_id}"
    victims = db.execute_query(victims_query)
    fir_data["victims"] = [_extract_table(v, "Victim") for v in victims]

    # Fetch related accused via junction table
    accused_query = (
        f"SELECT Case_Accused.Involvement_Type, Accused.* "
        f"FROM Case_Accused "
        f"INNER JOIN Accused ON Case_Accused.Accused_ID = Accused.ROWID "
        f"WHERE Case_Accused.FIR_ID = {row_id}"
    )
    try:
        accused = db.execute_query(accused_query)
        fir_data["accused"] = accused
    except Exception:
        # If JOIN is not supported in ZCQL, fall back to separate queries
        ca_query = f"SELECT * FROM Case_Accused WHERE FIR_ID = {row_id}"
        case_accused = db.execute_query(ca_query)
        fir_data["case_accused"] = [_extract_table(ca, "Case_Accused") for ca in case_accused]

    return success(fir_data)


def search_firs(request, db):
    """
    Search FIRs with advanced filters.
    Query params: crime_group, date_from, date_to, station_id, district_id,
                  lat_min, lat_max, lon_min, lon_max
    """
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))

    conditions = []

    crime_group = request.args.get("crime_group")
    if crime_group:
        conditions.append(f"Crime_Group = '{crime_group}'")

    date_from = request.args.get("date_from")
    if date_from:
        conditions.append(f"Incident_Date >= '{date_from}'")

    date_to = request.args.get("date_to")
    if date_to:
        conditions.append(f"Incident_Date <= '{date_to}'")

    station_id = request.args.get("station_id")
    if station_id:
        conditions.append(f"Station_ID = {int(station_id)}")

    # Bounding box filter for geospatial queries
    lat_min = request.args.get("lat_min")
    lat_max = request.args.get("lat_max")
    lon_min = request.args.get("lon_min")
    lon_max = request.args.get("lon_max")
    if all([lat_min, lat_max, lon_min, lon_max]):
        conditions.append(f"Latitude >= {float(lat_min)}")
        conditions.append(f"Latitude <= {float(lat_max)}")
        conditions.append(f"Longitude >= {float(lon_min)}")
        conditions.append(f"Longitude <= {float(lon_max)}")

    where = " AND ".join(conditions) if conditions else ""
    where_sql = f"WHERE {where}" if where else ""

    query = (
        f"SELECT * FROM {TABLE} {where_sql} "
        f"ORDER BY Incident_Date DESC LIMIT {limit} OFFSET {offset}"
    )
    results = db.execute_query(query)

    count_query = f"SELECT COUNT(ROWID) FROM {TABLE} {where_sql}"
    total = _extract_count(db.execute_query(count_query))

    rows = [_extract(r) for r in results]
    return paginated(rows, total, limit, offset)


def create_fir(request, db):
    """Create a new FIR record."""
    data = request.get_json(silent=True)
    if not data:
        return bad_request("Request body must be valid JSON")

    errors = validate_fir(data)
    if errors:
        return bad_request("Validation failed", details=errors)

    row = {
        "Station_ID": int(data["Station_ID"]),
        "FIR_Number": data["FIR_Number"],
        "Incident_Date": data["Incident_Date"],
        "Crime_Group": data["Crime_Group"],
        "Latitude": float(data["Latitude"]),
        "Longitude": float(data["Longitude"]),
    }
    if data.get("Crime_Subgroup"):
        row["Crime_Subgroup"] = data["Crime_Subgroup"]
    if data.get("Narrative"):
        row["Narrative"] = data["Narrative"]
    if data.get("Status"):
        row["Status"] = data["Status"]
    else:
        row["Status"] = "Under Investigation"

    result = db.insert(TABLE, row)
    return created(result, message="FIR created")


def update_fir(request, db, fir_id):
    """Update an existing FIR record."""
    try:
        row_id = int(fir_id)
    except ValueError:
        return bad_request("Invalid FIR ID")

    existing = db.get_by_id(TABLE, row_id)
    if not existing:
        return not_found(f"FIR with ID {row_id} not found")

    data = request.get_json(silent=True)
    if not data:
        return bad_request("Request body must be valid JSON")

    # Only validate fields that are being updated
    update_fields = {}
    updatable = [
        "Station_ID", "FIR_Number", "Incident_Date", "Crime_Group", "Crime_Subgroup",
        "Latitude", "Longitude", "Narrative", "Status",
    ]
    for field in updatable:
        if field in data:
            update_fields[field] = data[field]

    if not update_fields:
        return bad_request("No valid fields to update")

    # Type conversions
    if "Station_ID" in update_fields:
        update_fields["Station_ID"] = int(update_fields["Station_ID"])
    if "Latitude" in update_fields:
        update_fields["Latitude"] = float(update_fields["Latitude"])
    if "Longitude" in update_fields:
        update_fields["Longitude"] = float(update_fields["Longitude"])

    result = db.update(TABLE, row_id, update_fields)
    return success(result, message="FIR updated")


def _extract(row):
    """Extract FIR fields from a ZCQL result row."""
    if isinstance(row, dict) and TABLE in row:
        return row[TABLE]
    return row


def _extract_table(row, table_name):
    """Extract specific table fields from a ZCQL result row."""
    if isinstance(row, dict) and table_name in row:
        return row[table_name]
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
