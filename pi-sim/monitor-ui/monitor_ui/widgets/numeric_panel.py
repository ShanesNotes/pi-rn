from __future__ import annotations

from typing import Any

from PySide6.QtCore import Qt
from PySide6.QtWidgets import QFrame, QHBoxLayout, QLabel, QVBoxLayout

from ..models import VitalFrame
from ..theme import COLORS, FIELD_COLORS


class NumericPanel(QFrame):
    def __init__(self, label: str, field_name: str, unit: str) -> None:
        super().__init__()
        self._field_name = field_name
        self._unit = unit

        self.setProperty("role", "numericPanel")
        layout = QVBoxLayout(self)
        layout.setContentsMargins(14, 14, 14, 14)
        layout.setSpacing(12)

        self._title = QLabel(label)
        self._title.setProperty("role", "numericTitle")
        layout.addWidget(self._title)

        value_row = QHBoxLayout()
        value_row.setSpacing(8)

        self._value = QLabel("--")
        self._value.setProperty("role", "numericValue")
        self._value.setAlignment(Qt.AlignRight | Qt.AlignVCenter)
        value_row.addWidget(self._value, 1)

        self._unit_label = QLabel(unit)
        self._unit_label.setProperty("role", "numericUnit")
        value_row.addWidget(self._unit_label, 0, Qt.AlignBottom)

        layout.addLayout(value_row)

        self._meta = QLabel("no thresholds")
        self._meta.setProperty("role", "numericMeta")
        layout.addWidget(self._meta)

        self._base_color = FIELD_COLORS.get(field_name, COLORS.white)
        self._set_color(self._base_color)

    def update_from_snapshot(
        self,
        frame: VitalFrame | None,
        thresholds: Any,
        alarmed: bool,
    ) -> None:
        value = getattr(frame, self._field_name, None) if frame else None
        self._value.setText(self._format_value(value))
        self._meta.setText(self._format_thresholds(thresholds))
        self._set_color(COLORS.red if alarmed else self._base_color)

    def _set_color(self, color: str) -> None:
        self._value.setStyleSheet(f"color: {color};")

    def _format_value(self, value: Any) -> str:
        if value is None:
            return "--"
        if isinstance(value, float):
            return f"{value:.1f}" if not value.is_integer() else f"{int(value)}"
        return str(value)

    def _format_thresholds(self, thresholds: Any) -> str:
        if not thresholds:
            return "no thresholds"

        if isinstance(thresholds, dict):
            low = thresholds.get("low")
            high = thresholds.get("high")
            warn_low = thresholds.get("warn_low")
            warn_high = thresholds.get("warn_high")

            if low is not None and high is not None:
                return f"target {low}–{high}"
            if warn_low is not None and warn_high is not None:
                return f"warn {warn_low}–{warn_high}"

            rendered_parts = [f"{key}={value}" for key, value in thresholds.items()]
            return ", ".join(rendered_parts[:3])

        return str(thresholds)
