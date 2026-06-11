# pi-sim Milestones

This table distills the M-series planning archive for fresh AI agents. It does not replace the underlying PRD/test-spec artifacts; see `docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md` for canonical classification. New active work should be promoted to root `.scratch/<feature>/PRD.md` and `.scratch/<feature>/issues/*.md` before implementation.

| Milestone | Status | Evidence / plan lineage | Current use |
|---|---|---|---|
| M1 runtime skeleton scripted provider | historical / implemented lineage | `.omx/plans/plan-pi-sim-m1-runtime-skeleton-scripted-provider.md`; PRD/test-spec pair | Provider-runtime foundation lineage. |
| M2 Pulse provider runtime | historical / provider lane | `.omx/plans/plan-pi-sim-m2-pulse-provider-runtime.md`; PRD/test-spec pair | Pulse remains one provider, not architecture spine. |
| M3 public event/waveform lanes | historical / ABI lineage | `.omx/plans/plan-pi-sim-m3-public-event-waveform-lanes.md`; PRD/test-spec pair | Public telemetry lane lineage. |
| M4 ABI hardening and encounter/assessment schema | historical / ABI lineage | `.omx/plans/plan-pi-sim-m4-encounter-assessment-public-schema.md`; PRD/test-spec pair | Encounter/assessment public-lane lineage. |
| M5 public consumer readiness | historical lineage; active lane in `.scratch` | `.omx/plans/plan-pi-sim-m5-public-consumer-readiness.md`; `.scratch/pi-sim-public-telemetry-contract-lock/` | Promote new work to `.scratch` issues; reuse M5 evidence only. |
| M6 pi-monitor public consumer adoption | historical lineage; active lane in `.scratch` | `.omx/plans/plan-pi-monitor-m6-public-consumer-adoption.md`; `.scratch/pi-monitor-public-lane-ingest-depth/` | Monitor display-only; chart/EHR writes forbidden. |
| M7 pi-agent public-read smoke | historical lineage; future `.scratch` lane | `.omx/plans/plan-pi-agent-m7-public-read-smoke.md` | Reuse after public ABI lock; no hidden sim coupling. |

## Next milestone posture

Next implementation-adjacent milestone should be public ABI lock work expressed as a `.scratch` PRD/issues lane. Only after that lands should `pi-rn/ingest/` get an explicit contract stub.
