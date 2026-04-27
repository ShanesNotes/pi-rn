Below is my repo-grounded research/design output.

# Recommendation

Use **no JSON schema change now**. Represent review/attestation as **canonical review events** using the existing `type: "action"` envelope, then derive review/accountability state in `memoryProofProjection()`.

The best minimal design is:

1. **Keep authorship/origin canonical in existing fields**: `author`, `source.kind`, and optional `transform`.
2. **Keep lifecycle canonical in existing fields/links**: `status`, `links.supersedes`, `links.corrects`.
3. **Add no top-level `attestation` field yet.**
4. **Use review actions** for human acceptance, verification, rejection, and co-signature.
5. **Generate projection-only metadata** such as `authorship_class`, `generated`, `review_state`, `review_chain`, and `accountable_actor`.

This fits the current repo because the event schema already has the needed envelope axes: `author`, `source.kind`, optional `transform`, `certainty`, `status`, and link relations. Clinical events already require `encounter_id`, `certainty`, `data`, and `links`; top-level event types are closed, but `subtype` and `data` remain open enough to encode review conventions without a schema bump.  The write boundary already enforces provenance, patient scope, schema validation, subject matching, duplicate-id checks, and link target integrity, so a review event can be introduced as a normal append-only claim rather than as a new mutation path. 

The ADR recommendation is: **wait until the Workstream A projection fixture proves the shape**, but add the review-action convention to the Workstream A spec/test plan now. Workstream A already says the memory proof should be one composite view, not a new primitive, and explicitly defers actor attestation behind Workstream A. 

---

# Existing repo facts that constrain the design

pi-chart’s core thesis is already: **the chart is canonical, current state is a query, and derived summaries are disposable**. `_derived/` is not authority; authority is the append-oriented event/note stream. 

The event schema’s existing axes are distinct:

* `author` identifies the concrete writer and supports `run_id` for agent authors.
* `source.kind` is the provenance channel.
* `transform.activity` declares the processing path and is explicitly distinct from both `source.kind` and `author`.
* `certainty` is epistemic grade.
* `status` is lifecycle.
* `links` encode evidence, replacement, correction, fulfillment, addressing, resolution, and contradiction.  

ADR 011 is the key guardrail: `source.kind` answers who/what produced the event, while `transform.activity` answers what processing path produced the payload. ADR 011 also says full PROV-O-style expansion was intentionally rejected; the useful residue was only the small activity-centric `transform` block. 

The validator already has canonical `source.kind` values covering human, device/interface, import, and agent sources, including `nurse_charted`, `clinician_chart_action`, `agent_inference`, `agent_bedside_observation`, `agent_action`, `agent_synthesis`, and `agent_review`. It also already has review-like action status rules for `action:result_review`, `action:constraint_review`, and `action:problem_review`. 

Correction and supersession are already settled: corrections are new events, old records remain on disk, views compute effective state, current-state views hide superseded/corrected events, and `evidenceChain` still includes superseded events so the original reasoning basis is not lost. 

---

# Taxonomy table

The eleven requested labels should **not** become one enum. They belong to five separate axes:

| Label                      | Axis                              | Canonical field or derived projection?                                        | Event-level or projection-level?                                            | Who can set it?                                                             | Required evidence                                                                                    | Validation rule                                                                                                             |
| -------------------------- | --------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `generated`                | Generation path                   | Derived from `source.kind`, `author.role/run_id`, and/or `transform.activity` | Projection-level metadata about an event                                    | Nobody sets directly; writer sets source/transform                          | `source.kind` in agent/import family, or `transform.activity` present                                | Existing schema validates `transform.activity`; validator checks import/normalize coherence and input refs                  |
| `suggested`                | Review disposition                | Derived projection state                                                      | Projection-level                                                            | Nobody sets directly; absence of human review creates it                    | Agent-authored/generated claim with no accepted/verified/rejected/co-signed review action            | Projection rule: agent/generated + live + no review action ⇒ `suggested`                                                    |
| `accepted`                 | Review disposition/accountability | Canonical review event; projection derives state                              | Event-level review action; projection-level state on reviewed claim         | Human reviewer                                                              | `action:*review` or `action:claim_review`; links to reviewed event/note; reviewer author             | Proposed `V-REVIEW-*`: human reviewer, valid target, allowed outcome                                                        |
| `verified`                 | Stronger review disposition       | Canonical review event; projection derives state                              | Event-level review action; projection-level state                           | Human reviewer who checked evidence/source                                  | Review action links to reviewed claim and either cites target evidence or records verification basis | Proposed rule: `verified` requires target + basis or checked evidence                                                       |
| `rejected`                 | Review disposition                | Canonical review event; projection derives state                              | Event-level review action; projection-level state                           | Human reviewer                                                              | Target claim plus rationale; `links.contradicts` when rejection is substantive disagreement          | Proposed rule: `rejected` requires rationale and target; if content is false, use `contradicts` or `corrects` appropriately |
| `co-signed`                | Review/accountability             | Canonical review event; projection derives state                              | Event-level review action; projection-level state                           | Human co-signer                                                             | Target event/note/result plus co-signer author                                                       | Proposed rule: co-signer must be human/clinician; target must exist                                                         |
| `superseded`               | Lifecycle/replacement             | Existing `links.supersedes`; effective status is view-derived                 | Canonical link on replacement event; projection-level status on prior event | Any sanctioned writer; clinically should usually be human or trusted system | Replacement event points to prior event                                                              | Existing/proposed validator: target exists, no cycles, one supersessor                                                      |
| `entered_in_error`         | Lifecycle/error correction        | Existing `status` value and/or `links.corrects` semantics                     | Event lifecycle; projection-level effective status on corrected prior event | Any sanctioned writer; clinically should be human/authorized system         | Correcting event points to erroneous prior event                                                     | Existing status rules forbid contradictory `status_detail`; correction targets must resolve                                 |
| `human-authored`           | Authorship class                  | Derived from existing `author` + `source.kind`                                | Projection-level metadata about event                                       | Human writer via `appendEvent`/note write                                   | Human source kind and human author role                                                              | Existing write boundary requires author/source; future role/source classifier can warn on ambiguity                         |
| `agent-authored`           | Authorship class                  | Derived from existing `author`, `author.run_id`, `source.kind`, `transform`   | Projection-level metadata about event                                       | Agent writer; agents should pass explicit author                            | Agent source kind or agent role/run id                                                               | Existing write boundary requires author/source; `source.kind` validator warns on noncanonical kinds                         |
| `agent-on-behalf-of-human` | Delegation/accountability         | Under-specified today; best as projection or documented author extension      | Projection-level now; possible canonical author subfield later              | Agent at write time, or derived after human acceptance                      | Agent author plus human principal or human acceptance/co-signature                                   | Defer hard validation; possible future `author.on_behalf_of` formalization                                                  |

Important nuance: `accepted`, `verified`, `rejected`, and `co-signed` are **not statuses of the original event**. They are separate review events that create derived state for the reviewed target. `superseded` and `entered_in_error` remain lifecycle/resolution states. `human-authored`, `agent-authored`, and `agent-on-behalf-of-human` remain authorship/accountability classifications.

---

# Interaction and conflict analysis

## A. Event `status`

`status` should remain lifecycle only: `draft`, `active`, `final`, `superseded`, and `entered_in_error`. The schema describes it as the claim’s lifecycle, and ADR/status rules keep domain-specific lifecycle details in `data.status_detail`, not by expanding the envelope enum.  

A claim can be **`final` but unreviewed**. For example, an agent inference can be final in the sense that the agent has completed and written the claim, while still having `projection.review_state = "suggested"` until a human review event exists.

`accepted`, `verified`, and `co-signed` should **not** change the original event’s `status`. They create an attestation layer over it. The original author remains the original author.

`rejected` should also not become an envelope `status`. Rejection is a human disposition toward a claim. It may lead to one of three different graph states:

1. **Rejected as not adopted**: review action with `data.review.outcome = "rejected"`; original remains historical but not projected as current accountable truth.
2. **Contradicted**: review action or new claim carries `links.contradicts` with a basis.
3. **Corrected/entered in error**: new event carries `links.corrects`, meaning the prior claim was wrong and should be treated as error.

## B. `source.kind`

`source.kind` should not become review state. ADR 011 explicitly separates actor/source boundary from processing path, and the validator already treats source kinds as provenance channels, not dispositions.  

Useful derived classes:

* Human-ish: `nurse_charted`, `clinician_chart_action`, `manual_lab_entry`, possibly `admission_intake`.
* Device/interface: `monitor_extension`, `poc_device`, `lab_analyzer`, `lab_interface_hl7`, `pacs_interface`, etc.
* Agent-ish: `agent_inference`, `agent_bedside_observation`, `agent_action`, `agent_synthesis`, `agent_review`.
* Import/fixture: `synthea_import`, `mimic_iv_import`, `manual_scenario`.

`source.kind: agent_review` means the agent produced a review-like event. It does **not** mean a human reviewed the target.

## C. `author.role`

`author.role` identifies the actor role, but it is not currently a closed enum. It can help derive `human-authored` versus `agent-authored`, especially when paired with `source.kind` and `author.run_id`.

For `agent-on-behalf-of-human`, the current materials are slightly inconsistent. ADR 011 says `author.on_behalf_of` already exists for delegation, but the uploaded event schema only explicitly documents `id`, `role`, and `run_id` under `author`; because the schema does not set `additionalProperties: false` for `author`, extra author fields may pass schema validation, but the field is not formally documented in the schema snippet.  

Minimal recommendation: do **not** add a top-level `attestation` field yet. Treat `agent-on-behalf-of-human` as either:

```jsonc
"author": {
  "id": "rn_agent_01",
  "role": "agent",
  "run_id": "run_20260418T0848_01",
  "on_behalf_of": { "id": "rn_amy", "role": "rn" }
}
```

or as a projection result after a human acceptance/co-signature event. Formalize `author.on_behalf_of` only if Workstream A proves it is needed at write time rather than derivable from review events.

## D. `transform.activity`

`generated` should be derived from `transform.activity` and source/author, not stored as a new field. `infer`, `summarize`, `extract`, and `transcribe` describe how the payload was produced; they do not say whether a human accepted or verified it. ADR 011 intentionally added `transform` as an activity-centric processing-path field distinct from `source.kind` and `author`. 

Examples:

* Agent inference: `source.kind = "agent_inference"`, `transform.activity = "infer"`.
* Agent synthesis: `source.kind = "agent_synthesis"`, `transform.activity = "summarize"`.
* Extracted fact from note: `source.kind = "agent_synthesis"` or `agent_inference`, `transform.activity = "extract"`.
* Dictated human note: `source.kind = "dictation_system"`, `transform.activity = "transcribe"`; this may be machine-transformed but not necessarily agent-authored.

## E. `links.supersedes` / `links.corrects`

`supersedes` and `corrects` are already the right tools for replacement/error semantics. The schema defines `supersedes` as replacing prior claims and `corrects` as flagging prior claims as erroneous and replacing them. 

A human rejecting an agent inference is **not automatically** `links.corrects`. If the human merely declines to adopt the inference, it is a review outcome. If the human asserts a different clinical interpretation, use `links.contradicts` with basis. If the human says the prior event was actually wrong and should be treated as error, use `links.corrects`.

ADR 009’s contradiction model is useful here: the later event carries `links.contradicts` pointing at the earlier claim, includes a required `basis`, and the contradiction remains historically visible rather than rewriting the prior event. 

---

# Minimal schema/projection proposal

## Preferred option: Option C + Option D, with no JSON schema change

Use existing `action` events for canonical review, and compute projection metadata.

### Canonical review event convention

For target-specific reviews, prefer existing review subtypes:

* `action:result_review`
* `action:constraint_review`
* `action:problem_review`

For generic agent/note/synthesis review, introduce a **conventional subtype only**, not a top-level type:

* `action:claim_review`

Because `subtype` is open-ended, this does not require schema change. For unregistered subtypes, avoid `data.status_detail` until validator rules are added, because current status-detail validation is subtype-specific. 

Recommended payload convention:

```jsonc
{
  "type": "action",
  "subtype": "claim_review",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-18T09:12:00-05:00",
  "recorded_at": "2026-04-18T09:12:05-05:00",
  "author": { "id": "rn_amy", "role": "rn" },
  "source": { "kind": "nurse_charted" },
  "certainty": "performed",
  "status": "final",
  "data": {
    "review": {
      "outcome": "accepted",
      "rationale": "Matches bedside exam and trend.",
      "accountability": "reviewer"
    }
  },
  "links": {
    "supports": ["evt_agent_synthesis_01"]
  }
}
```

For rejection with substantive disagreement:

```jsonc
{
  "type": "action",
  "subtype": "problem_review",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-18T09:14:00-05:00",
  "recorded_at": "2026-04-18T09:14:05-05:00",
  "author": { "id": "rn_amy", "role": "rn" },
  "source": { "kind": "nurse_charted" },
  "certainty": "performed",
  "status": "final",
  "data": {
    "status_detail": "updated",
    "review": {
      "outcome": "rejected",
      "rationale": "Accessory muscle use present; agent under-called deterioration."
    }
  },
  "links": {
    "supports": ["evt_agent_inference_01"],
    "contradicts": [
      {
        "ref": "evt_agent_inference_01",
        "basis": "Focused respiratory exam showed accessory muscle use and worsening hypoxemia."
      }
    ]
  }
}
```

### Projection metadata

Generated, read-only projection metadata should look like:

```ts
type AuthorshipClass =
  | "human-authored"
  | "agent-authored"
  | "agent-on-behalf-of-human"
  | "device-authored"
  | "imported"
  | "unknown";

type ReviewState =
  | "none"
  | "suggested"
  | "accepted"
  | "verified"
  | "rejected"
  | "co_signed"
  | "superseded"
  | "entered_in_error"
  | "contested";

interface MemoryProofEventMeta {
  event_id: string;
  generated: boolean;
  generation_activity?: "import" | "normalize" | "extract" | "summarize" | "infer" | "transcribe";
  authorship_class: AuthorshipClass;
  review_state: ReviewState;
  review_chain: string[];
  accountable_actor?: {
    id: string;
    role: string;
    basis_event_id: string;
    basis: "author" | "accepted" | "verified" | "co_signed" | "on_behalf_of";
  };
  suppressed_from_current_state?: boolean;
}
```

Projection rules:

1. If an event is superseded or corrected, `review_state = "superseded"` or `"entered_in_error"` regardless of review history.
2. If event is agent/generated and no human review exists, `review_state = "suggested"`.
3. If latest applicable human review is accepted/verified/co-signed/rejected, that outcome becomes `review_state`.
4. If conflicting human reviews exist without a resolving event, `review_state = "contested"`.
5. `accountable_actor` is original human author for human-authored claims, reviewer for accepted/verified agent claims, co-signer for co-signed notes/results, and unset or agent-only for unreviewed agent suggestions.

---

# Workstream A test cases

## A. Agent bedside observation not yet human-reviewed

Event sketch:

```jsonc
{
  "id": "evt_20260418T0820_agent_obs",
  "type": "observation",
  "subtype": "exam_finding",
  "source": { "kind": "agent_bedside_observation", "ref": "run_20260418T0820" },
  "author": { "id": "pi_agent", "role": "agent", "run_id": "run_20260418T0820" },
  "transform": {
    "activity": "extract",
    "tool": "pi-agent-bedside-observer",
    "run_id": "run_20260418T0820",
    "input_refs": []
  },
  "certainty": "observed",
  "status": "final",
  "links": { "supports": [] }
}
```

Expected projection:

```jsonc
{
  "generated": true,
  "authorship_class": "agent-authored",
  "review_state": "suggested",
  "accountable_actor": null,
  "suppressed_from_current_state": false,
  "needs_human_review": true
}
```

Validation expectation: schema-valid if clinical fields are present. Transform is valid as long as `activity/tool` are present and `input_refs` resolve if provided.

## B. Nurse-charted observation

Event sketch:

```jsonc
{
  "id": "evt_20260418T0848_01",
  "type": "observation",
  "subtype": "exam_finding",
  "source": { "kind": "nurse_charted" },
  "author": { "id": "rn_amy", "role": "rn" },
  "certainty": "observed",
  "status": "final",
  "data": {
    "name": "focused_respiratory_assessment",
    "value": [
      "increased work of breathing",
      "mild accessory muscle use",
      "coarse crackles left lower base"
    ]
  },
  "links": { "supports": [] }
}
```

Expected projection:

```jsonc
{
  "generated": false,
  "authorship_class": "human-authored",
  "review_state": "none",
  "accountable_actor": {
    "id": "rn_amy",
    "role": "rn",
    "basis": "author"
  }
}
```

Validation expectation: valid. This matches the Workstream A reuse target: one canonical nurse-charted bedside observation reused across notes, assessments, orders, reviews, care plan, and handoff. 

## C. Agent synthesis accepted by nurse

Agent synthesis event:

```jsonc
{
  "id": "evt_20260418T0855_agent_synthesis",
  "type": "communication",
  "subtype": "handoff_draft",
  "source": { "kind": "agent_synthesis", "ref": "run_20260418T0855" },
  "author": { "id": "pi_agent", "role": "agent", "run_id": "run_20260418T0855" },
  "transform": {
    "activity": "summarize",
    "tool": "pi-agent-handoff-summarizer",
    "run_id": "run_20260418T0855",
    "input_refs": [
      { "kind": "event", "ref": "evt_20260418T0848_01", "role": "primary" }
    ]
  },
  "certainty": "reported",
  "status": "final",
  "links": {
    "supports": ["evt_20260418T0848_01"]
  }
}
```

Nurse acceptance event:

```jsonc
{
  "id": "evt_20260418T0857_nurse_accepts_synthesis",
  "type": "action",
  "subtype": "claim_review",
  "source": { "kind": "nurse_charted" },
  "author": { "id": "rn_amy", "role": "rn" },
  "certainty": "performed",
  "status": "final",
  "data": {
    "review": {
      "outcome": "accepted",
      "rationale": "Synthesis accurately reflects bedside assessment and provider update."
    }
  },
  "links": {
    "supports": ["evt_20260418T0855_agent_synthesis"]
  }
}
```

Expected projection:

```jsonc
{
  "target_event": "evt_20260418T0855_agent_synthesis",
  "generated": true,
  "authorship_class": "agent-authored",
  "review_state": "accepted",
  "review_chain": ["evt_20260418T0857_nurse_accepts_synthesis"],
  "accountable_actor": {
    "id": "rn_amy",
    "role": "rn",
    "basis": "accepted"
  }
}
```

Validation expectation: the communication event may need to be produced through `writeCommunicationNote()` if it is paired with a note, because the write boundary rejects standalone communication writes unless using the sanctioned paired-note path. 

## D. Agent inference rejected

Agent inference:

```jsonc
{
  "id": "evt_20260418T0830_agent_inference",
  "type": "assessment",
  "subtype": "problem",
  "source": { "kind": "agent_inference", "ref": "run_20260418T0830" },
  "author": { "id": "pi_agent", "role": "agent", "run_id": "run_20260418T0830" },
  "transform": {
    "activity": "infer",
    "tool": "pi-agent-inference-engine",
    "run_id": "run_20260418T0830",
    "input_refs": [
      {
        "kind": "vitals_window",
        "ref": "vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:30:00-05:00",
        "role": "primary"
      }
    ]
  },
  "certainty": "inferred",
  "status": "active",
  "data": {
    "name": "mild_worsening_respiratory_trend"
  },
  "links": {
    "supports": [
      {
        "kind": "vitals_window",
        "ref": "vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:30:00-05:00",
        "role": "primary"
      }
    ]
  }
}
```

Human rejection:

```jsonc
{
  "id": "evt_20260418T0849_nurse_rejects_agent_inference",
  "type": "action",
  "subtype": "problem_review",
  "source": { "kind": "nurse_charted" },
  "author": { "id": "rn_amy", "role": "rn" },
  "certainty": "performed",
  "status": "final",
  "data": {
    "status_detail": "updated",
    "review": {
      "outcome": "rejected",
      "rationale": "Focused assessment shows more severe deterioration than agent inference."
    }
  },
  "links": {
    "supports": ["evt_20260418T0830_agent_inference"],
    "contradicts": [
      {
        "ref": "evt_20260418T0830_agent_inference",
        "basis": "Accessory muscle use and SpO2 decline support acute hypoxemic deterioration."
      }
    ]
  }
}
```

Expected projection:

```jsonc
{
  "target_event": "evt_20260418T0830_agent_inference",
  "authorship_class": "agent-authored",
  "generated": true,
  "review_state": "rejected",
  "review_chain": ["evt_20260418T0849_nurse_rejects_agent_inference"],
  "suppressed_from_current_state": true,
  "retained_in_timeline": true,
  "retained_in_evidence_chain": true
}
```

The original inference remains useful evidence of what the agent considered. It should remain in raw timeline/evidence surfaces but should not appear as current accountable clinical truth once rejected.

## E. Co-signed note or result review

Co-signed note/review event:

```jsonc
{
  "id": "evt_20260418T1118_md_cosigns_handoff",
  "type": "action",
  "subtype": "claim_review",
  "source": { "kind": "clinician_chart_action" },
  "author": { "id": "md_lee", "role": "hospitalist" },
  "certainty": "performed",
  "status": "final",
  "data": {
    "review": {
      "outcome": "co_signed",
      "rationale": "Handoff reflects assessment, results, and active plan."
    }
  },
  "links": {
    "supports": [
      "note_20260418T1115_handoff",
      "evt_20260418T1115_handoff_communication"
    ]
  }
}
```

Expected projection:

```jsonc
{
  "target_event": "evt_20260418T1115_handoff_communication",
  "review_state": "co_signed",
  "review_chain": ["evt_20260418T1118_md_cosigns_handoff"],
  "accountable_actor": {
    "id": "md_lee",
    "role": "hospitalist",
    "basis": "co_signed"
  },
  "co_signed_by": [{ "id": "md_lee", "role": "hospitalist" }]
}
```

Validation expectation: `links.supports` can point to event/note ids and the write boundary already validates support references. 

---

# Validator and write-boundary implications

No immediate schema change is required.

Add validator rules later, preferably as warnings first:

```text
V-REVIEW-01
  Any action with data.review.outcome must have at least one reviewed target
  in links.supports or links.contradicts.

V-REVIEW-02
  data.review.outcome must be one of:
  accepted | verified | rejected | co_signed.

V-REVIEW-03
  accepted, verified, rejected, and co_signed human-accountability outcomes
  must be authored by a non-agent reviewer source.kind/author.role.
  Start as warning until role taxonomy is formalized.

V-REVIEW-04
  rejected requires data.review.rationale or links.contradicts[*].basis.

V-REVIEW-05
  verified requires either checked evidence in data.review or a target whose
  own evidenceChain resolves.

V-REVIEW-06
  co_signed requires at least one target event or note and a human/clinician
  reviewer.

V-REVIEW-07
  action:claim_review must not use data.status_detail until a status rule
  is registered for that subtype.
```

Write-boundary impact is small. `appendEvent()` already requires base envelope fields, clinical fields, schema validation, subject isolation, id uniqueness, and link target integrity.  `assertEventIntegrityAtWrite()` already validates `supports`, `supersedes`, `corrects`, `fulfills`, and `addresses` target semantics, which is enough for a first review-action convention. 

---

# Edge-case answers

**Can an event be `final` but unreviewed?**
Yes. `final` means the claim’s lifecycle is complete from the authoring standpoint. It does not mean human attestation exists.

**Can an event be agent-authored and human-verified without changing original author?**
Yes. The original event remains agent-authored. A separate human review event creates `projection.review_state = "verified"` and changes final accountability, not authorship.

**Can a rejected agent inference remain useful as evidence?**
Yes. It remains useful as evidence of agent reasoning, especially in `timeline` and `evidenceChain`. The repo already preserves superseded/corrected events in evidence chains because hiding them would hide the actual reasoning basis. 

**Does human acceptance create a new canonical claim, or only attest to the original?**
If accepted as-is, it attests to the original. If edited, create a new human-authored event that `links.supersedes` the agent draft/synthesis.

**Does co-signature imply authorship, accountability, or both?**
Co-signature implies accountability, not original authorship. The co-signer becomes part of the accountable actor chain; the original author remains unchanged.

**What is the difference between `accepted` and `verified`?**
`accepted` means the reviewer adopts the claim for chart/projection use. `verified` means the reviewer checked the underlying evidence/source and affirms the claim. Verification may imply acceptance in projection priority, but the labels should remain distinct.

**What is the difference between `rejected`, `contradicted`, `corrected`, and `entered_in_error`?**
`rejected` is review disposition. `contradicted` is a graph relation between claims with a basis. `corrected` is a replacement relation saying the prior claim was wrong. `entered_in_error` is lifecycle treatment of a claim that should not be treated as valid chart truth.

**What happens when a human accepts an agent synthesis but edits the content?**
Write a new human-authored synthesis/note that `links.supersedes` the agent synthesis. Optionally also write a review action with `outcome = "accepted"` and `data.review.edited = true`.

**What happens when two humans review the same agent claim with conflicting outcomes?**
Projection should mark the target `review_state = "contested"` unless a later resolving/superseding event disambiguates. Do not silently pick one unless the projection rule explicitly defines a deterministic latest-review policy.

**How should projections pick the final accountable actor?**
Deterministic priority:

1. If corrected/entered-in-error: no accountable current actor for the old claim.
2. If superseded: accountable actor belongs to the replacement chain.
3. If co-signed: co-signer plus original author in accountability chain.
4. If verified: verifying human.
5. If accepted: accepting human.
6. If human-authored and not superseded/corrected: original human author.
7. If agent-on-behalf-of-human: named human principal, if formalized.
8. If agent-authored and unreviewed: no final human accountable actor; mark suggested/unreviewed.

---

# ADR recommendation

Recommendation: **wait until Workstream A projection fixture proves the shape**.

Do not author a schema-changing attestation ADR now. Instead, add this as a Workstream A design note and test target:

```text
Workstream A review/accountability convention:
- Human review is represented by action review events.
- Review outcomes are stored in data.review.outcome.
- Projections derive review_state, authorship_class, generated, review_chain,
  and accountable_actor.
- No top-level attestation field yet.
```

Then author a narrow ADR after Workstream A proves or falsifies the convention.

Proposed ADR title after fixture proof:

```text
ADR 017 — Review actions and projection-derived accountability
```

Scope boundaries:

* In scope: `action:*review` / `action:claim_review` convention, projection metadata, validator rules.
* Out of scope: cryptographic signatures, RBAC, EHR workflow queues, FHIR Task/CarePlan workflow, production co-sign routing.
* Rejected alternative: one giant status/review enum.
* Rejected alternative: top-level `attestation` field before fixture proof.
* Rejected alternative: mutating original events when humans accept/reject them.

Implementation trigger:

* Workstream A includes at least one accepted agent synthesis, one rejected agent inference, and one co-signed note/result.
* `memoryProofProjection()` can deterministically compute review/accountability metadata.
* Golden fixture proves no duplicate canonical bedside observation is needed.

Acceptance criteria:

1. Agent-authored unreviewed claim projects as `suggested`.
2. Human-authored observation projects as human-authored with accountable author.
3. Human acceptance of agent synthesis projects accountable human without changing original author.
4. Rejected inference is suppressed from current accountable state but retained in evidence chain.
5. Co-signed note/result projects co-signer accountability.
6. Supersession/correction still use existing link semantics and are not confused with rejection.

---

# Open questions

1. Should `author.on_behalf_of` be formally added to the schema, or should delegation remain projection-derived from review/co-signature?
2. Is `action:claim_review` the right generic subtype, or should generic review be split into `agent_claim_review`, `note_review`, and `synthesis_review`?
3. Should `verified` imply `accepted` in projections, or should both be separately visible?
4. Should rejected-but-not-contradicted agent suggestions be suppressed from `currentState`, or only from `memoryProofProjection()`?
5. Should `co_signed` support multiple accountable actors as first-class projection output?
6. Should reviewer role/source-kind checks be hard errors or warnings until a role registry exists?

