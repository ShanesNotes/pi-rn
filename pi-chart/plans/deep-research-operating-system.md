# Deep Research Operating System

Status: staged planning artifact, no implementation code.
Source spec: `.omx/specs/deep-interview-deep-research-operating-system.md`.

## Bottom Line

Dense research artifacts should not move directly into code. They first pass
through a tracked, human-in-the-loop operating index that maps sources,
authority, backlog candidates, and conflicts. The output of this pass is
planning clarity, not implementation.

Near-term rule: no implementation code and no full automation. The system may
organize and propose, but human gates decide what becomes a PRD, ADR, research
prompt, or implementation lane.

Operating mode: prioritized hybrid. Rank the backlog and conflict register by
value/risk/dependency order, but keep the hybrid source model: higher-authority
sources guide proposals, ignored memos remain evidence, and human gates settle
high-authority conflicts.

Current boundary update: do not run a full deep pass across every artifact, do
not implement yet, do not treat the current priority set as final, and do not
start speculative adapter work. The next useful step is bounded triage over the
priority tracks, not exhaustive analysis.

Allowed no-code actions: choose the appropriate depth per track, add tracked
docs/plans, update statuses in planning artifacts, edit source docs lightly when
that reduces drift, and recommend an order. These permissions do not authorize
implementation code.

## Staged Model

| Stage | Output | Purpose | Human gate |
| --- | --- | --- | --- |
| 1. Source operating index | This file | Preserve source map, authority hierarchy, backlog, and conflict status in one tracked place. | Review classifications and conflict proposals. |
| 2. PRD handoff | `plans/prd-deep-research-operating-system.md` | Define the planning artifact to be produced next or maintained. | Approve before any execution mode. |
| 3. Test spec | `plans/test-spec-deep-research-operating-system.md` | Define what makes the planning artifact complete. | Use before plan-mode closeout. |
| 4. Implementation | Not started | Execute only after explicit approval. | Separate user approval required. |

## Authority Hierarchy

| Tier | Source class | Default treatment |
| ---: | --- | --- |
| 1 | Active system/developer/user instructions | Binding for the current session. |
| 2 | Current code and tests | Binding evidence of actual behavior. |
| 3 | Accepted ADRs in `decisions/` | Binding policy unless superseded by a later accepted ADR. |
| 4 | `README.md`, `ROADMAP.md`, `DESIGN.md`, `ARCHITECTURE.md`, `CLAIM-TYPES.md` | Current docs/spec surface; reconcile with ADRs and code. |
| 5 | Tracked plan artifacts in `plans/` | Planning authority once accepted for a lane. |
| 6 | Ignored research/planning memos under `memos/` | Advisory unless promoted into tracked docs/plans or ADRs. |
| 7 | `.omx/context`, `.omx/specs`, `.omx/plans`, interviews, wiki/session logs | Useful provenance and handoff context; not canonical by itself. |
| 8 | External model outputs and research prompts | Evidence only until mapped and promoted. |

Conflict policy: propose by hierarchy, then index visibly. Do not silently
settle conflicts between high-authority sources or between sources at the same
tier.

## Prioritization Rules

| Priority | Meaning | Default action |
| --- | --- | --- |
| P0 | Blocks safe planning or contradicts active user constraints. | Resolve or explicitly gate before plan-mode handoff. |
| P1 | Unlocks the next accepted lane or prevents implementation drift. | Promote into the next PRD/test-spec candidate. |
| P2 | Useful governance, adapter, or docs work that should sequence behind proof. | Keep in backlog with a gate and dependency. |
| P3 | Future, speculative, or external credibility work without a current consumer. | Defer and revisit only when a consumer appears. |

Within the same priority, prefer items backed by accepted ADRs/current docs over
ignored memos. If a lower-authority source adds useful detail without conflict,
reference it as evidence rather than promoting it to policy.

## Priority Focus Tracks

The current priority focus set is `phase-a`, `v03`, `adr17`, `boundary`, and
`omx-promotion`. These tracks organize the next source-map/backlog pass, but
they are provisional rather than a final priority lock.

| Track | Priority | Meaning | Default output |
| --- | --- | --- | --- |
| `omx-promotion` | P0 | Promote durable `.omx`/ignored-memo decisions into tracked planning docs before relying on them. | Tracked `plans/` PRD/test-spec or ADR/docs promotion proposal. |
| `adr17` | P1 | Resolve actor/attestation/review taxonomy status against accepted ADR 017 and older advisory memos. | Status check plus backlog update; no duplicate research if ADR 017 already settles it. |
| `phase-a` | P1 | Map Phase A clinical-reference syntheses and open-schema entries into PRD/backlog candidates. | Source-map expansion plus thin PRD candidates, not code. |
| `v03` | P1 | Reconcile `memos/pi-chart-v03-memo.md` with accepted ADRs, ROADMAP, and current code. | Authority/status table: accepted, superseded, pending, deferred. |
| `boundary` | P2 | Keep FHIR/openEHR/adapter boundary decisions as future constraints behind Workstream A proof. | Boundary backlog rows and conflict items only; no speculative adapter design or implementation. |

Bounded triage rule: for each priority track, identify authoritative sources,
obvious conflicts, and next gates. Do not deep-read every source in full unless
that track becomes the approved next planning lane.

Recommended order:

1. `omx-promotion` - make durable decisions tracked before depending on them.
2. `adr17` - resolve whether actor/attestation/review is already accepted or
   still needs backlog work.
3. `v03` - reconcile the v0.3 memo against accepted ADRs and current docs.
4. `phase-a` - source-map clinical-reference syntheses into PRD candidates.
5. `boundary` - keep as future constraints until the proof/adapter lane is
   explicitly approved.

## Complete Source Map

| Source | Authority tier | Status | Role |
| --- | ---: | --- | --- |
| `memos/deep-research-report24042026.md` | 6 | advisory source | Original dense report: product thesis, recommendations, OSS/standards comparators. |
| `memos/deep-research-alignment-24042026.md` | 6 | superseded baseline | First repo-grounded alignment; collapsed seven turns into Workstreams A-D. |
| `memos/deep-research-alignment-revised-2026-04-25.md` | 6 | advisory but current among memos | Revised source register and workstream sequencing; useful source but ignored by git. |
| `memos/Workstream A PRD test.md` | 6 | advisory blueprint | Detailed Workstream A implementation blueprint; not canonical because `memos/` is ignored. |
| `memos/definitive-fhir-boundary-pi-chart.md` | 6 | advisory decision artifact | Minimum viable FHIR boundary proposal. |
| `memos/pi-chart-openEHR-cycle-decision-synthesis.md` | 6 | advisory decision artifact | openEHR contribution/audit pattern borrow at Git layer. |
| `memos/pi-chart-boundary-adapter-definitive-synthesis.md` | 6 | advisory decision artifact | Adapter ergonomics synthesis for future FHIR export. |
| `memos/Actor-attestation-taxonomy.md` | 6 | advisory ADR input | Actor/attestation/review taxonomy analysis. |
| `memos/pi-chart-v03-memo.md` | 6 | advisory architecture memo | Foundational augmentation memo feeding ADRs and future governance work. |
| `.omx/specs/deep-interview-deep-research-operating-system.md` | 7 | source spec | Deep-interview clarified requirements for this operating system. |
| `.omx/interviews/deep-research-operating-system-20260425T193424Z.md` | 7 | transcript | Interview evidence for intent, non-goals, success criteria, pressure pass. |
| `.omx/plans/prd-memory-proof-six-surface-broad-ehr.md` | 7 | prior PRD | Existing Workstream A plan; useful but under ignored `.omx/`. |
| `.omx/plans/test-spec-memory-proof-six-surface-broad-ehr.md` | 7 | prior test spec | Existing Workstream A verification plan; useful but under ignored `.omx/`. |
| `.omx/context/deep-research-report-operationalization-20260424T153014Z.md` | 7 | context | Preflight context for the original operationalization request. |
| `.omx/context/doc-sprawl-to-executable-prds-20260425T162650Z.md` | 7 | context | Related concern: doc sprawl to executable PRDs with HITL gates. |
| `decisions/015-adr-009-011-implementation.md` | 3 | accepted | Evidence/contradiction/transform implementation contract. |
| `decisions/016-broad-ehr-skeleton-clinical-memory.md` | 3 | accepted | Broad EHR skeleton as clinical-memory proof surface. |
| `decisions/017-actor-attestation-review-taxonomy.md` | 3 | accepted if current | Check before treating actor-attestation memos as unresolved. |
| `README.md` | 4 | current primer | Public thesis, write/read boundary, growth path. |
| `ROADMAP.md` | 4 | current roadmap | Current focus, deferrals, accepted implementation status. |
| `DESIGN.md` | 4 | current spec | Primitive and invariant contract. |
| `ARCHITECTURE.md` | 4 | current code map | Module boundaries and external integration posture. |
| `clinical-reference/broad-ehr-skeleton.md` | 4 | accepted reference | Six-surface fixture and memory-proof projection reference. |
| `clinical-reference/phase-a/*` | 4/6 | mixed | Clinical source material for future PRD rows when relevant. |
| `plans/deep-research-operating-system.md` | 5 | current tracked index | Promotes the deep-research operating system out of ignored scratch. |
| `plans/prd-deep-research-operating-system.md` | 5 | current tracked PRD | Staged no-code PRD for the operating system itself. |
| `plans/test-spec-deep-research-operating-system.md` | 5 | current tracked test spec | Verification plan for the operating system artifact. |

## PRD / Backlog Table

| ID | Priority | Recommendation or claim | Source | Authority | Bucket | Disposition | Lane | Dependencies | Acceptance evidence | Next gate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | P1 | Build memory-proof projection over six-surface fixture. | ADR 016, broad skeleton ref, Workstream A memos | 3-6 | planned | plan-candidate | A | Resolve tracked PRD source and avoid ignored-only plans. | PRD/test spec accepted; no code in this pass. | Human approves execution lane later. |
| A2 | P1 | Prove chart-once/project-many with one canonical bedside observation. | ADR 016, Workstream A blueprint | 3-6 | planned | plan-candidate | A | Fixture and projection plan. | Reuse target named; tests specified. | Future implementation approval. |
| B1 | P1 | Actor / attestation / review taxonomy. | Report M2/C1, v0.3 memo, actor taxonomy memo, ADR 017 | 3/6 | partial | ADR/status-check | B | Check ADR 017 before more research. | Conflict register resolves whether pending or accepted. | Human confirms status. |
| B2 | P2 | Structured decision-cycle commit convention. | openEHR synthesis, commit protocol | 1/6 | planned | docs/process-candidate | B | Align with existing Lore protocol. | Trailer vocabulary documented without schema changes. | Human decides if repo-local convention needs ADR/docs. |
| B3 | P3 | Read-path observability. | Report C2, alignment memo | 6 | new | defer | B/future | Concrete consumer needed. | Pure view semantics preserved. | Revisit when consumer exists. |
| B4 | P3 | Retention/redaction/logical-delete/export policy. | Report C3, alignment memo | 6 | new | defer | B/future | Compliance/export posture needed. | No conflation with hash chain/FHIR Provenance. | Later governance pass. |
| C1 | P2 | Minimum viable FHIR boundary. | FHIR boundary memo, report M3/S1 | 6 | planned | future-plan-candidate | C | Workstream A projection exists first. | Boundary kept out of Workstream A implementation. | Human approves adapter plan after proof. |
| C2 | P2 | openEHR contribution semantics. | openEHR synthesis | 6 | planned | process-candidate | C/B | Commit discipline decision. | No event-schema change; Git layer only. | Fold into process docs if approved. |
| C3 | P2 | Medplum/HealthChain adapter ergonomics. | adapter synthesis | 6 | planned | future-plan-candidate | C | FHIR boundary and memory-proof projection. | Stateless export API only; no platform scope. | Future adapter PRD. |
| D1 | P2 | Positioning docs: agent-native clinical record substrate. | report framing, revised alignment | 6 | deferred | docs-alignment | D | Workstream A proof exists. | README/DESIGN/ROADMAP changes follow proof, not precede it. | Later docs pass. |
| X1 | P0 | Full EHR, compliance platform, UI, auth/RBAC, broad automation. | ADR 016, report defers, user constraints | 1/3/6 | deferred | no-op/defer | none | N/A | Remains out of scope. | None. |
| PHA | P1 | Phase A source consolidation into PRD candidates. | `clinical-reference/phase-a/*` | 4/6 | mixed | plan-candidate | phase-a | Avoid overwriting in-flight untracked syntheses. | Source map identifies which syntheses are authoritative vs advisory. | Human picks first Phase A PRD slice. |
| V03 | P1 | v0.3 memo reconciliation. | `memos/pi-chart-v03-memo.md`, ADRs, ROADMAP | 3/4/6 | mixed | status-check | v03 | Accepted ADR status and current code. | Table of accepted/superseded/pending/deferred v0.3 items. | Human approves promotions or defers. |
| PRO | P0 | OMX/memo promotion into tracked docs/plans. | `.omx/*`, `memos/*`, `.gitignore` | 5-7 | active | plan-candidate | omx-promotion | Identify durable decisions in ignored paths. | Tracked plan/docs artifact exists before execution. | Human reviews promoted artifact. |
| ORDER | P1 | Recommended sequencing across priority tracks. | user clarification, current artifact | 1/5 | active | docs-update | all | Keep no-code boundaries. | Order documented in this operating index. | Use unless human revises. |

## Conflict Register / Status Index

| ID | Priority | Status | Conflict | Sources | Proposed resolution | Owner/gate | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | P1 | triaged | Ignored memos contain current decisions, but ignored paths are not tracked authority. | `.gitignore`, `memos/*` | Promote durable decisions into tracked `plans/` or `decisions/`; keep memos as evidence. | Human planning gate | Use this file and sibling PRD/test spec as tracked staging artifacts. |
| C-002 | P1 | triaged | Existing `.omx/plans` Workstream A PRD/test spec are ignored, but useful. | `.gitignore`, `.omx/plans/*` | Treat as source context; create tracked plan artifacts before execution. | Human planning gate | Keep no-code; do not execute Workstream A yet. |
| C-003 | P0 | needs-human | Revised alignment says "build Workstream A now", but latest user says no code. | revised alignment, user answers | User instruction wins; keep Workstream A as backlog/plan only. | User | Do not launch implementation until explicitly requested. |
| C-004 | P2 | triaged | Workstream A fixture target differs across artifacts (`patient_001` vs `patient_002`). | `.omx/plans/prd-memory-proof...`, revised alignment | Record as future execution decision; no need to settle in no-code planning pass. | Future PRD gate | Include as explicit option in implementation plan. |
| C-005 | P1 | needs-review | Actor-attestation may already have ADR 017, while older memos call it pending. | `decisions/017-*`, `memos/Actor-attestation-taxonomy.md`, revised alignment | Accepted ADR outranks memo if ADR 017 is current and accepted. | Human/ADR review | Verify ADR 017 status before creating more actor-attestation work. |
| C-006 | P2 | triaged | FHIR boundary decision exists in ignored memo but implementation is deferred. | FHIR boundary memo, report, roadmap | Treat as future constraint, not Workstream A scope. | Future adapter PRD gate | Do not implement adapter in current no-code pass. |
| C-007 | P0 | closed | Literal Kanban board may burden user. | interview answer + clarification | Use Markdown conflict status table instead. | Agent call accepted | Implemented in this tracked artifact. |
| C-008 | P1 | triaged | Phase A syntheses include tracked and untracked files, so authority/freshness is mixed. | `clinical-reference/phase-a/*`, git status | Do not treat every Phase A file as equally canonical; source-map each file before PRD conversion. | Phase A planning gate | Build a Phase A source-map slice before turning syntheses into implementation tickets. |
| C-009 | P1 | needs-review | v0.3 memo contains proposals whose status may have changed after ADR 015/016/017. | `memos/pi-chart-v03-memo.md`, `decisions/015-*`, `decisions/016-*`, `decisions/017-*` | Reconcile memo rows against accepted ADRs and current code before using it as source. | v0.3 reconciliation gate | Produce accepted/superseded/pending/deferred table. |
| C-010 | P2 | triaged | Boundary memos are useful future constraints but can widen Workstream A if treated as current scope. | FHIR/openEHR/adapter memos, ADR 016 | Keep boundary as future PRD input behind proof; do not implement or design speculative adapter scope now. | Boundary planning gate | Add boundary rows only after Workstream A proof or explicit user approval. |
| C-011 | P0 | closed | Priority tracks might be mistaken for a final lock. | user clarification | Treat current priorities as provisional triage tracks, not final sequencing. | Agent call accepted | Keep "no final priority lock" explicit in rules. |
| C-012 | P0 | closed | A full deep-all pass would be too broad for the current no-code planning stage. | user clarification | Use bounded triage by priority track; deep-dive only after a track is selected. | Agent call accepted | Keep "no full deep-all" explicit in rules. |
| C-013 | P0 | closed | Agent may be too passive about ordering and status updates. | user clarification | Agent may choose depth, add docs/plans, update statuses, edit source docs lightly, and recommend order. | Agent call accepted | Recommended order documented above. |

## Operating Rules For Agents

1. Start from this source map before planning from deep-research artifacts.
2. Prefer tracked ADRs and docs over ignored memos when they conflict.
3. Use ignored memos as evidence packets, not canonical policy.
4. Do not implement code from this operating artifact.
5. Do not launch full automation from this operating artifact.
6. Keep conflicts visible in the status index until a human gate or tracked
   plan/ADR closes them.
7. Work priority-first, not document-order-first: P0 gates before P1 plan work,
   P1 before P2, and P3 only when a real consumer appears.
8. Treat `phase-a`, `v03`, `adr17`, `boundary`, and `omx-promotion` as the
   current provisional priority tracks for bounded triage, not final locked
   sequencing.
9. Do not run a full deep-all pass unless the user explicitly asks for it.
10. Do not implement adapter code or speculative adapter scope from boundary
   memos.
11. Choose depth pragmatically per priority track; do not ask the user to
   micromanage analysis depth.
12. Add tracked docs/plans and update planning statuses when it reduces drift.
13. Edit source docs lightly when needed to keep tracked planning state coherent,
   but do not change implementation code.
14. Recommend ordering explicitly.
15. Convert work into thin PRD/test-spec slices before execution.
16. Preserve the pi-chart thesis: provenance-native clinical memory substrate,
   not full EHR, AI gateway, compliance platform, or FHIR-internal model.

## Next Move

Review the staged PRD/test-spec in this `plans/` directory. If accepted, the
next planning task is to choose which backlog row gets a full tracked PRD next.
The default is still Workstream A, but no implementation starts until the user
explicitly switches from no-code planning to execution.
