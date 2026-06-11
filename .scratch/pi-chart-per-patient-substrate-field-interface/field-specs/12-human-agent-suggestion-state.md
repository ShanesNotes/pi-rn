# Field spec 12 — human-agent suggestion state

Status: completed
Parent: `.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md`
Issue: `issues/12-human-agent-suggestion-state-on-the-substrate.md`
Posture: `adopt`

## Suggestion as append-only fact

A Pi suggestion is a charted-clinical-fact instance distinguished by:

- authority posture = **Suggested** (Issue 11)
- `source.kind` = **Suggested by Pi** (Issue 06)
- `author.run_id` = agent-run lineage (Issue 06)

## Lifecycle

| State | Who sets | Recording |
| --- | --- | --- |
| Suggested | Pi agent | The suggestion fact itself |
| Added (promoted) | Human only | Separate fact with `evidence` link |
| Modified | Human only | Separate fact |
| Dismissed | Human only | Separate fact |
| Disabled | Human/config | View suppression only |

Original suggestion is never mutated.

## Add to Shift Brain

Human-only promotion creating a clinician-owned care item — **not** charting truth, **not** `Charted`.

## Disable-ability

Suggestion classes suppressible at view level; substrate unchanged.

## Negative boundaries

- No autonomous accepted-write
- No autonomous completion (Done/Charted/Reviewed/Verified/Signed/handoff)
- No silent canonical memory from visibility or volume
- Holds for many concurrent agents

## Kernel mapping

Chart-internal. Accepted-write boundary enforced upstream of kernel. Suggested facts are not admitted via agent append path. Kernel not widened for provisionality.

North star: clinical-truth service (ADR-promoted).

## Connector

`(patientId, encounterId, asOf)` — demo `patient_002`, regression `patient_001`.