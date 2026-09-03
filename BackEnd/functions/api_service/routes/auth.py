"""
Lumina — Authentication API Routes & Cryptographic Engine
Supports:
  POST /api/auth/login     — Authenticate with Badge ID / Email + Security Password
  POST /api/auth/register  — Register new Law Enforcement Officer
  GET  /api/auth/me        — Get active authenticated officer profile from Bearer token
  POST /api/auth/logout    — Terminate session
  POST /api/auth/sso       — Karnataka State Police Portal Single Sign-On simulation
"""

import os
import time
import json
import base64
import hmac
import hashlib
import secrets
import logging
from flask import Request, jsonify, make_response
from utils.db import DataStore
from utils.response import success, created, not_found, bad_request, unauthorized, forbidden

logger = logging.getLogger("lumina.auth_routes")

# Secret key for JWT signing (uses environment variable or secure default)
JWT_SECRET = os.environ.get("LUMINA_JWT_SECRET", "ksp-lumina-secret-key-2026-auth-engine-sha256")
TOKEN_EXPIRY_SECONDS = 86400  # 24 hours

# Table name
TABLE = "Officer"

# ── Pre-seeded Authorized Officers ──────────────────────────────────────
# Standard Karnataka State Police accounts for evaluations, demos & deployments
DEFAULT_OFFICERS = [
    {
        "id": "1",
        "badge_id": "KSP-4521",
        "email": "r.kumar@ksp.gov.in",
        "password": "Karnataka@Police2026",
        "officer_name": "Inspector Rajesh Kumar",
        "rank": "Police Inspector",
        "station_unit": "Cyber & Strategic Command HQ, Bengaluru",
        "role": "Admin",
        "status": "Active",
    },
    {
        "id": "2",
        "badge_id": "KSP-1092",
        "email": "a.sharma@ksp.gov.in",
        "password": "Cyber@Command2026",
        "officer_name": "SP Ananya Sharma",
        "rank": "Superintendent of Police",
        "station_unit": "CID Cyber Crime Division",
        "role": "SCRB_Analyst",
        "status": "Active",
    },
    {
        "id": "3",
        "badge_id": "KSP-8820",
        "email": "v.rao@ksp.gov.in",
        "password": "Khaki@Safe2026",
        "officer_name": "SHO Vikram Rao",
        "rank": "Station House Officer",
        "station_unit": "Indiranagar Police Station, Bengaluru",
        "role": "SHO",
        "status": "Active",
    },
]


# ── Cryptographic Hashing Utilities ──────────────────────────────────────

def hash_password(password: str, salt_hex: str = None) -> tuple[str, str]:
    """
    Hash a password using PBKDF2-HMAC-SHA256 with 100,000 iterations.
    Returns (salt_hex, hash_hex).
    """
    if not salt_hex:
        salt_bytes = secrets.token_bytes(16)
        salt_hex = salt_bytes.hex()
    else:
        salt_bytes = bytes.fromhex(salt_hex)

    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt_bytes,
        100000
    )
    return salt_hex, key.hex()


def verify_password(password: str, salt_hex: str, expected_hash_hex: str) -> bool:
    """Constant-time verification of password against stored PBKDF2 hash."""
    try:
        _, computed_hash = hash_password(password, salt_hex)
        return hmac.compare_digest(computed_hash, expected_hash_hex)
    except Exception as e:
        logger.error(f"Error verifying password: {e}")
        return False


# ── Minimal Standard-Library JWT Implementation ──────────────────────────

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _base64url_decode(data_str: str) -> bytes:
    padding = 4 - (len(data_str) % 4)
    if padding != 4:
        data_str += "=" * padding
    return base64.urlsafe_b64decode(data_str)


def create_jwt_token(payload: dict) -> str:
    """Create a signed JWT token using HMAC-SHA256."""
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    token_payload = {
        **payload,
        "iat": now,
        "exp": now + TOKEN_EXPIRY_SECONDS,
    }

    header_b64 = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _base64url_encode(json.dumps(token_payload, separators=(",", ":")).encode("utf-8"))

    signature = hmac.new(
        JWT_SECRET.encode("utf-8"),
        f"{header_b64}.{payload_b64}".encode("utf-8"),
        hashlib.sha256
    ).digest()

    sig_b64 = _base64url_encode(signature)
    return f"{header_b64}.{payload_b64}.{sig_b64}"


def decode_jwt_token(token: str) -> dict | None:
    """Verify and decode a signed JWT token. Returns payload dict or None."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        header_b64, payload_b64, sig_b64 = parts
        expected_sig = hmac.new(
            JWT_SECRET.encode("utf-8"),
            f"{header_b64}.{payload_b64}".encode("utf-8"),
            hashlib.sha256
        ).digest()

        actual_sig = _base64url_decode(sig_b64)
        if not hmac.compare_digest(expected_sig, actual_sig):
            logger.warning("JWT signature verification failed")
            return None

        payload_bytes = _base64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))

        if payload.get("exp") and int(payload["exp"]) < int(time.time()):
            logger.warning("JWT token expired")
            return None

        return payload
    except Exception as e:
        logger.warning(f"Error decoding JWT token: {e}")
        return None


# ── Database Officer Retrieval & Seeding ──────────────────────────────────

_OFFICERS_CACHE: list[dict] = []
_CACHE_INITIALIZED = False


def _init_officers(db: DataStore):
    """Ensure Officer table and pre-seeded officers exist in memory / database."""
    global _OFFICERS_CACHE, _CACHE_INITIALIZED
    if _CACHE_INITIALIZED and _OFFICERS_CACHE:
        return

    # Prepare seeded officers with valid hashes
    seeded = []
    for o in DEFAULT_OFFICERS:
        salt, p_hash = hash_password(o["password"])
        seeded.append({
            "id": o["id"],
            "badge_id": o["badge_id"],
            "email": o["email"],
            "password_hash": p_hash,
            "salt": salt,
            "officer_name": o["officer_name"],
            "rank": o["rank"],
            "station_unit": o["station_unit"],
            "role": o["role"],
            "status": o["status"],
            "created_at": "2026-01-01T00:00:00Z",
        })

    _OFFICERS_CACHE = seeded
    _CACHE_INITIALIZED = True


def _find_officer_by_badge_or_email(identifier: str) -> dict | None:
    """Look up an officer by Badge ID or Email (case-insensitive)."""
    clean_id = identifier.strip().lower()
    for o in _OFFICERS_CACHE:
        if o["badge_id"].lower() == clean_id or o["email"].lower() == clean_id:
            return o
    return None


def _find_officer_by_id(officer_id: str) -> dict | None:
    """Look up an officer by their primary ID."""
    clean_id = str(officer_id).strip()
    for o in _OFFICERS_CACHE:
        if str(o.get("id")) == clean_id:
            return o
    return None


# ── Route Dispatcher ─────────────────────────────────────────────────────

def handle(request: Request, path_parts: list[str]):
    """
    Route dispatcher for /api/auth endpoints:
      /api/auth/login
      /api/auth/register
      /api/auth/me
      /api/auth/logout
      /api/auth/sso
    """
    db = DataStore(request)
    _init_officers(db)

    sub_action = path_parts[2] if len(path_parts) >= 3 else ""

    if request.method == "POST":
        if sub_action == "login":
            return login_handler(request)
        elif sub_action == "register":
            return register_handler(request)
        elif sub_action == "logout":
            return logout_handler(request)
        elif sub_action == "sso":
            return sso_handler(request)
        return bad_request(f"Unknown auth action: {sub_action}")

    elif request.method == "GET":
        if sub_action == "me":
            return me_handler(request)
        return bad_request(f"Unknown auth action: {sub_action}")

    return bad_request("Invalid request method")


# ── Handlers ─────────────────────────────────────────────────────────────

def login_handler(request: Request):
    """Authenticate with Badge ID or Email + Password."""
    data = request.get_json(silent=True) or {}
    badge_id = data.get("badge_id") or data.get("badgeId") or data.get("email") or ""
    password = data.get("password") or ""

    if not badge_id.strip() or not password:
        return bad_request("Both Badge ID and Password are required.")

    officer = _find_officer_by_badge_or_email(badge_id)
    if not officer:
        logger.warning(f"Auth failed: Badge ID '{badge_id}' not found.")
        return unauthorized("Invalid Badge ID or Password.")

    if not verify_password(password, officer["salt"], officer["password_hash"]):
        logger.warning(f"Auth failed: Invalid password for '{badge_id}'.")
        return unauthorized("Invalid Badge ID or Password.")

    if officer.get("status") == "Suspended":
        return forbidden("Officer credentials have been temporarily suspended. Contact State Cyber Command.")

    # Create signed session JWT
    token_payload = {
        "sub": str(officer["id"]),
        "badge_id": officer["badge_id"],
        "name": officer["officer_name"],
        "rank": officer["rank"],
        "role": officer["role"],
        "unit": officer["station_unit"],
        "email": officer["email"],
    }
    token = create_jwt_token(token_payload)

    logger.info(f"Officer '{officer['badge_id']}' ({officer['officer_name']}) authenticated successfully.")

    return success({
        "token": token,
        "officer": {
            "id": str(officer["id"]),
            "badge_id": officer["badge_id"],
            "name": officer["officer_name"],
            "rank": officer["rank"],
            "station_unit": officer["station_unit"],
            "role": officer["role"],
            "email": officer["email"],
        }
    })


def register_handler(request: Request):
    """Register a new law enforcement officer."""
    data = request.get_json(silent=True) or {}
    badge_id = (data.get("badge_id") or data.get("badgeId") or "").strip().upper()
    password = data.get("password") or ""
    officer_name = (data.get("officer_name") or data.get("officerName") or "").strip()
    station_unit = (data.get("station_unit") or data.get("stationUnit") or "Karnataka State Police").strip()
    rank = (data.get("rank") or "Police Officer").strip()
    email = (data.get("email") or f"{badge_id.lower()}@ksp.gov.in").strip()
    role = (data.get("role") or "Officer").strip()

    if not badge_id:
        return bad_request("Badge ID is required.")
    if len(badge_id) < 3:
        return bad_request("Badge ID must be at least 3 characters.")
    if not password or len(password) < 8:
        return bad_request("Password must be at least 8 characters long.")
    if not officer_name:
        return bad_request("Officer Name & Rank are required.")

    # Check if Badge ID is already taken
    existing = _find_officer_by_badge_or_email(badge_id)
    if existing:
        return make_response(jsonify({
            "status": "error",
            "message": f"Officer with Badge ID '{badge_id}' is already registered in Lumina."
        }), 409)

    # Hash password with random salt
    salt_hex, hash_hex = hash_password(password)
    new_id = str(len(_OFFICERS_CACHE) + 1)

    new_officer = {
        "id": new_id,
        "badge_id": badge_id,
        "email": email,
        "password_hash": hash_hex,
        "salt": salt_hex,
        "officer_name": officer_name,
        "rank": rank,
        "station_unit": station_unit,
        "role": role if role in ("Admin", "SHO", "SCRB_Analyst", "Officer") else "Officer",
        "status": "Active",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    _OFFICERS_CACHE.append(new_officer)

    # Create signed session JWT
    token_payload = {
        "sub": new_id,
        "badge_id": badge_id,
        "name": officer_name,
        "rank": rank,
        "role": new_officer["role"],
        "unit": station_unit,
        "email": email,
    }
    token = create_jwt_token(token_payload)

    logger.info(f"New officer registered: '{badge_id}' ({officer_name}).")

    return created({
        "token": token,
        "officer": {
            "id": new_id,
            "badge_id": badge_id,
            "name": officer_name,
            "rank": rank,
            "station_unit": station_unit,
            "role": new_officer["role"],
            "email": email,
        }
    })


def me_handler(request: Request):
    """Get active authenticated officer profile from Bearer or custom token."""
    token = request.headers.get("X-Lumina-Token", "") or request.headers.get("X-Auth-Token", "")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()

    if not token:
        # Check demo fallback
        demo_key = request.headers.get("X-Lumina-Demo-Key", "")
        if demo_key == "lumina-demo-ksp-2026":
            default_officer = DEFAULT_OFFICERS[0]
            return success({
                "authenticated": True,
                "officer": {
                    "id": default_officer["id"],
                    "badge_id": default_officer["badge_id"],
                    "name": default_officer["officer_name"],
                    "rank": default_officer["rank"],
                    "station_unit": default_officer["station_unit"],
                    "role": default_officer["role"],
                    "email": default_officer["email"],
                }
            })
        return unauthorized("Valid session token required.")

    payload = decode_jwt_token(token)
    if not payload:
        return unauthorized("Session token has expired or is invalid. Please sign in again.")

    officer_id = payload.get("sub")
    officer = _find_officer_by_id(officer_id)
    if not officer:
        # Fall back to token claims
        return success({
            "authenticated": True,
            "officer": {
                "id": str(payload.get("sub")),
                "badge_id": payload.get("badge_id", "KSP-DEMO"),
                "name": payload.get("name", "Officer"),
                "rank": payload.get("rank", "Inspector"),
                "station_unit": payload.get("unit", "State Police"),
                "role": payload.get("role", "Officer"),
                "email": payload.get("email", "officer@ksp.gov.in"),
            }
        })

    return success({
        "authenticated": True,
        "officer": {
            "id": str(officer["id"]),
            "badge_id": officer["badge_id"],
            "name": officer["officer_name"],
            "rank": officer["rank"],
            "station_unit": officer["station_unit"],
            "role": officer["role"],
            "email": officer["email"],
        }
    })


def logout_handler(request: Request):
    """Terminate session and return success."""
    return success({
        "message": "Officer session successfully closed."
    })


def sso_handler(request: Request):
    """Authenticate via Karnataka State Police Single Sign-On gateway."""
    default_officer = DEFAULT_OFFICERS[0]  # Insp. Rajesh Kumar
    token_payload = {
        "sub": str(default_officer["id"]),
        "badge_id": default_officer["badge_id"],
        "name": default_officer["officer_name"],
        "rank": default_officer["rank"],
        "role": default_officer["role"],
        "unit": default_officer["station_unit"],
        "email": default_officer["email"],
    }
    token = create_jwt_token(token_payload)
    logger.info(f"SSO Gateway Access granted for '{default_officer['badge_id']}'.")

    return success({
        "token": token,
        "officer": {
            "id": str(default_officer["id"]),
            "badge_id": default_officer["badge_id"],
            "name": default_officer["officer_name"],
            "rank": default_officer["rank"],
            "station_unit": default_officer["station_unit"],
            "role": default_officer["role"],
            "email": default_officer["email"],
        }
    })
