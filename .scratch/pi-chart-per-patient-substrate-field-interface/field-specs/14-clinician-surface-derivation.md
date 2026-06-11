# Field spec 14 — clinician-surface derivation guarantee

Status: completed
Parent: `.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md`
Issue: `issues/14-clinician-surface-derivation-guarantee.md`
Posture: `adopt`

## Universal guarantee

1. Every label = deterministic function of named substrate fields
2. Surfaces are rebuildable from substrate for same `(patientId, encounterId, asOf)`
3. Mismatches → review prompts (Pi may prompt; Reconcile/Resolve = clinician)
4. No autonomous truth decisions

## Per-surface maps

### Current Snapshot

| Label | Fields |
| --- | --- |
| Source | `source.kind` |
| Review state | review facts + freshness + `source` |
| As of / Occurred / Charted | `asOf`, `time.valid`, `time.recorded_at` |
| Lifecycle | `status`, `revises` |
| Patient / visit | `subject.patientId`, `encounterId` |

### Shift Brain

| Label | Fields |
| --- | --- |
| Authority | Issue 11 group 1 |
| Attention / risk | Issue 11 group 2 |
| Timing | Issue 11 group 3 |
| Suggested | Issue 12 |
| Done vs Charted | view Done; Charted needs sanctioned source |

### Report View

Projected/linked to canonical facts — never a competing record. High-attention from Issue 11 projections.

### Handoff View

Carry-forward explicit facts. Final handoff clinician-owned.

### Chart Review Packet

Clinician-facing view over `ContextPacket` (by reference/hash). Source trail from `evidence`.

## Kernel mapping

Surfaces are chart-internal projections. Kernel contact is transitive through substrate fields. Mirrors `query::point_read` read-only discipline. No kernel widening.

North star: clinical-truth service for shared read subscription (ADR-promoted).

## Connector

`(patientId, encounterId, asOf)` — rebuildability testable on `patient_001` and `patient_002`.