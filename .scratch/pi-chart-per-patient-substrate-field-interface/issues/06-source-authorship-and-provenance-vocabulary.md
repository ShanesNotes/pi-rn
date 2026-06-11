# Source, authorship & provenance vocabulary

Status: completed
Type: SPEC (field-definition doc — not a source edit)
Reconciliation posture: revise
PRD user stories covered: 13, 14, 24

## Parent

`.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md` (§2.E Source, authorship & provenance; Implementation Decisions)

## Companion inputs

- `pi-chart/src/types.ts` — current `Author{id,role,run_id?}`, `Source{kind,ref?}`, `TransformBlock` field model.
- `pi-ledger/docs/ledger-core-public-interface.md` — frozen Claim target (`actor` presence-checked; fixtures use `{kind,id}`).
- `pi-chart/CONTEXT.md` / `clinician-facing-terminology-map.md` — *Care item source label*, *Authority label*, *Suggested by Pi*, source-≠-authority rule.
- `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md` **(accepted north star, ADR-promoted)** — the shared clinical-truth service that would host multi-agent authorship at scale.

## Scope at scale (architect mandate, 2026-05-29)

This substrate must work in a **hugely data-rich, multi-provider, multi-concurrent-agent** setting. Source/actor/authority are designed here as three **separable** axes precisely so that *many distinct providers* and *many distinct agents* can author, observe, and correct the same patient's facts without collapsing into one undifferentiated "who." Append-only + correction-by-new-fact (never mutate) is what keeps concurrent authorship safe; this issue does not introduce any mutating field.

## What to build

Define the three separable attribution axes of a charted clinical fact and close the gaps the PRD flagged: `actor.run_id` is unconsumed, `source.kind` is a free string with no controlled vocabulary, and source is silently read as authority.

### The three separable axes (this is the load-bearing decision)

| Axis | Field | Question it answers | Why separable at scale |
| --- | --- | --- | --- |
| **Source (origin)** | `source{kind, ref?}` | Where did this fact *come from*? (system/modality) | One provider's order and one agent's summary can share an origin system; origin ≠ who asserted it |
| **Actor (asserter)** | `actor{kind, id, role?, run_id?}` (from `author`) | Who/what *asserted* it into the chart? | Many distinct human providers AND many distinct agent runs must each be a distinct asserter |
| **Authority (posture)** | care-item **authority label** (Issue 11 / §2.G) | How must the clinician *treat* it — obligation, suggestion, awareness? | Authority is a projection; "Ordered" (source) must never read as "Required" (authority) |

This issue owns **source** and **actor**. Authority is named here only to assert the split; it is specified in Issue 11.

### A. `actor` — who/what asserted the fact (revise `author`)

Rename the canonical-memory role of `author{id,role,run_id?}` to **`actor`** to match the kernel field name, and make `run_id` a **consumed** field.

| Contract field | JSON type | Required | Canonical-memory role | Current pi-chart rep | Clinician label powered |
| --- | --- | --- | --- | --- | --- |
| `actor.kind` | String (enum, see below) | yes | distinguishes human vs agent vs device asserter | *(implicit in `role`)* | drives "Suggested by Pi" vs human authorship |
| `actor.id` | String | yes | stable asserter identity (provider id, agent id, device id) | `author.id` | authorship in Source trail |
| `actor.role` | String | no | clinical role of a human asserter (RN, MD, APP, RT, pharmacist) | `author.role` | provider/co-sign context |
| `actor.run_id` | String | conditional | **agent-run lineage** — the specific Pi run that emitted a `Suggested` fact | `author.run_id` (unconsumed today) | **"Suggested by Pi" provenance**; ties a suggestion to the run that produced it |

**`actor.kind` controlled enum** (multi-provider / multi-agent aware):

| `actor.kind` | Meaning | Scale note |
| --- | --- | --- |
| `clinician` | A human clinical asserter (nurse, physician, APP, RT, pharmacist…) | Many distinct providers; `actor.id` is the sharding key for human authorship |
| `agent` | A Pi / AI agent run asserter | **Many concurrent agents**; `actor.id` = agent identity, `actor.run_id` = the discrete run |
| `device` | A device/monitor/import-pipeline asserter | Device-originated facts still need a named asserter |
| `system` | A deterministic chart-internal process (e.g. projection-materialization writes, if any) | Reserved; chart projections are non-authoritative and normally not asserters |

**`run_id` consumption rule (closes the dead-field gap):** any fact with `actor.kind == "agent"` MUST carry `actor.run_id`. "Suggested by Pi" provenance is derived as a projection over `(actor.kind == "agent", actor.run_id)` plus the suggestion state (Issue 12). `run_id` is therefore **consumed**, not dead substrate. For `actor.kind != "agent"`, `run_id` is omitted.

### B. `source` — origin system/modality with a CONTROLLED vocabulary (revise free-string `source.kind`)

Replace the free-string `source.kind` with a **controlled provenance vocabulary** aligned to the clinician *Care item source label* set (`CONTEXT.md`). Source explains **origin, not authority**.

| `source.kind` (controlled) | Clinician *Source* label | Origin meaning | Authority it does NOT imply |
| --- | --- | --- | --- |
| `ordered` | Ordered | A sanctioned provider/CPOE/ordering-workflow order exists | NOT "Required" — authority is a separate projection |
| `protocol` | Protocol | Accepted unit/clinical protocol-driven origin | NOT auto-required; depends on activation |
| `unit_policy` | Unit policy | Unit/standing-policy origin | NOT a patient-specific obligation by itself |
| `nursing_plan` | Nursing plan | Nurse-authored care intent / shift planning origin | NOT a provider order |
| `patient_family_request` | Patient/family request | Patient- or family-originated request | Awareness, not obligation |
| `suggested_by_pi` | Suggested by Pi | Pi/agent-originated suggestion | Provisional only; never Required (Issue 12) |
| `device_import` | Device/import (From monitor / From device / Imported) | Monitor/device/external-import origin | Prompts review; not chart truth by import alone |
| `chart_derived` | Chart-derived | Projected/derived from existing charted facts | A view-origin cue, never independent truth |
| `report_only` | Report only / From handoff | Verbal/handoff-derived origin without a chart source | Orients care; explicitly NOT chart truth |

`source.ref?` (String, optional) — opaque pointer to the originating record/system (e.g. a MAR line, an order id, a flowsheet window). It is a **provenance pointer, not an evidence edge**; typed evidence rides `EvidenceRef` (Issue 07).

### C. The source ≠ authority split (state once, here)

- **Source** = `source.kind` (origin). **Authority** = a projection (Issue 11), derived from `predicateId` + `source` + review/lifecycle state.
- Invariant: `source.kind == "ordered"` MUST NOT be projected to authority `Required` automatically; "Ordered" is origin, "Required" is action posture. The terminology map's rule ("Ordered is source; Required is action posture") is the source of this constraint — this issue does not re-decide it.
- `source.kind == "suggested_by_pi"` always projects to authority `Suggested` and never higher without the human promotion action (Issue 12).

## Kernel-mapping note

- `actor` → kernel **`actor`**. The frozen kernel (`ledger-core-public-interface.md`) checks **presence only**; fixtures use `{kind, id}` (see `canonical.rs` minimal claim: `"actor": { "kind": "clinician", "id": "rn-1" }`). Contract maps `actor.{kind,id}` directly; `actor.role` and `actor.run_id` are **chart-internal provenance carried through** — they are part of the canonicalized Claim body (so they affect the Record hash) but the kernel does not interpret them. **Do not widen the kernel** to validate them.
- `source` has **no kernel field**. It is chart/provenance substrate carried in the fixture/export and, where it must persist into the Claim, lives under a chart-namespaced provenance block (cf. `provenance` in `canonical.rs` tests) — never a new kernel-validated field. Mapping bends the chart to the frozen target.
- **Scale dependency:** routing/sharding many concurrent agent authors through one shared ledger assumes the **accepted** clinical-truth service north star (`clinical-truth-service-decision-proposal.md`, accepted north star; ADR-promoted). This issue's field shapes are transport-agnostic and do not depend on ADR file placement; only the at-scale concurrent-write routing does.

## Acceptance criteria

- [ ] Doc defines the three separable axes (source / actor / authority) and states the source ≠ authority split explicitly ("Ordered ≠ Required").
- [ ] Doc gives the controlled `source.kind` vocabulary mapped to clinician *Source* labels, with each row noting the authority it does NOT imply.
- [ ] Doc renames `author` → `actor`, gives the `actor.kind` enum, and names `run_id` as **consumed** for "Suggested by Pi" provenance (with the `kind=="agent" ⇒ run_id required` rule).
- [ ] Doc states the multi-provider / multi-agent scale posture: many distinct providers and many distinct agent runs are each distinct asserters; `actor.id` is the human-authorship key, `(actor.id, actor.run_id)` the agent-run key.
- [ ] Kernel-mapping note: `actor` → kernel `actor` (presence-only); `source` has no kernel field; no kernel widening.
- [ ] Any concurrency/at-scale routing claim is marked as assuming the **accepted** clinical-truth service north star and cites `clinical-truth-service-decision-proposal.md`.
- [ ] No connector is hardcoded to a patient; connectors over this substrate stay `(patientId, encounterId, asOf)`-parameterized (demo `patient_002`/`enc_p002_001`; regression `patient_001`).

## Blocked by

- Issue 01 — identity & scope (`subject`/`encounterId` anchors that scope authorship).

## Open questions for the architect

1. **`actor.kind` for device-import vs source overlap.** When a device pipeline asserts a fact, `actor.kind == "device"` and `source.kind == "device_import"` co-occur. Is the device the *asserter* (actor) or only the *origin* (source), with `actor.kind == "system"`? (PRD leaves device authorship posture open; surfaced, not decided.)
2. **Co-author / dual attribution.** At multi-provider scale a fact may be co-asserted (e.g. nurse-entered verbal order with ordering provider). Does `actor` stay single (one asserter, with the ordering provider in `object`/evidence) or become multi-valued? PRD §2.E models a single `actor`; verbal-order co-sign lineage is handled as separate review facts (Issue 10) — confirm.
3. **Controlled-vocab governance at scale.** Who owns the `source.kind` enum as new origins appear across many providers/units — a registry analogous to the `PredicateRegistry` (Issue 03), or a fixed enum frozen here? (Open; PRD names the production registry only for predicates.)
