"""Derived-view regeneration, importable from the agent.

For now this is a thin wrapper around `scripts/rebuild_derived.py`. Kept
separate so a future implementation (SQLite, vector index, etc.) can land
here without changing the agent-facing API.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def rebuild_derived(chart_root: Path | str = ".") -> None:
    """Regenerate everything under `_derived/`."""
    root = Path(chart_root).resolve()
    script = root / "scripts" / "rebuild_derived.py"
    if not script.exists():
        raise FileNotFoundError(f"rebuild_derived.py not found at {script}")
    subprocess.check_call([sys.executable, str(script), str(root)])
