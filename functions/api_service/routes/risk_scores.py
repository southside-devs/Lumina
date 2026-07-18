"""
Lumina — Risk Scores API Routes
GET  /api/risk-scores       — List risk scores (filterable by district, crime type)
GET  /api/risk-scores/<id>  — Get risk score by ID
POST /api/risk-scores       — Create/update a risk score
"""

from utils.db import DataStore
from utils.response import success, created, not_found, bad_request, paginated
from utils.validators import validate_risk_score

TABLE = "Risk_Score"


def handle(request, path_parts):
    """Route dispatcher for /api/risk-scores endpoints."""
    db = DataStore(request)

    if request.method == "GET":
        if len(path_parts) == 2:
            return list_risk_scores(request, db)
        elif len(path_parts) == 3:
            return get_risk_score(db, path_parts[2])

    elif request.method == "POST":
        if len(path_parts) == 2:
            return create_risk_score(request, db)

    return bad_request("Invalid endpoint or method")


def list_risk_scores(request, db):
    """List risk scores with optional filters."""
    limit = int(request.args.get("limit", 100))
    offset = int(request.args.get("offset", 0))
    district_id = request.args.get("district_id")
    crime_type = request.args.get("crime_type")

    conditions = []
    if district_id:
        conditions.append(f"District_ID = {int(district_id)}")
    if crime_type:
        conditions.append(f"Crime_Type = '{crime_type}'")

    where = " AND ".join(conditions) if conditions else ""
    where_sql = f"WHERE {where}" if where else ""

    query = (
        f"SELECT * FROM {TABLE} {where_sql} "
        f"ORDER BY Score DESC LIMIT {limit} OFFSET {offset}"
    )
    results = db.execute_query(query)

    count_query = f"SELECT COUNT(ROWID) FROM {TABLE} {where_sql}"
    total = _extract_count(db.execute_query(count_query))

    rows = [_extract(r) for r in results]
    return paginated(rows, total, limit, offset)


def get_risk_score(db, score_id):
    """Get a single risk score by ROWID."""
    try:
        row_id = int(score_id)
    except ValueError:
        return bad_request("Invalid risk score ID")

    result = db.get_by_id(TABLE, row_id)
    if not result:
        return not_found(f"Risk score with ID {row_id} not found")

    return success(_extract(result))


def create_risk_score(request, db):
    """Create a new risk score entry."""
    data = request.get_json(silent=True)
    if not data:
        return bad_request("Request body must be valid JSON")

    errors = validate_risk_score(data)
    if errors:
        return bad_request("Validation failed", details=errors)

    row = {
        "District_ID": int(data["District_ID"]),
        "Crime_Type": data["Crime_Type"],
        "Score": float(data["Score"]),
        "Forecast_Date": data["Forecast_Date"],
    }

    result = db.insert(TABLE, row)
    return created(result, message="Risk score created")


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
