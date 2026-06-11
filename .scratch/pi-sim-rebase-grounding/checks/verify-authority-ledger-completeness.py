#!/usr/bin/env python3
"""Verify pi-sim 007 authority ledger completeness.

Run from the pi-sim directory:

    python3 ../.scratch/pi-sim-rebase-grounding/checks/verify-authority-ledger-completeness.py

Read-only: reports missing/duplicate ledger rows and exits non-zero on failure.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def required_paths(pi_sim: Path) -> list[str]:
    cmd = f"""{{
  printf '%s\\n' README.md vitals/README.md vitals/.lanes.json
  find docs/adr docs/plans .omx/plans -maxdepth 1 -type f | sort
  printf '%s\\n' ../pi-monitor/README.md ../pi-agent/AGENTS.md ../pi-chart/src/vitals.ts
  find ../pi-monitor/docs/adr -maxdepth 1 -type f | sort
}}"""
    out = subprocess.check_output(["bash", "-c", cmd], cwd=pi_sim, text=True)
    return [line for line in out.splitlines() if line]


def ledger_rows(ledger_path: Path) -> list[str]:
    rows: list[str] = []
    in_table = False
    for line in ledger_path.read_text().splitlines():
        if line.startswith("| artifact_path |"):
            in_table = True
            continue
        if in_table and not line.startswith("|"):
            break
        if in_table and line.startswith("| ") and not line.startswith("|---"):
            first = line.split("|")[1].strip()
            if first and first != "---":
                rows.append(first)
    return rows


def main() -> int:
    pi_sim = Path(__file__).resolve().parents[2] / "pi-sim"
    if not (pi_sim / "docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md").is_file():
        pi_sim = Path.cwd()
    ledger_path = pi_sim / "docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md"
    if not ledger_path.is_file():
        print(f"ledger not found: {ledger_path}", file=sys.stderr)
        return 1

    required = required_paths(pi_sim)
    rows = ledger_rows(ledger_path)
    missing = [p for p in required if rows.count(p) != 1]
    dupes = sorted({p for p in rows if rows.count(p) > 1})

    vitals_rows = [
        r
        for r in rows
        if r in {"vitals/README.md", "vitals/.lanes.json"}
    ]
    if len(vitals_rows) != 2:
        print("vitals authority rows missing from ledger table", file=sys.stderr)
        return 1

    ledger_text = ledger_path.read_text()
    for path in ("vitals/README.md", "vitals/.lanes.json"):
        if f"| {path} |" not in ledger_text or "execution-ready" not in ledger_text:
            print(f"public contract row not execution-ready: {path}", file=sys.stderr)
            return 1

    if "Root `PLANNING.md`, if present, is transitional lineage only." not in ledger_text:
        print("PLANNING.md transitional rule missing from ledger", file=sys.stderr)
        return 1

    if missing or dupes:
        print(f"missing_or_not_once={missing} dupes={dupes}", file=sys.stderr)
        return 1

    print(f"ledger rows verified: {len(required)} required paths")
    print("vitals/README.md + vitals/.lanes.json: current execution-ready public contract authority")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())