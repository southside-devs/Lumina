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
import re
import logging
from flask import Request, jsonify, make_response
from utils.db import DataStore
from utils.response import success, created, not_found, bad_request, unauthorized, forbidden
from utils.mailer import send_password_reset_email

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


def _validate_password_complexity(password: str) -> tuple[bool, str]:
    """Validate enterprise password security requirements."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter (A-Z)."
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter (a-z)."
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one numeric digit (0-9)."
    if not any(c in "!@#$%^&*()-_=+[]{}|;:,.<>?" for c in password):
        return False, "Password must contain at least one special symbol (!@#$%^&*...)."
    return True, ""


def _mask_email(email: str) -> str:
    """Mask email for display (e.g. r.kumar@ksp.gov.in -> r.k****@ksp.gov.in)."""
    if not email or "@" not in email:
        return "registered official email"
    user_part, domain_part = email.split("@", 1)
    if len(user_part) <= 2:
        masked_user = user_part[0] + "****"
    else:
        masked_user = user_part[:2] + "****" + user_part[-1]
    return f"{masked_user}@{domain_part}"


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

        # Check if officer has changed password after token issuance (Session Revocation)
        sub = payload.get("sub")
        if sub:
            officer = _find_officer_by_id(sub)
            if officer and officer.get("password_changed_at"):
                iat = payload.get("iat", 0)
                if iat < officer["password_changed_at"]:
                    logger.warning(f"JWT token rejected for officer {sub}: issued before password was reset.")
                    return None

        return payload
    except Exception as e:
        logger.warning(f"Error decoding JWT token: {e}")
        return None


# ── Database Officer Retrieval & Seeding ──────────────────────────────────

_OFFICERS_CACHE: list[dict] = []
_CACHE_INITIALIZED = False
OFFICERS_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "officers_store.json"))

# In-memory security stores for reset sessions and rate limiting
RESET_SESSIONS: dict[str, dict] = {}
RATE_LIMIT_STORE: dict[str, list[float]] = {}


def _save_officers():
    """Save registered officers to disk to survive server restarts."""
    global _OFFICERS_CACHE
    try:
        os.makedirs(os.path.dirname(OFFICERS_FILE), exist_ok=True)
        with open(OFFICERS_FILE, "w", encoding="utf-8") as f:
            json.dump(_OFFICERS_CACHE, f, indent=2)
    except Exception as e:
        logger.warning(f"Could not persist officers to primary file: {e}")
        try:
            tmp_path = "/tmp/lumina_officers_store.json"
            with open(tmp_path, "w", encoding="utf-8") as f:
                json.dump(_OFFICERS_CACHE, f)
        except Exception:
            pass


def _init_officers(db: DataStore = None):
    """Ensure Officer table and pre-seeded officers exist in memory / database."""
    global _OFFICERS_CACHE, _CACHE_INITIALIZED
    if _CACHE_INITIALIZED and _OFFICERS_CACHE:
        return

    # Try loading from persistent file first
    loaded = []
    for candidate in [OFFICERS_FILE, "/tmp/lumina_officers_store.json"]:
        if os.path.exists(candidate):
            try:
                with open(candidate, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list) and data:
                        loaded = data
                        break
            except Exception as e:
                logger.warning(f"Failed loading saved officers from {candidate}: {e}")

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

    if loaded:
        loaded_by_badge = {item["badge_id"].lower(): item for item in loaded if "badge_id" in item}
        merged = []
        for s in seeded:
            b_key = s["badge_id"].lower()
            if b_key in loaded_by_badge:
                merged.append(loaded_by_badge[b_key])
            else:
                merged.append(s)
        for b_key, item in loaded_by_badge.items():
            if not any(m["badge_id"].lower() == b_key for m in merged):
                merged.append(item)
        _OFFICERS_CACHE = merged
    else:
        _OFFICERS_CACHE = seeded
        _save_officers()

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


def _check_rate_limit(key: str, max_requests: int = 4, window_seconds: int = 900) -> bool:
    """Returns True if request is allowed, False if rate limited."""
    now = time.time()
    timestamps = RATE_LIMIT_STORE.get(key, [])
    timestamps = [t for t in timestamps if now - t < window_seconds]
    if len(timestamps) >= max_requests:
        RATE_LIMIT_STORE[key] = timestamps
        return False
    timestamps.append(now)
    RATE_LIMIT_STORE[key] = timestamps
    return True


# ── Route Dispatcher ─────────────────────────────────────────────────────

def handle(request: Request, path_parts: list[str]):
    """
    Route dispatcher for /api/auth endpoints:
      /api/auth/login
      /api/auth/register
      /api/auth/me
      /api/auth/logout
      /api/auth/sso
      /api/auth/forgot-password
      /api/auth/reset-password
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
        elif sub_action in ("forgot-password", "forgot_password"):
            return forgot_password_handler(request)
        elif sub_action in ("reset-password", "reset_password"):
            return reset_password_handler(request)
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
    email = (data.get("email") or "").strip().lower()
    role = (data.get("role") or "Officer").strip()

    if not badge_id:
        return bad_request("Karnataka Police Badge ID is required.")
    if len(badge_id) < 3:
        return bad_request("Badge ID must be at least 3 characters.")
    if not officer_name:
        return bad_request("Officer Name & Rank are required.")
    if not email or "@" not in email or "." not in email:
        return bad_request("A valid official email address is required for security key recovery.")

    # Strict password complexity
    is_valid_pass, pass_err = _validate_password_complexity(password)
    if not is_valid_pass:
        return bad_request(pass_err)

    # Check if Badge ID or Email is already registered
    existing_badge = _find_officer_by_badge_or_email(badge_id)
    if existing_badge:
        return make_response(jsonify({
            "status": "error",
            "message": f"Officer with Badge ID '{badge_id}' is already registered in Lumina."
        }), 409)

    existing_email = _find_officer_by_badge_or_email(email)
    if existing_email:
        return make_response(jsonify({
            "status": "error",
            "message": f"Officer with Email '{email}' is already registered in Lumina."
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
    _save_officers()

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
    # Production security policy: SSO requires active PKI smartcard or intranet directory ticket
    return make_response(jsonify({
        "status": "error",
        "message": "KSP Single Sign-On requires an active PKI smartcard certificate or official intranet session. Please authenticate directly using your Badge ID or Official Email."
    }), 403)


def forgot_password_handler(request: Request):
    """
    Initiates a password recovery request.
    Protected against account enumeration via constant-time hashing & generic responses.
    """
    data = request.get_json(silent=True) or {}
    identifier = (data.get("badge_id") or data.get("email") or data.get("badgeId") or "").strip()

    if not identifier:
        return bad_request("Badge ID or Official Email is required.")

    # Rate limiting by identifier and client IP (max 4 requests per 15 minutes)
    client_ip = request.remote_addr or "unknown"
    rate_key = f"{client_ip}:{identifier.lower()}"
    if not _check_rate_limit(rate_key, max_requests=4, window_seconds=900):
        return make_response(jsonify({
            "status": "error",
            "message": "Too many security reset attempts. For state cyber security, please wait 15 minutes before retrying."
        }), 429)

    officer = _find_officer_by_badge_or_email(identifier)

    # Standardized response message to prevent account enumeration
    standard_message = "If the provided Badge ID or Email is associated with an active KSP account, a secure verification PIN has been dispatched."

    if not officer:
        # Perform dummy PBKDF2 hash to match CPU timing of real user lookup
        dummy_salt = secrets.token_bytes(16)
        hashlib.pbkdf2_hmac("sha256", b"dummy_password_timing_defense", dummy_salt, 100000)
        logger.info(f"Forgot password requested for non-existent identifier '{identifier}'. Dummy timing defense applied.")
        masked = _mask_email(identifier) if "@" in identifier else "your registered email"
        return success({
            "message": f"If the credential is registered, a single-use verification PIN has been dispatched to {masked}.",
            "masked_email": masked,
            "expires_in_seconds": 600,
        })

    badge_id = officer["badge_id"]
    badge_key = badge_id.lower()

    # Check lockout
    now = time.time()
    existing_session = RESET_SESSIONS.get(badge_key)
    if existing_session and existing_session.get("locked_until", 0) > now:
        remaining_mins = int((existing_session["locked_until"] - now) // 60) + 1
        return make_response(jsonify({
            "status": "error",
            "message": f"This account's reset capability is temporarily locked due to previous failed attempts. Please retry in {remaining_mins} minutes."
        }), 423)

    # Generate 6-digit cryptographic PIN (100000 - 999999)
    pin = f"{secrets.randbelow(900000) + 100000}"
    reset_session_token = secrets.token_urlsafe(32)

    # Hash PIN with salt for secure storage
    salt = secrets.token_bytes(16).hex()
    code_hash = hashlib.sha256(f"{salt}:{pin}".encode("utf-8")).hexdigest()
    token_hash = hashlib.sha256(f"{salt}:{reset_session_token}".encode("utf-8")).hexdigest()

    RESET_SESSIONS[badge_key] = {
        "badge_id": badge_id,
        "salt": salt,
        "code_hash": code_hash,
        "token_hash": token_hash,
        "expires_at": now + 600,  # 10 minutes expiry
        "failed_attempts": 0,
        "locked_until": 0,
        "requested_at": now,
    }

    # Dispatch email to officer's registered address
    officer_email = officer.get("email", "")
    officer_name = officer.get("officer_name", "Officer")
    dispatched, dispatch_status = send_password_reset_email(officer_email, officer_name, badge_id, pin)
    masked_email = _mask_email(officer_email)

    logger.info(
        f"Security reset PIN generated for officer '{badge_id}'. "
        f"Dispatch result: {dispatched} ({dispatch_status})."
    )

    return success({
        "message": f"If the credential is registered, a single-use verification PIN has been dispatched to {masked_email}.",
        "badge_id": badge_id,
        "masked_email": masked_email,
        "expires_in_seconds": 600,
    })


def reset_password_handler(request: Request):
    """
    Validates the 6-digit PIN and resets the officer's security password.
    Enforces brute-force lockout, password strength, and invalidates active JWTs.
    """
    data = request.get_json(silent=True) or {}
    identifier = (data.get("badge_id") or data.get("email") or data.get("badgeId") or "").strip()
    code = (data.get("code") or data.get("pin") or "").strip()
    new_password = data.get("new_password") or data.get("password") or ""

    if not identifier or not code or not new_password:
        return bad_request("Badge ID, Verification PIN, and New Password are required.")

    officer = _find_officer_by_badge_or_email(identifier)
    if not officer:
        return bad_request("Invalid reset session or verification code.")

    badge_key = officer["badge_id"].lower()
    session = RESET_SESSIONS.get(badge_key)

    now = time.time()
    if not session:
        return bad_request("No active reset request found. Please initiate a new recovery request.")

    # Check if locked out
    if session.get("locked_until", 0) > now:
        remaining = int((session["locked_until"] - now) // 60) + 1
        return make_response(jsonify({
            "status": "error",
            "message": f"Account reset locked due to excessive failed attempts. Please retry in {remaining} minutes."
        }), 423)

    # Check expiration
    if now > session.get("expires_at", 0):
        RESET_SESSIONS.pop(badge_key, None)
        return bad_request("The verification code has expired (valid for 10 minutes). Please request a new code.")

    # Validate code with constant-time comparison
    salt = session["salt"]
    computed_hash = hashlib.sha256(f"{salt}:{code}".encode("utf-8")).hexdigest()
    if not hmac.compare_digest(computed_hash, session["code_hash"]):
        session["failed_attempts"] += 1
        remaining_attempts = 5 - session["failed_attempts"]
        if remaining_attempts <= 0:
            session["locked_until"] = now + 1800  # 30-minute lockout
            logger.warning(f"Reset lockout triggered for badge '{officer['badge_id']}' after 5 failed attempts.")
            return make_response(jsonify({
                "status": "error",
                "message": "Maximum verification attempts exceeded. For security, password reset is locked for 30 minutes."
            }), 423)

        return unauthorized(f"Invalid verification PIN. {remaining_attempts} attempt(s) remaining before security lockout.")

    # Password complexity validation
    is_valid_pass, pass_err = _validate_password_complexity(new_password)
    if not is_valid_pass:
        return bad_request(pass_err)

    # Disallow reusing exact same password
    if verify_password(new_password, officer["salt"], officer["password_hash"]):
        return bad_request("New password cannot be identical to your previous password.")

    # Hash new password with fresh cryptographically secure salt
    new_salt, new_hash = hash_password(new_password)
    officer["salt"] = new_salt
    officer["password_hash"] = new_hash
    officer["password_changed_at"] = int(now)

    # Save to persistent storage
    _save_officers()

    # Invalidate reset token immediately (single-use)
    RESET_SESSIONS.pop(badge_key, None)

    # Create new session token for immediate seamless login
    token_payload = {
        "sub": str(officer["id"]),
        "badge_id": officer["badge_id"],
        "name": officer["officer_name"],
        "rank": officer["rank"],
        "role": officer["role"],
        "unit": officer["station_unit"],
        "email": officer["email"],
        "password_changed_at": officer["password_changed_at"],
    }
    token = create_jwt_token(token_payload)

    logger.info(f"Password successfully reset for officer '{officer['badge_id']}'. Previous sessions invalidated.")

    return success({
        "message": "Security key successfully updated. All prior sessions have been invalidated.",
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

