# Unified evidence edge (EvidenceRef) + dead-field closure

Status: ready-for-human
Type: SPEC (field-definition doc — not a source edit)
Reconciliation posture: revise
PRD user stories covered: 15, 16

## Parent

`.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md` (§2.E `evidence`/`EvidenceRef`/`transform`; Implementation Decisions — "no silent dead fields")

## Companion inputs

- `pi-chart/src/types.ts` — `EvidenceRef`, `EvidenceRole`, `EvidenceKind`, `Links{supports,supersedes,corrects,fulfills,addresses,resolves,contradicts}`, `TransformBlock{input_refs}`, `NoteFrontmatter.references: string[]`.
- `pi-chart/CONTEXT.md` / `clinician-facing-terminology-map.md` — *Source trail*, *Why am I seeing this?*, *Source document*.
- `pi-ledger/docs/ledger-core-public-interface.md` — frozen Claim target (evidence is not a kernel field; revision lineage is `revises.target.{id,hash}`).
- `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md` **(proposed, not accepted)**.

## Scope at scale (architect mandate, 2026-05-29)

In a data-rich, multi-provider, multi-agent setting, the evidence graph is the substrate's *cross-fact* fabric: one fact may be supported by evidence authored by *many different providers and agent runs*. A **single, typed evidence edge** is what keeps that fabric navigable and shardable; a parallel weaker edge (`references: string[]`) fragments it. This issue converges everything onto one edge and forbids silent dead provenance fields, so that no agent-authored evidence is silently dropped at volume.

## What to build

Make `EvidenceRef` the **one** evidence edge across all three fact shapes (envelope / vital / note), and produce an explicit **consumed-or-deferred register** for every declared evidence role/kind and every lineage field the PRD flagged as partially-unconsumed — so there are no silent dead fields.

### A. Converge `NoteFrontmatter.references` onto `EvidenceRef`

`NoteFrontmatter.references: string[]` is a flat, role-less, second-class edge. The contract is the **typed `EvidenceRef`** model already present on envelope facts via `links.supports`.

| Fact shape | Today's evidence edge | Contract evidence edge |
| --- | --- | --- |
| `EventEnvelope` | `links.supports: Array<string \| EvidenceRef>` | `evidence: EvidenceRef[]` (bare strings normalized via `parseEvidenceRef`) |
| `NoteFrontmatter` | `references: string[]` (flat) | `evidence: EvidenceRef[]` — **converged**; flat strings become `{ref, kind}` |
| `VitalSample` | *(none; second-class fact)* | `evidence: EvidenceRef[]` — vitals gain the same one edge so a vital can carry evidence |

`NoteFrontmatter.references` survives only inside the **fixture/export format** (ADR 018, Issue 13) as a lossy projection of `evidence`; the field contract is the one `EvidenceRef` edge. No parallel weak edge in the contract.

### B. `EvidenceRef` shape (kept as the one edge)

| Field | JSON type | Role | Consumed-or-deferred |
| --- | --- | --- | --- |
| `ref` | String | pointer to the evidence (event id, `vitals://` URI, note id, document id) | **consumed** |
| `kind` | String (enum) | what the evidence is | **consumed** (see role/kind register) |
| `role` | String (enum, optional) | how the evidence relates | **consumed-or-deferred** (see register) |
| `basis` | String (optional) | human-readable why-this-is-evidence | **consumed** (Source trail copy) |
| `selection` | object (optional) | which slice of a windowed source was used | **deferred** (see register) |
| `derived_from` | EvidenceRef[] (optional) | nested lineage of derived evidence | **deferred** (see register) |

### C. Consumed-or-deferred register (closes ALL silent dead fields — no exceptions)

**EvidenceKind:**

| `kind` | Status | Note |
| --- | --- | --- |
| `event` | consumed | event-to-event evidence; powers Source trail |
| `vitals_window` | consumed | a time-windowed vitals slice as evidence (e.g. "MAP 07:40–08:10") |
| `note` | consumed | a note as evidence |
| `artifact` | consumed | a *Source document* (report/image/external record) as evidence — consistent with "report visuals as evidence, not substrate" |
| `external` | **deferred** | external-system evidence; kept in the enum, **no consumer specified here** — flag for a future external-record slice, not silently dead |
| `vitals` | **revise → fold into `vitals_window`** | `vitals` vs `vitals_window` is a redundant pair; the contract keeps `vitals_window` (carries selection) and treats bare `vitals` as a lossy alias normalized on read. Flagged as an open naming question below. |

**EvidenceRole:**

| `role` | Status | Note |
| --- | --- | --- |
| `primary` | consumed | the main evidence the fact rests on |
| `context` | consumed | supporting/orienting evidence |
| `counterevidence` | consumed | evidence against; pairs with `links.contradicts` |
| `trigger` | **deferred** | what *prompted* the fact (e.g. an alarm); kept, **no view consumer specified here** — flag for the attention/timing slice (Issue 11), not silently dead |
| `confirmatory` | **deferred** | post-hoc confirming evidence; kept, no consumer specified here — flag for review/verification (Issue 10), not silently dead |

**Lineage / link fields:**

| Field | Status | Disposition |
| --- | --- | --- |
| `transform.input_refs` | **consumed** | the lineage walked to derive `[extracted]`/`[inferred]` provenance; declared consumed by the Source trail (the PRD notes it is "never walked" today — this issue assigns it a consumer) |
| `EvidenceRef.derived_from` | **deferred** | nested evidence lineage; kept, depth-bounded walking deferred to a future evidence-chain-depth slice — not silently dead |
| `EvidenceRef.selection` | **deferred** | sub-slice selection within a windowed source; kept, consumer deferred — not silently dead |
| `links.supports` | **consumed → renamed** | becomes the `evidence: EvidenceRef[]` edge |
| `links.supersedes` | consumed | lifecycle lineage (Issue 09) |
| `links.corrects` | consumed | correction lineage → `revises` (Issue 09) |
| `links.fulfills` | consumed | action/outcome → intent (open-loops projection) |
| `links.addresses` | consumed | intent/action → problem (open-loops projection) |
| `links.contradicts` | consumed | contested-claim machinery |
| `links.resolves` | **revise — open question** | dead edge today. PRD: "given a consumer or dropped." This issue proposes a consumer (problem-closure linkage feeding the `Resolved` lifecycle, Issue 09) but flags the consumer-vs-drop choice as an architect decision below. **Not left silently dead.** |

## Kernel-mapping note

- The evidence graph has **no kernel field**. The kernel models only *revision* lineage (`revises.target.{id,hash}`, Issue 09) and validates content via `predicate`/`object`. Evidence is chart/provenance substrate carried in the fixture/export and, where persisted into the Claim, under a chart-namespaced provenance block — never as a new kernel-validated field. **No kernel widening.**
- Because evidence travels inside the canonicalized Claim body, every consumed evidence field affects the **Record hash** (`canonical.rs`); dropping a field silently would silently change content hashes. This is a second reason no field may be silently dead.
- **Scale dependency:** subscribing many agents to evidence-graph updates (server-streaming) assumes the **proposed** clinical-truth service (`clinical-truth-service-decision-proposal.md`, *proposed — not accepted*). The `EvidenceRef` field shapes are transport-agnostic and do not depend on acceptance.

## Acceptance criteria

- [ ] Doc shows one evidence edge (`evidence: EvidenceRef[]`) across envelope/vital/note facts, with `NoteFrontmatter.references` demoted to fixture/export only.
- [ ] Doc gives a table marking **every** declared `EvidenceKind`, `EvidenceRole`, and lineage field (`transform.input_refs`, `derived_from`, `selection`, every `links.*`) as **consumed** or **explicitly deferred** — no silent dead fields.
- [ ] `links.resolves` is given a proposed consumer (problem closure → `Resolved`) and the consumer-vs-drop choice is surfaced as an open question, not left dead.
- [ ] `transform.input_refs` is assigned a Source-trail consumer (closing the "never walked" gap).
- [ ] Doc states the multi-provider / multi-agent rationale for a single typed edge (one fabric, shardable, no fragmentation).
- [ ] Kernel-mapping note: evidence has no kernel field; carried in fixture/export + chart-namespaced provenance; no kernel widening; evidence affects Record hash.
- [ ] Any at-scale streaming/subscription claim is marked as assuming the **proposed** clinical-truth service and cites the proposal.
- [ ] Connectors stay `(patientId, encounterId, asOf)`-parameterized; no hardcoded patient (demo `patient_002`/`enc_p002_001`; regression `patient_001`).

## Blocked by

- Issue 06 — source/actor vocabulary (evidence `basis`/`kind` lean on the provenance vocabulary).

## Open questions for the architect

1. **`links.resolves`: consumer or drop?** PRD says "given a consumer or dropped." Proposed: consumer = problem-closure edge feeding `Resolved` (Issue 09). Confirm, or drop the edge entirely. (Surfaced, not decided.)
2. **`vitals` vs `vitals_window` EvidenceKind.** Proposed: keep `vitals_window`, alias bare `vitals` on read. Is the redundant `vitals` kind retired in the contract (export-only), or kept as a distinct "whole-metric" reference? (PRD lists both as "partially-unconsumed" — surfaced.)
3. **Deferred-field owners.** `external`, `trigger`, `confirmatory`, `derived_from`, `selection` are deferred with a *named future home* but no committed slice. Should each get its own tracer issue now, or stay parked until a consumer is needed? (PRD allows explicit deferral; ownership is open.)
