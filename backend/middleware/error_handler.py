"""
Centralized Error Handling Middleware
Defines custom operational exception classes and global Flask error handlers.
"""

from __future__ import annotations

import logging
from flask import Flask, jsonify, g
from werkzeug.exceptions import HTTPException
from backend.models.schemas import ApiResponse

log = logging.getLogger(__name__)


class AppError(Exception):
    def __init__(self, message: str, status_code: int = 500, data: any = None, error_code: str = "APP_ERROR") -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.data = data
        self.error_code = error_code


class ValidationError(AppError):
    def __init__(self, message: str = "Invalid request parameters", data: any = None) -> None:
        super().__init__(message=message, status_code=400, data=data, error_code="VALIDATION_ERROR")


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Authentication required", data: any = None) -> None:
        super().__init__(message=message, status_code=401, data=data, error_code="UNAUTHORIZED")


class ForbiddenError(AppError):
    def __init__(self, message: str = "Access forbidden", data: any = None) -> None:
        super().__init__(message=message, status_code=403, data=data, error_code="FORBIDDEN")


class NotFoundError(AppError):
    def __init__(self, message: str = "Requested resource not found") -> None:
        super().__init__(message=message, status_code=404, error_code="NOT_FOUND")


class ConflictError(AppError):
    def __init__(self, message: str = "Resource conflict occurred", data: any = None) -> None:
        super().__init__(message=message, status_code=409, data=data, error_code="CONFLICT")


class UnprocessableEntityError(AppError):
    def __init__(self, message: str = "Unprocessable entity payload", data: any = None) -> None:
        super().__init__(message=message, status_code=422, data=data, error_code="UNPROCESSABLE_ENTITY")


class RateLimitError(AppError):
    def __init__(self, message: str = "Rate limit exceeded", data: any = None) -> None:
        super().__init__(message=message, status_code=429, data=data, error_code="RATE_LIMIT_EXCEEDED")


class DatabaseError(AppError):
    def __init__(self, message: str = "Database operation failure") -> None:
        super().__init__(message=message, status_code=500, error_code="DATABASE_ERROR")


class ServiceUnavailableError(AppError):
    def __init__(self, message: str = "Upstream service unavailable") -> None:
        super().__init__(message=message, status_code=503, error_code="SERVICE_UNAVAILABLE")


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(AppError)
    def handle_app_error(error: AppError):
        request_id = getattr(g, "request_id", None)
        log.warning("AppError [%s %d]: %s", error.error_code, error.status_code, error.message)
        meta = {"error_code": error.error_code}
        if request_id:
            meta["request_id"] = request_id
        response = ApiResponse(success=False, message=error.message, data=error.data, meta=meta)
        return jsonify(response.to_dict()), error.status_code

    @app.errorhandler(HTTPException)
    def handle_http_exception(error: HTTPException):
        request_id = getattr(g, "request_id", None)
        log.warning("HTTPException [%d]: %s", error.code, error.description)
        meta = {"error_code": f"HTTP_{error.code}"}
        if request_id:
            meta["request_id"] = request_id
        response = ApiResponse(success=False, message=error.description or "HTTP Exception", data=None, meta=meta)
        return jsonify(response.to_dict()), error.code or 500

    @app.errorhandler(Exception)
    def handle_server_error(error: Exception):
        request_id = getattr(g, "request_id", None)
        log.error("Unhandled Exception [%s]: %s", request_id or "N/A", error, exc_info=True)
        meta = {"error_code": "INTERNAL_SERVER_ERROR"}
        if request_id:
            meta["request_id"] = request_id
        response = ApiResponse(success=False, message="Internal server error occurred", data=None, meta=meta)
        return jsonify(response.to_dict()), 500

