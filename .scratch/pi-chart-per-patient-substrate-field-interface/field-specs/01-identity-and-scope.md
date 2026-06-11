# Field spec 01 — identity & scope

Status: completed
Parent: `.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md`
Issue: `issues/01-charted-clinical-fact-identity-and-scope-fields.md`
Posture: `adopt` (identity fields map cleanly; encounter match behavior needs revision at implementation time)

## Purpose

Define the identity & scope sub-slice of the canonical charted-clinical-fact field set. This is a **spec artifact only** — no source edits, no adapter work, no kernel widening.

## Field table

| Field (contract) | Canonical-memory role | Clinician-facing label | Current pi-chart representation | Kernel-Claim target | Posture |
| --- | --- | --- | --- | --- | --- |
| `id` | Stable fact identity; link target; sort tiebreaker | (underlies Source trail drill-down) | `EventEnvelopeBase.id` / `NoteFrontmatter.id` (caller-set; filled by `appendEvent` if absent). `VitalSample` has **no `id`** today. | `id` (direct map; caller-set permitted) | `adopt` (vitals gap noted) |
| `subject.patientId` | Per-patient anchor; single subject of every fact | **Patient banner** | `EventEnvelope.subject` / `NoteFrontmatter.subject` / `VitalSample.subject` (same field, flat string). `PatientScope.patientId` is read-path directory scope, **not a second source**. | `subject.patientId` (direct map; kernel `PatientMismatch` if `!=` ledger patient) | `adopt` |
| `encounterId` | Per-encounter partition | **Current visit** | `encounter_id?: string` optional on `EventEnvelopeBase`; required on `ClinicalEvent` / `NoteFrontmatter` / `VitalSample`. Matched by wildcard in `eventMatchesEncounter`. | `object.encounterId: string` — predicate `RequiredField`, **not** kernel subject | `adopt` field / `revise` match behavior |

## Single-anchor rule (`subject`)

`subject` is the one patient anchor. All three shapes must expose the same contract field `subject.patientId`.

`PatientScope.patientId` is a **read-path routing key** that must equal `subject.patientId` for every fact returned. A reader that returns a fact whose `subject` differs from the scoped patient is a leak (mirror of kernel `PatientMismatch`).

## Kernel mapping (load-bearing)

Patient is **subject**; encounter is **object content**:

- `subject.patientId` → kernel `subject.patientId` (ledger shard selector)
- `encounterId` → kernel `object.encounterId: string` (predicate-enforced via `RequiredFields` / `validate_object`)

The adapter performs placement; this spec declares targets only. The frozen K0–K12 interface is not widened.

## Defect — `encounterId` wildcard leak

Current behavior (`pi-chart/src/views/active.ts`):

```ts
export function eventMatchesEncounter(ev, encounterId) {
  return !encounterId || typeof ev.encounter_id !== "string" || ev.encounter_id === encounterId;
}
```

When `encounter_id` is absent on a base envelope, the fact matches **every** encounter filter and leaks into encounter-scoped views.

**Contract-level fix (implementation deferred):**

- Single-encounter facts **must** carry `encounterId`.
- Cross-encounter / structural facts **must** declare scope explicitly (proposed: `encounterScope: "cross-encounter"` — open question; see below).
- Encounter-scoped readers return a fact only when `encounterId` equals the filter **or** scope is explicitly cross-encounter. **Absence is not a match.**

## Connector signature

Every connector stays `(patientId, encounterId, asOf)`-parameterized:

```ts
function connect(patientId: string, encounterId: string, asOf: string): Projection;
```

- Demo target: `patient_002` / `enc_p002_001`
- Regression target: `patient_001`
- No connector hardcodes a patient id

## Scaling posture

- `subject.patientId` — shard/route key for per-patient ledgers at scale
- `encounterId` — per-encounter partition within a patient; crisp scoping prevents cross-encounter bleed under concurrent authorship
- `id` — caller-set, globally stable; append-only correction-by-new-fact (Issue 09) keeps concurrent writes safe

Accepted north-star runtime: clinical-truth service (ADR-promoted) — `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`. This spec does not implement storage.

## Open questions (not decided here)

| Item | Posture | Note |
| --- | --- | --- |
| Cross-encounter declaration field | `open-question` | Proposed `encounterScope: "single" \| "cross-encounter"` or sentinel `encounterId: "*"` |
| `VitalSample.id` | `open-question` | Promote `sample_key` or mint new `id` in vitals-lift slice |

## Out of scope

- Editing `pi-chart/src/`
- Adapter or Rust↔TS integration mechanism
- Kernel widening