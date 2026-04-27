# WF-TB1.5 — Open-schema anchor disposition (6-bucket)

## Purpose

This document assigns a disposition to every **Open**-status anchor from
`clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md` (resolution-triage
table, lines 37–42) across six topic buckets so that downstream implementation
and triage lanes have a single, current classification surface.

It mirrors the ledger pattern from `docs/plans/prd-phase-a-completion-to-implementation-bridge.md`
(PHA-TB-1, "Open-schema triage ledger") and uses the same disposition
vocabulary.

## Disposition vocabulary

| Value | Meaning |
|---|---|
| `accepted` | Settled enough to encode in validator/schema/fixtures without further review. |
| `accepted-direction` | Direction is clear; fixture-authoring guidance is safe; full validator/ADR encoding is next. |
| `proposed` | A candidate resolution exists but needs ADR/fixture proof before it is considered settled. |
| `deferred` | Intentionally left for Phase B or a later dedicated ADR lane. |
| `HITL-needed` | Cannot be resolved by research or code alone; requires owner/human decision before any implementation. |

---

## Bucket 1 — Vitals (A3)

Source: `clinical-reference/phase-a/a3-vital-signs-synthesis.md` §16 and
`clinical-reference/phase-a/a3-open-schema-entries-synthesis.md`.

| Anchor | Disposition | Rationale |
|---|---|---|
| `a3-oxygen-context` | `proposed` | Direction is toward `observation.context_segment` interval events with backward-compatible inline-context reads; `currentState(axis:"context")` is explicitly labeled "proposed, not accepted" in the source. A unified cross-artifact currentState-axis ADR must precede encoding. Fixtures may carry legacy inline context in the interim. |
| `a3-alarm-and-artifact-events` | `proposed` | Canonical alarm/pause events are permitted only where audit requirements or fixture evidence require them; derive from monitoring-plan thresholds first. No ADR decision yet. Keep as proposed until a fixture or audit obligation surfaces a concrete need. |

---

## Bucket 2 — MAR / medications (A4, A4b)

Source: `clinical-reference/phase-a/a4-mar-synthesis.md` §16,
`clinical-reference/phase-a/a4-open-schema-entries-synthesis.md`,
`clinical-reference/phase-a/a4b-medication-reconciliation-synthesis.md` §16,
`clinical-reference/phase-a/a4b-open-schema-entries-synthesis.md`.

| Anchor | Disposition | Rationale |
|---|---|---|
| `a4-titration-interval-episode` | `accepted-direction` | Extend ADR 005 with a narrow action-interval allow-list (`action.titration` / `action.continuous_infusion`); optional episode grouping without a new event type. Direction is clear enough for fixture authoring; ADR 005 amendment is the remaining encoding step. |
| `a4-attestation-waste-boundary` | `proposed` | Compact `waste` and `attestations[]` payloads plus policy-profile validators are the lean; separate action subtypes promoted only when fixtures prove independent claim identity is required. Needs fixture evidence before accepting. |
| `a4b-medication-current-state-axes` | `HITL-needed` | Three artifacts (A3 oxygen/context, A4 active medication state, A4b home/discharge medication state) are driving cross-artifact `currentState` axis pressure. Resolution must happen in one unified ADR rather than piecemeal helpers. Accepting any single axis piecemeal would create inconsistent patterns across artifacts; requires owner decision on the unified ADR scope before implementation. |
| `a4b-external-retrieval-source-kinds` | `deferred` | Phase A holds the ADR 006 restraint: no new `source.kind` values in Phase A. Existing source kinds plus `source.ref`, item-level `source_subtype`, `artifact_ref`, and communication evidence carry provenance. A single ADR 006 amendment with A4 device-source questions is the deferred path. |

---

## Bucket 3 — Notes (A6, A7 — note primitive and authoring surface)

Source: `clinical-reference/phase-a/a6-open-schema-entries-council-synthesis.md`,
`clinical-reference/phase-a/a6-provider-notes-council-synthesis.md` §16,
`clinical-reference/phase-a/a7-open-schema-entries-council-synthesis.md`,
`clinical-reference/phase-a/a7-nursing-notes-council-synthesis.md` §16.

| Anchor | Disposition | Rationale |
|---|---|---|
| `a6-note-subtypes` | `accepted-direction` | Split subtypes (`admission_note`, `progress_note`, `consult_note`, `procedure_note`, `event_note`, `attestation`) justified by validator clarity. Fallback if subtype-growth pressure is high: split only the validator-sharp types. Direction is clear for fixture authoring; validator encoding is the next step. |
| `a6-section-and-statement-addressability` | `proposed` | Markdown section anchors plus `EvidenceRef.kind:"note"` with `selection.section` / `selection.heading` / `selection.quote_hash` is the lean; `note://note_id#section_key` is an optional alias. Missing piece is a stable Markdown convention for section keys. Needs a concrete fixture or downstream contradiction-handling need to harden. |
| `a6-attestation-primitive` | `accepted-direction` | `communication.attestation` with `data.attests_to` and `data.attestation_basis` is the accepted shape; `action.attestation` is a poor fit; envelope `cosigners[]` mutates the primary note. May `resolves` an attestation-pending openLoop without mutating the primary note. Direction is clear; profile-driven timing windows and A7 preceptor reuse confirm the pattern. |
| `a6-consult-and-documentation-closure` | `accepted-direction` | Notes never carry `fulfills`; consult/procedure use action closure (`action.notification` or `action.procedure_performed`); documentation-due is a derived openLoop; `communication.attestation` may `resolves` attestation-pending. Dedicated `action.documentation_completed` deferred to A9a unless fixtures prove need. |
| `a6-reasoning-plan-coupling` | `accepted-direction` | Subtype-dependent strictness with severity grading: admission/progress/procedure/consult notes are strict on their obligations; event notes are lighter; imported notes get relaxation. Replay enforces strict; live mode warns or opens loops. Note text/event drift creates warnings or openLoops. Direction is clear for fixture authoring; validator severity-ladder encoding is the next step. |
| `a6-session-coupling` | `deferred` | Hybrid model (implicit grouping + explicit note `references[]` / `links.supports[]` for clinically cited siblings) is the lean; stored `session_id` deferred until a concrete query fails without it. No new `source.kind` values for session. Deferred pending evidence from fixture or view work that requires explicit session identity. |
| `a6-legacy-import-and-generated-provenance` | `deferred` | Narrative-only import uses `data.import_provenance:"narrative_only"` and `data.decomposition_pending:true`; agent-generated notes use `status:"draft"`, `source.kind:"agent_synthesis"`, and `transform.input_refs`. Full NLP extraction at import is Phase B scope. No new `source.kind` values (`provider_note_import`, `copy_forward`) in Phase A. Deferred pending Phase B NLP lane. |
| `a7-subtype-reuse-vs-split` | `accepted-direction` | Reuse A6 subtypes, dispatch validators on `(subtype, author.role)`; use `progress_note` for shift-progress narrative and `sbar`/`handoff` for accountability transfer. Do not add `nursing_*` variants or distinct `shift_note` unless an ADR explicitly accepts them. Direction is clear; A7 validator layer is the encoding step. |
| `a7-focused-note-primitive` | `accepted-direction` | Add `communication.focused_note` requiring non-empty `data.focus` and trigger/action/response evidence refs. The shape earns one subtype; keep it function-specific, not author-prefixed. Direction is clear for fixture authoring; subtype validator enforcement is the encoding step. |
| `a7-scope-enforcement` | `accepted-direction` | Soft warn-not-block by default; profile-driven escalation once profiles exist. Default warnings fire for RN/LPN/CNA/student-authored `assessment.impression`, `assessment.differential`, or `intent.order` without credential/protocol support. Protocol-driven actions require `source.kind: protocol_standing_order` plus a protocol reference. Implementation endpoint is fully profile-driven severity. |
| `a7-handoff-evidence-shape` | `proposed` | Flat `links.supports` minimum bundle (active problem/context + active plan/intent/order + recent observation window) with optional `data.sbar_sections[]` is the lean. Acknowledgement is a profile-driven openLoop candidate until the owner decides whether a new action is worth the entropy. Needs fixture evidence to harden from proposed to accepted-direction. |
| `a7-provider-notification-closure` | `accepted-direction` | `action.notification` is canonical; SBAR/phone/event note supports it; the action carries recipient, channel, urgency, reason, response, callback status, and trigger evidence links. May `fulfills` a communication-required intent or `resolves` an escalation loop. New V-NNOTE rule warns when note text says provider was notified but no `action.notification` exists in the same window. Direction is clear; validator rule V-NNOTE encoding is the next step. |
| `a7-preceptor-attestation` | `accepted-direction` | Reuse `communication.attestation` with nursing-specific `author.role` and profile-driven timing windows; do not add `communication.preceptor_attestation` or `action.verification` unless fixtures prove the reused shape cannot carry the obligation. Profile-gated openLoop closes when an attestation references the primary note. Direction is clear; no new subtype required. |

---

## Bucket 4 — Orders (A9a — within notes/ordering boundary)

Source: `clinical-reference/phase-a/a9a-order-primitive.md` (council synthesis
and §16).

> Note: A9a anchors that appear in the PHA-TB-1 A9a candidate-delta ledger
> (classified there as `accepted-direction`, `proposed`, `deferred`, or
> `HITL-needed`) are not re-classified here. This bucket covers only the A6/A7
> attestation and consult/documentation closure questions that involve order
> primitives at the note/ordering seam. The attestation and closure anchors are
> already represented in Bucket 3. This bucket is intentionally thin to avoid
> duplicating the PHA-TB-1 A9a ledger.

No additional Open-status anchors are uniquely routed to this bucket beyond
what is covered in Bucket 3 (notes) and the A9a candidate-delta ledger in
PHA-TB-1.

---

## Bucket 5 — LDA / I&O (A5)

Source: `clinical-reference/phase-a/a5-io-lda-synthesis.md` §16.

| Anchor | Disposition | Rationale |
|---|---|---|
| `a5-io-event-grammar-and-interval-allow-list` | `accepted-direction` | Split into `observation.intake_event` and `observation.output_event`; extend ADR 005 allow-list for `effective_period` on both. Reject ad-hoc `data.period_start/end` conventions. Direction is clear; ADR 005 amendment and payload validator encoding are the next steps. |
| `a5-io-lda-addressability-and-axes` | `HITL-needed` | `lda://enc/<key>` durable session identity and `io://enc?metric=...&from=...&to=...` windowed evidence grammar are the lean. Axis dispatch (`currentState(axis:"lda")` for active devices; `ioBalance(from,to)` for balance) must be resolved in the unified cross-artifact axis ADR with A3/A4/A4b. The URI grammar ADR cannot be authored by a single artifact lane; it needs an owner decision on the unified ADR scope before any implementation writes `lda://` or `io://` URIs into canonical fixtures or views. |

---

## Bucket 6 — Attestation / scope (A0b, A7/A8 boundary)

Source: `clinical-reference/phase-a/a0b-active-constraints-synthesis.md` §16,
A7/A8 council synthesis.

| Anchor | Disposition | Rationale |
|---|---|---|
| `a0b-read-receipt` | `proposed` | Intent-level `constraint_read_at` plus hash/ref or semantic links to constraint events are the lean; explicit `action.constraint_read` events add volume; external run-id correlation pushes state outside the chart. No ADR decision. Direction is plausible but not settled enough for validator encoding; needs a concrete V-CON-01 / V-ID-09 failing test to drive acceptance. |
| `a7-a8-assessment-boundary` | `accepted-direction` | Strict for care-changing facts: if a nursing-note statement changes assessment, plan, safety state, monitoring, or response obligations, require/cite a structured A8 sibling. Admission notes require A8 citation; focused/event notes require trigger/action/response evidence; routine progress notes cite material evidence but stable narrative ("WDL") need not become events. Imported legacy notes remain narrative-only with extraction debt rather than schema distortion. |

---

## Summary table

| Disposition | Count | Anchors |
|---|---|---|
| `accepted` | 0 | — |
| `accepted-direction` | 12 | `a4-titration-interval-episode`, `a6-note-subtypes`, `a6-attestation-primitive`, `a6-consult-and-documentation-closure`, `a6-reasoning-plan-coupling`, `a7-subtype-reuse-vs-split`, `a7-focused-note-primitive`, `a7-scope-enforcement`, `a7-provider-notification-closure`, `a7-preceptor-attestation`, `a5-io-event-grammar-and-interval-allow-list`, `a7-a8-assessment-boundary` |
| `proposed` | 6 | `a3-oxygen-context`, `a3-alarm-and-artifact-events`, `a4-attestation-waste-boundary`, `a6-section-and-statement-addressability`, `a7-handoff-evidence-shape`, `a0b-read-receipt` |
| `deferred` | 3 | `a4b-external-retrieval-source-kinds`, `a6-session-coupling`, `a6-legacy-import-and-generated-provenance` |
| `HITL-needed` | 2 | `a4b-medication-current-state-axes`, `a5-io-lda-addressability-and-axes` |

Total Open anchors covered: 23.

---

## Anchors requiring special routing note

- **`a4b-medication-current-state-axes` (HITL-needed)** and
  **`a5-io-lda-addressability-and-axes` (HITL-needed)**: both are blocked on
  the same unified cross-artifact currentState/URI-grammar ADR that spans A3,
  A4, A4b, and A5. These should be routed together to an ADR authoring lane
  rather than resolved independently per artifact.

- **`a6-section-and-statement-addressability` (proposed)**: sits at the
  boundary between notes infrastructure (Bucket 3) and the URI grammar ADR
  pressure from Bucket 5. A `note://` serialization alias may be deferred until
  the `io://` / `lda://` ADR lane settles the broader URI grammar.

---

*Doc authored for WF-TB1.5. Do not modify `OPEN-SCHEMA-QUESTIONS.md` based
on this document alone — only `accepted` / `accepted-direction` anchors may be
merged into the canonical register per PHA-TB-1 protocol, and only after HITL
confirmation of the merge step.*
