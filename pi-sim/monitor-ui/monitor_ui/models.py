from __future__ import annotations

from dataclasses import dataclass, field, fields
from typing import Any, ClassVar
import warnings


@dataclass(slots=True)
class VitalFrame:
    t: float | int | None = None
    wallTime: str | None = None
    hr: float | int | None = None
    map: float | int | None = None
    bp_sys: float | int | None = None
    bp_dia: float | int | None = None
    rr: float | int | None = None
    spo2: float | int | None = None
    temp_c: float | int | None = None
    cardiac_output_lpm: float | int | None = None
    stroke_volume_ml: float | int | None = None
    etco2_mmHg: float | int | None = None
    pao2_mmHg: float | int | None = None
    paco2_mmHg: float | int | None = None
    urine_ml_hr: float | int | None = None
    ph: float | int | None = None
    lactate_mmol_l: float | int | None = None
    hgb_g_dl: float | int | None = None
    alarms: list[str] = field(default_factory=list)
    extra_fields: dict[str, Any] = field(default_factory=dict)

    _warned_extra_fields: ClassVar[set[str]] = set()
    _field_names: ClassVar[set[str]]

    @classmethod
    def from_mapping(cls, payload: dict[str, Any]) -> "VitalFrame":
        known_field_names = cls.known_field_names()
        known_values = {name: payload.get(name) for name in known_field_names if name != "extra_fields"}
        extra_fields = {name: value for name, value in payload.items() if name not in known_field_names}

        new_unknowns = sorted(name for name in extra_fields if name not in cls._warned_extra_fields)
        if new_unknowns:
            warnings.warn(
                f"Unknown vitals fields seen in current schema: {', '.join(new_unknowns)}",
                RuntimeWarning,
                stacklevel=2,
            )
            cls._warned_extra_fields.update(new_unknowns)

        alarms = known_values.get("alarms")
        known_values["alarms"] = alarms if isinstance(alarms, list) else []
        known_values["extra_fields"] = extra_fields
        return cls(**known_values)

    @classmethod
    def known_field_names(cls) -> set[str]:
        if not hasattr(cls, "_field_names"):
            cls._field_names = {item.name for item in fields(cls) if item.init and item.name != "extra_fields"}
        return cls._field_names | {"extra_fields"}


@dataclass(slots=True)
class MonitorSnapshot:
    frame: VitalFrame | None = None
    timeline: list[VitalFrame] = field(default_factory=list)
    thresholds: dict[str, Any] = field(default_factory=dict)
    alarm_fields: set[str] = field(default_factory=set)
    has_data: bool = False
    status_text: str = "waiting for data…"
    last_error: str | None = None
