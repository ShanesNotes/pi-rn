"""Validation, importable from the agent.

Runs `scripts/validate.py` as a subprocess and parses its stdout into a
structured report so the agent can reason about errors and warnings instead
of just consuming a boolean. CLI exit code remains 0/1.

Returned shape:

    {
      "ok": bool,
      "errors":   [{"where": "...", "message": "..."}],
      "warnings": [{"where": "...", "message": "..."}],
    }
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path


_ERROR_RE = re.compile(r"^ERROR\s+(?P<where>\S+):\s*(?P<message>.*)$")
_WARN_RE = re.compile(r"^WARN\s+(?P<where>\S+):\s*(?P<message>.*)$")


def validate_chart(chart_root: Path | str = ".") -> dict:
    """Run the validator. Returns a structured report."""
    root = Path(chart_root).resolve()
    script = root / "scripts" / "validate.py"
    if not script.exists():
        raise FileNotFoundError(f"validate.py not found at {script}")

    proc = subprocess.run(
        [sys.executable, str(script), str(root)],
        check=False,
        capture_output=True,
        text=True,
    )

    errors: list[dict] = []
    warnings: list[dict] = []
    for line in (proc.stdout or "").splitlines():
        m = _ERROR_RE.match(line)
        if m:
            errors.append({"where": m.group("where"), "message": m.group("message").rstrip(".")})
            continue
        m = _WARN_RE.match(line)
        if m:
            warnings.append({"where": m.group("where"), "message": m.group("message").rstrip(".")})

    return {"ok": proc.returncode == 0, "errors": errors, "warnings": warnings}
