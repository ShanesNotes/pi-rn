# ADR 017 — Actor, attestation, and review taxonomy

Date: 2026-04-24
Status: accepted (2026-04-26)
Decision maker: operator (HITL) on 2026-04-26.
Realized in: commit `ab559f9` (review/attestation projections + V-REVIEW-01..07 + V-ATTEST-01..04).
Related:
- `../memos/deep-research-alignment-24042026.md` §2 M2, §5 C1, §10 Workstream B
- `../memos/pi-chart-v03-memo.md` §7.1
- `006-source-kind-taxonomy.md`
- `010-evidence-ref-roles.md`
- `016-broad-ehr-skeleton-clinical-memory.md`

## Context

Workstream A made pi-chart's memory proof more concrete: one broad fixture can
reuse a bedside observation through review/projection, notes, open loops, and
handoff. That proof also sharpens the next governance gap. `author.role` and
`source.kind` can identify who authored an event and what system/action family
produced it, but they do not answer durable clinical-review questions:

- Was this agent-authored claim merely suggested, or acted on?
- Did a human verify it, co-sign it, reject it, or defer review?
- If rejected, which claim was rejected and what should replace or resolve it?
- Can projections show human review state without mutating the original claim?

The v0.3 memo sketched `communication.attestation.v1`, mostly for cosign. The
deep-research report broadened the requirement to actor, attestation, and review
state. This ADR proposes the taxonomy; it does not implement schema, validator,
profile, or write-path enforcement.

## Decision

Represent review governance as **append-only operational events that point at
ordinary chart claims**, not as mutable fields on the reviewed event.

Pi-chart keeps three separate axes:

1. **Authorship axis** — existing `author` and `source.kind` identify who/what
   created the event and through which provenance family.
2. **Claim lifecycle axis** — existing `status`, `data.status_detail`,
   `supersedes`, `corrects`, `contradicts`, and `resolves` describe the clinical
   claim's own lifecycle and epistemic relationships.
3. **Review governance axis** — new profile-backed operational subtypes record
   verification, attestation, rejection, and deferral as separate events that
   support or contradict the target claim.

Do not add a generic `review_status` or `attested_by` field to every event.
Current review state is a query over linked governance events.

## Taxonomy

### Actor/source interpretation

No new actor primitive is introduced in this ADR.

- `author.id` remains the actor identity known to the chart.
- `author.role` remains the role asserted for that act (`rn`, `md`,
  `rn_agent`, `system`, etc.).
- `source.kind` remains the provenance family (`agent_inference`,
  `agent_action`, `agent_synthesis`, `clinician_chart_action`,
  `nurse_charted`, etc.).

The minimum reader-facing classification is derived:

| Derived class | Typical signal | Meaning |
| --- | --- | --- |
| `human_entered` | human `author.role` + human/source charting kind | Human directly authored chart content. |
| `agent_suggested` | agent author/source + `certainty: inferred/planned` and no fulfilling action | Agent-generated suggestion or interpretation. |
| `agent_actioned` | `source.kind: agent_action` or fulfilling action emitted by an agent | Agent performed or initiated an operational action. |
| `system_imported` | interface/import source kinds | External system produced the raw or normalized fact. |
| `human_reviewed` | governance event points at target | Human verification/attestation/rejection exists. |

This classification is projection logic, not stored state.

### Review event

Use `action.claim_review.v1` for an explicit review of one or more target
claims.

Candidate shape:

```jsonc
{
  "type": "action",
  "subtype": "claim_review",
  "profile": "action.claim_review.v1",
  "effective_at": "...",
  "recorded_at": "...",
  "author": { "id": "rn_smith", "role": "rn" },
  "source": { "kind": "clinician_chart_action", "ref": "review_panel" },
  "certainty": "performed",
  "status": "final",
  "data": {
    "review_decision": "verified", // verified | rejected | needs_revision | deferred
    "reviewed_refs": ["evt_..."],
    "rationale": "matches bedside assessment and monitor trend"
  },
  "links": {
    "supports": [{ "ref": "evt_...", "kind": "event", "role": "primary" }]
  }
}
```

Decision semantics:

| `review_decision` | Semantics | Link guidance |
| --- | --- | --- |
| `verified` | Reviewer accepts target as clinically usable. | `supports` target. |
| `rejected` | Reviewer says target should not be used as stated. | `contradicts` target with basis; MAY `resolves` an open contested loop. |
| `needs_revision` | Target has value but requires correction/supersession. | `supports` target as context and points to follow-up intent/action. |
| `deferred` | Reviewer explicitly declines to decide now. | `supports` target as context; creates or preserves open loop. |

### Attestation event

Use `communication.attestation.v1` when the act is a durable professional
attestation, not just a local review-panel decision. This keeps the v0.3 memo's
attestation sketch but narrows its role.

Candidate shape:

```jsonc
{
  "type": "communication",
  "subtype": "attestation",
  "profile": "communication.attestation.v1",
  "effective_at": "...",
  "recorded_at": "...",
  "author": { "id": "md_jones", "role": "md" },
  "source": { "kind": "clinician_chart_action", "ref": "cosign_panel" },
  "certainty": "performed",
  "status": "final",
  "data": {
    "attests_to": "evt_...",
    "attestation_role": "cosign", // verify | cosign | countersign | witness | scribe
    "on_behalf_of": "rn_smith"
  },
  "links": {
    "supports": [{ "ref": "evt_...", "kind": "event", "role": "primary" }]
  }
}
```

Attestation roles:

| Role | Meaning |
| --- | --- |
| `verify` | Human confirms a claim can be used. Similar to review `verified`, but expressed as attestive communication. |
| `cosign` | Required professional co-sign for another actor's event. |
| `countersign` | Later supervisory or regulatory countersign. |
| `witness` | Witnessed an action or communication without necessarily authoring it. |
| `scribe` | Author records on behalf of another actor; `on_behalf_of` is required. |

### Rejection is not deletion

A rejected claim remains in the append-only stream. Rejection does not mutate the
claim into `entered_in_error` unless the original event itself was authored in
error. A reviewer rejection is a separate clinical/governance claim that can be
queried, projected, resolved, or superseded.

Use:

- `corrects` when a new event fixes an erroneous prior event.
- `supersedes` when a newer claim replaces an older live claim.
- `contradicts` when two visible claims remain in tension.
- `action.claim_review.v1` with `review_decision: rejected` when a reviewer has
  made the rejection itself part of the chart.

## Query/projection contract

Review state is computed by backlinks from governance events to target events.
A future projection MAY expose:

```ts
type ReviewState =
  | { state: "unreviewed" }
  | { state: "verified"; by: string[]; events: string[] }
  | { state: "attested"; role: string; by: string[]; events: string[] }
  | { state: "rejected"; by: string[]; events: string[]; rationale?: string }
  | { state: "deferred"; by: string[]; events: string[] };
```

When multiple governance events point at the same claim, the latest visible
review event as of the query boundary is projection-default, while the full
governance chain remains available through evidence/review views.

## Validation rules for a future implementation

Rule names are reserved here; implementation may adjust numbering only if a
prior ADR consumes the prefix first.

- **V-REVIEW-01.** `action.claim_review.v1` MUST identify at least one target
  through `data.reviewed_refs[]`, and every target MUST also appear in
  `links.supports` or `links.contradicts`.
- **V-REVIEW-02.** `review_decision: rejected` MUST carry `links.contradicts[]`
  with a non-empty basis.
- **V-REVIEW-03.** `review_decision: verified` MUST NOT contradict the same
  target in the same event.
- **V-ATTEST-01.** Attestation events MUST `supports` their target event and
  carry `data.attests_to` matching that target.
- **V-ATTEST-02.** `data.on_behalf_of` MUST differ from `author.id`.
- **V-ATTEST-03.** `attestation_role: scribe` requires `on_behalf_of`.
- **V-ATTEST-04.** Profile-defined gates MAY require N distinct attestation
  events before a target lifecycle transition is accepted. This gate is
  profile/write-path behavior, not a global rule on every event.

## Implementation shape (not authorized by this ADR)

A future implementation ADR should move these together:

1. Add profile docs or profile registry entries for `action.claim_review.v1` and
   `communication.attestation.v1`.
2. Extend schema/types only as needed for `profile` and the subtype payloads.
3. Add validator rules V-REVIEW-* and V-ATTEST-*.
4. Add a backlink query helper, e.g. `reviewState({ scope, eventId, asOf? })`.
5. Thread review state into projections only after the helper exists; do not
   hand-roll review lookup independently in every view.
6. Add a small fixture that reviews or rejects one agent-authored inference.

## Consequences

- The original event stream remains append-only and provenance-native.
- Human review and machine generation become separately queryable without
  overloading `source.kind`.
- Rejection becomes auditable instead of silently deleting or mutating claims.
- Projection output can eventually show whether a claim is unreviewed, verified,
  attested, rejected, or deferred.
- Profile-gated cosign can be added later without forcing every current event to
  participate in governance machinery.

## Alternatives considered

### Add `review_status` fields to every event

Rejected. This would make review state mutable or require rewriting the target
claim whenever review changes. It conflicts with append-only semantics and makes
as-of replay harder.

### Treat all human follow-up as ordinary `communication` notes

Rejected. Notes are readable but not sufficiently queryable. Attestation and
review decisions need typed payloads and validation rules.

### Encode everything in `source.kind`

Rejected. ADR 006 intentionally keeps `source.kind` role-agnostic and
provenance-family oriented. `source.kind` cannot express target-specific review
state.

### Adopt FHIR Provenance/AuditEvent or openEHR AUDIT_DETAILS internally

Rejected. Those standards are useful boundary patterns, but internal pi-chart
claims remain repo-native event envelopes. Boundary adapters can map governance
events outward later.

## Not decided here

- Whether `profile` lands before or with these governance subtypes.
- Which clinical event profiles require cosign before a state transition.
- Whether read-path observability creates separate `AuditEvent`-like rows.
- Legal signature, retention, redaction, or tamper-evident archive policy.
- UI affordances for review panels.
