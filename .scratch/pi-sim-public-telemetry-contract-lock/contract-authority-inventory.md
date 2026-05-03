# Public telemetry contract authority inventory

Status: needs-triage
Date: 2026-05-03
Parent issue: `.scratch/pi-sim-public-telemetry-contract-lock/issues/01-inventory-contract-authority.md`

## Authority statement

The producer-side public telemetry Interface authority is:

- `pi-sim/vitals/README.md` — public file/schema prose, boundary rules, run modes, fixture policy, and consumer guidance.
- `pi-sim/vitals/.lanes.json` — machine-readable lane manifest: lane names, paths, schema versions, write/reset semantics, producers, and preferred consumer modes.

Regression examples under `pi-sim/vitals/fixtures/public-contract/**` are consumer evidence only. They are not a second ABI authority and must not be treated as a replacement for the README plus lane manifest.

## Boundary exclusions

This inventory intentionally excludes hidden `pi-sim` internals: provider code, scenario secrets, latent findings, validation-only evidence, Pulse internals, and sibling source trees. Consumer Modules should read mounted public artifacts, not simulator Implementation depth.

## Lane manifest inventory

Manifest schema version: `1`
Manifest producer: `pi-sim provider runtime`
Manifest reset semantics: PublicTelemetryPublisher resets per-run append lanes on construction; latest-state lanes are overwritten atomically and optional current lanes clear stale files when unavailable.

| Lane | Path | Artifact kind | Schema | Write semantics | Reset semantics | Producer | Preferred consumer mode | README path coverage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `current` | `current.json` | latest-frame | `1` | atomic-rename, overwrite-latest | overwritten on each published frame | PublicTelemetryPublisher.publish | `read-latest` | yes |
| `timeline-compat-array` | `timeline.json` | frame-history-compat-array | `1 / record 1` | atomic-rename, whole-file-rewrite, compat-array | publisher instance starts a new in-memory history and rewrites this file | PublicTelemetryPublisher.publish | `compat-array` | yes |
| `timeline-append-jsonl` | `timeline.jsonl` | frame-history-jsonl | `1 / record 1` | append-jsonl, reset-on-construction | removed by PublicTelemetryPublisher constructor before appending run-local frames | PublicTelemetryPublisher.publish | `tail-jsonl` | yes |
| `status` | `status.json` | latest-run-status | `1` | atomic-rename, overwrite-latest | overwritten on each published frame | PublicTelemetryPublisher.publish | `read-latest` | yes |
| `events` | `events.jsonl` | event-history-jsonl | `2 / record 2` | append-jsonl, reset-on-construction | removed by PublicTelemetryPublisher constructor before appending run-local events; eventIndex is per-run and starts at 0 | Runtime runner event lane | `tail-jsonl` | yes |
| `encounter-current` | `encounter/current.json` | latest-encounter-context | `1` | atomic-rename, overwrite-latest, clears-when-unavailable | removed when a provider supplies no public encounter context | PublicTelemetryPublisher.publishEncounter | `read-latest` | yes |
| `assessments-status` | `assessments/status.json` | latest-assessment-status | `1` | atomic-rename, overwrite-latest | overwritten on each frame with current assessment capability/request status | PublicTelemetryPublisher.publishAssessment | `read-latest` | yes |
| `assessments-current` | `assessments/current.json` | latest-revealed-assessment | `1` | atomic-rename, overwrite-latest, clears-when-unavailable | absent until assessment reveal; removed before request, when unavailable, or when a request has no reveal | PublicTelemetryPublisher.publishAssessment | `read-latest` | yes |
| `waveforms-status` | `waveforms/status.json` | latest-waveform-status | `1` | atomic-rename, overwrite-latest | overwritten on every provider-runtime frame with availability truth | PublicTelemetryPublisher.publishWaveform | `read-latest` | yes |
| `waveforms-current` | `waveforms/current.json` | latest-waveform-window | `1` | atomic-rename, overwrite-latest, clears-when-unavailable | absent unless provider supplies waveform samples; removed on unavailable/no-window frames | PublicTelemetryPublisher.publishWaveform | `read-latest` | yes |

## Public contract fixture evidence

Fixture directories documented by `pi-sim/vitals/fixtures/public-contract/README.md`:

| Fixture | Purpose | Authority posture |
| --- | --- | --- |
| `scripted-demo/` | Normal Docker-free scripted run with scalar frames, JSONL lanes, encounter context, assessment reveal, unavailable waveform status, and terminal `run_ended`. | Regression evidence only; README + `.lanes.json` remain authority. |
| `scripted-alarm/` | Docker-free alarm example proving public `alarm_observed` events for `MAP_LOW` and `SPO2_LOW`. | Regression evidence only; README + `.lanes.json` remain authority. |
| `provider-unavailable/` | Deterministic unavailable-provider example. The command is expected to exit non-zero while still writing public unavailable-state files and terminal `provider_unavailable`. | Regression evidence only; README + `.lanes.json` remain authority. |
| `live-demo-waveform/` | Positive ECG Lead II + ABP + pleth + respiration public waveform lane with `sourceKind: "demo"`, `fidelity: "demo"`, `synthetic: true`. | Regression evidence only; README + `.lanes.json` remain authority. |

## README / manifest mismatch check

No lane-path coverage mismatch found: every `.lanes.json` lane path appears in `pi-sim/vitals/README.md`.

Detailed semantic consistency between README prose and each manifest field is intentionally left to `.scratch/pi-sim-public-telemetry-contract-lock/issues/02-lock-readme-manifest-consistency.md`.

## Consumer implications

- `pi-monitor`: may use public files/fixtures for display-only reads; it must not write chart truth, simulator state, patient truth, or public telemetry producer files.
- `pi-chart`: may only ingest public telemetry through an explicit adapter after provenance, idempotency, patient mapping, replay offset, and clinician validation policy are accepted.
- `pi-agent`: may consume only surfaces intentionally mounted/exposed to the bounded agent runtime; it must not inspect hidden simulator internals.
