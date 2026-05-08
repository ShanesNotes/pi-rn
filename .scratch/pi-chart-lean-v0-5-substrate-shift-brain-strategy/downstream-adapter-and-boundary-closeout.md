# Downstream adapter and boundary closeout

Status: ready-for-human
Parent PRD: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`
Source issue: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/15-downstream-adapter-and-boundary-closeout.md`
Depends on: issues 01-14 in `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/`

## Purpose

Close out the lean v0.5 substrate + shift-brain strategy issue set. This artifact verifies that the completed docs preserve the parent PRD boundaries, keep the clinician-reader and bounded in-chart-assistant perspectives visible, and leave future adapter work conditional rather than authorized.

The closeout does not start implementation. It is a handoff register for future PRDs/issues.

## Issue set status and parent linkage

Each prior issue has an explicit triage state and references the parent PRD.

| Issue | Status | Parent PRD referenced | Output posture |
| --- | --- | --- | --- |
| 01 per-patient shift-start workflow tracer | ready-for-human | yes | Per-patient workflow spine; docs-only |
| 02 canonical memory vs derived projection contract | ready-for-human | yes | Canonical/projection safety contract; docs-only |
| 03 one-page nursing report projection | ready-for-human | yes | Report projection over canonical memory; docs-only |
| 04 shift-start chart-digging packet | ready-for-human | yes | Source-linked packet behavior; docs-only |
| 05 bedside verification and mismatch prompts | ready-for-human | yes | Review-prompt boundary; docs-only |
| 06 workflow item source and authority grammar | ready-for-human | yes | Workflow item authority grammar; docs-only |
| 07 human-agent workflow boundary | ready-for-human | yes | Assistant/human authority contract; docs-only |
| 08 clinical-risk prioritization and supportive language | ready-for-human | yes | Nonpunitive priority/language contract; docs-only |
| 09 medication timing, retiming, and clustered assessment | ready-for-human | yes | Human-owned med/assessment timing contract; docs-only |
| 10 verbal/telephone order minimal semantics | ready-for-human | yes | Minimal order-action semantics; docs-only |
| 11 policy/order-set cadence derived work | ready-for-human | yes | Source-linked policy-derived work brief; docs-only |
| 12 care clustering and handoff carry-forward | ready-for-human | yes | Advisory clustering and human-owned handoff; docs-only |
| 13 cold-history retrieval eligibility boundary | ready-for-human | yes | Citation/retrieval-eligibility boundary; docs-only |
| 14 rendered/prototype/report visual authority boundary | ready-for-human | yes | Visual/prototype evidence boundary; docs-only |

Issue 15 updates this closeout issue itself to `ready-for-human` once verification is complete.

## Clinician-reader and bounded-assistant framing check

The issue set keeps two perspectives visible:

1. **Clinician-reader / nurse shift brain.** The docs support a clinician reading the chart, receiving report, digging into source-linked context, verifying bedside reality, planning medications and assessments, clustering care, and handing off unresolved work without blame.
2. **Bounded in-chart assistant.** The assistant may summarize, cite, explain, compare, suggest, prioritize, and prompt review over canonical memory and derived projections. It remains derived/provisional unless a human or sanctioned chart workflow accepts, charts, reviews, completes, or finalizes.

Cross-issue verification:

| Boundary theme | Preserved by |
| --- | --- |
| Source-linked clinician trust | issues 02, 03, 04, 05, 06, 13, 14 |
| Bedside/report/chart mismatch as review prompt, not truth decision | issues 01, 05, 09, 14 |
| Assistant suggestions provisional until human action | issues 06, 07, 08, 09, 12, 13 |
| Human-owned charting, completion, reconciliation, and final handoff | issues 05, 07, 09, 10, 12 |
| Nonpunitive/supportive delayed/deferred language | issues 06, 08, 09, 11, 12 |
| Per-patient first workflow before assignment aggregation | issues 01, 06, 12, 14 |

No issue reframes the assistant as a clinician-equivalent decision-maker, silent chart truth, direct accepted-write authority, or autonomous completion authority.

## Architecture and authority boundary register

| Boundary | Closeout verdict | Evidence in issue set |
| --- | --- | --- |
| Canonical vs derived | Preserved | Issue 02 names canonical chart memory and rebuildable derived projections; later issues reuse source-linked projection posture |
| Backend/vector/OpenBrain/storage/runtime/service/graph-index/semantic-search/access-plane | Deferred, not selected | Issues 02, 04, 11, 13, 14 explicitly keep these as out of scope or behavior-only |
| Adapter architecture | Deferred, not selected | Issue set only names future adapter-safe candidates; no adapter contract is implemented or selected |
| Hidden `pi-sim` internals or oracle truth | Excluded | Issues 02, 05, 07, 09, 13, 14 and this closeout forbid hidden simulator/oracle coupling |
| `pi-ledger` kernel scope | Not expanded | Ledger language remains future adapter-only; no kernel semantics are added by this docs lane |
| Direct agent accepted-writes | Out of scope | Issues 02 and 07 define no direct accepted chart writes; later issues preserve human acceptance |
| Autonomous task completion | Out of scope | Issues 06, 07, 08, 09, 12 preserve human-owned completion/defer/block/carry-forward |
| Report/prototype/generated UI authority | Rejected | Issues 03 and 14 treat visuals/generated UI as workflow/product evidence only |
| Assignment-level nurse brain | Deferred | Issue 14 preserves it as later aggregation/orchestration over per-patient workflow items |
| Punitive workflow framing | Rejected | Issues 08, 09, 11, 12 require supportive language and avoid blame framing |

Boundary conclusion: the issue set is ready as a durable product/domain handoff. It is not an implementation plan for storage, services, adapters, retrieval, UI, access control, or simulator integration.

## Reconciliation posture closeout

The parent PRD required downstream work to carry Phase A reconciliation posture: `adopt`, `revise`, `open-question`, `defer`, or `reject`. This issue set handles that posture as follows:

| Posture | Closeout interpretation |
| --- | --- |
| `adopt` | Stable clinical/product behavior carried forward into docs, such as source-linked evidence, chart-once/project-many projections, hot/warm/cold behavior, review prompts, and human-owned workflow |
| `revise` | Brownfield/prototype terms translated into safer domain language before reuse, such as report visual categories, workflow items, policy cadence, and verbal order semantics |
| `open-question` | Preserved where unresolved, such as exact I&O/LDA/device completion grammar, local policy/order-set content, and future UI/runtime details |
| `defer` | Kept outside implementation authority, including backend/storage/runtime/access-plane, retrieval architecture, adapter architecture, legal/compliance/raw audit, role registry, and full CPOE/pharmacy |
| `reject` | Kept as non-authority evidence only, such as generated UI/storage shape, disposable `_derived` truth, hidden simulator internals, and direct agent write/completion authority |

Future agents should not re-promote deferred or rejected surfaces without a new PRD, explicit scope, and review.

## Future PRD/issue candidates with preconditions

The following candidates are safe to draft later only after substrate fields and workflow semantics are explicit enough to map cleanly. They are not authorized by this closeout.

| Future candidate | Safe preconditions | Must still avoid |
| --- | --- | --- |
| Per-patient substrate field/interface PRD | Canonical fact/action/note/ref categories, source/provenance/timing/lifecycle/review fields, workflow item grammar, and projection contracts are explicit | Private storage shape, backend service choice, hidden simulator coupling |
| Projection contract behavior tests | Clinician-visible examples exist for current packet, report projection, chart-digging packet, workflow item, mismatch prompt, care cluster, handoff, and cold-history summary | Tests that lock helper names, UI shape, database layout, or generated `_derived` text |
| Bounded in-chart assistant suggestion tests | Suggested/accepted/rejected states, evidence links, disable-able suggestions, and human-acceptance transitions are specified | Agent accepted-writes, autonomous completion, hidden oracle state |
| One-page report / shift-brain prototype UI PRD | Source states, report categories, hot/warm/cold posture, and non-authority visual boundary are stable | Treating layout/component/API names as substrate authority |
| Policy/order-set source model research PRD | Site policy source/version/applicability and generated obligation grammar are explicit; local policy content remains source-linked | Inventing generic order-set templates or hardcoding policy libraries |
| Medication workflow implementation PRD | Due/retiming/hold/refusal/omission/restart/titration semantics and human-owned chart actions are explicit | Full pharmacy, barcode MAR, drug dictionary, dosing decision support, full medication reconciliation |
| Cold-history citation/retrieval eligibility PRD | Citation fields, source state, hot/warm/cold promotion rules, and current-truth constraints are explicit | Selecting vector/semantic/OpenBrain/retrieval architecture prematurely |
| `pi-chart` to `pi-ledger` adapter PRD | Chart substrate claims/actions/evidence/provenance/lifecycle fields are explicit enough to map to the proven ledger interface | Expanding `pi-ledger` kernel or coupling ledger to `pi-chart` brownfield/generated UI/patient directories/hidden simulator |
| Assignment-level nurse brain PRD | Per-patient workflow items, priority tiers, care clusters, handoff/watch, and safety prompts are modeled first | Cross-patient truth merging, silent reprioritization, or assignment dashboard as first substrate |
| Downstream adapter boundary ADR | Maintainers choose a specific adapter seam after product/domain fields stabilize | Backdoor architecture selection inside docs-only issue closeout |

## Adapter-readiness statement

The issue set makes adapter work more legible but does not make adapter work ready to implement. A future `pi-chart` to `pi-ledger` adapter can be considered only when:

1. chart substrate fields are explicit and stable enough to map;
2. claim/action/evidence/provenance/lifecycle/review semantics are documented in implementation-facing terms;
3. derived projection content is excluded from canonical claim persistence unless explicitly promoted;
4. patient/encounter/as-of boundaries are enforceable;
5. adapter tests can prove behavior without importing brownfield UI artifacts, patient directories, generated `_derived` output, or hidden simulator internals;
6. `pi-ledger` remains a reusable kernel consumed through explicit adapters, not a chart-specific dependency bucket.

Until then, ledger language remains future adapter-only.

## Final handoff for future agents

Use this issue set as product/domain context. Do not treat it as permission to implement every named feature.

Safe next move:

- draft a narrow implementation PRD or ADR for one candidate at a time;
- restate allowed and forbidden surfaces;
- include behavior tests that lock clinician-visible contract rather than private storage/UI shape;
- keep human authority and source links visible.

Unsafe next move:

- start backend/storage/retrieval/adapter work directly from these docs;
- map generated UI or `_derived` output into canonical substrate;
- use hidden simulator truth or evaluator labels as chart facts;
- expand `pi-ledger` kernel for chart-specific needs;
- grant the assistant direct write/completion authority;
- build assignment-level orchestration before per-patient workflow semantics are explicit.

## Verification prompts for future work

A future implementation or PRD should prove:

1. every canonical field has source/provenance/timing/lifecycle/review semantics;
2. every projection remains rebuildable and non-authoritative;
3. every assistant suggestion stays provisional until human action;
4. every workflow item shows source, authority, due window, and completion criteria;
5. every mismatch prompt cites competing sources and waits for human resolution;
6. every handoff/carry-forward item is derived/proposed until human finalization;
7. no implementation test depends on hidden simulator internals or generated UI truth;
8. adapter tests consume explicit chart substrate fields and do not modify `pi-ledger` kernel scope.

## Boundary closeout

- [x] Issues 01-14 verified with triage state and parent PRD linkage.
- [x] Clinician-reader and bounded in-chart-assistant framing verified.
- [x] Backend/vector/OpenBrain/storage/runtime/service/graph-index/semantic-search/access-plane/adapter architecture selection remains deferred.
- [x] Hidden `pi-sim` internals and simulator oracle truth remain excluded.
- [x] `pi-ledger` kernel scope is not expanded; ledger language remains future adapter-only.
- [x] Direct agent accepted-writes and autonomous task completion remain out of scope.
- [x] Future PRD/issue candidates listed with preconditions after substrate fields and workflow semantics are explicit.
