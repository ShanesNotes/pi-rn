"""Pulse Physiology Engine HTTP shim.

Runs inside the kitware/pulse:4.3.1 Docker container. It exposes a narrow HTTP
surface so the Node/TS harness can drive Pulse without linking against the
engine directly.

Important implementation note:
- The high-level Pulse Python wrapper in this image drags in numpy/pandas at
  runtime and is not dependable in this environment.
- This shim therefore drives the compiled `PulseScenarioDriver` binary instead
  of the Python `PulseEngine` wrapper.
"""

from __future__ import annotations

import csv
import json
import logging
import os
import shutil
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from itertools import count
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger("pulse-shim")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

WORKSPACE_ROOT = Path("/workspace")
PULSE_BIN_ROOT = Path("/pulse/bin")
PULSE_SCENARIO_DRIVER = PULSE_BIN_ROOT / "PulseScenarioDriver"
RUNTIME_ROOT = WORKSPACE_ROOT / "state" / "shim-runtime"


# Single source of truth for the vitals schema and driver request generation.
REQUESTS = [
    {"category": "Physiology", "property": "HeartRate", "unit": "1/min", "key": "hr"},
    {"category": "Physiology", "property": "MeanArterialPressure", "unit": "mmHg", "key": "map"},
    {"category": "Physiology", "property": "SystolicArterialPressure", "unit": "mmHg", "key": "bp_sys"},
    {"category": "Physiology", "property": "DiastolicArterialPressure", "unit": "mmHg", "key": "bp_dia"},
    {"category": "Physiology", "property": "RespirationRate", "unit": "1/min", "key": "rr"},
    {"category": "Physiology", "property": "OxygenSaturation", "unit": None, "key": "spo2_frac"},
    {"category": "Physiology", "property": "CoreTemperature", "unit": "degC", "key": "temp_c"},
    {"category": "Physiology", "property": "CardiacOutput", "unit": "L/min", "key": "cardiac_output_lpm"},
    {"category": "Physiology", "property": "HeartStrokeVolume", "unit": "mL", "key": "stroke_volume_ml"},
    {"category": "Physiology", "property": "EndTidalCarbonDioxidePressure", "unit": "mmHg", "key": "etco2_mmHg"},
    {"category": "Physiology", "property": "ArterialOxygenPressure", "unit": "mmHg", "key": "pao2_mmHg"},
    {"category": "Physiology", "property": "ArterialCarbonDioxidePressure", "unit": "mmHg", "key": "paco2_mmHg"},
    {"category": "Physiology", "property": "UrineProductionRate", "unit": "mL/min", "key": "urine_ml_min"},
    {"category": "Physiology", "property": "BloodPH", "unit": None, "key": "ph"},
    {
        "category": "Substance",
        "substance": "Lactate",
        "property": "BloodConcentration",
        "unit": "mg/dL",
        "key": "lactate_mg_dl",
    },
    {
        "category": "Substance",
        "substance": "Hemoglobin",
        "property": "BloodConcentration",
        "unit": "g/dL",
        "key": "hgb_g_dl",
    },
]

ACTION_FILES = {
    "Saline": PULSE_BIN_ROOT / "substances" / "compounds" / "Saline.json",
    "Norepinephrine": PULSE_BIN_ROOT / "substances" / "Norepinephrine.json",
}


class ShimError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


class ShimState:
    current_state_file: Optional[Path] = None
    current_frame: Optional[dict[str, Any]] = None
    scenario_name: str = ""
    t_sim: float = 0.0
    run_counter = count(1)


state = ShimState()


def _candidate_paths(raw_path: str) -> list[Path]:
    path = Path(raw_path)
    if path.is_absolute():
        return [path]

    rel = Path(str(path).lstrip("./"))
    candidates: list[Path] = [
        Path.cwd() / path,
        WORKSPACE_ROOT / path,
        WORKSPACE_ROOT / rel,
    ]

    if rel.parts:
        head = rel.parts[0]
        tail = Path(*rel.parts[1:]) if len(rel.parts) > 1 else Path()
        if head == "states":
            candidates.append(PULSE_BIN_ROOT / "states" / tail)
            if tail.suffix == ".pbb":
                candidates.append(PULSE_BIN_ROOT / "states" / tail.with_suffix(".json"))
        elif head == "state":
            candidates.append(WORKSPACE_ROOT / "state" / tail)
        elif head == "patients":
            candidates.append(PULSE_BIN_ROOT / "patients" / tail)
        elif head == "nutrition":
            candidates.append(PULSE_BIN_ROOT / "nutrition" / tail)
        elif head == "environments":
            candidates.append(PULSE_BIN_ROOT / "environments" / tail)
        elif head == "substances":
            candidates.append(PULSE_BIN_ROOT / "substances" / tail)

    seen: set[Path] = set()
    unique: list[Path] = []
    for candidate in candidates:
        if candidate in seen:
            continue
        seen.add(candidate)
        unique.append(candidate)
    return unique


def _resolve_existing_path(raw_path: str) -> Path:
    for candidate in _candidate_paths(raw_path):
        if candidate.exists():
            return candidate
    tried = ", ".join(str(p) for p in _candidate_paths(raw_path))
    raise ShimError(404, f"path not found: {raw_path} (tried: {tried})")


def _ensure_runtime_root() -> None:
    RUNTIME_ROOT.mkdir(parents=True, exist_ok=True)


def _purge_runtime_except(keep: set[Path]) -> None:
    if not RUNTIME_ROOT.exists():
        return
    keep_resolved = {p.resolve() for p in keep if p is not None}
    for entry in RUNTIME_ROOT.iterdir():
        if entry.is_dir():
            continue
        if entry.resolve() in keep_resolved:
            continue
        try:
            entry.unlink()
        except OSError as exc:
            logger.warning("could not remove %s: %s", entry, exc)


def _reset_runtime() -> None:
    if not RUNTIME_ROOT.exists():
        return
    for entry in RUNTIME_ROOT.iterdir():
        if entry.is_dir():
            continue
        try:
            entry.unlink()
        except OSError as exc:
            logger.warning("could not remove %s: %s", entry, exc)


def _request_header(spec: dict[str, Any]) -> str:
    if spec["category"] == "Substance":
        header = f"{spec['substance']}-{spec['property']}"
    else:
        header = spec["property"]
    if spec["unit"]:
        header += f"({spec['unit']})"
    return header


HEADER_TO_KEY = {_request_header(spec): spec["key"] for spec in REQUESTS}


def _build_data_request_manager() -> dict[str, Any]:
    data_requests = []
    for spec in REQUESTS:
        entry: dict[str, Any] = {
            "Category": spec["category"],
            "PropertyName": spec["property"],
        }
        if spec["category"] == "Substance":
            entry["SubstanceName"] = spec["substance"]
        if spec["unit"] is not None:
            entry["Unit"] = spec["unit"]
        data_requests.append(entry)
    return {"DataRequest": data_requests}


def _next_run_paths(name: str) -> tuple[Path, Path, Path]:
    _ensure_runtime_root()
    run_id = next(state.run_counter)
    stem = f"{name}-{run_id:04d}"
    scenario_path = RUNTIME_ROOT / f"{stem}.json"
    results_path = RUNTIME_ROOT / f"{stem}Results.csv"
    next_state_path = RUNTIME_ROOT / f"{stem}@state.json"
    return scenario_path, results_path, next_state_path


def _parse_results_csv(results_path: Path) -> dict[str, Any]:
    if not results_path.exists():
        raise ShimError(500, f"results CSV not produced: {results_path}")

    with results_path.open(newline="") as handle:
        rows = list(csv.DictReader(handle))
    if not rows:
        raise ShimError(500, f"results CSV empty: {results_path}")

    last_row = rows[-1]
    frame: dict[str, Any] = {}
    for header, value in last_row.items():
        if header == "Time(s)":
            frame["t"] = float(value)
            continue
        key = HEADER_TO_KEY.get(header)
        if key is None:
            continue
        if value in {"", "-1.$"}:
            continue
        try:
            frame[key] = float(value)
        except ValueError:
            continue

    if "t" not in frame:
        raise ShimError(500, f"results CSV missing time column: {results_path}")

    if "spo2_frac" in frame:
        frame["spo2"] = frame.pop("spo2_frac") * 100.0
    if "lactate_mg_dl" in frame:
        frame["lactate_mmol_l"] = frame.pop("lactate_mg_dl") / 9.008
    if "urine_ml_min" in frame:
        frame["urine_ml_hr"] = frame.pop("urine_ml_min") * 60.0
    return frame


def _driver_action_serialize(next_state_path: Path) -> dict[str, Any]:
    return {
        "SerializeState": {
            "Mode": "Save",
            "Filename": str(next_state_path),
        }
    }


def _run_driver(
    name: str,
    engine_state_file: Path,
    actions: list[dict[str, Any]],
    *,
    require_results: bool = True,
) -> dict[str, Any]:
    scenario_path, results_path, next_state_path = _next_run_paths(name)
    if results_path.exists():
        results_path.unlink()
    if next_state_path.exists():
        next_state_path.unlink()

    payload = {
        "Scenario": {
            "Name": name,
            "Description": f"pi-sim shim driver run: {name}",
            "EngineStateFile": str(engine_state_file),
            "DataRequestManager": _build_data_request_manager(),
            "AnyAction": [*actions, _driver_action_serialize(next_state_path)],
        }
    }
    scenario_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    result = subprocess.run(
        [str(PULSE_SCENARIO_DRIVER), str(scenario_path)],
        cwd=str(PULSE_BIN_ROOT),
        capture_output=True,
        text=True,
    )
    if not next_state_path.exists():
        raise ShimError(500, f"driver did not serialize next state: {next_state_path}")

    if require_results and not results_path.exists():
        raise ShimError(
            500,
            f"PulseScenarioDriver failed ({result.returncode}) and did not produce results\nstdout:\n{result.stdout}\nstderr:\n{result.stderr}",
        )

    frame = _parse_results_csv(results_path) if require_results else None
    _purge_runtime_except({next_state_path})
    return {"frame": frame, "next_state_path": next_state_path, "stdout": result.stdout, "stderr": result.stderr, "returncode": result.returncode}


def _body_as_object(raw: Any) -> dict[str, Any]:
    if raw is None:
        return {}
    if not isinstance(raw, dict):
        raise ShimError(400, "request body must be a JSON object")
    return raw


def _parse_init(raw: Any) -> tuple[str, Optional[str]]:
    body = _body_as_object(raw)
    state_file = body.get("state_file", "./states/StandardMale@0s.pbb")
    log_file = body.get("log_file")
    if not isinstance(state_file, str) or state_file == "":
        raise ShimError(400, "state_file must be a non-empty string")
    if log_file is not None and not isinstance(log_file, str):
        raise ShimError(400, "log_file must be a string when provided")
    return state_file, log_file


def _parse_advance(raw: Any) -> float:
    body = _body_as_object(raw)
    value = body.get("dt_seconds")
    if value is None:
        raise ShimError(400, "dt_seconds is required")
    try:
        dt_seconds = float(value)
    except (TypeError, ValueError) as exc:
        raise ShimError(400, "dt_seconds must be numeric") from exc
    if dt_seconds <= 0 or dt_seconds > 300:
        raise ShimError(400, "dt_seconds must be > 0 and <= 300")
    return dt_seconds


def _parse_action(raw: Any) -> tuple[str, dict[str, Any]]:
    body = _body_as_object(raw)
    action_type = body.get("type")
    params = body.get("params", {})
    if not isinstance(action_type, str) or action_type == "":
        raise ShimError(400, "type must be a non-empty string")
    if not isinstance(params, dict):
        raise ShimError(400, "params must be an object when provided")
    return action_type, params


def _parse_state_io(raw: Any) -> str:
    body = _body_as_object(raw)
    path = body.get("path")
    if not isinstance(path, str) or path == "":
        raise ShimError(400, "path must be a non-empty string")
    return path


def _require_current_state() -> Path:
    if state.current_state_file is None:
        raise ShimError(400, "engine not initialized")
    return state.current_state_file


def _flow_rate_action(value: float) -> dict[str, Any]:
    return {"ScalarVolumePerTime": {"Value": value, "Unit": "mL/min"}}


def _volume_action(value: float) -> dict[str, Any]:
    return {"ScalarVolume": {"Value": value, "Unit": "mL"}}


def _mass_per_volume_action(value: float) -> dict[str, Any]:
    return {"ScalarMassPerVolume": {"Value": value, "Unit": "mg/mL"}}


def _fraction_action(value: float) -> dict[str, Any]:
    return {"Scalar0To1": {"Value": value}}


def _action_to_driver(action_type: str, params: dict[str, Any]) -> dict[str, Any]:
    if action_type == "hemorrhage":
        payload: dict[str, Any] = {
            "Compartment": params.get("compartment", "VenaCava"),
        }
        if payload["Compartment"] == "VenaCava":
            payload["Type"] = "Internal"
        if "severity" in params:
            payload["Severity"] = _fraction_action(float(params["severity"]))
        elif "rate_ml_min" in params:
            payload["FlowRate"] = _flow_rate_action(float(params["rate_ml_min"]))
        else:
            raise ShimError(400, "hemorrhage needs severity or rate_ml_min")
        return {"PatientAction": {"Hemorrhage": payload}}

    if action_type == "hemorrhage_stop":
        return {
            "PatientAction": {
                "Hemorrhage": {
                    "Compartment": params.get("compartment", "VenaCava"),
                    "Type": "Internal" if params.get("compartment", "VenaCava") == "VenaCava" else "External",
                    "Severity": _fraction_action(0.0),
                }
            }
        }

    if action_type == "fluid_bolus":
        fluid = str(params.get("fluid", "Saline"))
        # Pulse 4.3.1 ships Saline, Blood, PackedRBC, Sweat. LR is not present.
        if fluid == "LactatedRingers":
            fluid = "Saline"
        if fluid not in {"Saline", "Blood", "PackedRBC", "Sweat"}:
            raise ShimError(400, f"unsupported fluid compound '{fluid}'")
        return {
            "PatientAction": {
                "SubstanceCompoundInfusion": {
                    "SubstanceCompound": fluid,
                    "BagVolume": _volume_action(float(params.get("volume_ml", 1000))),
                    "Rate": _flow_rate_action(float(params.get("rate_ml_min", 500))),
                }
            }
        }

    if action_type == "norepinephrine":
        rate_mcg_kg_min = float(params.get("rate_mcg_kg_min", 0.0))
        weight_kg = float(params.get("weight_kg", 77.0))
        conc_mg_per_ml = float(params.get("concentration_mg_per_ml", 0.016))
        rate_mcg_min = rate_mcg_kg_min * weight_kg
        rate_ml_min = rate_mcg_min / (conc_mg_per_ml * 1000.0) if conc_mg_per_ml > 0 else 0.0
        return {
            "PatientAction": {
                "SubstanceInfusion": {
                    "Substance": "Norepinephrine",
                    "Concentration": _mass_per_volume_action(conc_mg_per_ml),
                    "Rate": _flow_rate_action(rate_ml_min),
                }
            }
        }

    if action_type == "norepinephrine_stop":
        return {
            "PatientAction": {
                "SubstanceInfusion": {
                    "Substance": "Norepinephrine",
                    "Concentration": _mass_per_volume_action(0.016),
                    "Rate": _flow_rate_action(0.0),
                }
            }
        }

    raise ShimError(400, f"unknown action type '{action_type}'")


def init_engine(raw: Any) -> dict[str, Any]:
    state_file, _log_file = _parse_init(raw)
    resolved_state_file = _resolve_existing_path(state_file)
    _ensure_runtime_root()
    _reset_runtime()
    state.current_state_file = None
    state.current_frame = None
    state.t_sim = 0.0
    run = _run_driver("init", resolved_state_file, [])
    state.current_state_file = run["next_state_path"]
    state.current_frame = run["frame"]
    state.t_sim = run["frame"]["t"]
    state.scenario_name = resolved_state_file.stem
    logger.info("engine initialized from %s (requested %s)", resolved_state_file, state_file)
    return state.current_frame


def advance_engine(raw: Any) -> dict[str, Any]:
    current_state = _require_current_state()
    dt_seconds = _parse_advance(raw)
    advance_action = {
        "AdvanceTime": {
            "Time": {
                "ScalarTime": {
                    "Value": dt_seconds,
                    "Unit": "s",
                }
            }
        }
    }
    run = _run_driver("advance", current_state, [advance_action])
    state.current_state_file = run["next_state_path"]
    state.current_frame = run["frame"]
    state.t_sim = run["frame"]["t"]
    return state.current_frame


def apply_action(raw: Any) -> dict[str, Any]:
    current_state = _require_current_state()
    action_type, params = _parse_action(raw)
    run = _run_driver("action", current_state, [_action_to_driver(action_type, params)], require_results=False)
    state.current_state_file = run["next_state_path"]
    return {"ok": True, "t": state.t_sim, "type": action_type}


def save_state(raw: Any) -> dict[str, Any]:
    current_state = _require_current_state()
    path = _parse_state_io(raw)
    destination = Path(path)
    if not destination.is_absolute():
        destination = WORKSPACE_ROOT / destination
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(current_state, destination)
    return {"ok": True, "path": str(destination)}


def health() -> dict[str, Any]:
    return {
        "engine_ready": state.current_state_file is not None,
        "t_sim": state.t_sim,
        "scenario": state.scenario_name,
        "requests": [request["key"] for request in REQUESTS],
    }


def schema() -> dict[str, Any]:
    return {
        "fields": [
            {
                "pulse_name": request.get("substance", request["property"]),
                "category": request["category"].lower(),
                "unit": request["unit"],
                "key": request["key"],
            }
            for request in REQUESTS
        ],
        "derived": [
            "spo2 (=spo2_frac*100)",
            "lactate_mmol_l (from mg_dl)",
            "urine_ml_hr (from ml_min)",
        ],
    }


class ShimHandler(BaseHTTPRequestHandler):
    server_version = "PulseShim/0.2"

    def log_message(self, format: str, *args: Any) -> None:
        logger.info("%s - %s", self.address_string(), format % args)

    def _read_json_body(self) -> Any:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return {}
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except json.JSONDecodeError as exc:
            raise ShimError(400, f"invalid JSON body: {exc.msg}") from exc

    def _write_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _dispatch(self) -> tuple[int, dict[str, Any]]:
        if self.command == "GET":
            if self.path == "/health":
                return 200, health()
            if self.path == "/vitals":
                return 200, state.current_frame or {"t": state.t_sim}
            if self.path == "/schema":
                return 200, schema()
            raise ShimError(404, f"unknown route {self.command} {self.path}")

        if self.command == "POST":
            body = self._read_json_body()
            if self.path == "/init":
                return 200, init_engine(body)
            if self.path == "/advance":
                return 200, advance_engine(body)
            if self.path == "/action":
                return 200, apply_action(body)
            if self.path == "/state/save":
                return 200, save_state(body)
            raise ShimError(404, f"unknown route {self.command} {self.path}")

        raise ShimError(405, f"method {self.command} not allowed")

    def do_GET(self) -> None:
        self._handle()

    def do_POST(self) -> None:
        self._handle()

    def _handle(self) -> None:
        try:
            status, payload = self._dispatch()
            self._write_json(status, payload)
        except ShimError as exc:
            self._write_json(exc.status, {"error": exc.message})
        except Exception as exc:  # pragma: no cover - runtime crash surface
            logger.exception("unhandled shim error")
            self._write_json(500, {"error": str(exc)})


def main() -> None:
    host = os.environ.get("PULSE_SHIM_HOST", "0.0.0.0")
    port = int(os.environ.get("PULSE_SHIM_PORT", "8765"))
    _ensure_runtime_root()
    server = ThreadingHTTPServer((host, port), ShimHandler)
    logger.info("Pulse shim listening on http://%s:%s", host, port)
    server.serve_forever()


if __name__ == "__main__":
    main()
