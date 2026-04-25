# PRD — Phase A completion-to-implementation bridge

## Status

- Board card: `PHA-001`
- Source board: [`kanban-prd-board.md`](kanban-prd-board.md)
- Scope: planning-to-execution bridge for Phase A docs.
- Execution posture: this PRD prepares implementation. Product code changes belong to selected tracer-bullet execution cards and must start with tests or executable validation.
- Recommended next lane after HITL: `$ralplan` or `$team` using this PRD plus the paired test spec.

## Requirements summary

Phase A research has produced a broad set of clinical-reference artifacts, including A0–A8 and now A9a files. Workstream A has hardened the memory-proof seam, proving that pi-chart can expose chart-visible clinical memory without hidden simulator coupling. The next durable workstream should convert Phase A research outputs into implementation-ready PRDs/tracer bullets instead of allowing more research/document sprawl.

The bridge must preserve clinical research intent while making future implementation cards small, test-first, and parallelizable.

## Source inputs reviewed

Primary:

- `clinical-reference/phase-a/PHASE-A-CHARTER.md`
- `clinical-reference/phase-a/PHASE-A-EXECUTION.md`
- `clinical-reference/phase-a/PHASE-A-TEMPLATE.md`
- `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md`
- `clinical-reference/phase-a/a0a-*` through `a9a-*`
- `.omx/plans/doc-sprawl-source-map.md`
- `.omx/plans/workstream-a-memory-proof-acceptance-report.md`
- `decisions/016-broad-ehr-skeleton-clinical-memory.md`

Secondary/evidence:

- `memos/deep-research-alignment-revised-2026-04-25.md`
- `memos/Workstream A PRD test.md`
- `memos/pi-chart-v03-memo.md`
- `ROADMAP.md`

## Brownfield reality

- Phase A docs are research/source artifacts, not implementation by themselves.
- Existing source map includes memos/research reports but is slightly stale because A9a files now exist.
- Workstream A is no longer just a candidate; it has an acceptance report and changed test files.
- Product implementation roots include `schemas/*.json`, `src/validate.ts`, `src/views/*`, `src/read.ts`, `src/write.ts`, and patient fixtures under `patients/`.
- `pi-chart` must remain a bounded chart/EHR subsystem and must not read hidden `pi-sim` state.

## RALPLAN-DR summary

### Principles

1. **Bridge, do not re-research:** convert Phase A outputs into execution cards; do not create another large memo.
2. **Source authority stays explicit:** accepted ADRs and Phase A control docs outrank memos; proposed ADR 017 remains non-canonical.
3. **Thin vertical slices:** each implementation card must prove one clinical behavior end-to-end with tests.
4. **Chart-only evidence:** implementation cards may use chart-visible fixtures/views only; no hidden simulator coupling.
5. **HITL at branch points:** user approves the first implementation tracer bullet and any promotion of proposals to policy.

### Decision drivers

1. Phase A has enough breadth that direct implementation without triage would cause scope sprawl.
2. Workstream A now provides a working proof seam to attach Phase A implementation cards to.
3. New A8/A9a docs change the source-map state and should be captured before execution.

### Options considered

| Option | Approach | Pros | Cons | Verdict |
|---|---|---|---|---|
| A. Phase A bridge board first | Make status/conflict matrix, then implementation cards. | Preserves context; supports parallel agents; avoids stale memo traps. | Adds a small planning step before code. | Chosen. |
| B. Start coding A9a order primitive | Jump straight to the freshest heavy surface. | Concrete and motivating. | Risks ignoring unresolved A0–A2/A8 dependencies and open-schema questions. | Rejected for first move. |
| C. Rewrite all Phase A docs into PRDs | Normalize everything before implementation. | Clean documentation set. | Too much doc churn; delays TDD execution. | Rejected. |

## In scope

- Create/update a Phase A status matrix covering all current Phase A files.
- Convert Phase A research surfaces into PRD/tracer-bullet cards.
- Identify open-schema questions that block implementation.
- Identify which implementation cards are safe to run in parallel.
- Define first tests, owned files, boundaries, and verification commands for 3–6 tracer bullets.
- Keep source/status conflicts visible for HITL.

## Out of scope

- Unscoped product code changes outside a selected tracer-bullet card.
- Full rewrite of Phase A research docs.
- Hidden simulator integration.
- FHIR/adapter/boundary work.
- Accepting proposed ADR 017 without separate HITL/ADR approval.
- Full CPOE/MAR or production EHR scope.

## Acceptance criteria

1. `docs/plans/kanban-prd-board.md` remains the durable entrypoint for `PHA-001` and links this PRD, the paired test spec, and `docs/plans/phase-a-status-matrix.md`.
2. Every current `clinical-reference/phase-a/*.md` file is represented exactly once in the status matrix or explicitly excluded with rationale.
3. A8 and A9a files are treated as current Phase A inputs, not future/missing work.
4. Each ready tracer bullet has purpose, owned files, first failing/characterization test, implementation boundary, verification command, and explicit deferrals.
5. Open-schema questions touched by the selected tracer bullet are classified before product changes as `accepted`, `accepted-direction`, `proposed`, `deferred`, or `HITL-needed`.
6. A8/A9a open-schema entries that are not yet folded into `OPEN-SCHEMA-QUESTIONS.md` are treated as a delta ledger, not silently canonical policy.
7. This planning-only pass does not authorize product-root code or fixture changes; any pre-existing dirty product-root baseline must be recorded before future implementation, and future implementation may edit only the selected card's owned files.
8. Future implementation starts with the named first failing/characterization test or executable validation.
9. No tracer bullet introduces a new dependency, hidden simulator read, adapter boundary, new top-level event type, or pi-agent/pi-sim coupling.
10. Proposed ADR 017 remains non-canonical unless separately accepted through the `ADR17-001` HITL/ADR lane.

## Tracer bullets

### PHA-TB-0 — Inventory and source-map refresh

Purpose: update Phase A source status after A8/A9a landed.

Owned files:

- `docs/plans/kanban-prd-board.md`
- `docs/plans/phase-a-status-matrix.md`
- `docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md`

First failing/characterization test:

- Structural Python check fails if any current `clinical-reference/phase-a/*.md` path is missing from or duplicated in `docs/plans/phase-a-status-matrix.md`, or if the board stops linking the PHA-001 PRD/spec/matrix.

Implementation boundary:

- Docs only.
- Do not edit clinical source docs except to fix obvious link/table errors with HITL approval.
- Do not modify product-root files (`schemas/`, `src/`, `patients/`) in this planning card.

Verification command:

```bash
python3 - <<'PY'
from pathlib import Path
phase = sorted(str(p) for p in Path('clinical-reference/phase-a').glob('*.md'))
matrix = Path('docs/plans/phase-a-status-matrix.md').read_text()
missing = [p for p in phase if matrix.count(p) == 0]
duplicates = [p for p in phase if matrix.count(p) > 1]
if missing or duplicates:
    print('Missing Phase A files from matrix:', missing)
    print('Duplicate Phase A files in matrix:', duplicates)
    raise SystemExit(1)
PY
```

### PHA-TB-1 — Open-schema decision triage

Purpose: classify Phase A open-schema questions and A8/A9a delta entries into implementation-safe statuses before code changes.

Owned files:

- `docs/plans/prd-phase-a-completion-to-implementation-bridge.md`
- `docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md`
- Optional future ADR draft under `decisions/` only if HITL explicitly asks for policy promotion.

First failing/characterization test:

- A ledger completeness check fails until every open-schema anchor touched by the selected implementation path is listed with one status: `accepted`, `accepted-direction`, `proposed`, `deferred`, or `HITL-needed`.
- Minimum ledger anchors before selecting A8/A9a work: `a8-exam-finding-shape`, `a8-session-identity-and-completeness`, `a8-prn-trigger-shape`, `a8-reassessment-response-coupling`, `a8-assessment-cadence-openloops`, `a9a-canonical-subtype`, `a9a-order-kind-registry`, `a9a-verbal-order-metadata`, `a9a-order-lifecycle-discontinue-cancel`, and `a9a-result-fulfillment-pathway`.

Implementation boundary:

- Do not decide broad policy by implication.
- Do not use proposed ADR 017 as accepted authority.
- Do not edit `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md` or `decisions/` unless HITL selects a docs-maintenance/ADR action.
- Treat A8/A9a entries outside the canonical open-question catalog as candidate deltas until promoted.

Verification command:

```bash
python3 - <<'PY'
from pathlib import Path
prd = Path('docs/plans/prd-phase-a-completion-to-implementation-bridge.md').read_text()
required = ['a8-exam-finding-shape', 'a8-session-identity-and-completeness', 'a8-prn-trigger-shape', 'a8-reassessment-response-coupling', 'a8-assessment-cadence-openloops', 'a9a-canonical-subtype', 'a9a-order-kind-registry', 'a9a-verbal-order-metadata', 'a9a-order-lifecycle-discontinue-cancel', 'a9a-result-fulfillment-pathway']
statuses = ['accepted', 'accepted-direction', 'proposed', 'deferred', 'HITL-needed']
missing = [anchor for anchor in required if anchor not in prd]
if missing or not all(status in prd for status in statuses):
    print('Missing anchors:', missing)
    print('Status vocabulary present:', {status: status in prd for status in statuses})
    raise SystemExit(1)
PY
```

Open-schema triage ledger:

| Anchor | Candidate status | Why it is safe/blocked for first implementation |
|---|---|---|
| `a0a-structural-event-split` | accepted-direction | Existing repo already separates structural markdown from events; first implementation should characterize current behavior rather than redesign identity/encounter storage. |
| `a1-fulfillment-link` | accepted-direction | Current validator already rejects direct observation fulfillment and requires acquisition-action support for result observations; future work should preserve the action-mediated path. |
| `a2-intermediate-action-model` | accepted | Intermediate actions are implemented enough to guide result-producing order tests; challenge only with failing evidence. |
| `a8-exam-finding-shape` | proposed | Use `observation.exam_finding` as the candidate shape, but do not treat the full A8 payload as canonical until the selected A8 card proves it. |
| `a8-session-identity-and-completeness` | HITL-needed | Session shell vs `assessment_set_id` changes storage semantics and must not be accepted by implication. |
| `a8-prn-trigger-shape` | proposed | Prefer payload trigger metadata for tests only when TB-1/HITL narrows the first behavior; avoid new link kinds. |
| `a8-reassessment-response-coupling` | accepted-direction | Raw A8 observations must not `links.fulfills`; use action/assessment closure and keep findings as evidence. |
| `a8-assessment-cadence-openloops` | deferred | Global ICU cadence/profile policy is out of scope for first implementation; use explicit test fixture timing only. |
| `a9a-canonical-subtype` | accepted-direction | `intent.order` is already present in `src/validate.ts` status rules; keep order family in payload, not subtype sprawl. |
| `a9a-order-kind-registry` | proposed | A focused card may validate one or two `data.order_kind` values; closed/profile registry design remains later work. |
| `a9a-verbal-order-metadata` | deferred | Verbal/read-back/authentication behavior crosses ADR17/profile territory and is not first-card scope. |
| `a9a-order-lifecycle-discontinue-cancel` | proposed | Characterize status/supersession behavior only; do not add a full order lifecycle engine. |
| `a9a-result-fulfillment-pathway` | accepted-direction | Preserve acquisition-action-mediated result fulfillment; reject direct observation-to-order fulfillment. |

### PHA-TB-2 — A0–A2 ordered-result calibration card

Purpose: turn foundational demographics/constraints/problems/labs/results-review research into one bounded ordered-result implementation card.

Owned files for future implementation:

- `src/validate.test.ts`
- `src/validate.ts`
- `src/views/evidenceChain.test.ts`
- `src/views/evidenceChain.ts`
- `src/views/currentState.test.ts`
- `src/views/currentState.ts`
- `schemas/event.schema.json`
- selected `patients/patient_001/**` fixture files only if the test needs a persistent fixture

First failing/characterization test:

- Add a focused test proving a lab-producing `intent.order` is fulfilled only through an acquisition action such as `action.specimen_collection`, while `observation.lab_result` supports that action and must not directly `links.fulfills` the order.
- Characterize current `V-FULFILL-02` / `V-FULFILL-03` behavior before any schema or view change.

Implementation boundary:

- One lab/order/result-review behavior only.
- No broad A0 structural rewrite, no new patient/encounter primitive, and no direct observation-to-order fulfillment.
- No new top-level primitive unless TB-1 marks the exact decision `HITL-needed` and the human approves it.

Verification command:

```bash
node --test --import tsx src/validate.test.ts src/views/evidenceChain.test.ts src/views/currentState.test.ts && npm run typecheck && npm run check
```

### PHA-TB-3 — A8/A9a focused reassessment-order loop card

Purpose: convert ICU nursing assessment and individual-order research into one chart-visible loop without building a nursing flowsheet, CPOE, or MAR product.

Owned files for future implementation:

- `src/validate.test.ts`
- `src/validate.ts`
- `src/views/openLoops.test.ts`
- `src/views/openLoops.ts`
- `src/views/timeline.test.ts`
- `src/views/timeline.ts`
- `src/views/currentState.test.ts`
- `src/views/currentState.ts`
- `schemas/event.schema.json`
- selected `patients/patient_001/**` fixture files only if the test needs a persistent fixture

First failing/characterization test:

- Add a focused test proving raw `observation.exam_finding` cannot close an order/monitoring loop with `links.fulfills` or promote itself to problem truth with `links.addresses`; the loop closes only through an accepted action/assessment path, with the A8 finding as supporting chart-visible evidence.
- Add or characterize an `intent.order` / `intent.monitoring_plan` open-loop expectation only for the selected behavior.

Implementation boundary:

- One clinical behavior only.
- No hidden simulator state.
- No `nursing_assessment` event type, no new source kind such as `human_assessor`, no global ICU cadence rule, no adapter work.
- No full CPOE/MAR build, no A9b order-set/protocol parent, and no blood-product/restraint policy implementation unless HITL selects a later card.

Verification command:

```bash
node --test --import tsx src/validate.test.ts src/views/openLoops.test.ts src/views/timeline.test.ts src/views/currentState.test.ts && npm run typecheck && npm run check
```

### PHA-TB-4 — Phase A bridge acceptance report

Purpose: convert completed bridge/tracer evidence into the next board movement.

Owned files:

- `docs/plans/kanban-prd-board.md`
- Optional future `docs/plans/phase-a-bridge-acceptance-report.md`

First failing/characterization test:

- Report-section check fails until the report includes `Tests run`, `Pass/fail evidence`, `Deferred items`, `Boundary confirmation`, and `Next recommended card`.

Implementation boundary:

- Report only unless the active execution card explicitly includes product implementation.
- Do not mark PHA-001 complete unless the selected implementation card's verification command has run and evidence is pasted or linked.

Verification command:

```bash
python3 - <<'PY'
from pathlib import Path
path = Path('docs/plans/phase-a-bridge-acceptance-report.md')
if not path.exists():
    raise SystemExit('report not created yet')
text = path.read_text()
required = ['Tests run', 'Pass/fail evidence', 'Deferred items', 'Boundary confirmation', 'Next recommended card']
missing = [item for item in required if item not in text]
if missing:
    print('Missing report sections:', missing)
    raise SystemExit(1)
PY
```

## Explicit deferrals

- Product implementation until HITL selects the first tracer bullet.
- ADR17 actor/attestation/review policy and `communication.attestation.v1`.
- FHIR/adapter/export/legal/audit boundary work.
- Full CPOE, MAR, order-set/protocol parent, blood-product policy, restraint policy, and institutional profile systems.
- New dependencies, new top-level event types, and source-kind expansion.
- Edits to pi-agent or pi-sim, and any hidden simulator state access.

## Parallelization guidance

- PHA-TB-0 and PHA-TB-1 are safe as docs-only planning work.
- PHA-TB-2 and PHA-TB-3 both likely touch `src/validate.ts` and `schemas/event.schema.json`; run them sequentially unless one team integration owner owns those shared files.
- PHA-TB-4 runs after at least one selected implementation card has evidence.
- Any `$team` execution must appoint one integration/verifier lane to own final board/report edits and product-root diff review.
- Before implementation, capture the then-current dirty baseline separately from PHA-001 planning evidence. Current out-of-scope examples seen during this planning pass include unrelated planning docs and any product-root dirty files; do not treat them as PHA-001 implementation evidence.

## HITL checkpoint

Before implementation, ask the user to choose the first execution card:

1. PHA-TB-1 docs-only open-schema delta ledger first (lowest risk).
2. PHA-TB-2 A0–A2 ordered-result calibration first (lower product risk).
3. PHA-TB-3 A8/A9a focused reassessment-order loop first (highest new-source leverage, highest scope-control risk).

Do not invoke `$ralph`, `$team`, or direct implementation until the human selects one path.
