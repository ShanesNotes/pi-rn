# 007 — Authority Ledger and AI-Alignment Roadmap

Status: Current pi-sim classification ledger after Claude/Codex synthesis and Matt-skill work-surface alignment
Date: 2026-05-03
Scope: pi-sim rebase grounding, pi-monitor documented references, and boundary anchors for pi-agent/pi-chart

## Purpose

This file is the pi-sim authority ledger and roadmap for AI coding agents working on simulator/public-telemetry alignment. It aligns the prior Ralph/RALPLAN artifact in `.omx/plans/ralplan-pi-sim-pi-monitor-ai-alignment-roadmap.md` and Claude's fresh-context plan archived at `.omx/drafts/claude-pi-sim-pi-monitor-ai-alignment-raw.md` with the root Matt Pocock `.scratch`-first workflow introduced by commit `fa7b278`.

## Claude / Codex discrepancy matrix

| Topic | Claude finding | Codex/RALPLAN finding | Decision |
|---|---|---|---|
| Planning bottleneck | Add a short front door and collapse noisy planning surfaces. | Require exact authority ledger schema and completeness gate. | Use root `CONTEXT-MAP.md` + `docs/agents/work-surface.md` as the workflow front door; keep this file as the pi-sim classification ledger. Root `PLANNING.md`, if present, is transitional lineage only. |
| Public ABI | Promote vitals/.lanes.json, vitals/README.md, and ABI tests/changelog. | Public JSON lanes are durable ABI; private TCP is not authority. | Adopt ABI lock as next lane after this authority pass. |
| pi-rn/ingest | Missing connector seam is the largest concrete triad gap. | Chart adapter must wait for provenance, idempotency, write policy, subject/encounter identity, timestamp rules, and source attribution. | Defer implementation; create future contract stub lane only after ABI lock. |
| pi-monitor transport | File lanes primary, TCP secondary. | ADR-0002 conflicts with current source-dir/live-tcp reality. | ADR-0003 extends ADR-0002: public JSON durable, TCP localhost/private/non-durable display transport. |
| Clock ownership | One canonical SimClock owned by runner. | ADR-002 left clock open; ADR-003 assigns pi-sim clock ownership. | ADR-004 makes ADR-003 the clock authority. |
| Legacy cleanup | Archive PySide/explorer/legacy scripts after A/B/C. | Avoid moving/deleting during first authority pass. | Document as Phase D; do not move code now. |
| pi-chart v0.5 | Force v0.5 disposition later. | Out of scope except boundary anchor. | Document as deferred Phase E; do not classify full pi-chart tree here. |

## Source-of-truth hierarchy

1. `/home/ark/pi-rn/CONTEXT-MAP.md` plus `/home/ark/pi-rn/docs/agents/work-surface.md` and `skill-interoperability.md` for fresh-agent routing and workflow-surface rules.
2. `/home/ark/pi-rn/pi-sim/CONTEXT.md` for simulator domain language.
3. `docs/adr/` for accepted simulator architecture decisions.
4. `vitals/README.md` and `vitals/.lanes.json` for public telemetry ABI.
5. Root `.scratch/<feature>/PRD.md` and `.scratch/<feature>/issues/*.md` for active Matt-skill implementation planning.
6. This file for authority classification, roadmap order, and historical-plan triage.
7. `.omx/plans/*` as OMX runtime evidence/lineage; mirror into `.scratch` before using it as an implementation work queue.

## Authority ledger

| artifact_path | owner | scope | authority_status | execution_status | extends | extended_by | supersedes | superseded_by | do_not_use_for_new_work | conflicts | tombstone_action | allowed_consumers | forbidden_consumers | verification_gate |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ../CONTEXT-MAP.md | workspace | cross-context routing | current | execution-ready | — | — | — | — | false | — | — | all agents | — | docs/agents/domain.md references this layout |
| ../docs/agents/work-surface.md | workspace | shared agent work-surface rules | current | execution-ready | — | — | root PLANNING as active work surface | — | false | — | — | all agents | active work outside .scratch | .scratch PRD exists for active lanes |
| ../docs/agents/skill-interoperability.md | workspace | Matt/OMX workflow routing | current | execution-ready | — | — | — | — | false | — | — | all agents | — | explicit workflow invocation rules |
| ../docs/agents/issue-tracker.md | workspace | local markdown issue tracker | current | execution-ready | — | — | root PLANNING/docs-plans as issue tracker | — | false | — | — | all agents | active issue state outside .scratch | PRD/issue shapes documented |
| ../docs/agents/domain.md | workspace | multi-context domain-doc routing | current | execution-ready | — | — | — | — | false | — | — | all agents | hidden pi-sim source consumers | public contract authority named |
| ../.scratch/pi-sim-rebase-grounding/PRD.md | pi-sim | current Matt-skill rebase grounding | current | execution-ready | ../docs/agents/work-surface.md | — | root PLANNING as active planning surface | — | false | — | — | all agents | pi-chart internals edits | file exists and names vitals authority |
| README.md | pi-sim | subsystem routing | extended-by | not-ready | — | ../CONTEXT-MAP.md, docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md | — | — | false | — | — | all agents | — | read with CONTEXT-MAP.md, pi-sim/CONTEXT.md, and 007 ledger |
| vitals/README.md | pi-sim | public telemetry consumer guide | current | execution-ready | — | — | — | — | false | — | — | pi-monitor, future ingest, pi-agent public reads | hidden-provider consumers | npm run test:public-contract |
| vitals/.lanes.json | pi-sim | public lane manifest | current | execution-ready | — | — | — | — | false | — | — | public consumers | hidden-provider consumers | npm run test:public-contract |
| docs/adr/001-validation-recovery-bounded-stop.md | pi-sim | bounded validation recovery | current | not-ready | — | — | — | — | false | — | — | pi-sim maintainers | — | npm test uses scripted validation gate |
| docs/adr/002-pi-sim-as-patient-three-stream-topology.md | pi-sim | patient topology lineage | extended-by | not-ready | — | docs/adr/003-pi-sim-patient-runtime-provider-architecture.md, docs/adr/004-planning-surface-and-public-contract-authority.md | — | — | false | clock ownership originally open | — | maintainers | — | ADR-004 resolves clock ownership |
| docs/adr/003-pi-sim-patient-runtime-provider-architecture.md | pi-sim | patient runtime/provider architecture | current | not-ready | — | — | older monitor-first direction | — | false | — | — | pi-sim maintainers | — | README and CONTEXT-MAP route here |
| docs/adr/004-planning-surface-and-public-contract-authority.md | pi-sim | planning-surface and clock authority | current | execution-ready | docs/adr/002-pi-sim-as-patient-three-stream-topology.md, docs/adr/003-pi-sim-patient-runtime-provider-architecture.md | — | — | — | false | — | — | all agents | — | ledger completeness plus boundary scans |
| docs/plans/000-vitals-triad-prd-index.md | pi-sim | triad PRD lineage | extended-by | not-ready | — | docs/plans/INDEX.md, docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md | — | — | false | — | — | maintainers | — | 007 row classification |
| docs/plans/001-ultraplan-pi-rn-substrate.md | pi-sim | planning lineage | historical | not-ready | — | — | — | docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md | true | — | preserve breadcrumb, move to archive in future cleanup | maintainers | new implementation work | INDEX marks historical |
| docs/plans/002-pulse-pivot.md | pi-sim | planning lineage | historical | not-ready | — | — | — | docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md | true | — | preserve breadcrumb, move to archive in future cleanup | maintainers | new implementation work | INDEX marks historical |
| docs/plans/003-monitor-ui.md | pi-sim | planning lineage | historical | not-ready | — | — | — | docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md | true | — | preserve breadcrumb, move to archive in future cleanup | maintainers | new implementation work | INDEX marks historical |
| docs/plans/004-vitals-telemetry-bridge.md | pi-sim | planning lineage | superseded | not-ready | — | — | — | docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md | true | — | preserve breadcrumb, move to archive in future cleanup | maintainers | new implementation work | INDEX marks historical |
| docs/plans/004a-architecture-review-26042026.md | pi-sim | planning lineage | superseded | not-ready | — | — | — | docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md | true | — | preserve breadcrumb, move to archive in future cleanup | maintainers | new implementation work | INDEX marks historical |
| docs/plans/005-alarm-channel.md | pi-sim | planning lineage | superseded | not-ready | — | — | — | docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md | true | — | preserve breadcrumb, move to archive in future cleanup | maintainers | new implementation work | INDEX marks historical |
| docs/plans/006-assessment-query.md | pi-sim | planning lineage | superseded | not-ready | — | — | — | docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md | true | — | preserve breadcrumb, move to archive in future cleanup | maintainers | new implementation work | INDEX marks historical |
| docs/plans/INDEX.md | pi-sim | plans directory routing | current | not-ready | docs/plans/000-vitals-triad-prd-index.md | — | — | — | false | — | — | all agents | — | read-only navigation check |
| docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md | pi-sim | authority classification ledger and roadmap | current | execution-ready | .omx/plans/ralplan-pi-sim-pi-monitor-ai-alignment-roadmap.md | — | — | — | false | — | — | all agents | — | ledger completeness check |
| .omx/plans/day-plan-pi-sim-m4-finish-20260428.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | true | — | preserve as session lineage | maintainers | new implementation work unless re-PRDed | 007 classifies historical |
| .omx/plans/pi-sim-bounded-remediation-lane-initial-ralplan-draft.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | true | — | preserve as session lineage | maintainers | new implementation work unless re-PRDed | 007 classifies historical |
| .omx/plans/pi-sim-next-work-seam-freeze-consensus-draft.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | true | — | preserve as session lineage | maintainers | new implementation work unless re-PRDed | 007 classifies historical |
| .omx/plans/plan-pi-agent-m7-public-read-smoke.md | pi-sim | pi-agent public-read smoke lane | current | execution-ready | — | — | — | — | false | — | — | pi-agent lane | hidden pi-sim source | M7 test-spec plus boundary scans |
| .omx/plans/plan-pi-monitor-m2-kiosk-waveform-telemetry.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | false | — | — | maintainers | — | manual review |
| .omx/plans/plan-pi-monitor-m6-public-consumer-adoption.md | pi-sim | pi-monitor public consumer adoption lane | current | execution-ready | — | — | — | — | false | — | — | pi-monitor lane | chart/EHR writes | cargo tests plus boundary scans |
| .omx/plans/plan-pi-sim-architecture-rebase-patient-runtime.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | true | — | preserve as session lineage | maintainers | new implementation work unless re-PRDed | 007 classifies historical |
| .omx/plans/plan-pi-sim-doc-quarantine-canonical-direction.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | true | — | preserve as session lineage | maintainers | new implementation work unless re-PRDed | 007 classifies historical |
| .omx/plans/plan-pi-sim-m1-runtime-skeleton-scripted-provider.md | pi-sim | completed M-series lineage | historical | execution-ready | — | — | — | — | true | — | summarized by docs/MILESTONES.md | reference only | — | docs/MILESTONES.md row |
| .omx/plans/plan-pi-sim-m2-pulse-provider-runtime.md | pi-sim | completed M-series lineage | historical | execution-ready | — | — | — | — | true | — | summarized by docs/MILESTONES.md | reference only | — | docs/MILESTONES.md row |
| .omx/plans/plan-pi-sim-m3-public-event-waveform-lanes.md | pi-sim | completed M-series lineage | historical | execution-ready | — | — | — | — | true | — | summarized by docs/MILESTONES.md | reference only | — | docs/MILESTONES.md row |
| .omx/plans/plan-pi-sim-m4-abi-hardening-remediation.md | pi-sim | completed M-series lineage | historical | execution-ready | — | — | — | — | true | — | summarized by docs/MILESTONES.md | reference only | — | docs/MILESTONES.md row |
| .omx/plans/plan-pi-sim-m4-encounter-assessment-public-schema.md | pi-sim | completed M-series lineage | historical | execution-ready | — | — | — | — | true | — | summarized by docs/MILESTONES.md | reference only | — | docs/MILESTONES.md row |
| .omx/plans/plan-pi-sim-m5-public-consumer-readiness.md | pi-sim | pi-sim public consumer readiness lane | current | execution-ready | — | — | — | — | false | — | — | pi-sim public ABI work | hidden source consumers | npm test and public contract tests |
| .omx/plans/plan-popup-live-waveform-monitor-mvp.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | true | — | preserve as session lineage | maintainers | new implementation work unless re-PRDed | 007 classifies historical |
| .omx/plans/plan-pulse-live-vitals-display.md | pi-sim | planning lineage | superseded | not-ready | — | — | — | ../pi-monitor/docs/adr/003-public-lane-consumer-authority.md | true | — | future archive cleanup | maintainers | new implementation work | INDEX/MILESTONES no current route |
| .omx/plans/plan-pulse-live-vitals-monitor.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | true | — | preserve as session lineage | maintainers | new implementation work unless re-PRDed | 007 classifies historical |
| .omx/plans/prd-authority-ledger-ai-alignment-roadmap.md | pi-sim | this Ralph planning-surface lane | current | execution-ready | — | — | — | — | false | — | — | ralph/team execution | — | all checks in test spec pass |
| .omx/plans/prd-monitor-ui-execution-ready.md | pi-sim | planning lineage | superseded | not-ready | — | — | — | ../pi-monitor/docs/adr/003-public-lane-consumer-authority.md | true | — | future archive cleanup | maintainers | new implementation work | INDEX/MILESTONES no current route |
| .omx/plans/prd-pi-agent-m7-public-read-smoke.md | pi-sim | pi-agent public-read smoke lane | current | execution-ready | — | — | — | — | false | — | — | pi-agent lane | hidden pi-sim source | M7 test-spec plus boundary scans |
| .omx/plans/prd-pi-monitor-m6-public-consumer-adoption.md | pi-sim | pi-monitor public consumer adoption lane | current | execution-ready | — | — | — | — | false | — | — | pi-monitor lane | chart/EHR writes | cargo tests plus boundary scans |
| .omx/plans/prd-pi-sim-m1-runtime-skeleton-scripted-provider.md | pi-sim | completed M-series lineage | historical | execution-ready | — | — | — | — | true | — | summarized by docs/MILESTONES.md | reference only | — | docs/MILESTONES.md row |
| .omx/plans/prd-pi-sim-m2-pulse-provider-runtime.md | pi-sim | completed M-series lineage | historical | execution-ready | — | — | — | — | true | — | summarized by docs/MILESTONES.md | reference only | — | docs/MILESTONES.md row |
| .omx/plans/prd-pi-sim-m3-public-event-waveform-lanes.md | pi-sim | completed M-series lineage | historical | execution-ready | — | — | — | — | true | — | summarized by docs/MILESTONES.md | reference only | — | docs/MILESTONES.md row |
| .omx/plans/prd-pi-sim-m4-abi-hardening-remediation.md | pi-sim | completed M-series lineage | historical | execution-ready | — | — | — | — | true | — | summarized by docs/MILESTONES.md | reference only | — | docs/MILESTONES.md row |
| .omx/plans/prd-pi-sim-m4-encounter-assessment-public-schema.md | pi-sim | completed M-series lineage | historical | execution-ready | — | — | — | — | true | — | summarized by docs/MILESTONES.md | reference only | — | docs/MILESTONES.md row |
| .omx/plans/prd-pi-sim-m5-public-consumer-readiness.md | pi-sim | pi-sim public consumer readiness lane | current | execution-ready | — | — | — | — | false | — | — | pi-sim public ABI work | hidden source consumers | npm test and public contract tests |
| .omx/plans/prd-pi-sim-pi-monitor-professional-polish.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | true | — | preserve as session lineage | maintainers | new implementation work unless re-PRDed | 007 classifies historical |
| .omx/plans/prd-popup-live-waveform-monitor-mvp.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | true | — | preserve as session lineage | maintainers | new implementation work unless re-PRDed | 007 classifies historical |
| .omx/plans/prd-pulse-live-vitals-display.md | pi-sim | planning lineage | superseded | not-ready | — | — | — | ../pi-monitor/docs/adr/003-public-lane-consumer-authority.md | true | — | future archive cleanup | maintainers | new implementation work | INDEX/MILESTONES no current route |
| .omx/plans/prd-pulse-live-vitals-monitor.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | true | — | preserve as session lineage | maintainers | new implementation work unless re-PRDed | 007 classifies historical |
| .omx/plans/prd-pulse-runtime-verify.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | true | — | preserve as session lineage | maintainers | new implementation work unless re-PRDed | 007 classifies historical |
| .omx/plans/prd-validation-recovery.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | true | — | preserve as session lineage | maintainers | new implementation work unless re-PRDed | 007 classifies historical |
| .omx/plans/prd-vitals-physiology-fidelity.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | true | — | preserve as session lineage | maintainers | new implementation work unless re-PRDed | 007 classifies historical |
| .omx/plans/ralplan-monitor-performance-realism-upgrade.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | true | — | preserve as session lineage | maintainers | new implementation work unless re-PRDed | 007 classifies historical |
| .omx/plans/ralplan-pi-sim-pi-monitor-ai-alignment-roadmap.md | pi-sim | approved consensus source | extended-by | execution-ready | — | docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md | — | — | false | — | — | planning reference | — | final critic APPROVE in artifact |
| .omx/plans/ralplan-professional-polish-live-vitals-monitor.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | true | — | preserve as session lineage | maintainers | new implementation work unless re-PRDed | 007 classifies historical |
| .omx/plans/resume-monitor-ui-branch.md | pi-sim | planning lineage | superseded | not-ready | — | — | — | ../pi-monitor/docs/adr/003-public-lane-consumer-authority.md | true | — | future archive cleanup | maintainers | new implementation work | INDEX/MILESTONES no current route |
| .omx/plans/test-spec-authority-ledger-ai-alignment-roadmap.md | pi-sim | this Ralph planning-surface lane | current | execution-ready | — | — | — | — | false | — | — | ralph/team execution | — | all checks in test spec pass |
| .omx/plans/test-spec-monitor-ui-execution-ready.md | pi-sim | planning lineage | superseded | not-ready | — | — | — | ../pi-monitor/docs/adr/003-public-lane-consumer-authority.md | true | — | future archive cleanup | maintainers | new implementation work | INDEX/MILESTONES no current route |
| .omx/plans/test-spec-pi-agent-m7-public-read-smoke.md | pi-sim | pi-agent public-read smoke lane | current | execution-ready | — | — | — | — | false | — | — | pi-agent lane | hidden pi-sim source | M7 test-spec plus boundary scans |
| .omx/plans/test-spec-pi-monitor-m6-public-consumer-adoption.md | pi-sim | pi-monitor public consumer adoption lane | current | execution-ready | — | — | — | — | false | — | — | pi-monitor lane | chart/EHR writes | cargo tests plus boundary scans |
| .omx/plans/test-spec-pi-sim-m1-runtime-skeleton-scripted-provider.md | pi-sim | completed M-series lineage | historical | execution-ready | — | — | — | — | true | — | summarized by docs/MILESTONES.md | reference only | — | docs/MILESTONES.md row |
| .omx/plans/test-spec-pi-sim-m2-pulse-provider-runtime.md | pi-sim | completed M-series lineage | historical | execution-ready | — | — | — | — | true | — | summarized by docs/MILESTONES.md | reference only | — | docs/MILESTONES.md row |
| .omx/plans/test-spec-pi-sim-m3-public-event-waveform-lanes.md | pi-sim | completed M-series lineage | historical | execution-ready | — | — | — | — | true | — | summarized by docs/MILESTONES.md | reference only | — | docs/MILESTONES.md row |
| .omx/plans/test-spec-pi-sim-m4-abi-hardening-remediation.md | pi-sim | completed M-series lineage | historical | execution-ready | — | — | — | — | true | — | summarized by docs/MILESTONES.md | reference only | — | docs/MILESTONES.md row |
| .omx/plans/test-spec-pi-sim-m4-encounter-assessment-public-schema.md | pi-sim | completed M-series lineage | historical | execution-ready | — | — | — | — | true | — | summarized by docs/MILESTONES.md | reference only | — | docs/MILESTONES.md row |
| .omx/plans/test-spec-pi-sim-m5-public-consumer-readiness.md | pi-sim | pi-sim public consumer readiness lane | current | execution-ready | — | — | — | — | false | — | — | pi-sim public ABI work | hidden source consumers | npm test and public contract tests |
| .omx/plans/test-spec-pi-sim-pi-monitor-professional-polish.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | true | — | preserve as session lineage | maintainers | new implementation work unless re-PRDed | 007 classifies historical |
| .omx/plans/test-spec-popup-live-waveform-monitor-mvp.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | true | — | preserve as session lineage | maintainers | new implementation work unless re-PRDed | 007 classifies historical |
| .omx/plans/test-spec-pulse-live-vitals-display.md | pi-sim | planning lineage | superseded | not-ready | — | — | — | ../pi-monitor/docs/adr/003-public-lane-consumer-authority.md | true | — | future archive cleanup | maintainers | new implementation work | INDEX/MILESTONES no current route |
| .omx/plans/test-spec-pulse-live-vitals-monitor.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | true | — | preserve as session lineage | maintainers | new implementation work unless re-PRDed | 007 classifies historical |
| .omx/plans/test-spec-pulse-runtime-verify.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | true | — | preserve as session lineage | maintainers | new implementation work unless re-PRDed | 007 classifies historical |
| .omx/plans/test-spec-vitals-physiology-fidelity.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | true | — | preserve as session lineage | maintainers | new implementation work unless re-PRDed | 007 classifies historical |
| .omx/plans/vitals-physiology-fidelity-consensus-draft.md | pi-sim | planning lineage | historical | not-ready | — | — | — | — | true | — | preserve as session lineage | maintainers | new implementation work unless re-PRDed | 007 classifies historical |
| ../pi-monitor/README.md | pi-monitor | monitor routing | extended-by | not-ready | — | ../pi-monitor/docs/adr/003-public-lane-consumer-authority.md | — | — | false | — | — | pi-monitor agents | — | README consistent with ADR-0003 |
| ../pi-monitor/docs/adr/001-rust-native-pi-monitor.md | pi-monitor | Rust-native display-only decision | current | not-ready | — | — | — | — | false | — | — | pi-monitor agents | — | cargo fmt/clippy/test |
| ../pi-monitor/docs/adr/002-current-json-monitor-extension.md | pi-monitor | M2 current.json compatibility | extended-by | not-ready | — | ../pi-monitor/docs/adr/003-public-lane-consumer-authority.md | — | — | false | single current.json boundary vs source-dir/live-tcp | — | maintainers | — | ADR-0003 extension text |
| ../pi-monitor/docs/adr/003-public-lane-consumer-authority.md | pi-monitor | public lane vs private TCP authority | current | execution-ready | ../pi-monitor/docs/adr/002-current-json-monitor-extension.md | — | — | — | false | — | — | pi-monitor agents | chart/EHR writes | cargo fmt/clippy/test and boundary scans |
| ../pi-agent/AGENTS.md | pi-agent | agent hidden-boundary anchor | current | not-ready | — | — | — | — | false | — | — | pi-agent agents | hidden pi-sim source imports | boundary scan no pi-sim/scripts or pulse |
| ../pi-chart/src/vitals.ts | pi-chart | current vital sample identity anchor | current | not-ready | — | — | — | — | false | — | — | pi-chart adapter planning | monitor dependency | pi-chart npm test and no monitor dependency scan |

## Roadmap

### Phase A — Authority indexing and fresh-agent routing

Completed by this pass when root `CONTEXT-MAP.md`, root `docs/agents/*`, `.scratch/pi-sim-rebase-grounding/PRD.md`, this ledger, `docs/plans/INDEX.md`, `docs/MILESTONES.md`, and ADR-004 are present and verified.

### Phase B — Public ABI lock

Create or extend `.scratch/pi-sim-public-telemetry-contract-lock/PRD.md` plus issue slices, then add lane manifest schema/changelog and conformance tests proving `publisher.ts` writes match `vitals/.lanes.json`. Treat provider contracts as provider-author API, not sibling-consumer ABI.

### Phase C — `pi-rn/ingest/` contract stub

Create only after Phase B, and only from a root `.scratch/<feature>/PRD.md` plus issue slices. Contract must read public `vitals/` lanes and accept subject/encounter/asOf inputs; no `pi-sim/scripts` or `pi-sim/pulse` imports. Chart writes require provenance/idempotency/write-policy semantics.

### Phase D — Legacy cleanup

Archive/move superseded monitor-ui/explorer/legacy scripts only after A-C are green. Preserve breadcrumbs and avoid deleting fixtures.

### Phase E — pi-chart v0.5 disposition

Create a sibling-owned disposition deciding how current `pi-chart/src` relates to v0.5 claim/predicate/bitemporal research. The ingest contract should remain stable across that decision.

## Verification gates

```bash
cd /home/ark/pi-rn/pi-sim
{
  printf '%s\n' ../CONTEXT-MAP.md ../docs/agents/work-surface.md ../docs/agents/skill-interoperability.md ../docs/agents/issue-tracker.md ../docs/agents/domain.md ../.scratch/pi-sim-rebase-grounding/PRD.md
  printf '%s\n' README.md vitals/README.md vitals/.lanes.json
  find docs/adr docs/plans .omx/plans -maxdepth 1 -type f | sort
  printf '%s\n' ../pi-monitor/README.md ../pi-agent/AGENTS.md ../pi-chart/src/vitals.ts
  find ../pi-monitor/docs/adr -maxdepth 1 -type f | sort
} > /tmp/pi-rn-ledger-required.txt
python3 - <<'PY'
from pathlib import Path
required=[p for p in Path("/tmp/pi-rn-ledger-required.txt").read_text().splitlines() if p]
ledger=Path("docs/plans/007-authority-ledger-and-ai-alignment-roadmap.md").read_text()
rows=[]
in_authority_table=False
for line in ledger.splitlines():
    if line.startswith("| artifact_path |"):
        in_authority_table=True
        continue
    if in_authority_table and not line.startswith("|"):
        break
    if in_authority_table and line.startswith("| ") and not line.startswith("|---"):
        first=line.split("|")[1].strip()
        if first and first != "---": rows.append(first)
missing=[p for p in required if rows.count(p)!=1]
dupes=sorted({p for p in rows if rows.count(p)>1})
if missing or dupes:
    raise SystemExit(f"missing_or_not_once={missing} dupes={dupes}")
print(f"ledger rows verified: {len(required)} required paths")
PY
```

Boundary and regression gates remain in `.omx/plans/test-spec-authority-ledger-ai-alignment-roadmap.md`; active follow-up implementation gates should be mirrored into `.scratch/<feature>/` before execution.
