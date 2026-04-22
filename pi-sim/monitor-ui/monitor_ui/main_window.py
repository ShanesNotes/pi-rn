from __future__ import annotations

from dataclasses import dataclass

from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QFrame,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QMainWindow,
    QSizePolicy,
    QVBoxLayout,
    QWidget,
)

from .config import MonitorConfig
from .models import MonitorSnapshot, VitalFrame
from .theme import COLORS
from .vitals_source import VitalsSource
from .widgets.alarm_banner import AlarmBanner
from .widgets.numeric_panel import NumericPanel


@dataclass(frozen=True)
class PanelDefinition:
    label: str
    field_name: str
    unit: str


PANEL_DEFINITIONS: tuple[PanelDefinition, ...] = (
    PanelDefinition("HR", "hr", "bpm"),
    PanelDefinition("NBP SYS", "bp_sys", "mmHg"),
    PanelDefinition("NBP DIA", "bp_dia", "mmHg"),
    PanelDefinition("MAP", "map", "mmHg"),
    PanelDefinition("SpO₂", "spo2", "%"),
    PanelDefinition("RR", "rr", "rpm"),
    PanelDefinition("TEMP", "temp_c", "°C"),
    PanelDefinition("CO", "cardiac_output_lpm", "L/min"),
)


class MainWindow(QMainWindow):
    def __init__(self, config: MonitorConfig) -> None:
        super().__init__()
        self._config = config
        self._source = VitalsSource(config)
        self._numeric_panels: dict[str, NumericPanel] = {}

        self.setWindowTitle(f"pi-sim monitor — {config.bed_label}")
        self.resize(1400, 900)

        central = QWidget(self)
        self.setCentralWidget(central)

        root_layout = QVBoxLayout(central)
        root_layout.setContentsMargins(20, 20, 20, 20)
        root_layout.setSpacing(14)

        root_layout.addWidget(self._build_header())
        self._alarm_banner = AlarmBanner()
        root_layout.addWidget(self._alarm_banner)

        body = QWidget()
        body_layout = QHBoxLayout(body)
        body_layout.setContentsMargins(0, 0, 0, 0)
        body_layout.setSpacing(16)

        body_layout.addWidget(self._build_waveform_shell(), 3)
        body_layout.addWidget(self._build_numeric_column(), 2)

        root_layout.addWidget(body, 1)

        self._source.snapshot_changed.connect(self._apply_snapshot)
        self._source.start()

    def closeEvent(self, event) -> None:  # type: ignore[override]
        self._source.stop()
        super().closeEvent(event)

    def _build_header(self) -> QWidget:
        header = QFrame()
        header.setProperty("role", "shellPanel")
        layout = QHBoxLayout(header)
        layout.setContentsMargins(18, 14, 18, 14)
        layout.setSpacing(18)

        title_stack = QVBoxLayout()
        title = QLabel("Bedside Monitor")
        title.setProperty("role", "header")
        title_stack.addWidget(title)

        subtitle = QLabel(f"{self._config.bed_label} · {self._config.vitals_dir}")
        subtitle.setProperty("role", "subheader")
        subtitle.setTextInteractionFlags(Qt.TextSelectableByMouse)
        title_stack.addWidget(subtitle)
        layout.addLayout(title_stack)

        layout.addStretch(1)

        self._status_label = QLabel("waiting for data…")
        self._status_label.setProperty("role", "subheader")
        layout.addWidget(self._status_label, 0, Qt.AlignRight | Qt.AlignVCenter)

        return header

    def _build_waveform_shell(self) -> QWidget:
        shell = QWidget()
        layout = QVBoxLayout(shell)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(12)

        for label, color in (("ECG", COLORS.good), ("PLETH", COLORS.cyan), ("ART", COLORS.red)):
            panel = QFrame()
            panel.setProperty("role", "wavePlaceholder")
            panel.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
            inner = QVBoxLayout(panel)
            inner.setContentsMargins(18, 18, 18, 18)

            title = QLabel(label)
            title.setProperty("role", "wavePlaceholderLabel")
            title.setStyleSheet(f"color: {color};")
            inner.addWidget(title, 0, Qt.AlignTop | Qt.AlignLeft)

            message = QLabel("Waveform provider lane pending")
            message.setProperty("role", "subheader")
            inner.addStretch(1)
            inner.addWidget(message, 0, Qt.AlignCenter)
            inner.addStretch(2)

            layout.addWidget(panel, 1)

        return shell

    def _build_numeric_column(self) -> QWidget:
        shell = QWidget()
        layout = QGridLayout(shell)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setHorizontalSpacing(12)
        layout.setVerticalSpacing(12)

        for index, definition in enumerate(PANEL_DEFINITIONS):
            panel = NumericPanel(
                label=definition.label,
                field_name=definition.field_name,
                unit=definition.unit,
            )
            self._numeric_panels[definition.field_name] = panel
            row = index // 2
            column = index % 2
            layout.addWidget(panel, row, column)

        self._waiting_overlay = QLabel("waiting for data…")
        self._waiting_overlay.setAlignment(Qt.AlignCenter)
        self._waiting_overlay.setProperty("role", "subheader")
        layout.addWidget(self._waiting_overlay, 4, 0, 1, 2)

        return shell

    def _apply_snapshot(self, snapshot: MonitorSnapshot) -> None:
        self._status_label.setText(snapshot.status_text if not snapshot.last_error else f"{snapshot.status_text} · {snapshot.last_error}")
        self._alarm_banner.set_alarms(snapshot.frame.alarms if snapshot.frame else [])
        self._waiting_overlay.setVisible(not snapshot.has_data)

        for field_name, panel in self._numeric_panels.items():
            panel.update_from_snapshot(
                frame=snapshot.frame,
                thresholds=snapshot.thresholds.get(field_name),
                alarmed=field_name in snapshot.alarm_fields,
            )

