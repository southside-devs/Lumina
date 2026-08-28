"""
Lumina — Standalone Local API Server
Wraps the Catalyst Advanced I/O function in a standard Flask application for local execution.
"""

import os
import sys
from flask import Flask, request

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

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
