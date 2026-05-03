# PRD: pi-chart Phase A Context Digging + Corpus Mining Strategy

Status: needs-triage
Program status: docs-first mining and reconciliation workstream; no source implementation, patient migration, backend/index selection, or vector/OpenBrain commitment authorized.
Source plan: `.omx/plans/ralplan-phase-a-context-digging-corpus-mining.md`

## Problem Statement

`pi-chart` has a large amount of valuable Phase A work spread across three different kinds of evidence: original Phase A planning/research artifacts, brownfield `pi-chart` implementation and tests, and the `patient_001` through `patient_005` corpus. The project now needs a clean v0.5 direction that is broad enough to recover the useful clinical substrate from all of that work, but lean and dense enough to avoid rebuilding a full EHR clone.

From the maintainer's perspective, the risk is two-sided. If future agents ignore the existing Phase A code, they may repeat work that was already implemented or tested. If they treat the brownfield code as canon, they may accidentally carry prototype gravity, old `EventEnvelope` assumptions, stale patient fixture coupling, or UI-shaped artifacts into the v0.5 rebuild. The source planning artifacts are also not enough by themselves because they do not fully show what the prototype actually proved in code or how the patient corpus behaves.

The missing product surface is a clinician-style chart-digging strategy: how a nurse, clinician, or bounded agent digs through chart history, current state, trends, evidence, notes, MAR, labs, orders, open loops, prior encounters, and handoff context to understand what matters for caring for the patient. This strategy must distinguish hot deterministic chart context from warm supporting context and cold background/semantic history without prematurely deciding vector storage, OpenBrain backend shape, graph indexing, or production runtime architecture.

The output should become the active `.scratch` work surface for a future lean/dense v0.5 substrate: broad in clinical coverage, strict in authority, and compact in primitive grammar.

## Solution

Create a docs-first PRD workstream that mines Phase A through a three-layer reconciliation model:

1. **Source planning artifacts** express intended Phase A clinical/function direction.
2. **Brownfield `pi-chart` code and tests** provide implementation evidence only.
3. **`patient_001` through `patient_005`** provide fixture and scenario coverage evidence only.

The workstream should produce a set of mining and reconciliation artifacts before any source implementation begins. The goal is not to copy old code or rewrite patients. The goal is to extract the minimum reusable clinical substrate for v0.5: what the chart must know, how that knowledge is proven, how it is projected, how clinicians dig through it, and which parts must be hot, warm, or cold for future access.

The strategy should preserve the authority ladder approved by the consensus plan:

- accepted ADRs and the source-authority map govern when evidence conflicts;
- Phase A artifacts describe intended clinical/function direction;
- brownfield code/tests show attempted behavior only;
- patient corpus files show fixture/scenario coverage only;
- any disagreement must enter a mismatch register before a recommendation is promoted.

The workstream should be explicitly broad in substrate coverage. It should mine and refine the following clinical substrate families into a lean v0.5 vocabulary:

| Substrate family | Chart-digging purpose | Lean v0.5 substrate question |
| --- | --- | --- |
| Patient identity, demographics, encounter context | Establish who the patient is, why they are here, and what encounter/time window is being reviewed. | What identity and encounter facts must always be hot and deterministic? |
| Baseline history and prior encounters | Explain why current findings matter and what is different from baseline. | Which history belongs in structured chart context, and which belongs in future cold semantic retrieval with source links? |
| Constraints, allergies, precautions, code status, safety flags | Prevent unsafe care and guide immediate decisions. | Which constraints must be hot, reviewed, and explicitly evidenced? |
| Problem list and active assessments | Summarize what clinicians currently believe is going on. | Which assessments are current truth, which are contested, and what evidence supports them? |
| Vitals, flowsheets, alarms, and trends | Show trajectory and current physiologic concern. | Which trend windows are hot, and how are device/adapter observations bounded by provenance and time? |
| Bedside nursing assessment and exam findings | Add clinical context not visible in monitors. | How does one bedside observation get charted once and reused across projections? |
| Labs, diagnostics, artifacts, and result review | Add asynchronous evidence that changes interpretation or closes loops. | Which result facts are canonical, which reviews are actions, and how are pending/critical results surfaced? |
| Orders, intents, interventions, and fulfillment | Represent planned and performed clinical work. | How do intents, actions, fulfillments, failures, and open loops compose without full CPOE? |
| MAR and medication reconciliation | Explain active medication state, administration, holds, refusals, med history, and medication-risk context. | What minimal medication substrate is needed for chart digging without building pharmacy workflow? |
| I&O, LDAs, devices, oxygen context, and lines | Preserve relevant bedside/device context and clinical burden. | Which device/context intervals are canonical versus rendered context? |
| Provider notes, nursing notes, communication, and narrative | Preserve clinical reasoning and handoff prose without duplicate entry. | Which narrative content remains note truth, and which facts should be extracted or linked as structured claims? |
| Care plan, handoff, and next-shift watch items | Carry forward what matters next. | What deterministic projection answers what happened, why, evidence, uncertainty, open loops, and handoff? |
| Review, attestation, authorship, and accountability | Distinguish human-authored, agent-authored, reviewed, accepted, rejected, verified, co-signed, corrected, and superseded material. | Which review facts are canonical actions and which review states are derived projection metadata? |
| Evidence, provenance, lifecycle, corrections, and source authority | Make all chart context auditable and replayable. | How does v0.5 keep provenance dense but not turn into compliance theater? |
| Context packet / chart-digging access tier | Decide what must be instantly available versus retrievable background. | What is hot/warm/cold behavior now, without committing to vector/backend implementation? |

The resulting PRD and future issues should produce six main artifacts:

1. a Phase A source artifact mining map;
2. a brownfield implementation crosswalk;
3. a `patient_001` through `patient_005` corpus mining matrix;
4. a three-layer reconciliation and mismatch register;
5. a context-digging guidance model with hot/warm/cold access tiers;
6. a final v0.5 substrate recommendation that is broad, lean, dense, and ready for issue slicing.

## User Stories

1. As a maintainer, I want Phase A source artifacts, brownfield code, and patient corpus evidence reconciled together, so that v0.5 does not lose useful work or inherit prototype mistakes.
2. As a maintainer, I want the PRD to start as `needs-triage`, so that no AFK agent treats this broad mining lane as implementation-ready.
3. As a maintainer, I want a lean dense v0.5 substrate recommendation, so that the chart can be clinically broad without becoming a full EHR clone.
4. As a future v0.5 agent, I want an explicit authority ladder, so that I know when source artifacts, code behavior, or corpus evidence disagree.
5. As a future v0.5 agent, I want brownfield code treated as evidence rather than canon, so that I do not blindly preserve accidental prototype structure.
6. As a future v0.5 agent, I want Phase A source artifacts mined for clinical function, so that the rebuild starts from purpose rather than legacy EHR forms.
7. As a future v0.5 agent, I want patient corpus evidence mined separately, so that fixture coverage does not silently become schema authority.
8. As a clinical-memory architect, I want chart-digging behavior described explicitly, so that context construction follows clinician reasoning rather than generic search.
9. As a nurse, I want the chart to surface who the patient is and why they are here, so that I can orient before making care decisions.
10. As a nurse, I want code status, allergies, isolation, precautions, and active constraints immediately visible, so that unsafe actions are avoided.
11. As a nurse, I want active problems and current assessments tied to evidence, so that I can judge whether the chart's working model is credible.
12. As a clinician, I want vital trends and alarm context available quickly, so that trajectory is not hidden behind isolated values.
13. As a clinician, I want bedside exam findings preserved with provenance, so that context not visible in monitors is part of chart memory.
14. As a clinician, I want labs and diagnostics tied to result-review actions, so that pending, abnormal, reviewed, and unreviewed results are distinguishable.
15. As a clinician, I want orders and interventions represented as intents and actions, so that I can see what was planned, done, failed, or still pending.
16. As a nurse, I want medication orders, administrations, holds, refusals, and reconciliation decisions mined into a minimal substrate, so that medication context is available without building a full pharmacy system.
17. As a nurse, I want I&O, LDAs, oxygen delivery, and device context represented only when clinically useful, so that bedside context is available without flowsheet bloat.
18. As a clinician, I want notes and narrative charting connected to structured evidence, so that prose is useful without duplicating canonical facts.
19. As a handoff receiver, I want the chart to answer what happened, why it mattered, what evidence supports it, what is uncertain, what is pending, and what to watch next, so that handoff is reliable.
20. As a future agent, I want the same canonical fact reused across trend, narrative, evidence, open-loop, review, care-plan, and handoff projections, so that I do not create duplicate chart truth.
21. As a future agent, I want a context packet model, so that I know what chart context should be assembled before reasoning about care.
22. As a future agent, I want hot chart context defined, so that immediate care-relevant facts are deterministic and not dependent on semantic retrieval.
23. As a future agent, I want warm chart context defined, so that supporting evidence and recent history can be pulled when digging deeper.
24. As a future agent, I want cold chart context defined, so that prior encounters, H&P, discharge summaries, old consults, and longitudinal narrative can be considered without bloating the hot packet.
25. As an OpenBrain planner, I want vector/semantic eligibility captured as future access requirements only, so that backend choices wait for evidence-backed needs.
26. As a chart search designer, I want to know which history can be semantic retrieval and which must be structured current truth, so that retrieval never becomes a second source of clinical truth.
27. As a clinical-safety reviewer, I want agent-authored material distinguished from human-authored and human-reviewed material, so that suggestions do not become accepted truth silently.
28. As a clinical-safety reviewer, I want accepted, verified, rejected, co-signed, corrected, and superseded states disentangled, so that review/accountability and lifecycle semantics are not conflated.
29. As a provenance reviewer, I want every promoted substrate recommendation tied to source, code/test, and corpus evidence, so that v0.5 decisions are auditable.
30. As a source-authority reviewer, I want disagreements placed in a mismatch register, so that no single evidence layer silently wins.
31. As a package/research reviewer, I want archived Phase A and later research package details mined without wholesale import, so that useful research survives without widening scope.
32. As a brownfield cleanup agent, I want preserve/revise/discard/defer recommendations for implemented view behavior, so that cleanup and rebuild work is guided.
33. As a test author, I want current tests mapped to intended behavior, so that tests can be reused as evidence or rewritten intentionally.
34. As a future adapter author, I want this workstream to preserve pi-ledger sequencing, so that chart substrate mining does not add new kernel requirements.
35. As a future adapter author, I want chart substrate expectations separated from ledger kernel behavior, so that `pi-ledger` remains reusable.
36. As a simulator-boundary reviewer, I want hidden `pi-sim` internals excluded, so that chart context never includes oracle truth.
37. As a patient-corpus author, I want `patient_001` marked as a narrow respiratory seed rather than a completed broad fixture, so that future agents do not over-credit it.
38. As a patient-corpus author, I want `patient_002` mined for live-demo and telemetry-facing chart surface implications, so that public observable data can be separated from hidden simulation state.
39. As a patient-corpus author, I want `patient_003` mined for infection escalation context, so that labs, trends, orders, antimicrobials, and open loops are represented.
40. As a patient-corpus author, I want `patient_004` mined for cardiac/renal medication management, so that MAR, med reconciliation, renal labs, holds, and medication-risk context are represented.
41. As a patient-corpus author, I want `patient_005` mined for postop frailty and delirium, so that nursing assessment, safety constraints, cognition, mobility, notes, and handoff are represented.
42. As a clinician, I want prior history and physical information available when relevant, so that current concerns are interpreted against baseline.
43. As a clinician, I want prior encounters and discharge summaries considered as cold/background context, so that longitudinal history is accessible without overwhelming current state.
44. As a chart-view designer, I want rendered views separated from derived projections, so that UI decisions do not become storage primitives.
45. As a chart substrate designer, I want canonical facts separated from derived summaries, so that projections can be rebuilt and audited.
46. As a future UI designer, I want chart-digging outputs described as clinical questions and not screens, so that UI can evolve without changing substrate semantics.
47. As a documentation agent, I want source planning artifacts and current implementation evidence cited, so that future agents can trace why decisions were made.
48. As a triage reviewer, I want future issues to be independently grabbable, so that broad mining can proceed in parallel without one agent owning all context.
49. As an AFK agent, I want each issue to specify source artifacts, brownfield surfaces, corpus scope, acceptance criteria, and verification, so that I can work without extra interviews.
50. As a verifier, I want boundary checks for vector/backend, hidden simulator, EHR-clone framing, patient migration, and pi-ledger expansion, so that the PRD stays a mining lane.
51. As a maintainer, I want the workstream to be broad now and implementation-narrow later, so that v0.5 decisions are not under-informed.
52. As a maintainer, I want lean substrate language, so that v0.5 can preserve dense clinical meaning with a small primitive set.
53. As a future issue author, I want reconciliation states to include adopt, revise, defer, reject, and open question, so that downstream work knows the decision posture.
54. As a future research-package author, I want downstream archived research packages to consume this substrate map, so that later research is context-aware and does not restart from raw EHR modules.
55. As a future clinician reviewer, I want chart-digging examples to reflect nursing and provider workflow, so that the substrate remains clinically recognizable.
56. As a future runtime planner, I want direct agent accepted-writes kept out of this PRD, so that proposal/review policy can be decided later.
57. As a future access-plane planner, I want hot/warm/cold access needs documented, so that permissions and retrieval can be designed from clinical need rather than tool convenience.
58. As a future performance planner, I want hot context separated from cold context, so that latency-sensitive chart reads can be optimized without prematurely choosing a storage engine.
59. As a future FHIR/openEHR boundary planner, I want external EHR mapping deferred, so that internal v0.5 substrate is not shaped by export formats.
60. As a maintainer, I want this PRD to become the active work surface in `.scratch`, so that future `$to-issues` can create AFK slices from durable context rather than chat history.

## Implementation Decisions

- This is a docs-first mining and reconciliation PRD. It authorizes planning artifacts only, not source code changes or patient corpus edits.
- The active decision model is three-layer reconciliation: source intent, brownfield implementation evidence, and patient corpus coverage.
- Accepted ADRs and the project source-authority map override lower-authority evidence when conflicts arise.
- Brownfield code/tests should be mined for behavior, vocabulary, and prior proof points, but they must not silently define v0.5 architecture.
- Source planning artifacts should be mined for clinical function, minimum data, provenance, lifecycle, primitive grammar, view grammar, and open questions.
- Patient corpus files should be mined for scenario coverage, clinical questions, fixture gaps, and chart-digging examples, but not treated as schema authority by themselves.
- The PRD should produce a brownfield implementation crosswalk before final substrate recommendations are accepted.
- The PRD should produce a corpus mining matrix across all five current patient fixtures and scenario blueprints.
- The PRD should produce a mismatch register with explicit resolution states: adopt, revise, defer, reject, and open question.
- Every major recommendation should carry a source citation, a code/test citation or explicit `not-covered`, a corpus citation or explicit `not-covered`, and a reconciliation state.
- The final v0.5 recommendation should be broad across chart surfaces but lean in primitives and storage commitments.
- The substrate should continue to prefer a compact clinical grammar: observations, assessments, intents, actions, communications, artifact references, notes, links, and derived views.
- Current and future context should be described as chart-digging behavior, not as UI screens or EHR modules.
- Hot context should mean deterministic, low-latency, current-care facts needed for immediate reasoning.
- Warm context should mean recent or supporting structured evidence used during deeper chart review.
- Cold context should mean longitudinal history, prior encounters, H&P, old consults, discharge summaries, and narrative background that may later be semantic/vector eligible but is not authoritative current-state truth.
- Future vector/OpenBrain/graph/backend design is deferred. This PRD may classify future retrieval needs but must not pick storage, embedding, service, index, or runtime technology.
- Review and attestation should remain a clinical-accountability design concern. The PRD should preserve the existing direction that review actions are canonical and review/accountability states are derived unless a later ADR changes that.
- `pi-ledger` kernel behavior remains unchanged by this PRD. Any chart substrate recommendation that needs ledger support must be recorded as a future adapter or chart requirement, not as a new kernel task.
- Hidden simulator state is forbidden as evidence for chart truth. Only public chart-facing or patient-corpus artifacts may be mined.
- Current patient migration is out of scope. The corpus is evidence for mining, not an immediate migration target.
- External EHR formats, FHIR/openEHR export, compliance posture, raw read-path audit, production access control, legal signatures, and deployment architecture remain downstream work.
- The future issue set should be optimized for AFK development: small slices, explicit evidence surfaces, clear acceptance criteria, and closeout verification.

## Testing Decisions

- Good tests for future implementation should verify externally visible chart behavior, not private helper structure or file-layout assumptions.
- This PRD itself is verified structurally: source traceability, brownfield traceability, corpus traceability, mismatch-state completeness, and boundary checks.
- The source artifact mining output should be checked against Phase A charter language, broad EHR skeleton requirements, status-matrix coverage, deep-research alignment, and actor/review guidance.
- The brownfield implementation crosswalk should be checked against current view, validation, write, derived-output, review, attestation, evidence, vitals, and memory-proof behavior tests.
- The corpus mining matrix should be checked against all five patient fixtures and their scenario materials, with caveats preserved rather than smoothed over.
- The final substrate recommendation should be tested by review questions: does each substrate family answer a concrete clinical decision, handoff, safety check, trend, fulfillment, audit, or chart-digging question?
- The hot/warm/cold taxonomy should be tested by examples: immediate current-care facts should never require semantic retrieval, while longitudinal narrative history should not bloat the hot packet.
- The mismatch register should be tested by sampling each evidence layer and confirming disagreements are not resolved implicitly.
- The issue readiness pass should confirm that each future issue has a parent PRD, scope, evidence surfaces, deliverable, acceptance criteria, blocked-by state, and closeout verification.
- Future source implementation tests, if authorized later, should reuse current behavior tests only after the brownfield crosswalk classifies them as preserve or revise.
- No test plan in this PRD should require production backend, vector database, hidden simulator internals, FHIR server, patient migration, or direct agent write path.

## Out of Scope

- Editing `pi-chart` source code.
- Editing patient fixtures, patient directories, or scenario blueprints.
- Migrating current patients into `pi-ledger`.
- Implementing a `pi-chart` ↔ `pi-ledger` adapter.
- Adding new `pi-ledger` kernel requirements.
- Selecting or implementing vector storage, OpenBrain, graph indexes, semantic search, backend services, or production runtime infrastructure.
- Building UI screens, chart panels, React Native surfaces, or design assets.
- Building a full EHR clone, full MAR, full medication reconciliation product, full CPOE, pharmacy workflow, billing, scheduling, ADT, claims, legal-signature, auth/RBAC, tenancy, or compliance platform.
- Depending on hidden `pi-sim` internals, hidden physiology, evaluator labels, simulator oracle truth, or runtime transcripts as chart truth.
- FHIR/openEHR import/export implementation, public FHIR server, SMART/CDS Hooks, GraphQL, subscriptions, Bulk Data, or external EHR integration.
- Direct agent accepted-writes to clinical truth.
- Rewriting accepted ADRs.
- Committing to archive/delete decisions for prototype code before the crosswalk and reconciliation register exist.

## Further Notes

### Evidence anchors

The future issues should mine these surfaces first:

- Phase A process and source intent: `pi-chart/clinical-reference/phase-a/` and the Phase A status matrix.
- Broad clinical-memory direction: the broad EHR skeleton reference and memory-proof projection requirements.
- Brownfield implementation evidence: current `pi-chart` view primitives, validation/write paths, derived-output generation, review/attestation projections, vitals/evidence handling, and their tests.
- Patient corpus evidence: `patient_001` through `patient_005`, including derived files, scenario blueprints, live-demo/public-surface materials, and scaffold caveats.
- Consensus planning evidence: `.omx/plans/ralplan-phase-a-context-digging-corpus-mining.md`.

### Required caveats

- `patient_001` is a narrow respiratory-decompensation seed, not proof that the broad EHR skeleton is complete.
- `patient_002` is useful for live-demo/public telemetry/chart-surface mining, but hidden simulator internals remain out of bounds.
- `patient_003`, `patient_004`, and `patient_005` should be mined for scenario pressure, but any operator-review or realism caveats must stay visible.
- Current `memoryProof`, `currentState`, `openLoops`, `evidenceChain`, `trend`, review, attestation, validation, and derived-output behavior can be strong evidence, but only after crosswalk classification.

### Suggested future issue slices

1. Brownfield implementation crosswalk.
2. Phase A source artifact mining map.
3. Patient corpus mining matrix.
4. Broad substrate detail catalog for lean dense v0.5.
5. Three-layer reconciliation and mismatch register.
6. Context-digging and hot/warm/cold guidance model.
7. PRD closeout, verification, and handoff to `$to-issues`.

### Stop condition for this workstream

This workstream is complete when the PRD and future issues can tell an AFK agent exactly which Phase A substrate details to preserve, revise, defer, reject, or ask about for v0.5 — without editing source, migrating patients, selecting a backend, or treating any single evidence layer as automatic authority.
