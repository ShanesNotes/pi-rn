# Clinician-surface derivation guarantee

Status: ready-for-agent
Type: AFK / SPEC artifact (field-definition doc, not a source edit)
Reconciliation posture: adopt
PRD user stories covered: 5 (and supports 21, 22, 24)

## Parent

`.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md` (§3 "The clinician-surface derivation guarantee"; Implementation Decisions: "All clinician surfaces ... are rebuildable, non-authoritative projections over the fact substrate.").

## What to build

A field-definition doc that states, **per clinician surface**, that every label is a **projection over named charted-clinical-fact fields** (defined in Issues 01-12), that **mismatches surface as review prompts**, and that **no surface stores truth or makes an autonomous truth decision**. The five surfaces: **Current Snapshot, Shift Brain, Report View, Handoff View, Chart Review Packet**. Adopts the PRD posture; does not re-decide cross-cutting choices.

### Scaling posture (architect mandate 2026-05-29)

In a hugely data-rich, multi-provider, multi-agent setting these surfaces are read by many concurrent clinicians and agents. The guarantee that makes that safe: surfaces are **pure, rebuildable projections per `(patientId, encounterId, asOf)`** over append-only facts — so any reader at any concurrency rebuilds the same labels from the same facts, and **no surface is a second writable copy** that could diverge. Source/actor/authority stay separable on every surface (source = origin label, actor = who asserted, authority = posture) so multi-provider/multi-agent attribution survives projection.

## The derivation guarantee (applies to all five surfaces)

1. Every surface label is a **deterministic function of named substrate fields** — never new truth, never a stored value on the surface.
2. Surfaces are **rebuildable**: discard and recompute from the substrate yields identical labels for the same `(patientId, encounterId, asOf)`.
3. **Mismatches → review prompts.** Where projected labels disagree with source/freshness/bedside, the surface emits a **review prompt** (Needs review, Source mismatch, May be outdated, Report only, Source needed), never an autonomous resolution. Pi may prompt Review/Verify/Check source/Check bedside; **Reconcile/Resolve remain clinician-owned**.
4. **No autonomous truth decision.** No surface charts, completes, verifies, signs, finalizes a handoff, or upgrades certainty (Pi never upgrades a Concern to a diagnosis).

## Per-surface label → field map

### Current Snapshot (Current Snapshot — view over current-state query as of a time)

| Surface label | Source substrate field(s) |
| --- | --- |
| Source | `source.kind` (controlled vocab, Issue 06) |
| Review state (Needs review / Source mismatch / May be outdated / Report only / Source needed) | review facts (Issue 10) + freshness (`time.recorded_at` vs `asOf`) + `source` |
| As of / Occurred / Charted | `asOf`; `time.valid`; `time.recorded_at` (canonical UTC, Issue 05) |
| Lifecycle status (Active / Updated / Corrected / Replaced / Resolved) | `status` + `revises` lineage (Issue 09) |
| Patient banner / Current visit | `subject.patientId`; `encounterId` (Issue 01) |

### Shift Brain (per-patient shift work surface)

| Surface label | Source substrate field(s) |
| --- | --- |
| Authority (Required / Time-sensitive / Routine / Suggested / Info / Watch-Handoff) | authority posture (Issue 11 group 1) |
| Attention / risk (Needs attention / Review priority / Safety flag / Watch) | attention cue (Issue 11 group 2) |
| Timing (Due now/soon, Delayed, Deferred, Waiting on..., Blocked, Not appropriate now, Carry forward) | timing state (Issue 11 group 3) |
| Care cluster / Suggested cluster | grouping over compatible care items (does not alter source/authority/due/completion) |
| Suggested by Pi · Suggested | suggestion state (Issue 12) |
| Done vs Charted | view-level Done; `Charted` requires sanctioned chart source (Issue 10) |

### Report View (source-linked shift-report context — NOT a chart note / final handoff / paper-sheet authority)

| Surface label | Source substrate field(s) |
| --- | --- |
| High-attention categories | attention cue + authority + access tier (Issue 11) |
| Report only / From handoff | `source.kind` (verbal/report-derived) + review state |
| Linked facts/actions/notes/refs | `evidence`/`EvidenceRef` (Issue 07); never a competing record |

Report View is **projected/linked back to canonical facts/actions/notes/refs** and is **never a competing record**.

### Handoff View (preparing source-linked carry-forward; **human-owned final**)

| Surface label | Source substrate field(s) |
| --- | --- |
| Carry forward / Watch for next shift | explicit carry-forward facts (Issue 11 group 3/1) |
| Unresolved context | open-loop projection (pending intents, contested claims) |
| Final handoff | **clinician-owned** — Handoff View prepares; clinician finalizes |

Carry-forward items are **proposed until the clinician finalizes**; the final handoff remains clinician-owned (no autonomous handoff).

### Chart Review Packet (clinician-facing view over a `ContextPacket`)

| Surface label | Source substrate field(s) |
| --- | --- |
| Compiled context | `ContextPacket` (by reference/hash) over charted facts + projections |
| Source trail / Why am I seeing this? | `evidence`/`EvidenceRef` chain (Issue 07) |
| Freshness / safety floors | `time.*` + packet freshness/omission rules |

The Chart Review Packet is the **clinician-facing view**; the accountable compiled artifact remains the `ContextPacket` (it composes facts by reference/hash, not by copying into a second memory substrate).

## Kernel-mapping note

Surfaces are **chart-internal projections — no kernel fields**. They map to the kernel only transitively, through the substrate fields they read (`predicateId`/`factShape` → kernel `predicate`/`shape`; `object` → kernel `object`; `time.*` → kernel `time.valid`/`time.recorded_at`; `revises` → kernel `revises.target.{id,hash}`; `integrity` → kernel `integrity`). The kernel's `query::point_read` is the analogous trusted-entry projection on the kernel side: "a trusted-entry projection, not Admission or chain validation" — surfaces mirror this discipline (read-only projection, never a write authority). **No surface stores truth; the kernel is not widened.** Under the **accepted shared clinical-truth service north star** (contract-first; private/local gRPC/UDS first transport — `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`, *accepted north star, ADR-promoted*), many concurrent surface readers subscribe via the app/backend to one shared private/internal truth source rather than each holding a writable copy or direct ledger-service connection; this is an ADR-promoted interface guarantee.

## Connector contract

Every surface projection stays `(patientId, encounterId, asOf)`-parameterized and **never hardcodes a patient**. Demo target `patient_002`/`enc_p002_001`; regression target `patient_001`. Rebuildability is testable per patient: recomputing a surface for `patient_001` (regression) and `patient_002` (demo) yields identical labels from identical facts.

## Acceptance checks

- [ ] Covers all five surfaces: Current Snapshot, Shift Brain, Report View, Handoff View, Chart Review Packet.
- [ ] Maps **each** surface's labels to named substrate fields.
- [ ] States every label is a **projection** (rebuildable, deterministic), never stored truth.
- [ ] States **mismatches surface as review prompts** (Pi prompts; Reconcile/Resolve clinician-owned).
- [ ] Asserts **no surface stores truth** and **no surface makes an autonomous truth decision** (no chart/complete/verify/sign/finalize/upgrade-certainty).
- [ ] States Report View is never a competing record; Handoff View final is clinician-owned; Chart Review Packet's accountable artifact remains the `ContextPacket`.
- [ ] Carries a kernel-mapping note: surfaces map only transitively; mirror `point_read` read-only discipline; no kernel widening; cites the **accepted** clinical-truth service north star.
- [ ] Connector signature `(patientId, encounterId, asOf)`; rebuildability testable for `patient_001` and `patient_002`.
- [ ] Reconciliation posture (adopt) and `Status: ready-for-agent` present.

## Open questions (surface, do not answer)

- None blocking adoption. Exact `ContextPacket` omission/safety-floor semantics are existing CONTEXT.md concepts, not re-decided here.

## Blocked by

- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/07-unified-evidence-edge-and-dead-field-closure.md` (Source trail / linked refs)
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/09-lifecycle-vocabulary-and-correction-record-hash.md` (lifecycle labels)
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/10-certainty-reconnection-and-review-attestation-as-separate-facts.md` (review state; Done vs Charted)
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/11-projection-facing-fields-authority-attention-timing-access-tier.md` (authority/attention/timing/access tier)
- `.scratch/pi-chart-per-patient-substrate-field-interface/issues/12-human-agent-suggestion-state-on-the-substrate.md` (Suggested / Add to Shift Brain)
