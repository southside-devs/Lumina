"""
Lumina — Production Email Dispatcher
Supports:
  1. Standard SMTP (Gmail, Zoho Mail, Brevo, SendGrid, AWS SES, or custom corporate SMTP)
  2. Zoho Catalyst Mail SDK (if executed within Catalyst with mail component enabled)
  3. Formatted Law Enforcement HTML & Plaintext Email Templates
"""

import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger("lumina.mailer")


def _load_env_fallback():
    """Ensure environment variables are loaded if running in local context."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
    env_paths = [
        os.path.join(base_dir, ".env"),
        os.path.join(base_dir, "BackEnd", ".env"),
    ]
    for p in env_paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k, v = k.strip(), v.strip().strip("'\"")
                            if k and k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass


_load_env_fallback()


def send_password_reset_email(to_email: str, officer_name: str, badge_id: str, pin: str) -> tuple[bool, str]:
    """
    Sends a high-security single-use 6-digit cryptographic recovery PIN to the officer.
    
    Returns:
        tuple[bool, str]: (Success boolean, Status or Error explanation)
    """
    if not to_email or "@" not in to_email:
        logger.warning(f"Invalid recipient email provided: '{to_email}'")
        return False, "Invalid recipient email format."

    subject = f"[KSP LUMINA] Security Verification PIN: {pin}"

    # Plain text version for non-HTML email clients
    plain_body = f"""KARNATAKA STATE POLICE — LUMINA COMMAND CENTER
OFFICIAL SECURITY ADVISORY: KEY ROTATION PIN

Officer: {officer_name} ({badge_id})
Destination: {to_email}

Your 6-digit cryptographic verification PIN is:
----------------------------------------
                {pin}
----------------------------------------

SECURITY NOTICE:
- This single-use verification PIN will expire automatically in 10 minutes.
- If you did not initiate this security key rotation, someone may be attempting to access your terminal.
  Please alert the KSP Cyber Command Security Operations Center (SOC) immediately.

Karnataka State Police · Cyber & Strategic Intelligence Division
Bangalore Headquarters, Karnataka, India
"""

    # Responsive HTML template with official law enforcement aesthetics
    html_body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KSP Lumina Verification PIN</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #050609;
      color: #e4e4e7;
      margin: 0;
      padding: 24px;
    }}
    .container {{
      max-width: 540px;
      margin: 0 auto;
      background: #0d0f17;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0,0,0,0.8);
    }}
    .header {{
      background: linear-gradient(135deg, #090a10 0%, #111422 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding: 28px 32px;
      text-align: center;
    }}
    .badge-title {{
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.25em;
      color: #3b82f6;
      text-transform: uppercase;
      margin-bottom: 6px;
    }}
    .main-title {{
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #ffffff;
      margin: 0;
    }}
    .content {{
      padding: 32px;
    }}
    .greeting {{
      font-size: 14px;
      line-height: 1.6;
      color: #a1a1aa;
      margin-bottom: 24px;
    }}
    .greeting strong {{
      color: #ffffff;
    }}
    .pin-box {{
      background: #06070a;
      border: 1px solid #3b82f6;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 28px 0;
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.15);
    }}
    .pin-label {{
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: #93c5fd;
      margin-bottom: 8px;
    }}
    .pin-code {{
      font-family: 'SF Mono', Consolas, Menlo, Monaco, monospace;
      font-size: 38px;
      font-weight: 900;
      letter-spacing: 0.35em;
      color: #ffffff;
      padding-left: 0.35em;
      margin: 0;
      text-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
    }}
    .expiry {{
      margin-top: 8px;
      font-size: 11px;
      color: #ef4444;
      font-weight: 600;
    }}
    .security-notice {{
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 10px;
      padding: 16px;
      font-size: 12px;
      line-height: 1.5;
      color: #fca5a5;
      margin-top: 24px;
    }}
    .security-notice strong {{
      color: #fee2e2;
    }}
    .footer {{
      background: #08090e;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding: 20px 32px;
      font-size: 11px;
      color: #71717a;
      text-align: center;
      line-height: 1.5;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge-title">Karnataka State Police</div>
      <h1 class="main-title">LUMINA COMMAND CENTER</h1>
    </div>
    <div class="content">
      <p class="greeting">
        Officer <strong>{officer_name}</strong> (Badge <strong>{badge_id}</strong>),<br><br>
        A request has been submitted to rotate the security access key for your Lumina account.
        Use the single-use cryptographic PIN below to verify your identity:
      </p>

      <div class="pin-box">
        <div class="pin-label">Single-Use Verification PIN</div>
        <div class="pin-code">{pin}</div>
        <div class="expiry">Valid for 10 minutes only</div>
      </div>

      <div class="security-notice">
        <strong>SECURITY WARNING:</strong> Never disclose this PIN to anyone. Karnataka State Police cyber administrators will never solicit your verification code. If you did not request this key rotation, your credentials may be compromised.
      </div>
    </div>
    <div class="footer">
      Lumina Strategic Intelligence Platform · Karnataka State Police<br>
      This is an automated state law enforcement dispatch. Do not reply directly to this transmission.
    </div>
  </div>
</body>
</html>
"""

    # ── 1. Attempt Zoho Catalyst Mail SDK (if running within Catalyst) ─────────
    try:
        import zcatalyst_sdk
        app = zcatalyst_sdk.get_app()
        mail_service = app.email()
        from_addr = os.environ.get("SMTP_FROM_EMAIL", "no-reply@ksp.gov.in")
        mail_config = {
            "from_email": from_addr,
            "to_email": [to_email],
            "subject": subject,
            "content": html_body,
        }
        mail_service.send_mail(mail_config)
        logger.info(f"Email successfully dispatched to '{to_email}' via Catalyst Mail SDK.")
        return True, "Dispatched via Catalyst Mail SDK"
    except Exception as catalyst_err:
        logger.debug(f"Catalyst Mail SDK unavailable or not configured ({catalyst_err}). Falling back to SMTP.")

    # ── 2. Standard SMTP Dispatch ─────────────────────────────────────────────
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_user = os.environ.get("SMTP_USER") or os.environ.get("SMTP_USERNAME")
    smtp_pass = os.environ.get("SMTP_PASSWORD") or os.environ.get("SMTP_PASS")
    from_email = os.environ.get("SMTP_FROM_EMAIL") or smtp_user or "no-reply@ksp.gov.in"
    use_tls = os.environ.get("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")
    use_ssl = os.environ.get("SMTP_USE_SSL", "false").lower() in ("true", "1", "yes") or smtp_port == 465

    if not (smtp_host and smtp_user and smtp_pass):
        warning_msg = (
            f"SMTP is not yet configured in environment variables (SMTP_HOST, SMTP_USER, SMTP_PASSWORD). "
            f"Target recipient: {to_email}. PIN generated: {pin[:2]}**{pin[-2:]}"
        )
        logger.warning(f"[EMAIL NOT DELIVERED] {warning_msg}")
        # Note: Do not return the full PIN or crash; log clearly so admin can configure SMTP in .env
        return False, "SMTP configuration pending in environment variables."

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Karnataka State Police <{from_email}>"
        msg["To"] = to_email

        part1 = MIMEText(plain_body, "plain", "utf-8")
        part2 = MIMEText(html_body, "html", "utf-8")
        msg.attach(part1)
        msg.attach(part2)

        if use_ssl:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
            if use_tls:
                server.starttls()

        server.login(smtp_user, smtp_pass)
        server.sendmail(from_email, [to_email], msg.as_string())
        server.quit()

        logger.info(f"Recovery email successfully sent to '{to_email}' via SMTP ({smtp_host}:{smtp_port}).")
        return True, "Dispatched via SMTP"
    except Exception as e:
        err_str = str(e)
        logger.error(f"Failed to dispatch email to '{to_email}' via SMTP: {err_str}")
        return False, f"SMTP delivery failure: {err_str}"
