# Hot/warm/cold context access model

Status: ready-for-human
Parent PRD: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`
Source issue: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/11-hot-warm-cold-context-access-model.md`
Template: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/mining-template.md`

## Scope and authority stance

This artifact defines v0.5 context-access behavior for clinician-style chart digging. It answers which chart facts must be immediately deterministic, which evidence belongs in nearby chart review, and which longitudinal/background material can stay outside the hot packet until explicitly needed.

Authority is limited to the approved workstream evidence: the parent PRD, mining template, source artifact mining map, patient corpus atlas, brownfield implementation crosswalk, and substrate packs 05-10. This model is not an implementation design and does not choose vector storage, embeddings, OpenBrain architecture, graph indexes, backend services, runtime tools, access-plane APIs, or storage layout.

## Access-tier definitions

| Tier | Clinical definition | Examples | Authority warning |
| --- | --- | --- | --- |
| Hot | Deterministic, low-latency current-care context needed before a clinician or bounded agent reasons, acts, accepts, rejects, or escalates. | Patient/encounter scope, active safety constraints, current problems/assessments, current vitals and short trajectory, active medication/order obligations, open loops, current oxygen/device context, unresolved critical results, current handoff/watch items, and current review/lifecycle state. | Hot truth must never depend on semantic/vector retrieval, generated summaries, rendered UI, hidden simulator state, or fixture convenience. |
| Warm | Recent or supporting chart-review context used to explain, verify, or expand hot facts during digging. | Nearby trend windows, recent labs/diagnostic reports, evidence chains, result-review history, recent notes/communications, recent orders/actions/fulfillments, pharmacy/consult rationale, attestation chains, and memory-proof/context-bundle support. | Warm context supports hot truth but does not override it or become independent canonical truth. |
| Cold | Longitudinal/background material used for baseline, history, and meaning when explicitly pulled into review. | H&P, prior encounters, discharge summaries, old consults, old imaging narratives, chronic disease history, home-med history, prior intolerance, baseline function/cognition, social/family/support context, and narrative archives. | Cold/semantic/vector eligibility is a future access requirement only, not a backend choice and not a second source of current clinical truth. |

## Hot deterministic current context

Hot context is the minimum current-care packet that must be assembled from canonical facts and derived projections before chart reasoning. It should answer: who is the patient, what is active now, what is unsafe to miss, what changed recently, what remains unresolved, and which current claims require review or accountability.

Hot facts for v0.5 must include, when clinically present:

- **Patient and encounter scope:** deterministic patient, encounter, as-of, and baseline/orientation facts before any chart read, write, or context packet. Evidence: `HOT-IDENTITY-001`, `HOT-PACKET-005`, `RENDER-CURRENT-002`, `BF-READ-003`, `BF-CURRENT-011`, `BF-MEMPROOF-016`.
- **Safety constraints:** active allergies, code status, precautions, isolation, fall/delirium risk, and other action-gating constraints. Evidence: `HOT-CONSTRAINTS-002`, `HOT-BEDSIDE-006`, `SRC-A0B-001`, `CORPUS-P001-RESP-001`, `CORPUS-P005-FRAIL-005`.
- **Active problems and assessments:** current working problems, contested assessments, uncertainty, and evidence-linked watch items that explain the plan. Evidence: `HOT-PROBLEMS-003`, `SRC-A0C-001`, `REV-LIFE-004`, `BF-ACTIVE-022`.
- **Current vitals and short trajectory:** latest valid vital facts, oxygen/device context, short safety windows, invalid-sample suppression, and current deterioration/improvement signals. Evidence: `HOT-VITALS-004`, `TRAJ-VITALS-001`, `TRAJ-ALARM-002`, `OXYGEN-DEVICE-005`, `BF-TREND-012`, `BF-VITALSTREND-020`.
- **Critical/current labs and diagnostics:** current critical result facts, unreviewed abnormal results, diagnostic facts that affect immediate interpretation, and artifact/result separation. Evidence: `TRAJ-LABS-004`, `TRAJ-DIAG-005`, `TRAJ-REVIEW-006`, `SRC-A1-001`, `SRC-A2-001`.
- **Active orders, medications, and open loops:** active or overdue obligations, in-progress/failed/fulfilled loops, medication administrations/holds/refusals/omissions/restart criteria, source-control or monitoring obligations, and next-shift watch items. Evidence: `ORD-INTENT-001`, `MAR-ACTION-002`, `OPENLOOP-006`, `CONTEXT-TIER-010`, `BF-OPENLOOPS-014`.
- **Immediate bedside and device context:** current oxygen device, lines/drains/devices, unsafe I&O or volume signals, and nursing assessment facts that change immediate safety. Evidence: `HOT-BEDSIDE-006`, `IO-LDA-004`, `OXYGEN-DEVICE-005`, `SRC-A5-001`, `SRC-A8-001`.
- **Handoff and care-continuity packet:** deterministic current handoff/watch items, pending work, uncertainty, evidence refs, and what the next clinician must not miss. Evidence: `NARR-HANDOFF-003`, `NARR-CHARTONCE-004`, `BF-MEMPROOF-016`, `BF-BUNDLE-017`.
- **Review, authorship, and lifecycle state:** current agent-authored suggestions, unresolved/contested/corrected/superseded claims, accepted/verified/rejected/co-signed states, and accountability facts when they affect current care. Evidence: `REV-REVIEW-001`, `REV-AUTHOR-002`, `REV-LIFE-004`, `REV-SUGGEST-005`, `RENDER-AGENT-003`.

Hot context can be derived, but only from replayable canonical facts and explicit refs. It must not require free-text search, semantic retrieval, generated narrative, rendered cockpit state, hidden `pi-sim` state, or future `_derived` output to determine current safety truth.

## Warm chart-review context

Warm context is the source-linked material clinicians dig into when hot facts need explanation, verification, trend review, or accountability. Warm context should remain close to current care, as-of scoped, and evidence-linked.

Warm context includes:

- **Evidence chains and provenance expansion:** support/counterevidence refs, bounded traversal, artifact refs, note refs, vitals windows, contradiction links, and transform inputs. Evidence: `TRAJ-EVIDENCE-003`, `TRAJ-DIAG-005`, `REV-TRANSFORM-006`, `BF-ECHAIN-013`.
- **Nearby trend and result review windows:** serial vitals, oxygen changes, recent labs/diagnostics, MAP/lactate, K/Cr, serial BMPs/CXR, review actions, and fulfillment links. Evidence: `TRAJ-VITALS-001`, `TRAJ-LABS-004`, `TRAJ-REVIEW-006`, `CORPUS-P003-INF-003`, `CORPUS-P004-MED-004`.
- **Recent orders, medication rationale, and fulfillment history:** order history, pharmacy/consult rationale, med-rec details for the current admission, response evidence, and open-loop history. Evidence: `ORD-INTENT-001`, `MAR-ACTION-002`, `MEDREC-003`, `REVIEW-ACCOUNT-008`, `CONTEXT-TIER-010`.
- **Recent narrative and communication:** recent provider/RN notes, family communication, focused nursing notes, handoff support, note-linked evidence, and attestation history. Evidence: `NARR-NOTES-001`, `NARR-HANDOFF-003`, `NARR-ACCOUNT-006`, `BF-NARRATIVE-015`.
- **Review/accountability history:** review actions, attestation chains, source-kind/authorship projection, operator-review caveats, and accepted/rejected/co-signed context around chart-facing material. Evidence: `REV-REVIEW-001`, `REV-ATTEST-003`, `REV-CORPUS-007`, `REV-RAWAUDIT-007`.
- **Rendered/prototype navigation evidence:** cockpit tabs, current-state displays, evidence/open-loop/narrative navigation, and adapter seams as product evidence only. Evidence: `RENDER-COCKPIT-001`, `RENDER-EVIDENCE-004`, `RENDER-SEAMS-005`.

Warm context should be reachable and auditable, but it is not an implementation contract. A future access plane may optimize warm retrieval, but this issue only records the clinical need.

## Cold longitudinal/background context

Cold context is the background a clinician may need to interpret the current encounter without bloating the hot packet. It should stay source-linked and retrievable by future access policy. It becomes hot only when an explicit current-care fact promotes it into a current constraint, problem, medication decision, open loop, or safety watch item.

Cold context includes:

- **History and physical / prior encounters / discharge summaries:** baseline function, prior admissions, prior discharge instructions, old consults, old imaging narratives, and longitudinal disease history. Evidence: `NARR-HISTORY-002`, `NARR-COLD-005`, `SRC-A0A-001`, `SRC-A6-001`.
- **Longitudinal chronic-disease and medication background:** HFpEF/CKD/AF/diabetes history, home medication history, prior intolerance, outpatient restart criteria, and long-term family/support routines. Evidence: `MEDREC-003`, `NARR-HISTORY-002`, `CORPUS-P004-MED-004`, `CORPUS-P005-FRAIL-005`.
- **Old diagnostics and narrative archives:** old imaging reports, old lab trends, archived notes, old consult reasoning, and generated summaries only as non-authoritative navigation if later reviewed. Evidence: `TRAJ-DIAG-005`, `NARR-COLD-005`, `REV-TRANSFORM-006`.
- **Planning/audit background:** deferred raw access audit, legal-signature/compliance scope, role registry, protocol engines, CDS/order-set product details, and access-plane backend choices. Evidence: `REV-RAWAUDIT-007`, `ORDERSET-007`, `PRODUCT-BOUNDARY-009`, `RENDER-SEAMS-005`.

Cold material may be semantically eligible later, but semantic eligibility means only: future systems should be able to find and cite it when clinically requested. It does not mean cold material is authoritative current truth, does not authorize embeddings/vector indexes/OpenBrain, and does not define a storage or runtime architecture.

## Evidence-row mapping from packs 05-10

| Source pack | Rows used for this access model | Access-model contribution |
| --- | --- | --- |
| `hot-current-state-substrate-pack.md` | `HOT-IDENTITY-001`, `HOT-CONSTRAINTS-002`, `HOT-PROBLEMS-003`, `HOT-VITALS-004`, `HOT-PACKET-005`, `HOT-BEDSIDE-006` | Defines the deterministic hot current-state packet: identity, constraints, active problems, vitals/trajectory, bedside/device facts, and context-packet behavior. |
| `trajectory-evidence-labs-diagnostics-substrate-pack.md` | `TRAJ-VITALS-001`, `TRAJ-ALARM-002`, `TRAJ-EVIDENCE-003`, `TRAJ-LABS-004`, `TRAJ-DIAG-005`, `TRAJ-REVIEW-006`, `TRAJ-CONTEXT-007`, `TRAJ-BOUNDARY-008` | Splits current critical result/vital facts from warm evidence/review expansion and cold longitudinal diagnostics; preserves artifact/result separation and no-backend boundary. |
| `orders-mar-medrec-io-lda-open-loop-substrate-pack.md` | `ORD-INTENT-001`, `MAR-ACTION-002`, `MEDREC-003`, `IO-LDA-004`, `OXYGEN-DEVICE-005`, `OPENLOOP-006`, `ORDERSET-007`, `REVIEW-ACCOUNT-008`, `PRODUCT-BOUNDARY-009`, `CONTEXT-TIER-010` | Defines active orders/MAR/open-loop/device facts as hot when current-safety relevant, rationale/history as warm, and home-med/prior-history background as cold. |
| `notes-narrative-history-prior-encounters-handoff-substrate-pack.md` | `NARR-NOTES-001`, `NARR-HISTORY-002`, `NARR-HANDOFF-003`, `NARR-CHARTONCE-004`, `NARR-COLD-005`, `NARR-ACCOUNT-006` | Separates note truth and handoff projections from cold narrative/history; reinforces chart-once/project-many and no semantic second-truth behavior. |
| `review-attestation-authorship-lifecycle-accountability-substrate-pack.md` | `REV-REVIEW-001`, `REV-AUTHOR-002`, `REV-ATTEST-003`, `REV-LIFE-004`, `REV-SUGGEST-005`, `REV-TRANSFORM-006`, `REV-CORPUS-007`, `REV-RAWAUDIT-007` | Classifies authorship/review/lifecycle state as hot when safety or agent material depends on it, warm for accountability expansion, and cold/deferred for compliance machinery. |
| `rendered-chart-digging-prototype-design-evidence-pass.md` | `RENDER-COCKPIT-001`, `RENDER-CURRENT-002`, `RENDER-AGENT-003`, `RENDER-EVIDENCE-004`, `RENDER-SEAMS-005`, `RENDER-ASSETS-006` | Allows rendered/prototype material to inform chart-digging questions and navigation only; rejects UI/design assets as substrate authority. |

## Compact family classification

| Substrate family | Hot | Warm | Cold |
| --- | --- | --- | --- |
| Identity/encounter | Patient, encounter, as-of, baseline orientation needed to scope current chart context. | Nearby encounter timeline and source refs. | Old encounter background unless promoted into current baseline/problem. |
| Constraints | Active allergies, code status, precautions, isolation, fall/delirium risks. | Review/verification/read-receipt history. | Retired or historical constraints unless clinically relevant now. |
| Problems/assessments | Current active/contested problems and urgent watch items. | Supporting evidence and recent assessment trend. | Longitudinal problem history and old differentials. |
| Vitals/trends | Latest valid vitals, oxygen/device context, short safety trajectory, current alarms/attention signals. | Larger trend windows and source-linked vital evidence. | Baseline physiology and old trend history. |
| Labs/diagnostics | Current critical/unreviewed result facts and diagnostic facts affecting immediate decisions. | Recent serial labs, artifact/report expansion, review/fulfillment evidence. | Old imaging narratives, longitudinal labs, remote diagnostic background. |
| Orders/MAR/open loops | Active/overdue orders, med holds/refusals/critical administrations, unresolved loops. | Rationale, fulfillment history, consult/pharmacy review, nearby order history. | Home-med history and prior medication background unless promoted. |
| I&O/LDA/device | Current device/line/drain/oxygen/unsafe volume context. | Balance windows and serial bedside context. | Historical device/flowsheet background. |
| Notes/handoff | Current handoff/watch items and safety excerpts promoted through evidence. | Recent provider/RN notes, communications, evidence-linked narrative. | H&P, prior encounters, discharge summaries, old consults, narrative archives. |
| Review/accountability | Current safety-sensitive agent material, contested/corrected/superseded claims, unresolved review state. | Review history, attestation chains, source-kind/accountability expansion. | Raw audit/compliance/legal-signature planning history. |
| Rendered/prototype | None as substrate truth; current display can pressure hot clinical questions only. | Navigation affordances for evidence/open loops/narrative digging. | Static assets, visual style, generated HTML, and prototype implementation details. |

## Non-decisions and downstream handoff

This issue intentionally does not decide:

- vector storage, embeddings, graph indexes, OpenBrain architecture, backend service, runtime infrastructure, access-plane API, or storage layout;
- final context-packet public API, adapter boundaries, UI layout, generated `_derived` inventory, or chart adapter implementation;
- full EHR modules such as CPOE, pharmacy verification, barcode MAR, full flowsheets, device inventory, billing/ADT/scheduling, legal-signature, compliance, role registry, or external EHR integration;
- direct agent accepted-writes to clinical truth;
- new `pi-ledger` kernel requirements;
- patient migration or patient fixture rewrites.

Issue 12 should consume this model as an access-behavior input, then perform the three-layer reconciliation and mismatch-register pass before issue 13 drafts any lean/dense v0.5 substrate recommendation.

## Acceptance criteria closeout

- [x] Defines hot, warm, and cold context in clinical terms with examples from substrate packs and patient corpus.
- [x] Identifies hot facts that must never depend on semantic/vector retrieval: safety constraints, active problems, current vitals/trajectory, active orders/intents, pending/open loops, current medication obligations/holds/refusals, recent critical changes, and current review/lifecycle state.
- [x] Identifies warm context: supporting evidence, recent notes, recent labs/orders/actions, review history, nearby trend windows, provenance expansion, and accountability history.
- [x] Identifies cold context: H&P, prior encounters, discharge summaries, consult history, old imaging narratives, longitudinal disease history, home-medication background, and narrative archives.
- [x] States that cold/semantic/vector eligibility is a future access requirement, not an implementation decision.
- [x] Ties context-access classes back to evidence rows from issues 05-10.
- [x] Does not introduce vector store, embeddings, OpenBrain architecture, backend selection, access-plane implementation, runtime tools, source implementation, patient migration, direct agent accepted-writes, or pi-ledger kernel expansion.

## Boundary closeout

- Docs-only under `.scratch/pi-chart-phase-a-context-digging-corpus-mining/`.
- No source, schema, test, patient, `_derived`, package, lockfile, accepted ADR, design asset, `pi-ledger`, or `pi-sim` internal file is required or authorized by this model.
- Hidden `pi-sim` physiology, evaluator labels, runtime transcripts, simulator-only state, and future/oracle data are not valid chart truth.
- Rendered/prototype evidence informs chart-digging questions only and does not define substrate truth.
