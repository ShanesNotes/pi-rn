# PRD — V03 foundation reconciliation

## Status

- Board card: `V03-001`
- Artifact depth: executable planning card; docs-only until HITL handoff.
- Scope: reconcile v0.3 memo/roadmap claims against current repo reality.
- Authority rule: accepted ADRs and brownfield tests/code are canonical; v0.3 memo content is evidence/proposal unless promoted by accepted ADR/HITL.
- Implementation boundary: this lane may update this PRD, its test spec, and the board row only. It must not edit `src/`, `schemas/`, `patients/`, `scripts/`, `profiles/`, ADRs, roadmap roots, or memos.

## Source inputs and current authority

| Source | Current status | Use in this lane |
|---|---|---|
| `docs/plans/kanban-prd-board.md` | Canonical backlog entrypoint | Board card and HITL state only. |
| `ROADMAP.md` | Current roadmap | Brownfield status and deferred primitive register. |
| `memos/pi-chart-v03-memo.md` | Evidence/proposal | Bucket every relevant section before use. |
| `decisions/009-contradicts-link-and-resolves.md` | Accepted | Canonical for `contradicts`, `resolves`, contested views. |
| `decisions/010-evidence-ref-roles.md` | Accepted | Canonical for typed `EvidenceRef` and role rules. |
| `decisions/011-transform-activity-provenance.md` | Accepted | Canonical for optional `transform`. |
| `decisions/015-adr-009-011-implementation.md` | Accepted implementation contract | Canonical `0.3.0-partial` execution reality for ADRs 009/010/011. |
| `decisions/016-broad-ehr-skeleton-clinical-memory.md` | Accepted | Current broad-EHR skeleton driver and hidden-sim boundary. |
| `decisions/017-actor-attestation-review-taxonomy.md` | Proposed/non-canonical | Decision input only; no implementation authority. |

## Refined acceptance criteria

1. Every v0.3 memo section that can affect implementation is bucketed as `accepted/current`, `stale/superseded`, `deferred/backlog`, `needs-ADR/HITL`, or `rejected/out-of-scope`.
2. ADR 009/010/011/015/016 decisions are preserved as accepted/current and are not re-litigated.
3. ADR17 remains labeled `proposed/non-canonical` wherever actor, attestation, review, or governance behavior appears.
4. Brownfield reality is explicit: current repo is `schema_version: 0.3.0-partial`; ADR 009/010/011 surfaces exist; absence list is documented: No `profiles/`; No `src/hash.ts`; No `src/identity.ts`; No `src/views/bundle.ts`; No `schemas/profile.schema.json`.
5. Stale or contradictory v0.3 memo claims include risk and disposition so a later implementation agent cannot treat them as current scope.
6. Deferred items name the required future authority: HITL choice, accepted ADR, separate PRD, or rejection.
7. Each tracer bullet has owned files, first characterization validation, verification command, and explicit product-code exclusion.
8. Verification compares product-root diffs against a captured preflight baseline; it does not assume the repo is globally clean.
9. The lane ends at a HITL checkpoint. No deferred/proposed item advances to implementation until the operator chooses an exact next lane.

## Row-level reconciliation dispositions

| Memo / roadmap claim | Evidence link | Bucket | Current repo truth | HITL? | Next lane / disposition |
|---|---|---|---|---|---|
| `contradicts` link, `resolves`, contested view support | `memos/pi-chart-v03-memo.md` §2; ADR 009/015 | accepted/current | Present in schema/types/validator/views/tests under `0.3.0-partial`. | No | Do not reopen; use as foundation for Phase A fixture work. |
| Typed `EvidenceRef` with roles | Memo §3.5; ADR 010/015 | accepted/current | Present in `schemas/event.schema.json`, `src/evidence.ts`, `src/validate.ts`, tests. | No | Do not downgrade to proposal. |
| Optional `transform` block | Memo §3.2; ADR 011/015 | accepted/current | Present in schema/types/validator/tests; optional and not backfilled. | No | Use only where future cards explicitly need provenance. |
| Full `0.3.0` release claim | Memo §8/§10/§13 vs ROADMAP/ADR 015 | stale/superseded | Repo is `schema_version: 0.3.0-partial`; ADRs 012/013 not implemented. | Yes, if changing version policy | Keep `0.3.0-partial`; future full-version bump needs separate authority. |
| `profiles/` registry and `profile` field as v0.3 keystone | Memo §3.1/§4 | deferred/backlog | No `profiles/`, no `schemas/profile.schema.json`, no `src/profiles.ts`, no event `profile` field in current schema. | Yes | Separate ADR/PRD before implementation; do not infer profile behavior now. |
| `logical_id`, `fingerprint`, `prev_hash`, `invalidated_at` | Memo §3.3/§3.4 | deferred/backlog | No `src/hash.ts`, `src/identity.ts`, hash-chain, logical-id, or invalidated cache implementation. | Yes | Candidate ADR 012/013 lane only after operator selects it. |
| `contextBundle` helper and bundle fingerprint | Memo §5.4 | deferred/backlog | No `src/views/bundle.ts`; memory proof currently lives in existing projections. | Yes | Separate read-side PRD if needed for agent context bundles. |
| Protocols, problem threads, ordersets | Memo §6 | needs-ADR/HITL | Not current primitives; Phase A A8/A9a may create pressure later. | Yes | Wait for concrete fixture pressure and separate ADR/PRD. |
| Actor/review/attestation taxonomy | Memo §7.1; ADR17 | needs-ADR/HITL | ADR17 is proposed/non-canonical; no schema/profile implementation authorized. | Yes | Operator must accept, revise, split, defer, or reject ADR17 first. |
| Suppression and incident snapshots | Memo §7.2/§7.3 | needs-ADR/HITL | Not implemented; incident `source.kind` additions absent. | Yes | Separate safety/governance PRD if selected. |
| FHIR/openEHR internal model | Memo §9; ROADMAP later/speculative | rejected/out-of-scope | Boundary adapter only; internal model remains pi-chart claim stream. | Yes, only to change boundary policy | Keep rejected for core; adapter work belongs to BND-001. |
| Hidden simulator physiology in chart/agent context | ADR 016; broad EHR reference | rejected/out-of-scope | Boundary requires public observations/artifacts only. | Yes, only to change boundary policy | Preserve pi-chart/pi-agent/pi-sim separation. |

## Thin tracer bullets for later execution

| Bullet | Purpose | Owned files | First characterization validation | Verification command | Product-code exclusion |
|---|---|---|---|---|---|
| `V03-TB-1` Authority/source bucket table | Keep source authority and memo dispositions executable. | `docs/plans/prd-v03-foundation-reconciliation.md` | Python check asserts all five buckets and all required source paths occur in the disposition table. | `python3 docs/plans/_inline_v03_check.py` if promoted; for now use the inline commands in the test spec. | No edits outside `docs/plans/**`. |
| `V03-TB-2` Brownfield current/absence inventory | Record what exists vs what memo still proposes. | PRD + test spec | Validation asserts `0.3.0-partial`, ADR 009/010/011 terms, and absent surfaces (`profiles/`, `src/hash.ts`, `src/identity.ts`, `src/views/bundle.ts`, `schemas/profile.schema.json`). | Inline brownfield validation in paired test spec. | Do not create missing surfaces. |
| `V03-TB-3` Stale-doc contradiction register | Prevent stale memo text from becoming hidden scope. | PRD | Table rows include `stale/superseded` or `deferred/backlog` for full `0.3.0`, profiles, hash/identity, and bundle claims. | Inline contradiction validation in paired test spec. | Do not edit `ROADMAP.md`, memos, or ADRs in this lane. |
| `V03-TB-4` Deferred authority queue | Make next authority gate explicit for proposed/deferred items. | PRD + optional board row | Validation asserts each deferred/proposed row carries `HITL?` and `Next lane / disposition`. | Inline HITL/deferral validation in paired test spec. | No ADR drafting or schema/profile implementation. |
| `V03-TB-5` No-product-change proof | Prove this was planning-only and safe in a dirty repo. | Test spec; optional board row | Capture preflight baseline, then compare product-root diff against it. | `git diff --name-only -- src schemas patients scripts profiles` compared to preflight baseline. | Product roots remain unchanged relative to baseline. |

## HITL checkpoint before implementation

Before any implementation handoff, the operator must choose exactly one:

1. **Keep V03 deferred** and return to Phase A broad-EHR skeleton execution using accepted ADR 009/010/011/016 only.
2. **Promote ADR17 decision work**: accept, revise, split, defer, or reject `decisions/017-actor-attestation-review-taxonomy.md`; still no product code until accepted.
3. **Open ADR012/ADR013 lane** for identity/hash or `invalidated_at`; create a new PRD/test spec before code.
4. **Open profile-registry lane** for ADR008/profile work; create a new PRD/test spec before code.
5. **Open read-side context-bundle lane** if agent-context export becomes the selected need; create a new PRD/test spec before code.
6. **Reject/defer remaining v0.3 memo proposals** and record no implementation authority.

## Explicit deferrals

- No profile registry, profile schema, profile field, or profile validator implementation.
- No actor/review/attestation implementation until ADR17 or successor is accepted.
- No protocol, orderset, longitudinal problem-thread, suppression, incident snapshot, hash/identity, invalidation-cache, or context-bundle implementation.
- No FHIR/openEHR internal-model work; boundary adapters remain future BND-001 work.
- No pi-agent or pi-sim coupling; hidden simulator state remains outside pi-chart.
- No new dependencies.
- No product-root changes in this lane.
