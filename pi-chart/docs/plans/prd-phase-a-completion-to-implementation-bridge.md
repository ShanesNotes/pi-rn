# PRD — Phase A completion-to-implementation bridge

## Status

- Board card: `PHA-001`
- Source board: [`kanban-prd-board.md`](kanban-prd-board.md)
- Scope: planning-to-execution bridge for Phase A docs.
- Execution posture: this PRD prepares implementation. Product code changes belong to selected tracer-bullet execution cards and must start with tests or executable validation.
- Recommended next lane after HITL: `$ralplan` or `$team` using this PRD plus the paired test spec.

## Requirements summary

Phase A research has produced a broad set of clinical-reference artifacts, including A0–A8 and now A9a/A9b files. Workstream A has hardened the memory-proof seam, proving that pi-chart can expose chart-visible clinical memory without hidden simulator coupling. The next durable workstream should convert Phase A research outputs into implementation-ready PRDs/tracer bullets instead of allowing more research/document sprawl.

The bridge must preserve clinical research intent while making future implementation cards small, test-first, and parallelizable.

## Source inputs reviewed

Primary:

- `clinical-reference/phase-a/PHASE-A-CHARTER.md`
- `clinical-reference/phase-a/PHASE-A-EXECUTION.md`
- `clinical-reference/phase-a/PHASE-A-TEMPLATE.md`
- `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md`
- `clinical-reference/phase-a/a0a-*` through `a9b-*`
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
- Existing source map includes memos/research reports but is slightly stale because A9a/A9b files now exist.
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
3. New A8/A9a/A9b docs change the source-map state and should be captured before execution.

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
3. A8, A9a, and A9b files are treated as current Phase A inputs, not future/missing work.
4. Each ready tracer bullet has purpose, owned files, first failing/characterization test, implementation boundary, verification command, and explicit deferrals.
5. Open-schema questions touched by the selected tracer bullet are classified before product changes as `accepted`, `accepted-direction`, `proposed`, `deferred`, or `HITL-needed`.
6. A8/A9a open-schema entries and A9b surviving open-schema anchors that are not yet folded into `OPEN-SCHEMA-QUESTIONS.md` are treated as a delta ledger, not silently canonical policy.
7. This planning-only pass does not authorize product-root code or fixture changes; any pre-existing dirty product-root baseline must be recorded before future implementation, and future implementation may edit only the selected card's owned files.
8. Future implementation starts with the named first failing/characterization test or executable validation.
9. No tracer bullet introduces a new dependency, hidden simulator read, adapter boundary, new top-level event type, or pi-agent/pi-sim coupling.
10. Proposed ADR 017 remains non-canonical unless separately accepted through the `ADR17-001` HITL/ADR lane.

## Load-bearing rules from Phase A

These quoted constraints drive TB-2, TB-3, and TB-V. An agent reading this PRD should not need to open the Phase A synthesis files just to know what to encode.

1. **Acquisition-action-mediated fulfillment (driver for TB-2 + TB-V `V-FULFILL-02/03`).**
   > "Proposed intermediate actions that fulfill the originating intent: … The narrative observation then `supports` the acquisition action rather than fulfilling the intent directly. Invariant 10 stays intact. … Recommendation: adopt substrate-wide. All three council members independently converged on this resolution."
   Source: `clinical-reference/phase-a/a2-results-review.md` lines 160–165 (anchor: `a2-intermediate-action-model`, `a1-fulfillment-link`).
   Encoded path: `intent.order ← action.{specimen_collection | imaging_acquired | procedure_performed} ← observation.{lab_result | …} (links.supports)`.

2. **`fulfills` reservation (driver for TB-V rule shape).**
   > "`fulfills` is NOT used by `result_review` — reserved for action→intent; diagnostic acquisition/performance actions fulfill upstream orders."
   Source: `clinical-reference/phase-a/a2-results-review.md` line 343.

3. **A8 finding cannot close loop (driver for TB-3 + TB-V `V-EXAMFIND-01`).**
   > "A8 should not create a `nursing_assessment` event type. … A8 stores findings, absence assertions, and focused reassessments, not the whole form."
   Source: `clinical-reference/phase-a/a8-icu-nursing-assessment-synthesis.md` lines 33–34.
   Plus the canonical primitive: `observation.exam_finding`. Fulfillment/closure stays action-only under Invariant 10. Nursing-scope `assessment.*` may support, address, or interpret the loop context, but must not become an intent-fulfillment source unless HITL/ADR explicitly changes that invariant; the finding remains `links.supports` evidence.

4. **A9a order family stays in payload (driver for TB-V schema scope).**
   > "An order is an accountable `intent.order`, not a CPOE module. … `intent.order` + `data.order_kind` as the default shape."
   Source: `clinical-reference/phase-a/a9a-order-primitive.md` line 3 (council synthesis note).
   Encoded path: no new event subtype; `data.order_kind` carries the family (`medication | lab | imaging | …`).

5. **A8 finding-state three-valued (driver for TB-V schema enum).**
   Findings must distinguish `present`, `actively absent`, and `not assessed`. Without this, "silence" cannot be told from "explicit normal." Source: `a8-icu-nursing-assessment-synthesis.md` (anchor: `a8-finding-state-negative-missingness`).

6. **A9b order-set invocation stays out of this implementation slice.**
   A9b is now a current Phase A input. Its council direction is accepted for planning: order-set/protocol/template invocation is an `action.intervention` payload convention, child orders are ordinary `intent.order` events, parent/child provenance uses `transform.run_id` / `transform.input_refs`, and set-level lifecycle remains derived. Product implementation of A9b-specific validator/view behavior is deferred to a later A9b/Phase-B lane.

## Tracer bullets

### PHA-TB-0 — Inventory and source-map refresh

Purpose: update Phase A source status after A8/A9a/A9b landed.

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

Purpose: classify every A8 and A9a candidate delta anchor (15 each) into an implementation-safe status, and merge `accepted` / `accepted-direction` entries into the canonical `OPEN-SCHEMA-QUESTIONS.md` register so the matrix's "canonical decision register" claim becomes true.

Owned files:

- `docs/plans/prd-phase-a-completion-to-implementation-bridge.md`
- `docs/plans/test-spec-phase-a-completion-to-implementation-bridge.md`
- `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md` (merge target for `accepted` / `accepted-direction` anchors only).
- Optional future ADR draft under `decisions/` only if HITL explicitly asks for policy promotion.

First failing/characterization test:

- A ledger completeness check fails until every one of the 30 a8-* / a9a-* candidate anchors below is listed with exactly one status: `accepted`, `accepted-direction`, `proposed`, `deferred`, or `HITL-needed`.
- A canonical-merge check fails if any anchor classified `accepted` or `accepted-direction` in this PRD is absent from `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md` after TB-1 lands.

Required anchors (exact strings):

A8 (15): `a8-exam-finding-shape`, `a8-system-taxonomy-and-coverage`, `a8-finding-state-negative-missingness`, `a8-normal-wdl-semantics`, `a8-finding-vocabulary-scope`, `a8-body-site-encoding`, `a8-session-identity-and-completeness`, `a8-prn-trigger-shape`, `a8-reassessment-response-coupling`, `a8-nursing-scope-assessment-boundary`, `a8-assessment-cadence-openloops`, `a8-wound-skin-artifact-refs`, `a8-a7-structured-vs-narrative-boundary`, `a8-a5-lda-site-boundary`, `a8-current-state-axis-for-exam`.

A9a (15): `a9a-canonical-subtype`, `a9a-order-kind-registry`, `a9a-indication-exception-shape`, `a9a-verbal-order-metadata`, `a9a-order-lifecycle-discontinue-cancel`, `a9a-occurrence-identity`, `a9a-prn-trigger-shape`, `a9a-conditional-hold-titration-payload`, `a9a-result-fulfillment-pathway`, `a9a-blood-product-order-shape`, `a9a-restraint-order-shape`, `a9a-monitoring-order-vs-monitoring-plan`, `a9a-protocol-standing-order-boundary`, `a9a-isolation-and-code-status-boundaries`, `a9a-source-kind-channel-boundary`.

Implementation boundary:

- Classify every anchor; do not silently drop any.
- Promote to canonical register only `accepted` / `accepted-direction`. `proposed`, `deferred`, `HITL-needed` stay in delta files.
- Do not use proposed ADR 017 as accepted authority.
- No edits to `decisions/` unless HITL selects a docs-maintenance/ADR action.
- No product-root edits in this card.

Verification command:

```bash
python3 - <<'PY'
from pathlib import Path
prd = Path('docs/plans/prd-phase-a-completion-to-implementation-bridge.md').read_text()
canonical = Path('clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md').read_text()
required = [
    'a8-exam-finding-shape','a8-system-taxonomy-and-coverage','a8-finding-state-negative-missingness',
    'a8-normal-wdl-semantics','a8-finding-vocabulary-scope','a8-body-site-encoding',
    'a8-session-identity-and-completeness','a8-prn-trigger-shape','a8-reassessment-response-coupling',
    'a8-nursing-scope-assessment-boundary','a8-assessment-cadence-openloops','a8-wound-skin-artifact-refs',
    'a8-a7-structured-vs-narrative-boundary','a8-a5-lda-site-boundary','a8-current-state-axis-for-exam',
    'a9a-canonical-subtype','a9a-order-kind-registry','a9a-indication-exception-shape',
    'a9a-verbal-order-metadata','a9a-order-lifecycle-discontinue-cancel','a9a-occurrence-identity',
    'a9a-prn-trigger-shape','a9a-conditional-hold-titration-payload','a9a-result-fulfillment-pathway',
    'a9a-blood-product-order-shape','a9a-restraint-order-shape','a9a-monitoring-order-vs-monitoring-plan',
    'a9a-protocol-standing-order-boundary','a9a-isolation-and-code-status-boundaries',
    'a9a-source-kind-channel-boundary',
]
statuses = ['accepted', 'accepted-direction', 'proposed', 'deferred', 'HITL-needed']
missing = [a for a in required if a not in prd]
if missing or not all(s in prd for s in statuses):
    print('Missing anchors:', missing)
    print('Status vocabulary present:', {s: s in prd for s in statuses})
    raise SystemExit(1)

import re
# Find anchors classified accepted/accepted-direction in the PRD ledger table and require them in canonical register
ledger_section = prd.split('Open-schema triage ledger:', 1)[-1]
promoted = []
for line in ledger_section.splitlines():
    m = re.match(r'^\|\s*`([a-z0-9-]+)`\s*\|\s*(accepted(?:-direction)?)\s*\|', line)
    if m:
        promoted.append(m.group(1))
unmerged = [a for a in promoted if a not in canonical]
if unmerged:
    print('Accepted/accepted-direction anchors missing from canonical OPEN-SCHEMA-QUESTIONS.md:', unmerged)
    raise SystemExit(1)
PY
```

Open-schema triage ledger:

Carry-over (pre-A8/A9a) — already classified in prior planning, retained for context:

| Anchor | Candidate status | Why it is safe/blocked for first implementation |
|---|---|---|
| `a0a-structural-event-split` | accepted-direction | Existing repo already separates structural markdown from events; first implementation should characterize current behavior rather than redesign identity/encounter storage. |
| `a1-fulfillment-link` | accepted-direction | Current validator already rejects direct observation fulfillment and requires acquisition-action support for result observations; future work should preserve the action-mediated path. |
| `a2-intermediate-action-model` | accepted | Intermediate actions are implemented enough to guide result-producing order tests; challenge only with failing evidence. |

A8 candidate-delta ledger (15 anchors, source: `a8-open-schema-entries-synthesis.md`):

| Anchor | Candidate status | Why it is safe/blocked for first implementation |
|---|---|---|
| `a8-exam-finding-shape` | proposed | Use `observation.exam_finding` as the candidate shape; full A8 payload is not canonical until a selected card proves it. |
| `a8-system-taxonomy-and-coverage` | proposed | Eight-system coverage vocabulary is useful for fixtures, not yet a validator constraint. |
| `a8-finding-state-negative-missingness` | accepted-direction | Three-valued `finding_state` (present / actively-absent / not-assessed) is needed to distinguish silence from explicit normal; encode in fixtures and in TB-V `V-EXAMFIND-01`. |
| `a8-normal-wdl-semantics` | proposed | "WDL" requires a defined normal set per system; defer until session shell decision. |
| `a8-finding-vocabulary-scope` | deferred | Closed finding-code registry is later-card scope; first card uses free-text with structured body site only. |
| `a8-body-site-encoding` | proposed | Body-site encoding scheme deferred to fixture-only convention until A5 LDA boundary is settled. |
| `a8-session-identity-and-completeness` | HITL-needed | Session shell vs `assessment_set_id` changes storage semantics; must not be accepted by implication. |
| `a8-prn-trigger-shape` | proposed | Prefer payload trigger metadata for tests only; avoid new link kinds. |
| `a8-reassessment-response-coupling` | accepted-direction | Raw A8 observations must not `links.fulfills`; use action-only fulfillment/closure and keep findings/assessments as supporting or addressing context. |
| `a8-nursing-scope-assessment-boundary` | accepted-direction | RN-scope assessments are nursing-domain `assessment.*`; do not cross into provider-only judgments. |
| `a8-assessment-cadence-openloops` | deferred | Global ICU cadence/profile policy is out of scope for first implementation; use explicit test fixture timing only. |
| `a8-wound-skin-artifact-refs` | deferred | Wound photo `artifact_ref` semantics depend on A5 LDA decision; defer. |
| `a8-a7-structured-vs-narrative-boundary` | accepted-direction | A8 owns structured findings; A7 owns narrative. Do not let nursing notes (A7) mint `observation.exam_finding`. |
| `a8-a5-lda-site-boundary` | HITL-needed | Whether site finding joins A5 LDA segment via `related_lda_key` or EvidenceRef is a cross-artifact identity decision; flag for HITL. |
| `a8-current-state-axis-for-exam` | proposed | Adding an `exam` axis to `currentState()` is plausible but defer until TB-2 demonstrates need. |

A9a candidate-delta ledger (15 anchors, source: `a9a-open-schema-entries.md`):

| Anchor | Candidate status | Why it is safe/blocked for first implementation |
|---|---|---|
| `a9a-canonical-subtype` | accepted-direction | `intent.order` is already present in `src/validate.ts` status rules; keep order family in payload, not subtype sprawl. |
| `a9a-order-kind-registry` | proposed | A focused card may validate one or two `data.order_kind` values; closed/profile registry design remains later work. |
| `a9a-indication-exception-shape` | deferred | Indication/exception payload shape is profile-territory; defer. |
| `a9a-verbal-order-metadata` | deferred | Verbal/read-back/authentication behavior crosses ADR17/profile territory and is not first-card scope. |
| `a9a-order-lifecycle-discontinue-cancel` | proposed | Characterize status/supersession behavior only; do not add a full order lifecycle engine. |
| `a9a-occurrence-identity` | HITL-needed | Whether each administration is a distinct event or a child of one order is identity-shaping; HITL. |
| `a9a-prn-trigger-shape` | proposed | A9a PRN payload mirrors A8; align with `a8-prn-trigger-shape` decision. |
| `a9a-conditional-hold-titration-payload` | deferred | Titration policy is out of first-card scope. |
| `a9a-result-fulfillment-pathway` | accepted-direction | Preserve acquisition-action-mediated result fulfillment; reject direct observation-to-order fulfillment. |
| `a9a-blood-product-order-shape` | deferred | Blood-product prepare/transfuse pair is later card. |
| `a9a-restraint-order-shape` | deferred | Restraint renewal cadence is regulatory; defer. |
| `a9a-monitoring-order-vs-monitoring-plan` | proposed | Boundary between `intent.order` task and `intent.monitoring_plan` cadence; refine in TB-3. |
| `a9a-protocol-standing-order-boundary` | deferred | A9b protocol/standing-order parent shape is out of scope. |
| `a9a-isolation-and-code-status-boundaries` | deferred | Isolation/code-status are ADR-territory. |
| `a9a-source-kind-channel-boundary` | proposed | `data.authoring_channel` vs `source.kind` is small but real; defer enforcement until ADR17 lane settles. |

A9b disposition ledger (source: `a9b-orderset-invocation-synthesis.md`):

| Anchor | Candidate status | Why it is safe/blocked for first implementation |
|---|---|---|
| `a9b-invocation-as-event-vs-derived` | accepted-direction | Council direction: store patient-specific invocation as `action.intervention` with `data.action = "orderset_invocation"`; no new event type or intent subtype in this bridge. |
| `a9b-parent-child-link-convention` | accepted-direction | Council direction: child orders use existing `transform.run_id` / `transform.input_refs`; no `links.member_of` or `data.invoked_by` in this bridge. |
| `a9b-orderset-modification-mid-invocation` | accepted-direction | Council direction: per-child supersession only; invocation is point-shaped and never re-authored. |
| `a9b-set-level-openloops-vs-child-level` | accepted-direction | Council direction: set-level lifecycle is derived; only standing-order authentication remains a regulated open-loop candidate. |
| `orderset-definition-home` | HITL-needed | Definition storage placement is a Phase-B ADR/owner decision; do not add `definitions/` in PHA-001. |
| `orderset-runtime-subtype-promotion` | deferred | Dedicated subtype promotion is explicitly deferred until usage proves `action.intervention` too muddy. |
| `orderset-override-rationale-home` | deferred | Invocation-level vs child-level override rationale is profile/definition work outside PHA-001. |
| `orderset-template-scoping` | deferred | Provider-authored vs nurse-standing-trigger profiles need a later A9b/profile lane. |
| `orderset-cds-suggestion-boundary` | accepted-direction | Non-accepted CDS suggestions remain telemetry/system state, not patient-stream events. |
| `a9b-orderset-vs-protocol-vs-standing-order-vs-care-plan-taxonomy` | proposed | Council leans one primitive with `data.invocation_kind`; exact taxonomy is not enforced in PHA-001. |
| `a9b-orderset-vs-order-panel-distinction` | proposed | Panel vs small order-set remains a taxonomy decision. |
| `a9b-standing-order-authentication-loop` | HITL-needed | Federally regulated delayed-authentication closure shape needs ADR/profile work; not part of TB-V. |
| `a9b-protocol-decision-branch-boundary` | accepted-direction | Protocol state machine remains pi-agent territory; pi-chart may store opaque refs but does not validate state-machine consistency. |
| `a9b-personalization-model` | proposed | Selection-mode and declination capture need profile shape. |
| `a9b-cross-orderset-deduplication` | deferred | Derived/profile rule, not a stored event in PHA-001. |
| `a9b-orderset-version-mismatch-handling` | deferred | Registry resolution/sunset behavior belongs with definition-home ADR. |
| `a9b-blood-product-prepare-transfuse-coupling-as-mini-orderset` | deferred | A9a/A9b follow-on, outside first bridge implementation. |
| `a9b-indication-exception-shape` | deferred | Inherited A9a profile question, outside PHA-001. |
| `a9b-order-occurrence-uri-beyond-meddose` | deferred | URI generalization is outside PHA-001. |
| `a9b-verbal-text-channel-invocation-authentication` | deferred | Depends on A9a/ADR17 verbal/secure-text channel decisions. |
| `a9b-session-identity-recurrence` | HITL-needed | Fourth recurrence across A6/A7/A8/A9b; strongest Phase-B ADR signal but not a PHA-001 product change. |

### PHA-TB-2 — A0–A2 ordered-result view characterization

Purpose: characterize, in the **view layer only**, that a lab-producing `intent.order` chains to its `observation.lab_result` through an `action.specimen_collection` intermediary. Emits a failing/characterization test that PHA-TB-V will consume when it lands the validator/schema rule.

Owned files (view layer only — no validator, no schema):

- `src/views/evidenceChain.ts`, `src/views/evidenceChain.test.ts`
- `src/views/currentState.ts`, `src/views/currentState.test.ts`
- One new fixture under `patients/patient_001/timeline/2026-04-18/events.ndjson` if the existing fixture lacks a lab-order → specimen-collection → lab-result triple. Edits here are append-only; no rewrite of existing events.

**Explicitly NOT owned** (TB-V only):

- `src/validate.ts`, `src/validate.test.ts`
- `schemas/event.schema.json`

First failing/characterization test (conceptual contract; adapt to the repo's existing async helpers/API shape):

```ts
// src/views/evidenceChain.test.ts
test("evidenceChain: lab_result reaches intent.order via action.specimen_collection (PHA-TB-2)", () => {
  const fixture = loadPatientFixture("patient_001/2026-04-18");
  const labResultId = "<lab-result-event-id-from-fixture>";
  const chain = evidenceChain(fixture, { eventId: labResultId });
  // The chain MUST contain exactly one action.specimen_collection node
  // between observation.lab_result and intent.order.
  const subtypes = chain.nodes.map(n => `${n.type}.${n.subtype}`);
  assert.deepStrictEqual(
    subtypes,
    ["observation.lab_result", "action.specimen_collection", "intent.order"],
    "lab_result must reach order via specimen_collection action, never directly"
  );
});
```

Plus a paired `currentState` test asserting that the lab-order intent appears under `currentState({axis:"intents"})` as `pending` until the `action.specimen_collection` lands, then transitions per existing `STATUS_RULES["intent:order"]`.

Implementation boundary:

- View layer only. No `STATUS_RULES` edits, no schema property additions, no new event subtypes.
- Fixture additions are append-only and must not alter existing event IDs or links.
- If the test reveals that the validator/schema needs a change to make the chain expressible, that change belongs to PHA-TB-V — record the requirement in the test's `// HANDOFF:` comment and stop.

Verification command:

```bash
node --test --import tsx src/views/evidenceChain.test.ts src/views/currentState.test.ts && npm run typecheck
```

Expected verification posture: the new test FAILS until TB-V lands. That failure IS the deliverable; do not retrofit the validator from this card.

### PHA-TB-3 — A8/A9a focused reassessment-order loop view characterization

Purpose: characterize, in the **view layer only**, that an `observation.exam_finding` is **evidence**, not closure: it cannot itself close an `intent.order` / `intent.monitoring_plan` open loop. Fulfillment/closure flows through an `action.*` event only; nursing-scope `assessment.*` may support, address, or interpret context but must not fulfill an intent unless HITL/ADR explicitly changes Invariant 10. Emits a failing test for PHA-TB-V to consume.

Owned files (view layer only — no validator, no schema):

- `src/views/openLoops.ts`, `src/views/openLoops.test.ts`
- `src/views/timeline.ts`, `src/views/timeline.test.ts`
- One append-only fixture extension under `patients/patient_001/timeline/2026-04-18/events.ndjson` covering a focused-reassessment scenario (e.g., post-O2-escalation respiratory exam finding + nursing assessment closure).

**Explicitly NOT owned** (TB-V only):

- `src/validate.ts`, `src/validate.test.ts`
- `schemas/event.schema.json`
- `src/views/currentState.ts(.test).ts` (TB-2 owns these)

First failing/characterization test (conceptual contract; adapt to the repo's existing async helpers/API shape):

```ts
// src/views/openLoops.test.ts
test("openLoops: observation.exam_finding alone does NOT close intent.monitoring_plan (PHA-TB-3)", () => {
  const fixture = loadPatientFixture("patient_001/2026-04-18");
  const planId = "<monitoring-plan-event-id-from-fixture>";
  const findingId = "<exam-finding-event-id-from-fixture>";

  // Scenario A: only the exam finding exists referencing the plan.
  // The loop MUST remain open.
  const openA = openLoops(fixtureWithoutClosureAction(fixture));
  assert.ok(
    openA.some(loop => loop.intentId === planId && loop.status === "pending"),
    "exam_finding alone must not close a monitoring-plan loop"
  );

  // Scenario B: same exam finding plus an action.* event that fulfills
  // the plan and supports the finding. The loop MUST close.
  const openB = openLoops(fixture);
  assert.ok(
    !openB.some(loop => loop.intentId === planId && loop.status === "pending"),
    "monitoring-plan loop closes only through action fulfillment, with finding as supporting evidence"
  );
});
```

Plus a paired `timeline` test asserting `observation.exam_finding` events render as evidence rows, never as closure rows, regardless of `links.*` content.

Test snippets in this PRD are conceptual contracts. Implementation must use the repo's actual async view APIs and test helpers (`makeEmptyPatient`, `appendRawEvent`, `evidenceChain({ scope, eventId })`, `openLoops({ scope, asOf })`, `timeline({ scope, ... })`) rather than inventing `loadPatientFixture` / `chain.nodes` helpers.

Implementation boundary:

- View layer only. No new event subtypes (no `nursing_assessment`), no new source kinds, no `STATUS_RULES` edits, no schema property additions.
- Fixture additions append-only.
- If the view code today permits the wrong closure (i.e., test scenario A passes when it should fail), that means the *validator* must reject the structure — record in `// HANDOFF:` comment for TB-V and stop.

Verification command:

```bash
node --test --import tsx src/views/openLoops.test.ts src/views/timeline.test.ts && npm run typecheck
```

Expected verification posture: the new test FAILS until TB-V lands. That failure IS the deliverable.

### PHA-TB-V — Validator + schema integration

Purpose: consume the failing characterization tests emitted by PHA-TB-2 and/or PHA-TB-3 and land one bounded validator + schema pass that makes them green. This is the **only** card that may edit `src/validate.ts`, `src/validate.test.ts`, or `schemas/event.schema.json` in the Phase A bridge.

Preconditions:

- At least one of PHA-TB-2 / PHA-TB-3 has merged a failing test with a `// HANDOFF:` comment naming the validator/schema delta.
- PHA-TB-1 anchors `a1-fulfillment-link`, `a2-intermediate-action-model`, `a8-reassessment-response-coupling`, `a9a-result-fulfillment-pathway` are classified as `accepted` or `accepted-direction` and merged into canonical `OPEN-SCHEMA-QUESTIONS.md`.

Owned files:

- `src/validate.ts`
- `src/validate.test.ts`
- `schemas/event.schema.json`

Edit-scope guard rails (this is the boundary that other TBs delegate to):

- `src/validate.ts` edits restricted to:
  - Modifying existing `STATUS_RULES["intent:order"]` entry.
  - Existing `V-FULFILL-01` / `V-FULFILL-02` / `V-FULFILL-03` rule helpers.
  - Adding **one** new rule `V-EXAMFIND-01` rejecting `observation.exam_finding.links.fulfills` and `observation.exam_finding.links.addresses` targets.
  - No new helper modules, no refactor of unrelated rule families (`V-SRC-*`, `V-TIME-*`, `V-INTERVAL-*`, `V-EVIDENCE-*`, `V-TRANSFORM-*`, `V-CONTRA-*`, `V-RESOLVES-*` are out of scope).
- `schemas/event.schema.json` edits restricted to narrow existing hooks only:
  - Do **not** introduce broad conditional schema machinery in this slice.
  - Enforce `specimen_collection` / `finding_state` in validator code only unless a narrow existing schema hook is already present.
  - Escalate to HITL if schema enforcement requires refactoring the schema model, adding conditional subtype-specific data shapes, or changing the open `subtype` / `data` posture.
  - No new top-level event types, no new top-level schema properties, no source-kind expansion.
- No edits to `src/views/*`, `patients/*`, `decisions/*`, `clinical-reference/*`.

First failing/characterization test:

- The test already exists — it was written by TB-2 and/or TB-3. TB-V's "first test" is to run `npm test` and confirm those tests are red, then make them green by editing only the files listed above.

Verification command:

```bash
npm test
npm run typecheck
npm run check
git diff --name-only -- src/ schemas/ | grep -vE '^(src/(validate\.ts|validate\.test\.ts)|schemas/event\.schema\.json)$' \
  && { echo 'TB-V edited files outside its boundary'; exit 1; } || true
```

Implementation boundary recap: TB-V is a one-shot validator + schema pass driven by failing view-layer tests. If TB-2 or TB-3 reveal that the validator needs broader changes than the rules listed above, TB-V escalates to HITL and STOPS. It does not silently expand the rule set.

### PHA-TB-4 — Phase A bridge acceptance report

Purpose: convert completed bridge/tracer evidence into the next board movement.

Owned files:

- `docs/plans/kanban-prd-board.md`
- Optional future `docs/plans/phase-a-bridge-acceptance-report.md`

First failing/characterization test:

- Report-section check fails until the report includes `Tests run`, `Pass/fail evidence`, `Deferred items`, `Boundary confirmation`, and `Next recommended card`.
- Evidence-linkage check fails unless `Tests run` quotes the literal verification command from the executed card (TB-2, TB-3, or TB-V) and `Pass/fail evidence` includes a non-empty stdout excerpt or exit-code line.

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
# Evidence-linkage: at least one known TB verification command must appear verbatim,
# and there must be a stdout/exit-code-bearing line under Pass/fail evidence.
known_verifications = [
    'node --test --import tsx src/views/evidenceChain.test.ts src/views/currentState.test.ts',
    'node --test --import tsx src/views/openLoops.test.ts src/views/timeline.test.ts',
    'npm test',
]
if not any(cmd in text for cmd in known_verifications):
    print('Acceptance report must quote a known TB verification command verbatim.')
    raise SystemExit(1)
import re
pass_section = text.split('Pass/fail evidence', 1)[-1].split('Deferred items', 1)[0]
if not re.search(r'(exit\s*(?:code)?\s*[:=]\s*\d|✓|✗|ok\s+\d|not ok\s+\d|FAIL|PASS)', pass_section):
    print('Pass/fail evidence section must include stdout/exit-code excerpt.')
    raise SystemExit(1)
PY
```

## Explicit deferrals

- Product implementation until HITL selects the first tracer bullet.
- ADR17 actor/attestation/review policy and `communication.attestation.v1`.
- A9b order-set/protocol/standing-order invocation implementation; only source coverage and accepted-direction triage land here.
- FHIR/adapter/export/legal/audit boundary work.
- Full CPOE, MAR, order-set/protocol parent, blood-product policy, restraint policy, and institutional profile systems.
- New dependencies, new top-level event types, and source-kind expansion.
- Edits to pi-agent or pi-sim, and any hidden simulator state access.

## Parallelization guidance

The re-sliced DAG removes the validator/schema collision. Run lanes as follows:

- **PHA-TB-0** and **PHA-TB-1** are docs-only and may run in parallel; TB-1 must finish before any code-touching card.
- **PHA-TB-2** and **PHA-TB-3** are now genuinely parallel: TB-2 owns `src/views/{evidenceChain,currentState}.*` and TB-3 owns `src/views/{openLoops,timeline}.*`. Neither edits the validator or schema. Both append to the same fixture file `patients/patient_001/timeline/2026-04-18/events.ndjson` — they must coordinate on event IDs (use a `tb2-` / `tb3-` prefix) or run sequentially on that single fixture file.
- **PHA-TB-V** is single-lane and runs after at least one of TB-2/TB-3 lands a failing test. It is the ONLY card permitted to edit `src/validate.ts`, `src/validate.test.ts`, or `schemas/event.schema.json` in this bridge.
- **PHA-TB-4** runs after TB-V and at least one of TB-2/TB-3 are green.
- Any `$team` execution must still appoint one integration/verifier lane for final board/report edits and a product-root diff review.
- Before implementation, capture the then-current dirty baseline separately from PHA-001 planning evidence. Out-of-scope dirty files (current planning docs, prototype scratchpads) are not PHA-001 implementation evidence.

## Execution order

PHA-TB-1 is a **hard gate**, not an HITL choice. Open-schema triage must complete before any code-touching tracer bullet because TB-2 and TB-V both depend on the `a8-*` / `a9a-*` status ledger landing in `OPEN-SCHEMA-QUESTIONS.md`.

The DAG is:

```
PHA-TB-0 (matrix/board refresh, docs-only)
        │
PHA-TB-1 (open-schema triage, docs + canonical merge) ── hard gate ──┐
                                                                     │
                ┌────────────────────────────────────────────────────┤
                ▼                                                    ▼
        PHA-TB-2 (view-layer characterization)            PHA-TB-3 (view-layer characterization)
        (evidenceChain, currentState; emits failing test) (openLoops, timeline; emits failing test)
                └────────────────┬───────────────────────────────────┘
                                 ▼
                       PHA-TB-V (validator + schema integration)
                       consumes both failing-test scaffolds
                                 │
                                 ▼
                       PHA-TB-4 (acceptance report)
```

## HITL checkpoint

After PHA-TB-1 completes, the human picks the next execution card from {PHA-TB-2, PHA-TB-3} (or runs both in parallel — they own disjoint files). PHA-TB-V is auto-scheduled after at least one of TB-2/TB-3 has landed a failing test.

Do not invoke `$ralph`, `$team`, or direct implementation until PHA-TB-1 has produced an evidence-backed delta ledger and the human has approved the next card.
