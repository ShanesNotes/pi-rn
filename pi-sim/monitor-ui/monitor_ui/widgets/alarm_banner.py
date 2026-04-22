from __future__ import annotations

from PySide6.QtCore import Qt
from PySide6.QtWidgets import QFrame, QHBoxLayout, QLabel


class AlarmBanner(QFrame):
    def __init__(self) -> None:
        super().__init__()
        self.setProperty("role", "alarmBanner")
        self.setProperty("active", "false")

        layout = QHBoxLayout(self)
        layout.setContentsMargins(16, 12, 16, 12)
        layout.setSpacing(8)

        self._label = QLabel("No active alarms")
        self._label.setProperty("role", "alarmBannerText")
        self._label.setAlignment(Qt.AlignLeft | Qt.AlignVCenter)
        layout.addWidget(self._label)

    def set_alarms(self, alarms: list[str]) -> None:
        active = bool(alarms)
        self.setProperty("active", "true" if active else "false")
        self._label.setText(" · ".join(alarms) if active else "No active alarms")
        self.style().unpolish(self)
        self.style().polish(self)
        self.update()
