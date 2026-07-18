"""
Lumina — Case-Accused API Routes (Junction Table)
GET    /api/case-accused       — List links (filterable by FIR or Accused)
GET    /api/case-accused/<id>  — Get link by ID
POST   /api/case-accused       — Create a new FIR-Accused link
DELETE /api/case-accused/<id>  — Remove a link
"""

from utils.db import DataStore
from utils.response import success, created, not_found, bad_request, paginated, no_content
from utils.validators import validate_case_accused
from utils.auth import ROLES, check_roles, check_any_authenticated

TABLE = "Case_Accused"


def handle(request, path_parts):
    """Route dispatcher for /api/case-accused endpoints."""
    db = DataStore(request)

    if request.method == "GET":
        auth_error = check_any_authenticated(request)
        if auth_error:
            return auth_error
        if len(path_parts) == 2:
            return list_links(request, db)
        elif len(path_parts) == 3:
            return get_link(db, path_parts[2])

    elif request.method == "POST":
        auth_error = check_roles(request, ROLES.OFFICER, ROLES.SHO, ROLES.ADMIN)
        if auth_error:
            return auth_error
        if len(path_parts) == 2:
            return create_link(request, db)

    elif request.method == "DELETE":
        # Only SHO and Admin can unlink an accused from a case
        auth_error = check_roles(request, ROLES.SHO, ROLES.ADMIN)
        if auth_error:
            return auth_error
        if len(path_parts) == 3:
            return delete_link(db, path_parts[2])

    return bad_request("Invalid endpoint or method")


def list_links(request, db):
    """List case-accused links with optional filters."""
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))
    fir_id = request.args.get("fir_id")
    accused_id = request.args.get("accused_id")

    conditions = []
    if fir_id:
        conditions.append(f"FIR_ID = {int(fir_id)}")
    if accused_id:
        conditions.append(f"Accused_ID = {int(accused_id)}")

    where = " AND ".join(conditions) if conditions else ""
    where_sql = f"WHERE {where}" if where else ""

    query = (
        f"SELECT * FROM {TABLE} {where_sql} "
        f"ORDER BY ROWID ASC LIMIT {limit} OFFSET {offset}"
    )
    results = db.execute_query(query)

    count_query = f"SELECT COUNT(ROWID) FROM {TABLE} {where_sql}"
    total = _extract_count(db.execute_query(count_query))

    rows = [_extract(r) for r in results]
    return paginated(rows, total, limit, offset)


def get_link(db, link_id):
    """Get a single case-accused link by ROWID."""
    try:
        row_id = int(link_id)
    except ValueError:
        return bad_request("Invalid link ID")

    result = db.get_by_id(TABLE, row_id)
    if not result:
        return not_found(f"Case-Accused link with ID {row_id} not found")

    return success(_extract(result))


def create_link(request, db):
    """Create a new FIR-Accused link."""
    data = request.get_json(silent=True)
    if not data:
        return bad_request("Request body must be valid JSON")

    errors = validate_case_accused(data)
    if errors:
        return bad_request("Validation failed", details=errors)

    row = {
        "FIR_ID": int(data["FIR_ID"]),
        "Accused_ID": int(data["Accused_ID"]),
        "Involvement_Type": data.get("Involvement_Type", "Primary"),
    }

    result = db.insert(TABLE, row)
    return created(result, message="Case-Accused link created")


def delete_link(db, link_id):
    """Delete a case-accused link."""
    try:
        row_id = int(link_id)
    except ValueError:
        return bad_request("Invalid link ID")

    existing = db.get_by_id(TABLE, row_id)
    if not existing:
        return not_found(f"Case-Accused link with ID {row_id} not found")

    db.delete(TABLE, row_id)
    return no_content(message="Case-Accused link deleted")


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
