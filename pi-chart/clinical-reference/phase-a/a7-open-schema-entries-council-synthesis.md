# A7 open schema entries — council synthesis

Staging file for merge into `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md`.

Source: `a7-nursing-notes-council-synthesis.md` §16. This council version preserves Claude's five durable A7 questions and restores two pressure points from the prior synthesis: provider-notification loop closure and the A7/A8 assessment boundary. It also records one accepted-direction correction from council review: nursing-note `communication` events remain point-shaped (`effective_at` + `data.window`), not interval-shaped `effective_period` events.

## Status triage suggestion

| Status | Anchor |
|---|---|
| **Open** | `a7-subtype-reuse-vs-split`, `a7-focused-note-primitive`, `a7-scope-enforcement`, `a7-handoff-evidence-shape`, `a7-provider-notification-closure`, `a7-preceptor-attestation`, `a7-a8-assessment-boundary` |
| **Accepted direction, pending ADR wording** | no new A7 event type; no new A7 storage primitive; no new A7 source kinds; nursing-note communications use `effective_at` + `data.window` under current ADR 005; nursing notes never carry `fulfills`; no A7-specific URI; no A7-specific current-state axis |
| **Deferred / Phase B** | exact state Nurse Practice Act enforcement, institutional preceptor timing, patient education documentation, incident-report regulatory pathways, patient-facing OpenNotes language policy |

## Cross-cutting index additions

| Theme | Additions |
|---|---|
| Communication-artifact primitive boundary | add `a7-subtype-reuse-vs-split`, `a7-focused-note-primitive`; extends A6 note-pair boundary and A5/A6 split-vs-generic precedent |
| Split vs generic subtypes | add `a7-subtype-reuse-vs-split`, `a7-focused-note-primitive`; explicitly records that `focused_note` is the only A7 subtype growth currently recommended |
| Scope-of-practice enforcement | add `a7-scope-enforcement`; likely recurs in A8, A9a, and orderset/protocol handling |
| Handoff-specific structural obligations | add `a7-handoff-evidence-shape`; links to A6 evidence-in-window and A3/A5 windowed evidence refs |
| Provider-notification / escalation loop closure | add `a7-provider-notification-closure`; cross-links ADR 003 fulfillment, ADR 009 resolves, A3 monitoring plans, and A6 consult/communication closure discipline |
| Teaching / cosignature / attestation chains | add `a7-preceptor-attestation`; nursing parallel to A6 `a6-attestation-primitive` but profile-gated |
| Narrative-vs-structured decomposition | add `a7-a8-assessment-boundary`; extends A6 reasoning-plan coupling and anchors A8 head-to-toe structured ownership |
| Temporal semantics / interval allow-list restraint | add accepted-direction note: A7 communications are point-shaped with `data.window`; do not add `communication.*` to ADR 005 interval allow-list |
| Source-kind restraint | no new question; accepted direction from ADR 006 and A5/A6 precedent |

---

## A7. Nursing notes

### a7-subtype-reuse-vs-split

**Question:** Should A7 reuse A6's shared `communication` subtypes (`admission_note`, `progress_note`, `event_note`, `sbar`, `handoff`, `phone_note`, `attestation`) with `author.role` differentiation, add nursing-specific subtype families (`nursing_progress_note`, `nursing_admission_note`, `nursing_event_note`), or add a separate `shift_note` subtype for end-of-shift nursing narrative?

**Context:** A6 established that notes are `communication` events paired with Markdown bodies; A7 inherits that boundary. The nursing/provider distinction is clinically real, but it appears primarily in validator obligations and structured siblings, not in the communication primitive itself. A nursing `progress_note` cites A3/A4/A5/A8 bedside streams and co-authors nursing-scope `intent.care_plan` or `intent.monitoring_plan`; a provider `progress_note` may co-author `assessment.impression` and provider `intent.order`s. That is a role-and-sibling difference. Duplicating every note subtype into `nursing_*` variants doubles subtype count without changing the primitive. The prior A7 synthesis proposed `shift_note` for interval narrative; council review preferred `progress_note` for shift-progress narrative and `sbar`/`handoff` for receiver-facing accountability transfer.

**Options:**

1. Reuse A6 subtypes; attach nursing-specific validators by `author.role`; use `progress_note` for shift-progress narrative and `sbar`/`handoff` for accountability transfer. Recommended.
2. Add nursing-prefixed subtypes (`nursing_progress_note`, `nursing_admission_note`, etc.). Validator dispatch is easier, but subtype entropy is high and role becomes encoded twice.
3. Add only `communication.shift_note` for end-of-shift synthesis while reusing A6 subtypes otherwise. This preserves the prior synthesis's idea but risks overlap with `progress_note` and `handoff`.
4. Hybrid: reuse shared subtypes where content overlaps, split only where obligations diverge sharply. This is tempting but creates inconsistent subtype semantics.

**Researcher's lean:** Option 1. Author role is the right axis for nursing-vs-provider obligations. `focused_note` is considered separately in Q2 because its shape is concern-centered rather than role-centered. `shift_note` should not be added unless the owner wants a distinct view/rendering affordance for shift-progress notes that cannot be achieved with `progress_note` + `data.window`.

**Validator/view impact if accepted:** V-NNOTE validators dispatch on `(subtype, author.role)`. `narrative()` can filter by `author.role` and subtype. Fixture authoring should avoid `nursing_*` subtypes and avoid `shift_note` unless an ADR accepts it.

### a7-focused-note-primitive

**Question:** Should A7 introduce `communication.focused_note` for DAR (Data-Action-Response), PIE (Problem-Intervention-Evaluation), and SOAPIE-style focused nursing charting, or should focused charting use existing `communication.progress_note` with a payload flag such as `data.focused: true`?

**Context:** Focused nursing notes are not just shorter progress notes. They center on a specific nursing concern — pain, skin, mobility, safety, psychosocial concern, family interaction, protocol invocation — and carry a strict evidence/action/response pattern over a short window. `progress_note` is a broader window synthesis. A `focused_note` subtype lets validators require `data.focus` and at least one trigger/action/response evidence ref without branching on an internal flag. The entropy cost is one new subtype, comparable to A5's split-event decisions when validator obligations differ.

**Options:**

1. Add `communication.focused_note`. Recommended. V-NNOTE focused validators dispatch cleanly by subtype; `timeline()` and `narrative()` filters become clear.
2. Reuse `communication.progress_note` with `data.focused: true`. Lower subtype count, but weaker query semantics and validators branch on payload.
3. Use `progress_note` for some focused notes and `focused_note` for protocol/fall/high-risk concerns. Not recommended because authors will not know when to choose which.

**Researcher's lean:** Option 1. The focused-note shape earns one subtype. It should remain function-specific, not author-prefixed.

**Validator/view impact if accepted:** `communication.focused_note` requires non-empty `data.focus` and evidence refs for trigger/action/response as appropriate. Views can filter focused notes by `data.focus.concern_kind`.

### a7-scope-enforcement

**Question:** How strictly should substrate validators enforce nursing-vs-medical scope boundaries on `assessment.*`, `intent.*`, and action events authored by nursing roles?

**Context:** Nurses author nursing-scope assessments, monitoring plans, care plans, patient-response assessments, and protocol-driven interventions. They generally should not author medical diagnostic impressions or unprofiled prescriptive orders. But scope is state-specific, institution-specific, and credential-specific; advanced-practice nurses and protocol/standing-order contexts further complicate the boundary. A hard substrate error would block legitimate local practice. No enforcement would normalize scope drift. A soft warning with profile escalation preserves the event while surfacing review pressure.

**Options:**

1. Soft warn-not-block by default; institutional profile may raise severity. Recommended.
2. Hard error for replay fixtures, warn in live mode. Stronger data purity; risk of false positives where local scope permits action.
3. Silent at substrate layer; leave all enforcement to institution. Lowest friction; highest risk of semantic drift.
4. Fully profile-driven severity from the start. Most accurate; higher implementation burden.

**Researcher's lean:** Option 1 now, with Option 4 as the implementation endpoint once profiles exist. Default warnings should fire for RN/LPN/CNA/student-authored `assessment.impression`, `assessment.differential`, or `intent.order` without credential/protocol support. Protocol-driven actions should require `source.kind: protocol_standing_order` and a protocol reference.

**Validator/view impact if accepted:** V-NNOTE scope warnings appear in validation output and optionally `openLoops(kind:"scope_review")`; they do not remove or rewrite events.

### a7-handoff-evidence-shape

**Question:** Should SBAR/handoff notes carry structured `data.sbar_sections[]` with per-leg evidence refs, rely on flat `links.supports` with EvidenceRef roles, require explicit receiver acknowledgement actions, or allow acknowledgement by receiving-shift note citation?

**Context:** Handoff is the strongest A7 continuity function. A handoff note must be more than prose with SBAR headings: it must cite active situation/problem context, active plan/recommendation context, and recent observation evidence. Flat `links.supports` is already substrate-native and avoids overfitting SBAR form. Structured `data.sbar_sections[]` could help agent-generated notes, view rendering, and human audit, but it risks turning SBAR into a mini-form. Acknowledgement is related but distinct: the outgoing note may be valid even if the receiving RN has not yet accepted responsibility or documented follow-up.

**Options:**

1. Flat `links.supports` minimum bundle; optional `data.sbar_sections[]`; acknowledgement unresolved/profile-driven. Recommended.
2. Mandatory `data.sbar_sections[]` with section-specific evidence refs. Best structure, highest form creep.
3. Flat `links.supports` only; no acknowledgement semantics. Simpler, but misses handoff accountability.
4. Explicit `action.handoff_acknowledgement` or `communication.handoff_acknowledgement`. Strong loop closure, but new subtype/action pressure.
5. Receiving-shift `progress_note` / first-assessment note citation resolves acknowledgement. No new action, but implicit.

**Researcher's lean:** Option 1. Require the evidence bundle by validator; keep `data.sbar_sections[]` optional. Treat acknowledgement as open/profile-driven until the owner decides whether a new action is worth the entropy cost.

**Validator/view impact if accepted:** V-NNOTE handoff rule checks `links.supports` for at least one active problem/context, one active plan/intent/order context, and one recent observation window/event. `openLoops(kind:"handoff_unacknowledged")` can be profile-gated.

### a7-provider-notification-closure

**Question:** How should pi-chart model “provider notified,” “no new orders,” “provider to bedside,” and callback pending so that escalation loops close without allowing notes to fulfill intents?

**Context:** Nursing notes often contain clinically load-bearing provider communication. Treating “MD notified” as prose-only makes escalation accountability unverifiable. But allowing a `communication` note to fulfill a monitoring plan or order violates ADR 003's action-source fulfillment discipline. The correct center is an `action.notification` event. The note supports the action; the action carries recipient, channel, urgency, reason, response, callback status, and links to the trigger evidence. The action may fulfill a communication-required intent or resolve an escalation loop when that is the loop being closed.

**Options:**

1. `action.notification` is canonical; SBAR/phone/event note supports it; action uses `fulfills` only for communication-required intents and `resolves` for escalation loops. Recommended.
2. `communication.sbar` / `phone_note` directly fulfills notification intents. Not recommended; violates ADR 003/A6 council discipline.
3. Store notification entirely inside note payload. Too weak for open loops and escalation audit.
4. Add specialized `action.provider_notification` subtype. Possibly clearer, but `action.notification` is already sufficient unless payloads diverge sharply.

**Researcher's lean:** Option 1. Keep action-source closure. Use V-NNOTE to warn when note prose/payload says provider was notified but no `action.notification` exists in the same window.

**Validator/view impact if accepted:** New validator V-NNOTE-provider-notification-chain; `openLoops(kind:"provider_notification_chain_incomplete")`; `timeline()` shows action, `narrative()` shows supporting note.

### a7-preceptor-attestation

**Question:** Does A6 `communication.attestation` cover nursing preceptor sign-off for student/orientee notes, or does A7 need a distinct nursing attestation shape?

**Context:** A6's attestation pattern was provider-focused, especially resident/attending. Nursing has a parallel but different context: student nurse, orientee, preceptor, local policy, and sometimes LPN/RN co-review. There is no universal federal nursing analog to teaching-physician billing attestation; the obligation is institutional and jurisdictional. The primitive work is still attestation: one author attests to review/confirmation of another note. That suggests reuse of `communication.attestation` with nursing roles and profile-driven timing.

**Options:**

1. Reuse `communication.attestation`; nursing-specific roles and policy windows in payload/profile. Recommended.
2. Add `communication.preceptor_attestation`. Clearer naming, but unnecessary subtype growth.
3. Model preceptor sign-off as `action.verification`. Better if sign-off is an operational task, weaker as note-to-note attestation.
4. Defer entirely to institutional profile with no substrate shape. Too weak for fixture tests.

**Researcher's lean:** Option 1. Reuse A6 attestation. Add role enums/payload conventions if needed; do not add a new event type.

**Validator/view impact if accepted:** Profile-gated V-NNOTE rule for student/orientee notes; `openLoops(kind:"preceptor_attestation_pending")` closes when an attestation references the primary note.

### a7-a8-assessment-boundary

**Question:** Which nursing-note statements must decompose into A8 structured observations/assessments, and when is narrative-only acceptable?

**Context:** A7 and A8 are adjacent and easy to collapse. Nursing notes often contain assessment text: “lungs coarse,” “skin intact,” “confused,” “pain 7/10,” “ambulated 20 ft,” “pressure injury noted.” Phase A should not let these facts hide only in prose when they are needed for current state, trend, safety loops, or cross-artifact reasoning. A8 should own structured head-to-toe and focused findings; A7 cites and synthesizes. However, imported legacy notes and low-impact narrative context may remain prose-only temporarily, with extraction debt rather than schema distortion.

**Options:**

1. Strict for care-changing facts: if a note statement changes assessment, plan, safety state, monitoring, or response obligations, require/cite structured A8/observation/action/assessment sibling. Recommended.
2. Strict for all exam/finding statements, including stable “WDL” narrative. Too much charting overhead and risks recreating flowsheet checkboxes.
3. Narrative-only allowed for all nursing observations. Too weak; agents cannot reason from buried findings.
4. Profile-driven strictness by subtype: admission/event/focused strict; routine progress flexible. Plausible implementation refinement.

**Researcher's lean:** Option 1, with Option 4 as an implementation refinement. Admission notes should require A8 citation; focused/event notes should require trigger/action/response evidence; routine progress notes should cite material evidence but not force every stable sentence into an event.

**Validator/view impact if accepted:** V-NNOTE admission/A8 citation; focused/event narrative-to-structured coupling warnings; import-only exception with Phase B extraction debt.

---

## Accepted-direction notes not elevated as separate A7 questions

- **No new A7 source kinds.** Existing taxonomy covers nursing authorship and provenance; use `author.role`, `source.ref`, and payload detail.
- **No A7 event/storage primitive.** Notes remain `communication` + Markdown body.
- **No note-level `fulfills`.** ADR 003 holds. Actions fulfill; notes support.
- **No `effective_period` on note communications.** Use `effective_at` + `data.window` unless ADR 005 expands the interval allow-list.
- **No A7 URI scheme.** Use existing event ids, note ids, and inherited windowed URIs (`vitals://`, `io://`, `meddose://`) where prior artifacts define them.
- **No A7 current-state axis.** Nursing notes influence current state through co-authored structured events and views, not through note state.
