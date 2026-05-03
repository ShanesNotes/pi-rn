# Make display-only authority boundary scans durable

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-monitor-public-lane-ingest-depth/PRD.md`

## What to build

Promote boundary scanning into the normal `pi-monitor` verification story so future ingest changes cannot accidentally couple to hidden simulator internals, `pi-agent`, `pi-chart`, producer writes, chart/EHR writes, or patient truth.

## Acceptance criteria

- [ ] Boundary scans include `pi-monitor/crates/**/*.rs`, crate manifests, CLI/app entrypoints, and fixture documentation where write/coupling drift is likely.
- [ ] Forbidden inputs include hidden `pi-sim/scripts`, `pi-sim/pulse`, provider internals, hidden scenarios, latent findings, scoring keys, `pi-agent`, and `pi-chart` internals.
- [ ] Forbidden writes include chart/EHR truth, patient truth, producer public lanes, `vitals.jsonl`, and hidden simulator state.
- [ ] Scan failures explain the authority boundary and do not recommend adding chart-write exceptions inside `pi-monitor`.
- [ ] The scan can be run locally without network access or hidden runtime services.

## Blocked by

Maintainer triage of `.scratch/pi-monitor-public-lane-ingest-depth/PRD.md`.

## Closeout commands

```bash
cd pi-monitor
python3 ../.scratch/pi-sim-public-telemetry-contract-lock/checks/verify-pi-monitor-public-consumer.py
cargo test --workspace
```
