from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .qt_compat import QObject, QTimer, Signal

from .config import MonitorConfig
from .models import MonitorSnapshot, VitalFrame


ALARM_CODE_TO_FIELD: dict[str, str] = {
    "HR": "hr",
    "MAP": "map",
    "BP_SYS": "bp_sys",
    "BP_DIA": "bp_dia",
    "RR": "rr",
    "SPO2": "spo2",
    "TEMP_C": "temp_c",
    "ETCO2_MMHG": "etco2_mmHg",
    "PAO2_MMHG": "pao2_mmHg",
    "PACO2_MMHG": "paco2_mmHg",
    "LACTATE_MMOL_L": "lactate_mmol_l",
    "PH": "ph",
}


class VitalsSource(QObject):
    snapshot_changed = Signal(object)
    frame_changed = Signal(object)

    def __init__(self, config: MonitorConfig) -> None:
        super().__init__()
        self._config = config
        self._timer = QTimer(self)
        self._timer.setInterval(config.poll_interval_ms)
        self._timer.timeout.connect(self.refresh)
        self._last_signature: tuple[str, str, str] | None = None
        self._snapshot = MonitorSnapshot()

    @property
    def snapshot(self) -> MonitorSnapshot:
        return self._snapshot

    def start(self) -> None:
        self.refresh()
        self._timer.start()

    def stop(self) -> None:
        self._timer.stop()

    def refresh(self) -> None:
        snapshot = self._load_snapshot()
        signature = self._snapshot_signature(snapshot)
        if signature == self._last_signature:
            return

        self._last_signature = signature
        self._snapshot = snapshot
        self.snapshot_changed.emit(snapshot)
        self.frame_changed.emit(snapshot.frame)

    def _load_snapshot(self) -> MonitorSnapshot:
        thresholds = self._load_thresholds(self._config.alarms_path)
        current_payload, current_error = self._read_json(self._config.current_path)
        timeline_payload, timeline_error = self._read_json(self._config.timeline_path)

        frame = VitalFrame.from_mapping(current_payload) if isinstance(current_payload, dict) else None
        timeline = [
            VitalFrame.from_mapping(item)
            for item in timeline_payload
            if isinstance(item, dict)
        ] if isinstance(timeline_payload, list) else []

        errors = [error for error in [current_error, timeline_error] if error]
        has_data = frame is not None
        status_text = "live data" if has_data else "waiting for data…"

        return MonitorSnapshot(
            frame=frame,
            timeline=timeline,
            thresholds=thresholds,
            alarm_fields=self._alarm_fields(frame.alarms if frame else []),
            has_data=has_data,
            status_text=status_text,
            last_error=" | ".join(errors) if errors else None,
        )

    def _load_thresholds(self, path: Path) -> dict[str, Any]:
        payload, _ = self._read_json(path)
        return payload if isinstance(payload, dict) else {}

    def _read_json(self, path: Path) -> tuple[Any | None, str | None]:
        try:
            text = path.read_text(encoding="utf-8")
        except FileNotFoundError:
            return None, None
        except OSError as exc:
            return None, f"{path.name}: {exc}"

        if not text.strip():
            return None, None

        try:
            return json.loads(text), None
        except json.JSONDecodeError:
            return None, None

    def _alarm_fields(self, alarms: list[str]) -> set[str]:
        alarm_fields: set[str] = set()
        for alarm in alarms:
            normalized = str(alarm).strip().upper()
            base_code = normalized
            for suffix in ("_LOW", "_HIGH", "_WARN", "_CRIT"):
                if normalized.endswith(suffix):
                    base_code = normalized[: -len(suffix)]
                    break

            if base_code.startswith("NBP_"):
                base_code = f"BP_{base_code[4:]}"

            field = ALARM_CODE_TO_FIELD.get(base_code)
            if field:
                alarm_fields.add(field)

        return alarm_fields

    def _snapshot_signature(self, snapshot: MonitorSnapshot) -> tuple[str, str, str]:
        frame_key = ""
        if snapshot.frame:
            frame_key = "|".join(
                str(value)
                for value in (
                    snapshot.frame.t,
                    snapshot.frame.wallTime,
                    snapshot.frame.hr,
                    snapshot.frame.map,
                    snapshot.frame.spo2,
                    tuple(snapshot.frame.alarms),
                    tuple(sorted(snapshot.frame.extra_fields)),
                )
            )

        timeline_key = str(len(snapshot.timeline))
        thresholds_key = json.dumps(snapshot.thresholds, sort_keys=True, default=str)
        return frame_key, timeline_key, thresholds_key
