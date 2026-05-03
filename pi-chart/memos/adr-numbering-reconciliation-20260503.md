# ADR Numbering Reconciliation for V0.5

Date: 2026-05-03
Status: Phase 0 planning memo; planning artifact only; no implementation authority.
Primary sources:
- `pi-chart/memos/v0-5-roadmap-conventions-and-gates-20260503.md`
- `pi-chart/memos/v0-5-spec-prep-synthesis-20260503.md`

## 1. Purpose

V0.5 planning imports package-archive materials whose internal ADR numbers overlap with accepted `pi-chart` ADR numbers. This memo reconciles those namespaces before any package-derived concept is promoted into `pi-chart/docs/adr/`.

This memo does not accept, supersede, renumber, or implement any ADR. It only defines the numbering and citation rules that future PRDs, test-specs, and accepted ADR drafts MUST follow.

## 2. Problem statement

`pi-chart/docs/adr/` is the only accepted repo ADR namespace. The current accepted repo sequence ends at `pi-chart/docs/adr/018-architecture-rebase-clinical-truth-substrate.md`.

The V0.5 package archive also contains ADR-labeled materials such as package ADR 018/019/022/023/024. Those package numbers are valuable research identifiers, but they conflict with accepted repo numbering. In particular, package-derived ADR 018 claim-ledger concepts must not be confused with accepted repo ADR 018, which is the architecture rebase decision.

There is also a local sequencing conflict: accepted repo ADR 018 anticipated a future "ADR 019" for a clean-slate service/event-store spike decision, while the V0.5 conventions memo now records that the first accepted V0.5 kernel ADR should be `pi-chart/docs/adr/019-v0-5-claim-ledger-kernel.md` if approved. Because the spike ADR was only a follow-up placeholder and no `019-*` accepted ADR exists, the next accepted repo ADR number remains `019`.

## 3. Reconciled namespaces

### 3.1 Accepted repo ADR namespace

- Accepted repo ADRs MUST live in `pi-chart/docs/adr/`.
- Accepted repo ADRs MUST use the repo-local numeric sequence represented by files in `pi-chart/docs/adr/`.
- The next accepted repo ADR number is `019` unless a new accepted ADR is created first.
- Historical gaps or reservations in the repo sequence MUST NOT be backfilled or renumbered as part of V0.5.
- Accepted repo ADR status MUST come from an accepted file in `pi-chart/docs/adr/`, not from package metadata, memo language, PRD language, or an issue backlog.

### 3.2 Package-archive ADR namespace

- Package ADR numbers MUST remain archival identifiers inside `.omx/package-archive/`.
- Package-internal statuses such as "accepted", "implementation pending", or issue labels MUST be treated as research metadata only.
- A package ADR number MUST NOT be cited as if it were an accepted repo ADR number.
- A package concept promoted into repo architecture MUST receive a new accepted repo ADR number and MUST cite the package source that informed it.

### 3.3 Planning memo namespace

- `pi-chart/memos/` holds project-visible planning and architect/founding-engineer memos.
- Memos MAY recommend future ADRs, but they MUST NOT claim accepted ADR status.
- A memo path such as `pi-chart/memos/adr-numbering-reconciliation-20260503.md` is not an accepted ADR path.

## 4. Decision rule for V0.5 ADR promotion

When a package-derived concept is ready for accepted repo ADR review:

1. Assign the next available accepted repo ADR number from `pi-chart/docs/adr/`.
2. Draft the accepted ADR in `pi-chart/docs/adr/NNN-<slug>.md`.
3. Cite every package source that materially shaped the decision.
4. Preserve package ADR numbers as source labels, not as repo decision numbers.
5. Include an explicit package adoption/defer/reject table when the accepted ADR is package-derived.
6. Include a `Delta from synthesis` table if the ADR diverges from the V0.5 synthesis stance.
7. Do not copy package-internal acceptance status into repo acceptance status.

## 5. First V0.5 kernel ADR

If a V0.5 claim-ledger kernel ADR is approved, the first accepted V0.5 kernel ADR SHOULD be:

`pi-chart/docs/adr/019-v0-5-claim-ledger-kernel.md`

This ADR would cite package ADR 018 claim-ledger materials and the V0.5 synthesis, but it would not become "package ADR 018" and would not alter accepted repo ADR 018.

The clean-slate service/event-store spike follow-up named in accepted repo ADR 018 remains valid as a future decision need, but it SHOULD take the next available repo ADR number at the time it is actually drafted and accepted. Do not reserve `019` for that placeholder after `019-v0-5-claim-ledger-kernel.md` is accepted.

## 6. Required citation convention

Use these citation forms:

- Accepted repo ADR: `pi-chart/docs/adr/018-architecture-rebase-clinical-truth-substrate.md §Decision`
- Package source: `pkg-018:<relative-package-path> §<section>`
- Package ADR in prose: `package ADR 018 (pkg-018:<relative-package-path> §<section>)`
- Cross-spec or synthesis source: `v0.5-synthesis §3` or `v0.5-conventions §6 L1`
- Brownfield code evidence: `pi-chart/<path>:<line-start>-<line-end>`

PRDs and test-specs MUST use `package ADR NNN` or `pkg-NNN:` when referring to package archive ADRs. They MUST reserve bare `ADR NNN` for accepted repo ADRs in `pi-chart/docs/adr/`.

## 7. PRD and test-spec guardrails

Future V0.5 PRDs and test-specs MUST NOT say:

- "ADR 018 requires the claim-ledger kernel" unless they mean accepted repo ADR 018 and cite that file.
- "ADR 022 is accepted" when referring to package ADR 022.
- "Implement ADR 018/019/022/023/024" without naming the package namespace and the repo acceptance status.

Future V0.5 PRDs and test-specs MUST say, for example:

- "Package ADR 018 proposes the claim-ledger kernel; this PRD adopts only the K0-K6 subset."
- "Accepted repo ADR 018 remains the architecture-rebase decision; V0.5 claim-ledger acceptance is pending a future repo ADR."
- "This PRD cites `pkg-018:<path> §<section>` as research input, not accepted repo authority."

## 8. Delta from synthesis

| Topic | Synthesis stance | This memo stance | Reason | Approval |
| --- | --- | --- | --- | --- |
| Package ADR numbers | Package ADR numbers remain archival identifiers. | Same. | Prevent namespace collision. | Planning memo only. |
| Accepted repo sequence | Repo ADR numbers continue from current `pi-chart/docs/adr/` sequence. | Same; next accepted number is `019` unless another accepted ADR lands first. | Current repo sequence ends at 018. | Planning memo only. |
| Kernel ADR | Kernel ADR becomes `019-v0-5-claim-ledger-kernel.md` if accepted. | Same. | Matches V0.5 conventions L1. | Planning memo only. |
| ADR 018 spike placeholder | Not explicitly resolved in synthesis. | Future clean-slate/service-event-store spike ADR uses the next available repo number when accepted. | Accepted ADR 018 contains a placeholder, not an existing ADR file or reservation. | Planning memo only. |

## 9. Acceptance checklist for future accepted ADR drafts

Before any package-derived accepted ADR is promoted into `pi-chart/docs/adr/`, verify:

- [ ] The ADR number is the next available accepted repo number.
- [ ] The ADR file lives under `pi-chart/docs/adr/`.
- [ ] Package sources are cited with `pkg-NNN:` or `package ADR NNN` labels.
- [ ] No package-internal status is copied as repo acceptance status.
- [ ] The ADR states which package material is adopted, deferred, or rejected.
- [ ] Any divergence from V0.5 synthesis has a `Delta from synthesis` row.
- [ ] No source, schema, fixture, or package edit is bundled with the ADR promotion.

## 10. Non-goals

- No source-code implementation.
- No schema changes.
- No `package.json` or lockfile changes.
- No renumbering of existing accepted ADR files.
- No promotion of package archive ADRs into accepted repo ADRs.
- No decision on backend storage, PHI posture, predicate tiers, runtime orchestration, or package adoption beyond the numbering and citation rules above.
