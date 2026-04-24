# patient_001 Phase A fixture scaffold

Status: narrow seed, not completed broad EHR fixture.

`patient_001` is currently a respiratory-decompensation teaching case used to
exercise the claim stream, vitals windows, evidence chains, open intents, and
basic note/communication flow. It is valid chart data, but it is not yet the
coherent broad EHR skeleton described by
`clinical-reference/broad-ehr-skeleton.md`.

Do not use this patient as evidence that Phase A breadth is complete.

## Current coverage

| Surface | Current state |
| --- | --- |
| Patient baseline / encounter | Present in `patient.md` and `timeline/2026-04-18/encounter_001.md`. |
| Constraints | Present as `constraints.md`; canonical event-stream constraint assertions from A0b are not yet fully represented. |
| Vitals / flowsheet | Present as a short monitor-derived SpO2/HR/RR/BP deterioration trend. Oxygen context is still inline on vitals rows; A3 proposes `observation.context_segment` as the canonical stable-context form. |
| Assessment | Present as an agent-authored respiratory trend assessment citing vitals windows. |
| Intent / care plan | Present as one active care-plan intent. |
| Communication / note | Present as one SBAR communication note. |

## Missing for broad skeleton

| Surface | Needed before calling this a Phase A broad fixture |
| --- | --- |
| A0a baseline depth | Structured baseline axes from A0a: weight/height/PBW-relevant fields, baseline cognition/function, encounter transfer/location events if used. |
| A0b constraints | Event-stream `assessment.constraint` assertions with support evidence and review actions, not only the structural `constraints.md` snapshot. |
| A0c problems | Active `assessment.problem` events for pneumonia/hypoxemia or equivalent, with `links.supports` evidence and downstream `links.addresses` targets. |
| A1 labs | At least one lab result sequence that changes interpretation or closes/creates a loop, e.g. CBC/BMP/lactate/ABG. |
| A2 result review | At least one `action.result_review` over a clinically meaningful result or diagnostic artifact. |
| A3 context | Stable oxygen-delivery context as an interval event or a documented compatibility bridge from inline vitals context. |
| A4 MAR | Medication order/action chain showing antibiotics, holds, administrations, response obligations, or adverse/contraindication handling. |
| A4b reconciliation | Home-medication list and at least one admission reconciliation decision, especially around lisinopril/antihypertensive hold vs continue. |
| A5 I&O / LDAs | Intake/output and line/device context if the scenario becomes ICU or sepsis/shock focused. |
| A6/A7 notes | Provider and nursing narrative breadth beyond the single SBAR note. |
| A8 nursing assessment | Focused or head-to-toe assessment findings not visible in vitals alone. |
| A9 orders | Individual order and/or orderset shapes that connect to A1/A2/A4/A5 loops. |
| Memory proof projection | Deterministic derived projection answering what happened, why it mattered, evidence, uncertainty, open loops, and next-shift handoff. |

## Fixture authoring rule

Add breadth only when the corresponding Phase A artifact has a source file and
any open-schema decisions needed for that surface are either implemented or
explicitly carried as provisional fixture assumptions.

Do not encode hidden simulator physiology in this chart. Only public
observations, chart events, communications, artifacts, and adapter outputs may
enter `patient_001`.
