# RALPLAN — PHA-001 change review and slice implementation preparation

Status: approved by Architect and Critic; implementation remains HITL-gated  
Scope: review the current working-tree changes, prepare implementation slices, and stop before implementation.  
Durable backlog entrypoint: `docs/plans/kanban-prd-board.md`  
Primary PHA-001 artifacts: `docs/plans/prd-phase-a-completion-to-implementation-bridge.md`, `docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md`, `docs/plans/phase-a-status-matrix.md`

## Requirements summary

The current PHA-001 changes deepen the Phase A bridge into an implementation DAG. The planning lane must validate readiness, identify blockers, and prepare context-efficient implementation slices without touching product implementation. Execution remains HITL-gated.

Hard boundaries preserved:

- `pi-chart` remains a bounded chart/EHR subsystem.
- No `pi-agent` to `pi-sim` coupling and no hidden simulator reads.
- ADR17 remains non-canonical unless explicitly approved through its own lane.
- No new dependencies for PHA-001 implementation.
- Tests/characterization must precede implementation changes.

## RALPLAN-DR summary

### Principles

1. **Review before implementation:** no product-root edits in this planning pass.
2. **Exact source truth:** current `clinical-reference/phase-a/*.md` inputs must be either represented exactly once or explicitly excluded with rationale.
3. **Slice isolation:** view-layer characterization slices must not own validator/schema edits; validator/schema work must be centralized in PHA-TB-V.
4. **Tests first:** each implementation slice starts by writing or running the first failing/characterization test named in the PRD/spec.
5. **HITL for policy and branch choices:** canonical open-schema merges, A9b disposition, ADR17, dependencies, and implementation start require human approval.

### Decision drivers

1. The PHA docs now define a useful hard DAG: PHA-TB-1 before code, TB-2/TB-3 as view-only failing-test emitters, TB-V as the only validator/schema lane, and TB-4 as evidence report.
2. The workspace contains out-of-scope changes and untracked artifacts; implementation would be ambiguous unless baseline/disposition is explicit.
3. The PHA exact-once structural check currently fails because `clinical-reference/phase-a/a9b-orderset-invocation-synthesis.md` is untracked and absent from `phase-a-status-matrix.md`.

### Viable options

| Option | Approach | Pros | Cons | Verdict |
|---|---|---|---|---|
| A. Start PHA-TB-1 implementation immediately | Treat the current DAG as ready and edit `OPEN-SCHEMA-QUESTIONS.md`. | Fastest path; aligns with board hard gate. | Fails exact-once source check; silently ignores/disposes A9b; skips required HITL for canonical merge. | Rejected for now. |
| B. Add a preflight blocker-resolution slice, then run TB-1 | Resolve source-matrix/A9b and dirty-baseline disposition before any implementation slice. | Preserves source truth; keeps no-dependency/no-scope-creep boundary; makes TB-1 safe. | Adds one docs-only step before implementation. | Chosen. |
| C. Fold dashboard/prototype changes into PHA-001 execution | Treat dashboard/playwright/prototypes as part of implementation preparation. | Could improve visibility of backlog. | Adds a new dependency and unrelated UI/prototype scope; violates PHA-001 no-new-dependencies boundary unless separately approved. | Rejected / separate lane. |

## Review findings

### Approved direction

- `docs/plans/kanban-prd-board.md` now identifies PHA-001 as the durable PRD card and states a hard DAG for tracer execution.
- PHA-TB-2 and PHA-TB-3 are correctly re-cut as view-layer characterization lanes that do **not** own `src/validate.ts`, `src/validate.test.ts`, or `schemas/event.schema.json`.
- PHA-TB-V is the only validator/schema integration lane and is explicitly downstream of failing tests from TB-2/TB-3.
- ADR17 remains proposal/non-canonical in the board/PRD language.

### Blockers before implementation

1. **PHA exact-once check is red.** `clinical-reference/phase-a/a9b-orderset-invocation-synthesis.md` exists in the workspace but has no row in `docs/plans/phase-a-status-matrix.md`. Until HITL decides whether to include it now or quarantine it explicitly, PHA-TB-0 is not complete.
2. **Canonical open-schema merge is a policy-affecting docs implementation.** PHA-TB-1 now owns `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md`; this is appropriate, but it must be explicitly approved before running because it promotes accepted/accepted-direction anchors into the canonical register.
3. **Dashboard/prototype changes are out of PHA-001 scope.** `package.json` adds a `playwright` dev dependency and prototype scripts; untracked cockpit/prototype/design files are present. They may be useful, but they are not PHA-001 implementation evidence. If carried, they must be split into a separate UI/prototype lane or explicitly baselined as out-of-scope. The current dashboard HITL UI must not be treated as authoritative for PHA-001 until it reflects the PHA-TB-1 hard gate before TB-2/TB-3.

### Verification evidence collected in this planning pass

- `node --test --import tsx scripts/dashboard.test.ts` passed: 11/11 tests.
- `npm run typecheck` passed.
- `npm test && npm run check` passed: full test suite and chart validation green.
- PHA exact-once structural check failed because `clinical-reference/phase-a/a9b-orderset-invocation-synthesis.md` is missing from the matrix.

## Refined acceptance criteria for implementation readiness

1. `docs/plans/kanban-prd-board.md` remains the durable PHA-001 entrypoint and links the PRD, test spec, and status matrix.
2. Every current `clinical-reference/phase-a/*.md` file is represented exactly once in `docs/plans/phase-a-status-matrix.md`, **or** an explicit exclusion/quarantine rationale is documented and enforced by the structural check.
3. PHA-TB-1 classifies all A8/A9a anchors with exactly one status and does not silently accept proposed ADR17 or A9b policy.
4. Accepted/accepted-direction anchors are merged into `OPEN-SCHEMA-QUESTIONS.md` only after HITL approval.
5. TB-2 and TB-3 may add failing/characterization tests and append-only fixture events, but they may not edit validator/schema files.
6. TB-V may edit only `src/validate.ts`, `src/validate.test.ts`, and `schemas/event.schema.json`, and only after a TB-2/TB-3 red test exists.
7. No slice introduces new dependencies, top-level event types, source-kind expansion, adapter/FHIR/export behavior, hidden simulator reads, or pi-agent/pi-sim coupling.
8. Out-of-scope dirty files are resolved, split, or explicitly baselined before implementation evidence is interpreted.
9. Each slice records its verification command and result in a future acceptance report before board status advances.

## Implementation slices prepared

### Slice 0 — PHA-TB-0: Source/matrix and dirty-baseline preflight

- **Purpose:** make implementation start unambiguous by resolving the A9b source-matrix failure and quarantining out-of-scope dirty work. Note: `a9b-order-sets.md` appears inside the A9b synthesis as a prior/council artifact reference, but the current workspace Phase A file requiring exact-once disposition is `clinical-reference/phase-a/a9b-orderset-invocation-synthesis.md`.
- **Owned files:** `docs/plans/phase-a-status-matrix.md`; optionally `docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md` if exclusion logic changes; no product-root files.
- **First failing/characterization test:** exact-once Phase A path check currently fails on `clinical-reference/phase-a/a9b-orderset-invocation-synthesis.md`.
- **Verification command:**
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
- **Exit criteria:** A9b is either added to the matrix as a proposal/current input with next action, or explicitly excluded/quarantined with rationale and check support. Out-of-scope dashboard/prototype/dependency changes are not treated as PHA-001 evidence.

### Slice 1 — PHA-TB-1: Open-schema decision triage hard gate

- **Purpose:** classify all 30 A8/A9a anchors and merge accepted/accepted-direction anchors into canonical `OPEN-SCHEMA-QUESTIONS.md`.
- **Owned files:** `docs/plans/prd-phase-a-completion-to-implementation-bridge.md`; `docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md`; `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md`.
- **First failing/characterization test:** PRD ledger completeness and canonical-merge check from the PRD. It should fail until every promoted anchor is present in the canonical register.
- **Verification command:** the PHA-TB-1 Python command in `docs/plans/prd-phase-a-completion-to-implementation-bridge.md` under PHA-TB-1.
- **Exit criteria:** ledger statuses are unique; canonical register contains promoted anchors; ADR17 remains non-canonical; no product-root files changed.

### Slice 2A — PHA-TB-2: Ordered-result view characterization

- **Purpose:** characterize `intent.order ← action.specimen_collection ← observation.lab_result` in view code and emit a failing test for TB-V if validator/schema support is missing.
- **Owned files:** `src/views/evidenceChain.ts`; `src/views/evidenceChain.test.ts`; `src/views/currentState.ts`; `src/views/currentState.test.ts`; append-only fixture events in `patients/patient_001/timeline/2026-04-18/events.ndjson` with `tb2-` IDs if needed.
- **First failing/characterization test:** `evidenceChain: lab_result reaches intent.order via action.specimen_collection (PHA-TB-2)`.
- **Verification command:**
  ```bash
  node --test --import tsx src/views/evidenceChain.test.ts src/views/currentState.test.ts && npm run typecheck
  git diff --name-only -- src/ schemas/ patients/ | grep -vE '^(src/views/(evidenceChain|currentState)(\.test)?\.ts|patients/patient_001/timeline/2026-04-18/events\.ndjson)$' \
    && { echo 'TB-2 edited files outside its boundary'; exit 1; } || true
  ```
- **Exit criteria:** new view tests define the desired chain; expected RED is acceptable slice evidence only when paired with a `// HANDOFF:` comment naming the validator/schema delta and boundary proof showing no edits to `src/validate.ts`, `src/validate.test.ts`, or `schemas/event.schema.json`.

### Slice 2B — PHA-TB-3: Focused reassessment/open-loop view characterization

- **Purpose:** characterize `observation.exam_finding` as evidence, not closure; fulfillment/closure must flow through `action.*` only; nursing-scope `assessment.*` may support, address, or interpret but must not fulfill an intent unless HITL/ADR explicitly changes Invariant 10.
- **Owned files:** `src/views/openLoops.ts`; `src/views/openLoops.test.ts`; `src/views/timeline.ts`; `src/views/timeline.test.ts`; append-only fixture events in `patients/patient_001/timeline/2026-04-18/events.ndjson` with `tb3-` IDs if needed.
- **First failing/characterization test:** `openLoops: observation.exam_finding alone does NOT close intent.monitoring_plan (PHA-TB-3)` plus paired timeline evidence-row assertion.
- **Verification command:**
  ```bash
  node --test --import tsx src/views/openLoops.test.ts src/views/timeline.test.ts && npm run typecheck
  git diff --name-only -- src/ schemas/ patients/ | grep -vE '^(src/views/(openLoops|timeline)(\.test)?\.ts|patients/patient_001/timeline/2026-04-18/events\.ndjson)$' \
    && { echo 'TB-3 edited files outside its boundary'; exit 1; } || true
  ```
- **Exit criteria:** finding-only scenario remains open; action-only fulfillment/closure scenario closes when expressible; nursing-scope assessment may appear as supporting/addressing context but not as the fulfilling event. Expected RED is acceptable slice evidence only when paired with a `// HANDOFF:` comment naming the validator/schema delta and boundary proof showing no validator/schema/currentState edits in this slice.

### Slice 3 — PHA-TB-V: Validator + schema integration

- **Purpose:** consume failing TB-2/TB-3 tests and land bounded validator support, with schema edits only if a narrow existing schema hook is already present.
- **Owned files:** `src/validate.ts`; `src/validate.test.ts`; `schemas/event.schema.json` only for narrow existing-hook edits. Do **not** introduce broad conditional schema machinery in this slice; enforce `specimen_collection` / `finding_state` in validator only unless a narrow existing schema hook is found; escalate if schema enforcement requires refactoring the schema model.
- **First failing/characterization test:** run `npm test` and confirm at least one TB-2/TB-3 test is red before editing.
- **Verification command:**
  ```bash
  npm test
  npm run typecheck
  npm run check
  git diff --name-only -- src/ schemas/ | grep -vE '^(src/(validate\.ts|validate\.test\.ts)|schemas/event\.schema\.json)$' \
    && { echo 'TB-V edited files outside its boundary'; exit 1; } || true
  ```
- **Exit criteria:** red TB tests become green; no broad validator refactor; no broad schema refactor/conditional schema machinery; no unrelated schema/source-kind expansion.

### Slice 4 — PHA-TB-4: Acceptance report and next gate

- **Purpose:** convert execution evidence into board/report status and choose the next gate.
- **Owned files:** `docs/plans/kanban-prd-board.md`; future `docs/plans/phase-a-bridge-acceptance-report.md`.
- **First failing/characterization test:** report-section and evidence-linkage checks fail until the report includes tests run, stdout/exit evidence, deferrals, boundary confirmation, and next recommended card.
- **Verification command:** the PHA-TB-4 Python report structural command in the PRD.
- **Exit criteria:** accepted evidence is linked; board advances only after verification output is pasted/linked; HITL chooses next move.

## Explicit deferrals

- Product implementation until HITL approves the preflight disposition and first implementation slice.
- A9b order-set invocation semantics unless HITL chooses to include `clinical-reference/phase-a/a9b-orderset-invocation-synthesis.md` in current Phase A matrix/triage.
- Dashboard/cockpit/prototype work, dashboard HITL UI behavior, and the `playwright` dependency unless approved as a separate UI/prototype lane; until then they are non-authoritative for PHA-001 execution.
- ADR17 actor/attestation/review policy and `communication.attestation.v1`.
- FHIR/adapter/export/legal/audit boundary work.
- Full CPOE, MAR, order-set/protocol parent lifecycle, blood-product policy, restraint policy, and institutional profile systems.
- New dependencies, new top-level event types, source-kind expansion, pi-agent edits, pi-sim edits, or hidden simulator state access.

## ADR

### Decision

Choose Option B: insert a docs-only preflight blocker-resolution slice before implementation, then run PHA-TB-1 as the hard gate, then TB-2/TB-3 view-layer characterization, then TB-V validator/schema integration, then TB-4 report.

### Drivers

- Current PHA exact-once check is red due to A9b.
- Current working tree includes unrelated dashboard/prototype/dependency changes.
- Existing PHA docs have good slice boundaries but require HITL before canonical open-schema merge.

### Alternatives considered

- Start implementation immediately: rejected due red structural check and HITL/canonical-register risk.
- Treat dashboard/prototype changes as PHA evidence: rejected because of new dependency and scope mismatch.

### Why chosen

This route preserves context efficiency while preventing silent scope expansion. It keeps all product-code implementation test-first and lets future `$ralph` or `$team` execution start from precise slices.

### Consequences

- One extra docs-only preflight step occurs before product implementation.
- PHA-TB-1 remains the first implementation-prep card and hard gate.
- TB-2/TB-3 can later run in parallel only after fixture-ID coordination is explicit.

### Follow-ups

- HITL decides A9b include vs quarantine.
- HITL approves canonical `OPEN-SCHEMA-QUESTIONS.md` merge scope.
- Split or baseline dashboard/prototype/playwright changes before PHA implementation.

## Available-agent-types roster

- `planner`: refine/sequence slice plan and gate decisions.
- `architect`: validate subsystem boundaries, DAG, and authority model.
- `critic`: enforce testability, alternatives, risks, and verification sufficiency.
- `explore`: fast repo-local symbol/file mapping before a slice starts.
- `executor`: implement a bounded slice after approval, using the repo's actual async view APIs and test helpers (`makeEmptyPatient`, `appendRawEvent`) rather than conceptual pseudocode.
- `test-engineer`: strengthen first failing tests and fixture strategy.
- `verifier`: run evidence collection and boundary diff checks.
- `code-reviewer`: final review after implementation, especially TB-V.

## Follow-up staffing guidance

### `$ralph` sequential path

Recommended when the human wants conservative single-owner execution:

1. `planner`/leader: PHA-TB-0 + TB-1 docs gate.
2. `executor`: one slice at a time.
3. `test-engineer`: first-test shape for TB-2/TB-3.
4. `verifier`: after each slice, run exact verification command and boundary diff.
5. `code-reviewer` or `architect`: review TB-V before acceptance report.

Suggested reasoning: high for PHA-TB-0/TB-1 authority decisions and TB-V; medium for view slices; high for verifier on final report.

### `$team` parallel path

Recommended only after PHA-TB-0 and TB-1 are approved/complete:

- Lane A (`executor`): TB-2 evidenceChain/currentState.
- Lane B (`executor`): TB-3 openLoops/timeline.
- Lane C (`test-engineer`/`verifier`): fixture coordination, red-test evidence, and boundary checks.
- Lane D (`executor`, after A/B red tests): TB-V validator/schema.
- Lane E (`verifier`/`writer`): TB-4 acceptance report.

Use one integration/verifier owner for the shared fixture file and final board/report edits.

## Launch hints after HITL approval

Sequential:

```bash
$ralph implement .omx/plans/ralplan-pha-001-slice-implementation-review.md starting with PHA-TB-0, then PHA-TB-1; stop before product-code slices for HITL selection.
```

Team after prep/TB-1:

```bash
$team implement PHA-TB-2 and PHA-TB-3 from .omx/plans/ralplan-pha-001-slice-implementation-review.md with one verifier/integration lane; do not run PHA-TB-V until at least one red view-layer test is merged.
```

## Team verification path

Before team shutdown:

1. Each lane posts its exact command, stdout/exit evidence, and changed-file boundary list.
2. Integration lane runs `npm test`, `npm run typecheck`, and `npm run check` after TB-V.
3. Verifier confirms no edits outside owned files for active slices.
4. Writer/verifier prepares `docs/plans/phase-a-bridge-acceptance-report.md` with evidence and remaining deferrals.
5. Ralph or the lead performs final product-root diff review and HITL next-gate summary.

## HITL checkpoint before implementation

Implementation should not start until the human explicitly answers these branch decisions:

1. Should `clinical-reference/phase-a/a9b-orderset-invocation-synthesis.md` be added to Phase A matrix/triage now, or quarantined/excluded from PHA-001 until a later A9b lane?
2. Is PHA-TB-1 approved to merge accepted/accepted-direction anchors into `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md`?
3. Should dashboard/prototype/playwright changes be split into a separate lane, reverted, or explicitly carried as an out-of-scope non-authoritative baseline?
4. After TB-1, should TB-2, TB-3, or both run first?

## Changelog

- Drafted from current working-tree review and local verification evidence.
- Applied Critic amendments: corrected A9b file path, aligned preflight slice name with PHA-TB-0, strengthened dashboard/prototype deferral, and added TB-2/TB-3 boundary-diff verification.
- Applied second Critic amendments: made TB-3 action-only for fulfillment, constrained TB-V schema scope to narrow existing hooks/no broad schema machinery, and flagged conceptual test examples to use actual repo helper APIs.
- Final Architect and Critic reviews: APPROVE. Known blocker preserved as intentional HITL gate: A9b exact-once disposition before implementation.
