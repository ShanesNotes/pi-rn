from __future__ import annotations

from pathlib import Path
import signal

import app
from monitor_ui.config import MonitorConfig


def test_app_main_bootstraps_without_live_vitals(monkeypatch, tmp_path: Path) -> None:
    config = MonitorConfig(
        repo_root=Path(__file__).resolve().parents[2],
        vitals_dir=tmp_path / "vitals",
        bed_label="Smoke Bed",
        fullscreen=False,
        poll_interval_ms=100,
    )
    config.vitals_dir.mkdir()
    signal_calls: list[signal.Signals] = []

    monkeypatch.setattr(app, "load_config", lambda: config)
    monkeypatch.setattr(app.signal, "signal", lambda sig, _handler: signal_calls.append(sig))

    assert app.main() == 0
    assert signal.SIGINT in signal_calls
