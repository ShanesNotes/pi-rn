# Docs, manifest, and fixture closeout

Date: 2026-05-04
Issue: `.scratch/pi-sim-public-telemetry-publication-module/issues/06-docs-manifest-fixture-closeout.md`

## Scope

Closeout for public telemetry publication documentation, lane manifest consistency, fixture posture, and consumer-style public contract checks after Issues 01/04/02/03/05.

This closeout does not change public lane names, paths, schema versions, JSON/JSONL semantics, sibling consumer contracts, or hidden runtime behavior.

## Decisions applied

- `pi-sim/vitals/README.md` now names itself plus `pi-sim/vitals/.lanes.json` as the public Interface authority.
- `.omx/plans/*` is no longer described as current ABI authority; active producer planning is directed to `.scratch/<feature>/PRD.md` and `.scratch/<feature>/issues/*.md` per ADR 004.
- Provider-unavailable fallback documentation now matches the locked behavior: terminal `provider_unavailable`, no terminal `run_ended`, stale optional current files cleared, and unavailable assessment/waveform status reasons set to `provider_unavailable`.
- Legacy `scripts/monitor.ts` is documented as scalar/latest-frame and compatibility-timeline scoped; provider-runtime JSONL/event/encounter/assessment/waveform semantics remain owned by the shared provider runtime and publisher.
- Fixture README now states that fixtures are regression evidence only and that fixture/fixture-reader changes require `npm test --prefix pi-sim` from the repository root.
- Agent boundary now forbids sibling consumers from reading hidden scenarios, provider source, Pulse internals, scripted action schedules, hidden findings, scoring keys, or future simulation truth.

## Manifest consistency audit

`pi-sim/vitals/.lanes.json` was reviewed and did not require edits. Every manifest lane path remains named in `pi-sim/vitals/README.md`:

| Lane | Path | README coverage |
| --- | --- | --- |
| `current` | `current.json` | yes |
| `timeline-compat-array` | `timeline.json` | yes |
| `timeline-append-jsonl` | `timeline.jsonl` | yes |
| `status` | `status.json` | yes |
| `events` | `events.jsonl` | yes |
| `encounter-current` | `encounter/current.json` | yes |
| `assessments-status` | `assessments/status.json` | yes |
| `assessments-current` | `assessments/current.json` | yes |
| `waveforms-status` | `waveforms/status.json` | yes |
| `waveforms-current` | `waveforms/current.json` | yes |

## Fixture safety audit

The public-contract reader now enforces fixture-payload denial of:

- hidden scenario truth markers
- scoring keys
- future findings
- expected nurse/chart completion ids
- runtime import paths
- sibling project paths
- Pulse path references

The reader also generically checks any fixture `waveforms/current.json` with samples for explicit `sourceKind`, `fidelity`, and `synthetic` labels, and requires matching labels in `waveforms/status.json`. The current positive waveform fixture remains `sourceKind: "demo"`, `fidelity: "demo"`, `synthetic: true`.

Fixtures remain examples/regression evidence only; this closeout does not promote fixtures into ABI authority.

## Verification evidence

- `npm test --prefix pi-sim` — passed.
  - `tsc --noEmit` — passed.
  - `tsx scripts/runtime/test.ts` — `runtime tests passed`.
  - `tsx scripts/validate-scripted.ts` — `scripted scenario validation passed (3 scenarios)`.
  - `tsx scripts/public-contract-reader-test.ts` — `public contract reader checks passed`.

## Follow-up

No source Module extraction is authorized by this closeout. Keep future public publication work in the issue lane unless a durable ADR trigger is accepted.
