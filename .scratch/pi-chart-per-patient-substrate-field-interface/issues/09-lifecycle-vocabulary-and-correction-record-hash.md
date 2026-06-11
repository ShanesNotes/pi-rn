# Lifecycle vocabulary + correction Record-hash

Status: completed
Type: AFK
Reconciliation posture: revise
User stories covered: 18, 19 (supports 3, 7-on-correction-lineage)
Slice: Issue 09 of the per-patient charted-clinical-fact substrate field contract

## Parent

`.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md`

PRD source-of-truth for cross-cutting choices (do not re-decide here): see PRD §2.F (`status`, `revises`), §4 mappability prerequisites (5) and (7), and the Implementation Decisions on lifecycle and corrections ("Correction facts must persist the target's kernel Record hash (`sha256:<64hex>`) alongside the target id; `links.resolves` is given a consumer or dropped").

## Scaling posture (architect, 2026-05-29)

This is the field slice that makes **concurrent multi-agent authorship safe**. In a hugely data-rich, multi-provider setting many distinct providers and many distinct authoring agents will assert, close, and correct facts about the same patient at high volume. The only safe primitive under that load is **append-only + correction-by-new-fact (never mutate)**: a fact is never edited in place; lifecycle change and correction are themselves new charted clinical facts that point back at a prior fact. This slice specifies that discipline. The recomputing Record hash is the mechanism that lets a correction authored by agent B target a fact authored by agent A and still be admissible when the ledger has moved on under concurrent writes — it pins the *exact content* being corrected, not just an id that could have been re-pointed.

## What to build

A SPEC artifact (field-definition doc, NOT a source edit) that does two coupled things:

1. **Completes the `status` lifecycle vocabulary** for the charted clinical fact, and
2. **Specifies the `revises` correction-lineage field**, including the hard new requirement that a correction fact persist the target's kernel **Record hash** (`sha256:<64hex>`) alongside the target id.

The central conceptual move (posture `revise`) is to **separate two things the current model conflates into one append-only history**:

- **Problem resolution** — the clinical situation closed (the problem resolved, the order was discontinued, the alarm cleared). The original fact was *true and remains true history*; it is simply no longer the live state.
- **Wrong-claim correction** — the fact was *mis-asserted* (wrong value, wrong patient-relevant content, entered in error) and a corrected fact replaces it. The original fact is *retained but no longer trusted as content*.

These are different clinician-facing labels, different lineage edges, and different kernel mappings. Today `status` carries `superseded`/`final`/`entered_in_error` and `links` carries `corrects`/`supersedes`/`resolves`, and problem closure has no home — it gets wrongly expressed as `superseded` or `final`. This slice gives resolution its own label and gives correction the kernel-admissible hash.

## Lifecycle status vocabulary (field spec)

Current `Status` enum (`src/types.ts`): `draft | active | final | superseded | entered_in_error`. The clinician-facing **Lifecycle status label** vocabulary (CONTEXT.md, terminology map) is broader: `Active | Updated | Corrected | Replaced | Entered in error | Canceled | Discontinued | Resolved`. The spec reconciles substrate enum → clinician label and assigns each a lineage edge and a kernel posture.

| Lifecycle (substrate value) | Clinician-facing label | Meaning | Lineage edge | Kernel posture | Posture |
| --- | --- | --- | --- | --- | --- |
| `draft` | (not shown as a normal chart item) | Provisional, not yet a sanctioned charted fact. See draft treatment below. | none | **not emitted to kernel** while draft — a draft is not yet an accepted Claim | revise |
| `active` | **Active** | Live, current, trusted state of the fact. | none | base Claim, append-admissible | adopt |
| (projection of `revises` chain) | **Updated** | A newer fact in the same lineage exists; this content was refined, not contradicted. | newer fact `revises` (mode `corrects`) or `supersedes` this one | the *newer* fact is the Claim; this one stays as append-only history | adopt |
| (projection of `revises` chain, correction) | **Corrected** | The prior content was wrong; a corrected fact replaces it. | newer fact `revises.target.{id,hash}` mode `corrects` | newer fact is a **Revision-admissible** correction Claim | revise |
| `superseded` | **Replaced** | A newer fact replaced this one. **Clinician copy says "Replaced", never "Superseded"** (substrate/history language only). | newer fact `supersedes` this one | the newer fact is the live Claim; this is retained history | revise (terminology) |
| `entered_in_error` | **Entered in error** | The fact should never have been asserted; voided but retained for audit. | self-status; optionally a correcting fact | a correction/void Claim; original retained append-only | adopt |
| (new: see below) | **Canceled** | An *intended* fact (order/intent) was canceled before it took effect. | status transition on an `act`/intent fact | a new fact recording cancellation; never mutates the intent | open-question (see OQ-2) |
| (new: see below) | **Discontinued** | An *active* order/intent was stopped going forward (was valid, now stopped). | status transition on an `act`/intent fact | a new fact recording discontinuation | open-question (see OQ-2) |
| `final` | (no standalone clinician label) | Substrate value meaning "no further updates expected to this fact's content." **Must NOT be used to express problem closure.** | none | a content-stable base Claim | revise — stop overloading `final` for resolution |
| **`resolved` (NEW)** | **Resolved** | The **clinical situation** closed: the problem resolved, the concern cleared, the open loop closed. The original fact remains *true history*; it is no longer the live problem. | a **resolution fact** that `resolves` the problem fact (the dead `links.resolves` edge gets this consumer) | the resolution is **a new fact** (shape `interpretation` or `act`, see kernel note); the original problem fact is **not** corrected or replaced — it was correct | **revise (the headline add)** |

### Draft treatment (closes the "`draft` has no view treatment" gap)

`draft` is a real substrate value with no defined surface behavior today. The spec states: a `draft` fact is **not a charted clinical fact yet** — it is provisional and MUST NOT appear in Current Snapshot, Shift Brain care items, Report View, or Handoff View as sanctioned chart content. It may appear only in an explicitly-provisional authoring/compose surface. **A draft is never emitted to the kernel** (it is not an accepted Claim). This dovetails with the human-agent suggestion state (Issue 12): a Pi-`Suggested` provisional fact is the agent-authored cousin of a `draft` — neither is sanctioned chart truth until a human action promotes it. Concurrency note: drafts are agent-local and never enter the shared truth service, so concurrent draft churn never contends for the ledger.

### Problem-resolution vs wrong-claim correction (the headline `revise`)

The two are kept strictly separate:

- **Resolution** uses **Resolved** + a resolution fact via the (now-consumed) `links.resolves` edge. Semantics: *the situation ended.* The original problem fact is retained, was correct, and is **not** revised. Powers the open-loop closure ("Pending care" → closed) and the **Resolved** certainty/lifecycle label.
- **Correction** uses **Corrected**/**Replaced** + `revises`/`supersedes`. Semantics: *the prior assertion was wrong or refined.* Requires the Record hash (below) to be Revision-admissible.

Conflating them is a safety defect: marking a resolved problem as `superseded`/`entered_in_error` would read as "this was never a real problem," erasing true clinical history.

## `revises` correction-lineage field (field spec)

| Field | Source today | Contract shape | Kernel target | Posture |
| --- | --- | --- | --- | --- |
| `revises.mode` | implicit in which of `links.corrects` vs `links.supersedes` was used | `"corrects"` (wrong-claim) — explicit | kernel `revises{mode:"corrects", ...}` | revise |
| `revises.target.id` | `links.corrects: string[]` / `links.supersedes: string[]` (id arrays) | the corrected fact's `id` | kernel `revises.target.id` | adopt |
| **`revises.target.hash` (NEW)** | **absent today** | the corrected fact's kernel **Record hash**, `sha256:<64hex>` | kernel `revises.target.hash` | **revise (hard new requirement)** |

**Hard requirement:** kernel `RevisionAdmissibleClaim::admit` proves the target exists in the current same-patient ledger **by Claim id PLUS Record hash** (ledger public interface, "Correction Claim admission" and "Safe lifecycle" step 4). The hash is `sha256:<64hex>` and **must recompute against the stored target** (`canonical::record_hash`). `pi-chart` `links.corrects`/`links.supersedes` carry only id arrays today — **no target hash**. Therefore: **any correction fact MUST persist `revises.target.{id, hash}`. Without the recomputing Record hash, a correction is NOT Revision-admissible** and the kernel rejects it. The spec declares the contract value is the hash; the *acquisition* of that hash (the chart must learn the kernel's stored Record hash for the target) depends on the canonicalization-id agreement (Issue 08) and is an adapter concern — named as a prerequisite, not implemented here.

Mode note: the kernel correction path is `mode:"corrects"`. "Replaced" (`supersedes`) is clinician/lineage language for content-superseding without the wrong-claim connotation; whether `supersedes` maps to a kernel `corrects` revision or stays a chart-internal lineage edge with no kernel revision is **OQ-1** below — do not invent the answer.

## `links.resolves` — given a consumer (closes the dead-edge gap)

PRD Implementation Decisions: "`links.resolves` is given a consumer or dropped." This slice **gives it a consumer**: `links.resolves` is the edge a **resolution fact** uses to point at the problem fact it closes, driving the **Resolved** lifecycle label and open-loop closure. This is distinct from `links.corrects` (wrong-claim) and `links.supersedes` (content replacement). If a triage reviewer rejects giving `resolves` this consumer, the fallback is to drop the edge and express resolution via a new `interpretation` fact addressing the problem — but the spec's recommendation is **consume it**.

## Kernel-mapping note

- **Lifecycle is not a single kernel field.** The kernel has no mutable status column; lifecycle is **a projection over the append-only lineage**. "Active" = no later fact revises/supersedes/resolves it; "Replaced"/"Corrected"/"Updated"/"Resolved" = derived from the presence and `mode` of later facts. This is exactly why append-only + correction-by-new-fact is mandatory: the kernel never mutates an entry (ledger public interface: "prior entry remains append-only history").
- **Correction** → kernel `revises{mode:"corrects", target:{id, hash}}`, routed through `RevisionAdmissibleClaim::admit` → `append_revision_admissible`.
- **Resolution** is a *new base Claim* (not a revision): an `interpretation` (problem resolved) or `act` (e.g. order discontinued) fact that `resolves`/`addresses` the original. It is append-admissible, not revision-admissible — because nothing was wrong.
- **`entered_in_error`** is the one status that may map to a correction/void revision; whether it is `mode:"corrects"` or a distinct void posture is part of OQ-1.
- **Store-owned, never emit:** the kernel assigns Record hash, Entry hash, prev-link, head, `seq`, `batch_id`, `accepted_at` on append (ledger public interface step 5; PRD §2.D). The chart supplies the *target's* Record hash on a correction (read back from the kernel), but never invents its own append-chain metadata.
- **Scale routing:** because lifecycle is per-patient append-only lineage, the shared clinical-truth service can shard/route by `subject.patientId` and serialize appends per patient ledger, while corrections remain safe across concurrent entry points via the recomputing-hash recheck ("Rechecks target proof against current ledger entries before append"). This follows the **accepted north star, ADR-promoted** pi-ledger-as-service runtime — see `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md` (accepted north star).

## Connector parameterization

Any connector that reads lifecycle/correction state stays **`(patientId, encounterId, asOf)`-parameterized** and never hardcodes a patient. "Live as of t" lifecycle (what is Active/Resolved/Replaced at `asOf`) is computed via `eventCoversAsOf` + the lineage edges. Demo target `patient_002`/`enc_p002_001`; modularity regression `patient_001`.

```
liveLifecycle(patientId, encounterId, asOf) -> { factId, lifecycleLabel, lineage }
```

## Open questions for the architect (do NOT pre-answer)

Co-sign/attestation modeling is resolved by Issues 03/04/10 as separate append-only `act` facts; this lifecycle slice consumes that decision for projection labels.

- **OQ-1 (revise/open-question):** Does clinician **Replaced** (`supersedes`, content-replacement without wrong-claim connotation) map to a kernel `revises{mode:"corrects"}` revision, or is it a chart-internal lineage edge that emits a fresh base Claim with no kernel revision? And does `entered_in_error` map to `mode:"corrects"` or a distinct void posture? The kernel exposes only `mode:"corrects"` today; the chart must not widen the kernel. Surface for decision.
- **OQ-2 (open-question):** **Canceled** and **Discontinued** apply to `act`/intent facts (orders/intents) and have no kernel `status` field. Are they (a) resolution-style new facts via `resolves`, (b) corrections via `revises`, or (c) a new `act` predicate (e.g. `order.discontinue`) recorded as a fresh fact addressing the original? Recommend (c) for discontinuation (it is a real new clinical act) and (a) for cancel-before-effect — but this needs architect sign-off, not a silent pick.
- **OQ-3 (open-question):** How does the chart **obtain** the target's kernel Record hash to persist on a correction, given the chart authors facts before the kernel has accepted them? This is blocked on the canonicalization-id agreement (Issue 08) and the Rust↔TS integration mechanism (out of scope). Flagged as a prerequisite, not solved here.

## Acceptance criteria

- [ ] Lists the **full** lifecycle vocabulary with clinician copy: Active, Updated, Corrected, Replaced, Entered in error, Canceled, Discontinued, **Resolved**.
- [ ] Adds **`resolved`** as a substrate value/label and gives **problem resolution** its own home, separate from `superseded`/`final`.
- [ ] **Separates problem-resolution from wrong-claim correction** explicitly (different label, different lineage edge, different kernel mapping; original retained-as-history vs retained-but-untrusted).
- [ ] States that clinician copy prefers **"Replaced" over "Superseded"** and keeps supersession/correction lineage visible in the Source trail (never mutating the original).
- [ ] Defines a **`draft` treatment**: provisional, excluded from sanctioned surfaces, never emitted to the kernel.
- [ ] Requires correction facts to persist **`revises.target.{id, sha256:<64hex>}`** (the recomputing kernel Record hash) and states that **without it corrections are not Revision-admissible**.
- [ ] Gives **`links.resolves`** a consumer (the resolution fact) or explicitly drops it — no silent dead edge.
- [ ] States the kernel-mapping note: lifecycle is a **projection over append-only lineage** (no mutable kernel status); correction → `revises{mode:"corrects",target:{id,hash}}` via Revision admission; resolution → a new base Claim.
- [ ] Marks store-owned append metadata (Record/Entry hash, prev-link, head, `seq`, `batch_id`, `accepted_at`) as **never-emit** by the chart.
- [ ] Surfaces **OQ-1, OQ-2, OQ-3** as explicit open questions for the architect (no invented answers).
- [ ] Connector example stays `(patientId, encounterId, asOf)`-parameterized with no hardcoded patient (demo `patient_002`/`enc_p002_001`; regression `patient_001`).
- [ ] Marks shared-truth-service-dependent claims as assuming the **accepted** clinical-truth-service north star and cites the accepted service north-star doc.

## Blocked by

- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/08-integrity-field-and-agreed-canonicalization-id.md` — the recomputing Record hash and target-hash acquisition depend on the agreed canonicalization id (`jcs-rfc8785-pi-chart-v1` ↔ kernel `canonical_json`/`record_hash`).
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/03-predicate-id-projection-and-production-registry.md` — resolution facts (`interpretation`/`act`) and discontinuation acts need their predicate ids defined.

## Related (consistency)

- Issues 03/04/10 (review-axis seam) — co-sign/readback/attestation predicate ids and typed `act` object fields for review facts are owned jointly with those slices; Issue 09 lifecycle labels do not collapse review state into `status` mutations.
- Issue 10 (`certainty` + review/attestation as separate facts) — **Resolved** appears in BOTH this lifecycle vocabulary and the certainty/uncertainty surface; the two must agree that a resolved *problem* (lifecycle) and a resolved *uncertainty* (certainty) are the same clinical close, projected on two axes, and neither mutates the original.
- Issue 12 (human-agent suggestion state) — `draft` (this issue) and `Suggested` (Issue 12) are the two provisional, never-kernel-emitted states.
- Issue 11 (projection-facing fields) — timing/open-loop closure consumes the **Resolved** lifecycle.

## Comments
