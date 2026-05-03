#!/usr/bin/env python3
"""Verify pi-monitor public-fixture consumer posture.

Run from the repository root or from pi-monitor/:

    python3 ../.scratch/pi-sim-public-telemetry-contract-lock/checks/\\
      verify-pi-monitor-public-consumer.py

The check is read-only. It uses producer public fixtures under
pi-sim/vitals/fixtures/public-contract/**, runs pi-monitor CLI consumer paths,
and scans monitor crates for forbidden source couplings or forbidden write
intent. It does not modify telemetry schemas, hidden simulator internals, chart
truth, or producer fixture files.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any, Iterable

PUBLIC_CASES = {
    "scripted-demo": [
        "HR 89",
        "BP/MAP",
        "public status lane: runState=ended",
        "waveform feed unavailable",
        "provider_does_not_supply_waveforms",
        "not charted",
    ],
    "scripted-alarm": [
        "MAP_LOW",
        "SPO2_LOW",
        "public status lane: runState=ended",
        "waveform feed unavailable",
        "not charted",
    ],
    "provider-unavailable": [
        "PROVIDER_UNAVAILABLE",
        "runState=unavailable",
        "waveform feed unavailable",
        "provider_unavailable",
        "not charted",
    ],
}

LIVE_WAVEFORM_CASE = "live-demo-waveform"
LIVE_WAVEFORM_EXPECTED = [
    "waveform feed available",
    "sourceKind=demo",
    "fidelity=demo",
    "synthetic=true",
    "not charted",
]

FORBIDDEN_SOURCE_TOKENS = [
    "pi-sim/scripts",
    "../pi-sim/scripts",
    "../pi-sim/pulse",
    "../pi-chart",
    "pi-chart/",
    "../pi-agent",
    "pi-agent/",
]

FORBIDDEN_WRITE_TOKENS = [
    "vitals.jsonl",
    "chart/ehr",
    "chart truth write",
    "patient truth write",
]


def find_repo_root(start: Path) -> Path:
    current = start.resolve()
    for candidate in [current, *current.parents]:
        if (candidate / "pi-monitor" / "Cargo.toml").is_file() and (
            candidate / "pi-sim" / "vitals" / "fixtures" / "public-contract"
        ).is_dir():
            return candidate
        if candidate.name == "pi-monitor" and (candidate / "Cargo.toml").is_file():
            parent = candidate.parent
            if (parent / "pi-sim" / "vitals" / "fixtures" / "public-contract").is_dir():
                return parent
    raise SystemExit("Could not find pi-rn root with pi-monitor/ and pi-sim public fixtures")


def run_monitor(pi_monitor: Path, args: list[str]) -> str:
    completed = subprocess.run(
        ["cargo", "run", "-p", "monitor-cli", "--", *args],
        cwd=pi_monitor,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    if completed.returncode != 0:
        raise AssertionError(
            "monitor-cli command failed: "
            + " ".join(args)
            + "\n"
            + completed.stdout
        )
    return completed.stdout


def assert_contains(label: str, text: str, expected: Iterable[str]) -> list[str]:
    missing = [needle for needle in expected if needle not in text]
    if missing:
        raise AssertionError(f"{label} output missing expected text: {missing}")
    return list(expected)


def scan_boundaries(pi_monitor: Path) -> dict[str, Any]:
    findings: list[str] = []
    scanned_files: list[str] = []

    for path in sorted((pi_monitor / "crates").rglob("*.rs")):
        text = path.read_text(encoding="utf-8")
        rel = path.relative_to(pi_monitor).as_posix()
        scanned_files.append(rel)
        lowered = text.lower()
        for token in FORBIDDEN_SOURCE_TOKENS:
            if token.lower() in lowered:
                findings.append(f"forbidden source token `{token}` in {rel}")
        for token in FORBIDDEN_WRITE_TOKENS:
            if token.lower() in lowered:
                findings.append(f"forbidden write token `{token}` in {rel}")

    for path in sorted(pi_monitor.rglob("Cargo.toml")):
        text = path.read_text(encoding="utf-8").lower()
        rel = path.relative_to(pi_monitor).as_posix()
        scanned_files.append(rel)
        for token in ["../pi-sim", "../pi-chart", "../pi-agent"]:
            if token in text:
                findings.append(f"forbidden path dependency `{token}` in {rel}")

    return {"scannedFiles": scanned_files, "findings": findings}


def verify(root: Path) -> dict[str, Any]:
    pi_monitor = root / "pi-monitor"
    public_fixtures = root / "pi-sim" / "vitals" / "fixtures" / "public-contract"
    required_cases = [*PUBLIC_CASES, LIVE_WAVEFORM_CASE]
    missing_cases = [case for case in required_cases if not (public_fixtures / case).is_dir()]
    if missing_cases:
        raise AssertionError(f"missing required public fixture directories: {missing_cases}")

    replay_args = ["replay-dir"]
    for case in PUBLIC_CASES:
        replay_args.extend(["--fixture-dir", f"../pi-sim/vitals/fixtures/public-contract/{case}"])
    replay_args.append("--no-sleep")
    replay_output = run_monitor(pi_monitor, replay_args)

    case_evidence: dict[str, list[str]] = {}
    for case, expected in PUBLIC_CASES.items():
        case_evidence[case] = assert_contains(case, replay_output, expected)

    live_fixture = f"../pi-sim/vitals/fixtures/public-contract/{LIVE_WAVEFORM_CASE}"
    live_output = run_monitor(pi_monitor, ["render", "--source-dir", live_fixture])
    case_evidence[LIVE_WAVEFORM_CASE] = assert_contains(
        LIVE_WAVEFORM_CASE, live_output, LIVE_WAVEFORM_EXPECTED
    )

    boundary = scan_boundaries(pi_monitor)
    if boundary["findings"]:
        raise AssertionError("boundary findings: " + "; ".join(boundary["findings"]))

    return {
        "fixtureRoot": str(public_fixtures),
        "cases": case_evidence,
        "boundaryScan": boundary,
        "commands": [
            "cargo run -p monitor-cli -- " + " ".join(replay_args),
            "cargo run -p monitor-cli -- render --source-dir "
            f"../pi-sim/vitals/fixtures/public-contract/{LIVE_WAVEFORM_CASE}",
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="print machine-readable JSON result")
    args = parser.parse_args()

    result = verify(find_repo_root(Path.cwd()))
    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        print("pi-monitor public consumer check")
        print(f"fixture root: {result['fixtureRoot']}")
        for case, evidence in result["cases"].items():
            print(f"- {case}: {len(evidence)} evidence strings matched")
        print(f"boundary files scanned: {len(result['boundaryScan']['scannedFiles'])}")
        print("boundary findings: none")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
