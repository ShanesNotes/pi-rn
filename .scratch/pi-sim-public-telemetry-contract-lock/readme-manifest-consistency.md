# README / lane-manifest consistency check

Status: needs-triage
Date: 2026-05-03
Parent issue: `.scratch/pi-sim-public-telemetry-contract-lock/issues/02-lock-readme-manifest-consistency.md`

## Purpose

This check proves the public telemetry README and lane manifest agree on the current public telemetry Interface at the lane-path and manifest-shape level. It is read-only and reports mismatches instead of changing public telemetry schema semantics.

## Runnable check

Run from `pi-sim/`:

```bash
python3 ../.scratch/pi-sim-public-telemetry-contract-lock/checks/verify-readme-manifest-consistency.py
```

Machine-readable form:

```bash
python3 ../.scratch/pi-sim-public-telemetry-contract-lock/checks/verify-readme-manifest-consistency.py --json
```

## What it verifies

- `.lanes.json` has the required top-level keys: `schemaVersion`, `producer`, `resetSemantics`, and `lanes`.
- Every lane has `name`, `path`, `artifactKind`, `schemaVersion`, `writeSemantics`, `resetSemantics`, `producer`, and `preferredConsumerMode`.
- Lane names and paths are unique.
- Every lane path appears in `vitals/README.md`, or the README explicitly documents that path as not consumer-facing.
- `writeSemantics` is an array of strings.
- `schemaVersion` and optional `recordSchemaVersion` are integers.

## Current result

```text
README / lane manifest consistency check
pi-sim root: /home/ark/pi-rn/pi-sim
lanes checked: 10
- current: current.json (README path OK)
- timeline-compat-array: timeline.json (README path OK)
- timeline-append-jsonl: timeline.jsonl (README path OK)
- status: status.json (README path OK)
- events: events.jsonl (README path OK)
- encounter-current: encounter/current.json (README path OK)
- assessments-status: assessments/status.json (README path OK)
- assessments-current: assessments/current.json (README path OK)
- waveforms-status: waveforms/status.json (README path OK)
- waveforms-current: waveforms/current.json (README path OK)
mismatches: none
```

## Non-goals

- This check does not change public telemetry schema semantics.
- This check does not inspect hidden `pi-sim` provider/scenario/validation internals.
- This check does not import sibling project internals.
- Fixture shape validation remains a separate consumer-regression concern.
