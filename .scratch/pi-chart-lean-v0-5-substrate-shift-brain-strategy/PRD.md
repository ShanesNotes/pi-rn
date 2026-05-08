# PRD: pi-chart lean v0.5 substrate + clinician workflow / shift-brain strategy

Status: needs-triage
Source handoff: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/closeout-verification-and-downstream-handoff.md`
Primary companion inputs:
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/lean-dense-v0-5-substrate-recommendation.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/hitl-workflow-prioritization-decisions.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## Problem Statement

Phase A finished the docs-only context-digging and corpus-mining closeout. It produced enough evidence to begin a new Pocock phase, but the next phase needs a focused PRD before work is sliced into AFK-friendly issues.

From the clinician and maintainer perspective, the central problem is not "how do we build another EHR module?" The problem is: **how can the chart and agent gather the right context at the right time to make the clinician maximally effective?**

The project now needs a lean v0.5 `pi-chart` substrate strategy that keeps canonical clinical memory small, evidenced, and source-linked while allowing many useful views over it. The chart must remember facts, actions, notes, and refs as canonical memory. Current packets, trends, evidence chains, review state, handoff, and shift-brain/task-list surfaces must remain derived projections over that memory. If those projections become competing sources of chart truth, the system will create duplicate truth, stale workflow state, and unsafe agent authority.

The workflow problem is especially important for bedside nursing and clinician shift work. Existing task lists can be flat, noisy, punitive, or disconnected from clinical meaning. The v0.5 strategy should instead define a supportive **shift brain**: a derived prioritization surface that helps clinicians see what needs attention now, soon, later, or at handoff; why it matters; who or what created it; what evidence supports it; what completes it; and how to defer, block, cluster, or carry it forward without judgment.

The next phase must preserve the Phase A evidence boundaries. It must not select backend, vector, OpenBrain, storage, runtime, or access-plane architecture. It must not widen the `pi-ledger` kernel. It must not couple `pi-chart` to hidden `pi-sim` internals. It must not authorize direct agent accepted-writes or autonomous task completion. It must keep the workflow posture nonpunitive: the system supports competent clinicians under load with gentle prioritization, not blame.

## Solution

Create a triageable PRD for the lean v0.5 `pi-chart` substrate and workflow/shift-brain strategy. The PRD should turn the completed Phase A recommendation into a product and domain contract that can later be sliced into issues.

The solution is a small set of deep modules, expressed as stable product/domain interfaces rather than a backend implementation choice:

1. **Canonical chart memory grammar** — the chart records canonical facts, actions, notes, communications, artifact refs, evidence/provenance refs, source/authorship, lifecycle, timing, and review/attestation facts. These are the durable clinical memory layer.
2. **Chart-once/project-many projection contract** — current packet, trends, evidence chains, open loops, review state, handoff, care plan/watch items, and shift-brain views are rebuildable projections over canonical memory.
3. **Hot/warm/cold context access behavior** — hot context is deterministic current-care truth; warm context is supporting recent/review evidence; cold context is source-linked longitudinal/background context. This is an access behavior and priority model, not a backend or retrieval technology decision.
4. **Workflow item/source/authority grammar** — per-patient workflow items expose why they exist, who or what created them, whether they are required/suggested/routine/informational, what completes them, and what happens when they are ignored, deferred, blocked, or carried forward.
5. **Clinical-risk prioritization and shift-brain projection** — the shift brain groups work into supportive tiers such as now/safety-critical, due soon/time-sensitive, routine care, and handoff/watch. Time matters, but clinical risk wins.
6. **Orders/MAR/open-loop workflow semantics** — orders, medication due work, administrations, holds, refusals, omissions, retiming, verbal/telephone orders, protocol/order-set-derived tasks, and open loops share explicit source, authority, evidence, timing, completion, and lifecycle semantics without becoming full CPOE, pharmacy, or barcode MAR scope.
7. **Human-agent collaboration boundary** — agent outputs can suggest, cite, extract, summarize, and prioritize, but human acceptance is required before an agent-created task becomes active workflow. The agent task-suggestion function must be disable-able. Humans own charting, review, task completion, and handoff truth.
8. **Handoff/watch/care-clustering projection** — unresolved safety work, blocked items, delayed relevant care, recent major changes, patient-specific watch items, medication/order issues, pending labs/scans/consults, clinician-deferred items, and care-cluster suggestions can flow into handoff as derived/proposed material. The human owns final handoff content.
9. **Boundary and reconciliation register** — each downstream issue should carry the Phase A reconciliation posture: `adopt`, `revise`, `open-question`, `defer`, or `reject`. Useful evidence must remain evidence until promoted by a triaged issue, accepted ADR, or canonical doc.

The strategy should be clinically broad but implementation-lean. It should carry forward the strongest Phase A decisions while explicitly deferring architecture and product-policy seams that are not needed to define the substrate.

## User Stories

1. As a maintainer, I want the Phase A closeout translated into a new PRD, so that downstream work starts from verified evidence instead of chat memory.
2. As a maintainer, I want the PRD to start as `needs-triage`, so that no agent treats the strategy as implementation-ready before issue slicing.
3. As a maintainer, I want chart facts, actions, notes, and refs named as canonical memory, so that projections do not become duplicate truth.
4. As a maintainer, I want current packet, trends, evidence chains, review state, handoff, and shift-brain views named as projections, so that derived material stays rebuildable and non-authoritative.
5. As a maintainer, I want brownfield evidence treated as useful evidence rather than authority, so that v0.5 does not inherit prototype storage shape by accident.
6. As a maintainer, I want raw design/generated UI evidence rejected as substrate authority, so that clinical questions survive without UI capture.
7. As a maintainer, I want backend, vector, OpenBrain, storage, runtime, and access-plane decisions deferred, so that clinical substrate design does not become a premature architecture commitment.
8. As a maintainer, I want `pi-ledger` mentioned only as future adapter scope, so that the reusable ledger kernel is not expanded by a chart-workflow PRD.
9. As a simulator-boundary reviewer, I want hidden `pi-sim` internals excluded, so that chart memory never depends on oracle truth.
10. As a clinician, I want the chart to gather the right context at the right time, so that I can spend more attention on patient care.
11. As a clinician, I want hot current-care facts to be deterministic, so that immediate safety decisions do not depend on semantic retrieval.
12. As a clinician, I want warm supporting evidence available when I dig deeper, so that I can verify why a projection says something matters.
13. As a clinician, I want cold prior history to remain source-linked and citable, so that background context can inform care without bloating the hot packet.
14. As a nurse, I want a patient and encounter as-of frame, so that every workflow item and projection is scoped to the right patient and time.
15. As a nurse, I want active allergies, precautions, code status, constraints, and safety flags surfaced as hot context, so that preventable harm is avoided.
16. As a nurse, I want active problems, assessments, bedside findings, uncertainty, and contested claims tied to evidence, so that I can understand the current working model.
17. As a nurse, I want current vitals, oxygen/device context, invalid-sample suppression, and short trends available, so that physiologic trajectory is visible.
18. As a clinician, I want labs and diagnostics modeled as result facts separate from review actions, so that unreviewed, critical, corrected, and pending result states are not conflated.
19. As a clinician, I want evidence chains with source, role, timing, and transform context, so that I can decide whether a claim is credible.
20. As a clinician, I want review state to be derived from review actions, so that review/accountability is explicit without mutating the original claim.
21. As a nurse, I want orders and obligations represented as intents, actions, fulfillments, failures, refusals, holds, and open loops, so that I can see what is still unresolved.
22. As a nurse, I want medication orders, administrations, due work, holds, refusals, omissions, titrations, restarts, and reconciliation decisions represented in a lean way, so that medication context supports care without full pharmacy scope.
23. As a nurse, I want med retiming modeled as a charted medication workflow action, so that retiming is not reduced to an invisible due-time mutation.
24. As a nurse, I want minimal verbal and telephone order semantics, so that nurse-entered orders, readback, co-sign need, co-sign state, and rejection/correction paths are visible.
25. As a nurse, I want order-set-derived work represented through source and authority, so that default admission, ICU, protocol, and standing-order tasks can later feed workflow without hardcoding order-set content.
26. As a nurse, I want unit-policy-derived work represented through source and authority, so that policy-generated tasks are explainable instead of magical defaults.
27. As a nurse, I want cadence items to declare their source, so that assessment and task cadence can come from policy, order set, acuity, nurse-authored plan, provider/protocol order, insulin protocol, pressure-injury risk, or scoring protocol.
28. As a nurse, I want workflow items to answer why they are on my list, so that I can prioritize rather than blindly comply.
29. As a nurse, I want workflow items to show who or what created them, so that I can distinguish provider orders, protocols, nurse judgment, patient requests, agent suggestions, device/import attention items, and system projections.
30. As a nurse, I want workflow items to say whether they are required, suggested, routine, or informational, so that urgency and authority are clear.
31. As a nurse, I want workflow items to say what completes them, so that completion can be linked to chart actions or modeled device/import evidence where appropriate.
32. As a nurse, I want the agent to suggest completion only when evidence supports it, so that the agent does not silently complete human care tasks.
33. As a nurse, I want humans to own workflow completion, so that clinical judgment and sanctioned charting remain authoritative.
34. As a nurse, I want an agent-created task to start as suggested, so that it is visible but provisional.
35. As a nurse, I want an accepted agent-created task to be promoted only by a human, so that the agent cannot create active obligations by itself.
36. As a nurse, I want to reject or dismiss an agent-created task, so that irrelevant suggestions do not clutter the shift brain.
37. As a nurse, I want agent task suggestions to be disable-able, so that workflow support remains under human control.
38. As a nurse, I want the shift brain to rank by clinical-risk tiers, so that safety-critical work is not buried under routine due-time sorting.
39. As a nurse, I want due and overdue time to sort within a risk tier, so that time still matters after clinical risk is considered.
40. As a nurse, I want a default now-plus-next-four-hours horizon, so that the shift brain matches practical shift planning.
41. As a nurse, I want now, next-hour, next-four-hour, shift, and encounter horizons, so that I can adjust the projection to the work I am doing.
42. As a nurse, I want view customization for grouping, filtering, pinning, snoozing, personal notes, checklists, and unit templates, so that the workflow surface adapts to my practice.
43. As a clinician, I want display customization separated from clinical workflow modification, so that view changes do not alter chart truth.
44. As a clinician, I want medication retiming, holds, refusals, verbal orders, telephone orders, readback, and co-sign to remain charted clinical actions, so that workflow changes carry source, authority, timing, and attestation.
45. As a nurse, I want the shift brain to be supportive and nonpunitive, so that delayed or deferred tasks are understood as reprioritization under load.
46. As a nurse, I want neutral language such as due, due soon, needs attention, delayed, carry forward, blocked, waiting on, and deferred by clinician, so that the system does not shame me.
47. As a nurse, I want to mark a task deferred, not clinically appropriate now, waiting on patient condition, waiting on provider/pharmacy/transport, or bundled with the next care cluster, so that the view reflects real clinical tradeoffs.
48. As a nurse, I want to avoid blame-oriented words like failed or noncompliant in routine workflow views, so that prioritization does not become punitive audit behavior.
49. As a nurse, I want care clustering to group compatible tasks by patient, location, and time window, so that I can reduce interruptions and bedside trips.
50. As a nurse, I want care clustering to respect urgency and incompatibilities, so that grouping does not hide safety-critical work.
51. As a nurse, I want to accept, modify, or ignore care clusters, so that clustering remains advisory.
52. As a nurse, I want unresolved clusters to carry to handoff/watch when useful, so that important work survives shift transitions.
53. As a nurse, I want most workflow support to be glanceable rather than interruptive, so that the system does not add noise.
54. As a nurse, I want prominent interruption only for immediate safety risk, critical meds/drips, deterioration, transport/procedure readiness, critical unreviewed results, blocked safety tasks, or order/constraint conflicts, so that alerts remain meaningful.
55. As a nurse, I want routine turns, baths, assessments, I&O, and non-urgent dressing changes to stay quiet unless context changes, so that normal care work does not become alarm fatigue.
56. As a handoff sender, I want unresolved safety-critical tasks, blocked tasks, delayed relevant care, watch items, recent major changes, medication/order issues, pending labs/scans/consults, clinician-deferred items, and care-cluster suggestions proposed for handoff, so that nothing important is forgotten.
57. As a handoff sender, I want final handoff content to remain human-owned, so that derived/proposed handoff never becomes silent chart truth.
58. As a handoff receiver, I want the handoff projection to explain why each item matters, so that I inherit context rather than a flat checklist.
59. As a clinician, I want notes and narrative to stay addressable source-linked truth, so that prose can be cited without forced duplicate structured charting.
60. As a clinician, I want facts extracted from notes to become canonical only when explicitly promoted, so that note-derived summaries do not silently replace source notes.
61. As an agent, I want canonical facts to project into multiple views, so that I can gather context without writing new chart truth.
62. As an agent, I want generated summaries marked as suggestions or derived projections, so that I do not confuse my output with accepted clinical memory.
63. As an agent, I want source, evidence, and review status visible, so that I can cite and prioritize without overclaiming certainty.
64. As an agent, I want human acceptance state visible for suggestions, so that I know what is provisional versus accepted.
65. As a clinical-safety reviewer, I want direct agent accepted-writes out of scope, so that humans remain responsible for acceptance, charting, completion, and handoff truth.
66. As a clinical-safety reviewer, I want autonomous task completion out of scope, so that workflow automation does not overstep clinical authority.
67. As a reviewer, I want every downstream issue to name whether it is carrying an adopt, revise, open-question, defer, or reject row, so that evidence posture is visible.
68. As a reviewer, I want open bedside/I&O/LDA/device grammar questions preserved, so that implementation does not pretend unresolved HITL decisions are settled.
69. As a reviewer, I want result-review closure policy preserved as a revise/HITL topic, so that routine closure and agent provisional review are not hardcoded early.
70. As a reviewer, I want note addressability and extracted-fact promotion boundaries preserved, so that narrative stays useful and safe.
71. As a reviewer, I want cold-history retrieval language limited to source-linked citation and eligibility, so that the PRD does not choose vector or semantic architecture.
72. As an issue author, I want downstream slices to be independently grabbable, so that AFK agents can work without reopening the whole Phase A corpus.
73. As an issue author, I want each slice to name allowed surfaces, forbidden surfaces, acceptance criteria, and verification, so that boundaries survive execution.
74. As a test author, I want external behavior tests for projection contracts, so that tests lock clinician-visible behavior rather than private storage shape.
75. As a test author, I want workflow tests to prove source/authority, priority tiering, defer/block/carry-forward semantics, and nonpunitive language, so that the shift brain remains supportive.
76. As a test author, I want human-agent boundary tests, so that suggestions cannot become active tasks or completion authority without human acceptance.
77. As a product reviewer, I want rendered/prototype navigation lessons preserved only as affordance pressure, so that UI can evolve independently of substrate semantics.
78. As a product reviewer, I want assignment-level nurse brain deferred behind per-patient workflow items, so that cross-patient orchestration does not precede patient-scoped truth.
79. As a future adapter author, I want chart substrate fields defined before any `pi-chart` to `pi-ledger` adapter work, so that adapter mapping is explicit rather than speculative.
80. As a maintainer, I want this PRD to become the active `.scratch` work surface, so that `$to-issues` can create bounded implementation or docs slices from durable context.
81. As an incoming critical care nurse, I want to select my assigned patients at shift start, so that every handoff, report sheet, and chart review surface is scoped to the right assignment.
82. As an incoming critical care nurse, I want nurse-to-nurse report to stay connected to a one-page handoff visual, so that high-attention items are visible while the offgoing nurse talks.
83. As an incoming critical care nurse, I want the handoff visual to summarize code status, isolation/precautions, consults, allergies, admission timing, principal problem, relevant history, and nursing-system concerns, so that I can orient quickly before deeper chart digging.
84. As an incoming critical care nurse, I want the handoff visual to include drips/infusions, medication context, blood-pressure goals, lines, tubes, drains, wounds, mobility, fall risk, abnormal labs, and to-do items, so that report covers the practical bedside state I inherit.
85. As an incoming critical care nurse, I want to skim the H&P during report, so that I understand why the patient is here and what baseline/background context matters.
86. As an incoming critical care nurse, I want to skim the most recent ICU note from rounds, so that I know the current provider plan and recent clinical reasoning.
87. As an incoming critical care nurse, I want to check vital trends during report, so that I can detect trajectory concerns and compare charted trends with what I am hearing.
88. As an incoming critical care nurse, I want to verify that documented drip/dose rates match the offgoing report and bedside reality, so that medication and hemodynamic context is safe.
89. As an incoming critical care nurse, I want to review I&O and fluid balance, so that volume status and net balance are part of my shift-start mental model.
90. As an incoming critical care nurse, I want to review lab trends, so that worsening, improving, abnormal, pending, or unreviewed results are visible before I plan care.
91. As an incoming critical care nurse, I want to check the work list/task list for pending lab draws and nursing-specific actions, so that open obligations are not missed after handoff.
92. As an incoming critical care nurse, I want to go into the room after report and introduce myself, verify medications, and look at the vitals monitor, so that chart context is reconciled with bedside reality.
93. As an incoming critical care nurse, I want urgent bedside findings to interrupt my plan only when they truly need attention, so that safety-critical work wins without making routine work noisy.
94. As an incoming critical care nurse, I want to return to the computer and plan my med pass around due meds, so that medications anchor my early shift workflow.
95. As an incoming critical care nurse, I want to cluster my first assessment with 8, 9, or 10 o’clock meds when clinically appropriate, so that I can reduce room entries and chart efficiently.
96. As an incoming critical care nurse, I want to document the assessment after giving clustered meds and completing bedside assessment, so that charting reflects the care actually performed.
97. As a shift-brain designer, I want the shift-start workflow to connect handoff, H&P, ICU note, vitals, drips, I&O, labs, task list, bedside verification, med planning, care clustering, and assessment charting, so that the projection supports real ICU nursing sequence rather than an abstract task list.
98. As a shift-brain designer, I want the one-page report sheet treated as product/workflow evidence rather than canonical chart truth, so that useful handoff organization does not become a competing medical record.
99. As a shift-brain designer, I want the system to surface mismatches between handoff, charted dose rates, vitals trends, and bedside monitor observations as review prompts, so that the nurse can reconcile them without the agent declaring truth autonomously.
100. As a nurse, I want the shift brain to help me build a safe early-shift plan without judging the order I choose to do things, so that it supports expert reprioritization under ICU workload.

## Implementation Decisions

- This PRD is a strategy and issue-slicing input. It does not authorize source implementation edits by itself.
- The core framing is: chart and agent gather the right context at the right time to make the clinician maximally effective.
- Canonical memory consists of chart facts, actions, notes, communications, artifact refs, evidence/provenance refs, source/authorship, timing, lifecycle, review, and attestation facts.
- Current packet, trends, evidence chains, open loops, review state, narrative summaries, handoff, care plan/watch items, care clusters, and shift-brain/task-list surfaces are derived projections.
- Projections are rebuildable and non-authoritative. They must not become competing chart truth or autonomous completion authority.
- Hot/warm/cold is accepted as an access behavior and prioritization model, not a storage, vector, OpenBrain, service, runtime, or access-plane architecture.
- Hot context means deterministic current-care facts needed for immediate clinical reasoning and safety.
- Warm context means recent or supporting structured evidence, review/action history, and chart-digging expansion.
- Cold context means source-linked longitudinal history, prior encounters, old consults, discharge summaries, H&P, and narrative/background material that may later become retrieval-eligible without becoming current truth.
- Carry forward the Phase A `adopt` decisions around evidence/provenance semantics, lean obligation/open-loop state, narrative/handoff projection, chart-once/project-many discipline, source/authorship semantics, lifecycle evaluation, and rendered/prototype clinical-question affordances.
- Treat Phase A `revise` decisions as useful evidence requiring downstream shape, naming, policy, or scope refinement before implementation.
- Preserve the open question around clinically consequential bedside/I&O/LDA/device grammar for explicit HITL resolution before implementation authority.
- Preserve deferred decisions around backend/vector/OpenBrain/storage/runtime/access-plane/adapter architecture, legal/compliance/raw audit, role registry, protocol/CDS engine, and order-set content.
- Preserve rejected authority boundaries around raw design assets, generated UI, and disposable derived output.
- The workflow/shift-brain strategy is per-patient first. Assignment-level nurse brain is a later aggregation/orchestration projection over per-patient workflow items.
- The incoming critical care nurse shift-start sequence is a primary workflow anchor: patient selection, nurse-to-nurse handoff, one-page report visual, H&P skim, ICU note skim, vitals trend review, drip/dose-rate verification, I&O review, lab trend review, work/task-list review, bedside introduction/medication/monitor verification, urgent issue handling, med-pass planning, care clustering, assessment, and assessment charting.
- One-page handoff/report sheets are workflow/product evidence and visual scaffolding. They can inform projection fields and attention grouping, but they are not a permanent medical record and do not become canonical chart truth unless their contents map back to canonical chart facts/actions/notes/refs.
- Shift-start mismatch prompts should be review prompts, not autonomous truth decisions: if report, charted dose rates, vitals trends, I&O/labs, or bedside monitor observations disagree, the projection should help the clinician reconcile sources with evidence.
- Workflow item sources may include provider orders, protocol/order-set generated orders, verbal/telephone orders entered by nurses pending co-sign, nursing judgment/nurse-authored tasks, patient/family requests, agent suggestions pending acceptance, device/import-derived attention items, and system projections from existing facts.
- Each workflow item should expose why it exists, who or what created it, whether it is required/suggested/routine/informational, what completes it, and what happens when it is ignored, deferred, blocked, or carried forward.
- Agent-created tasks use a three-state model: suggested, accepted, and rejected/dismissed. Only human acceptance promotes a suggestion into active workflow.
- Agent task suggestions must be disable-able.
- Humans complete workflow tasks. Narrow chart/device/import evidence may satisfy explicitly modeled facts, and the agent may suggest completion when evidence supports it, but the agent may not silently complete tasks.
- Priority logic should be clinical-risk/context tiered: now/safety-critical, due soon/time-sensitive, routine care, and handoff/watch. Sort by due/overdue time within tiers.
- The default shift-brain horizon should be now plus the next four hours, while supporting now, next hour, next four hours, shift view, and encounter context.
- View customization may affect horizons, grouping, filtering, visibility, pinning, snoozing, personal notes/checklists, and unit templates. It does not mutate canonical chart truth.
- Clinical workflow modification is distinct from display customization. Retiming meds, documenting holds/refusals, verbal/telephone orders, readback, and co-sign/countersign are charted clinical actions with source, authority, timing, and attestation.
- Minimal verbal/telephone order semantics should include nurse-entered order, ordering provider, verbal/telephone mode, readback status, timestamp, co-sign requirement, co-sign state, downstream order/MAR/workflow tasks, and correction/supersession if rejected or modified.
- Medication retiming should be represented as a medication workflow action linked to the original order/MAR schedule, not as a silent due-time mutation.
- Order-set content, unit policy libraries, protocol libraries, and adult ICU/default admission order packages are downstream content/policy artifacts, not core substrate primitives.
- Unit policy should be represented as structured policy-derived workflow source material with policy source, name/version, patient applicability, generated obligation, override/defer reason, and human completion/action.
- Cadence items require source, authority, and override/defer semantics.
- Care clustering is a derived grouping/projection that may group compatible tasks by patient/location/time window while respecting urgency and incompatibilities.
- Handoff carry-forward is derived/proposed content. Humans own final handoff.
- Nonpunitive workflow framing is mandatory: gentle reminders, unobtrusive suggestions, no shaming language, no "nurse failed" framing, no punitive audit posture, and an assumption that higher-priority work displaced lower-priority work.
- Use neutral/supportive language such as needs attention, due, due soon, delayed, carry forward, review priority, blocked, waiting on, deferred by clinician, not clinically appropriate now, and bundled with next care cluster.
- Do not build full EHR modules, full CPOE, full pharmacy workflow, barcode MAR, legal/compliance platform, raw read-path audit, access-control plane, or external EHR integration in this PRD.
- Do not expand `pi-ledger` kernel scope. Any ledger language remains future `pi-chart` adapter implication only.
- Do not couple to hidden `pi-sim` internals. Observable public telemetry may become chart truth only through explicit charting/adapters or clinician validation in later scoped work.

## Testing Decisions

- Good tests for future implementation should verify clinician-visible external behavior and domain invariants, not private storage layout, helper names, UI shape, or backend choice.
- PRD verification is structural: the published PRD must carry `Status: needs-triage`, cite the closeout and companion inputs, preserve canonical-versus-derived framing, and keep all listed deferrals and authority boundaries.
- Canonical chart memory tests should verify that facts, actions, notes, refs, source/authorship, timing, lifecycle, evidence, review, and attestation remain the authoritative memory layer.
- Projection contract tests should verify that current packet, trends, evidence chains, open loops, review state, handoff, care clusters, and shift-brain views can be rebuilt from canonical memory.
- Hot/warm/cold tests should verify behavior through examples: immediate current-care truth is deterministic; warm evidence supports chart digging; cold history is source-linked and not silently promoted.
- Workflow item grammar tests should verify source/authority, required/suggested/routine/informational posture, due windows, completion criteria, ignored/deferred/blocked/carry-forward states, and evidence links.
- Shift-start workflow tests should verify the incoming critical care nurse sequence from patient selection through handoff, H&P/ICU-note skim, vitals/drip/I&O/lab/task review, bedside verification, med-pass planning, care clustering, assessment, and assessment charting.
- Handoff-tool reference tests should verify that report-sheet fields are projected from or linked to canonical chart facts/actions/notes/refs and are not treated as independent chart truth.
- Priority tests should verify that clinical risk wins over simple due-time ordering, while due/overdue time sorts within a risk tier.
- Nonpunitive-language tests should verify that routine delayed/deferred work uses supportive language and avoids blame-oriented framing.
- Agent-suggestion tests should verify that suggestions remain provisional until human acceptance, can be rejected/dismissed, and can be disabled.
- Completion-authority tests should verify that the agent cannot silently complete human workflow tasks.
- Medication workflow tests should verify administrations, holds, refusals, omissions, retiming as workflow action, and linked schedule/order/MAR context without requiring full pharmacy workflow.
- Verbal/telephone order tests should verify nurse-entered order source, ordering provider, mode, readback, co-sign requirement, co-sign state, and correction/supersession path.
- Unit-policy and order-set-derived workflow tests should verify source/version/applicability/generated-obligation/override semantics without hardcoding a policy or order-set library into substrate tests.
- Care-clustering tests should verify advisory grouping, urgency/incompatibility respect, and preservation of underlying task source.
- Handoff projection tests should verify derived/proposed carry-forward content while preserving human ownership of final handoff.
- Review/accountability tests should verify review state as a projection over review/attestation actions, not mutation of the target fact.
- Boundary tests should verify no hidden simulator internals, no backend/vector/OpenBrain/runtime/access-plane selection, no direct agent accepted-writes, and no `pi-ledger` kernel expansion.
- Prior art for future tests includes the existing behavior categories from current-state, trend, evidence-chain, open-loop, review/attestation, lifecycle/active-state, validation, and memory-proof projection checks. These are evidence categories, not implementation authority.

## Out of Scope

- Selecting or implementing backend, vector, OpenBrain, storage, runtime, service, graph/index, semantic search, or access-plane architecture.
- Choosing final adapter architecture or implementing a `pi-chart` to `pi-ledger` adapter.
- Expanding the `pi-ledger` kernel.
- Coupling `pi-chart` or `pi-agent` to hidden `pi-sim` internals, hidden physiology, simulator oracle truth, evaluator labels, or runtime transcripts as chart truth.
- Authorizing direct agent accepted-writes to canonical chart truth.
- Authorizing autonomous agent task completion.
- Building full CPOE, pharmacy verification, barcode MAR, drug dictionary, full medication reconciliation product, legal/compliance platform, raw access audit, production access control, role registry, billing, scheduling, ADT, claims, or external EHR integration.
- Implementing order-set content, unit-policy libraries, protocol libraries, adult ICU order packages, or default admission order packages.
- Implementing cross-patient assignment-level nurse brain before per-patient workflow items are modeled.
- Treating generated UI, raw design assets, screenshots, public API shape, disposable `_derived` output, or prototype layout as substrate authority.
- Editing patient fixtures, migrating patient data, or rewriting brownfield code as part of this PRD.
- Reopening accepted ADRs without a separate explicit ADR conflict/decision process.

## Further Notes

### Field story: incoming critical care nurse shift start

A critical care nurse coming on shift first logs into the computer, selects assigned patients, and receives nurse-to-nurse report from the offgoing nurse. Report is organized around a one-page nursing handoff sheet. That sheet is valuable as a visual attention scaffold: it keeps code status, isolation/precautions, consults, allergies, admission context, principal problem, relevant history, nursing assessment, drips/infusions, medications, blood-pressure goals, lines/tubes/drains, wounds, mobility/fall risk, abnormal labs, to-do items, family/social context, and safety checks in one glanceable place.

While report is happening, the incoming nurse also digs into chart context: skim the H&P to understand why the patient is here, skim the most recent ICU note to understand the current plan, review vital trends, compare documented drip/dose rates with the report, review I&O and fluid balance, review lab trends, and check the work/task list for pending lab draws or nursing-specific actions.

After report, the nurse goes to the room, introduces themself, verifies medications, and looks at the bedside vitals monitor for urgent issues. If nothing urgent needs action, the nurse returns to the computer and plans the early shift around medication timing. The first assessment is often clustered with 8, 9, or 10 o’clock medications, commonly around 8:30 when clinically appropriate, followed by assessment charting after meds and bedside assessment are complete.

Product implication: the shift brain should support this real sequence rather than present a flat task list. It should connect handoff, H&P, ICU note, vitals, drips, I&O, labs, task list, bedside verification, medication timing, care clustering, and assessment charting while preserving human judgment over what happens first.

Visual reference: `/home/ark/Downloads/corewellnursereportuserstory.png` shows a Corewell ICU nursing report with skin tool. The visual is workflow evidence for one-page organization and attention categories only. It is not permanent chart truth, not a UI mandate, and not substrate authority unless mapped back to canonical chart facts/actions/notes/refs.

### Dual-use stance: clinician reader and bounded in-chart assistant

The human ICU nurse shift-start story is the high-authority workflow input. The later AI-agent-style framing is treated only as a weak wording prompt and should not override clinician workflow evidence or chart-safety boundaries.

Downstream issues should keep two perspectives visible:

1. **Clinician reading the chart in real time.** The chart should help an incoming nurse or clinician rapidly orient, spot abnormal or urgent context, understand trends in plain clinical language, and plan safe next actions without being flooded by technical implementation detail.
2. **Bounded assistant operating inside the chart.** The agent may act as an evidence-linked reasoning and suggestion layer over chart memory: detecting patterns, validating suggestions against evidence, explaining why an item may matter, and proposing prompts or next steps. It should not be framed as a clinician-equivalent decision-maker, a development agent building the chart, silent chart truth, direct accepted-write authority, or autonomous completion authority.

Usefulness comes from timely, source-linked, respectful support. Human clinicians own acceptance, charting, completion, clinical judgment, and final handoff truth.

### Evidence stance

This PRD consumes the Phase A closeout as source of truth for downstream strategy. The closeout verified that the Phase A evidence packs, corpus atlas, brownfield crosswalk, hot/warm/cold model, mismatch register, lean v0.5 recommendation, and HITL workflow decisions are ready to feed downstream PRDs/issues.

The downstream work should cite Phase A reconciliation rows rather than re-mining the whole archive. Adopted rows can be carried forward as stable substrate behavior. Revised rows need naming/shape/policy/scope refinement. Open questions need maintainer/HITL resolution. Deferred rows must remain out of implementation authority. Rejected rows may provide context but not substrate authority.

### Suggested downstream issue lanes

1. v0.5 substrate vocabulary and evidence/provenance grammar.
2. Hot current-packet and chart-once/project-many projection contract.
3. Result/review/open-loop separation for labs, diagnostics, orders, and handoff.
4. Medication/MAR/med-rec semantics, including retiming, holds, refusals, source, and authority.
5. Per-patient workflow/shift-brain grammar: sources, authority hierarchy, due windows, clinical-risk tiers, defer/blocked/carry-forward states, nonpunitive language, disable-able agent suggestions, and human completion authority.
6. Minimal verbal/telephone order representation with readback, co-sign, and correction/supersession state.
7. Unit policy, cadence, protocol, and order-set-derived work as source-linked workflow inputs without implementing content libraries.
8. Care clustering, interruptiveness rules, and handoff/watch carry-forward projection.
9. Cold-history source-linked citation and future retrieval eligibility without choosing vector/backend/OpenBrain.
10. Rendered/prototype navigation lessons as product affordances only, not UI/API/storage authority.
11. Brownfield reconciliation/archive plan that supersedes useful prototype concepts without preserving obsolete storage shape.
12. Future `pi-chart` to `pi-ledger` adapter PRD/issues only after chart substrate fields are explicit enough to map cleanly.

### Stop condition

This PRD is ready for `$to-issues` when a triage reviewer agrees that it preserves the Phase A handoff framing, clearly separates canonical memory from derived projections, defines the per-patient shift-brain strategy without punitive or autonomous-agent authority, and keeps all backend, retrieval, adapter, simulator, and ledger-kernel decisions out of scope.
