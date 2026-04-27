# PRD — Kanban backlog expansion for durable PRD conversion

## Status

- Workflow: `$plan --consensus --direct`
- Source spec: `.omx/specs/deep-interview-prd-kanban-backlog-expansion.md`
- Planning surface: `docs/plans/README.md`, `docs/plans/kanban-prd-board.md`
- Scope: planning/backlog conversion only; no product-code implementation in this pass.
- Output posture: final plan for a later execution lane to update `docs/plans/**` and produce right-sized durable PRD/test-spec pairs.

## Requirements summary

The project has a large document load and not enough conversion into context-efficient execution surfaces. The clarified requirement is to perform a **prioritized hybrid** backlog expansion: keep Phase A as the deepest immediate execution workstream, convert every current backlog candidate into a durable PRD/test-spec or decision-PRD surface, and update the kanban board so future agents can select cards without rereading all `/memos` or local `.omx` history.

The plan must right-size detail. Phase A should be execution-ready. v0.3 reconciliation, ADR17 decision path, adapter/boundary future work, and `.omx` promotion policy should be durable enough to guide decisions and later execution, but not so deep that they recreate the document-sprawl problem.

## Brownfield evidence

- The deep-interview spec states the desired outcome: deepen Phase A, add durable PRD/test-spec pairs for every current backlog candidate, keep deferred areas thinner, and update the board for safe parallelization (`.omx/specs/deep-interview-prd-kanban-backlog-expansion.md:30-35`).
- The spec names the five in-scope backlog areas: PHA-001, V03-001, ADR17-001, BND-001, and DOC-002 (`.omx/specs/deep-interview-prd-kanban-backlog-expansion.md:39-50`).
- The spec forbids implementation/code changes, full deep PRDs for every area, final priority lock, and speculative adapter/FHIR/openEHR implementation (`.omx/specs/deep-interview-prd-kanban-backlog-expansion.md:52-57`).
- The spec allows OMX to choose PRD depth, add durable `docs/plans` files, update kanban statuses, classify evidence, recommend order, and perform light source-doc cleanup (`.omx/specs/deep-interview-prd-kanban-backlog-expansion.md:59-68`).
- The durable board already explains that PRD cards carry source/conflict context and tracer cards carry owned files, first tests, boundaries, and verification commands (`docs/plans/kanban-prd-board.md:6-13`).
- The durable board already lists PHA-001 as ready and V03-001, ADR17-001, BND-001, and DOC-002 as backlog/blocked/deferred candidates (`docs/plans/kanban-prd-board.md:52-77`).
- The durable README instructs agents to read the board, linked PRD/test-spec, and named source inputs, then start with tests/validation (`docs/plans/README.md:23-30`).
- The durable README preserves source authority: accepted ADRs and Phase A controls outrank roadmap; `/memos` are evidence/proposals; `.omx/plans` are execution history unless promoted (`docs/plans/README.md:11-21`).

## RALPLAN-DR summary

### Principles

1. **Conversion beats accumulation:** every new artifact must make future work easier to execute, not just add narrative.
2. **Right-sized depth:** Phase A gets full execution detail; deferred/decision areas get thinner PRD/test-spec surfaces until selected.
3. **Authority stays explicit:** accepted ADRs and Phase A controls govern; `/memos`, `.omx`, and proposed ADR17 remain evidence/proposals until promoted.
4. **HITL without paralysis:** recommend sequence and statuses, but keep final execution order and policy acceptance reviewable.
5. **Parallelization by ownership:** cards must expose owned files/surfaces and shared-file conflicts before team execution.

### Decision drivers

1. **Document-load pressure:** the user needs more conversion into executable cards, not more broad memo synthesis.
2. **Existing board gap:** one durable PRD pair exists for Phase A, while four listed backlog candidates still lack durable PRD/test-spec surfaces.
3. **Implementation safety:** future code changes will touch shared schemas/validators/views, so the board must make sequencing and ownership explicit before parallelization.

### Viable options

| Option | Approach | Pros | Cons | Verdict |
|---|---|---|---|---|
| A. Prioritized hybrid expansion | Deepen PHA-001 and add right-sized PRD/test-spec surfaces for V03, ADR17, boundary, and `.omx` promotion. | Satisfies the clarified spec; reduces context load; keeps immediate vs deferred depth distinct. | More planning output than a single-workstream pass. | **Chosen** |
| B. Phase A-only deepening | Ignore other backlog candidates until PHA-001 is fully ready for code. | Fastest path to one implementation lane; lowest risk of planning spread. | Violates user-selected all-five conversion need; leaves backlog sprawl unresolved. | Rejected |
| C. Equal-depth PRD rewrite for all | Create full execution PRDs/test specs for every backlog candidate now. | Uniform surface; looks complete. | Recreates document overload and over-specifies deferred work. | Rejected |
| D. `.omx` promotion first | Promote historical `.omx/plans` outputs before new PRDs. | Preserves prior work; improves durability. | Delays conversion of current backlog and can become archive work. | Rejected as primary; kept as DOC-002 |

## Decision

Use **Option A: Prioritized hybrid expansion**.

The later execution lane should update the durable board and create/adjust these planning artifacts:

| Card | Artifact depth | Durable outputs |
|---|---|---|
| PHA-001 | Deep execution-ready PRD | Update `docs/plans/prd-phase-a-completion-to-implementation-bridge.md`; update paired test spec; add `docs/plans/phase-a-status-matrix.md` if useful. |
| V03-001 | Thin reconciliation decision PRD | Add `docs/plans/prd-v03-foundation-reconciliation.md` and `docs/plans/test-spec-v03-foundation-reconciliation.md`. |
| ADR17-001 | Thin policy decision PRD | Add `docs/plans/prd-adr17-actor-attestation-decision.md` and `docs/plans/test-spec-adr17-actor-attestation-decision.md`. |
| BND-001 | Thin deferred-boundary PRD | Add `docs/plans/prd-adapter-boundary-future-work.md` and `docs/plans/test-spec-adapter-boundary-future-work.md`. |
| DOC-002 | Thin maintenance/promotion PRD | Add `docs/plans/prd-omx-planning-history-promotion.md` and `docs/plans/test-spec-omx-planning-history-promotion.md`. |

## In scope

- Update `docs/plans/kanban-prd-board.md` so all five cards have durable links, statuses, source inputs, and next actions.
- Deepen PHA-001 enough to support implementation selection: Phase A status matrix, open-schema triage status, and sharpened tracer bullets.
- Add right-sized PRD/test-spec pairs for V03-001, ADR17-001, BND-001, and DOC-002.
- Add explicit parallelization notes: which cards are docs-only, which may later touch shared `schemas/event.schema.json` / `src/validate.ts`, and which must stay sequential.
- Preserve source authority and memo/proposal classification.

## Out of scope

- Product-code implementation.
- Treating ADR17 as accepted policy.
- Full deep PRDs for all backlog areas.
- Speculative adapter/FHIR/openEHR build.
- Destructive source-document moves/deletes.
- Final binding execution priority.

## Implementation plan for later execution lane

### Step 1 — Board schema and status normalization

Owned files:

- `docs/plans/kanban-prd-board.md`
- Optional: `docs/plans/phase-a-status-matrix.md`

Actions:

1. Add a stable card-state legend: `Done`, `Ready for PRD execution`, `Ready for tracer execution`, `Needs decision PRD`, `Deferred`, `Blocked`, `Maintenance`.
2. Update all five cards with: source inputs, artifact depth, planned durable outputs, next action, HITL gate, and parallelization notes.
3. Add a structural check command to prove every `clinical-reference/phase-a/*.md` file is either represented in the board or in `phase-a-status-matrix.md`.

Acceptance:

- Board lists PHA-001, V03-001, ADR17-001, BND-001, DOC-002 with statuses and links/placeholders.
- Board contains enough metadata for an agent to pick a card without reading every memo.

### Step 2 — Deepen PHA-001 as immediate execution surface

Owned files:

- `docs/plans/prd-phase-a-completion-to-implementation-bridge.md`
- `docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md`
- Optional: `docs/plans/phase-a-status-matrix.md`

Actions:

1. Add or link a Phase A status matrix covering current A0a-A9a files.
2. Expand PHA-TB-0/PHA-TB-1 into concrete docs-only triage cards.
3. Keep PHA-TB-2 and PHA-TB-3 as implementation candidates, but ensure each lists likely shared-file conflicts.
4. Add a HITL checkpoint that chooses whether lower-risk A0-A2 calibration or higher-leverage A8/A9a heavy-surface work executes first.

Acceptance:

- Phase A is the deepest card and is ready for implementation-planning handoff.
- PHA implementation cards still start with tests or executable validation.

### Step 3 — Add V03-001 reconciliation decision PRD/test-spec

Owned files:

- `docs/plans/prd-v03-foundation-reconciliation.md`
- `docs/plans/test-spec-v03-foundation-reconciliation.md`
- Board row for V03-001

Actions:

1. Summarize source inputs: `memos/pi-chart-v03-memo.md`, accepted ADR 009/010/011/015/016, proposed ADR17, and `ROADMAP.md`.
2. Define the decision output: accepted/current, stale/superseded, deferred, and needs-ADR buckets.
3. Keep it as a decision PRD, not execution PRD, unless HITL selects it.

Acceptance:

- v0.3 memo proposals cannot silently become implementation scope.
- The PRD identifies which v0.3 tensions can block Phase A or ADR17 work.

### Step 4 — Add ADR17-001 actor-attestation decision PRD/test-spec

Owned files:

- `docs/plans/prd-adr17-actor-attestation-decision.md`
- `docs/plans/test-spec-adr17-actor-attestation-decision.md`
- Board row for ADR17-001

Actions:

1. Treat `decisions/017-actor-attestation-review-taxonomy.md` as proposed until accepted.
2. Define decision paths: accept as ADR, revise, split, defer, or reject.
3. Specify downstream effects on Workstream A, Phase A notes, and any future review/attestation workflow.

Acceptance:

- No implementation card treats ADR17 taxonomy as canonical without HITL/ADR approval.
- The card gives a clear next decision action.

### Step 5 — Add BND-001 adapter/boundary future-work PRD/test-spec

Owned files:

- `docs/plans/prd-adapter-boundary-future-work.md`
- `docs/plans/test-spec-adapter-boundary-future-work.md`
- Board row for BND-001

Actions:

1. Summarize FHIR/boundary/openEHR adapter source inputs.
2. Define deferral boundaries and conditions that would make boundary work ready.
3. Explicitly prohibit speculative adapter implementation in this pass.

Acceptance:

- Boundary work is visible but cannot pollute immediate chart-core Phase A execution.
- Future adapter readiness is tied to concrete prerequisites, not vague integration interest.

### Step 6 — Add DOC-002 `.omx` promotion policy PRD/test-spec

Owned files:

- `docs/plans/prd-omx-planning-history-promotion.md`
- `docs/plans/test-spec-omx-planning-history-promotion.md`
- Board row for DOC-002

Actions:

1. Define which `.omx/plans` artifacts are execution history vs candidates for tracked promotion.
2. Provide a promotion checklist: durable value, non-duplicative, source-linked, current enough, not runtime churn.
3. Avoid force-adding `.omx` wholesale.

Acceptance:

- Future agents know how to promote useful local planning history without dragging runtime state into tracked docs.

### Step 7 — Structural verification and handoff summary

Owned files:

- `docs/plans/kanban-prd-board.md`
- All new/updated `docs/plans/prd-*.md` and `docs/plans/test-spec-*.md`

Actions:

1. Run structural checks listed in the paired test spec.
2. Check that every board-linked PRD/test-spec file exists.
3. Check that each card has source inputs, next action, boundary, HITL gate, and verification path.
4. Report recommended execution order and parallelization constraints.

Acceptance:

- The board and linked artifacts form a navigable backlog.
- No product code changes occur in the expansion pass.

## Testable acceptance criteria

1. `docs/plans/kanban-prd-board.md` includes all five current backlog areas and links to durable artifacts or explicit placeholders.
2. PHA-001 remains the only deep immediate execution PRD and has sharper status/tracer detail.
3. V03-001, ADR17-001, BND-001, and DOC-002 each have a right-sized PRD/test-spec pair.
4. Each PRD/test-spec pair states source inputs, authority constraints, acceptance criteria, and verification commands.
5. The board states which cards may parallelize and which share likely implementation files.
6. A structural check proves every linked `docs/plans/prd-*.md` has a paired `docs/plans/test-spec-*.md`, excluding index/readme/status-matrix files.
7. A structural check proves Phase A files are represented in board/status matrix.
8. No `src/**`, `schemas/**`, `patients/**`, or product test files are modified by the backlog-expansion execution pass.

## Verification steps

```bash
# 1. All board-linked planned PRDs/test-specs exist after execution.
python3 - <<'PY'
from pathlib import Path
expected = [
  'docs/plans/prd-phase-a-completion-to-implementation-bridge.md',
  'docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md',
  'docs/plans/prd-v03-foundation-reconciliation.md',
  'docs/plans/test-spec-v03-foundation-reconciliation.md',
  'docs/plans/prd-adr17-actor-attestation-decision.md',
  'docs/plans/test-spec-adr17-actor-attestation-decision.md',
  'docs/plans/prd-adapter-boundary-future-work.md',
  'docs/plans/test-spec-adapter-boundary-future-work.md',
  'docs/plans/prd-omx-planning-history-promotion.md',
  'docs/plans/test-spec-omx-planning-history-promotion.md',
]
missing = [p for p in expected if not Path(p).exists()]
print('\n'.join(missing))
raise SystemExit(1 if missing else 0)
PY

# 2. Phase A file coverage remains complete.
python3 - <<'PY'
from pathlib import Path
surface = ''
for p in Path('docs/plans').glob('*.md'):
    surface += p.read_text(errors='ignore') + '\n'
missing = [str(p) for p in sorted(Path('clinical-reference/phase-a').glob('*.md')) if str(p) not in surface]
print('\n'.join(missing))
raise SystemExit(1 if missing else 0)
PY

# 3. Product implementation roots are untouched by this planning execution.
git diff --name-only -- src schemas patients scripts | sed -n '1,80p'
```

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| The pass creates more document volume instead of reducing load. | Use right-sized depth: full detail for PHA-001, thin decision PRDs for deferred areas. |
| Deferred PRDs become pseudo-approval for implementation. | Each decision/deferred PRD must include explicit HITL and authority gates. |
| ADR17 becomes canonical by path alone. | ADR17 PRD must state proposed status and decision paths before implementation. |
| Boundary/adapter work pulls effort away from chart core. | BND-001 must define readiness prerequisites and prohibit speculative build. |
| Parallel agents collide on shared schema/validator files later. | Board must expose shared-file conflicts before execution. |
| `.omx` promotion drags runtime churn into tracked docs. | DOC-002 uses a promotion checklist and rejects wholesale `.omx` tracking. |

## Recommended execution order

1. Execute Step 1 and Step 2 together as the immediate board/Phase A deepening lane.
2. Execute Steps 3-6 as thin PRD/test-spec creation lanes; these can run in parallel if each owns distinct new files plus coordinated board updates.
3. Run Step 7 as integration/verification after all PRD/test-spec artifacts exist.
4. HITL chooses first implementation card only after the board links and right-sized PRD surfaces are complete.

## Available-agent-types roster

- `explore`: file/source mapping and exact source-reference lookup.
- `planner`: PRD/test-spec structure and sequencing.
- `architect`: authority boundaries, cross-workstream design consistency, antithesis review.
- `critic`: acceptance criteria, risk, and verification quality.
- `executor`: later artifact creation or implementation in owned files.
- `test-engineer`: structural checks and future TDD shaping.
- `verifier`: completion evidence and no-product-code-change validation.
- `writer`: concise durable-doc wording.
- `security-reviewer`: boundary checks if adapter/hidden-sim risk increases.

## Follow-up staffing guidance

### `$ralph` sequential path

Use when one owner should update the board and create all PRD/test-spec pairs in order.

Suggested lane:

1. `executor` for docs/plans artifact creation.
2. `test-engineer` for structural checks.
3. `verifier` for final proof and product-root untouched check.

Suggested launch:

```bash
$ralph .omx/plans/prd-kanban-backlog-expansion.md
```

### `$team` parallel path

Use when creating the four thin PRD/test-spec pairs in parallel is worth coordination overhead.

Suggested lanes:

1. Phase A lane: update PHA-001/status matrix.
2. v0.3 lane: create V03-001 pair.
3. ADR17 lane: create ADR17-001 pair.
4. Boundary lane: create BND-001 pair.
5. `.omx` promotion lane: create DOC-002 pair.
6. Integration/verifier lane: reconcile board and run structural checks.

Suggested launch:

```bash
$team .omx/plans/prd-kanban-backlog-expansion.md
```

Team verification path:

- Team proves every planned PRD/test-spec exists, board links resolve, Phase A files are represented, and product roots are untouched.
- Ralph or verifier then performs final integration review and recommends the first implementation card for HITL approval.

## ADR — Backlog expansion depth strategy

### Decision

Adopt a prioritized hybrid backlog expansion: deepen PHA-001 and create right-sized PRD/test-spec surfaces for V03-001, ADR17-001, BND-001, and DOC-002.

### Drivers

- The user needs conversion from document load into executable work surfaces.
- Existing durable board has only one PRD/test-spec pair and four underdeveloped backlog areas.
- Future parallelization requires clear ownership and shared-file conflict visibility.

### Alternatives considered

- Phase A-only deepening: rejected because it leaves the rest of the board in document-load state.
- Equal-depth PRDs for all: rejected because it recreates sprawl.
- `.omx` promotion first: rejected as primary because it can become archive work before backlog conversion.

### Why chosen

The hybrid approach matches the clarified interview constraints: all backlog areas get durable surfaces, but depth is right-sized so immediate execution is clear without overbuilding deferred areas.

### Consequences

- More tracked planning docs will be added under `docs/plans`.
- The board becomes the coordination surface for future agents.
- Deferred areas become visible and bounded, not forgotten or accidentally implemented.

### Follow-ups

- Execute the backlog-expansion plan via `$ralph` or `$team`.
- After completion, run HITL selection for the first implementation card.
- Consider promoting select `.omx/plans` reports only via DOC-002 criteria.

## Plan changelog

- Initial consensus draft created from `.omx/specs/deep-interview-prd-kanban-backlog-expansion.md`.

## Consensus review addendum — required execution safeguards

Architect approved the plan and Critic requested these tightenings before execution. They are binding for any later `$ralph` or `$team` lane using this PRD.

### Board integration ownership

- `docs/plans/kanban-prd-board.md` has one owner: the integration/verifier lane.
- Parallel lanes for V03-001, ADR17-001, BND-001, and DOC-002 own their new PRD/test-spec files only.
- Parallel lanes may emit board row snippets in their own handoff notes, but must not independently edit the board.
- The integration/verifier lane performs the final board merge after all PRD/test-spec pairs exist.

### Product-root baseline diffing

Before backlog-expansion execution, capture current product-root state because the repo may already contain Workstream A changes:

```bash
git status --short -- src schemas patients scripts
git diff --name-only -- src schemas patients scripts
git ls-files --others --exclude-standard -- src schemas patients scripts
```

Final verification compares against this baseline. It must prove the backlog-expansion pass introduced no new product-root changes; it must not assume the repo starts clean.

### Exact Phase A coverage validation

Phase A coverage must be represented in one canonical table: either `docs/plans/phase-a-status-matrix.md` or the board's `Phase A current file coverage` section. The verification must require every `clinical-reference/phase-a/*.md` file exactly once in that canonical table.

```bash
python3 - <<'PY'
from pathlib import Path
phase_files = [str(p) for p in sorted(Path('clinical-reference/phase-a').glob('*.md'))]
candidates = [Path('docs/plans/phase-a-status-matrix.md'), Path('docs/plans/kanban-prd-board.md')]
text = ''
for p in candidates:
    if p.exists():
        t = p.read_text(errors='ignore')
        if 'Phase A current file coverage' in t or p.name == 'phase-a-status-matrix.md':
            text += t + '\n'
missing = [p for p in phase_files if text.count(p) == 0]
duplicates = [p for p in phase_files if text.count(p) > 1]
if missing or duplicates:
    print('Missing:', missing)
    print('Duplicates:', duplicates)
    raise SystemExit(1)
PY
```

### Thin PRD guardrail

V03-001, ADR17-001, BND-001, and DOC-002 are thin decision/backlog PRDs, not deep execution PRDs. Target 150-200 lines or less unless a concrete source conflict requires more. Required sections only:

1. Status and source inputs.
2. Authority/proposal status.
3. Decision options.
4. HITL gate.
5. Acceptance criteria.
6. Verification command or structural check.
7. Explicit deferrals.

They must not include broad implementation plans, large memo restatements, or product-code ownership unless HITL later selects the card for execution.

### ADR17 non-canonical requirement

The ADR17 board row and `docs/plans/prd-adr17-actor-attestation-decision.md` must begin with the equivalent of:

> Status: proposed / non-canonical; requires HITL/ADR approval before implementation policy.

Verification:

```bash
grep -E "proposed|non-canonical|HITL/ADR approval" docs/plans/prd-adr17-actor-attestation-decision.md
```

### Revised team path rule

In `$team` execution, create thin PRD/test-spec pairs in parallel only when each lane owns distinct new files. The integration/verifier lane owns final `docs/plans/kanban-prd-board.md` edits, Phase A exact-coverage validation, product-root baseline comparison, and final handoff summary.

## Consensus review changelog

- Architect verdict: APPROVE.
- Critic verdict: ITERATE before addendum.
- Applied required improvements: board integration ownership, baseline diffing, exact Phase A coverage validation, thin PRD size/content limits, ADR17 non-canonical status check, and revised team integration rule.
