# PRD — A3 Vital Signs Decision Implementation Bridge

## Metadata

- Source requirements: `.omx/specs/deep-interview-a3-vital-signs-decisions.md`
- Planning mode: `$ralplan` consensus, RALPLAN-DR short mode
- Scope: planning only; no source implementation in this artifact
- Context type: brownfield pi-chart

## Requirements Summary

Promote the user-confirmed A3 vital-signs decisions into an implementation-ready plan across schemas, types, validators, views, fixtures, ingest boundaries, and docs. The implementation must preserve the existing stream-vs-event discipline while adding enough addressability, context resolution, and audit hooks to support physiologic trend reasoning.

The confirmed decisions are:

1. Oxygen context: active `observation.context_segment{segment_type:"o2_delivery"}` is canonical; inline SpO₂ context is migration/read convenience; add `currentState(axis:"context")`.
2. Alarm/artifact: derived live alarm state plus canonical sustained/actioned/audit-relevant alert events; consequential `device_artifact`; structured `quality.{state, flags}`; canonical `action.alarm_pause`.
3. Stream identity: deterministic `sample_key`; retain `vitals://` windows; optional `observation.vital_sign.data.summarizes_window`; no new URI link kinds yet.
4. Cadence/staleness: baseline cadence follows `intent.monitoring_plan`/orders; alarms can activate temporary monitoring obligations; live misses are open loops, with replay/strict replay escalation.
5. Early-warning scores: derived live; store `assessment.risk_score` only when asserted/reviewed/acted on; threshold miss can open a loop.
6. pi-sim ingest: pi-chart adapter translates sim frames; chart/tool scope resolves `encounter_id`.
7. Metrics: add vital metric registry; drawn ABG/lactate/Hgb are A1-canonical; A3 simulator ABG-like values require explicit profile/training labels.

## Brownfield Evidence

- A3 source docs are still source input requiring promotion after HITL selection: `docs/plans/phase-a-status-matrix.md:16-17`.
- A3 open-schema register identifies stream identity, shared metrics, oxygen context, early-warning scores, and alarm/artifact boundaries: `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md:400-438`.
- Current vitals schema lacks `recorded_at`, `sample_key`, metric registry reference, and structured `quality`: `schemas/vitals.schema.json:7-39`.
- Current state axes exclude `context`: `src/types.ts:297`, `src/types.ts:399-429`, `src/views/currentState.ts:58-114`.
- Current latest-vitals handling drops only scalar `quality === "invalid"`: `src/views/currentState.ts:188-216`.
- `trend()` currently unions `vitals.jsonl` samples and observation events by free-form `metric/name`, with source filtering but no registry/profile gate: `src/views/trend.ts:15-63`.
- `openLoops()` currently handles ordinary intent due_by/fulfillment and contested claims, but not vital cadence or alarm loops: `src/views/openLoops.ts:45-105`.
- Evidence parsing and validation already support `vitals://<encounter>` windows: `src/evidence.ts:198-237`, `src/validate.ts:2124-2205`.
- Roadmap still marks pi-sim vitals translation and encounter resolution as open integration seams: `ROADMAP.md:71-80`.

## RALPLAN-DR Summary

### Principles

1. **Stream discipline:** Dense monitor samples stay in `vitals.jsonl`; only audit-worthy clinical claims/events enter `events.ndjson`.
2. **Context is interval-canonical:** Stable oxygen/device context is represented as active interval state, not duplicated as the only source of truth on every sample.
3. **Derived live, stored when acted on:** Alarm state and score state are computed live, but clinically acted-on/audit-relevant states become canonical events/assessments.
4. **Order-driven obligations:** Monitoring cadence follows explicit plans/orders or triggered temporary obligations, never hidden global defaults.
5. **Boundary preservation:** pi-sim remains simulation/source interface; pi-chart owns chart schema translation and encounter scoping.

### Decision Drivers

1. **Clinical evidence integrity:** Agent assessments must cite resolvable, context-aware vital windows without implying false measurement sources.
2. **Volume control:** Avoid event spam from per-frame alerts/scores/samples while preserving addressability where clinically needed.
3. **Execution parallelism:** Split work into independently verifiable schema/validator, view/open-loop, fixture, adapter, and docs lanes.

### Viable Options

#### Option A — Unified A3 bridge implementation (recommended)

Implement all seven confirmed decisions as one coordinated A3 implementation bridge with cross-lane tests.

Pros:
- Keeps coupled schema/view/validator decisions consistent.
- Produces one coherent PRD/test surface for downstream `$team` or `$ralph`.
- Avoids partial implementation that later conflicts with confirmed decisions.

Cons:
- Moderate scope across many files and test suites.
- Requires careful sequencing so schema/type changes do not strand existing fixtures.

#### Option B — Minimal docs/ADR promotion first

Promote decisions only into docs/open-schema register/ADR, then defer code changes.

Pros:
- Lowest implementation risk.
- Useful if another agent is already mid-code and needs authoritative direction.

Cons:
- Does not unblock tests/fixtures/views directly.
- Leaves current code mismatches in schema/types/views.

#### Option C — Vertical slice first: oxygen context only

Implement D1 end-to-end before touching alarms, sample identity, scores, ingest, or registry.

Pros:
- Smallest executable slice with clear tests.
- Reduces risk of broad refactor conflicts.

Cons:
- Leaves A3 integration seams and other decisions unresolved in code.
- May need rework if registry/sample_key/schema changes later alter vitals row shape.

### Recommended Option

Option A, delivered in staged lanes with an initial documentation/ADR checkpoint, is recommended because the decisions are coupled at the schema/type/view boundary. The plan should still permit execution as incremental PR-sized slices.

## Stage 0.5 Contract Checkpoint (must precede parallel implementation)

Before any parallel `$team` execution, freeze these shared contracts in the PRD/ADR or a dedicated A3 contract note:

1. **Vitats row contract:** `sampled_at` is physiologic measurement time; `recorded_at` is chart-ingest/write time and must not replace `sampled_at` for clinical windows. Canonical row fields include `subject`, `encounter_id`, `name`, `value`, `unit`, `source`, `sampled_at`, `recorded_at`, deterministic `sample_key`, `quality.{state, flags?}`, optional inline `context`, and optional profile/training labels.
2. **`sample_key` formula:** `sample_key = vital_<sha256(subject + "|" + encounter_id + "|" + name + "|" + sampled_at + "|" + source.kind + "|" + (source.ref ?? "") + "|" + normalized_value + "|" + (unit ?? ""))[:16]>`. `normalized_value` is JSON-canonicalized before hashing: numbers use finite decimal string form without unit conversion, strings are trimmed NFC text, booleans are `true`/`false`, and objects/arrays are not valid vital values. If an ingest collision occurs for distinct rows, append a deterministic ordinal suffix based on stable ingest order and warn.
3. **Context state shape:** `currentState(axis:"context")` returns active, non-superseded `observation.context_segment` events keyed by `segment_type`; `axis:"all"` adds `context` without removing existing fields.
4. **Vital loop representation:** extend open-loop output with typed vital loop variants (`kind:"vital_cadence"` and `kind:"vital_alarm"`) that remain view-layer objects. Prefer a backing `intent.monitoring_plan` when one exists; do not materialize events solely for every live alarm. Audit-relevant sustained/actioned alarm events may be linked/resolved by later actions.
5. **Severity mode table:** live mode reports cadence/alarm issues as open loops; replay mode may warn; strict replay may error when fixed time windows make the miss deterministic.
6. **Adapter fixture boundary:** pi-chart owns a small adapter contract fixture (sample sim frame -> expected chart vitals row) so tests do not depend on pi-sim internals.

## Scope

### In Scope

- Schema/type additions for vitals rows, metric registry, context axis, alert/artifact/action subtypes, and risk-score payload discipline.
- Validator rules for sample keys, structured quality, SpO₂ context coverage, context disagreement, vital metric names, vital evidence sufficiency, acted-on scores, and live/replay cadence semantics.
- View/API planning for `currentState(axis:"context")`, vital alarm/cadence open loops, live score derivation, and trend/profile filtering.
- Fixture and migration planning for existing inline-context samples.
- pi-sim ingest adapter boundary contract and tests.
- Documentation updates to promote A3 source decisions into the open-schema register/ADR-compatible docs.

### Out of Scope

- Exhaustive hospital-specific clinical policy research.
- UI/prototype styling or flowsheet visual redesign.
- Changing pi-sim internals to emit chart-native rows.
- New URI link kinds such as `links.refutes_window` or `links.fulfills_window`.
- Per-frame alert event or computed-score event streams.
- Direct production clinical recommendations; this is a simulation/chart substrate plan.

## Acceptance Criteria

1. A canonical A3 decision artifact or ADR references all seven decisions and updates the open-schema status so accepted items are not left as unresolved source-input prose.
2. Vitals schema/types include `recorded_at`, deterministic `sample_key` contract, structured `quality.{state, flags}`, metric registry constraints, and backward-compatible handling for legacy scalar quality during migration.
3. `currentState` supports `axis:"context"` and `axis:"all"` includes active context without breaking existing callers.
4. SpO₂ validation accepts either inline oxygen context or covering active oxygen context segment, and warns when inline context disagrees with canonical segment during migration.
5. `trend()` and latest-vitals views exclude invalid samples under both legacy scalar and structured quality forms, preserve questionable samples, and expose sample keys where needed for correction/refutation flows.
6. `openLoops()` can represent ordered vital cadence misses, alarm-triggered temporary monitoring obligations, and unresolved sustained/actioned/audit-relevant vital alarms without making live charts invalid purely because time advanced.
7. Canonical alert/audit events, `device_artifact`, and `action.alarm_pause` are documented and schema-valid only for sustained/actioned/audit-relevant cases, not per-frame alarm state.
8. `assessment.risk_score` payload rules are documented and validated enough for acted-on/reviewed scores, while live score computation remains derived and non-persistent.
9. pi-chart ingest adapter contract states that the adapter maps pi-sim fields to chart vitals schema and chart/tool scope resolves `encounter_id`.
10. Vital metric registry covers core current fixture metrics and marks ABG/lactate/Hgb as A1-canonical unless explicitly profile-routed/training-labeled.
11. Tests cover legacy compatibility and new canonical behavior before strict validation flips to errors.
12. Existing tests continue to pass after implementation, including `currentState`, `trend`, `evidenceChain`, `validate`, and any new A3-specific tests.

## Implementation Plan

### Stage 0 — Documentation/ADR checkpoint

Files:
- `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md`
- `clinical-reference/phase-a/a3-open-schema-entries-synthesis.md` or a new decision/ADR file under `decisions/`
- `docs/plans/phase-a-status-matrix.md` if status changes are authorized

Actions:
- Promote the seven confirmed decisions from `.omx/specs/deep-interview-a3-vital-signs-decisions.md` into an A3 decision record.
- Mark which A3 open-schema entries are accepted, accepted-direction, or still implementation-detail.
- Preserve source docs as historical input unless the selected execution card owns those edits.

Verification:
- Diff shows all D1-D7 represented once.
- No contradictory open-schema prose remains without an explicit “superseded by decision” note.

### Stage 1 — Schema/types foundation

Prerequisite: Stage 0.5 contract checkpoint is complete. Shared field names and loop representations must not be independently re-decided inside this lane.

Files:
- `schemas/vitals.schema.json`
- `schemas/event.schema.json`
- `src/types.ts`
- possible new `schemas/vital-metrics.json`
- schema/type tests such as `src/schema.test.ts`, `src/types.test.ts`, `src/validate.test.ts`

Actions:
- Add `recorded_at`, `sample_key`, structured `quality`, and registry-backed `name` guidance to vitals row shape.
- Preserve migration tolerance for scalar `quality` until fixtures migrate.
- Extend `Axis`/`CurrentState` types for `context`.
- Add event/subtype payload allowances for audit-relevant alert/device_artifact/alarm_pause and acted-on `risk_score` only where existing event schema requires it.

Verification:
- Schema tests cover canonical and legacy vitals samples.
- Type tests cover `axis:"context"`, structured quality, and risk-score payload examples.

### Stage 2 — Context and trend views

Files:
- `src/views/currentState.ts`
- `src/views/currentState.test.ts`
- `src/views/trend.ts`
- `src/views/trend.test.ts`
- `src/views/evidenceChain.ts` and tests if trend points expose sample keys

Actions:
- Implement active context collection from `observation.context_segment` intervals.
- Add `currentState(axis:"context")` and include context in `axis:"all"`.
- Update latest vitals/trend quality filtering for legacy and structured quality.
- Preserve inline context on trend points as read convenience while treating active context as canonical in state views.
- Prepare trend filtering for registry/profile distinctions where ABG-like simulator values are included.

Verification:
- Current-state tests prove active segment wins over inline sample context.
- Trend tests prove invalid structured-quality samples are excluded and questionable samples remain.
- Existing callers of `axis:"all"` still work or are updated intentionally.

### Stage 3 — Validator and evidence rules

Files:
- `src/validate.ts`
- `src/validate.test.ts`
- `src/evidence.ts` / `src/evidence.test.ts` if sample-key refs or summaries need parsing helpers

Actions:
- Add V-VITAL rules for required vitals row fields, sample_key uniqueness/determinism, metric registry names, SpO₂ oxygen context coverage, context disagreement warnings, and invalid-only evidence windows.
- Validate acted-on `assessment.risk_score` payload when present.
- Validate alert/device_artifact/alarm_pause usage in audit-relevant cases while forbidding per-frame alert spam if possible by fixture convention/tests.
- Keep live cadence misses as view/open-loop findings, not default write-time validation errors; add replay/strict-replay hooks only if a validation mode already exists or is planned in the implementation slice.

Verification:
- Validator tests cover canonical pass cases, legacy migration warnings, and failure/warning cases for each new rule.
- Vitals-window evidence tests still pass.

### Stage 4A — Open loops, alarms, and cadence

Files:
- `src/views/openLoops.ts`
- `src/views/openLoops.test.ts`
- possible new `src/views/vitalAlerts.ts` if complexity warrants
- `src/views/bundle.ts` / tests if context/open-loops feed bundles

Actions:
- Represent ordered cadence misses from `intent.monitoring_plan.data.required_cadence`.
- Add typed view-layer vital loops (`kind:"vital_cadence"`, `kind:"vital_alarm"`) with a backing `intent.monitoring_plan` when one exists.
- Represent alarm-triggered temporary monitoring obligations until cleared/resolved without materializing per-frame events.
- Surface sustained/actioned/audit-relevant alarm events only when an episode crosses the audit threshold or care action boundary.

Verification:
- Open-loop tests cover baseline ordered cadence, alarm-triggered temporary q15 obligation, alarm pause, resolution, no-loop after fulfillment, and no per-frame event requirement.

### Stage 4B — Derived scores and acted-on risk-score audit

Files:
- possible new `src/views/riskScores.ts`
- `src/views/openLoops.ts` if score-threshold loops reuse open-loop output
- `src/validate.ts` and score-focused tests

Actions:
- Compute live score state when enough metric inputs exist.
- Store/validate only acted-on `assessment.risk_score` events with algorithm/version/score/parameter snapshot/time basis/evidence.
- Open a loop when a declared score threshold requires review/response and none exists.

Verification:
- Risk-score tests prove derived score does not write events and acted-on score supports audit.

### Stage 5 — Fixtures and migration

Files:
- `patients/patient_001/**`
- `patients/patient_002/**`
- `src/test-helpers/fixture.ts`
- `scripts/migrate-*.ts` if needed
- derived rebuild scripts/tests

Actions:
- Add minimal A3 fixture cases: stable ward, pneumonia deterioration, stale monitoring plan, invalid artifact, conflicting-source case, manual RN event supporting escalation.
- Migrate or dual-represent inline oxygen context with context segments.
- Add sample_key/recorded_at/structured quality to fixture vitals rows while keeping migration tests for legacy samples.

Verification:
- `npm test` passes.
- Derived outputs rebuild without losing existing evidence chains.

### Stage 6 — pi-sim ingest adapter boundary

Files:
- likely adapter/tool docs or future adapter files when selected
- `ROADMAP.md` or an adapter PRD if no implementation file exists yet
- tests for adapter contract once files exist

Actions:
- Define adapter contract: pi-chart maps sim fields into chart schema; chart/tool scope resolves encounter.
- Specify mapping for name/unit/context/quality/sample_key/source.
- Keep pi-sim source code decoupled from chart schema.

Verification:
- Contract test with simulated VitalFrame produces valid chart vitals rows.
- Encounter scoping test rejects/does not leak cross-patient writes.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Broad coupled implementation causes conflicts with other active agent edits | Start with docs/ADR + schema foundation; split execution lanes with disjoint write scopes; inspect `git status` before each lane. |
| Strict schema breaks existing fixtures | Support legacy scalar quality and inline context during migration; add migration tests before enforcing strict errors. |
| Alarm/event model creates event spam | Only canonicalize sustained/actioned/audit-relevant alarms; keep live alarm state derived. |
| Cadence rules encode hidden clinical policy | Cadence follows explicit `monitoring_plan`/orders or triggered obligations; fixture defaults are examples, not global truth. |
| A3 simulator ABG-like values confuse clinical evidence | Registry/profile labels distinguish A1-canonical drawn labs from A3 training/sim values. |
| `currentState(axis:"all")` shape change breaks callers | Add tests for bundle/currentState consumers and update consumers intentionally. |

## Verification Steps

- Run targeted tests after each lane: `npm test -- src/views/currentState.test.ts`, `npm test -- src/views/trend.test.ts`, `npm test -- src/validate.test.ts`, `npm test -- src/views/openLoops.test.ts` (adjust to repo test runner syntax if needed).
- Run full suite: `npm test`.
- Run validation script on fixtures if available: `npm run validate` or `node --loader ts-node/esm scripts/validate.ts` according to package scripts.
- Rebuild derived fixture outputs if implementation touches fixtures: `npm run rebuild` if available.
- Manual artifact review: confirm `OPEN-SCHEMA-QUESTIONS.md` and A3 decision docs no longer contradict implemented behavior.

## ADR

### Decision

Implement the seven user-confirmed A3 vital-signs decisions as a coordinated A3 implementation bridge, staged by docs/ADR, schema/types, views, validator/evidence, open-loops/alarms/scores, fixtures/migration, and ingest boundary.

### Drivers

- Preserve dense stream scalability while adding clinical addressability.
- Ensure SpO₂/vital trend reasoning is context-aware and evidence-resolvable.
- Keep simulation boundary clean between pi-sim and pi-chart.

### Alternatives considered

- Docs-only promotion first: safer but leaves code gaps and does not unblock view/validator lanes.
- Oxygen-context vertical slice only: small but misses coupled schema and registry changes.
- Per-frame event canonicalization: rejected for volume and evidence-chain readability.
- No sample_key: rejected because it weakens precise correction/refutation.

### Why chosen

The confirmed decisions intentionally cut across schema, validation, views, fixtures, and integration. A staged unified bridge gives downstream agents a coherent target while preserving incremental execution slices.

### Consequences

- Moderate-scope implementation touching multiple subsystems.
- Requires migration tolerance for legacy samples.
- Enables richer A3 workstreams: context-aware current state, vital open loops, acted-on score audit, and sim ingest mapping.

### Follow-ups

- Freeze exact alert/risk-score event payload fields in Stage 0.5 before parallel lanes begin.
- Decide replay/strict-replay API surface early; current package scripts expose `npm run validate` but no replay-mode flag, so initial implementation may document replay strictness as future CLI/API work unless the validation lane adds an explicit option.
- Coordinate with pi-sim/pi-agent owners before implementing adapter contract.

## Available-Agent-Types Roster

- `planner` — sequencing and PRD/test-spec refinement.
- `architect` — schema/view boundary review and tradeoff management.
- `critic` — plan quality, acceptance criteria, and risk review.
- `executor` — code implementation by lane.
- `test-engineer` — test matrix and fixture coverage.
- `verifier` — final evidence and completion checks.
- `debugger` / `build-fixer` — test/build failures.
- `code-reviewer` / `quality-reviewer` — final code review.
- `researcher` / `dependency-expert` — only if external docs or dependency choices become necessary; not required for this repo-local plan.
- `writer` — ADR/docs promotion.

## Follow-up Staffing Guidance

### `$ralph` sequential path

Use when one owner should implement in order:

1. `writer` or `executor` for Stage 0 docs/ADR.
2. `executor` for schema/types.
3. `executor` for views.
4. `executor` for validator/open-loops.
5. `test-engineer` for fixture/test hardening.
6. `verifier` for final suite and artifact review.

Suggested reasoning: high for schema/open-loop boundary steps; medium for fixture/docs; high for verifier.

### `$team` parallel path

Use when parallelism is desired after Stage 0:

- Lane A — Schema/types/registry (`executor`, high): `schemas/*`, `src/types.ts`.
- Lane B — Views/openLoops/scores (`executor`, high): `src/views/*`.
- Lane C — Validator/evidence (`executor`, high): `src/validate.ts`, `src/evidence.ts`.
- Lane D — Fixtures/migration (`test-engineer`, medium/high): `patients/*`, `src/test-helpers/*`, migration scripts.
- Lane E — Docs/ADR/adapter contract (`writer` or `executor`, medium): `clinical-reference/*`, `decisions/*`, `ROADMAP.md`.

Avoid parallel writes to `src/types.ts` and `schemas/event.schema.json`; assign a single owner or serialize merges.

## Launch Hints

```text
$ralph .omx/plans/prd-a3-vital-signs-decisions-<timestamp>.md
```

```text
$team .omx/plans/prd-a3-vital-signs-decisions-<timestamp>.md
```

If using `omx team`, staff after Stage 0 so lanes share accepted schema contracts.

## Team Verification Path

Before team shutdown:

- Each lane reports changed files, tests run, and unresolved conflicts.
- Full `npm test` passes or failures are assigned to a build-fixer/debugger lane.
- Fixture validation/rebuild status is recorded.
- Docs/ADR match implemented behavior.

After team handoff, run a Ralph/verifier pass to ensure cross-lane integration: schema ↔ types ↔ views ↔ validator ↔ fixtures ↔ docs.

## Changelog

- Initial ralplan draft from `.omx/specs/deep-interview-a3-vital-signs-decisions.md`.
- Applied Architect review: added Stage 0.5 contract checkpoint, exact sample_key formula, timestamp semantics, typed vital loop representation, severity matrix, Stage 4 split, and pi-chart-owned adapter fixture boundary.
- Applied Critic approval suggestions: defined `normalized_value` canonicalization, corrected rebuild command to `npm run rebuild`, and called out replay/strict-replay API surface as an early validation-lane decision.
