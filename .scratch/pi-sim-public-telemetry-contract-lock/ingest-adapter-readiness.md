# Telemetry-to-chart ingest adapter readiness criteria

Status: needs-triage
Date: 2026-05-03
Parent issue: `.scratch/pi-sim-public-telemetry-contract-lock/issues/04-defer-ingest-adapter-readiness.md`

## Purpose

This artifact records the HITL-approved readiness criteria for a future
`pi-rn/ingest/` or equivalent telemetry-to-chart adapter. It does **not**
authorize creating the ingest module, writing chart events, changing public
telemetry schemas, or exposing hidden `pi-sim` internals.

The target workflow should mimic a clinical runtime: monitor-streamed vitals
are observable device data that can prefill **draft/unvalidated flowsheet
values** for already-observed times. Chart truth is produced only after
clinician/user validation, with `pi-agent` allowed to assist but not silently
attest.

## Current gate

`pi-rn/ingest/` remains uncreated until both are accepted:

1. Public ABI lock: `pi-sim/vitals/README.md` plus
   `pi-sim/vitals/.lanes.json` remain producer-side authority and their
   consistency checks pass.
2. Chart-write policy: a `pi-chart` ADR/PRD explicitly defines draft
   observation shape, validation/attestation semantics, patient/encounter
   mapping, idempotency, replay offsets, and provenance requirements.

## Public telemetry lanes eligible for consideration

Initial ingest design may consider only already-observed public telemetry.
Hidden `pi-sim` internals are never inputs.

| Lane | Initial posture | Rationale |
| --- | --- | --- |
| `timeline.jsonl` | Primary scalar replay source | Append-friendly public frame history supports retrospective minute-level selection without future peeking. |
| `events.jsonl` | Trigger/context source | Public alarms can trigger draft staging; lifecycle/action/assessment events may provide context. |
| `status.json` | Run/freshness context only | Supplies run state, sequence, and freshness context; not clinical observation truth by itself. |
| `encounter/current.json` | Public encounter context | May help explicit patient/encounter mapping when exposed; never sufficient for heuristic identity matching by itself. |
| `assessments/status.json` | Context only | Reveal/request state may annotate drafts; it does not create vitals rows by itself. |
| `assessments/current.json` | Reveal-safe context only | Revealed assessment output may support review context; it is not a hidden-truth input. |
| `current.json` | Smoke/read-latest only, not durable ingest | Useful for compatibility checks, but latest-frame state is not the durable replay source. |
| `timeline.json` | Defer | Compatibility array; prefer `timeline.jsonl` for replay/idempotency. |
| `waveforms/status.json` | Defer chart ingest | May flag waveform availability/artifact context, but waveform/arterial-line chart policy is future work. |
| `waveforms/current.json` | Defer chart ingest | Preserve future path for sub-minute/waveform/arterial-line provenance; do not make it chart truth in v1. |

## HITL-approved v1 draft staging policy

- Draft staging is **retrospective only**: target times must be at or before
  the latest already-emitted public telemetry boundary. No future EHR columns,
  scenario schedules, latent findings, scoring keys, or provider internals may
  be used.
- Initial auto-staging triggers are **routine ordered cadence plus public alarms only**.
- Encounter, assessment, and run-state events may provide context but must not
  create vitals rows by themselves in v1.
- V1 draft vitals target **minute-level scalar values** while preserving a
  future path for sub-minute waveform and arterial-line artifact review.
- Selection policy is `nearest_valid_sample_at_or_before_target_time` within
  an accepted tolerance. If no valid public sample exists, stage a missing
  value with reason such as `no_public_sample_in_window`.
- Observed artifact/erroneous monitor values should be staged with quality flags
  when publicly observable; they must not be silently discarded or corrected.
- `pi-agent` may summarize, flag gaps/outliers, match drafts to orders, and
  prepare validation bundles. Human clinician/user validation remains required
  for final chart truth.

## Chart-write policies that must be accepted before implementation

Future implementation must resolve these in `pi-chart` authority surfaces before any chart writes:

### Provenance

Every draft value needs device-source provenance:

- public lane path, e.g. `timeline.jsonl`;
- source sequence/event index and telemetry timestamp / `simTime_s`;
- metric name, raw value, and unit;
- source public encounter id if available;
- selection policy and tolerance;
- quality/warning flags;
- adapter name, version, and run id.

Every validated value needs chart-validation provenance:

- clinician/user validator identity;
- validation/attestation time;
- effective chart time;
- validation decision: accepted unchanged, corrected, or rejected;
- link back to draft/source telemetry provenance;
- optional `pi-agent` assist/review provenance when an agent prepared the bundle.

### Idempotency

Draft identity should be deterministic from patient/encounter mapping, metric,
effective chart time, selected source sample identity, source lane, and adapter
version. Re-running ingest should update the same draft rather than create
duplicates.

Validated chart truth must not be overwritten by later ingest. Corrections or
rejections must be append-only review/correction events that preserve the
original draft and validation history.

### Patient/encounter mapping

Explicit patient/encounter mapping is required before patient-scoped chart writes. Allowed mapping inputs are:

- exposed public encounter context;
- clinician/user-selected patient and encounter;
- explicit test-harness mapping for a simulation run.

Forbidden identity inputs include bed-label guessing alone, hidden scenario
ids, provider internals, latent patient truth, future schedules, and any hidden
simulator state.

If mapping is missing, monitor vitals may enter an **unassigned staging queue only**.
They must not become patient chart truth until mapped and validated.

### Replay offsets

The future adapter must define durable replay state before implementation:

- offset/key strategy for `timeline.jsonl` and `events.jsonl`;
- handling of per-run resets described by `.lanes.json`;
- behavior when source files are replaced, truncated, or replayed;
- replay idempotency across adapter restarts;
- how already validated chart truth is protected from replay mutation.

### Clinician validation and pi-agent role

Final chart truth requires human clinician/user action. `pi-agent` may assist
as a reviewer/preparer, but it must not silently validate, override clinician
corrections, infer future vitals, use hidden `pi-sim` internals, or create
final attestation without clinician/user action.

## Required pi-chart review before writes

Before implementation, read and either reuse or extend these authority surfaces:

- `pi-chart/CONTEXT.md` — Observable charting seam, chart truth, patient scope, write boundary, and provenance invariants.
- `pi-chart/docs/adr/006-source-kind-taxonomy.md` — `monitor_extension`, `clinician_chart_action`, and `agent_review` source kinds.
- `pi-chart/docs/adr/010-evidence-ref-roles.md` — `vitals_window` evidence references and selection metadata.
- `pi-chart/docs/adr/011-transform-activity-provenance.md` — `transform` block, adapter run id, and input refs.
- `pi-chart/docs/adr/017-actor-attestation-review-taxonomy.md` — append-only review/attestation events and human verification semantics.

A future adapter may need a new `pi-chart` ADR if the existing event/profile
vocabulary cannot represent draft flowsheet observations and clinician
validation without ambiguity.

## Forbidden inputs and writes

The adapter must not read or depend on:

- hidden `pi-sim` scripts, providers, Pulse internals, validation-only evidence, latent findings, scoring keys, scenario secrets, or future scheduled events;
- `pi-monitor` display internals as chart authority;
- `pi-chart` raw files outside sanctioned write APIs;
- `pi-agent` private reasoning or hidden context as source telemetry.

The adapter must not write:

- canonical chart truth without accepted chart-write policy and clinician validation;
- `pi-sim/vitals/*` producer files;
- `vitals.jsonl` or any monitor-owned producer artifact;
- hidden simulator state.

## Minimum future implementation issue split

When implementation is approved, create separate issues rather than one broad ingest task:

1. Draft schema/ADR: define draft flowsheet observation and validation event shapes in `pi-chart` authority surfaces.
2. Mapping proof: explicit patient/encounter mapping fixture with unmapped staging queue behavior.
3. Replay/idempotency proof: `timeline.jsonl` offset/idempotency test without chart writes.
4. Draft staging proof: minute-level scalar drafts from routine cadence and alarm triggers only.
5. Validation proof: human clinician/user validation converts drafts to chart truth through sanctioned chart APIs.

## Acceptance posture for this issue

Issue 04 is complete when this readiness artifact exists, names lane
eligibility, lists unresolved chart-write policy gates, forbids hidden
simulator inputs, requires `pi-chart` review before writes, and leaves
`pi-rn/ingest/` uncreated.
