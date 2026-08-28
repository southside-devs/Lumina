"""
Lumina — Standalone Local API Server
Wraps the Catalyst Advanced I/O function in a standard Flask application for local execution.
Automatically loads environment variables from .env files.
"""

import os
import sys
from flask import Flask, request

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def load_env_files():
    """Load key-value pairs from .env files into os.environ if present."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    env_paths = [
        os.path.join(base_dir, ".env"),
        os.path.join(base_dir, "BackEnd", ".env"),
        os.path.join(base_dir, "FrontEnd", ".env"),
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
                            if k and not os.environ.get(k):
                                os.environ[k] = v
            except Exception as e:
                print(f"Note reading {p}: {e}")


load_env_files()

from main import handler

app = Flask(__name__)


@app.route("/", defaults={"path": ""}, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
@app.route("/<path:path>", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
def catch_all(path):
    return handler(request)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    print(f"Lumina Backend API Server starting on http://127.0.0.1:{port}")
    print("Serving live database from synthetic datasets (ZCQL / SQLite Dual Engine)")
    app.run(host="0.0.0.0", port=port, debug=False)
