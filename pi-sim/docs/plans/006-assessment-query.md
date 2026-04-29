> **TOMBSTONE — historical seam context only.**
> This pre-M-series planning lineage is superseded for current `pi-sim` runtime work by `docs/adr/003-pi-sim-patient-runtime-provider-architecture.md` plus `.omx/plans/plan-pi-sim-m1-runtime-skeleton-scripted-provider.md`, `.omx/plans/plan-pi-sim-m2-pulse-provider-runtime.md`, `.omx/plans/plan-pi-sim-m3-public-event-waveform-lanes.md`, `.omx/plans/plan-pi-sim-m4-encounter-assessment-public-schema.md`, and `.omx/plans/plan-pi-sim-m4-abi-hardening-remediation.md`.
> Retain this file for design lineage only; do not treat it as an executable PRD unless a newer plan explicitly revives a slice.

---

# 006 — Assessment Query (pi-agent → pi-sim physical findings, scaffold)

Status: scaffold PRD (not yet deepened)
Date: 2026-04-26
Owner ADR: `pi-sim/docs/adr/002-pi-sim-as-patient-three-stream-topology.md` §2 (Physical stream)
Sibling deep PRD: `004-vitals-telemetry-bridge.md`
Sibling scaffold: `005-alarm-channel.md`

---

## 1. Goal (one sentence)

Stand up the **assessment-query seam** named in ADR 002 §2 (Physical, dashed green): pi-agent invokes `<Assess>`, pi-sim returns the physical findings consistent with the patient's current physiological state at the assessment timestamp, and pi-agent `<Write>`s them into pi-chart as a documented assessment note.

## 2. Scope sketch

- Today: nothing exists on either side. pi-sim has no assessment-finding generator; pi-chart has no assessment-query mediator API; pi-agent has no `<Assess>` skill.
- ADR 002 §2 puts physical findings in **latent** state until the agent assesses — the engine knows them, but they're hidden until queried. This makes the assessment query the first **agent-driven hidden-state read**, distinct from the always-on vitals stream.
- ADR 002 sub-decision #3 (Physical-assessment transport) is open: chart-as-mediator vs direct pi-agent → pi-sim. Resolution shapes the entire PRD.

## 3. Open questions (must resolve before deepening)

1. **Transport.** chart-as-mediator (pi-agent reads `chart.assessmentRequest()` which queries pi-sim under the hood; chart sees the query) vs direct (pi-agent calls a pi-sim HTTP endpoint; chart sees only the resulting note). ADR 002 sub-decision #3 currently sketches chart-as-mediator. Confirm or reverse.
2. **Finding shape.** Free-text narrative (LLM-friendly, hard to test) vs structured finding events (auditable, requires taxonomy) vs hybrid (structured + narrative annotation).
3. **Finding source.** Pre-authored per encounter (waypoint findings tied to physiology state) vs derived from current vitals at assessment time (rules engine over current.json).
4. **Body system coverage.** Full head-to-toe? Targeted (cardiac / pulmonary / neuro) per assessment type? Shape of the request payload.
5. **Idempotency / replay.** Multiple `<Assess>` calls in the same minute — same findings, or do they evolve with sub-minute physiology? Likely "same findings within a stable-physiology window" but needs a window definition.
6. **Coupling to PRD 004.** Does the assessment query need pi-chart's encounter to exist (yes — the assessment note is patient-scoped) and the vitals stream to be running (probably yes — findings reference current vitals)?

## 4. Slices (placeholder)

To be filled out after the deepening interview. Anticipated shape:

- `S0` — Transport ADR memo (resolves §3.1).
- `S1` — Finding-shape schema + canonical finding taxonomy (resolves §3.2).
- `S2` — pi-sim assessment-finding generator + per-encounter finding manifest (similar shape to PRD 004's encounter context manifest).
- `S3` — Mediator surface (chart-side or direct, per §3.1) with patient-scoped guardrails.
- `S4` — pi-agent `<Assess>` skill that calls the surface and stages a draft note.
- `S5` — pi-agent `<Write>` skill that authors a NEW assessment note in pi-chart via existing primitives (`writeCommunicationNote`, `appendEvent` for the assessment event). **Does NOT promote a Latent vital into Charted state**; the `<Latent>` → `<Chart>` contract (ADR 002 sub-decision #2 / PRD 004 D2) stays deferred. "Write" here means author a new chart entry, not change the state of an existing one.
- `S6` — Round-trip test: agent assesses, finding is generated, note lands in chart, validator green.

## 5. Demo target

`patient_002 / enc_p002_001` — the same Agent Canvas respiratory watcher fixture. The scripted assessment (e.g. at 09:20 the agent performs a respiratory assessment) returns findings consistent with patient_002's deterioration trajectory ("increased work of breathing, accessory muscle use, bilateral crackles right > left", per the existing handoff note).

## 6. Out of scope at scaffold stage

- Implementation of any of the slices (this is a scope sketch only).
- Other assessment domains (pain, neuro, GI, GU) beyond what the demo needs.
- Order/intervention write-back to pi-sim (ADR 002 §The missing arrow stays frozen).
- Skill catalog beyond `<Assess>` + `<Write>` (those two are the minimum demo proves).

## 7. When to deepen

Deepen this PRD after:
- PRD 004 ships (vitals telemetry is the prerequisite — assessment findings reference current vitals state).
- ADR 002 sub-decision #3 (Physical-assessment transport) is closed by an operator decision.
- pi-agent's skill-loop architecture is decided (currently the agent runtime is a moving target — Agent Canvas is the closest concrete surface).

## 8. Cross-references

- ADR 002 §2 (Physical / dashed-green stream) and ADR 002 sub-decision #3 (transport) — the source of this PRD's mandate.
- pi-chart `wiki/entities/patient-001.md` — describes a patient-reported / agent bedside-exam / assessment chain that this PRD generalizes.
- pi-chart `memos/patient-002-clinical-review-26042026.md` — assessment language ("accessory muscle use", "work of breathing") that the finding taxonomy must accommodate.
- PRD 004 — the prerequisite vitals stream the assessment findings reference.
