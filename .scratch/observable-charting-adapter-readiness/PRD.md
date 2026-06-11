# PRD: Observable charting adapter readiness

Status: completed
Owner: workspace
Date: 2026-05-03
Source readiness artifact: `.scratch/pi-sim-public-telemetry-contract-lock/ingest-adapter-readiness.md`

## Problem Statement

The project needs a safe planning lane for a future telemetry-to-chart adapter
between public `pi-sim` vital-sign telemetry and Observable charting flows. The
adapter is not ready for implementation because producer ABI authority and
chart-write authority must stay separate, and the parallel `pi-chart` rebase has
not yet named stable chart-write ownership.

Without a dedicated readiness lane, future agents may jump from public monitor
frames directly to chart truth, read hidden simulator internals, infer patient
identity from weak context, or let `pi-agent` silently attest clinical values.
That would violate the project boundary between observable device data, draft
flowsheet staging, and validated chart truth.

## Solution

Create a contract/readiness-only lane under
`.scratch/observable-charting-adapter-readiness/`. This lane promotes the
HITL-approved decisions from the public telemetry ABI-lock work into a future
adapter PRD and issue queue without creating `pi-rn/ingest/`, changing public
telemetry schemas, writing chart records, or promoting `pi-chart` ADRs before
post-rebase ownership is known.

The target future workflow is:

1. Public telemetry frames supply already-observed device data.
2. A future adapter may stage draft/unvalidated flowsheet values for
   retrospective times only.
3. Drafts preserve source provenance, replay identity, quality flags, and
   mapping state.
4. Human clinician/user validation is required before any value becomes final
   chart truth.
5. `pi-agent` may prepare review bundles, summarize gaps/outliers, and assist
   validation, but it must not silently validate or attest.

## User Stories

- As a charting adapter planner, I can distinguish public telemetry evidence
  from hidden simulator truth before designing an ingest seam.
- As a `pi-chart` maintainer, I can review draft flowsheet policy requirements
  after the rebase without inheriting premature ADR decisions.
- As a clinician/user validation designer, I can see which values are drafts,
  which are validated, and what provenance supports each decision.
- As a `pi-agent` boundary reviewer, I can confirm agent assistance remains
  review/preparation only and never replaces human attestation.
- As a future implementer, I can split schema, mapping, replay, staging, and
  validation proofs without creating one broad ingest task.

## Public telemetry inputs eligible for readiness planning

Only already-observed public telemetry lanes may be considered. Hidden
`pi-sim` internals are never inputs.

| Lane | Readiness posture | Notes |
| --- | --- | --- |
| `timeline.jsonl` | Primary scalar replay source | Durable append-friendly history for retrospective minute-level selection. |
| `events.jsonl` | Trigger/context source | Public alarms may trigger draft staging; other public events may annotate context. |
| `status.json` | Run/freshness context only | Run state, sequence, and freshness context are not chart truth by themselves. |
| `encounter/current.json` | Public encounter context | May support explicit patient/encounter mapping; not enough for heuristic identity matching alone. |
| `assessments/status.json` | Context only | Reveal/request state may annotate drafts; it does not create vitals rows. |
| `assessments/current.json` | Reveal-safe context only | Revealed public assessment output may support review context, not hidden-truth input. |
| `current.json` | Smoke/read-latest only | Useful for compatibility checks, not durable ingest or replay authority. |
| `timeline.json` | Deferred | Compatibility array; prefer `timeline.jsonl` for replay and idempotency. |
| `waveforms/status.json` | Deferred for chart ingest | May later flag waveform/artifact availability; waveform chart policy is future work. |
| `waveforms/current.json` | Deferred for chart ingest | Preserve a future path for sub-minute waveform and arterial-line provenance. |

## Draft staging policy seed

- Draft staging is retrospective only. Target chart times must be at or before
  the latest already-emitted public telemetry boundary.
- Future schedules, latent findings, scoring keys, provider internals, scenario
  secrets, and hidden simulator state are forbidden inputs.
- Initial auto-staging triggers are routine ordered cadence plus public alarms
  only.
- Encounter, assessment, and run-state events may provide context but must not
  create vitals rows by themselves in v1.
- V1 drafts target minute-level scalar values while preserving a future path for
  sub-minute waveform and arterial-line artifact review.
- The selection policy seed is
  `nearest_valid_sample_at_or_before_target_time` within an accepted tolerance.
- If no valid public sample exists, the future adapter should stage a missing
  value with an explicit reason such as `no_public_sample_in_window`.
- Publicly observed artifact or erroneous monitor values should be staged with
  quality flags when they are available; they must not be silently discarded,
  corrected, or normalized away.

## Chart-write policy memo seed

This memo seed is not a `pi-chart` ADR. Do not promote it to a `pi-chart` ADR
until after the `pi-chart` rebase names stable chart-write ownership, authority
files, and verification commands.

### Draft flowsheet observations

A draft observation is an unvalidated staging record. It may contain selected
public telemetry values, missing-value reasons, quality flags, and context, but
it is not chart truth and must remain visibly unvalidated.

Minimum draft fields to resolve later:

- patient/encounter mapping state;
- metric name, value, unit, and effective chart time;
- selected source sample identity and source lane;
- selection policy, tolerance, and missing-value reason;
- quality/warning flags;
- adapter name, version, run id, and replay offset;
- review bundle links prepared by a human or `pi-agent` assistant.

### Clinician/user validation

Validated chart truth requires explicit human clinician/user action. Validation
must record validator identity, validation/attestation time, effective chart
time, decision (`accepted_unchanged`, `corrected`, or `rejected`), and a link
back to the draft/source telemetry provenance.

`pi-agent` may assist by summarizing, flagging gaps/outliers, matching drafts to
orders, and preparing review bundles. It must not validate, attest, override
clinician corrections, infer future vitals, or use hidden `pi-sim` internals.

### Provenance

Every draft value needs device-source provenance:

- public lane path;
- source sequence/event index and telemetry timestamp or `simTime_s`;
- metric name, raw value, and unit;
- public encounter id when available;
- selection policy and tolerance;
- quality/warning flags;
- adapter name, version, and run id.

Every validated value needs chart-validation provenance:

- clinician/user validator identity;
- validation/attestation time;
- effective chart time;
- validation decision;
- link back to draft/source telemetry provenance;
- optional `pi-agent` assist/review provenance when an agent prepared the bundle.

### Idempotency

Draft identity should be deterministic from explicit patient/encounter mapping,
metric, effective chart time, selected source sample identity, source lane, and
adapter version. Re-running a future adapter should update the same draft rather
than create duplicates.

Validated chart truth must not be overwritten by later ingest. Corrections or
rejections must be append-only review/correction events that preserve the
original draft and validation history.

### Patient/encounter mapping and staging queues

Explicit mapping is required before patient-scoped chart writes. Allowed mapping
inputs are exposed public encounter context, clinician/user-selected patient and
encounter, and explicit test-harness mapping for a simulation run.

Forbidden identity inputs include bed-label guessing alone, hidden scenario ids,
provider internals, latent patient truth, future schedules, and hidden simulator
state. If mapping is missing, monitor vitals may enter an unassigned staging
queue only; they must not become patient chart truth until mapped and validated.

### Replay offsets

Future implementation must define durable replay state before code exists:

- offset/key strategy for `timeline.jsonl` and `events.jsonl`;
- handling of per-run resets described by `.lanes.json`;
- behavior when source files are replaced, truncated, or replayed;
- replay idempotency across adapter restarts;
- protection for already validated chart truth during replay.

## Required `pi-chart` review before writes

Before any implementation or chart-write issue is created, a post-rebase owner
must read and either reuse or extend these chart authority surfaces:

- `pi-chart/CONTEXT.md` for chart truth, patient scope, write boundary, and
  provenance invariants;
- `pi-chart/docs/adr/006-source-kind-taxonomy.md` for source kinds such as
  `monitor_extension`, `clinician_chart_action`, and `agent_review`;
- `pi-chart/docs/adr/010-evidence-ref-roles.md` for `vitals_window` evidence
  references and selection metadata;
- `pi-chart/docs/adr/011-transform-activity-provenance.md` for transform
  blocks, adapter run ids, and input refs;
- `pi-chart/docs/adr/017-actor-attestation-review-taxonomy.md` for append-only
  review/attestation events and human verification semantics.

A future owner may create a new `pi-chart` ADR only if the post-rebase event or
profile vocabulary cannot represent draft flowsheet observations and clinician
validation without ambiguity.

## Initial issue split

The initial issues are contract/readiness-only. They prepare decisions,
fixtures, and review checklists; they do not authorize ingest implementation or
chart writes.

1. `issues/01-public-lane-eligibility-and-negative-boundaries.md`
2. `issues/02-chart-write-policy-memo-seed.md`
3. `issues/03-mapping-and-unassigned-staging-queue-contract.md`
4. `issues/04-replay-idempotency-and-provenance-contract.md`
5. `issues/05-validation-and-pi-agent-assist-boundary.md`

## Implementation Decisions

- This lane is a planning/readiness lane, not an implementation lane.
- `pi-rn/ingest/` or any equivalent adapter module remains uncreated.
- Public telemetry producer authority stays in `pi-sim/vitals/README.md` and
  `pi-sim/vitals/.lanes.json`.
- Draft staging may be specified only from already-observed public lanes.
- Chart truth requires sanctioned chart APIs and clinician/user validation;
  this lane does not define or call those APIs.
- Chart-write policy remains a PRD/memo seed until the `pi-chart` rebase names
  stable ownership.

## Testing Decisions

This lane is verified structurally and by review because it is documentation
only:

- Confirm all files live under `.scratch/observable-charting-adapter-readiness/`.
- Confirm no `pi-rn/ingest/` directory or adapter implementation exists.
- Confirm no source files or `pi-chart` ADRs are edited by this readiness pass.
- Confirm each issue forbids hidden simulator inputs, chart writes, and final
  attestation without clinician/user validation where relevant.
- Future implementation issues must add lane-specific tests before any adapter
  code is written.

## Out of Scope

- Creating `pi-rn/ingest/` or any equivalent ingest adapter implementation.
- Writing chart truth, draft chart records, or raw `pi-chart` files.
- Changing `pi-sim/vitals/*` public telemetry producer schemas.
- Reading hidden `pi-sim` scripts, providers, Pulse internals, validation-only
  evidence, latent findings, scoring keys, scenario secrets, or future
  schedules as adapter inputs.
- Treating `pi-monitor` display internals as chart authority.
- Using `pi-agent` private reasoning or hidden context as source telemetry.
- Promoting this memo seed to a `pi-chart` ADR before post-rebase ownership.
- Creating current-code-coupled `pi-chart` implementation tasks while the
  rebase ownership is unresolved.

## Further Notes

Primary evidence:

- `.scratch/architecture-deepening-placement/PRD.md`
- `.scratch/architecture-deepening-placement/issues/03-create-observable-charting-adapter-readiness-prd.md`
- `.scratch/pi-sim-public-telemetry-contract-lock/ingest-adapter-readiness.md`
- `.scratch/pi-sim-public-telemetry-contract-lock/issues/04-defer-ingest-adapter-readiness.md`
- `pi-sim/vitals/README.md`
- `pi-sim/vitals/.lanes.json`
- `pi-chart/CONTEXT.md`
- `pi-chart/docs/adr/006-source-kind-taxonomy.md`
- `pi-chart/docs/adr/010-evidence-ref-roles.md`
- `pi-chart/docs/adr/011-transform-activity-provenance.md`
- `pi-chart/docs/adr/017-actor-attestation-review-taxonomy.md`
