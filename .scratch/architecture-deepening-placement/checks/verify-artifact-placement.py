#!/usr/bin/env python3
"""Verify architecture-deepening artifact-placement planning artifacts.

This checker is intentionally lane-local and source-edit hostile. It allows the
pre-existing dirty worktree recorded before this artifact pass plus files under
`.scratch/architecture-deepening-placement/`, and fails on new status entries
elsewhere or on root `ingest/` creation.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REQUIRED_ISSUES = [
    "01-create-pi-sim-publication-prd.md",
    "02-create-pi-monitor-ingest-depth-prd.md",
    "03-create-observable-charting-adapter-readiness-prd.md",
    "04-park-pi-chart-validation-until-rebase.md",
    "05-create-durable-scratch-verifier.md",
    "06-adr-trigger-audit.md",
]

REQUIRED_ISSUE_SECTIONS = [
    "Status:",
    "Type:",
    "## Parent",
    "## What to build",
    "## Acceptance criteria",
    "## Blocked by",
    "## Comments",
]

ALLOWED_NEW_PREFIX = ".scratch/architecture-deepening-placement/"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def run_git_status(root: Path) -> list[str]:
    result = subprocess.run(
        ["git", "status", "--short"],
        cwd=root,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )
    return [line for line in result.stdout.splitlines() if line.strip()]


def status_payload(line: str) -> str:
    payload = line[3:].strip() if len(line) >= 3 else line.strip()
    if " -> " in payload:
        payload = payload.split(" -> ")[-1].strip()
    return payload.strip('"')


def assert_contains(path: Path, needles: list[str]) -> list[str]:
    errors: list[str] = []
    if not path.exists():
        return [f"missing required file: {path.relative_to(repo_root())}"]
    text = path.read_text(encoding="utf-8")
    for needle in needles:
        if needle not in text:
            errors.append(f"{path.relative_to(repo_root())} missing required text: {needle}")
    return errors


def verify_files(root: Path) -> list[str]:
    errors: list[str] = []
    lane = root / ".scratch" / "architecture-deepening-placement"
    prd = lane / "PRD.md"
    issues = lane / "issues"
    checks = lane / "checks"

    errors.extend(
        assert_contains(
            prd,
            [
                "Status: needs-triage",
                "index-only coordination PRD",
                "Implementation work lives in the lane PRDs below, not in this coordination PRD.",
                "Do not promote the chart-write policy seed to a `pi-chart` ADR",
                "pi-rn/ingest/",
            ],
        )
    )

    for issue_name in REQUIRED_ISSUES:
        errors.extend(assert_contains(issues / issue_name, REQUIRED_ISSUE_SECTIONS))

    baseline = checks / "baseline-status-before-artifact-pass.txt"
    if not baseline.exists():
        errors.append(f"missing required file: {baseline.relative_to(root)}")
    verifier = checks / "verify-artifact-placement.py"
    if not verifier.exists():
        errors.append(f"missing required file: {verifier.relative_to(root)}")

    return errors


def verify_no_ingest(root: Path) -> list[str]:
    errors: list[str] = []
    if (root / "ingest").exists():
        errors.append("root ingest/ exists; this planning pass must not create pi-rn/ingest/")
    return errors


def verify_git_status(root: Path) -> list[str]:
    baseline_path = root / ".scratch" / "architecture-deepening-placement" / "checks" / "baseline-status-before-artifact-pass.txt"
    if not baseline_path.exists():
        return ["cannot compare git status: baseline-status-before-artifact-pass.txt is missing"]

    baseline = {line for line in baseline_path.read_text(encoding="utf-8").splitlines() if line.strip()}
    current = run_git_status(root)
    errors: list[str] = []

    for line in current:
        path = status_payload(line)
        if line in baseline:
            continue
        if path.startswith(ALLOWED_NEW_PREFIX):
            continue
        errors.append(
            "new non-placement worktree entry detected: "
            f"{line!r}; only {ALLOWED_NEW_PREFIX} is allowed beyond baseline"
        )

    return errors


def main() -> int:
    root = repo_root()
    errors: list[str] = []
    errors.extend(verify_files(root))
    errors.extend(verify_no_ingest(root))
    errors.extend(verify_git_status(root))

    if errors:
        print("artifact placement verification FAIL", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print("artifact placement verification PASS")
    print("checked: PRD, six issues, durable checker, no root ingest/, no new non-placement git status")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
