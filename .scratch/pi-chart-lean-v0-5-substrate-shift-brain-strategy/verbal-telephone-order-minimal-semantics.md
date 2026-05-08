# Verbal/telephone order minimal semantics

Status: ready-for-human
Parent PRD: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`
Source issue: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/10-verbal-telephone-order-minimal-semantics.md`
Depends on:
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/workflow-item-source-authority-grammar.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/human-agent-workflow-boundary.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/medication-timing-retiming-and-clustered-assessment.md`

## Purpose

Define the minimum verbal and telephone order semantics needed for the v0.5 shift-brain/workflow substrate. Nurses sometimes enter or act on a provider order communicated verbally or by telephone. The chart must preserve source, authority, readback, co-sign need, co-sign state, timing, downstream workflow effects, and correction/supersession paths without pretending to be a full CPOE, legal signature platform, compliance engine, role registry, or pharmacy verification product.

A verbal/telephone order is a charted clinical action with accountability caveats. It can generate active downstream order/MAR/workflow tasks when locally sanctioned, but the source and pending co-sign state must remain visible.

## Minimal order record shape

This is product/domain grammar, not a storage schema.

| Field | Purpose | Boundary |
| --- | --- | --- |
| Patient/encounter/as-of scope | Prevents cross-patient/order bleed | Required for every order workflow item |
| Order label/content summary | Human-readable order intent, such as medication, lab, imaging, monitoring, diet/activity, or nursing action | Not a drug dictionary/CPOE model |
| Ordering provider | Names the provider who gave the order | Does not define full provider directory or credentialing registry |
| Entering clinician | Nurse or sanctioned clinician who entered/read back the order | Human chart action, not assistant-authored active order |
| Communication mode | `verbal` or `telephone` | Other messaging/order channels are future scope |
| Received/readback time | When the order was received/read back or entered | Clinical/accountability timing, not backend event design |
| Readback status | `readback documented`, `readback not documented`, or `readback not applicable/unknown` where local policy allows | Keeps caveat visible without enforcing legal policy |
| Co-sign required | Yes/no/unknown according to local workflow or policy | Does not implement policy engine |
| Co-sign state | pending, signed, rejected, modified/superseded, not required, or unknown | Workflow/accountability state, not legal-signature platform |
| Source/evidence refs | Links to order action, note/communication, MAR/task refs, or marks source-needed | Keeps source visible |
| Downstream generated work | Medication due work, lab draw, monitoring task, provider follow-up, MAR/order task, or handoff/watch item | Derived workflow over charted order action |
| Correction/supersession link | Rejected/modified order points to corrected or superseding action | No deletion of clinical history |
| Caveat/supportive display | Shows pending co-sign, missing readback, source-needed, or blocked state without blame | Nonpunitive workflow posture |

## State model

| State | Meaning | Shift-brain posture | Human-owned resolution |
| --- | --- | --- | --- |
| `entered pending co-sign` | Nurse-entered verbal/telephone order exists and co-sign is required but not complete | Active/required with pending accountability caveat | Provider signs, modifies, rejects, or clarification occurs |
| `readback documented` | Readback was documented as part of order communication | Source/authority confidence improves | No separate task unless local workflow requires |
| `readback missing/unknown` | Readback is not documented or unclear | Review caveat; may become prominent if safety/time-sensitive | Human reviews/clarifies/charts according to local workflow |
| `co-sign signed` | Provider co-sign confirms/accepts the order | Caveat clears; downstream work remains from accepted order state | Continue normal order/MAR/workflow handling |
| `co-sign rejected` | Provider rejects the order as entered | Requires correction/supersession path; downstream work should be reviewed | Human charts correction/supersession and resolves downstream tasks |
| `modified/superseded` | Provider or sanctioned workflow changes the order | New order/action supersedes prior one; lineage remains visible | Human follows superseding order and reconciles tasks |
| `cancelled/discontinued` | Order is no longer active through sanctioned workflow | Downstream work should close/carry caveat based on source | Human/provider action owns cancellation/discontinuation |
| `source-needed` | Report/workflow says an order exists but source is not linked | Provisional/review prompt only | Human locates source or leaves as report-only/source-needed |

States should preserve history. Rejection, modification, cancellation, and correction are modeled as lifecycle/correction/supersession events, not deletion.

## Downstream workflow generation

A nurse-entered verbal/telephone order may generate downstream workflow only when the chart has a sanctioned order action/source. Examples:

| Order example | Downstream projection | Caveat |
| --- | --- | --- |
| Telephone potassium replacement order | Medication/MAR due work; lab follow-up if linked | Pending co-sign remains visible until signed/not-required |
| Verbal stat lab order | Lab draw task and result-review open loop | Readback/co-sign caveat visible |
| Verbal monitoring order | Monitoring/cadence task | Does not implement policy library or monitoring engine |
| Verbal hold/restart/retiming instruction | Medication workflow item linked to original order/MAR schedule | Human charts hold/restart/retiming action |
| Telephone transport/procedure prep order | Time-sensitive workflow item | Local policy/procedure details remain out of scope |

Generated workflow items should expose:

- source kind: verbal/telephone order;
- ordering provider and entering clinician;
- readback status;
- co-sign required/state;
- due window/priority tier input;
- completion criteria;
- dependency/block state when pending provider/pharmacy/transport/clarification;
- source refs and correction/supersession lineage.

## Correction and supersession rules

Verbal/telephone order changes should preserve traceability:

- A rejected order is not erased; it is marked rejected and linked to the rejecting provider action when available.
- A modified order creates or points to a superseding order/action.
- A wrong or incomplete entry should be corrected through sanctioned chart correction workflow.
- Downstream workflow tasks generated from a rejected or superseded order should be reviewed, cancelled, corrected, or carried with a caveat by human/sanctioned workflow action.
- The shift brain should show neutral language such as `needs clarification`, `co-sign pending`, `modified/superseded`, `rejected by provider`, `source-needed`, or `blocked / waiting on provider`.

Do not use routine blame language such as nurse failed, noncompliant, ignored, delinquent, or punitive overdue framing.

## Assistant boundary

The assistant may:

- summarize a verbal/telephone order's source, readback status, co-sign state, and downstream workflow effects;
- prompt review when readback or co-sign state is missing or conflicts with active work;
- suggest that a downstream task may need correction when an order is rejected or superseded;
- cite source/evidence refs and timing caveats;
- keep pending co-sign or source-needed state visible in handoff/watch.

The assistant may not:

- create an active verbal/telephone order;
- mark readback complete;
- sign, co-sign, reject, modify, cancel, or supersede an order;
- complete downstream MAR/workflow tasks;
- decide legal validity, credentialing, policy compliance, or provider authority;
- hide pending co-sign/readback/source caveats;
- use hidden simulator/oracle state;
- select backend/storage/adapter architecture.

## Scope exclusions

This slice explicitly excludes:

- full CPOE/order-entry product;
- pharmacy verification;
- barcode MAR;
- drug dictionary or dosing decision support;
- full medication reconciliation product;
- legal signature/compliance platform;
- raw audit/access-control plane;
- provider role/credentialing registry;
- order-set/protocol content library;
- backend, storage, vector, OpenBrain, runtime, access-plane, or adapter design;
- hidden `pi-sim` internals;
- `pi-ledger` kernel expansion.

## Examples

| Scenario | Safe shift-brain wording | Human/sanctioned resolution |
| --- | --- | --- |
| Telephone potassium order pending co-sign | "Telephone order: potassium replacement due soon; readback documented; co-sign pending." | Nurse follows local workflow; provider signs/modifies/rejects |
| Verbal stat lab order with missing readback | "Needs review: verbal stat lab order has readback not documented; verify source before relying on generated task." | Human clarifies/charts per local workflow |
| Provider rejects nurse-entered order | "Order rejected by provider; review downstream tasks generated from this order." | Human corrects/supersedes/cancels related workflow as appropriate |
| Provider modifies telephone med order | "Modified/superseded telephone order; use superseding order for current due work." | Human follows superseding order and reconciles MAR/tasks |
| Handoff includes verbal order but no source | "Report-only verbal order mention; source-needed before active workflow." | Human locates source/charts supported fact or leaves as report-only |

## Verification prompts for later slices

A future implementation or prototype should prove:

1. Verbal/telephone order items carry patient/encounter scope, ordering provider, entering clinician, mode, timestamp, readback status, co-sign requirement/state, and source refs.
2. Pending co-sign is visible on downstream workflow items.
3. Readback missing/unknown is visible as a review caveat.
4. Nurse-entered verbal/telephone orders can generate downstream order/MAR/workflow tasks only from sanctioned chart actions.
5. Rejection, modification, cancellation, and correction preserve lineage and do not delete history.
6. Assistant prompts remain review/suggestion-only and cannot create, sign, reject, modify, cancel, or complete orders/tasks.
7. Full CPOE, pharmacy verification, legal signature platform, role registry, backend/storage/adapter, hidden simulator, and `pi-ledger` kernel work remain out of scope.

## Boundary closeout

- [x] Minimum verbal/telephone order fields and state defined.
- [x] Readback yes/no/unknown and co-sign required/status semantics defined.
- [x] Downstream order/MAR/workflow task generation defined with pending-accountability caveats.
- [x] Rejection/modification handled as correction or supersession, not deletion.
- [x] Review/attestation/accountability language preserved without full legal/compliance scope.
- [x] Full CPOE, pharmacy verification, legal signature platform, and role registry excluded.
- [x] No backend/vector/OpenBrain/storage/runtime/access-plane/adapter decision.
- [x] No hidden `pi-sim` coupling or `pi-ledger` kernel expansion.
