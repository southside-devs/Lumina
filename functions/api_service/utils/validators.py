"""
Lumina — Input Validators
Validation helpers for API request payloads.
"""

from datetime import datetime


# ── Valid enum values (matching schema.sql constraints) ──────────────────

VALID_GENDERS = {"Male", "Female", "Other"}

VALID_FIR_STATUSES = {
    "Under Investigation", "Chargesheeted", "Closed",
    "Convicted", "Acquitted",
}

VALID_INVOLVEMENT_TYPES = {
    "Primary", "Accomplice", "Abettor", "Conspirator",
}

VALID_SES_LEVELS = {
    "Lower", "Lower-Middle", "Middle", "Upper-Middle", "Upper",
}

VALID_CRIME_GROUPS = {
    "Murder", "Attempt to Murder", "Robbery", "Dacoity", "Theft",
    "Burglary", "Kidnapping & Abduction", "Assault", "Rioting",
    "Cheating & Fraud", "Criminal Breach of Trust", "Counterfeiting",
    "Arson", "Dowry Death", "Cybercrime", "Sexual Offences",
    "Narcotics (NDPS Act)", "Arms Act Violations", "SC/ST Atrocities",
    "Motor Vehicle Theft",
}

# ── Karnataka coordinate bounds ─────────────────────────────────────────

KARNATAKA_LAT_MIN = 11.5
KARNATAKA_LAT_MAX = 18.5
KARNATAKA_LON_MIN = 74.0
KARNATAKA_LON_MAX = 78.5


# ── Validation functions ────────────────────────────────────────────────

def validate_required(data, required_fields):
    """
    Check that all required fields are present and non-empty.

    Args:
        data: Dict of field -> value.
        required_fields: List of required field names.

    Returns:
        List of error strings (empty if valid).
    """
    errors = []
    for field in required_fields:
        if field not in data or data[field] is None or str(data[field]).strip() == "":
            errors.append(f"'{field}' is required")
    return errors


def validate_enum(value, valid_set, field_name):
    """Validate that a value belongs to a set of valid options."""
    if value is not None and value not in valid_set:
        return f"'{field_name}' must be one of: {', '.join(sorted(valid_set))}"
    return None


def validate_coordinate(lat, lon):
    """Validate that coordinates fall within Karnataka's bounding box."""
    errors = []
    if lat is not None:
        try:
            lat = float(lat)
            if not (KARNATAKA_LAT_MIN <= lat <= KARNATAKA_LAT_MAX):
                errors.append(
                    f"Latitude {lat} is outside Karnataka bounds "
                    f"({KARNATAKA_LAT_MIN}-{KARNATAKA_LAT_MAX})"
                )
        except (ValueError, TypeError):
            errors.append("Latitude must be a valid number")

    if lon is not None:
        try:
            lon = float(lon)
            if not (KARNATAKA_LON_MIN <= lon <= KARNATAKA_LON_MAX):
                errors.append(
                    f"Longitude {lon} is outside Karnataka bounds "
                    f"({KARNATAKA_LON_MIN}-{KARNATAKA_LON_MAX})"
                )
        except (ValueError, TypeError):
            errors.append("Longitude must be a valid number")

    return errors


def validate_date(date_str, field_name="date"):
    """Validate date format (YYYY-MM-DD)."""
    if date_str is None:
        return None
    try:
        datetime.strptime(str(date_str), "%Y-%m-%d")
        return None
    except ValueError:
        return f"'{field_name}' must be in YYYY-MM-DD format"


def validate_positive_int(value, field_name):
    """Validate that a value is a positive integer."""
    if value is None:
        return None
    try:
        v = int(value)
        if v < 0:
            return f"'{field_name}' must be a non-negative integer"
        return None
    except (ValueError, TypeError):
        return f"'{field_name}' must be a valid integer"


def validate_score(value, field_name="Score"):
    """Validate that a risk score is between 0 and 100."""
    if value is None:
        return None
    try:
        v = float(value)
        if not (0 <= v <= 100):
            return f"'{field_name}' must be between 0 and 100"
        return None
    except (ValueError, TypeError):
        return f"'{field_name}' must be a valid number"


# ── Composite validators for each table ─────────────────────────────────

def validate_district(data):
    """Validate district creation/update payload."""
    errors = validate_required(data, ["Name", "Code", "Population"])
    err = validate_positive_int(data.get("Population"), "Population")
    if err:
        errors.append(err)
    errors.extend(validate_coordinate(data.get("Latitude"), data.get("Longitude")))
    return errors


def validate_station(data):
    """Validate police station creation payload."""
    errors = validate_required(data, ["District_ID", "Name"])
    err = validate_positive_int(data.get("District_ID"), "District_ID")
    if err:
        errors.append(err)
    errors.extend(validate_coordinate(data.get("Latitude"), data.get("Longitude")))
    return errors


def validate_fir(data):
    """Validate FIR creation/update payload."""
    errors = validate_required(
        data, ["Station_ID", "FIR_Number", "Date", "Crime_Group", "Latitude", "Longitude"]
    )
    err = validate_positive_int(data.get("Station_ID"), "Station_ID")
    if err:
        errors.append(err)
    err = validate_date(data.get("Date"), "Date")
    if err:
        errors.append(err)
    err = validate_enum(data.get("Crime_Group"), VALID_CRIME_GROUPS, "Crime_Group")
    if err:
        errors.append(err)
    err = validate_enum(data.get("Status"), VALID_FIR_STATUSES, "Status")
    if err:
        errors.append(err)
    errors.extend(validate_coordinate(data.get("Latitude"), data.get("Longitude")))
    return errors


def validate_accused(data):
    """Validate accused creation/update payload."""
    errors = validate_required(data, ["Name"])
    err = validate_enum(data.get("Gender"), VALID_GENDERS, "Gender")
    if err:
        errors.append(err)
    err = validate_date(data.get("DOB"), "DOB")
    if err:
        errors.append(err)
    err = validate_positive_int(data.get("Arrest_Count"), "Arrest_Count")
    if err:
        errors.append(err)
    return errors


def validate_victim(data):
    """Validate victim creation payload."""
    errors = validate_required(data, ["FIR_ID", "Name"])
    err = validate_positive_int(data.get("FIR_ID"), "FIR_ID")
    if err:
        errors.append(err)
    err = validate_enum(data.get("Gender"), VALID_GENDERS, "Gender")
    if err:
        errors.append(err)
    err = validate_enum(
        data.get("Socioeconomic_Status"), VALID_SES_LEVELS, "Socioeconomic_Status"
    )
    if err:
        errors.append(err)
    err = validate_date(data.get("DOB"), "DOB")
    if err:
        errors.append(err)
    return errors


def validate_case_accused(data):
    """Validate case-accused link creation payload."""
    errors = validate_required(data, ["FIR_ID", "Accused_ID"])
    err = validate_positive_int(data.get("FIR_ID"), "FIR_ID")
    if err:
        errors.append(err)
    err = validate_positive_int(data.get("Accused_ID"), "Accused_ID")
    if err:
        errors.append(err)
    err = validate_enum(
        data.get("Involvement_Type"), VALID_INVOLVEMENT_TYPES, "Involvement_Type"
    )
    if err:
        errors.append(err)
    return errors


def validate_risk_score(data):
    """Validate risk score creation payload."""
    errors = validate_required(data, ["District_ID", "Crime_Type", "Score", "Forecast_Date"])
    err = validate_positive_int(data.get("District_ID"), "District_ID")
    if err:
        errors.append(err)
    err = validate_enum(data.get("Crime_Type"), VALID_CRIME_GROUPS, "Crime_Type")
    if err:
        errors.append(err)
    err = validate_score(data.get("Score"))
    if err:
        errors.append(err)
    err = validate_date(data.get("Forecast_Date"), "Forecast_Date")
    if err:
        errors.append(err)
    return errors
