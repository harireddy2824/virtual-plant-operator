"""
Plant Simulator — SimPy discrete-event process simulation.

Industrial processes modelled:
  - ProductionCycle   : continuous production with configurable throughput
  - HeaterProcess     : temperature management with PID-like control
  - PumpProcess       : flow and vibration with wear accumulation
  - ValveProcess      : pressure regulation with stiction faults
  - MaintenanceProcess: scheduled preventive maintenance that resets wear
  - FailureProcess    : random equipment failures that inject anomalies

The SimPy environment runs in a background thread.  An external caller
(plant_service.py) calls generate_sensor_reading() which snapshots the
current SimPy state — identical interface to the previous NumPy simulator.

Normal operating ranges (unchanged):
  Temperature : 60 – 80 °C   (anomaly > 90)
  Pressure    : 40 – 60 bar  (anomaly > 70)
  Flow Rate   : 60 – 90 L/min(anomaly < 50)
  Vibration   : 0.1 – 0.5 g  (anomaly > 0.8)
  Power       : 45 – 65 kW   (informational)
"""

from __future__ import annotations

import logging
import threading
import time
from datetime import datetime, timezone
from typing import Any

import numpy as np
import simpy

log = logging.getLogger(__name__)

# ── Physical constants ────────────────────────────────────────────────────────
SIMPY_TICK_SECONDS: float = 0.5   # real-time seconds per SimPy time unit
ANOMALY_PROBABILITY: float = 0.06 # per-tick spontaneous anomaly probability

NORMAL_RANGES = {
    "temperature": (60.0, 80.0),
    "pressure":    (40.0, 60.0),
    "flow_rate":   (60.0, 90.0),
    "vibration":   (0.1,  0.5),
    "power":       (45.0, 65.0),
}


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


# ── Shared plant state ────────────────────────────────────────────────────────

class PlantState:
    """
    Thread-safe container for the current sensor snapshot produced by
    the SimPy processes.  generate_sensor_reading() reads from here.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.temperature: float = 70.0
        self.pressure:    float = 50.0
        self.flow_rate:   float = 75.0
        self.vibration:   float = 0.3
        self.power:       float = 55.0
        # Equipment wear (0 = new, 1 = failed)
        self.pump_wear:   float = 0.0
        self.heater_wear: float = 0.0
        # Forced anomaly flag set by external inject_anomaly call
        self._inject_flag: bool = False
        self._inject_sensor: str | None = None

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            return {
                "timestamp":   datetime.now(timezone.utc).isoformat(),
                "temperature": round(self.temperature, 2),
                "pressure":    round(self.pressure, 2),
                "flow_rate":   round(self.flow_rate, 2),
                "vibration":   round(self.vibration, 4),
                "power":       round(self.power, 2),
            }

    def inject_anomaly(self, sensor: str | None = None) -> None:
        with self._lock:
            self._inject_flag = True
            self._inject_sensor = sensor

    def consume_inject(self) -> tuple[bool, str | None]:
        with self._lock:
            flag, sensor = self._inject_flag, self._inject_sensor
            self._inject_flag  = False
            self._inject_sensor = None
            return flag, sensor


# ── SimPy processes ───────────────────────────────────────────────────────────

def heater_process(env: simpy.Environment, state: PlantState, rng: np.random.Generator) -> Any:
    """
    Models the heater that maintains process temperature.
    Wear accumulates slowly; high wear causes temperature drift upward.
    """
    while True:
        with threading.Lock():
            target = 70.0
            # Wear causes setpoint creep
            target += state.heater_wear * 18.0
            noise   = rng.normal(0, 0.5)
            # Mean-reversion toward target with noise
            state.temperature = _clamp(
                state.temperature + (target - state.temperature) * 0.10 + noise,
                20.0, 120.0,
            )
            # Slow wear accumulation
            state.heater_wear = _clamp(state.heater_wear + rng.uniform(0.0002, 0.0005), 0.0, 1.0)
        yield env.timeout(1)


def pump_process(env: simpy.Environment, state: PlantState, rng: np.random.Generator) -> Any:
    """
    Models the pump driving flow rate and vibration.
    Wear increases vibration and reduces flow.
    """
    while True:
        with threading.Lock():
            wear = state.pump_wear
            # Nominal flow target reduced by wear
            flow_target = 75.0 - wear * 35.0
            state.flow_rate = _clamp(
                state.flow_rate + (flow_target - state.flow_rate) * 0.10 + rng.normal(0, 0.8),
                0.0, 120.0,
            )
            # Vibration increases with wear
            vib_target = 0.3 + wear * 0.9
            state.vibration = _clamp(
                state.vibration + (vib_target - state.vibration) * 0.10 + rng.normal(0, 0.02),
                0.0, 2.0,
            )
            state.pump_wear = _clamp(state.pump_wear + rng.uniform(0.0001, 0.0004), 0.0, 1.0)
        yield env.timeout(1)


def valve_process(env: simpy.Environment, state: PlantState, rng: np.random.Generator) -> Any:
    """
    Models pressure regulation through the control valve.
    Stiction faults are modelled as random pressure spikes.
    """
    stiction_active = False
    stiction_ttl    = 0

    while True:
        with threading.Lock():
            if stiction_active:
                # Stiction: pressure climbs
                state.pressure = _clamp(state.pressure + rng.uniform(0.5, 1.2), 10.0, 100.0)
                stiction_ttl  -= 1
                if stiction_ttl <= 0:
                    stiction_active = False
            else:
                state.pressure = _clamp(
                    state.pressure + (50.0 - state.pressure) * 0.08 + rng.normal(0, 0.6),
                    10.0, 100.0,
                )
                # 2 % chance of stiction each tick
                if rng.random() < 0.02:
                    stiction_active = True
                    stiction_ttl    = int(rng.integers(3, 8))

        yield env.timeout(1)


def power_process(env: simpy.Environment, state: PlantState, rng: np.random.Generator) -> Any:
    """
    Models electrical power consumption (correlated with flow and temperature).
    """
    while True:
        with threading.Lock():
            target = 50.0 + (state.flow_rate - 75.0) * 0.15 + (state.temperature - 70.0) * 0.10
            state.power = _clamp(
                state.power + (target - state.power) * 0.12 + rng.normal(0, 0.4),
                10.0, 120.0,
            )
        yield env.timeout(1)


def maintenance_process(env: simpy.Environment, state: PlantState, rng: np.random.Generator) -> Any:
    """
    Scheduled preventive maintenance every ~200 ticks.
    Resets pump and heater wear, reducing vibration and temperature drift.
    """
    while True:
        interval = int(rng.integers(180, 220))
        yield env.timeout(interval)
        with threading.Lock():
            log.info("[SimPy] Preventive maintenance — resetting equipment wear.")
            state.pump_wear   = max(0.0, state.pump_wear   - 0.7)
            state.heater_wear = max(0.0, state.heater_wear - 0.7)
        yield env.timeout(5)   # maintenance downtime


def failure_process(env: simpy.Environment, state: PlantState, rng: np.random.Generator) -> Any:
    """
    Random equipment failure events that push sensors outside safe limits.
    Each failure resolves on its own after a short duration.
    """
    while True:
        # Mean time between failures: ~120 ticks
        mttf = int(rng.exponential(120))
        yield env.timeout(max(10, mttf))

        sensor = rng.choice(["temperature", "pressure", "flow_rate", "vibration"])
        log.info("[SimPy] Spontaneous failure on %s", sensor)

        with threading.Lock():
            if sensor == "temperature":
                state.temperature = float(rng.uniform(91, 108))
            elif sensor == "pressure":
                state.pressure = float(rng.uniform(71, 88))
            elif sensor == "flow_rate":
                state.flow_rate = float(rng.uniform(15, 49))
            else:
                state.vibration = float(rng.uniform(0.85, 1.5))

        # Failure lasts 3–8 ticks then recovery begins
        yield env.timeout(int(rng.integers(3, 8)))


def inject_process(env: simpy.Environment, state: PlantState, rng: np.random.Generator) -> Any:
    """
    Polls for externally requested anomaly injections (from the API).
    """
    while True:
        flag, sensor = state.consume_inject()
        if flag:
            chosen = sensor or str(rng.choice(["temperature", "pressure", "flow_rate", "vibration"]))
            log.info("[SimPy] External anomaly injection on %s", chosen)
            with threading.Lock():
                if chosen == "temperature":
                    state.temperature = float(rng.uniform(92, 110))
                elif chosen == "pressure":
                    state.pressure = float(rng.uniform(72, 90))
                elif chosen == "flow_rate":
                    state.flow_rate = float(rng.uniform(12, 48))
                else:
                    state.vibration = float(rng.uniform(0.82, 1.5))
        yield env.timeout(1)


# ── SimPy runtime ─────────────────────────────────────────────────────────────

class PlantSimulation:
    """
    Runs a SimPy Environment in a background thread.
    The environment ticks continuously; the Flask thread reads state on demand.
    """

    def __init__(self) -> None:
        self.state  = PlantState()
        self._rng   = np.random.default_rng()
        self._env   = simpy.Environment()
        self._thread: threading.Thread | None = None
        self._running = False
        self._register_processes()

    def _register_processes(self) -> None:
        env, state, rng = self._env, self.state, self._rng
        env.process(heater_process(env, state, rng))
        env.process(pump_process(env, state, rng))
        env.process(valve_process(env, state, rng))
        env.process(power_process(env, state, rng))
        env.process(maintenance_process(env, state, rng))
        env.process(failure_process(env, state, rng))
        env.process(inject_process(env, state, rng))

    def _run_loop(self) -> None:
        log.info("[SimPy] Simulation thread started.")
        while self._running:
            self._env.step()
            time.sleep(SIMPY_TICK_SECONDS)
        log.info("[SimPy] Simulation thread stopped.")

    def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._thread  = threading.Thread(target=self._run_loop, daemon=True, name="simpy-plant")
        self._thread.start()

    def stop(self) -> None:
        self._running = False

    def get_reading(self, inject_anomaly: bool = False) -> dict[str, Any]:
        if inject_anomaly:
            self.state.inject_anomaly()
        return self.state.snapshot()

    @property
    def simpy_time(self) -> float:
        return float(self._env.now)


# ── Module-level singleton ────────────────────────────────────────────────────

_simulation = PlantSimulation()
_simulation.start()


# ── Public API (drop-in replacement for the old NumPy functions) ─────────────

def generate_sensor_reading(inject_anomaly: bool = False) -> dict[str, Any]:
    """
    Return one sensor snapshot from the running SimPy simulation.
    Drop-in replacement for the previous NumPy implementation.
    """
    return _simulation.get_reading(inject_anomaly=inject_anomaly)


def generate_normal_dataset(n: int = 500) -> list[dict[str, Any]]:
    """
    Generate n clean (no anomaly) sensor readings for model training.
    Uses NumPy directly so training does not need the SimPy thread running.
    """
    rng = np.random.default_rng(42)
    return [
        {
            "temperature": round(float(rng.normal(70, 4)),    2),
            "pressure":    round(float(rng.normal(50, 5)),    2),
            "flow_rate":   round(float(rng.normal(75, 6)),    2),
            "vibration":   round(float(rng.normal(0.3, 0.08)), 4),
        }
        for _ in range(n)
    ]


def get_simulation_info() -> dict[str, Any]:
    """Return metadata about the running SimPy simulation."""
    return {
        "engine":      "SimPy 4.x discrete-event simulation",
        "simpy_time":  _simulation.simpy_time,
        "pump_wear":   round(_simulation.state.pump_wear, 4),
        "heater_wear": round(_simulation.state.heater_wear, 4),
        "running":     _simulation._running,
        "processes":   ["heater", "pump", "valve", "power", "maintenance", "failure", "inject"],
    }
