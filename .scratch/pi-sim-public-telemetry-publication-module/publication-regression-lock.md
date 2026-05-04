# Publication regression lock — Issue 02

Status: completed
Date: 2026-05-04
Parent issue: `.scratch/pi-sim-public-telemetry-publication-module/issues/02-lock-publication-regression-tests.md`
Source map: `.scratch/pi-sim-public-telemetry-publication-module/lane-construction-and-write-semantics-map.md`

## Executive summary

Issue 02 converted the Issue 01/04 planning evidence into executable regression coverage before any internal public telemetry publication Module seam is designed.

The lock preserves the public telemetry authority model: `pi-sim/vitals/README.md` plus `pi-sim/vitals/.lanes.json` remain the public Interface authority, while source tests and public-contract fixtures are regression evidence.

## Locked policy decisions

- Provider-unavailable terminal events keep the public payload shape but use a generic `payload.message: "provider unavailable"` instead of raw provider/shim error messages.
- Provider-unavailable fallback force-clears optional current lanes by skipping optional provider capabilities during fallback publication:
  - `encounter/current.json` is cleared when provider unavailable fallback runs.
  - `assessments/current.json` is cleared and `assessments/status.json.reason` is `provider_unavailable`.
  - `waveforms/current.json` is cleared and `waveforms/status.json.reason` is `provider_unavailable`.
- Fallback publication must still write public scalar/status/event evidence and must not append `run_ended`.
- Optional capability failures during normal publication must not prevent the fallback terminal unavailable event from being written.
- Public-contract fixture denylist coverage includes every public fixture case, including `live-demo-waveform`.

## Source and fixture locks

- `pi-sim/scripts/runtime/runner.ts`
  - Detects provider-unavailable fallback inside the local publish path.
  - Skips encounter, assessment reveal/current, and waveform optional capability calls during provider-unavailable fallback.
  - Emits a sanitized provider-unavailable public message.
- `pi-sim/scripts/runtime/test.ts`
  - Locks sanitized provider-unavailable payloads.
  - Locks stale optional-current clearing for encounter, assessment, and waveform lanes.
  - Locks fallback success when optional capabilities throw during normal publication.
- `pi-sim/scripts/public-contract-reader-test.ts`
  - Locks sanitized public fixture payloads.
  - Locks provider-unavailable assessment status reason.
  - Scans all public fixture cases for hidden key leakage.
- `pi-sim/vitals/fixtures/public-contract/provider-unavailable/**`
  - Fixture now reflects sanitized provider-unavailable event payload and `provider_unavailable` assessment status reason.

## Verification

Required verification command:

```bash
npm test --prefix pi-sim
```

Latest observed result: passed — typecheck, runtime tests, scripted scenario validation, and public contract reader checks all completed successfully.

## Remaining follow-ups

- Issue 06 should reconcile stale README authority wording and clarify legacy `scripts/monitor.ts` compatibility scope.
- Issue 03 may now design a Module Interface only if it preserves these locked public behavior tests or explicitly proposes a reviewed contract change.
