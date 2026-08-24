from __future__ import annotations

import os
import sys
from pathlib import Path

# Ensure backend directory and root directory are both in Python path
BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent

for p in [str(BACKEND_DIR), str(ROOT_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from flask import Flask, make_response, send_from_directory
from flask_cors import CORS
from backend.config import settings

try:
    from backend.routes.api import api_bp
except ImportError:
    from routes.api import api_bp


def create_app() -> Flask:
    app = Flask(__name__, static_folder=None)
    
    # Configure CORS dynamically from settings
    cors_origins = [origin.strip() for origin in settings.CORS_ORIGIN.split(",") if origin.strip()]
    if "*" in cors_origins or not cors_origins:
        CORS(app, resources={r"/*": {"origins": "*"}})
    else:
        CORS(app, resources={r"/*": {"origins": cors_origins}})

    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(api_bp, name="api_legacy", url_prefix="")

    frontend_dir = ROOT_DIR / "frontend" / "dist" if (ROOT_DIR / "frontend" / "dist" / "index.html").exists() else ROOT_DIR / "frontend"

    @app.get("/")
    def index() -> object:
        if (frontend_dir / "index.html").exists():
            return send_from_directory(frontend_dir, "index.html")
        return {"status": "online", "service": "Virtual Plant Operator Backend API", "version": "2.4.0"}

    @app.get("/css/<path:filename>")
    def styles(filename: str) -> object:
        target_dir = frontend_dir / "css" if (frontend_dir / "css").exists() else frontend_dir / "assets"
        if target_dir.exists() and (target_dir / filename).exists():
            resp = make_response(send_from_directory(target_dir, filename))
            resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
            return resp
        return jsonify({"error": "File not found"}), 404

    @app.get("/js/<path:filename>")
    def scripts(filename: str) -> object:
        target_dir = frontend_dir / "js" if (frontend_dir / "js").exists() else frontend_dir / "assets"
        if target_dir.exists() and (target_dir / filename).exists():
            resp = make_response(send_from_directory(target_dir, filename))
            resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
            return resp
        return jsonify({"error": "File not found"}), 404

    @app.get("/assets/<path:filename>")
    def assets(filename: str) -> object:
        if (frontend_dir / "assets").exists():
            return send_from_directory(frontend_dir / "assets", filename)
        return jsonify({"error": "Asset not found"}), 404

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    print(f"[VPO Backend] Server running on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
