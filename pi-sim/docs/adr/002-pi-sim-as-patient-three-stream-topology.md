# ADR 002 — pi-sim as patient; three-stream topology; monitor first-class

Date: 2026-04-23
Status: accepted
Decision maker: user (project lead).
Supersedes: none (clarifies the architectural frame assumed by ADR 001).

## Context

ADR 001 (2026-04-22) bounded-stopped the validation-recovery lane after
Pulse runtime fixes landed but `npm run validate` remained red for
reasons that were scenario-tuning, not runtime defects (sepsis needs
hours of sim time to manifest; hemorrhagic severity 0.5 on VenaCava is
~30× Pulse's canonical FlowRate). That bounded stop surfaced a deeper
question: what is pi-sim actually *for*, given Pulse's timescale and
fidelity don't match the MVP need?

Two sketches on 2026-04-23 reframed the architecture:

- `docs/vitals-stream.pdf` — vitals as a stream, monitor as one of two
  consumers, chart holding vitals in a "latent / unvalidated" state
  until the agent promotes them to charted via documentation skills.
- `docs/pi-rn-diagragm.pdf` — **holistic** view: pi-sim emits three
  differently-shaped streams (History, Physical, Vitals) keyed to
  distinct agent skills (`<Read>`, `<Assess>` + `<Write>`, and
  `<Waveform validation>` + alarm response).

Parallel synthesis from two independent models (codex + gemini)
converged on: the three-class data model is the load-bearing innovation;
pi-sim is the patient, not the monitor; Pulse is an input, not a peer;
the monitor is operationally first-class because it owns alarm logic
that routes directly to the agent.

## Decision

Adopt the three-stream patient-engine architecture as pi-sim's
organizing frame. Specifically:

### 1. pi-sim is the patient, not the monitor

pi-sim's job is to *be* a synthetic ICU patient — the substrate that
emits History, Physical, and Vital signs consistent with a single
coherent clinical narrative. The PySide6 bedside monitor is a
**consumer** of pi-sim, not its purpose. Pulse is an **optional
injector** that can drive portions of the vitals stream when acute
physiology is required; it is not the source of truth for the patient.

### 2. Three data-classes, three workflows

- **History (continuous solid blue in diagram).** Pre-authored, bulk-
  loaded. Read-only by agent via `<Read>` against pi-chart. Contains
  demographics, prior admissions, problem list, medication history,
  labs, narrative — everything that would exist in an EHR from prior
  encounters. Does not change during the encounter (except as new
  labs/notes are rolled out per the scenario script — see §4).

- **Physical (dashed green in diagram).** Latent in pi-sim until the
  agent performs `<Assess>`. On assessment, pi-sim returns the findings
  consistent with the patient's current physiological state at the
  assessment timestamp. Agent then `<Write>`s them into pi-chart as a
  documented assessment note. Not continuously streamed.

- **Vitals (solid red in diagram).** Continuously emitted by pi-sim at
  monitor refresh rate. Rendered live on the Monitor UI. Aggregated to
  per-minute telemetry written into pi-chart's `<Latent>` state.
  Promoted to `<Chart>` state by the agent via `<Waveform validation>`
  and documentation skills, matching real-EHR nurse-validation flow.

### 3. Monitor UI is architecturally first-class

The Monitor UI owns:
- waveform and numeric-vitals display for a human observer,
- alarm generation (threshold breaches, rhythm anomalies),
- a direct alarm channel to pi-agent that **bypasses pi-chart**.

This reflects real clinical flow: alarms are an attention mechanism
that demand response *before* chart reconciliation. The agent's
response to an alarm is itself subject to discernment and validation —
alarms trigger attention, not automatic action.

Operational consequence: Monitor UI reliability is now load-bearing for
the agent, not a cosmetic concern. It is a subsystem, not a UI surface.

### 4. Patient data is *rolled out* over an encounter

A synthetic patient is not a static JSON blob. It is a **scripted
encounter** with temporal structure:

- Some data is disclosed up front (chart history available at admit).
- Some data is seeded but latent, requiring agent skill to reveal
  (physical findings on assessment; pain scale on interview; monitor
  alarms that occur at scripted times).
- Some data arrives asynchronously during the encounter (lab results,
  imaging reads, consult notes, new orders from outside providers).
- Vitals stream continuously.

This rollout-model is the substrate that makes the encounter feel
clinically authentic rather than scripted. pi-sim owns the rollout; the
agent discovers it through skill use.

### 5. `<Latent>` → `<Chart>` is a state machine, not a routing split

The two labels on the red vitals stream are **states on one stream**,
not separate tables. Minute-telemetry arrives in `<Latent>` state.
Agent promotes to `<Chart>` via documentation. Promotion is a
first-class state transition with a defined contract (author, evidence,
timestamp, corrections path) — subject of a future ADR once the
transition is implemented.

### 6. Pulse stays in the tree, dormant for MVP

Pulse is one possible backend for the vitals stream, useful when acute
physiology needs real modeling (bleeding, drug response). For MVP and
initial triad demos it is not on the critical path. The runtime
investment from ADR 001 is preserved; reactivation is a scenario-level
decision, not an architectural rewrite.

## The missing arrow — intervention write-back

The diagram does **not** draw an agent → pi-sim write-back channel for
orders and interventions. This is intentional for MVP (interventions
out of scope). It is named here so future work knows this is a seam
that needs design, not an oversight. When it lands it will likely
enter pi-sim as a fourth action-stream symmetric to the Pulse scenario
injection input.

## Subsystems this architecture implies

1. **pi-sim patient-engine layer** — synthesizes History, Physical,
   Vitals from a single patient-encounter definition. Pulse is an
   optional module within this layer, not the layer itself.
2. **pi-chart latent → charted state machine** — minute-telemetry
   ingest, promotion API, corrections path. pi-chart's v0.2 write
   primitives (`appendEvent`, `writeNote`) are the foundation; the
   promotion flow needs new contract work.
3. **pi-agent skills library** — `<Read>`, `<Assess>`, `<Write>`,
   `<Waveform validation>`, `<Alarm response>`. Each skill maps to a
   named data-class + operation.
4. **Canonical clock / event model** — a shared time substrate across
   the three projects so live waveforms, minute telemetry, chart
   timestamps, and agent action timestamps cannot diverge. Unresolved;
   subject of a dedicated sub-decision. Fast-forward semantics cascade
   from it.

## Consequences

- **Seam freeze is partially lifted.** This ADR names the seams and
  their ownership, allowing coordinated work across pi-sim and pi-chart
  where previously blocked. Specifically: vitals-telemetry write seam
  (pi-sim → pi-chart `<Latent>`) and assessment-query seam (pi-agent →
  pi-sim via pi-chart) are now design-stable enough to implement
  against. The intervention write-back seam (§The missing arrow) stays
  frozen.
- **Monitor-UI PRD requires revision.** Its scope now includes
  first-class alarm routing to pi-agent, not just local alarm display.
  Existing monitor-ui execution-ready PRD needs an update pass before
  Phase 4 opens.
- **Scenario authoring is the next foundational work.** A
  patient-encounter definition that rolls out History + Physical +
  Vitals coherently, over simulated time, is the scaffolding the whole
  triad depends on. patient_001 is already scoped in pi-chart wiki as a
  respiratory-decompensation teaching case (pneumonia, SpO2 94→89, HR
  88→108, RR 18→24 over 40 min on 2L NC) — a clean target for the MVP
  demo proposed by the synthesis models.
- **Pulse reactivation is scenario-gated.** When a scenario requires
  real physiology (bleeding titration, vasopressor response), Pulse
  becomes one of pi-sim's drivers for that scenario. No global
  enable/disable. Dormant otherwise.
- **pi-agent's architecture surface changes.** Two sensory paths:
  reflective (chart reads) and reactive (monitor alarms). Skills
  library structure must accommodate both, with filtering to prevent
  alarm-fatigue token burn.

## Open sub-decisions (do not block this ADR)

1. **Canonical clock ownership.** Where does sim-time live? pi-sim?
   pi-chart? A shared concept library? Fast-forward semantics flow from
   this. Parking until MVP demo exposes the need.
2. **Latent → Charted promotion contract.** Who can promote, what
   evidence is required, what granularity (minute? 5-min? a shift?),
   how are corrections represented. Deferred to post-MVP unless the
   patient_001 demo surfaces a concrete need.
3. **Physical-assessment transport.** How does pi-agent query pi-sim
   for assessment findings — through pi-chart (chart-as-memory-and-
   mediator) or direct? Current sketch routes through pi-chart. Confirm
   during skills-library build.
4. **Alarm filtering / fatigue policy.** Raw threshold breaches vs.
   intelligent pre-filter on the Monitor UI side. Out of scope until
   the first alarm-driven skill is built.
5. **Multi-patient scaling.** Current monitor is one-bed, file-watcher
   based. Multi-patient and long-duration runs break this. Not an MVP
   concern; named here so it is not a surprise when it arrives.

## Immediate next work implied by this ADR

1. **patient_001 encounter engineering** — a single coherent synthetic
   encounter exercising all three streams end-to-end. Scope: preload
   history, seed physical findings, script a 40-min vitals rollout
   matching the wiki-defined trajectory. Shared artifact between pi-sim
   (owns the rollout) and pi-chart (owns the loaded history + latent
   telemetry target).
2. **Monitor-UI PRD refresh** — add alarm-to-agent routing as a
   first-class requirement; defer Phase 4 opening until this lands.
3. **Thin triad demo plan** — one-page spec for the MVP demo from the
   synthesis convergence: agent reads patient_001 history, reacts to a
   scripted alarm during the 40-min window, validates monitor
   waveform, promotes one latent minute-block to charted with an
   `<Assess>` + `<Write>` physical note.

## Cross-references

- `docs/adr/001-validation-recovery-bounded-stop.md` — the bounded stop
  that surfaced the reframing need.
- `docs/vitals-stream.pdf` — first sketch (topology).
- `docs/pi-rn-diagragm.pdf` — holistic sketch this ADR ratifies.
- `~/pi-rn/pi-chart/wiki/entities/patient-001.md` — respiratory
  decompensation teaching case, target of first triad demo.
- `~/pi-rn/pi-chart/wiki/entities/synthea.md` — primary historical
  corpus for scenario authoring.
- `~/pi-rn/pi-chart/ROADMAP.md` — Track A/B clinical-depth + synthetic-
  patient build; this ADR provides the target topology those tracks
  are filling in for.
