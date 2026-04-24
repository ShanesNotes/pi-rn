# Broad EHR skeleton for clinical memory

Status: accepted reference direction via `decisions/016-broad-ehr-skeleton-clinical-memory.md`.

This is the clinical reference contract for the first broad EHR skeleton.
It is not a full EHR product spec. It defines the minimum observable
clinical context needed to test whether pi-chart is useful as clinical
memory for an agent harness.

## North star

A bedside clinician should be able to review chart memory and quickly
answer:

- What changed?
- Why did it matter?
- What evidence supports that interpretation?
- What remains uncertain?
- What is pending or needs follow-up?
- What should the next clinician or agent watch next?

The first burden to reduce is documentation burden: bedside observations
should become auditable chart memory once, then be projected into note,
review, open-loop, and handoff views without duplicative manual prose.

## Minimum viable surface matrix

The broad skeleton must be one coherent fixture story, not six unrelated
examples.

| Surface | Clinical purpose | Example first fixture item | Source / provenance | Evidence or open-loop contribution | Current primitive / gap |
| --- | --- | --- | --- | --- | --- |
| Flowsheets / vitals | Show trajectory and monitor context over time. | SpO2 94→89, HR 88→108, RR 18→24 over 40 min on stable O2. | `monitor_extension` or public pi-sim vitals translated by ingest adapter. | Supports deterioration assessment and alarm/validation workflow. | Existing `vitals.jsonl`, `observation.vital_sign`, `trend`; latent→charted promotion remains a gap. |
| Nursing assessment | Capture bedside context that monitor values cannot explain alone. | Increased work of breathing, lung sounds, mentation, O2 device/flow, patient appearance. | `nurse_charted` or `agent_bedside_observation` after explicit assessment. | Supports assessment and documentation-burden proof. | Existing `observation.exam_finding` / `assessment`; assessment transport remains a gap. |
| Notes / narrative charting | Turn observed context into reviewable clinical memory. | Focused nursing note summarizing deterioration, actions, response, uncertainty. | `nurse_charted`, `agent_synthesis`, or sanctioned communication-note write path. | Provides clinician-readable happened/why/uncertainty narrative. | Existing notes + `communication`; review composition remains a gap. |
| Orders / meds / interventions | Represent intended and performed clinical work. | O2 escalation, provider notification, ABG/lab order, medication/intervention status. | `clinician_chart_action`, `protocol_standing_order`, `agent_action`. | Creates open loops and fulfillment links. | Existing `intent`, `action`, `links.fulfills`; medication/MAR detail may need a later ADR. |
| Labs / diagnostics | Add asynchronous data that changes interpretation. | ABG/lactate/CBC result or diagnostic report timestamped after deterioration. | `lab_interface_hl7`, `manual_lab_entry`, `poc_device`, or `artifact_ref`. | Supports or contradicts assessment and closes diagnostic loops. | Existing `observation.lab_result`, `artifact_ref`; interface detail may need fixture-driven extension. |
| Care plan / handoff | Preserve what matters for the next clinician or agent step. | Shift handoff: current concern, pending labs/orders, watch triggers, uncertainty, contingency. | `agent_synthesis`, `nurse_charted`, or `communication`. | Drives `openLoops`, next-shift review, and care-continuity proof. | Existing `intent.care_plan`, `communication`, `openLoops`; handoff template remains a gap. |

## Memory proof projection outline

The proof projection should be a deterministic composition over existing
chart memory, not a second memory model or a standalone product focus.

Required sections:

1. **What happened** — concise timeline of clinically relevant changes and actions.
2. **Why it mattered** — assessment/trend summary tied to evidence.
3. **Evidence/provenance** — links to vitals windows, observations, notes, orders, labs, and artifacts.
4. **Uncertainty** — unresolved contradictions, missing data, questionable signals, differential possibilities.
5. **Open loops** — pending orders, labs, reassessments, escalations, or follow-up tasks.
6. **Next-shift handoff** — current concern, watch items, and triggers.

Pass condition: the operator can answer “what changed, what did we do, what
are we waiting on, what should I watch next?” from the projection alone.

## Documentation-burden proof path

The first fixture should prove one clinical fact can be entered once and
reused through projections:

1. Observable clinical event occurs, such as rising work of breathing with worsening SpO2/RR trend.
2. Agent or nurse performs assessment and records structured findings once.
3. Write path creates auditable chart memory with source, author, timestamps, and evidence links.
4. Derived projections compose the observation into narrative, open-loop, and handoff context.
5. The clinician does not re-enter the same fact separately for flowsheet, note, handoff, and review.

## Observable-only adapter contract

Hidden physiology is not chart context. It can drive scenario behavior
inside pi-sim, but only public clinical observations cross into pi-chart
or pi-agent.

Allowed observable classes:

- History already loaded into chart.
- Physical findings returned only after assessment.
- Vitals and alarms emitted by monitor/public vitals outputs.
- Labs, diagnostics, notes, orders, medication/intervention updates, and
  handoff/care-plan updates emitted as scenario rollout or chart events.

Adapter requirements:

- Include source/provenance.
- Include effective time and recorded time or interval semantics.
- Preserve transform provenance when an adapter derives chart events from emitted observations.
- Never serialize hidden physiology or simulator internals into pi-chart or pi-agent context.

## First fixture sequence sketch

Use patient_001 or a successor respiratory-decompensation fixture as the
first coherent story:

Current state note: `patients/patient_001` is still a narrow
respiratory-decompensation seed. It validates the claim-stream substrate and
the A3-style vitals deterioration pattern, but it does not yet satisfy this
broad skeleton. In particular, it does not yet contain the labs/diagnostics,
MAR/reconciliation, nursing assessment, provider/nursing note breadth, care
plan/handoff, or memory-proof projection required below.

1. Baseline history and constraints exist in chart.
2. Vitals trend worsens over about 40 minutes.
3. Alarm or trend triggers attention.
4. Assessment reveals bedside findings not visible in vitals alone.
5. Orders/interventions and at least one lab/diagnostic item create open loops.
6. Narrative note and care-plan/handoff summarize state, uncertainty, and next watch items.
7. Derived memory projection composes the six surfaces into one reviewable memory.

Exact timestamps/order sequence should be fixed before source implementation.

## Critic questions for future changes

- Does this surface change the agent’s available context or clinician review value?
- Would a critical-care nurse recognize it as useful chart context rather than taxonomy theater?
- Is a schema or primitive change forced by fixture evidence, or is it speculative?
- Does the change preserve provenance and uncertainty?
- Does any adapter expose simulator truth that a bedside clinician would not have?
