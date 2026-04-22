from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import os


@dataclass(frozen=True)
class MonitorConfig:
    repo_root: Path
    vitals_dir: Path
    bed_label: str
    fullscreen: bool
    poll_interval_ms: int

    @property
    def current_path(self) -> Path:
        return self.vitals_dir / "current.json"

    @property
    def timeline_path(self) -> Path:
        return self.vitals_dir / "timeline.json"

    @property
    def alarms_path(self) -> Path:
        return self.vitals_dir / "alarms.json"


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_config() -> MonitorConfig:
    repo_root = _repo_root()
    vitals_dir = Path(os.environ.get("VITALS_DIR", repo_root / "vitals")).expanduser()
    poll_interval_ms = max(100, int(os.environ.get("MONITOR_POLL_MS", "500")))

    return MonitorConfig(
        repo_root=repo_root,
        vitals_dir=vitals_dir,
        bed_label=os.environ.get("MONITOR_BED", "Bed A"),
        fullscreen=os.environ.get("MONITOR_FULLSCREEN", "").strip().lower() in {"1", "true", "yes", "on"},
        poll_interval_ms=poll_interval_ms,
    )
