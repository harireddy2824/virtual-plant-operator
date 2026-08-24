"""
Anomaly Detector — PyTorch Autoencoder trained on normal operating data.

Architecture:
  Encoder: 4 → 8 → 4 → 2
  Decoder: 2 → 4 → 8 → 4

Anomaly detection is based on reconstruction error.
A reading is anomalous when its MSE exceeds the threshold
learned from the normal training distribution.

Rule-based severity override is kept to guarantee sensor violations
are always flagged even when the model uncertainty is high.
"""

from __future__ import annotations

import logging
import os
from typing import Any

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

log = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "autoencoder.pth")

FEATURES = ["temperature", "pressure", "flow_rate", "vibration"]

# Normalisation constants — computed from nominal operating ranges
# so the model always receives inputs in roughly [0, 1]
FEAT_MIN = np.array([20.0,  10.0,  0.0,  0.0],  dtype=np.float32)
FEAT_MAX = np.array([120.0, 100.0, 120.0, 2.0],  dtype=np.float32)

# Rule-based severity thresholds (unchanged from original)
CRITICAL_RULES: dict[str, float] = {
    "temperature": 95.0,
    "pressure":    75.0,
    "vibration":   1.0,
    "flow_rate":   30.0,
}
WARNING_RULES: dict[str, float] = {
    "temperature": 90.0,
    "pressure":    70.0,
    "vibration":   0.8,
    "flow_rate":   50.0,
}


# ── Model definition ──────────────────────────────────────────────────────────

class SensorAutoencoder(nn.Module):
    """Shallow autoencoder for 4-dimensional sensor vectors."""

    def __init__(self) -> None:
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(4, 8),
            nn.ReLU(),
            nn.Linear(8, 4),
            nn.ReLU(),
            nn.Linear(4, 2),
        )
        self.decoder = nn.Sequential(
            nn.Linear(2, 4),
            nn.ReLU(),
            nn.Linear(4, 8),
            nn.ReLU(),
            nn.Linear(8, 4),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:  # type: ignore[override]
        return self.decoder(self.encoder(x))


# ── Helpers ───────────────────────────────────────────────────────────────────

def _normalise(arr: np.ndarray) -> np.ndarray:
    """Min-max normalise to [0, 1] using fixed sensor ranges."""
    return (arr - FEAT_MIN) / (FEAT_MAX - FEAT_MIN + 1e-8)


def _to_tensor(readings: list[dict[str, Any]]) -> torch.Tensor:
    arr = np.array([[r[f] for f in FEATURES] for r in readings], dtype=np.float32)
    return torch.from_numpy(_normalise(arr))


def _severity(reading: dict[str, Any]) -> str:
    t, p, v, fr = (
        reading["temperature"],
        reading["pressure"],
        reading["vibration"],
        reading["flow_rate"],
    )
    if (
        t  > CRITICAL_RULES["temperature"]
        or p  > CRITICAL_RULES["pressure"]
        or v  > CRITICAL_RULES["vibration"]
        or fr < CRITICAL_RULES["flow_rate"]
    ):
        return "Critical"
    if (
        t  > WARNING_RULES["temperature"]
        or p  > WARNING_RULES["pressure"]
        or v  > WARNING_RULES["vibration"]
        or fr < WARNING_RULES["flow_rate"]
    ):
        return "Warning"
    return "Normal"


def _anomaly_type(reading: dict[str, Any]) -> str:
    if reading.get("temperature", 0) > WARNING_RULES["temperature"]:
        return "Temperature Anomaly"
    if reading.get("pressure", 0) > WARNING_RULES["pressure"]:
        return "Pressure Anomaly"
    if reading.get("flow_rate", 100) < WARNING_RULES["flow_rate"]:
        return "Flow Anomaly"
    if reading.get("vibration", 0) > WARNING_RULES["vibration"]:
        return "Vibration Anomaly"
    return "General Anomaly"


# ── Detector class ────────────────────────────────────────────────────────────

class AnomalyDetector:
    """
    PyTorch Autoencoder-based anomaly detector.

    Public interface is identical to the previous Isolation Forest detector
    so no changes are required in plant_service.py or any other caller.
    """

    def __init__(self) -> None:
        self.model = SensorAutoencoder()
        self.threshold: float = 0.05   # MSE threshold; updated after training
        self._load_or_train()

    # ── Model lifecycle ───────────────────────────────────────────────────────

    def _load_or_train(self) -> None:
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        if os.path.exists(MODEL_PATH):
            try:
                checkpoint = torch.load(MODEL_PATH, weights_only=True)
                self.model.load_state_dict(checkpoint["model_state"])
                self.threshold = float(checkpoint["threshold"])
                self.model.eval()
                log.info("Autoencoder loaded from %s  threshold=%.6f", MODEL_PATH, self.threshold)
                return
            except Exception as exc:
                log.warning("Failed to load autoencoder (%s) — retraining.", exc)
        self.train()

    def train(self, n_samples: int = 1200, epochs: int = 60) -> None:
        """Train on synthetic normal data and persist the model."""
        from simulation.plant_simulator import generate_normal_dataset

        log.info("Training PyTorch Autoencoder on %d normal samples…", n_samples)
        data    = generate_normal_dataset(n_samples)
        tensor  = _to_tensor(data)
        dataset = TensorDataset(tensor)
        loader  = DataLoader(dataset, batch_size=64, shuffle=True)

        optimiser = torch.optim.Adam(self.model.parameters(), lr=1e-3)
        criterion = nn.MSELoss()
        self.model.train()

        for epoch in range(epochs):
            total_loss = 0.0
            for (batch,) in loader:
                optimiser.zero_grad()
                reconstructed = self.model(batch)
                loss = criterion(reconstructed, batch)
                loss.backward()
                optimiser.step()
                total_loss += loss.item()
            if (epoch + 1) % 20 == 0:
                log.info("  epoch %d/%d  loss=%.6f", epoch + 1, epochs, total_loss / len(loader))

        # Compute reconstruction errors on training data to set threshold
        self.model.eval()
        with torch.no_grad():
            recon   = self.model(tensor)
            errors  = torch.mean((recon - tensor) ** 2, dim=1).numpy()

        # Threshold = mean + 3 × std — captures 99.7 % of normal variance
        self.threshold = float(np.mean(errors) + 3.0 * np.std(errors))
        log.info("Training complete — threshold=%.6f", self.threshold)

        torch.save(
            {"model_state": self.model.state_dict(), "threshold": self.threshold},
            MODEL_PATH,
        )

    # ── Inference ─────────────────────────────────────────────────────────────

    def predict(self, reading: dict[str, Any]) -> dict[str, Any]:
        """
        Enrich a sensor reading with anomaly detection results.

        Returns the original dict plus:
          anomaly_score       float  reconstruction MSE (higher = more anomalous)
          anomaly_probability float  0–1 normalised score
          is_anomaly          bool
          severity            Normal | Warning | Critical
          anomaly_type        str
          model               str   "pytorch_autoencoder"
        """
        arr    = np.array([[reading[f] for f in FEATURES]], dtype=np.float32)
        tensor = torch.from_numpy(_normalise(arr))

        self.model.eval()
        with torch.no_grad():
            recon = self.model(tensor)
            mse   = float(torch.mean((recon - tensor) ** 2).item())

        # Normalised probability: how far above the threshold is this reading?
        probability = float(min(1.0, mse / (self.threshold + 1e-8)))

        is_anomaly   = mse > self.threshold
        rule_sev     = _severity(reading)

        # Rule-based override: always flag physical threshold violations
        if rule_sev != "Normal":
            is_anomaly = True

        severity = rule_sev if is_anomaly else "Normal"

        return {
            **reading,
            "anomaly_score":       round(mse, 6),
            "anomaly_probability": round(probability, 4),
            "is_anomaly":          is_anomaly,
            "severity":            severity,
            "anomaly_type":        _anomaly_type(reading) if is_anomaly else "Normal",
            "model":               "pytorch_autoencoder",
        }
