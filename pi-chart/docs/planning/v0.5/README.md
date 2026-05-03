# pi-chart V0.5 Planning Index

Status: durable V0.5 index; no implementation authority.

## Authority model

Terminology: V0.5 package-bundle inputs are **archived research packages**. Cite them as `pkg-NNN:<path>` and avoid bare "package" unless referring to package-manager files such as `package.json`.

- `.scratch/pi-chart-v0-5/` — active Matt-compatible PRD, issues, triage state, and durable handoffs for V0.5.
- `.omx/specs/` — interview/source artifacts produced by OMX workflows.
- `.omx/plans/` — RALPLAN/spec-prep workspace and review history; useful lineage, not the active work queue.
- `.omx/package-archive/` — preserved package zips and extracted research packages.
- `pi-chart/memos/` — project-visible architect/founding-engineer memos and mirrors.
- `pi-chart/docs/planning/v0.5/` — durable V0.5 index and distilled planning surfaces.
- `pi-chart/docs/adr/` — accepted repo ADRs only.

## Current V0.5 inputs

- `.scratch/pi-chart-v0-5/foundation-decision-register.md` — draft re-distillation surface for broad prior decisions before clean-canvas coding.
- `.scratch/pi-ledger-claim-ledger-kernel/future-runtime-constraints.md` — active pre-coding constraint surface from all five archived research packages; prevents short-sighted kernel code without expanding Phase 1 scope.
- `.scratch/pi-chart-v0-5-salvage-mining/README.md` — locked future marker for post-kernel salvage mining; prevents deep prototype mining during Phase 1.
- `pi-chart/docs/adr/019-v0-5-clean-canvas-claim-ledger-kernel.md` — accepted clean-canvas guardrails; implementation-home detail is superseded by ADR 020 and `pi-ledger` ADR 001.
- `.scratch/pi-chart-v0-5/PRD.md` — historical/local-markdown PRD bridge for the pre-`pi-ledger` Matt workflow; current kernel implementation lives under `.scratch/pi-ledger-claim-ledger-kernel/`.
- `.omx/plans/prd-v0-5-claim-ledger-kernel.md` — reviewed Phase 1 PRD draft, mirrored into `.scratch` before implementation.
- `.omx/plans/test-spec-v0-5-claim-ledger-kernel.md` — reviewed Phase 1 test-spec draft, mirrored into `.scratch` before implementation.
- `.omx/plans/review-v0-5-claim-ledger-kernel-20260503.md` — Architect+Critic planning review evidence.
- `pi-chart/memos/v0-5-discovery-roadmap-claude-02052026.md` — substantive parallel pass; legacy filename date form means 2026-05-02.
- `pi-chart/memos/v0-5-spec-prep-synthesis-20260503.md` — current synthesis mirror from `.omx/plans/v0-5-spec-prep-synthesis.md`.
- `pi-chart/memos/v0-5-roadmap-conventions-and-gates-20260503.md` — conventions and gates.
- `pi-chart/memos/adr-numbering-reconciliation-20260503.md` — package-vs-repo ADR namespace rules.
- `pi-chart/memos/package-archive-adoption-map-20260503.md` — package source map and adopt/defer/reject/rename register.

## Current lock

No source, schema, package, patient corpus, branch, or implementation-folder changes are authorized until `.scratch/pi-chart-v0-5/` contains approved issue slices for the relevant work. V0.5 implementation should use Matt `$to-issues` slices and Matt `$tdd` discipline unless a later user instruction overrides this.

## Archive posture

Existing `pi-chart/docs/plans/`, `pi-chart/plans/`, `pi-chart/memos/`, and `.omx/*` surfaces are evidence unless this index or a `.scratch` issue names them as active inputs. Banner first; archive second.
