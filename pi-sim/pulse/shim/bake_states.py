"""Offline state baker — produces pre-serialized Pulse patient states for
scenarios whose initial conditions require a cold init (notably sepsis).

Cold init takes several minutes. Run once inside the kitware/pulse container
per severity; cache the resulting ``.json`` state file in ``/workspace/state``
(which is mounted as the ``pulse_state`` Docker volume).

Usage (inside container):
    python3 bake_states.py --out /workspace/state --sepsis-severity 0.70

Design mirrors ``app.py``: we drive the compiled ``PulseScenarioDriver``
binary with a generated ``ScenarioData`` JSON. This avoids the Pulse Python
wrapper, which drags in numpy/pandas at import time.
"""

from __future__ import annotations

import argparse
import json
import logging
import subprocess
import sys
from pathlib import Path

logger = logging.getLogger("bake")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

PULSE_BIN_ROOT = Path("/pulse/bin")
PULSE_SCENARIO_DRIVER = PULSE_BIN_ROOT / "PulseScenarioDriver"


def bake_sepsis(out_dir: Path, severity: float) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    work_dir = out_dir / "bake-runtime"
    work_dir.mkdir(parents=True, exist_ok=True)

    state_path = out_dir / f"sepsis_{severity:.2f}.json"
    scenario_path = work_dir / f"bake_sepsis_{severity:.2f}.json"
    log_path = work_dir / f"bake_sepsis_{severity:.2f}.log"

    scenario = {
        "Scenario": {
            "Name": f"BakeSepsis_{severity:.2f}",
            "Description": f"Cold-init StandardMale with Sepsis severity={severity:.2f}",
            "PatientConfiguration": {
                "PatientFile": "./patients/StandardMale.json",
                "Conditions": {
                    "AnyCondition": [
                        {
                            "PatientCondition": {
                                "Sepsis": {
                                    "Severity": {"Scalar0To1": {"Value": severity}}
                                }
                            }
                        }
                    ]
                },
            },
            # AdvanceTime is required for Pulse to stabilize the Conditions
            # into the patient's steady state. Canonical Sepsis.json uses 2min.
            # Without it, the engine cold-inits with sepsis flagged but never
            # manifests the septic hemodynamic profile on load.
            "AnyAction": [
                {"AdvanceTime": {"Time": {"ScalarTime": {"Value": 2.0, "Unit": "min"}}}},
                {
                    "SerializeState": {
                        "Mode": "Save",
                        "Filename": str(state_path),
                    }
                },
            ],
        }
    }
    scenario_path.write_text(json.dumps(scenario, indent=2) + "\n", encoding="utf-8")

    logger.info("driver=%s scenario=%s", PULSE_SCENARIO_DRIVER, scenario_path)
    logger.info("cold init with sepsis severity=%.2f (several minutes expected)", severity)
    result = subprocess.run(
        [str(PULSE_SCENARIO_DRIVER), str(scenario_path)],
        cwd=str(PULSE_BIN_ROOT),
        capture_output=True,
        text=True,
    )
    log_path.write_text(
        f"returncode={result.returncode}\nstdout:\n{result.stdout}\nstderr:\n{result.stderr}\n",
        encoding="utf-8",
    )

    if not state_path.exists():
        logger.error("driver did not serialize state file: %s", state_path)
        logger.error("see %s for driver output", log_path)
        sys.exit(1)

    logger.info("baked %s", state_path)
    logger.info("scenario references: %s", f"./state/{state_path.name}")
    return state_path


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="/workspace/state")
    ap.add_argument("--sepsis-severity", type=float, default=0.7)
    args = ap.parse_args()

    bake_sepsis(Path(args.out), severity=args.sepsis_severity)


if __name__ == "__main__":
    main()
