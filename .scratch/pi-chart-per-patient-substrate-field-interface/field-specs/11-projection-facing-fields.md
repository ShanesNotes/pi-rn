# Field spec 11 — projection-facing fields

Status: completed
Parent: `.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md`
Issue: `issues/11-projection-facing-fields-authority-attention-timing-access-tier.md`
Posture: `adopt`

## Connector

```ts
deriveProjectionFacing(patientId, encounterId, asOf) -> { authority, attention, timing, accessTier } per fact
```

Demo: `patient_002` / `enc_p002_001`. Regression: `patient_001`. No hardcoded patient.

All four groups are **chart-internal** — no kernel fields, no kernel widening.

## Group 1 — Authority posture

Authority ≠ `source` ("Ordered" ≠ "Required").

| Label | Source | Derived / explicit |
| --- | --- | --- |
| Required | `predicateId` (act/order) + `source.kind` ∈ {ordered, protocol, unit_policy} | derived |
| Time-sensitive | Required + timing pressure (group 3) | derived |
| Routine | act predicate + `source.kind` ∈ {nursing_plan, chart_derived} | derived |
| Suggested | suggestion state = Suggested (Issue 12) | **explicit** |
| Info | observation/context, no act predicate | derived |
| Watch/Handoff | carry-forward OR Concern/Uncertain | **explicit when carry-forward** |

## Group 2 — Attention / clinical-risk cue

| Label | Source | Derived / explicit |
| --- | --- | --- |
| Needs attention | open-loop/overdue OR `certainty`=Concern | derived |
| Review priority | review mismatch OR stale `time.recorded_at` | derived |
| Safety flag | constraint predicate OR explicit safety assertion | **explicit when asserted** |
| Watch | carry-forward continuity | derived |

## Group 3 — Timing / workflow state

Nonpunitive language only (no failed/noncompliant framing).

| Label | Source | Derived / explicit |
| --- | --- | --- |
| Due now / Due soon | `time.valid` vs `asOf` | derived |
| Scheduled | future `time.valid` | derived |
| Delayed | due passed, no fulfillment/judgment | derived |
| Deferred / Not appropriate now / Waiting on / Blocked | clinician judgment facts | **explicit** |
| Held / Refused / Omitted | med-state facts | **explicit** |
| Given / Administered | `links.fulfills` | derived |
| Carry forward | carry-forward fact | **explicit** |

## Group 4 — Hot/warm/cold access tier

**Access/priority tier only** — not storage, retrieval, vector, OpenBrain, or disease-course.

| Tier | Section | Source | Derived |
| --- | --- | --- | --- |
| Hot | Current / acute | recency + active status + pressure + encounter scope | derived |
| Warm | Recent course | trajectory + review + open loops | derived |
| Cold | Baseline / history | older / prior-encounter facts | derived |

## Derived vs explicit summary

**Derived:** Required, Time-sensitive, Routine, Info; Needs attention, Review priority, Watch; Due now/soon, Scheduled, Delayed, Given/Administered; all access tiers.

**Explicit (append-only facts):** Suggested; carry-forward; safety assertion; judgment/dependency/med-state facts.

No projection label mutates an existing fact.