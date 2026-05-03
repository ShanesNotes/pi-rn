# ADR style audit — project organization consistency

Status: needs-triage
Date: 2026-05-03
Parent issue: `.scratch/project-organization-consistency/issues/02-normalize-adr-style-audit.md`

## Scope

Audit `pi-chart`, `pi-monitor`, and `pi-sim` ADRs for filename convention, status/date metadata, relationship metadata, old-path references, and decision-risk before any accepted decision text is changed.

## Classification key

- **ok** — already matches current routing expectations or only contains normal ADR relationship text.
- **cosmetic** — formatting/casing/style can be normalized without changing decision meaning.
- **routing-risk** — stale path, missing metadata, or old ADR spelling could misroute fresh agents; normalize only with provenance preserved.
- **decision-risk** — edit could change durable authority; requires HITL follow-up before rewriting accepted decision text.

## Inventory

| Path | Title | Status metadata | Date metadata | Relationships / old refs | Classification |
| --- | --- | --- | --- | --- | --- |
| `pi-chart/docs/adr/001-mimic-to-synthea.md` | ADR 001 — Historical data source: MIMIC-IV → Synthea | - **Status:** accepted | - **Date:** 2026-04-20 | relationships: 2 | **cosmetic** — metadata uses legacy bullet style instead of plain Status/Date lines |
| `pi-chart/docs/adr/002-status-lifecycle.md` | ADR 002 — Status lifecycle: envelope `status` vs. `data.status_detail` | - **Status:** accepted (2026-04-21) | - **Date:** 2026-04-20 (drafted; accepted after operator review passes 1 + 2) | relationships: 3 | **cosmetic** — metadata uses legacy bullet style instead of plain Status/Date lines |
| `pi-chart/docs/adr/003-fulfillment-intermediate-action.md` | ADR 003 — Fulfillment graph: intermediate-action model | - **Status:** accepted (2026-04-21) | - **Date:** 2026-04-20 (drafted; accepted after operator review passes 1 + 2) | relationships: 3 | **cosmetic** — metadata uses legacy bullet style instead of plain Status/Date lines |
| `pi-chart/docs/adr/004-effective-at-semantics.md` | ADR 004 — `effective_at` semantics per event type | - **Status:** accepted (2026-04-21) | - **Date:** 2026-04-20 (drafted; accepted after operator review passes 1 + 2) | relationships: 2 | **cosmetic** — metadata uses legacy bullet style instead of plain Status/Date lines |
| `pi-chart/docs/adr/005-interval-primitive.md` | ADR 005 — Interval primitive: optional `effective_period` | - **Status:** accepted (2026-04-21) | - **Date:** 2026-04-20 (drafted; accepted after operator review passes 1 + 2) | relationships: 5 | **cosmetic** — metadata uses legacy bullet style instead of plain Status/Date lines |
| `pi-chart/docs/adr/006-source-kind-taxonomy.md` | ADR 006 — Closed `source.kind` taxonomy | - **Status:** accepted (2026-04-21) | - **Date:** 2026-04-20 (drafted; accepted after operator review pass 2) | relationships: 4 | **cosmetic** — metadata uses legacy bullet style instead of plain Status/Date lines |
| `pi-chart/docs/adr/007-adr-002-006-implementation.md` | ADR 007 — End-to-end implementation for ADRs 002–006 | - **Status:** accepted (implementation authorized 2026-04-21) | - **Date:** 2026-04-21 | relationships: 2 | **cosmetic** — metadata uses legacy bullet style instead of plain Status/Date lines |
| `pi-chart/docs/adr/009-contradicts-link-and-resolves.md` | ADR 009 — Sixth link: `contradicts`, plus `addresses` → `resolves` narrowing | - **Status:** accepted (2026-04-22) | - **Date:** 2026-04-22 (drafted and accepted in one pass; implementation authorized under a forthcoming ADR 009 implementation contract) | relationships: 8; old refs: L107:ADR-009, L150:ADR-009 | **cosmetic** — metadata uses legacy bullet style instead of plain Status/Date lines |
| `pi-chart/docs/adr/010-evidence-ref-roles.md` | ADR 010 — Typed `EvidenceRef` with roles | - **Status:** accepted (2026-04-22) | - **Date:** 2026-04-22 (drafted and accepted in one pass; implementation authorized under a forthcoming ADR 010 implementation contract) | relationships: 7 | **cosmetic** — metadata uses legacy bullet style instead of plain Status/Date lines |
| `pi-chart/docs/adr/011-transform-activity-provenance.md` | ADR 011 — `transform` block: activity-centric provenance | - **Status:** accepted (2026-04-22) | - **Date:** 2026-04-22 (drafted and accepted in one pass; implementation authorized under a forthcoming ADR 011 implementation contract) | relationships: 4 | **cosmetic** — metadata uses legacy bullet style instead of plain Status/Date lines |
| `pi-chart/docs/adr/015-adr-009-011-implementation.md` | ADR 015 — End-to-end implementation for ADRs 009, 010, 011 | - **Status:** accepted (implementation authorized 2026-04-22) | - **Date:** 2026-04-22 | relationships: 8; old refs: L78:ADR-011, L133:ADR-007 | **cosmetic** — metadata uses legacy bullet style instead of plain Status/Date lines |
| `pi-chart/docs/adr/016-broad-ehr-skeleton-clinical-memory.md` | ADR 016 — Broad EHR skeleton as clinical-memory proof surface | Status: accepted | Date: 2026-04-23 | relationships: 3; old refs: L11:.omx/plans/ | **routing-risk** — accepted ADR cites .omx/plans; preserve as provenance, not active work |
| `pi-chart/docs/adr/017-actor-attestation-review-taxonomy.md` | ADR 017 — Actor, attestation, and review taxonomy | Status: accepted (2026-04-26) | Date: 2026-04-24 | relationships: 3 | **ok** — matches current filename/metadata posture |
| `pi-chart/docs/adr/018-architecture-rebase-clinical-truth-substrate.md` | ADR 018 — Architecture rebase: clinical truth substrate over prototype cockpit | Status: accepted | Date: 2026-04-27 | relationships: 3 | **ok** — matches current filename/metadata posture |
| `pi-chart/docs/adr/019-v0-5-clean-canvas-claim-ledger-kernel.md` | ADR 019 — V0.5 clean-canvas claim-ledger kernel | Status: accepted | Date: 2026-05-03 | relationships: 2 | **ok** — matches current filename/metadata posture |
| `pi-monitor/docs/adr/001-rust-native-pi-monitor.md` | ADR-0001 — Rust-native standalone pi-monitor | MISSING | MISSING | relationships: 1; old refs: L1:ADR-0001, L9:.omx/plans/ | **routing-risk** — missing explicit Status/Date metadata line; old ADR-000N spelling appears in title or references; accepted ADR cites .omx/plans; preserve as provenance, not active work |
| `pi-monitor/docs/adr/002-current-json-monitor-extension.md` | ADR-0002 — Backward-compatible current.json monitor extension | MISSING | MISSING | relationships: 1; old refs: L1:ADR-0002 | **routing-risk** — missing explicit Status/Date metadata line; old ADR-000N spelling appears in title or references |
| `pi-monitor/docs/adr/003-public-lane-consumer-authority.md` | ADR-0003 — Public Lane Consumer Authority | Status: Accepted | Date: 2026-05-03 | relationships: 2; old refs: L1:ADR-0003, L10:ADR-0002, L22:ADR-0002 | **routing-risk** — status casing differs from lower-case accepted convention; old ADR-000N spelling appears in title or references |
| `pi-sim/docs/adr/001-validation-recovery-bounded-stop.md` | ADR 001 — Validation Recovery Bounded Stop | Status: accepted (bounded stop for validation-recovery lane per | Date: 2026-04-22 | relationships: 1; old refs: L5:.omx/plans/ | **routing-risk** — accepted ADR cites .omx/plans; preserve as provenance, not active work |
| `pi-sim/docs/adr/002-pi-sim-as-patient-three-stream-topology.md` | ADR 002 — pi-sim as patient; three-stream topology; monitor first-class | Status: accepted | Date: 2026-04-23 | relationships: 2 | **ok** — matches current filename/metadata posture |
| `pi-sim/docs/adr/003-pi-sim-patient-runtime-provider-architecture.md` | ADR 003 — pi-sim patient runtime and provider architecture | Status: accepted | Date: 2026-04-27 | relationships: 3; old refs: L6:.omx/plans/ | **routing-risk** — accepted ADR cites .omx/plans; preserve as provenance, not active work |
| `pi-sim/docs/adr/004-planning-surface-and-public-contract-authority.md` | ADR 004 — Planning Surface and Public Contract Authority | Status: Accepted | Date: 2026-05-03 | relationships: 2; old refs: L17:ADR-003, L17:ADR-002, L23:ADR-002, L23:ADR-003, L14:.omx/plans/, L25:.omx/plans/, L31:.omx/plans/ | **routing-risk** — status casing differs from lower-case accepted convention; accepted ADR cites .omx/plans; preserve as provenance, not active work |

## Findings

1. Filenames already conform to `NNN-kebab-slug.md` across audited ADR directories.
2. `pi-chart` ADRs 001-015 mostly use legacy bullet metadata (`- **Status:** ...`) rather than plain `Status:` / `Date:` lines; this is cosmetic, but normalizing it would improve parser/tool reliability.
3. `pi-monitor` ADRs 001-002 have conforming filenames but old `ADR-000N` titles and missing explicit status/date metadata; this is a routing-risk for fresh agents.
4. `.omx/plans` citations appear in accepted ADRs as provenance. They should stay clearly framed as historical/runtime evidence, not active work queues.
5. No audited ADR requires changing accepted decision meaning to improve style. Any rewrite that changes authority, supersedes/extends meaning, or active execution posture should go through a HITL issue.

## Proposed patch posture

- Safe AFK edits: add/normalize plain metadata lines, normalize title spelling from `ADR-000N` to `ADR NNN` where filename already owns the number, and add provenance wording around `.omx/plans` citations.
- Defer/HITL edits: changing accepted status, changing supersedes/extends relationships, changing producer/consumer authority, or replacing plan authority with a new active roadmap.

## Follow-up

Created `.scratch/project-organization-consistency/issues/07-normalize-adr-style-follow-up.md` as a HITL-gated follow-up for any ADR edit that could alter durable authority.
