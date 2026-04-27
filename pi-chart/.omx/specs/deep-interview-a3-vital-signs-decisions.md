# Deep Interview Spec — A3 Vital Signs Decisions

## Metadata

- Profile: standard
- Context type: brownfield
- Final ambiguity: 8% (threshold 20%)
- Context snapshot: `.omx/context/a3-vital-signs-decision-interview-20260426T181414Z.md`
- Transcript: see latest `.omx/interviews/a3-vital-signs-decision-interview-*.md`
- Source prompt bundle: `.omx/specs/deep-interview-a3-vital-signs-blocking-questions.md`
- Direct implementation performed: none

## Intent

Convert the seven A3 vital-signs blocker prompts into actionable architecture/product decisions with GPT recommendations and user confirmation. These decisions should guide downstream planning or implementation without reopening the full research prompt bundle.

## Desired outcome

A decision-ready A3 vital-signs spec covering oxygen context, alarm/artifact semantics, stream identity, cadence/staleness, early-warning scores, pi-sim ingest boundaries, and metric registry/shared-metric rules.

## In scope

- Decision capture and downstream handoff guidance.
- Brownfield alignment with existing A3 docs and open-schema questions.
- Implementation implications for schemas, validators, fixtures, views, and ingest boundaries.

## Out of scope / non-goals

- No direct code edits in this deep-interview pass.
- No exhaustive external clinical policy research.
- No UI/prototype polish.
- No implementation minutiae such as helper names or local factoring.

## Decision boundaries

OMX/GPT may use these user-confirmed decisions as requirements source of truth for downstream planning. Downstream agents may refine implementation details, tests, and file-level changes, but should not silently reverse these decisions without surfacing a conflict.

## Final decisions

### D1 — Oxygen-delivery context

Adopt `segment-canonical-axis-context`.

- Inline SpO₂ context remains allowed for migration/read convenience.
- Active `observation.context_segment{segment_type:"o2_delivery"}` is canonical for oxygen-delivery context.
- Inline-vs-segment disagreement should warn during migration.
- Add `currentState(axis:"context")` to expose active context segments.

Implementation implications:

- `schemas/vitals.schema.json`: allow inline context but do not make it sole source of truth.
- `src/views/currentState.ts`: add context axis or equivalent discriminated return shape.
- Validators: V-VITAL-03 checks SpO₂ has inline context or covering context segment; V-VITAL-06 warns on disagreement.
- Fixtures: migrate toward context segments while preserving inline legacy examples.

### D2 — Alarm, artifact, and alarm-pause architecture

Adopt `hybrid-derived-plus-audit-events`.

- Real-time alarm state is derived from latest valid/questionable vitals plus active `intent.monitoring_plan` / alert policy.
- Canonical alert events are written only for sustained, actioned, or audit-relevant alarm episodes.
- Invalid samples remain in `vitals.jsonl` with structured `quality.{state, flags}`.
- `observation.device_artifact` is emitted only when an artifact materially affected care/workflow/audit.
- `action.alarm_pause` remains a canonical action that resolves/suspends an alert or monitoring-plan alarm obligation.

Implementation implications:

- Avoid alert event spam for every frame.
- OL-VITAL-03 can use derived live state and canonical audit events.
- Device artifacts can explain why an alarm was false or why a sample was excluded.
- Structured quality migration is required.

### D3 — Stream sample identity, correction, and fulfillment

Adopt `sample-key-plus-window-summary`.

- Add deterministic `sample_key` to stream rows for targeted correction/refutation.
- Continue using `vitals://` windows for ordinary evidence citations.
- Allow optional `observation.vital_sign.data.summarizes_window` events when a disputed, corrected, or fulfilled window deserves event-level representation.
- Do not introduce new URI link kinds such as `links.refutes_window` / `links.fulfills_window` yet.

Implementation implications:

- `schemas/vitals.schema.json`: add `sample_key` or deterministic generation contract.
- Correction/refutation events can target `sample_key` or summarize a `vitals://` window.
- Routine continuous monitoring fulfillment remains derived; one-shot measurements still use action/event patterns.

### D4 — Cadence, staleness, and alarm-triggered monitoring

Adopt `orders-baseline-alarms-trigger-temporary-plan`.

- Baseline monitoring cadence follows explicit orders / `intent.monitoring_plan`.
- No global hard-coded cadence should be treated as universal truth.
- Alarm episodes may create or activate temporary reassessment/monitoring obligations, e.g. q15 reassess until cleared/resolved.
- Live missed cadence creates open loops rather than invalid chart state.
- Replay and strict-replay modes may escalate warnings/errors when time is fixed and cadence windows can be evaluated deterministically.

Implementation implications:

- Monitoring-plan payload should support required cadence, alert policy, temporary/triggered status, and resolution conditions.
- OL-VITAL-01/02/03 should distinguish stream gaps, ordered cadence misses, and unresolved alarms/reassessment obligations.
- Fixture defaults may include q15 post-alarm/reassessment examples, but the source of authority is the plan/order/triggered obligation.

### D5 — Early-warning scores

Adopt `derived-live-store-acted-on`.

- Compute NEWS2/MEWS/qSOFA live as derived state.
- Store `assessment.subtype = "risk_score"` only when a clinician/agent asserts, reviews, or acts on the score.
- Stored risk-score payload should include algorithm, algorithm_version, score, parameter_snapshot, reasoned_asOf/time basis, and `links.supports` to vitals windows / other evidence.
- If a monitoring plan or alert policy declares a score-threshold response, crossing it without review/response can open a loop.

Implementation implications:

- Avoid event volume from storing every computed score.
- Preserve audit snapshot for acted-on scores.
- Track cross-artifact dependencies such as LOC and UOP without making A3 their canonical author.

### D6 — pi-sim vitals ingest boundary and encounter resolution

Adopt `adapter-translates-chart-resolves-encounter`.

- pi-chart ingest adapter owns translation from pi-sim VitalFrame fields into chart `vitals.jsonl` names/units/context/quality/sample_key.
- pi-sim remains a source/public interface and should not be forced to emit chart-schema-shaped rows.
- `encounter_id` is resolved by chart ingest from PatientScope/session/chart.yaml unless explicitly supplied by the chart tool boundary.
- pi-sim should not own chart encounter identity.

Implementation implications:

- Adapter tests should cover name/unit mapping, source.kind/source.ref, quality mapping, context mapping, sample_key generation, and encounter scoping.
- Patient isolation remains chart/tool responsibility.
- `vitals://<encounter>` resolution depends on chart-owned encounter identity.

### D7 — Vital metric registry and shared lab/vital metrics

Adopt `registry-now-a1-canonical-profile-routed-sim`.

- Add a canonical vital metric registry now for `vitals.jsonl.name` and `observation.vital_sign.data.name` joins and LOINC mapping.
- Drawn ABG/lactate/Hgb remain A1-canonical lab observations.
- A3 may carry simulator-derived ABG-like values only when explicitly profile-routed/training-labeled.
- Clinical evidence should not imply real continuous ABG/lactate measurement.

Implementation implications:

- Introduce registry/schema guidance for metric names and units.
- `trend()` should avoid silently unioning A1 canonical labs with A3 simulator/training streams unless explicitly requested/profiled.
- Source/profile labels are mandatory for simulated ABG-like A3 values.

## Acceptance criteria for downstream work

- A downstream plan can map each decision to schema, validator, fixture, view, and ingest work items.
- No downstream work treats inline oxygen context as canonical over active context segments.
- No downstream work emits per-frame alert events.
- No downstream work removes bad-sample correction addressability after accepting `sample_key`.
- Cadence behavior follows orders/plans and triggered obligations, not hidden global defaults.
- Early-warning score storage is limited to acted-on/reviewed/asserted scores.
- pi-sim remains decoupled from chart schema and chart encounter identity.
- Metric registry exists before strict validation of vital names/units.

## Suggested handoff

Recommended next step: `$ralplan` on this spec to produce PRD/test-spec artifacts before implementation, because decisions cut across schemas, validators, fixtures, views, ingest, and documentation.

Potential execution lanes after planning:

1. Schema + validator lane.
2. Views/openLoops lane.
3. Fixture/migration lane.
4. pi-sim ingest adapter boundary lane.
5. Docs/ADR/open-schema promotion lane.
