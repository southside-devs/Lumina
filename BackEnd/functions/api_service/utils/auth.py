"""
Lumina — RBAC Middleware
Provides role-based access control for the Catalyst Advanced I/O API service.

Usage:
    from utils.auth import get_current_user, require_roles, ROLES

    # In a route handler:
    def create_fir(request, db):
        user = get_current_user(request)
        if not user:
            return unauthorized()
        if user["role"] not in (ROLES.SHO, ROLES.ADMIN):
            return forbidden()
        ...

    # Or use the decorator helper:
    def handle(request, path_parts):
        auth_error = check_roles(request, ROLES.OFFICER, ROLES.SHO, ROLES.ADMIN)
        if auth_error:
            return auth_error
        ...

Role Hierarchy (highest to lowest):
    Admin > SCRB_Analyst > SHO > Officer
"""

import logging
import zcatalyst_sdk
from flask import jsonify, make_response

logger = logging.getLogger("lumina.auth")

# ── Demo bypass ──────────────────────────────────────────────────────────
# During hackathon demos the frontend sends this key to skip Catalyst auth.
_DEMO_API_KEY = "lumina-demo-ksp-2026"
_DEMO_USER = {
    "user_id":    "demo",
    "email":      "demo@lumina.ksp.gov.in",
    "first_name": "Demo",
    "last_name":  "Inspector",
    "role":       "Admin",
}


# ── Role Constants ───────────────────────────────────────────────────────

class ROLES:
    OFFICER       = "Officer"
    SHO           = "SHO"
    SCRB_ANALYST  = "SCRB_Analyst"
    ADMIN         = "Admin"

    # Convenience groupings
    ALL           = {OFFICER, SHO, SCRB_ANALYST, ADMIN}
    READ_ONLY     = {SCRB_ANALYST, ADMIN}
    WRITE_ACCESS  = {OFFICER, SHO, ADMIN}
    MANAGEMENT    = {SHO, ADMIN}
    ANALYTICS     = {SCRB_ANALYST, SHO, ADMIN}


# ── Catalyst User Extraction ─────────────────────────────────────────────

def get_current_user(request):
    """
    Extract the authenticated user from the Catalyst session.

    Returns a dict with user info:
        {
            "user_id": str,
            "email": str,
            "first_name": str,
            "last_name": str,
            "role": str,          # One of ROLES values, or None if not set
        }

    Returns None if the user is not authenticated.
    """
    # Demo bypass: accept a shared secret header for hackathon demos
    demo_key = request.headers.get("X-Lumina-Demo-Key", "")
    if demo_key == _DEMO_API_KEY:
        return _DEMO_USER

    try:
        try:
            app = zcatalyst_sdk.get_app()
        except Exception:
            app = zcatalyst_sdk.initialize()

        user_management = app.user_management()

        # Get the currently authenticated user from the session
        current_user = user_management.get_current_user()
        if not current_user:
            return None

        # The Catalyst user profile — extract role from user details
        # Role is stored in a custom user property or the user's org role
        user_info = {
            "user_id":    str(current_user.get("user_id", "")),
            "email":      current_user.get("email_id", ""),
            "first_name": current_user.get("first_name", ""),
            "last_name":  current_user.get("last_name", ""),
            "role":       _extract_role(current_user),
        }

        logger.debug(
            f"Authenticated user: {user_info['email']} "
            f"(role={user_info['role']})"
        )
        return user_info

    except Exception as e:
        logger.warning(f"Failed to get current user: {e}")
        return None


def _extract_role(user_data):
    """
    Extract the Lumina role from the Catalyst user profile.

    Catalyst stores custom user properties differently depending on how
    they're set. We check multiple locations for the role field:
      1. `user_details` custom property called 'lumina_role'
      2. `role_details.role_name` from the project org membership
      3. Fall back to None (caller should treat as unauthorized)
    """
    # 1. Check user_details for a custom 'lumina_role' property
    user_details = user_data.get("user_details", {})
    if isinstance(user_details, dict):
        role = user_details.get("lumina_role")
        if role and role in ROLES.ALL:
            return role

    # 2. Check role_details from org membership
    role_details = user_data.get("role_details", {})
    if isinstance(role_details, dict):
        role_name = role_details.get("role_name", "")
        # Map Catalyst org role names to Lumina roles if they match
        if role_name in ROLES.ALL:
            return role_name

    # 3. Check top-level 'role' field (some SDK versions surface it here)
    role = user_data.get("role")
    if role and role in ROLES.ALL:
        return role

    logger.warning(
        f"No Lumina role found for user {user_data.get('email_id')}. "
        f"Assign one of {list(ROLES.ALL)} as 'lumina_role' in Catalyst Auth."
    )
    return None


# ── Response Helpers ─────────────────────────────────────────────────────

def unauthorized(message="Authentication required"):
    """401 Unauthorized response."""
    return make_response(jsonify({
        "status": "error",
        "message": message,
    }), 401)


def forbidden(message="You do not have permission to perform this action"):
    """403 Forbidden response."""
    return make_response(jsonify({
        "status": "error",
        "message": message,
    }), 403)


# ── Role Check Helper ────────────────────────────────────────────────────

def check_roles(request, *allowed_roles):
    """
    Validate the current user's role against a set of allowed roles.

    Usage in a route handler:
        auth_error = check_roles(request, ROLES.SHO, ROLES.ADMIN)
        if auth_error:
            return auth_error
        # ... proceed with handler logic

    Args:
        request: The Catalyst request object.
        *allowed_roles: One or more ROLES constants that are permitted.

    Returns:
        None if the user is authenticated and has an allowed role.
        A Flask error response (401 or 403) otherwise.
    """
    user = get_current_user(request)

    if user is None:
        logger.warning("Unauthenticated request blocked")
        return unauthorized()

    if not allowed_roles:
        # No role restriction — just require authentication
        return None

    if user["role"] not in set(allowed_roles):
        logger.warning(
            f"Forbidden: user={user['email']} role={user['role']} "
            f"attempted action requiring {set(allowed_roles)}"
        )
        return forbidden()

    return None


def check_any_authenticated(request):
    """
    Shorthand: require any authenticated user (any valid role).

    Returns None on success, or an error response.
    """
    return check_roles(request, *ROLES.ALL)
