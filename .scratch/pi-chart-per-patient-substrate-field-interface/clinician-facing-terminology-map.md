# Clinician-facing terminology map

Status: draft-for-grill
Context: `pi-chart` per-patient substrate field/interface terminology
Source glossary: `pi-chart/CONTEXT.md`

## Purpose

Map internal `pi-chart` substrate and architecture language to the clinician-facing words UX should show in Shift Brain, Chart Review Packet, Current Snapshot, and related views.

This is a terminology handoff for designers and future PRD/issues. It does not authorize backend, storage, adapter, retrieval, access-plane, or autonomous agent write/completion scope.

## Naming rules

1. Prefer concrete clinical names over substrate names: order, medication, lab result, vital sign, assessment, note, communication, task.
2. Show **Source**, freshness/as-of time, and review state when trust matters.
3. Keep Pi suggestions provisional until clinician action.
4. Keep view-level completion separate from chart documentation.
5. Use nonpunitive language for delayed, deferred, blocked, or not-appropriate work.
6. Do not use UI language that implies hidden chart truth, autonomous Pi authority, or source-free certainty.

## Internal-to-clinician map

| Internal / domain term | Clinician-facing term | Use when | Avoid | Safety boundary |
| --- | --- | --- | --- | --- |
| Provider-facing UI | Clinician-facing UI / clinician-facing language | Naming the broad UX surface for nurses, physicians, APPs, and other clinical users | Provider-facing as umbrella | Reserve provider for ordering, communication, and co-sign authority contexts |
| Canonical chart memory / clinical memory substrate | The chart; Patient chart; Chart record | Referring to chart truth or a specific documented source | Clinical memory in normal UI | Clinicians see chart language; architecture keeps substrate language |
| Charted clinical fact | Concrete clinical label; Source-linked chart item as umbrella | Showing chart substrate content in UI | Claim, charted clinical fact in normal UI | Name the clinical thing and keep source reachable |
| Derived projection | View; concrete view name | Showing computed/read-model surfaces | Projection in normal UI | Views are source-linked and rebuildable, not chart truth |
| Shift-brain projection | Shift Brain | Per-patient shift work surface | Autonomous plan | Shift Brain organizes; clinician judges and owns action |
| One-page nursing report projection | Report View; Shift report as subtitle | Shift report context and high-attention handoff categories | Handoff Sheet as authority; chart note | Source-linked view, not a chart note, finalized handoff, or paper-sheet authority |
| Workflow item | Care item | Row/card in Shift Brain | Workflow item in UI | Only required/time-sensitive care items read as obligations |
| Source hierarchy | Source label | Explaining why a care item exists | Provenance as main UI copy | Source explains origin, not necessarily authority |
| Intents/orders/plans | Order; Plan; Goal; Nursing plan; Protocol | Distinguishing formal instructions, documented direction, targets, nurse-authored intent, and protocol-driven work | Calling every plan an order; calling Pi suggestions plans by default | Pi suggestions become clinician-owned only after action |
| Assessments/problems/working model | Problem; Assessment; Concern; Working diagnosis; Uncertain; Resolved | Showing charted problems, assessments, softer concerns, provisional diagnoses, uncertainty, and resolution | Pi-generated diagnosis; working model in UI | Pi can surface source-linked concern/uncertainty, not upgrade to diagnosis |
| Authority posture | Authority label | Showing Required, Time-sensitive, Routine, Suggested, Info, Watch/Handoff | Ordered as synonym for Required | Ordered is source; Required is action posture |
| Agent suggestion | Suggested by Pi | Pi-created care item/prompt | AI task, agent task | Suggested until clinician adds, modifies, or dismisses |
| Accept suggestion | Add to Shift Brain | Clinician turns Pi suggestion into clinician-owned care item | Accept as generic truth label | Adding to Shift Brain is not charting truth |
| ContextPacket | Chart Review Packet | Clinician-facing compiled context view | Context packet in UI | Accountable compiled artifact remains ContextPacket |
| Current packet/current state | Current Snapshot | Top source-linked current-care view as of time | Current truth | Snapshot is a view, not independent truth |
| Patient/encounter/as-of scope | Patient banner; Current visit; As of | Showing identity, encounter, location, assignment, and freshness on views | Hidden scope metadata only | Prevent wrong-patient and stale-view risk |
| Clinical/recorded/effective time | Occurred; Charted; Last charted; Effective; As of | Showing event time, documentation time, effective order/policy time, and view freshness | Bitemporal terminology in normal UI | Show distinctions when they affect interpretation or safety; Source trail can carry detail |
| Hot context | Current / acute care | Current, safety-relevant, immediate shift reasoning | Hot in normal UI | Access tier, not disease-course claim |
| Warm context | Recent course | Recent trajectory, plans, trends, actions, review history | Warm in normal UI | Supports review; source-linked |
| Cold context | Baseline / history | H&P, prior encounters, chronic conditions, baseline function, old consults | Cold in normal UI | Background does not become current truth without current relevance/source |
| Provenance/evidence refs | Source | Primary trust label | Provenance in normal UI | Evidence/provenance details belong in drill-down/developer docs |
| Artifact refs | Source document; Document; Report; Image; External record | Referencing documents/files/reports/images as source material | Artifact ref in UI | Show type, date/time, author/source, and link when available |
| Evidence chain | Why am I seeing this? / Source trail | Explaining source and relevance | Evidence chain in normal UI | Drill-down explains; does not decide |
| Mismatch/stale/source-needed state | Needs review; Source mismatch; May be outdated; Report only; Source needed | Source uncertainty or conflict | Failure, invalid, untrusted as blanket labels | Review prompt, not truth decision |
| Lifecycle/corrections/supersession | Active; Updated; Corrected; Replaced; Entered in error; Canceled; Discontinued; Resolved | Showing current status and correction posture | Superseded in normal UI | Keep correction/replacement lineage visible in Source trail |
| Clinical attention signal | Needs attention; Review priority; Safety flag; Watch | Showing elevated relevance | Alert unless interruptive alerting in scope | Safety flag only for safety-critical/current-risk posture |
| Care clustering | Cluster care / Care cluster / Suggested cluster | Grouping compatible work | Bundle as primary term | Cluster does not alter source, due time, authority, or completion criteria |
| Handoff projection | Handoff View | Preparing source-linked handoff | Projection in UI | Final handoff remains clinician-owned |
| Carry-forward item | Carry forward / Watch for next shift | Keeping unresolved context visible | Auto-handoff | Proposed until clinician finalizes |
| Communications | Message; Call; Verbal order; Telephone order; Readback; Co-sign needed; Family update; Handoff | Showing concrete communication type | Communication as default UI label | Type-specific labels preserve authority and workflow meaning |
| Verbal report context | From handoff / Report only | Handoff-derived content without chart source | Unverified as accusation | Orients care but is not chart truth |
| Device/import cue | From monitor / From device / Imported | Monitor/device/import source content | Live unless freshness guaranteed | Prompts review; chart truth requires sanctioned source |
| Medication due state | Due now; Due soon; Scheduled; Delayed; Deferred; Held; Refused; Omitted; Given; Administered; Titrating; Waiting on...; Blocked; Bundled with care; Carry forward | Medication/care timing posture | Overdue as routine blame label | Use Given in quick view; Administered for MAR/chart documentation |
| Not clinically appropriate now | Not appropriate now | Clinician judgment reason/state | Skip; hold unless actual order/med hold | Judgment, not failure |
| Bounded in-chart assistant | Pi / Pi, your chart assistant | Clinician-facing assistant | Agent in UI | Pi suggests/explains/cites/prompts; clinician decides |
| Open loop | Pending care / Follow-up needed | Open work and follow-up section/item | Open loop in UI | Nonpunitive, source-linked pending state |
| Done vs charted action | Done; Charted | View-level work marker vs documented chart source | Done / Charted as one state | Done does not prove chart documentation; Charted requires source |
| Review/attestation | Reviewed; Verified; Signed; Co-signed | Review, bedside/source verification, formal signature | Attestation in normal UI | Reviewed, Verified, and Signed are distinct |
| Review prompts | Review; Verify; Check source; Check bedside; Reconcile; Resolve | Prompting action on uncertainty, mismatch, source age, or conflict | Pi resolved/reconciled copy | Pi may prompt review/verification; clinician owns reconcile/resolve |

## Example UI copy

- **Suggested by Pi · Suggested**: “Review downtrending MAP before next titration.”
- **Source:** Vitals flowsheet, 07:40–08:10. **Why am I seeing this?**
- **Add to Shift Brain** · Modify · Dismiss
- **Source mismatch:** “Report says stable BP; recent charted MAP is lower. Review current monitor and goal.”
- **Care item:** “Antibiotic due now.” **Source:** Ordered · MAR. **Authority:** Required. **Timing:** Due now.
- **State:** Waiting on pharmacy / Deferred / Not appropriate now / Carry forward.
- **Handoff View:** “Watch for next shift: central-line dressing change delayed; waiting on patient stability.”

## Boundaries

- No backend-framework/storage/runtime/full-access-plane/vector/OpenBrain decision, beyond the accepted app/backend-mediated, private/internal clinical-truth-service access boundary.
- No adapter implementation or `pi-ledger` kernel expansion.
- No hidden `pi-sim` coupling or oracle truth.
- No direct Pi accepted-writes, charting, verification, completion, or final handoff authority.
- No punitive workflow language.
