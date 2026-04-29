> **Status note — retained context, not global architecture authority.**
> Current `pi-sim` architecture authority is `docs/adr/003-pi-sim-patient-runtime-provider-architecture.md` plus `.omx/plans/plan-pi-sim-architecture-rebase-patient-runtime.md`. Treat this file as scoped historical/seam context unless a newer plan explicitly revives it.

---

# 000 — Triad PRD Index (pi-sim ↔ pi-chart ↔ pi-agent connection)

Date: 2026-04-26
Source: deep-interview 2026-04-26 (initial idea — "pi-chart is nearly ready to have pi-sim connected to feed the simulated vitals stream")

This index frames three sibling PRDs that together implement the seams ADR 002 names load-bearing. Per the interview decision, **only one is deepened in this pass**; the other two stand as scaffolds with explicit open-question lists so they can be deepened later without re-discovering scope.

| # | PRD | Seam (ADR 002) | Status | Demo target |
|---|---|---|---|---|
| 004 | Vitals Telemetry Bridge | §2 Vitals (continuous, latent telemetry) | **deep, slice-ready** | `patient_002 / enc_p002_001` |
| 005 | Alarm Channel | §3 Monitor UI alarms (direct to agent, bypass chart) | scaffold | `patient_002 / enc_p002_001` |
| 006 | Assessment Query | §2 Physical (latent until agent `<Assess>`) | scaffold | `patient_002 / enc_p002_001` |

Cross-cutting decisions captured during the interview that constrain all three:

- **patient_002 / enc_p002_001 is the demo target.** patient_002 is the Agent-Canvas-anchored respiratory watcher fixture. patient_001 is a regression target (proves modularity), not a product target.
- **Connectors must be patient-agnostic.** No PRD may hardcode `patient_002` in production code; fixture file paths are the only acceptable place for the literal.
- **pi-chart never imports pi-sim code.** PRD 004 mounts a third-package `pi-rn/ingest/` to honor this. PRDs 005 and 006 inherit the constraint.
- **ADR 002 frozen seams stay frozen.** No PRD includes intervention write-back to pi-sim; that arrow is named missing in ADR 002 and stays out of scope.
- **Pulse stays dormant for MVP demos** (ADR 002 §6). PRD 004 introduces a scripted-replay backend in pi-sim; PRDs 005 and 006 inherit the same physiology source unless a future scenario specifically requires Pulse.

## When to deepen 005 and 006

`005 (Alarm Channel)` deepens after PRD 004 lands acceptance #6 (live mode), one pi-agent reactive-skill consumer is named, and the filtering-posture sub-decision (ADR 002 §sub-decision 4) closes.

`006 (Assessment Query)` deepens after PRD 004 ships (assessment findings reference current vitals), the chart-as-mediator-vs-direct sub-decision (ADR 002 §sub-decision 3) closes, and the pi-agent skill-loop architecture is concrete enough to consume the seam.

## Interview artifact

The interview that produced this index lives at `.omc/specs/deep-interview-vitals-bridge.md`. It records the ambiguity-score trajectory, the ontology snapshots, the alternative options the operator rejected, and the rationale for each architectural choice that PRD 004 §3 inherits as closed.
