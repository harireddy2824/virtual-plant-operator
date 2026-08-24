"""
Structured Request Logging & Correlation ID Middleware
"""

from __future__ import annotations

import logging
import time
import uuid
from flask import Flask, request, g

log = logging.getLogger("api.request")


def register_logging_middleware(app: Flask) -> None:
    @app.before_request
    def before_request():
        g.start_time = time.time()
        req_id = request.headers.get("X-Request-ID") or request.headers.get("X-Correlation-ID") or str(uuid.uuid4())[:8]
        g.request_id = req_id

    @app.after_request
    def after_request(response):
        duration = (time.time() - getattr(g, "start_time", time.time())) * 1000
        request_id = getattr(g, "request_id", "unknown")
        client_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1").split(",")[0].strip()
        
        log.info(
            "[%s] IP:%s %s %s -> status %d (%.2f ms)",
            request_id,
            client_ip,
            request.method,
            request.path,
            response.status_code,
            duration,
        )
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Correlation-ID"] = request_id
        response.headers["X-Response-Time"] = f"{duration:.2f}ms"
        return response

