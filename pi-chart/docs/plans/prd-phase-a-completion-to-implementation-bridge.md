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

1. Every current `clinical-reference/phase-a/*.md` file is represented in a status matrix or explicit exclusion.
2. A8 and A9a files are no longer treated as missing/future in the durable board.
3. Each ready tracer bullet has purpose, owned files, first test/validation, implementation boundary, and verification command.
4. Open-schema questions touched by a tracer bullet are classified as accepted/proposed/deferred/HITL-needed.
5. No unscoped product code is changed outside selected tracer-bullet execution.
6. Future implementation starts with tests or executable validation.
7. Proposed ADR 017 remains non-canonical unless separately accepted.

## Tracer bullets

### PHA-TB-0 — Inventory and source-map refresh

Purpose: update Phase A source status after A8/A9a landed.

Owned files:

- `docs/plans/kanban-prd-board.md`
- `docs/plans/phase-a-status-matrix.md`

First test / validation:

- Run the exact-once structural check against `docs/plans/phase-a-status-matrix.md`.

Implementation boundary:

- Docs only.
- Do not edit clinical source docs except to fix obvious link/table errors with HITL approval.

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

Purpose: classify Phase A open schema questions into implementation-safe decisions before code changes.

Owned files:

- `docs/plans/prd-phase-a-completion-to-implementation-bridge.md`
- Optional future ADR draft under `decisions/` only if HITL asks for policy promotion.

First test / validation:

- Characterization table maps every open question touched by the selected surface to `accepted`, `proposed`, `deferred`, or `HITL-needed`.

Implementation boundary:

- Do not decide broad policy by implication.
- Do not use proposed ADR 017 as accepted authority.

Verification command:

```bash
grep -n "HITL-needed\|proposed\|deferred\|accepted" docs/plans/prd-phase-a-completion-to-implementation-bridge.md
```

### PHA-TB-2 — A0–A2 calibration implementation card

Purpose: turn foundational demographics/constraints/problems/labs/results-review research into one bounded implementation card.

Owned files for future implementation:

- `schemas/*.json`
- `src/validate.ts`
- `src/views/currentState.ts`
- `src/views/evidenceChain.ts`
- `src/views/openLoops.ts`
- focused tests under `src/**/*.test.ts`
- `patients/patient_001/**` or `patients/patient_002/**` only as selected by the future card

First failing/characterization test:

- Prove one selected A0–A2 behavior is currently unsupported or only partially characterized, then implement the smallest schema/view/fixture change needed.

Implementation boundary:

- One clinical behavior only.
- No broad schema rewrite.
- No new top-level primitive unless the open-schema triage marks it HITL-approved.

Verification command:

```bash
npm test && npm run typecheck && npm run check
```

### PHA-TB-3 — A8/A9a heavy-surface implementation card

Purpose: convert ICU nursing assessment and order primitive research into bounded tests and implementation cards.

Owned files for future implementation:

- `schemas/event.schema.json`
- `src/validate.ts`
- `src/views/openLoops.ts`
- `src/views/timeline.ts`
- focused tests under `src/views/*.test.ts` and `src/validate.test.ts`
- patient fixture files selected by the card

First failing/characterization test:

- Prove one chart-visible order/assessment loop behavior using current fixtures; start by asserting current behavior before adding schema/view support.

Implementation boundary:

- No hidden simulator state.
- No full CPOE/MAR product build.
- No adapter boundary work.

Verification command:

```bash
node --test --import tsx src/views/openLoops.test.ts src/validate.test.ts && npm run check
```

### PHA-TB-4 — Phase A bridge acceptance report

Purpose: convert completed bridge/tracer evidence into the next board movement.

Owned files:

- `docs/plans/kanban-prd-board.md`
- Optional future `docs/plans/phase-a-bridge-acceptance-report.md`

First test / validation:

- Report includes source inputs, tests run, pass/fail evidence, deferred items, and next recommended card.

Implementation boundary:

- Report only unless the active execution card explicitly includes product implementation.

Verification command:

```bash
grep -n "Verification\|Deferred\|Next recommended" docs/plans/*.md
```

## Parallelization guidance

After PHA-TB-0 and PHA-TB-1, PHA-TB-2 and PHA-TB-3 may run in parallel only if their owned files are split or one lane is docs-only. If both lanes need `schemas/event.schema.json` or `src/validate.ts`, run them sequentially or designate one integration owner.

## HITL checkpoint

Before implementation, ask the user to choose the first execution card:

1. A0–A2 calibration card first for lower risk.
2. A8/A9a heavy-surface card first for highest new-source leverage.
3. Run docs-only triage first, then split implementation across team lanes.
