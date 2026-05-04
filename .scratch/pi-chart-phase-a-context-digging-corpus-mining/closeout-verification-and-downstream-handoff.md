# Closeout verification and downstream handoff

## Parent

`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## Scope

This is the docs-only closeout for the pi-chart Phase A Context Digging + Corpus Mining workstream. It verifies that the mined Phase A evidence, corpus atlas, brownfield crosswalk, substrate packs, hot/warm/cold model, reconciliation register, lean v0.5 recommendation, and HITL workflow decisions are ready to feed downstream PRDs/issues without authorizing implementation edits.

The downstream framing remains:

> How can the chart and agent gather the right context at the right time to make the clinician maximally effective?

## Artifact inventory

| Slice | Issue | Workstream artifact | Status | Parent PRD reference | Closeout result |
| --- | --- | --- | --- | --- | --- |
| 01 | `issues/01-evidence-authority-ladder-and-mining-templates.md` | `mining-template.md` | ready-for-human | verified | keep as evidence-authority and mining-row format baseline |
| 02 | `issues/02-phase-a-source-artifact-mining-map.md` | `source-artifact-mining-map.md` | ready-for-human | verified | keep as source-artifact map for future PRD citations |
| 03 | `issues/03-brownfield-implementation-crosswalk.md` | `issues/03-brownfield-implementation-crosswalk.md` | ready-for-human | verified | keep as brownfield evidence/caveat crosswalk; do not treat implementation shape as authority |
| 04 | `issues/04-patient-001-005-corpus-atlas.md` | `patient-001-005-corpus-atlas.md` | ready-for-human | verified | keep as corpus coverage/gap atlas; preserve hand-authored/operator-review caveats |
| 05 | `issues/05-hot-current-state-substrate-pack.md` | `hot-current-state-substrate-pack.md` | ready-for-human | verified | keep current-state facts, evidence, and open mismatch notes |
| 06 | `issues/06-trajectory-evidence-labs-diagnostics-substrate-pack.md` | `trajectory-evidence-labs-diagnostics-substrate-pack.md` | ready-for-human | verified | keep trajectory/labs/diagnostics/evidence obligations and result-review cautions |
| 07 | `issues/07-orders-mar-medrec-io-lda-open-loop-substrate-pack.md` | `orders-mar-medrec-io-lda-open-loop-substrate-pack.md` | ready-for-human | verified | keep order/MAR/med-rec/I&O/LDA/open-loop evidence; defer unresolved CPOE/pharmacy/task-product scope |
| 08 | `issues/08-notes-narrative-history-prior-encounters-handoff-substrate-pack.md` | `notes-narrative-history-prior-encounters-handoff-substrate-pack.md` | ready-for-human | verified | keep narrative, note addressability, handoff, and cold-history evidence |
| 09 | `issues/09-review-attestation-authorship-lifecycle-accountability-substrate-pack.md` | `review-attestation-authorship-lifecycle-accountability-substrate-pack.md` | ready-for-human | verified | keep authorship/review/attestation/lifecycle accountability evidence; defer legal/compliance machinery |
| 10 | `issues/10-rendered-chart-digging-and-prototype-design-evidence-pass.md` | `rendered-chart-digging-prototype-design-evidence-pass.md` | ready-for-human | verified | keep rendered/prototype clinical navigation questions only; reject raw UI/design assets as authority |
| 11 | `issues/11-hot-warm-cold-context-access-model.md` | `hot-warm-cold-context-access-model.md` | ready-for-human | verified | keep hot/warm/cold access behavior without backend/vector/OpenBrain selection |
| 12 | `issues/12-three-layer-reconciliation-and-mismatch-register.md` | `three-layer-reconciliation-and-mismatch-register.md` | ready-for-human | verified | keep reconciliation rows and mismatch register as the bridge into issue 13 |
| 13 | `issues/13-lean-dense-v0-5-substrate-recommendation.md` | `lean-dense-v0-5-substrate-recommendation.md`; `hitl-workflow-prioritization-decisions.md` | ready-for-human | verified | keep as primary v0.5 substrate recommendation plus maintainer workflow decisions |

All prior issue files 01-13 and their listed artifacts exist and reference the parent PRD.

## Recommendation evidence audit

`lean-dense-v0-5-substrate-recommendation.md` contains a 21-row `RECON-*` decision-state matrix. Every row includes:

- a reconciliation state: `adopt`, `revise`, `open-question`, `defer`, or `reject`;
- a source citation from Phase A/source-map evidence or explicit PRD clause;
- a code/test citation from the brownfield crosswalk, adapter fixture evidence, `_derived` evidence-only row, or equivalent caveat;
- a corpus citation or explicit `not-covered` marker;
- a HITL/deferred/mismatch caveat that preserves uncertainty instead of smoothing it into readiness.

State distribution verified for downstream slicing:

| State | Rows | Meaning for downstream work |
| --- | --- | --- |
| `adopt` | 7 | Stable substrate behavior to carry into future PRDs/issues. |
| `revise` | 10 | Useful evidence with naming, shape, policy, or scope revisions required before implementation. |
| `open-question` | 1 | Bedside/I&O/LDA/device grammar needs maintainer/HITL resolution before becoming implementation authority. |
| `defer` | 2 | Future architecture/product-policy scope; do not pull into v0.5 substrate implementation. |
| `reject` | 1 | Directional evidence only; not substrate authority. |

The major recommendation sections repeat the matrix rows under clinical-function questions, so downstream issue writers can cite each recommendation with its source, code/test, corpus, and state fields without re-mining the archive.

## Boundary verification

| Boundary | Closeout result |
| --- | --- |
| No source implementation edits | verified for this slice; only `.scratch/pi-chart-phase-a-context-digging-corpus-mining` docs are edited by issue 14 |
| No patient fixture edits | verified; patient corpus is cited, not migrated or rewritten |
| No hidden `pi-sim` dependency | verified; recommendations require no simulator internals and preserve source/corpus citations only |
| No vector/OpenBrain/backend selection | verified; semantic/cold eligibility remains a future access requirement, not an implementation choice |
| No EHR-clone framing | verified; the framing is clinician context gathering and right-context/right-time usefulness, not recreating an EHR module clone |
| No `pi-ledger` kernel expansion | verified; ledger language is future pi-chart adapter implication only |
| No direct agent accepted-writes | verified; agent output remains suggestion/provenance material requiring human acceptance/review |
| No raw design/generated UI authority | verified; raw design zips, generated UI, visual style, and public API shape are rejected as substrate authority |
| Workflow projection non-authority | verified; shift-brain/task-list surfaces are derived prioritization views, not canonical chart truth or autonomous completion authority |

## Issue 13 separation check

Issue 13 separates downstream decision types explicitly:

- `## Decision-state matrix` lists all 21 rows with states.
- `### Recommended v0.5 decisions` lists adopted decisions.
- `### Recommended revise decisions` lists useful-but-not-final rows.
- `### Open HITL questions` preserves eight HITL questions.
- `### Deferred decisions` keeps backend/vector/OpenBrain/access-plane/adapter/product-policy/legal/compliance scope out of implementation authority.
- `### Rejected authority sources` rejects raw design/generated UI/`_derived` truth.

The separate `hitl-workflow-prioritization-decisions.md` records maintainer decisions made after issue 13 about workflow/shift-brain behavior. It should travel with the issue 13 recommendation during downstream PRD/issue generation.

## Downstream handoff guidance

### For `$to-prd`

Use `lean-dense-v0-5-substrate-recommendation.md` as the primary product input and keep `hitl-workflow-prioritization-decisions.md` beside it. The next PRD should translate the recommendation into a lean v0.5 pi-chart substrate strategy, not an implementation of every Phase A module.

Required framing for that PRD:

- chart facts/actions/notes/refs are canonical memory;
- current packet, trends, evidence chains, review state, handoff, and shift-brain views are projections;
- hot/warm/cold is an access behavior and priority model, not a storage/backend commitment;
- workflow support exists to help clinicians prioritize safely and gently, not to judge or automate them;
- agent outputs can suggest, cite, and prioritize, but humans own acceptance, charting, completion, and handoff truth.

### For `$to-issues`

Slice implementation issues from adopted/revised rows, not from source-artifact phases. Recommended issue lanes:

1. v0.5 substrate vocabulary and evidence/provenance grammar.
2. Hot current-packet and chart-once/project-many projection contract.
3. Result/review/open-loop separation for labs, diagnostics, orders, and handoff.
4. Medication/MAR/med-rec and med-retiming semantics with authority/source fields.
5. Per-patient workflow/shift-brain substrate: source hierarchy, due windows, clinical-risk tiers, defer/blocked/carry-forward states, nonpunitive language, and disable-able agent suggestions.
6. Minimal verbal/telephone order representation and co-sign/readback status.
7. Cold-history source-linked citation and future semantic eligibility without selecting vector/backend/OpenBrain.
8. Rendered/prototype navigation lessons as product affordances only, not UI/API authority.
9. Brownfield reconciliation/archive plan that supersedes useful prototype concepts without preserving obsolete storage shape.
10. pi-chart to pi-ledger adapter PRD/issues only after chart substrate fields are explicit enough to map cleanly.

Keep issue slices AFK-friendly: each should name allowed files, forbidden surfaces, closeout commands, and whether a row is `adopt`, `revise`, `open-question`, `defer`, or `reject`.

### For `$team` or `$ultrawork`

Parallelize only after the PRD/issue set is sliced. Good parallel lanes:

- source/evidence citation audits;
- brownfield-to-v0.5 mapping tables;
- corpus coverage/gap expansion;
- workflow/shift-brain semantics drafting;
- adapter-boundary review;
- docs-only archive/supersession plan.

Do not parallelize unresolved authority decisions into implementation. A team can mine and draft, but HITL choices around I&O/LDA grammar, result-review closure, note addressability, agent acceptance semantics, and cold-history retrieval language still need explicit maintainer approval before code-bearing slices.

## Git status record

`git status --short` before staging issue 14 showed the expected issue 14 docs plus unrelated dirty/untracked files outside this workstream:

```text
 M .scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/14-closeout-verification-and-downstream-handoff.md
 M .scratch/pi-ledger-claim-ledger-kernel/PRD.md
 M pi-ledger/CONTEXT.md
?? .scratch/pi-chart-phase-a-context-digging-corpus-mining/closeout-verification-and-downstream-handoff.md
?? .scratch/pi-ledger-claim-ledger-kernel/issues/11-k11-revision-admission-correction-target-existence.md
?? "pi-chart/docs/design/Pi-chart Design System.zip"
?? pi-chart/docs/design/pi-chart-logo.png
?? pi-chart/src/claim-ledger/
?? pi-ledger/docs/adr/006-revision-admission-proves-correction-target-existence.md
?? pi-ledger/docs/k0-overview.html
?? pi-ledger/docs/k2-overview.html
?? showcase/
```

Expected issue 14 changes are limited to:

```text
.scratch/pi-chart-phase-a-context-digging-corpus-mining/closeout-verification-and-downstream-handoff.md
.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/14-closeout-verification-and-downstream-handoff.md
```

The parent PRD status was not modified.

## Verification record

Fresh closeout checks should verify:

- all issue files 01-13 are `ready-for-human` and reference the parent PRD;
- all listed workstream artifacts exist and reference the parent PRD;
- the issue 13 recommendation has 21 `RECON-*` matrix rows, 17 `MISMATCH-*` summary rows, all five decision states, all eight HITL questions, hot/warm/cold language, adapter-only pi-ledger language, and workflow non-authority boundaries;
- the HITL workflow decisions artifact records 18 decisions and preserves the nonpunitive, human-authority, disable-able-agent-suggestion, order-set-derived-work, verbal/telephone-order, med-retiming, cadence-source, and per-patient-first boundaries;
- this closeout plus issue 14 are the only workstream changes staged/committed.
