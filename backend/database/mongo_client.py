"""
MongoDB Integration & Database Optimization Layer
Production-ready PyMongo database layer with JSON schema validation, compound indexing,
aggregation pipelines, and fallback in-memory store.
"""

from __future__ import annotations

from datetime import datetime, timezone
import threading
import logging
from config import settings
from database.schemas import COLLECTION_VALIDATORS, INDEXES

log = logging.getLogger(__name__)

MONGO_URI = settings.MONGO_URI
MONGO_DB = settings.MONGO_DB

# In-memory fallback storage with indexed lookup maps for O(1) performance
_mem_lock = threading.Lock()
_mem: dict[str, list] = {
    "users":             [],
    "sensor_data":       [],
    "anomalies":         [],
    "ai_recommendations":[],
    "reports":           [],
    "token_blacklist":   [],
}
_mem_users_index: dict[str, dict] = {}
_mem_reports_index: dict[str, dict] = {}
_mem_blacklist_set: set[str] = set()

# Connect to MongoDB & Initialize Schema Validators and Indexes
try:
    from pymongo import MongoClient, ASCENDING, DESCENDING
    _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=settings.MONGO_CONNECT_TIMEOUT_MS)
    _client.server_info()
    _db = _client[MONGO_DB]
    MONGO_AVAILABLE = True

    # Apply Collection Schema Validators
    for col_name, validator in COLLECTION_VALIDATORS.items():
        try:
            if col_name not in _db.list_collection_names():
                _db.create_collection(col_name, validator=validator)
            else:
                _db.command("collMod", col_name, validator=validator)
        except Exception as ve:
            log.debug("Schema validator setup note for %s: %s", col_name, ve)

    # Initialize Compound & TTL Indexes
    for col_name, index_list in INDEXES.items():
        for keys, opts in index_list:
            _db[col_name].create_index(keys, **opts)

    log.info("MongoDB connection, schema validation & indexing completed.")
except Exception as e:
    log.warning("MongoDB unavailable (%s). Operating in in-memory fallback mode.", e)
    _db = None
    MONGO_AVAILABLE = False


def _col(name: str):
    return _db[name] if MONGO_AVAILABLE and _db is not None else None


# Token Blacklist Operations for Session Security

def blacklist_token(jti: str, expires_at: datetime) -> None:
    col = _col("token_blacklist")
    if col is not None:
        try:
            col.insert_one({"jti": jti, "expires_at": expires_at})
        except Exception:
            pass
    else:
        with _mem_lock:
            _mem_blacklist_set.add(jti)
            _mem["token_blacklist"].append({"jti": jti, "expires_at": expires_at})


def is_token_blacklisted(jti: str) -> bool:
    if not jti:
        return False
    col = _col("token_blacklist")
    if col is not None:
        return col.find_one({"jti": jti}) is not None
    with _mem_lock:
        return jti in _mem_blacklist_set


# User Account Database Operations

def insert_user(user_doc: dict):
    col = _col("users")
    email = user_doc.get("email", "").lower().strip()
    if col is not None:
        col.insert_one({**user_doc})
    else:
        with _mem_lock:
            _mem["users"].append(user_doc)
            if email:
                _mem_users_index[email] = user_doc


def find_user_by_email(email: str) -> dict | None:
    cleaned = email.lower().strip()
    col = _col("users")
    if col is not None:
        return col.find_one({"email": cleaned}, {"_id": 0})
    with _mem_lock:
        if cleaned in _mem_users_index:
            return _mem_users_index[cleaned]
        for u in _mem["users"]:
            if u.get("email") == cleaned:
                _mem_users_index[cleaned] = u
                return u
    return None


# Telemetry Data Operations

def insert_sensor_reading(reading: dict):
    col = _col("sensor_data")
    if col is not None:
        col.insert_one({**reading})
    else:
        with _mem_lock:
            _mem["sensor_data"].append(reading)
            if len(_mem["sensor_data"]) > 500:
                _mem["sensor_data"].pop(0)


def insert_anomaly(anomaly: dict):
    col = _col("anomalies")
    if col is not None:
        col.insert_one({**anomaly})
    else:
        with _mem_lock:
            _mem["anomalies"].append(anomaly)
            if len(_mem["anomalies"]) > 200:
                _mem["anomalies"].pop(0)


def insert_ai_recommendation(rec: dict):
    col = _col("ai_recommendations")
    if col is not None:
        col.insert_one({**rec})
    else:
        with _mem_lock:
            _mem["ai_recommendations"].append(rec)
            if len(_mem["ai_recommendations"]) > 100:
                _mem["ai_recommendations"].pop(0)


def insert_report(report: dict):
    col = _col("reports")
    report_id = report.get("report_id")
    if col is not None:
        col.insert_one({**report})
    else:
        with _mem_lock:
            _mem["reports"].append(report)
            if report_id:
                _mem_reports_index[report_id] = report
            if len(_mem["reports"]) > 100:
                oldest = _mem["reports"].pop(0)
                old_id = oldest.get("report_id")
                if old_id and old_id in _mem_reports_index and _mem_reports_index[old_id] == oldest:
                    del _mem_reports_index[old_id]


def get_recent_sensor_data(limit: int = 60) -> list[dict]:
    col = _col("sensor_data")
    if col is not None:
        return list(col.find({}, {"_id": 0}).sort("timestamp", DESCENDING).limit(limit))
    with _mem_lock:
        return list(reversed(_mem["sensor_data"][-limit:]))


def get_recent_anomalies(limit: int = 20) -> list[dict]:
    col = _col("anomalies")
    if col is not None:
        return list(col.find({}, {"_id": 0}).sort("timestamp", DESCENDING).limit(limit))
    with _mem_lock:
        return list(reversed(_mem["anomalies"][-limit:]))


def get_recent_reports(limit: int = 10) -> list[dict]:
    col = _col("reports")
    if col is not None:
        return list(col.find({}, {"_id": 0}).sort("timestamp", DESCENDING).limit(limit))
    with _mem_lock:
        return list(reversed(_mem["reports"][-limit:]))


def find_report_by_id(report_id: str) -> dict | None:
    col = _col("reports")
    if col is not None:
        return col.find_one({"report_id": report_id}, {"_id": 0})
    with _mem_lock:
        if report_id in _mem_reports_index:
            return _mem_reports_index[report_id]
        for r in _mem["reports"]:
            if r.get("report_id") == report_id:
                _mem_reports_index[report_id] = r
                return r
    return None


def get_paginated_reports(
    page: int = 1,
    limit: int = 10,
    severity: str | None = None,
    search_query: str = ""
) -> dict:
    col = _col("reports")
    query: dict = {}
    if severity and severity != "All":
        query["severity"] = severity
    if search_query:
        query["$or"] = [
            {"report_id": {"$regex": search_query, "$options": "i"}},
            {"anomaly_type": {"$regex": search_query, "$options": "i"}},
            {"ai_analysis": {"$regex": search_query, "$options": "i"}},
        ]

    skip = (page - 1) * limit

    if col is not None:
        total = col.count_documents(query)
        reports = list(col.find(query, {"_id": 0}).sort("timestamp", DESCENDING).skip(skip).limit(limit))
    else:
        with _mem_lock:
            filtered = list(_mem["reports"])
            if severity and severity != "All":
                filtered = [r for r in filtered if r.get("severity") == severity]
            if search_query:
                sq = search_query.lower()
                filtered = [
                    r for r in filtered
                    if sq in str(r.get("report_id", "")).lower()
                    or sq in str(r.get("severity", "")).lower()
                    or sq in str(r.get("anomaly_type", "")).lower()
                    or sq in str(r.get("ai_analysis", "")).lower()
                ]
            filtered = list(reversed(filtered))
            total = len(filtered)
            reports = filtered[skip : skip + limit]

    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    return {
        "items": reports,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": max(1, total_pages),
        },
    }


# Aggregation Pipeline Optimization for Alert Analytics using $facet
def get_alert_counts() -> dict:
    col = _col("anomalies")
    if col is not None:
        pipeline = [
            {
                "$facet": {
                    "critical": [
                        {"$match": {"severity": "Critical"}},
                        {"$count": "count"},
                    ],
                    "warning": [
                        {"$match": {"severity": "Warning"}},
                        {"$count": "count"},
                    ],
                }
            }
        ]
        results = list(col.aggregate(pipeline))
        counts = {"critical": 0, "warning": 0}
        if results and len(results) > 0:
            facet = results[0]
            if facet.get("critical"):
                counts["critical"] = facet["critical"][0]["count"]
            if facet.get("warning"):
                counts["warning"] = facet["warning"][0]["count"]
        return counts
    else:
        with _mem_lock:
            critical = sum(1 for a in _mem["anomalies"] if a.get("severity") == "Critical")
            warning  = sum(1 for a in _mem["anomalies"] if a.get("severity") == "Warning")
            return {"critical": critical, "warning": warning}


