# Deep Interview Spec — A3 Vital Signs HITL Blocking Prompts

## Metadata

- Profile: standard
- Context type: brownfield
- Final ambiguity: 14% (threshold 20%)
- Context snapshot: `.omx/context/a3-vital-signs-blocking-questions-20260426T175303Z.md`
- Transcript: see latest `.omx/interviews/a3-vital-signs-blocking-questions-*.md`
- Direct implementation performed: none

## Intent

Surface the current A3 vital-signs decisions that should be answered by the project owner / clinician / HITL reviewer before more durable A3 implementation work proceeds. The output is optimized to unblock another agent without duplicating its implementation work.

## Desired outcome

A prioritized bundle of user-runnable HITL / research prompts. Each blocker uses a two-part structure:

1. **Neutral prompt** — asks the decision without biasing the research/HITL answer.
2. **Repo-lean note** — separately records what the current repo appears to lean toward so agents can plan safely while waiting.

## In scope

- A3 vital-signs HITL decisions and owner decisions visible from repo evidence.
- Questions whose answer unlocks multiple workstreams: schema/validator, views, fixtures, pi-sim ingest, open-loop behavior, and documentation/ADR promotion.
- Research-dependent topics framed as prompts for the user to run separately.

## Out of scope / non-goals

- No direct code edits.
- No exhaustive external policy research in this pass.
- No reopening accepted directions unless new evidence conflicts.
- No UI/prototype polish questions as first-class blockers.
- No implementation minutiae such as helper names, test file names, or local factoring.

## Decision boundaries

OMX may:

- Rank blocker prompts by downstream unlock value.
- Distinguish HITL-required decisions from agent-safe defaults.
- Include repo evidence and a separated repo-lean note.
- Phrase research as prompts the user can run elsewhere.

OMX should not:

- Treat the repo lean as a final clinical/policy decision.
- Perform the separate deep-research work itself in this pass.
- Implement A3 schema/view changes under deep-interview.

## Brownfield evidence vs inference

Evidence:

- `clinical-reference/phase-a/a3-vital-signs-synthesis.md` §16 lists five A3 open schema questions.
- `clinical-reference/phase-a/a3-open-schema-entries-synthesis.md` details options and researcher leans for A3-Q1 through A3-Q5.
- `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md` summarizes A3 status; `a3-oxygen-context` and `a3-alarm-and-artifact-events` remain open, while `a3-shared-metrics` is marked accepted direction in the status table.
- `docs/plans/phase-a-status-matrix.md` says A3 synthesis artifacts are source input and should be promoted only after HITL selection.
- `ROADMAP.md` still marks pi-sim vitals schema ↔ ingest translator and encounter_id resolution as open seams.
- `schemas/vitals.schema.json` currently lacks `recorded_at` as a required field and still models `quality` as a scalar enum rather than `{state, flags}`.

Inference:

- The highest unlock value comes from decisions that define substrate semantics, not code organization.
- Questions with clinical-policy or auditability implications should be sent to HITL/research rather than silently settled by implementation agents.

## Prioritized HITL blocker prompts

### 1. Oxygen-delivery context and `currentState(axis:"context")`

**Why this blocks workstreams**

SpO₂ is not clinically interpretable without oxygen context. This decision gates schema validation, fixture migration, current-state projections, trend/evidence interpretation, and UI/worklist behavior.

**Neutral HITL / research prompt**

> For pi-chart A3 vital signs, how should oxygen-delivery context be represented and resolved? Decide whether SpO₂ samples must carry inline oxygen context, whether active `observation.context_segment{segment_type:"o2_delivery"}` is the canonical source of truth, how disagreements between inline context / context segment / oxygen intent should be handled, and whether views should expose a dedicated `currentState(axis:"context")`. Consider clinical interpretability, migration from legacy inline context, and agent read-before-write needs. Return a recommended rule, rejected alternatives, validator severity, and fixture examples.

**Repo-lean note, not final decision**

Current repo lean: allow inline context during migration, validate it against active `context_segment`, treat active segment as canonical, and add `currentState(axis:"context")`. Evidence: `a3-open-schema-entries-synthesis.md` A3-Q3; `OPEN-SCHEMA-QUESTIONS.md#a3-oxygen-context` says this remains proposed/open.

**Unlocks**

- `schemas/vitals.schema.json` context validation shape.
- `src/views/currentState.ts` axis expansion or helper decision.
- Fixture migration away from purely inline context.
- V-VITAL-03 / V-VITAL-06 validator behavior.

---

### 2. Alarm, artifact, and alarm-pause event architecture

**Why this blocks workstreams**

Alarm semantics determine whether A3 is purely derived or event-auditable. This gates open-loop behavior, `resolves` usage, `action.alarm_pause`, `device_artifact`, validator logic, and patient-safety audit trails.

**Neutral HITL / research prompt**

> For pi-chart A3 vital signs, define the canonical architecture for vital alarms and monitor artifacts. Should alarm state be purely derived from latest vitals plus active monitoring plans, stored as canonical alert lifecycle events, stored only when sustained past policy thresholds, or modeled as a hybrid? When invalid monitor readings materially affect workflow, is inline `quality.flags` sufficient, or should a separate `observation.device_artifact` event be created? Should `action.alarm_pause` survive as a canonical subtype, and what does it resolve or supersede? Return event shapes, audit rationale, volume/scale tradeoffs, validator implications, and minimal fixture cases.

**Repo-lean note, not final decision**

Current repo has two leans at different levels: `a3-open-schema-entries-synthesis.md` leans toward canonical alert lifecycle events plus consequential `device_artifact`; `OPEN-SCHEMA-QUESTIONS.md` summarizes a lighter current lean to derive alert state first and add canonical events only where audit requirements/fixtures require. This conflict itself is a HITL blocker.

**Unlocks**

- OL-VITAL-03 semantics.
- ADR 009 `resolves` targets for alerts/artifacts.
- Final status of provisional `action.alarm_pause`.
- Structured `quality.{state, flags}` migration.
- Alarm/artifact fixture acceptance criteria.

---

### 3. Stream sample identity, correction, and monitoring-plan fulfillment

**Why this blocks workstreams**

`vitals.jsonl` rows intentionally avoid normal event ids, but correction, refutation, and fulfillment all need addressability. The answer affects schema shape, evidence refs, validator behavior, monitoring plan loops, and future A4 post-medication response windows.

**Neutral HITL / research prompt**

> For dense A3 `vitals.jsonl` streams, how should pi-chart address individual samples or windows for correction, refutation, and monitoring-plan fulfillment without event-izing every sample? Compare deterministic `sample_key`, promoted `observation.vital_sign` summary-window events, URI-targeted link kinds such as `links.refutes_window`, and the current hybrid where routine continuous fulfillment remains derived while one-shot measurements use `action.measurement`. Return the chosen pattern, how it handles bad-sample correction, monitor-vs-RN refutation, continuous cadence fulfillment, and what validators/views must enforce.

**Repo-lean note, not final decision**

Current detailed A3 lean: deterministic `sample_key` for addressability plus optional human-readable `summarizes_window` events when a disputed/fulfilled window deserves event-level representation; routine continuous fulfillment remains derived. `OPEN-SCHEMA-QUESTIONS.md` summary is more conservative: keep dense streams lightweight, use vitals-window refs, reserve explicit `action.measurement` for one-shot measurements.

**Unlocks**

- Whether `schemas/vitals.schema.json` gains `sample_key`.
- Whether new `observation.vital_correction` / `data.summarizes_window` shapes are allowed.
- Whether open-loop fulfillment can cite windows or only samples/actions.
- Future A4 MAR response-window integration.

---

### 4. Monitoring cadence defaults and staleness policy

**Why this blocks workstreams**

A3 can represent declared monitoring plans, but clinical defaults such as MICU q1h manual vitals, q15min post-escalation checks, staleness multipliers, and replay-vs-live severity remain HITL/policy-sensitive. Agents can implement the mechanism, but not silently choose local clinical policy.

**Neutral HITL / research prompt**

> For A3 vital-sign monitoring plans, what minimal default cadence and staleness policy should fixtures and validation examples assume, and which parts must remain explicitly scenario/local-policy configured? Address MICU manual vitals cadence, unstable respiratory watcher reassessment cadence, post-intervention windows, stale continuous-monitor gaps, and when a missed cadence is an `openLoop` vs replay warning vs strict replay error. Return default fixture assumptions, policy-configurable fields, and examples for OL-VITAL-01/02/03.

**Repo-lean note, not final decision**

Current A3 text marks several values as `[verify-with-nurse]`, including MICU q1h manual vitals and a 1.5× staleness multiplier. It already leans that live cadence misses should surface as open loops rather than making the chart invalid merely because wall clock advanced.

**Unlocks**

- Minimal A3 fixture rows.
- `openLoops()` vital cadence behavior.
- Replay-mode validator severity.
- Monitoring-plan payload examples.

---

### 5. Early-warning score storage and acted-on score audit

**Why this blocks workstreams**

Scores like NEWS2/MEWS/qSOFA can be derived continuously, but acted-on scores may need event-level audit. This decision crosses A3 vitals, A8 neuro/LOC, A5 urine output/perfusion, monitoring-plan thresholds, and OL-VITAL-03.

**Neutral HITL / research prompt**

> For pi-chart A3, when should early-warning scores such as NEWS2, MEWS, or qSOFA remain derived-only, and when should they be stored as `assessment.subtype = risk_score`? Define the payload needed for an acted-on score, including algorithm, version, score, parameter snapshot, time basis, and `links.supports` to vitals windows or other artifact streams. Also define whether crossing a score threshold without a reviewed score/response should produce an open loop. Return recommended discipline, validator/view implications, and fixture examples.

**Repo-lean note, not final decision**

Current A3 lean: derive scores live by default; store only when a clinician/agent asserts or acts on the score as `assessment.risk_score` with algorithm/version/parameter snapshot and vitals-window support.

**Unlocks**

- `assessment.risk_score` payload contract.
- Track-and-trigger fixtures.
- Cross-artifact metric dependencies (`level_of_consciousness`, UOP).
- OL-VITAL-03 score-threshold semantics.

---

### 6. pi-sim vitals ingest boundary and encounter resolution

**Why this blocks workstreams**

Even if A3 substrate semantics are settled, pi-agent/pi-sim integration remains blocked if sim fields and chart schema do not agree on translation ownership and encounter scoping.

**Neutral HITL / research prompt**

> For the pi-sim to pi-chart A3 vitals bridge, who owns field translation and encounter scoping? Decide whether the ingest adapter translates pi-sim vital-frame fields into pi-chart `vitals.jsonl` names/units/context/quality, or pi-sim should rename/reshape its emitted fields. Decide whether `encounter_id` is emitted by sim, looked up by chart ingest from current patient scope, or passed by the agent/tool boundary. Return a boundary contract, rejected alternatives, and compatibility requirements with patient isolation.

**Repo-lean note, not final decision**

`ROADMAP.md` still marks both “pi-sim vitals schema ↔ ingest translator” and “encounter_id resolution for ingest” as open seams. This is more owner/integration than clinical HITL, but it unlocks parallel adapter work.

**Unlocks**

- Adapter contract and tests.
- Patient isolation checks.
- `vitals://<encounter>` evidence resolution.
- pi-agent chart tool handoff.

---

### 7. Vital metric registry, ABG/lactate shared metrics, and accepted-direction confirmation

**Why this is lower priority**

The open-schema table marks A3 shared metrics as accepted direction, so this should not block first-pass implementation unless the other agent found a conflict. It is included as a confirmation prompt rather than a primary blocker.

**Neutral HITL / research prompt**

> Confirm whether A3 should treat ABG-like values, lactate, and hemoglobin as A1-canonical drawn-lab observations, with A3 simulator-derived equivalents suppressed or explicitly profile-routed/training-labeled. Also confirm whether a canonical vital metric registry should be introduced now to align `vitals.jsonl.name`, `observation.vital_sign.data.name`, LOINC mappings, and `trend()` joins. Return only corrections to the current accepted direction and any implementation guardrails.

**Repo-lean note, not final decision**

`OPEN-SCHEMA-QUESTIONS.md` marks `a3-shared-metrics` as accepted direction: A1 is canonical for drawn labs; A3 simulator-derived equivalents should be suppressed/profile-routed unless explicitly training/simulation labeled. A3 synthesis also proposes `schemas/vital-metrics.json` for metric registry enforcement.

**Unlocks**

- Metric enum/registry implementation.
- Source filters in `trend()`.
- Avoiding clinically misleading continuous ABG/lactate streams.

## Recommended ordering for the other agent

1. Ask/settle oxygen context first if they are touching `currentState`, fixtures, or SpO₂ validation.
2. Ask/settle alarm/artifact architecture before implementing OL-VITAL-03, `action.alarm_pause`, or device-artifact fixtures.
3. Ask/settle sample identity before adding correction/fulfillment semantics.
4. Keep cadence defaults as scenario-configured unless HITL gives concrete defaults.
5. Treat early-warning scores as derived-until-acted-on unless HITL says otherwise.
6. Do adapter-boundary work only after ingest ownership and encounter resolution are decided.

## Handoff options

- `$ralplan` recommended if these prompts should become PRD/test-spec artifacts before work continues.
- `$team` if separate agents should own oxygen context, alarm/artifact, stream identity, and ingest seams in parallel after HITL decisions.
- `$ralph` if a single persistent lane should carry one selected decision through implementation and verification.
- Refine further if the user wants narrower prompts for one decision area.
