"""
MongoDB Collection Schemas & Production Validation Schemas
===========================================================
Defines MongoDB $jsonSchema validators and compound index definitions for enterprise production.
"""

from __future__ import annotations

# Production MongoDB $jsonSchema Collection Validators
COLLECTION_VALIDATORS = {
    "users": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["email", "password_hash", "role"],
            "properties": {
                "email": {"bsonType": "string", "pattern": r"^[^@]+@[^@]+\.[^@]+$"},
                "password_hash": {"bsonType": "string"},
                "role": {"enum": ["Admin", "Engineer", "Operator", "Auditor"]},
            },
        }
    },
    "sensor_data": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["timestamp", "temperature", "pressure", "flow_rate", "vibration"],
            "properties": {
                "timestamp": {"bsonType": "string"},
                "temperature": {"bsonType": ["double", "int"]},
                "pressure": {"bsonType": ["double", "int"]},
                "flow_rate": {"bsonType": ["double", "int"]},
                "vibration": {"bsonType": ["double", "int"]},
            },
        }
    },
    "anomalies": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["timestamp", "is_anomaly", "severity"],
            "properties": {
                "timestamp": {"bsonType": "string"},
                "is_anomaly": {"bsonType": "bool"},
                "severity": {"enum": ["Normal", "Warning", "Critical"]},
                "anomaly_type": {"bsonType": "string"},
                "anomaly_score": {"bsonType": ["double", "int"]},
            },
        }
    },
    "reports": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["report_id", "timestamp", "severity"],
            "properties": {
                "report_id": {"bsonType": "string"},
                "timestamp": {"bsonType": "string"},
                "severity": {"enum": ["Normal", "Warning", "Critical"]},
                "health_score": {"bsonType": "int"},
            },
        }
    },
    "token_blacklist": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["jti", "expires_at"],
            "properties": {
                "jti": {"bsonType": "string"},
                "expires_at": {"bsonType": "date"},
            },
        }
    },
}

INDEXES = {
    "users": [([("email", 1)], {"unique": True})],
    "sensor_data": [([("timestamp", -1)], {})],
    "anomalies": [([("severity", 1), ("timestamp", -1)], {}), ([("timestamp", -1)], {})],
    "reports": [([("report_id", 1)], {"unique": True}), ([("timestamp", -1), ("severity", 1)], {})],
    "ai_recommendations": [([("timestamp", -1)], {})],
    "token_blacklist": [([("expires_at", 1)], {"expireAfterSeconds": 0}), ([("jti", 1)], {"unique": True})],
}

