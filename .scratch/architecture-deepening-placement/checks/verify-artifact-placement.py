#!/usr/bin/env python3
"""Verify architecture-deepening artifact-placement planning artifacts.

The checker is intentionally lane-local and source-edit hostile. It compares a
recorded `git status --short` baseline with the current status, allows files
under `.scratch/architecture-deepening-placement/`, and fails on new status
entries elsewhere or on root `ingest/` creation.

The committed `baseline-status-before-artifact-pass.txt` preserves the original
artifact-pass baseline. In a shared moving worktree, use `--refresh-baseline`
before a verification pass to create `baseline-status-local.txt` for already-
present unrelated dirty files. Do not refresh after making non-placement edits
you intend this checker to catch.
"""

from __future__ import annotations

import argparse
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
INITIAL_BASELINE_NAME = "baseline-status-before-artifact-pass.txt"
LOCAL_BASELINE_NAME = "baseline-status-local.txt"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def checks_dir(root: Path) -> Path:
    return root / ".scratch" / "architecture-deepening-placement" / "checks"


def initial_baseline_path(root: Path) -> Path:
    return checks_dir(root) / INITIAL_BASELINE_NAME


def local_baseline_path(root: Path) -> Path:
    return checks_dir(root) / LOCAL_BASELINE_NAME


def active_baseline_path(root: Path) -> Path:
    local = local_baseline_path(root)
    if local.exists():
        return local
    return initial_baseline_path(root)


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


def refresh_baseline(root: Path) -> None:
    path = local_baseline_path(root)
    path.write_text("\n".join(run_git_status(root)) + "\n", encoding="utf-8")
    print(f"refreshed local baseline: {path.relative_to(root)}")


def status_payload(line: str) -> str:
    payload = line[3:].strip() if len(line) >= 3 else line.strip()
    if " -> " in payload:
        payload = payload.split(" -> ")[-1].strip()
    return payload.strip('"')


def assert_contains(root: Path, path: Path, needles: list[str]) -> list[str]:
    errors: list[str] = []
    if not path.exists():
        return [f"missing required file: {path.relative_to(root)}"]
    text = path.read_text(encoding="utf-8")
    for needle in needles:
        if needle not in text:
            errors.append(f"{path.relative_to(root)} missing required text: {needle}")
    return errors


def verify_files(root: Path) -> list[str]:
    errors: list[str] = []
    lane = root / ".scratch" / "architecture-deepening-placement"
    prd = lane / "PRD.md"
    issues = lane / "issues"
    checks = lane / "checks"

    errors.extend(
        assert_contains(
            root,
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
        errors.extend(assert_contains(root, issues / issue_name, REQUIRED_ISSUE_SECTIONS))

    if not initial_baseline_path(root).exists():
        errors.append(f"missing required file: {initial_baseline_path(root).relative_to(root)}")
    verifier = checks / "verify-artifact-placement.py"
    if not verifier.exists():
        errors.append(f"missing required file: {verifier.relative_to(root)}")

    return errors


def verify_no_ingest(root: Path) -> list[str]:
    if (root / "ingest").exists():
        return ["root ingest/ exists; this planning pass must not create pi-rn/ingest/"]
    return []


def verify_git_status(root: Path) -> list[str]:
    path = active_baseline_path(root)
    if not path.exists():
        return [f"cannot compare git status: {path.relative_to(root)} is missing"]

    baseline = {line for line in path.read_text(encoding="utf-8").splitlines() if line.strip()}
    current = run_git_status(root)
    errors: list[str] = []

    for line in current:
        current_path = status_payload(line)
        if line in baseline:
            continue
        if current_path.startswith(ALLOWED_NEW_PREFIX):
            continue
        errors.append(
            "new non-placement worktree entry detected: "
            f"{line!r}; refresh the local baseline before this pass or keep changes under "
            f"{ALLOWED_NEW_PREFIX}"
        )

    return errors


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--refresh-baseline",
        action="store_true",
        help="record current git status as a local baseline before a later verification pass",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = repo_root()

    if args.refresh_baseline:
        refresh_baseline(root)
        return 0

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
