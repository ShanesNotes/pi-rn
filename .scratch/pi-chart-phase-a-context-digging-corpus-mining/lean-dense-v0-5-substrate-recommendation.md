# Lean dense v0.5 substrate recommendation

Status: ready-for-human
Parent PRD: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`
Source issue: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/13-lean-dense-v0-5-substrate-recommendation.md`
Plan: `.omx/plans/ralplan-issue-13-lean-dense-v0-5-substrate-recommendation.md`

## Scope and authority stance

This is the issue 13 maintainer-review draft for the lean dense v0.5 `pi-chart` substrate recommendation. It consumes the approved Phase A mining workstream evidence, especially:

- `PRD.md`;
- `hot-warm-cold-context-access-model.md`;
- `three-layer-reconciliation-and-mismatch-register.md`;
- substrate packs 05-10;
- `issues/03-brownfield-implementation-crosswalk.md`;
- `patient-001-005-corpus-atlas.md`;
- `source-artifact-mining-map.md`.

This artifact is **not implementation authorization**. It does not approve source edits, schema edits, patient migration, generated `_derived` output, backend/storage/runtime choices, vector/embedding/OpenBrain choices, hidden `pi-sim` coupling, direct agent accepted-writes, or new `pi-ledger` kernel requirements.

The adopted framing is: **how can the chart and agent gather the right context at the right time to make the clinician maximally effective?** In v0.5, the chart remains canonical memory, while chart and agent-facing projections become context-timing surfaces over that memory.

## Executive recommendation

Build v0.5 around a small, dense clinical grammar that can answer clinician chart-digging questions without becoming a full EHR clone. The substrate should preserve canonical chart facts with source, time, provenance, lifecycle, and evidence links; derive current state, trends, open loops, workflow priorities, care-plan/watch items, narrative context, review/accountability, and handoff from those facts; and keep hot current-care truth deterministic.

The recommendation is to carry forward the strongest Phase A ideas in three layers:

1. **Canonical substrate:** observations, assessments, intents, actions, communications, artifact refs, notes, evidence/provenance refs, lifecycle links, and source/authorship/attestation facts.
2. **Derived projections:** current packet, trends, evidence chains, open loops, result review state, narrative/handoff, care plan/watch items, and the clinician workflow/shift-brain surface.
3. **Access behavior:** hot deterministic current context, warm chart-review expansion, and cold source-linked longitudinal/background context.

The substrate should be clinically broad but implementation-lean. It should include identity/encounter, constraints, problems/assessments, vitals/oxygen/device context, labs/diagnostics, orders/open loops, MAR/med-rec, clinically consequential bedside/I&O/LDA/device context, notes/narrative/handoff, cold history, review/authorship/attestation/lifecycle, agent-suggestion provenance, and rendered/navigation lessons. It should explicitly defer backend, vector, OpenBrain, access-plane, full CPOE, pharmacy verification, barcode MAR, legal/compliance/raw-audit, and role-registry scope.

## Decision-state matrix

| Row | Family | State | Hot/warm/cold | Recommendation | Source | Code/test | Corpus | HITL/deferred caveat |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `RECON-HOT-001` | identity/encounter; context access | revise | hot for scoping; warm for supporting source refs | Carry forward hot patient/encounter/as-of/current-packet behavior, but rebuild names and storage shape from v0.5 substrate rather than brownfield `contextBundle`. | `SRC-A0A-001`; PRD context packet stories | `BF-READ-002`; `BF-CURRENT-011`; `BF-MEMPROOF-016` | `CORPUS-P002-LIVE-002` | `HOT-MISMATCH-001`; `HOT-MISMATCH-004`; cite actual crosswalk row `BF-READ-002` for read behavior |
| `RECON-HOT-002` | constraints; safety | revise | hot for current safety; warm for review/verification history | Preserve active constraints as deterministic, evidenced hot truth with later HITL on verification/read-receipt semantics. | `SRC-A0B-001` | `BF-CURRENT-011`; `BF-ACTIVE-022` | `CORPUS-P001-RESP-001`; `CORPUS-P005-FRAIL-005` | `HOT-MISMATCH-002`; `REV-MISMATCH-006` |
| `RECON-HOT-003` | problems/assessments; nursing assessment | revise | hot for active assessments; warm for longitudinal threading | Include active assessments and bedside findings in v0.5 hot context, but defer full problem registry, sensitive access policy, and differential promotion rules. | `SRC-A0C-001`; `SRC-A8-001` | `BF-CURRENT-011`; `BF-VITALSTREND-020`; `BF-ACTIVE-022` | `CORPUS-P003-INF-003`; `CORPUS-P004-MED-004`; `CORPUS-P005-FRAIL-005` | source differential/sensitive-access questions; `REV-MISMATCH-008`; corpus operator-review caveats |
| `RECON-HOT-004` | vitals/trends; oxygen/device | revise | hot for latest safety facts; warm for larger windows; cold for baseline physiology | Preserve deterministic current vitals, oxygen/device context, invalid-sample suppression, and vital-evidence requirement; defer monitor UI, waveform, alarm policy, and storage/profile routing. | `SRC-A3-001`; `SRC-A5-001` | `BF-CURRENT-011`; `BF-TREND-012`; `BF-VITALSTREND-020`; `BF-TIME-007`; `BF-VALIDATE-004` | `CORPUS-P001-RESP-001`; `CORPUS-P002-LIVE-002`; `CORPUS-P003-INF-003`; `CORPUS-P004-MED-004` | `HOT-MISMATCH-003`; trajectory mismatches 1 and 2 |
| `RECON-LABS-005` | labs/diagnostics | revise | hot for critical current results; warm for serial review; cold for old diagnostics | Model result facts separately from review actions and artifact/report pointers, with explicit effective/recorded time and fulfillment/evidence links after later schema design. | `SRC-A1-001` | `BF-TREND-012`; `BF-ECHAIN-013`; `BF-OPENLOOPS-014`; `BF-VALIDATE-004` | `CORPUS-P002-LIVE-002`; `CORPUS-P003-INF-003`; `CORPUS-P004-MED-004` | trajectory mismatches 3 and 6 |
| `RECON-EVID-006` | evidence/provenance; transform refs | adopt | warm by default; hot when credibility affects immediate care; cold for old proof context | Carry forward compact, role-carrying, as-of evidence traversal and safe artifact refs as substrate semantics, not backend infrastructure. | `SRC-A1-001`; `SRC-A2-001`; `SRC-A3-001`; `SRC-GRAMMAR-001` | `BF-EVIDENCE-006`; `BF-ECHAIN-013`; `BF-VALIDATE-004` | `CORPUS-P001-RESP-001`; `CORPUS-P003-INF-003`; `CORPUS-P005-FRAIL-005` | trajectory mismatch 5; `REV-MISMATCH-007`; legacy ref-shape caveats |
| `RECON-REVIEW-007` | result review; accountability | revise | hot for unreviewed critical/contested current results; warm for review history | Keep explicit review actions and derived review state, but require HITL on routine closure, agent provisional review, and coverage thresholds before issue 13 promotion. | `SRC-A2-001` | `BF-REVIEW-018`; `BF-ATTEST-019`; `BF-ECHAIN-013`; `BF-VALIDATE-004` | `CORPUS-P001-RESP-001`; `CORPUS-P002-LIVE-002`; `CORPUS-GAP-DERIVED-006` | trajectory mismatch 4; `REV-MISMATCH-001`; `REV-MISMATCH-006`; `CORPUS-GAP-DERIVED-006` |
| `RECON-ORDER-008` | orders; open loops; handoff | adopt | hot for active safety loops; warm for shift review | Preserve lean obligation primitive and derived open-loop state while deferring full CPOE, task-management product, policy thresholds, and old `EventEnvelope` shape. | `SRC-A9A-001`; `SRC-A7-001`; `SRC-A2-001`; `SRC-GRAMMAR-001` | `BF-OPENLOOPS-014`; `BF-MEMPROOF-016`; `BF-VALIDATE-004` | `CORPUS-P001-RESP-001`; `CORPUS-P003-INF-003`; `CORPUS-P004-MED-004`; `CORPUS-P005-FRAIL-005` | orders mismatch 5 and 7; policy/default caveat |
| `RECON-MAR-009` | MAR; medication reconciliation | revise | hot for active holds/refusals/critical administrations; warm for rationale and current admission med-rec; cold for home-med history | Carry lean medication facts forward, but defer full pharmacy workflow, drug dictionary, barcode MAR, external medication-history retrieval, and unresolved dose/titration/current-state axes. | `SRC-A4-001`; `SRC-A4B-001` | `BF-OPENLOOPS-014`; `BF-CURRENT-011`; `BF-NARRATIVE-015`; `BF-VALIDATE-004` | `CORPUS-P001-RESP-001`; `CORPUS-P004-MED-004` | orders mismatches 1, 2, 3, 8, and 9 |
| `RECON-BEDSIDE-010` | I&O; LDA; device; nursing assessment | open-question | hot when current safety burden exists; warm for balance windows; cold for historical device context | Include only clinically consequential bedside/device facts in v0.5; ask HITL to settle I&O interval grammar, LDA addressability, balance-as-view, and A7/A8 boundaries. | `SRC-A5-001`; `SRC-A8-001`; `SRC-A3-001` | `BF-CURRENT-011`; `BF-TREND-012`; `BF-DERIVED-005` | `CORPUS-P001-RESP-001`; `CORPUS-P004-MED-004`; `CORPUS-P005-FRAIL-005` | `HOT-MISMATCH-003`; orders mismatch 4; A8 boundary questions |
| `RECON-NARR-011` | notes/narrative; handoff | adopt | hot for safety handoff items; warm for recent notes; cold for archives | Preserve narrative as addressable source-linked truth and deterministic handoff projection; avoid duplicate structured recharting unless facts are explicitly promoted. | `SRC-A6-001`; `SRC-A7-001` | `BF-NARRATIVE-015`; `BF-MEMPROOF-016`; `BF-OPENLOOPS-014`; `BF-BUNDLE-017` | `CORPUS-P001-RESP-001`; `CORPUS-P002-LIVE-002`; `CORPUS-P003-INF-003`; `CORPUS-P005-FRAIL-005` | `NARR-MISMATCH-001`; `NARR-MISMATCH-003`; `NARR-MISMATCH-004` |
| `RECON-COLD-012` | baseline history; prior encounters; cold context | revise | cold by default; warm when retrieved; hot only after explicit current-state promotion | Keep cold history source-linked and citable, but define later access policy before issue 13 treats retrieval as a substrate commitment. | `SRC-A0A-001`; `SRC-A0C-001`; `SRC-A4B-001`; `SRC-A6-001` | `BF-TIMELINE-010`; `BF-MEMPROOF-016`; `BF-BUNDLE-017` | `CORPUS-P002-LIVE-002`; `CORPUS-P004-MED-004`; `CORPUS-P005-FRAIL-005` | `NARR-MISMATCH-002`; HWC non-decision; cold retrieval boundary |
| `RECON-PROJ-013` | context access; projections | adopt | invariant across hot/warm/cold depending on fact | Carry chart-once/project-many as a v0.5 substrate discipline; make projections rebuildable and non-authoritative. | `SRC-CTRL-001`; `SRC-GRAMMAR-001`; PRD User Story 20 | `BF-ECHAIN-013`; `BF-NARRATIVE-015`; `BF-MEMPROOF-016`; `BF-BUNDLE-017` | `CORPUS-P004-MED-004`; `CORPUS-P005-FRAIL-005` | `HOT-MISMATCH-004`; `NARR-MISMATCH-005`; `RENDER-MISMATCH-001`; `CORPUS-GAP-DERIVED-006` |
| `RECON-AUTH-014` | review/accountability; provenance | adopt | hot for safety-sensitive agent material; warm for audit | Keep source kind and authorship explicit as substrate semantics, with later centralization of vocabulary and added corpus/test coverage. | `SRC-A6-001`; `SRC-A9B-001`; `SRC-GRAMMAR-001` | `BF-PROJECTION-021`; `BF-REVIEW-018` | `not-covered` | `REV-MISMATCH-001`; `REV-MISMATCH-003`; corpus `not-covered` |
| `RECON-ATTEST-015` | attestation; co-sign; scribe | revise | warm for accountability; hot only when current acceptance depends on it | Preserve lightweight attestation/co-sign/scribe concepts, but defer role registry, legal signature, pharmacy verification, and compliance machinery. | `SRC-A6-001`; `SRC-A7-001` | `BF-ATTEST-019`; `BF-REVIEW-018`; `BF-PROJECTION-021` | `CORPUS-P004-MED-004`; other variants `not-covered` | `REV-MISMATCH-002`; orders mismatch 2; legal-signature caveat |
| `RECON-LIFE-016` | lifecycle; active state | adopt | hot for current truth; warm for lifecycle history | Preserve a single as-of active-claim evaluator and lifecycle link grammar independent of storage representation. | `SRC-GRAMMAR-001`; `SRC-OPEN-001`; ADR 004 and ADR 009 cited by pack | `BF-ACTIVE-022`; `BF-VALIDATE-004`; `BF-CURRENT-011`; `BF-OPENLOOPS-014` | `CORPUS-P001-RESP-001` | `REV-MISMATCH-008`; corpus expansion caveat |
| `RECON-AGENT-017` | agent suggestions; generated transforms | revise | hot for current agent suggestions; warm for audit; cold for old generated background | Support agent suggestion provenance and human acceptance state, but do not authorize direct agent writes or generated summaries as canonical truth. | `SRC-A2-001`; `SRC-A6-001`; `SRC-A9B-001` | `BF-REVIEW-018`; `BF-PROJECTION-021`; `BF-WRITE-003`; `BF-ECHAIN-013` | `CORPUS-P002-LIVE-002`; `CORPUS-GAP-DERIVED-006` | `REV-MISMATCH-005`; `REV-MISMATCH-007`; `NARR-MISMATCH-004`; `RENDER-MISMATCH-002` |
| `RECON-RENDER-018` | rendered/prototype affordances | adopt | warm product/navigation evidence; hot only as pressure for clinical questions | Carry forward clinical questions and navigation affordances, not cockpit layout, generated UI, or public API shape. | PRD User Stories 44-46; rendered/prototype docs cited in pack | `BF-CURRENT-011`; `BF-TREND-012`; `BF-OPENLOOPS-014`; `BF-NARRATIVE-015`; `BF-ECHAIN-013`; `BF-MEMPROOF-016` | `CORPUS-P002-LIVE-002` | `RENDER-MISMATCH-001`; `RENDER-MISMATCH-002`; UI/API leakage caveat |
| `RECON-DEFER-019` | adapter/backend/access-plane | defer | warm/cold planning context; not hot substrate truth | Defer backend, vector, OpenBrain, storage, runtime, access-plane, adapter architecture, protocol/CDS engine, and order-set implementation; any ledger-related need is future chart/adapter work only. | `SRC-A9B-001`; PRD out-of-scope clauses | `BF-BUNDLE-017`; `BF-SESSION-009`; adapter fixture evidence only | `CORPUS-P002-LIVE-002`; otherwise `not-covered` | `RENDER-MISMATCH-003`; orders mismatch 6; HWC non-decision |
| `RECON-REJECT-020` | rendered/design assets | reject | cold/warm design evidence; never hot truth | Reject visual/style/generated artifacts as substrate authority; issue 13 may cite only clinical navigation questions derived from them. | rendered/design docs cited in pack | `BF-DERIVED-005`; `_derived` evidence only | `not-covered` | `RENDER-MISMATCH-004`; `NARR-MISMATCH-005`; `CORPUS-GAP-DERIVED-006` |
| `RECON-DEFER-021` | raw audit; legal signature; compliance; role registry | defer | cold planning context; warm for future audit expansion | Defer legal signature, compliance platform, raw access audit, role registry, and local session runtime ergonomics beyond lightweight authorship/review/attestation substrate. | PRD out-of-scope clauses; `SRC-A6-001`; `SRC-A7-001`; `SRC-OPEN-001` | `BF-ATTEST-019`; `BF-SESSION-009`; `BF-VALIDATE-004` | `not-covered` | `REV-MISMATCH-004`; `REV-MISMATCH-002`; legal/compliance boundary |

## Clinical-function recommendations

### 1. Orient: who is this patient, encounter, and as-of frame?

Recommendation: carry a deterministic identity/encounter/current-packet layer as hot scoping truth. It should tell the chart and agent what patient, encounter, clinical-time window, and chart-as-of frame every question is about. It should not preserve brownfield `contextBundle` names or storage shape as authority.

Primitive/link/time/lifecycle vocabulary: patient/encounter identifiers, source refs, as-of chart time, valid/effective time, recorded time, current-packet projection, and evidence links.

Hot/warm/cold behavior: identity/encounter/current packet is hot for every read; source refs and timeline expansion are warm.

| Row | State | Source citation | Code/test citation | Corpus citation | Caveat |
| --- | --- | --- | --- | --- | --- |
| `RECON-HOT-001` | revise | `SRC-A0A-001`; PRD context packet stories | `BF-READ-002`; `BF-CURRENT-011`; `BF-MEMPROOF-016` | `CORPUS-P002-LIVE-002` | `HOT-MISMATCH-001`; `HOT-MISMATCH-004`; cite actual crosswalk row `BF-READ-002` for read behavior |

### 2. Prevent harm: what must be visible before care?

Recommendation: constraints should be hot, evidenced, and deterministic: allergies, code status, precautions, isolation, fall/delirium risk, action-gating safety facts, and current safety constraints. Constraint facts should be canonical; active badges/checklists are derived projections.

Primitive/link/time/lifecycle vocabulary: constraint observation/action, source kind, review/verification refs, active-state lifecycle, valid/recorded time, and contradiction/supersession links.

Hot/warm/cold behavior: active constraints are hot; verification/read-receipt history is warm; retired constraints are cold unless promoted by current relevance.

| Row | State | Source citation | Code/test citation | Corpus citation | Caveat |
| --- | --- | --- | --- | --- | --- |
| `RECON-HOT-002` | revise | `SRC-A0B-001` | `BF-CURRENT-011`; `BF-ACTIVE-022` | `CORPUS-P001-RESP-001`; `CORPUS-P005-FRAIL-005` | `HOT-MISMATCH-002`; `REV-MISMATCH-006` |

### 3. Explain the working model: what do clinicians think is happening?

Recommendation: active problems, assessments, bedside findings, uncertainty, contested claims, and current nursing/provider concerns belong in v0.5 hot context when they affect immediate care. Do not build a full problem-registry product yet; preserve active/contested assessment semantics and evidence links.

Primitive/link/time/lifecycle vocabulary: assessment, observation, communication, evidence refs, status/lifecycle links, active-as-of evaluation, and support/counterevidence roles.

Hot/warm/cold behavior: current assessments and contested claims are hot; longitudinal problem threads are warm/cold depending on relevance.

| Row | State | Source citation | Code/test citation | Corpus citation | Caveat |
| --- | --- | --- | --- | --- | --- |
| `RECON-HOT-003` | revise | `SRC-A0C-001`; `SRC-A8-001` | `BF-CURRENT-011`; `BF-VITALSTREND-020`; `BF-ACTIVE-022` | `CORPUS-P003-INF-003`; `CORPUS-P004-MED-004`; `CORPUS-P005-FRAIL-005` | source differential/sensitive-access questions; `REV-MISMATCH-008`; corpus operator-review caveats |

### 4. Read trajectory: what changed physiologically and why does it matter now?

Recommendation: deterministic current vitals, short trends, oxygen/device context, invalid-sample suppression, and chart-visible attention signals should be carried forward. The substrate should not import monitor UI, waveform storage, hidden simulator signals, or final alarm policy.

Primitive/link/time/lifecycle vocabulary: observation, valid/effective time, recorded time, interval/window, device/source context, artifact refs, evidence refs, and derived trend projection.

Hot/warm/cold behavior: latest valid/current safety physiology is hot; larger trend windows and source evidence are warm; baseline physiology is cold unless promoted.

| Row | State | Source citation | Code/test citation | Corpus citation | Caveat |
| --- | --- | --- | --- | --- | --- |
| `RECON-HOT-004` | revise | `SRC-A3-001`; `SRC-A5-001` | `BF-CURRENT-011`; `BF-TREND-012`; `BF-VITALSTREND-020`; `BF-TIME-007`; `BF-VALIDATE-004` | `CORPUS-P001-RESP-001`; `CORPUS-P002-LIVE-002`; `CORPUS-P003-INF-003`; `CORPUS-P004-MED-004` | `HOT-MISMATCH-003`; trajectory mismatches 1 and 2 |

### 5. Interpret results: which labs, diagnostics, artifacts, and reviews change care?

Recommendation: result facts, diagnostic claims, report/artifact pointers, and review actions must remain separate. A lab/result observation can be canonical; review state and unresolved/pending/critical projections are derived. The model should keep explicit effective/recorded time and evidence/fulfillment links, but final result-status and implicit-review policy remain HITL.

Primitive/link/time/lifecycle vocabulary: observation, artifact ref, review action, evidence refs, fulfillment/open-loop link, valid/effective time, recorded time, accepted/rejected/verified/contested/superseded state.

Hot/warm/cold behavior: current critical/unreviewed results are hot; serial labs, reports, and review history are warm; old diagnostics are cold.

| Row | State | Source citation | Code/test citation | Corpus citation | Caveat |
| --- | --- | --- | --- | --- | --- |
| `RECON-LABS-005` | revise | `SRC-A1-001` | `BF-TREND-012`; `BF-ECHAIN-013`; `BF-OPENLOOPS-014`; `BF-VALIDATE-004` | `CORPUS-P002-LIVE-002`; `CORPUS-P003-INF-003`; `CORPUS-P004-MED-004` | trajectory mismatches 3 and 6 |
| `RECON-EVID-006` | adopt | `SRC-A1-001`; `SRC-A2-001`; `SRC-A3-001`; `SRC-GRAMMAR-001` | `BF-EVIDENCE-006`; `BF-ECHAIN-013`; `BF-VALIDATE-004` | `CORPUS-P001-RESP-001`; `CORPUS-P003-INF-003`; `CORPUS-P005-FRAIL-005` | trajectory mismatch 5; `REV-MISMATCH-007`; legacy ref-shape caveats |
| `RECON-REVIEW-007` | revise | `SRC-A2-001` | `BF-REVIEW-018`; `BF-ATTEST-019`; `BF-ECHAIN-013`; `BF-VALIDATE-004` | `CORPUS-P001-RESP-001`; `CORPUS-P002-LIVE-002`; `CORPUS-GAP-DERIVED-006` | trajectory mismatch 4; `REV-MISMATCH-001`; `REV-MISMATCH-006`; `CORPUS-GAP-DERIVED-006` |

### 6. Track obligations: what is ordered, pending, in progress, overdue, failed, fulfilled, or closed?

Recommendation: v0.5 should preserve a lean obligation/open-loop model over intents and actions. This is not full CPOE or task-management product scope. It is the minimal substrate needed to understand what was planned, what happened, what failed, what is still open, and what must carry into handoff or workflow prioritization.

Primitive/link/time/lifecycle vocabulary: intent, action, fulfillment link, due window, performed/omitted/failed/refused/held state, evidence refs, lifecycle links, and derived open-loop state.

Hot/warm/cold behavior: active and overdue safety loops are hot; shift-review history is warm; old closed loops are cold except as evidence.

| Row | State | Source citation | Code/test citation | Corpus citation | Caveat |
| --- | --- | --- | --- | --- | --- |
| `RECON-ORDER-008` | adopt | `SRC-A9A-001`; `SRC-A7-001`; `SRC-A2-001`; `SRC-GRAMMAR-001` | `BF-OPENLOOPS-014`; `BF-MEMPROOF-016`; `BF-VALIDATE-004` | `CORPUS-P001-RESP-001`; `CORPUS-P003-INF-003`; `CORPUS-P004-MED-004`; `CORPUS-P005-FRAIL-005` | orders mismatch 5 and 7; policy/default caveat |

### 7. Understand medications: what medication context matters for current care?

Recommendation: carry lean medication facts: medication intent/order, administration, hold, refusal, omission, titration, restart criterion, reconciliation decision, home-med context, and medication-risk rationale. Defer full pharmacy workflow, drug dictionary, barcode MAR, external medication-history retrieval, and unresolved dose/titration/current-state axes.

Primitive/link/time/lifecycle vocabulary: medication intent, action, reconciliation communication, home-med history, dose occurrence, valid/recorded time, due window, fulfillment/omission/refusal/hold/restart links, and review/attestation refs.

Hot/warm/cold behavior: active holds/refusals/critical administrations and imminent due meds are hot; rationale/current-admission med-rec is warm; home-med/prior history is cold unless promoted.

| Row | State | Source citation | Code/test citation | Corpus citation | Caveat |
| --- | --- | --- | --- | --- | --- |
| `RECON-MAR-009` | revise | `SRC-A4-001`; `SRC-A4B-001` | `BF-OPENLOOPS-014`; `BF-CURRENT-011`; `BF-NARRATIVE-015`; `BF-VALIDATE-004` | `CORPUS-P001-RESP-001`; `CORPUS-P004-MED-004` | orders mismatches 1, 2, 3, 8, and 9 |

### 8. Capture bedside burden: which I&O, LDA, device, oxygen, and nursing context changes interpretation?

Recommendation: include only clinically consequential bedside/device facts in v0.5. Oxygen/device context, lines/drains, Foley/I&O burden, unsafe volume signals, turns/skin risk, dressing context, and similar bedside obligations may pressure hot or workflow projections, but the exact I&O interval grammar and LDA addressability remain open questions.

Primitive/link/time/lifecycle vocabulary: observation, interval, device/line/drain context, nursing assessment, action, source/provenance ref, derived balance/current context, and lifecycle links.

Hot/warm/cold behavior: current safety burden is hot; balance windows and serial bedside context are warm; old device history is cold.

| Row | State | Source citation | Code/test citation | Corpus citation | Caveat |
| --- | --- | --- | --- | --- | --- |
| `RECON-BEDSIDE-010` | open-question | `SRC-A5-001`; `SRC-A8-001`; `SRC-A3-001` | `BF-CURRENT-011`; `BF-TREND-012`; `BF-DERIVED-005` | `CORPUS-P001-RESP-001`; `CORPUS-P004-MED-004`; `CORPUS-P005-FRAIL-005` | `HOT-MISMATCH-003`; orders mismatch 4; A8 boundary questions |

### 9. Preserve narrative and handoff: what did humans say, reason, communicate, and carry forward?

Recommendation: notes, communications, handoff, watch items, and narrative evidence should remain source-linked chart memory. Do not duplicate structured recharting unless a fact is explicitly promoted into a canonical sibling claim. Handoff should be a deterministic projection over current facts, recent narrative, evidence refs, unresolved loops, uncertainty, and next-watch items.

Primitive/link/time/lifecycle vocabulary: note, communication, source/author, note ref, section/quote/statement pressure, evidence refs, lifecycle links, handoff projection, and review/attestation refs.

Hot/warm/cold behavior: safety handoff/watch items are hot; recent notes/communications are warm; H&P, prior encounters, discharge summaries, old consults, and narrative archives are cold until promoted.

| Row | State | Source citation | Code/test citation | Corpus citation | Caveat |
| --- | --- | --- | --- | --- | --- |
| `RECON-NARR-011` | adopt | `SRC-A6-001`; `SRC-A7-001` | `BF-NARRATIVE-015`; `BF-MEMPROOF-016`; `BF-OPENLOOPS-014`; `BF-BUNDLE-017` | `CORPUS-P001-RESP-001`; `CORPUS-P002-LIVE-002`; `CORPUS-P003-INF-003`; `CORPUS-P005-FRAIL-005` | `NARR-MISMATCH-001`; `NARR-MISMATCH-003`; `NARR-MISMATCH-004` |
| `RECON-COLD-012` | revise | `SRC-A0A-001`; `SRC-A0C-001`; `SRC-A4B-001`; `SRC-A6-001` | `BF-TIMELINE-010`; `BF-MEMPROOF-016`; `BF-BUNDLE-017` | `CORPUS-P002-LIVE-002`; `CORPUS-P004-MED-004`; `CORPUS-P005-FRAIL-005` | `NARR-MISMATCH-002`; HWC non-decision; cold retrieval boundary |

### 10. Project once: how does one chart fact become many useful views?

Recommendation: adopt chart-once/project-many as a v0.5 discipline. Canonical facts should project into current state, trend, evidence chain, narrative, open loops, review state, care plan, human workflow prioritization, handoff, and memory proof without creating competing sources of truth. Brownfield DTO names, generated `_derived` outputs, and view names remain evidence only.

Primitive/link/time/lifecycle vocabulary: canonical fact id, evidence refs, lifecycle links, transform/projection refs, as-of time, derived-view metadata, and rendered navigation labels.

Hot/warm/cold behavior: projection tier follows the underlying fact and question: hot current packet, warm review expansion, cold longitudinal background.

| Row | State | Source citation | Code/test citation | Corpus citation | Caveat |
| --- | --- | --- | --- | --- | --- |
| `RECON-PROJ-013` | adopt | `SRC-CTRL-001`; `SRC-GRAMMAR-001`; PRD User Story 20 | `BF-ECHAIN-013`; `BF-NARRATIVE-015`; `BF-MEMPROOF-016`; `BF-BUNDLE-017` | `CORPUS-P004-MED-004`; `CORPUS-P005-FRAIL-005` | `HOT-MISMATCH-004`; `NARR-MISMATCH-005`; `RENDER-MISMATCH-001`; `CORPUS-GAP-DERIVED-006` |

### 11. Prioritize human work: what needs my attention now, next, later, or at handoff?

Recommendation: make a clinician workflow / **shift brain** projection first-class in v0.5 as a derived prioritization surface. It should help a human prioritize meds due, assessment cadence, medication drip/gtt/bag changes, turns, blood sugar checks, baths, Foley/I&O work, dressing changes, travel-to-scan/off-unit tasks, and similar human-only care obligations.

This projection must gather the right context at the right time: the task, why it matters, when it is due or overdue, what evidence or order created it, what recent physiology/constraints change priority, what dependencies exist, and what needs to be carried into handoff. It should outperform a flat Epic Brain-style task list by pairing obligations with clinical meaning and evidence.

Workflow/task-list/brain surfaces are **derived prioritization views only**. They are **not canonical chart truth**, **not autonomous agent action authority**, and **not completion authority**. Completion, review, refusal, hold, performed, failed, or omitted state still depends on source chart facts/actions authored through sanctioned chart workflows.

Primitive/link/time/lifecycle vocabulary: intent, action, observation, assessment, communication, due window, recurrence/cadence as projection metadata, evidence refs, constraint refs, dependency links, fulfillment/refusal/hold/omission/failure links, active-as-of lifecycle, and handoff/watch-item projection.

Hot/warm/cold behavior: due/overdue/risky obligations are hot; rationale and recent evidence are warm; historical closed work is cold.

| Row | State | Source citation | Code/test citation | Corpus citation | Caveat |
| --- | --- | --- | --- | --- | --- |
| `RECON-ORDER-008` | adopt | `SRC-A9A-001`; `SRC-A7-001`; `SRC-A2-001`; `SRC-GRAMMAR-001` | `BF-OPENLOOPS-014`; `BF-MEMPROOF-016`; `BF-VALIDATE-004` | `CORPUS-P001-RESP-001`; `CORPUS-P003-INF-003`; `CORPUS-P004-MED-004`; `CORPUS-P005-FRAIL-005` | orders mismatch 5 and 7; policy/default caveat |
| `RECON-MAR-009` | revise | `SRC-A4-001`; `SRC-A4B-001` | `BF-OPENLOOPS-014`; `BF-CURRENT-011`; `BF-NARRATIVE-015`; `BF-VALIDATE-004` | `CORPUS-P001-RESP-001`; `CORPUS-P004-MED-004` | orders mismatches 1, 2, 3, 8, and 9 |
| `RECON-BEDSIDE-010` | open-question | `SRC-A5-001`; `SRC-A8-001`; `SRC-A3-001` | `BF-CURRENT-011`; `BF-TREND-012`; `BF-DERIVED-005` | `CORPUS-P001-RESP-001`; `CORPUS-P004-MED-004`; `CORPUS-P005-FRAIL-005` | `HOT-MISMATCH-003`; orders mismatch 4; A8 boundary questions |
| `RECON-NARR-011` | adopt | `SRC-A6-001`; `SRC-A7-001` | `BF-NARRATIVE-015`; `BF-MEMPROOF-016`; `BF-OPENLOOPS-014`; `BF-BUNDLE-017` | `CORPUS-P001-RESP-001`; `CORPUS-P002-LIVE-002`; `CORPUS-P003-INF-003`; `CORPUS-P005-FRAIL-005` | `NARR-MISMATCH-001`; `NARR-MISMATCH-003`; `NARR-MISMATCH-004` |
| `RECON-PROJ-013` | adopt | `SRC-CTRL-001`; `SRC-GRAMMAR-001`; PRD User Story 20 | `BF-ECHAIN-013`; `BF-NARRATIVE-015`; `BF-MEMPROOF-016`; `BF-BUNDLE-017` | `CORPUS-P004-MED-004`; `CORPUS-P005-FRAIL-005` | `HOT-MISMATCH-004`; `NARR-MISMATCH-005`; `RENDER-MISMATCH-001`; `CORPUS-GAP-DERIVED-006` |
| `RECON-HOT-002` | revise | `SRC-A0B-001` | `BF-CURRENT-011`; `BF-ACTIVE-022` | `CORPUS-P001-RESP-001`; `CORPUS-P005-FRAIL-005` | `HOT-MISMATCH-002`; `REV-MISMATCH-006` |
| `RECON-REVIEW-007` | revise | `SRC-A2-001` | `BF-REVIEW-018`; `BF-ATTEST-019`; `BF-ECHAIN-013`; `BF-VALIDATE-004` | `CORPUS-P001-RESP-001`; `CORPUS-P002-LIVE-002`; `CORPUS-GAP-DERIVED-006` | trajectory mismatch 4; `REV-MISMATCH-001`; `REV-MISMATCH-006`; `CORPUS-GAP-DERIVED-006` |
| `RECON-LIFE-016` | adopt | `SRC-GRAMMAR-001`; `SRC-OPEN-001`; ADR 004 and ADR 009 cited by pack | `BF-ACTIVE-022`; `BF-VALIDATE-004`; `BF-CURRENT-011`; `BF-OPENLOOPS-014` | `CORPUS-P001-RESP-001` | `REV-MISMATCH-008`; corpus expansion caveat |

### 12. Maintain accountability: who authored, reviewed, attested, corrected, or superseded chart material?

Recommendation: keep source kind, authorship, review, lightweight attestation/co-sign/scribe/witness semantics, and lifecycle links as substrate concepts. Defer legal-signature, compliance platform, raw access audit, role registry, and pharmacy-verification machinery. Active-state evaluation should be a single as-of evaluator over lifecycle links, not a storage-specific behavior.

Primitive/link/time/lifecycle vocabulary: source kind, author, reviewer, attester, co-signer, scribe/witness, review action, accepted/verified/rejected/contested/superseded/corrected/entered-in-error state, and active-as-of lifecycle.

Hot/warm/cold behavior: current safety-sensitive agent material and active truth state are hot; attestation/review history is warm; compliance/audit planning context is cold/deferred.

| Row | State | Source citation | Code/test citation | Corpus citation | Caveat |
| --- | --- | --- | --- | --- | --- |
| `RECON-AUTH-014` | adopt | `SRC-A6-001`; `SRC-A9B-001`; `SRC-GRAMMAR-001` | `BF-PROJECTION-021`; `BF-REVIEW-018` | `not-covered` | `REV-MISMATCH-001`; `REV-MISMATCH-003`; corpus `not-covered` |
| `RECON-ATTEST-015` | revise | `SRC-A6-001`; `SRC-A7-001` | `BF-ATTEST-019`; `BF-REVIEW-018`; `BF-PROJECTION-021` | `CORPUS-P004-MED-004`; other variants `not-covered` | `REV-MISMATCH-002`; orders mismatch 2; legal-signature caveat |
| `RECON-LIFE-016` | adopt | `SRC-GRAMMAR-001`; `SRC-OPEN-001`; ADR 004 and ADR 009 cited by pack | `BF-ACTIVE-022`; `BF-VALIDATE-004`; `BF-CURRENT-011`; `BF-OPENLOOPS-014` | `CORPUS-P001-RESP-001` | `REV-MISMATCH-008`; corpus expansion caveat |
| `RECON-DEFER-021` | defer | PRD out-of-scope clauses; `SRC-A6-001`; `SRC-A7-001`; `SRC-OPEN-001` | `BF-ATTEST-019`; `BF-SESSION-009`; `BF-VALIDATE-004` | `not-covered` | `REV-MISMATCH-004`; `REV-MISMATCH-002`; legal/compliance boundary |

### 13. Bound agent output: how can the agent help without becoming silent chart truth?

Recommendation: support agent suggestion provenance, generated-transform refs, extracted material refs, and human review/acceptance state. Agent-authored suggestions may inform context and workflow prioritization, but direct accepted writes and generated summaries as canonical truth remain out of scope.

Primitive/link/time/lifecycle vocabulary: source kind, agent author, transform ref, generated suggestion, evidence refs, human review action, accepted/rejected/provisional state, and lifecycle links.

Hot/warm/cold behavior: current agent suggestions that could affect care are hot only with explicit provisional/accepted status; audit/provenance expansion is warm; old generated background is cold unless reviewed.

| Row | State | Source citation | Code/test citation | Corpus citation | Caveat |
| --- | --- | --- | --- | --- | --- |
| `RECON-AGENT-017` | revise | `SRC-A2-001`; `SRC-A6-001`; `SRC-A9B-001` | `BF-REVIEW-018`; `BF-PROJECTION-021`; `BF-WRITE-003`; `BF-ECHAIN-013` | `CORPUS-P002-LIVE-002`; `CORPUS-GAP-DERIVED-006` | `REV-MISMATCH-005`; `REV-MISMATCH-007`; `NARR-MISMATCH-004`; `RENDER-MISMATCH-002` |

### 14. Use rendered/prototype evidence only as chart-digging question pressure

Recommendation: preserve rendered/prototype lessons as product/navigation evidence: cockpit orientation, current-state display, evidence drill-down, open-loop navigation, narrative review, and agent-canvas affordances. Reject raw design assets, generated HTML, screenshots, UI kits, visual style, `_derived` output, tabs, layout, component names, and public API shape as substrate authority.

Primitive/link/time/lifecycle vocabulary: rendered navigation labels may name projections, but cannot define canonical facts, storage, or API.

Hot/warm/cold behavior: rendered affordances are warm product evidence only; never hot truth.

| Row | State | Source citation | Code/test citation | Corpus citation | Caveat |
| --- | --- | --- | --- | --- | --- |
| `RECON-RENDER-018` | adopt | PRD User Stories 44-46; rendered/prototype docs cited in pack | `BF-CURRENT-011`; `BF-TREND-012`; `BF-OPENLOOPS-014`; `BF-NARRATIVE-015`; `BF-ECHAIN-013`; `BF-MEMPROOF-016` | `CORPUS-P002-LIVE-002` | `RENDER-MISMATCH-001`; `RENDER-MISMATCH-002`; UI/API leakage caveat |
| `RECON-REJECT-020` | reject | rendered/design docs cited in pack | `BF-DERIVED-005`; `_derived` evidence only | `not-covered` | `RENDER-MISMATCH-004`; `NARR-MISMATCH-005`; `CORPUS-GAP-DERIVED-006` |

### 15. Keep architectural seams deferred

Recommendation: preserve future seams as constraints, not decisions. Backend, vector, OpenBrain, storage, runtime, access-plane, adapter architecture, protocol/CDS engines, full CPOE, order-set implementation, legal/compliance/raw audit, role registry, and local session runtime ergonomics remain deferred or rejected for lean v0.5.

Primitive/link/time/lifecycle vocabulary: none added. These are planning constraints over future workstreams.

Hot/warm/cold behavior: architectural seams are not hot substrate truth.

| Row | State | Source citation | Code/test citation | Corpus citation | Caveat |
| --- | --- | --- | --- | --- | --- |
| `RECON-DEFER-019` | defer | `SRC-A9B-001`; PRD out-of-scope clauses | `BF-BUNDLE-017`; `BF-SESSION-009`; adapter fixture evidence only | `CORPUS-P002-LIVE-002`; otherwise `not-covered` | `RENDER-MISMATCH-003`; orders mismatch 6; HWC non-decision |
| `RECON-DEFER-021` | defer | PRD out-of-scope clauses; `SRC-A6-001`; `SRC-A7-001`; `SRC-OPEN-001` | `BF-ATTEST-019`; `BF-SESSION-009`; `BF-VALIDATE-004` | `not-covered` | `REV-MISMATCH-004`; `REV-MISMATCH-002`; legal/compliance boundary |

## Compact primitive grammar

v0.5 should preserve a compact chart grammar rather than importing EHR modules as primitives:

| Primitive family | Lean meaning | Pressure to expand | Recommendation |
| --- | --- | --- | --- |
| Observation | Time-bound clinical measurement or finding: vitals, labs, bedside observations, diagnostics, I&O/device facts when reconciled. | Oxygen/device context, sample identity, I&O/LDA intervals, and result status need care. | Adopt observation; revise axes later where issue 12 marks open. |
| Assessment | Human or reviewed working interpretation: problem, nursing assessment, uncertainty, contested claim. | Differential/sensitive-access/problem-registry scope is unresolved. | Revise into active/contested/evidenced assessments, not a full registry. |
| Intent | Ordered/planned work or obligation. | Full CPOE/protocol/order-set policy is too broad. | Adopt lean intent/obligation semantics; defer full CPOE. |
| Action | Performed, held, refused, omitted, failed, reviewed, attested, administered, transported, turned, assessed, or communicated act. | Medication dose occurrence, waste/readback/titration and workflow completion semantics need later specifics. | Adopt action as a core primitive; revise med/task axes later. |
| Communication | Provider/RN/family/team communication or handoff note content. | Note subtype and section/quote addressability remain open. | Adopt source-linked communication/note truth with later addressability. |
| Artifact ref | Source-linked external/report/image/document reference. | Artifact/result separation and old diagnostics require careful review. | Adopt safe artifact refs; do not pick backend/storage. |
| Note | Narrative source truth. | Section/statement/quote addressability and generated summaries need policy. | Adopt notes as source truth; project structured sibling facts explicitly. |
| Evidence/provenance ref | Role-carrying link explaining why a claim exists. | Recursive evidence could be mistaken for graph/vector infrastructure. | Adopt compact bounded evidence traversal as substrate semantics only. |
| Lifecycle link | Corrects, supersedes, contradicts, resolves, contests, fulfills, closes, or enters in error. | Structural storage and active evaluator implementation are later work. | Adopt as-of active-state discipline. |
| Derived projection | Current packet, trend, evidence chain, open loops, review state, workflow/shift brain, narrative, care plan, handoff. | Projection names can leak UI/API/storage authority. | Adopt chart-once/project-many; projections are rebuildable and non-authoritative. |

Time vocabulary should stay small: clinical valid/effective time, recorded time, as-of chart time, interval/window, due window, and review/attestation time. Any future pi-ledger accepted time or sequence mapping belongs to adapter work, not issue 13 substrate expansion.

Lifecycle vocabulary should stay small but expressive: active, corrected, superseded, entered-in-error, contested, contradicted, resolved, fulfilled, failed, held, refused, omitted, accepted, verified, rejected, and provisional. Exact enum names remain future design work.

## Hot/warm/cold context summary

| Tier | Purpose | Examples | Forbidden dependency |
| --- | --- | --- | --- |
| Hot deterministic current context | What must be known now to keep care safe and prioritize attention. | identity/encounter/as-of packet, active constraints, active assessments, current vitals/oxygen/device, critical/unreviewed results, active orders/MAR/open loops, workflow/shift-brain obligations, current handoff/watch items, active review/lifecycle state. | Semantic search, generated summary, rendered UI, hidden `pi-sim`, future `_derived`, vector/OpenBrain/backend choice. |
| Warm chart-review context | What clinicians dig into to explain, verify, trend, or account for hot facts. | recent notes, serial labs/vitals, evidence chains, review history, medication rationale, order history, artifact/report expansion, attestation history, rendered navigation evidence. | Treating navigation or retrieval as canonical truth. |
| Cold longitudinal/background context | What may matter when relevant but should not bloat current state. | H&P, prior encounters, discharge summaries, old consults, old imaging narratives, chronic history, home-med background, long-term support routines. | Treating semantic eligibility as vector/OpenBrain/storage/runtime commitment or second truth. |

Cold/semantic eligibility means only that future systems should be able to find and cite source-linked background when clinically requested. It does not authorize vector storage, embeddings, OpenBrain architecture, backend services, graph indexes, storage layout, or runtime access-plane design.

## Chart-once/project-many projection model

A v0.5 chart fact should be charted once as canonical truth and projected many ways:

```text
canonical chart fact/action/note/ref
  + source, time, author, provenance, evidence, lifecycle
  -> current packet
  -> trend window
  -> evidence chain
  -> result-review state
  -> open-loop state
  -> care plan / watch items
  -> human workflow / shift brain
  -> narrative and handoff
  -> rendered navigation
```

Projection rules:

- Projections are rebuildable views, not chart truth.
- Projections must cite the canonical facts/actions/notes/refs they derive from.
- Current-state and workflow projections must be deterministic for hot care.
- Narrative and handoff projections must not duplicate canonical facts unless facts are explicitly promoted.
- Rendered views may guide navigation and clinical questions, but cannot define primitives.
- Agent-facing context packets may assemble right-context/right-time material, but acceptance into chart truth remains human/workflow governed.

## pi-chart <-> pi-ledger adapter implications

This recommendation creates **future chart/adapter implications only**. It does not add `pi-ledger` kernel requirements.

Future adapter work should expect to map chart facts/actions/notes/refs into ledger-compatible identity and integrity surfaces already owned by `pi-ledger`: stable ids, canonical hashes, append order, integrity checks, minimal bitemporal reads, and lifecycle/evidence relationships. The chart side should preserve source/time/provenance/evidence/lifecycle fields clearly enough that an adapter can later prove what was charted and what a projection derived from.

Adapter implications:

- Keep canonical facts separate from derived projections so ledger-backed truth and disposable views do not blur.
- Keep evidence/lifecycle links explicit so current state, workflow, and handoff can be replayed/audited.
- Keep hot/warm/cold as chart access behavior, not a ledger storage primitive.
- Keep workflow/shift-brain items as derived projections over chart facts/actions, not ledger-native task authority.
- Do not import brownfield `EventEnvelope`, file buckets, DTO names, UI view names, patient fixture shapes, or rendered assets as kernel or adapter authority.
- Do not request new `pi-ledger` kernel APIs from this issue; if a future adapter discovers a gap, it should become a separate adapter/ADR decision.

## Maintainer review

### Recommended v0.5 decisions

- Adopt compact evidence/provenance traversal (`RECON-EVID-006`).
- Adopt lean order/open-loop obligation semantics (`RECON-ORDER-008`).
- Adopt source-linked notes/narrative/handoff truth (`RECON-NARR-011`).
- Adopt chart-once/project-many projection discipline (`RECON-PROJ-013`).
- Adopt explicit authorship/source-kind semantics (`RECON-AUTH-014`).
- Adopt lifecycle/as-of active-state behavior (`RECON-LIFE-016`).
- Adopt rendered/prototype affordances as navigation evidence only (`RECON-RENDER-018`).
- Treat clinician workflow/shift brain as a first-class derived projection over orders, MAR, assessments, bedside/device context, open loops, constraints, lifecycle, and handoff/watch items.

### Recommended revise decisions

- Revise identity/current packet naming and storage shape (`RECON-HOT-001`).
- Revise constraint verification/read-receipt semantics (`RECON-HOT-002`).
- Revise active problem/assessment boundaries (`RECON-HOT-003`).
- Revise vitals/oxygen/device/alarm/storage boundaries (`RECON-HOT-004`).
- Revise labs/diagnostics/result-review shape (`RECON-LABS-005`, `RECON-REVIEW-007`).
- Revise MAR/med-rec current-state axes (`RECON-MAR-009`).
- Revise cold-history access and promotion language (`RECON-COLD-012`).
- Revise lightweight attestation/co-sign/scribe vocabulary (`RECON-ATTEST-015`).
- Revise agent-suggestion/generated-transform acceptance semantics (`RECON-AGENT-017`).

### Open HITL questions

1. Constraint review semantics: does lean v0.5 need explicit read receipt or verification facts for active constraints, or only source/review evidence links?
2. Oxygen, alarm, and device boundary: what is the minimum chart-visible primitive for oxygen/device/alarm context without importing monitor UI or hidden simulator signals?
3. I&O/LDA grammar: should issue 13 include a minimal I&O/LDA/device interval primitive now, or mark it as a later narrow PRD because axes/addressability remain unresolved?
4. Medication current-state axes: which medication facts are hot current-care truth versus warm/cold med-rec history, especially for holds, refusals, restart criteria, and discharge closure?
5. Result review closure: should routine result review support implicit closure, or should v0.5 carry only explicit review/action facts until policy is decided?
6. Note addressability: does issue 13 need section/statement/quote addressability for notes, or can v0.5 start with note refs plus structured sibling facts?
7. Agent suggestion handling: what exact human review/acceptance states are required for agent-authored or generated material before it can influence current-care projections?
8. Cold-history access: what language should issue 13 use for future semantic eligibility so cold history remains citable without selecting vector, OpenBrain, backend, or storage technology?

### Deferred decisions

- Backend, vector, OpenBrain, graph index, embedding, service, storage, runtime, and access-plane architecture (`RECON-DEFER-019`).
- Adapter implementation details and protocol/CDS/order-set engines (`RECON-DEFER-019`).
- Full CPOE, pharmacy verification, barcode MAR, drug dictionary, full flowsheets, device inventory, billing/ADT/scheduling, and full task-management product scope (`RECON-DEFER-019`).
- Legal signature, compliance platform, raw access audit, role registry, and local-session runtime ergonomics beyond lightweight accountability semantics (`RECON-DEFER-021`).

### Rejected authority sources

- Raw design zips, screenshots, generated HTML, UI kits, visual style, tab/layout/component names, and public API shape as substrate authority (`RECON-REJECT-020`).
- Generated `_derived` outputs as truth (`RECON-REJECT-020`).
- Brownfield `EventEnvelope`, filesystem day buckets, old DTO/view names, and compatibility refs as v0.5 substrate authority.
- Patient corpus fixture shapes as schema or migration authority.
- Hidden `pi-sim` internals or oracle state as chart context.

## Mismatch preservation summary

| Mismatch | Affected rows | Carry-forward rule |
| --- | --- | --- |
| `MISMATCH-HOT-001` | `RECON-HOT-001` | Patient/encounter structural files, current-state helpers, and append-only authority must be reconciled without copying brownfield storage shape. |
| `MISMATCH-HOT-002` | `RECON-HOT-002` | Constraint read receipt, verification, human review, and active-state semantics need later HITL or issue-13 caveat handling. |
| `MISMATCH-VITAL-003` | `RECON-HOT-004`; `RECON-BEDSIDE-010` | Oxygen/device context, alarm/artifact events, sample identity, and dual-source vitals are useful but not final storage or monitor UI authority. |
| `MISMATCH-LAB-004` | `RECON-LABS-005`; `RECON-REVIEW-007` | Result status, effective time, fulfillment links, review thresholds, implicit closure, and artifact/report separation need issue-13 caution. |
| `MISMATCH-EVID-005` | `RECON-EVID-006`; `RECON-AGENT-017` | Evidence recursion and transform provenance are substrate semantics, not graph/vector/backend commitments. |
| `MISMATCH-ORDER-006` | `RECON-ORDER-008`; `RECON-MAR-009`; `RECON-DEFER-019` | Order kind, readback, discontinuation, occurrence identity, dose occurrence, titration, waste/attestation, and protocol invocation remain unresolved or deferred. |
| `MISMATCH-MEDREC-007` | `RECON-MAR-009`; `RECON-COLD-012` | Medication reconciliation axes, external source kinds, discharge closure, and patient 004 fixture authority need later decisions. |
| `MISMATCH-BEDSIDE-008` | `RECON-BEDSIDE-010` | I&O interval grammar, LDA axes/addressability, balance-as-view, and bedside/narrative boundaries remain open. |
| `MISMATCH-NARR-009` | `RECON-NARR-011`; `RECON-PROJ-013` | Note subtype, section/quote addressability, handoff evidence shape, provider-notification closure, and rendered DTO leakage must remain visible. |
| `MISMATCH-COLD-010` | `RECON-COLD-012`; `RECON-DEFER-019` | Cold-history summarization, retrieval boundaries, semantic eligibility, and current-state promotion rules are future access requirements only. |
| `MISMATCH-AUTH-011` | `RECON-AUTH-014` | Review-state variants and source-kind vocabulary need more corpus/test coverage and later vocabulary centralization. |
| `MISMATCH-ATTEST-012` | `RECON-ATTEST-015`; `RECON-DEFER-021` | Attestation role vocabulary is useful, but legal-signature, raw audit, role registry, and compliance machinery stay deferred. |
| `MISMATCH-LIFE-013` | `RECON-LIFE-016` | Active-state lifecycle behavior is substrate-critical, but structural markdown/filesystem loading is adapter detail. |
| `MISMATCH-AGENT-014` | `RECON-AGENT-017` | Agent suggestions, generated transforms, and narrative drafts need explicit human acceptance and provenance; direct accepted writes remain out of scope. |
| `MISMATCH-CORPUS-015` | all clinical rows as caveat | Operator-review caveats, hand-authored fixture limits, and absent `_derived` projection outputs must not be smoothed into readiness credit. |
| `MISMATCH-RENDER-016` | `RECON-RENDER-018`; `RECON-DEFER-019`; `RECON-REJECT-020` | View names, adapter seams, raw design drops, generated HTML, and UI style are directional evidence only. |
| `MISMATCH-SCOPE-017` | `RECON-DEFER-019`; `RECON-DEFER-021`; `RECON-REJECT-020` | Full EHR modules, backend, vector/OpenBrain, runtime, hidden simulator, patient migration, direct accepted writes, compliance, and pi-ledger kernel expansion remain forbidden. |

## Boundary closeout

- [x] Docs-only under `.scratch/pi-chart-phase-a-context-digging-corpus-mining/`.
- [x] No source, schema, test, patient, `_derived`, package, lockfile, accepted ADR, design asset, `pi-ledger`, or `pi-sim` internal file is required or authorized by this recommendation.
- [x] No backend, vector, embedding, OpenBrain, graph index, storage, runtime, access-plane, or service architecture is selected.
- [x] No direct agent accepted-write policy is authorized.
- [x] No full EHR clone framing is promoted.
- [x] No new `pi-ledger` kernel requirement is added.
- [x] Brownfield code/tests remain evidence only.
- [x] Corpus rows remain scenario pressure and caveat evidence, not schema authority.
- [x] Rendered/prototype evidence remains navigation/question evidence only.

## Acceptance criteria closeout

- [x] Produces a concise v0.5 substrate recommendation organized around clinical function and chart-digging questions, not EHR modules.
- [x] Names adopted, revised, deferred, rejected, and open-question substrate families.
- [x] Preserves compact primitive/link/time/lifecycle vocabulary and explains pressure to expand it.
- [x] Includes hot/warm/cold context summary with no backend/vector/OpenBrain commitment.
- [x] Explains chart-once/project-many across trend, narrative, evidence, open loops, review, care plan, human workflow prioritization, and handoff.
- [x] Includes a clinician-facing workflow/shift-brain projection with meds due, assessment cadence, medication drip/gtt/bag changes, turns, blood sugar checks, baths, Foley/I&O work, dressing changes, travel-to-scan/off-unit tasks, and similar human-only care obligations.
- [x] States workflow/task-list/brain surfaces are derived prioritization views, not autonomous agent authority and not canonical chart truth.
- [x] Lists pi-chart <-> pi-ledger adapter implications without new `pi-ledger` kernel requirements.
- [x] Includes a maintainer-review section separating recommended decisions from open HITL questions, deferred decisions, and rejected authority sources.

## Verification record

Execution verification for this artifact should be completed by the Ralph closeout commands in the issue 13 task. This document is structured to allow deterministic checks for all 21 `RECON-*` rows, all 17 aggregate `MISMATCH-*` rows, all 8 HITL questions, hot/warm/cold language, shift-brain obligations, adapter-only `pi-ledger` language, and boundary exclusions.
