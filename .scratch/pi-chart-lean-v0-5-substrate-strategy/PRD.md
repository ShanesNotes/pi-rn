# PRD: pi-chart lean v0.5 substrate strategy

> **SUPERSEDED (2026-05-29):** superseded by `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/` (the -shift-brain variant), whose PRD and 15 issues are the active, committed substrate work surface (latest commit `06acc9a Close substrate slice before adapter work`). Use that directory for active work; this file is retained as lineage only.

Status: superseded (was: needs-triage)
Program status: downstream docs-only strategy from Phase A closeout; no source implementation, patient migration, backend/index selection, vector/OpenBrain commitment, or direct agent accepted-write path authorized.
Source closeout: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/closeout-verification-and-downstream-handoff.md`
Primary evidence: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/lean-dense-v0-5-substrate-recommendation.md`
HITL workflow evidence: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/hitl-workflow-prioritization-decisions.md`

## Problem Statement

`pi-chart` has completed its Phase A context-digging and corpus-mining workstream. That closeout produced a lean dense v0.5 substrate recommendation, a 21-row reconciliation matrix, source/code/corpus evidence, mismatch preservation, and maintainer HITL decisions about workflow and shift-brain behavior. The next risk is losing that evidence in chat history or over-expanding it into a premature implementation plan.

From the maintainer's perspective, v0.5 needs a durable product/architecture work surface that translates the mining output into a strategy for chart truth, projections, context access, and clinician workflow. The chart must gather the right context at the right time to make the clinician maximally effective, but it must not become a full EHR clone, a punitive task manager, an autonomous agent write system, a backend/vector decision, or a silent import of brownfield prototype structure.

The current handoff is intentionally broad: identity, encounter, constraints, problems, vitals, labs, diagnostics, orders, MAR, medication reconciliation, bedside I&O/LDA/device context, notes, narrative, handoff, review, attestation, provenance, lifecycle, hot/warm/cold access, chart-once/project-many projections, agent suggestions, and future `pi-ledger` adapter implications. The missing work is to turn those evidence-backed recommendations into a lean v0.5 substrate strategy that downstream `$to-issues` can slice into independently verifiable, AFK-friendly work.

## Solution

Create a docs-first PRD workstream that promotes the Phase A closeout into the active `.scratch` issue-tracker surface for lean v0.5 substrate strategy. This PRD defines what v0.5 should preserve, revise, defer, reject, and leave as open HITL/product questions before code-bearing implementation begins.

The strategy has five layers:

1. **Canonical chart memory** — chart facts, actions, notes, communications, artifact refs, evidence refs, source/authorship/review/attestation facts, clinical time, recorded time, lifecycle links, and patient/encounter scope.
2. **Derived projections** — current packet, trends, evidence chains, open loops, result-review state, medication context, narrative/handoff, care plan/watch items, workflow/shift-brain, and rendered/navigation affordances.
3. **Context access behavior** — hot deterministic current-care facts, warm chart-review expansion, and cold source-linked longitudinal/background context, without committing to vector storage, OpenBrain, graph indexes, or backend shape.
4. **Clinician workflow support** — per-patient shift-brain substrate that helps clinicians prioritize gently and safely while preserving human authority for charting, task completion, handoff, and agent-suggestion acceptance.
5. **Boundary/adapter posture** — chart substrate fields should eventually map to `pi-ledger` through explicit adapters, but this PRD does not add `pi-ledger` kernel requirements, migrate patient data, or import hidden `pi-sim` internals.

Downstream issue slicing should start from the closeout's recommended lanes:

1. v0.5 substrate vocabulary and evidence/provenance grammar.
2. Hot current-packet and chart-once/project-many projection contract.
3. Result/review/open-loop separation for labs, diagnostics, orders, and handoff.
4. Medication/MAR/med-rec and med-retiming semantics with authority/source fields.
5. Per-patient workflow/shift-brain substrate.
6. Minimal verbal/telephone order representation and co-sign/readback status.
7. Cold-history source-linked citation and future semantic eligibility.
8. Rendered/prototype navigation lessons as product affordances only.
9. Brownfield reconciliation/archive plan.
10. Future `pi-chart` to `pi-ledger` adapter strategy only after chart substrate fields are explicit enough to map cleanly.

## User Stories

1. As a maintainer, I want the Phase A closeout promoted into a new PRD, so that future work starts from durable `.scratch` artifacts rather than chat history.
2. As a maintainer, I want the PRD to remain `needs-triage`, so that no AFK agent treats this broad strategy as implementation-ready.
3. As a clinical-memory architect, I want chart facts, actions, notes, refs, and provenance treated as canonical memory, so that derived views never become a second source of truth.
4. As a clinical-memory architect, I want current packet, trends, evidence chains, review state, handoff, and workflow views treated as projections, so that they can be rebuilt and audited.
5. As a clinician, I want the chart to answer who the patient is, why they are here, and what as-of frame I am reviewing, so that I can orient safely.
6. As a nurse, I want allergies, code status, isolation, precautions, and other constraints to be hot deterministic truth, so that unsafe care is avoided.
7. As a clinician, I want active problems and assessments tied to evidence and lifecycle state, so that I can trust or challenge the working model.
8. As a clinician, I want vitals, oxygen, device context, and trend windows separated by hot/warm/cold behavior, so that immediate instability is visible without bloating current context.
9. As a clinician, I want labs and diagnostics represented as result facts distinct from review actions, so that pending, critical, reviewed, and unreviewed material are not conflated.
10. As a clinician, I want artifact/report pointers tied to evidence refs, so that source documents remain traceable without becoming storage/backend commitments.
11. As a nurse, I want orders represented as intents and downstream actions/fulfillments, so that planned, pending, performed, delayed, failed, and closed work are visible.
12. As a nurse, I want open loops derived from chart facts instead of manually duplicated, so that worklists and handoff stay grounded in chart truth.
13. As a nurse, I want medication orders, MAR administrations, holds, refusals, and med-rec decisions included in the substrate, so that medication context is available without building full pharmacy workflow.
14. As a nurse, I want medication retiming represented as a charted medication workflow action linked to the original order/MAR schedule, so that real nursing workflow is modeled accurately.
15. As a clinician, I want bedside I&O, LDA, oxygen, device, and nursing-assessment context included only when clinically consequential, so that the chart captures burden without flowsheet bloat.
16. As a clinician, I want notes and narrative communication preserved with source links, so that human reasoning and handoff are not erased by extracted facts.
17. As a handoff giver, I want unresolved safety-critical tasks, blocked work, watch items, major changes, pending results, and deferred items projected into handoff suggestions, so that handoff is complete but human-owned.
18. As a handoff receiver, I want proposed handoff content clearly derived and editable, so that final handoff truth remains a human responsibility.
19. As a future chart-view author, I want chart-once/project-many discipline, so that one canonical fact can power current state, trend, evidence, narrative, workflow, handoff, and memory-proof views.
20. As an access-plane planner, I want hot context defined as deterministic current-care truth, so that immediate care never depends on semantic retrieval.
21. As an access-plane planner, I want warm context defined as supporting structured review evidence, so that deeper chart digging can expand without changing canonical truth.
22. As an access-plane planner, I want cold context defined as source-linked longitudinal/background context, so that prior encounters and old narrative remain available without bloating hot context.
23. As a future OpenBrain or vector planner, I want semantic eligibility captured as a future access need only, so that v0.5 does not prematurely choose a backend.
24. As a clinician, I want the shift brain to prioritize by clinical risk/context tiers before due time, so that the most important work is not buried in a flat task list.
25. As a nurse, I want default workflow views for now and next four hours, so that current shift priorities are immediately usable.
26. As a nurse, I want optional horizons for next hour, shift view, and encounter context, so that workflow can fit local practice.
27. As a nurse, I want view customization for grouping, filtering, pinning, snoozing, personal notes, and unit templates, so that the tool supports my workflow without mutating chart truth.
28. As a nurse, I want care clustering as a derived grouping, so that compatible work can be bundled without changing underlying task sources.
29. As a nurse, I want neutral language such as due, delayed, carry forward, blocked, waiting on, and deferred by clinician, so that the system helps rather than judges.
30. As a nurse, I want the system to assume competent reprioritization under load, so that delayed work does not become punitive audit theater.
31. As a clinician, I want interruptions reserved for immediate safety risk, critical meds/drips, deterioration, time-sensitive transport/procedure readiness, critical unreviewed results, missing evidence/orders, or order/constraint conflicts, so that routine work stays glanceable.
32. As a clinician, I want workflow items to expose who or what created them, why they are listed, whether they are required/suggested/routine/informational, what completes them, and what happens if they are deferred, so that priority decisions are explainable.
33. As a nurse, I want provider orders, protocol/order-set work, verbal/telephone orders, nurse-authored tasks, patient/family requests, agent suggestions, device/import attention items, and system projections represented with source/authority, so that workflow items have clinical accountability.
34. As a nurse, I want minimal verbal and telephone order semantics, so that nurse-entered orders, ordering provider, readback, timestamp, co-sign requirement, and co-sign status can drive downstream workflow.
35. As a nurse, I want unit policy and cadence sources represented as structured policy-derived workflow sources, so that assessment/task cadence can cite authority without hardcoding policy content.
36. As a maintainer, I want actual admission/ICU order-set content deferred, so that the substrate models order-set-derived work without becoming a policy library.
37. As a clinician-safety reviewer, I want agent-created tasks to be suggested, accepted, or rejected/dismissed, so that only human acceptance promotes suggestions into active workflow.
38. As a clinician-safety reviewer, I want agent task suggestion to be disable-able, so that the chart can support sites that do not want agent task proposals.
39. As a clinician-safety reviewer, I want humans to own task completion, so that MAR/device/import evidence can satisfy explicitly modeled facts but agents cannot silently complete nursing work.
40. As a review/accountability designer, I want source kind, author, reviewer, attester, co-signer, scribe/witness, correction, supersession, entered-in-error, and active-as-of lifecycle semantics preserved, so that clinical accountability is explicit but not full legal/compliance machinery.
41. As a future `pi-ledger` adapter author, I want chart substrate fields explicit before adapter mapping begins, so that ledger integration stays adapter-local and does not expand the reusable kernel prematurely.
42. As a boundary reviewer, I want hidden `pi-sim` internals excluded, so that only observable/charted/public surfaces can become chart truth.
43. As a brownfield reviewer, I want current `pi-chart` code/tests used as evidence only, so that useful prototype ideas are retained without importing obsolete storage shape.
44. As a designer, I want rendered/prototype artifacts treated as chart-digging question pressure only, so that UI layout, generated HTML, component names, and design assets do not become substrate authority.
45. As a future issue author, I want each downstream issue to preserve decision state (`adopt`, `revise`, `open-question`, `defer`, `reject`), so that implementation does not flatten uncertainty.
46. As a future issue author, I want each issue to name allowed files, forbidden surfaces, closeout commands, and evidence sources, so that AFK agents can work safely.
47. As a verifier, I want boundary checks for no patient migration, no source edits in docs lanes, no backend/vector choice, no hidden simulator coupling, no EHR-clone framing, and no agent accepted writes, so that strategy does not widen scope.
48. As a maintainer, I want open questions such as I&O/LDA grammar and review-closure thresholds preserved, so that unresolved authority decisions are not accidentally implemented.
49. As a clinician, I want the chart and agent to gather the right context at the right time, so that clinical reasoning is faster, safer, and less fragmented.
50. As a maintainer, I want this PRD to be the next active work surface for `$to-issues`, so that downstream slicing starts from closeout evidence instead of re-mining Phase A.

## Implementation Decisions

- This is a docs-first strategy PRD. It authorizes PRD/issue drafting and evidence reconciliation only, not source implementation.
- The active source authority is the Phase A closeout plus the lean dense recommendation and HITL workflow decisions listed at the top of this PRD.
- The core framing is: the chart and agent gather the right context at the right time to make the clinician maximally effective.
- Canonical chart memory includes facts, actions, notes, communications, artifact refs, evidence refs, source/authorship/review/attestation facts, clinical time, recorded time, lifecycle links, and patient/encounter scope.
- Current packet, trends, evidence chains, review state, open loops, handoff, care plan/watch items, shift brain, and rendered navigation are derived projections over canonical memory.
- Hot/warm/cold is an access behavior and priority model, not a storage, vector, OpenBrain, graph, or backend decision.
- Hot context must remain deterministic current-care truth, especially identity/encounter/as-of frame, constraints, current assessments, critical current results, current vital/device context, active orders/open loops, safety-critical workflow, and immediate handoff/watch items.
- Warm context should cover supporting evidence, recent trends, result-review history, recent notes, recent communications, and chart-review expansion.
- Cold context should cover source-linked longitudinal/background context such as prior encounters, H&P, discharge summaries, older consults, old diagnostics, baseline history, and narrative archives.
- The v0.5 substrate should be broad across clinical surfaces but lean in primitives: observations, assessments, intents, actions, communications, artifact refs, notes, evidence/provenance refs, lifecycle links, and projection metadata.
- Chart-once/project-many is a required discipline: one canonical fact should be reusable across current state, trend, evidence, narrative, open-loop, review, care-plan, workflow, handoff, and memory-proof projections.
- Labs and diagnostics should distinguish result facts, artifact/report refs, fulfillment links, and review actions.
- Orders and workflow should distinguish intents, generated obligations, actions, fulfillment/refusal/hold/omission/failure links, dependencies, and open-loop projections without building full CPOE.
- Medication/MAR/med-rec scope should include active medication context, administrations, holds, refusals, med history/med-rec decisions, and medication-risk context without building full pharmacy verification or barcode MAR.
- Medication retiming is a medication workflow action linked to the original order/MAR schedule.
- Minimal verbal/telephone order representation belongs in v0.5 substrate because it affects nursing workflow and authority.
- Order-set-derived work belongs in substrate representation; actual order-set content/policy libraries are deferred.
- Unit-policy-derived cadence should be represented by policy source, policy name/version, patient applicability, generated task/obligation, override/defer reason, and human completion/action; actual policy content is deferred.
- Per-patient workflow substrate comes before assignment-level nurse brain; assignment-level views are later cross-patient projections/orchestration.
- Shift-brain/workflow surfaces are derived prioritization views only. They are not canonical chart truth, autonomous action authority, or completion authority.
- Workflow prioritization should be clinical-risk/context tiered, then sorted by due/delayed time within tiers.
- Workflow language must be supportive and non-punitive. It should assume clinician reprioritization under load and avoid blame-oriented failure/noncompliance language.
- Care clustering is a derived grouping/projection that may be accepted, modified, ignored, or carried forward without altering underlying task sources.
- Agent suggestions must carry provenance and provisional/accepted/rejected state. Only human acceptance promotes agent suggestions into active workflow.
- The agent task-suggestion function should be disable-able.
- Humans own charting, task completion, handoff truth, and promotion of agent suggestions.
- Device/import/chart evidence may satisfy explicitly modeled chart facts, but should not silently complete nursing workflow unless the completion semantics are explicitly modeled.
- Review, attestation, authorship, co-sign, scribe/witness, correction, supersession, entered-in-error, and active-as-of lifecycle semantics remain substrate concepts; full legal/compliance/raw audit and role-registry machinery are deferred.
- Brownfield `pi-chart` code/tests are evidence only. Existing DTO names, generated `_derived` output, UI layout, tabs, component names, and public API shape are not v0.5 authority.
- Rendered/prototype evidence may influence product affordances and chart-digging questions, not canonical facts, storage, schema, or API.
- `pi-ledger` integration is adapter implication only until chart substrate fields are explicit enough to map. This PRD does not add kernel requirements.
- Hidden `pi-sim` internals, oracle truth, latent scenario state, and validation internals are forbidden evidence for chart truth.
- Downstream issue slicing should preserve decision states from the recommendation matrix and not implement `open-question`, `defer`, or `reject` rows as if they were approved behavior.

## Testing Decisions

- This PRD is validated structurally: it must cite the Phase A closeout, lean dense recommendation, and HITL workflow decisions.
- Downstream issues should test external chart behavior and projection contracts, not private helper shape, generated UI artifacts, or historical brownfield file layout.
- Strategy closeout should verify that all downstream issues preserve the authority stance: chart canonical memory versus derived projections, hot/warm/cold as access behavior, human authority, agent suggestion boundaries, and no hidden simulator coupling.
- Substrate vocabulary tests should eventually prove that canonical records carry source, time, provenance, lifecycle, and evidence links sufficient for projections.
- Current-packet tests should eventually prove deterministic hot context for patient/encounter/as-of frame, constraints, current assessments, critical results, current vitals/device context, and active open loops.
- Projection tests should eventually prove chart-once/project-many by deriving multiple views from the same canonical facts without duplicating truth.
- Result/review tests should eventually prove that result facts, artifact refs, fulfillment state, and review actions are separable.
- Order/open-loop tests should eventually prove that intents, actions, dependencies, fulfillment, refusal, hold, omission, failure, and closure produce explainable open-loop projections.
- Medication tests should eventually cover MAR administration, holds/refusals, med-rec decisions, and med-retiming as linked workflow actions.
- Verbal/telephone order tests should eventually cover nurse-entered order, ordering provider, mode, readback, timestamp, co-sign requirement, co-sign status, downstream tasks, and correction/supersession if rejected or modified.
- Workflow/shift-brain tests should eventually cover source/authority hierarchy, clinical-risk tiers, due windows, defer/blocked/carry-forward states, care clustering, interruption thresholds, disable-able agent suggestions, and nonpunitive language.
- Handoff tests should eventually prove that derived handoff suggestions can include unresolved safety-critical tasks, blocked work, watch items, major changes, medication/order issues, pending labs/scans/consults, and clinician-deferred items while preserving human final ownership.
- Agent-suggestion tests should eventually cover suggested, accepted, and rejected/dismissed states, with human acceptance required for active workflow promotion.
- Boundary tests should cover no patient migration, no backend/vector/OpenBrain commitment, no hidden `pi-sim` internals, no raw design authority, no `_derived` truth, no direct agent accepted-writes, and no `pi-ledger` kernel expansion.
- Brownfield reconciliation tests should be selected only after issue slices classify current behavior as adopt, revise, reject, defer, or open question.
- Docs-only issue closeout should use structural checks and `git diff --check`; code-bearing issues should add targeted tests, typecheck, and relevant package checks.

## Out of Scope

- Editing `pi-chart` source code as part of this PRD.
- Editing patient fixtures or migrating patient directories.
- Implementing substrate modules, schemas, adapters, UI, backend services, or generated views.
- Selecting vector storage, OpenBrain, graph indexes, semantic search infrastructure, databases, service frameworks, or runtime hosting.
- Building a full EHR clone, full CPOE, full MAR, full pharmacy verification workflow, barcode medication administration, billing, scheduling, ADT, claims, role registry, legal-signature, compliance, or raw access-audit platform.
- Implementing actual admission order sets, ICU order sets, unit policy libraries, or protocol content.
- Implementing assignment-level cross-patient nurse brain before per-patient workflow substrate is clear.
- Treating rendered designs, generated HTML, screenshots, UI kits, component names, tabs, or visual style as substrate authority.
- Treating generated `_derived` output as canonical truth.
- Depending on hidden `pi-sim` internals, hidden physiology, evaluator labels, scenario secrets, simulator oracle truth, or runtime transcripts as chart truth.
- Adding new `pi-ledger` kernel requirements or coupling `pi-ledger` to `pi-chart` brownfield schemas.
- Building direct agent accepted-writes, autonomous task completion, autonomous handoff finalization, or silent agent promotion of chart truth.
- Resolving every open HITL question without a dedicated maintainer decision surface.

## Further Notes

Primary downstream issue lanes should be created from the closeout handoff, not by re-mining raw Phase A artifacts. Recommended first `$to-issues` output:

1. Substrate vocabulary and evidence/provenance grammar.
2. Hot current-packet and chart-once/project-many projection contract.
3. Result/review/open-loop separation.
4. Medication/MAR/med-rec and med-retiming semantics.
5. Per-patient workflow/shift-brain substrate.
6. Minimal verbal/telephone order and co-sign/readback semantics.
7. Cold-history source-linked citation and future semantic eligibility.
8. Rendered/prototype navigation lessons as product affordances.
9. Brownfield reconciliation/archive plan.
10. Future `pi-chart` to `pi-ledger` adapter strategy.

Open or high-risk decisions to preserve during triage:

- I&O/LDA/device grammar remains partly open and should not be silently implemented.
- Result-review closure and routine review thresholds need issue-level precision before code-bearing slices.
- Note addressability and extraction boundaries need careful separation between note truth and extracted structured facts.
- Agent suggestion acceptance is explicit; agent output remains provisional until human action.
- Cold-history retrieval can be semantic-eligible later, but source links and current-truth boundaries must stay deterministic.
- Workflow support must remain helpful, modular, and nonpunitive.

This PRD should be followed by `$to-issues` before implementation. Each issue should name allowed files, forbidden surfaces, source artifacts, decision-state rows, acceptance criteria, closeout commands, and whether it is docs-only or code-bearing.
