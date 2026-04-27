# Ralplan consensus — PHA-001 executable implementation cards

Status: APPROVED for planning handoff only. Do not implement until HITL selects the first tracer bullet.

## Focused artifacts updated

- `docs/plans/kanban-prd-board.md`
- `docs/plans/prd-phase-a-completion-to-implementation-bridge.md`
- `docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md`
- `docs/plans/phase-a-status-matrix.md`

## RALPLAN-DR summary

### Principles

1. Bridge Phase A research into implementation cards; do not re-research or implement during this pass.
2. Preserve source authority: Phase A controls and accepted ADRs outrank memos; ADR17 remains non-canonical.
3. Use thin, test-first tracer bullets with explicit owned files and verification commands.
4. Keep pi-chart bounded to chart/EHR facts; no hidden simulator or pi-agent/pi-sim coupling.
5. Require HITL before implementation branch selection.

### Decision drivers

1. Existing PHA-001 bullets were too broad for context-efficient execution.
2. A8/A9a contain candidate open-schema deltas not yet canonical in `OPEN-SCHEMA-QUESTIONS.md`.
3. Current repo seams support small characterization tests around validator/view behavior.

### Options considered

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| Deepen PHA-001 tracked docs into executable cards | Durable backlog stays authoritative; future agents start from tests and owned files. | Requires doc edits before code. | Chosen. |
| Write only an `.omx` handoff | Minimal tracked churn. | Durable board/PRD remain under-specified. | Rejected. |
| Start coding first card now | Fastest implementation feedback. | Violates explicit planning-only/HITL requirement. | Rejected. |

## Acceptance criteria delivered

The PRD now requires:

- Durable board entrypoint links PRD/spec/matrix.
- Exact-once Phase A source coverage.
- A8/A9a treated as current inputs.
- Each tracer bullet includes purpose, owned files, first failing/characterization test, implementation boundary, verification command, and deferrals.
- Touched open-schema questions classified as `accepted`, `accepted-direction`, `proposed`, `deferred`, or `HITL-needed` before code.
- A8/A9a candidate deltas remain non-canonical until promoted.
- Product-root changes are not authorized by this planning pass.
- ADR17 remains non-canonical through `ADR17-001` unless separately accepted.

## Thin tracer bullets

1. `PHA-TB-0` — Inventory/source-map refresh.
2. `PHA-TB-1` — Open-schema delta decision ledger.
3. `PHA-TB-2` — A0-A2 ordered-result calibration slice.
4. `PHA-TB-3` — A8/A9a focused reassessment-order loop slice.
5. `PHA-TB-4` — Bridge acceptance report and next gate.

Each bullet has owned files, first test, verification command, and deferrals in `docs/plans/prd-phase-a-completion-to-implementation-bridge.md`.

## Explicit deferrals

- Product implementation until HITL selects one first tracer bullet.
- ADR17 actor/attestation/review policy and `communication.attestation.v1`.
- FHIR/adapter/export/legal/audit boundary work.
- Full CPOE, MAR, order-set/protocol parent, blood-product policy, restraint policy, and institutional profile systems.
- New dependencies, new top-level event types, and source-kind expansion.
- Edits to pi-agent or pi-sim and hidden simulator state access.

## HITL checkpoint

Before implementation, human chooses exactly one:

1. `PHA-TB-1` docs-only open-schema delta ledger first.
2. `PHA-TB-2` A0-A2 ordered-result calibration first.
3. `PHA-TB-3` A8/A9a focused reassessment-order loop first.

Do not invoke `$ralph`, `$team`, or direct implementation before that choice.

## ADR

Decision: deepen PHA-001 into tracked, test-first tracer cards and stop at HITL.

Drivers: context efficiency, Phase A source breadth, A8/A9a candidate deltas, test-first execution, boundary preservation.

Alternatives considered: `.omx`-only handoff, direct implementation, broad Phase A rewrite.

Why chosen: tracked PHA-001 docs are the durable backlog entrypoint and now carry enough execution context for later agents.

Consequences: future execution can start from a named failing/characterization test; unrelated dirty baseline must be captured separately; implementation remains blocked until HITL.

Follow-ups: user selects first tracer bullet; selected execution mode runs that bullet's verification command and later records evidence in acceptance report.

## Available-agent-types roster and staffing guidance

Available roles useful for handoff: `executor`, `test-engineer`, `verifier`, `architect`, `critic`, `explore`.

- `$ralph` path: one `executor` owns the selected bullet; `test-engineer`/`verifier` validates the first test and final command; `architect` only if schema boundaries widen.
- `$team` path: use only if HITL selects multiple independent docs/planning lanes. Do not run TB-2 and TB-3 in parallel unless one integration owner owns shared `src/validate.ts` / `schemas/event.schema.json` changes.
- Launch hint after HITL: `$ralph implement PHA-TB-N from docs/plans/prd-phase-a-completion-to-implementation-bridge.md; start with the named first failing/characterization test; do not expand beyond owned files.`

## Review record

Architect verdict: APPROVE after iteration.
Critic verdict: APPROVE after scoped-change verification was revised to targeted PHA-001 focus plus out-of-scope dirty-baseline reporting.

## Verification evidence

Command run from `docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md`: passed.
Observed output included:

- `PHA-001 planning checks passed`
- Out-of-scope dirty baseline reported separately.

Focused diff check showed only PHA-001 focus files for this lane:

- `pi-chart/docs/plans/kanban-prd-board.md`
- `pi-chart/docs/plans/phase-a-status-matrix.md`
- `pi-chart/docs/plans/prd-phase-a-completion-to-implementation-bridge.md`
- `pi-chart/docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md`

Known out-of-scope dirty docs remain in the workspace and are not PHA-001 evidence.
