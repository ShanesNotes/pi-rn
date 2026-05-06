# Admission proof lifecycle

Status: active clinician-readable reference
Related ADRs:
- `docs/adr/004-validated-claim-field-authority.md`
- `docs/adr/005-append-admission-separates-predicate-policy.md`
- `docs/adr/006-revision-admission-proves-correction-target-existence.md`
- `docs/adr/007-admission-bypass-is-test-only.md`

This page explains the proof steps a Claim must pass before it becomes accepted ledger history.

Clinical summary: the ledger is not asking "is this clinically true forever?" It is asking "is this a well-formed clinical assertion that is allowed to enter this patient's append-only record, with enough proof to preserve safety and traceability?"

## The lifecycle in plain language

| Step | Plain-language meaning | Why it exists |
| --- | --- | --- |
| **Ledger-acceptable Claim** | The Claim is shaped like a kernel Claim and can be deterministically hashed. | Prevents malformed or non-hashable records from becoming evidence. |
| **Validated Claim** | The kernel has one trusted view of the Claim id, predicate, patient, Valid time, Recorded time, object, and revision target. | Prevents modules from rereading raw JSON differently. |
| **Append-admissible Claim** | The Claim belongs to this patient ledger and passes the active Predicate registry policy. | Prevents cross-patient writes and predicate-invalid clinical records. |
| **Revision-admissible Claim** | A correction Claim proves it targets an already accepted same-patient entry by Claim id plus Record hash. | Prevents dangling or wrong-content correction links. |
| **Append ledger entry** | The ledger accepts the proof and assigns store-owned metadata plus hashes and chain links. | Preserves append-only history and tamper evidence. |

## Why base Claims need Append admission

A base Claim is a new clinical assertion. Before it can become accepted ledger history, the kernel must prove:

1. the Claim is structurally valid and canonicalizable;
2. the patient id on the Claim matches the patient ledger being written;
3. the Predicate registry recognizes the predicate and accepts the object shape;
4. the Claim is not secretly a correction that needs target proof.

Only after those checks may `AppendLedger::append_admissible` assign Known time, sequence, batch id, Record hash, Entry hash, previous-entry link, and ledger head.

## Why correction Claims need Revision admission

A correction Claim is also a new Claim, but it carries extra risk: it says another accepted Claim should be corrected.

So a correction must first pass normal Append admission, then pass Revision admission. Revision admission proves the correction target exists in the current same-patient ledger by matching both:

- target Claim id; and
- target Record hash.

The Record hash matters because two records can share an id in a corrupt or mistaken setting but have different clinical content. Matching id plus Record hash ties the correction to the exact content being corrected.

Revision admission does not decide clinical conflict policy, replacement policy, or "latest correction wins" rules. It proves target existence only.

## What remains Append ledger authority

Adapters and Claims do not assign accepted-history metadata. The Append ledger owns:

- **Known time** — when the ledger accepted the Claim;
- **sequence** — patient-local append order;
- **batch id** — store-assigned batch label;
- **Record hash** — hash of canonical Claim content;
- **Entry hash** — hash of the ledger entry envelope;
- **previous-entry link** — append-chain link to prior entry;
- **ledger head** — current chain head.

This separation is intentional. A source system may say when a Claim was recorded, but only the ledger decides when that Claim became known to accepted ledger history.

## What this lifecycle does not do yet

This lifecycle does not implement:

- clinical replacement policy;
- correction conflict resolution;
- latest-correction-wins semantics;
- Predicate registry versioning or historical re-audit;
- chart UI behavior;
- direct agent-accepted write authority.

Those are future Adapter or workflow policies. The current kernel only proves safe append eligibility and preserves tamper-evident history.
