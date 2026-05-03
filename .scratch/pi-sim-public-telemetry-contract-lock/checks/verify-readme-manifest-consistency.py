#!/usr/bin/env python3
"""Verify pi-sim public telemetry README / lane manifest consistency.

Run from the pi-sim directory:

    python3 ../.scratch/pi-sim-public-telemetry-contract-lock/checks/verify-readme-manifest-consistency.py

This check is intentionally read-only. It reports mismatches and exits non-zero;
it does not modify README prose, lane manifest semantics, fixtures, or hidden
runtime internals.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

REQUIRED_LANE_KEYS = {
    "name",
    "path",
    "artifactKind",
    "schemaVersion",
    "writeSemantics",
    "resetSemantics",
    "producer",
    "preferredConsumerMode",
}


def find_pi_sim_root(start: Path) -> Path:
    """Find pi-sim from cwd or ancestors without importing project code."""
    current = start.resolve()
    candidates = [current, *current.parents]
    for candidate in candidates:
        if (candidate / "vitals" / "README.md").is_file() and (
            candidate / "vitals" / ".lanes.json"
        ).is_file():
            return candidate
        if (candidate / "pi-sim" / "vitals" / "README.md").is_file() and (
            candidate / "pi-sim" / "vitals" / ".lanes.json"
        ).is_file():
            return candidate / "pi-sim"
    raise SystemExit(
        "Could not find pi-sim/vitals/README.md and "
        "pi-sim/vitals/.lanes.json from cwd"
    )


def load_manifest(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        manifest = json.load(handle)
    if not isinstance(manifest, dict):
        raise SystemExit(".lanes.json must contain a JSON object")
    return manifest


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower())


def verify(sim_root: Path) -> dict[str, Any]:
    readme_path = sim_root / "vitals" / "README.md"
    manifest_path = sim_root / "vitals" / ".lanes.json"
    readme = readme_path.read_text(encoding="utf-8")
    readme_normalized = normalize(readme)
    manifest = load_manifest(manifest_path)

    mismatches: list[str] = []
    warnings: list[str] = []

    for key in ["schemaVersion", "producer", "resetSemantics", "lanes"]:
        if key not in manifest:
            mismatches.append(f"manifest missing top-level key: {key}")

    lanes = manifest.get("lanes", [])
    if not isinstance(lanes, list) or not lanes:
        mismatches.append("manifest lanes must be a non-empty array")
        lanes = []

    seen_names: set[str] = set()
    seen_paths: set[str] = set()
    lane_results: list[dict[str, Any]] = []

    for index, lane in enumerate(lanes):
        if not isinstance(lane, dict):
            mismatches.append(f"lane[{index}] is not an object")
            continue

        missing_keys = sorted(REQUIRED_LANE_KEYS.difference(lane))
        if missing_keys:
            mismatches.append(f"lane[{index}] missing keys: {', '.join(missing_keys)}")

        name = str(lane.get("name", f"lane[{index}]"))
        path = str(lane.get("path", ""))

        if name in seen_names:
            mismatches.append(f"duplicate lane name: {name}")
        seen_names.add(name)

        if path in seen_paths:
            mismatches.append(f"duplicate lane path: {path}")
        seen_paths.add(path)

        path_mentioned = bool(path) and path.lower() in readme_normalized
        non_consumer_phrase = f"{path} is not consumer-facing".lower() in readme_normalized
        if not path_mentioned and not non_consumer_phrase:
            mismatches.append(f"README lacks consumer-facing coverage for lane path `{path}`")

        write_semantics = lane.get("writeSemantics")
        write_semantics_valid = isinstance(write_semantics, list) and all(
            isinstance(item, str) for item in write_semantics
        )
        if not write_semantics_valid:
            mismatches.append(f"lane `{name}` writeSemantics must be an array of strings")

        schema_version = lane.get("schemaVersion")
        if not isinstance(schema_version, int):
            mismatches.append(f"lane `{name}` schemaVersion must be an integer")

        if "recordSchemaVersion" in lane and not isinstance(lane.get("recordSchemaVersion"), int):
            mismatches.append(f"lane `{name}` recordSchemaVersion must be an integer when present")

        lane_results.append(
            {
                "name": name,
                "path": path,
                "schemaVersion": schema_version,
                "recordSchemaVersion": lane.get("recordSchemaVersion"),
                "writeSemantics": write_semantics,
                "resetSemantics": lane.get("resetSemantics"),
                "producer": lane.get("producer"),
                "preferredConsumerMode": lane.get("preferredConsumerMode"),
                "readmePathMentioned": path_mentioned,
                "documentedNonConsumerFacing": non_consumer_phrase,
            }
        )

    fixtures_named = "fixtures/public-contract" in readme_normalized
    abi_distinction_named = "not a second abi authority" in readme_normalized
    if fixtures_named and not abi_distinction_named:
        warnings.append(
            "README mentions public-contract fixtures without the expected "
            "ABI-authority distinction"
        )

    return {
        "simRoot": str(sim_root),
        "readme": str(readme_path),
        "manifest": str(manifest_path),
        "laneCount": len(lane_results),
        "lanes": lane_results,
        "mismatches": mismatches,
        "warnings": warnings,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="print machine-readable JSON result")
    args = parser.parse_args()

    result = verify(find_pi_sim_root(Path.cwd()))

    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        print("README / lane manifest consistency check")
        print(f"pi-sim root: {result['simRoot']}")
        print(f"lanes checked: {result['laneCount']}")
        for lane in result["lanes"]:
            status = (
                "README path OK"
                if lane["readmePathMentioned"]
                else "non-consumer-facing documented"
            )
            print(f"- {lane['name']}: {lane['path']} ({status})")
        if result["warnings"]:
            print("warnings:")
            for warning in result["warnings"]:
                print(f"- {warning}")
        if result["mismatches"]:
            print("mismatches:")
            for mismatch in result["mismatches"]:
                print(f"- {mismatch}")
        else:
            print("mismatches: none")

    return 1 if result["mismatches"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
