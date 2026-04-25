# PRD — OMX planning history promotion

## Status and source inputs

- Board card: `DOC-002`
- Durable backlog entrypoint: [`kanban-prd-board.md`](kanban-prd-board.md)
- Scope: docs-only maintenance/promotion PRD for deciding which ignored local `.omx` planning history deserves tracked `docs/plans` summary cards.
- Posture: executable documentation lane only; no product-code work, no dependency changes, no direct board edit, and no `.omx` move/rewrite/delete/force-add in this lane.
- Paired verification: [`test-spec-omx-planning-history-promotion.md`](test-spec-omx-planning-history-promotion.md)

Source inputs:

- Parent `.gitignore` rule for `.omx/`, confirmed by `git check-ignore -v .omx .omx/plans/doc-sprawl-source-map.md`.
- `.omx/plans/**` filenames and selected summaries as local execution history, not canonical docs.
- `.omx/context/**`, `.omx/interviews/**`, and `.omx/specs/**` only as source candidates or traceability, not canonical docs.
- `docs/plans/README.md` as source-authority rule: `.omx/plans` PRD/test-spec/report artifacts are execution history unless promoted into `docs/plans`.
- `docs/plans/kanban-prd-board.md` as the durable planning index and DOC-002 board context.
- `.omx/plans/doc-sprawl-source-map.md` as the current inventory, authority hierarchy, and exclusion baseline.
- `.omx/plans/prd-kanban-backlog-expansion.md` for the board-ownership rule: parallel lanes may emit snippets, but an integration/verifier lane owns final board edits.

## Authority / proposal status

`.omx` artifacts are ignored local workflow state by design. `.omx/plans` may contain useful execution history, decisions, acceptance evidence, and source maps, but path location alone does not make any `.omx` artifact canonical product policy.

Promotion means creating or updating a small tracked summary under `docs/plans/` after review. It does **not** mean archiving, rewriting, deleting, force-adding, canonicalizing, or tracking `.omx` wholesale.

## Decision options

| Option | When to use | Result |
|---|---|---|
| Promote summary | Artifact has durable value future agents need without replaying local history. | Add or update a concise tracked `docs/plans` summary with source links, status, decision, and next action. |
| Keep as execution history | Artifact is useful trace/evidence but duplicates current board/PRDs or is too slice-specific. | Leave under ignored `.omx`; reference only when a card names it. |
| Defer review | Artifact may matter but current status is stale, conflicts with higher-authority sources, or lacks owner/HITL selection. | Add no canonical text; revisit only when a later card selects it. |
| Exclude runtime/private churn | Artifact is state/log/session/private/local noise or derived memory without independent decision value. | Do not promote and do not track `.omx` wholesale. |

## Promotion criteria

A candidate may be promoted only when all checks pass:

1. **Durable value** — preserves a decision, acceptance report, source map, or execution contract likely to matter across sessions.
2. **Non-duplicative** — adds a clearer handoff than existing `docs/plans` surfaces and avoids restating stale `.omx` drafts.
3. **Source-linked** — cites the original `.omx/...` source path and any higher-authority sources it depends on.
4. **Current enough** — reflects repo reality or explicitly marks stale/deferred/conflicting portions.
5. **Small promotion card/summary only** — link rather than copy; include only decision, source path, current/stale status, and next action.
6. **Not runtime churn** — excludes ignored runtime, session, private, and local mechanics.
7. **Needed through `docs/plans`** — future agents should benefit by reading the board-linked tracked summary instead of scanning local `.omx` history.

## Do not promote criteria

Do not promote, track, or canonicalize these as durable docs:

- `.omx/state/**`, `.omx/logs/**`, runtime traces, session mechanics, lock files, local workflow progress, or generated transient state.
- The whole `.omx/` directory or any wholesale `.omx` force-add.
- Duplicative `.omx` PRD/test-spec drafts already represented by tracked `docs/plans` PRDs, test specs, board rows, or accepted ADRs.
- Stale unlabeled proposals that do not clearly say accepted, current, deferred, superseded, or rejected.
- Private/local credentials, environment details, machine paths that are not useful source paths, or hidden simulator state.
- `.omx/context/**`, `.omx/interviews/**`, `.omx/specs/**`, `/wiki`, and `.omx/wiki/**` as canonical policy by path alone; use them only as traceability or source candidates.
- Any artifact that would require moving, rewriting, deleting, archiving, canonical promotion, or force-add before HITL approval.

## Thin tracer bullets

| Tracer | Purpose | Owned files | First failing / characterization validation | Verification command | Boundary |
|---|---|---|---|---|---|
| DOC2-TB-1 Backlog entrypoint contract | Keep `docs/plans/kanban-prd-board.md` as the durable backlog entrypoint while DOC-002 stays in its paired docs. | `docs/plans/prd-omx-planning-history-promotion.md`; `docs/plans/test-spec-omx-planning-history-promotion.md` | Characterization fails if the PRD does not name the board as durable backlog entrypoint or does not say this lane avoids direct board edits. | `grep -n "durable backlog entrypoint\|no direct board edit\|integration/verifier" docs/plans/prd-omx-planning-history-promotion.md` | No product roots; no direct board edit; no `.omx` move/rewrite/delete/force-add. |
| DOC2-TB-2 Promotion criteria hardening | Convert the checklist into testable promote/do-not-promote policy. | `docs/plans/prd-omx-planning-history-promotion.md`; `docs/plans/test-spec-omx-planning-history-promotion.md` | Fails if the PRD lacks explicit promotion criteria, do-not-promote criteria, `link rather than copy`, `decision`, `source path`, `current/stale status`, and `next action`. | `python3 - <<'PY'\nfrom pathlib import Path\nprd=Path('docs/plans/prd-omx-planning-history-promotion.md').read_text()\nrequired=['Promotion criteria','Do not promote criteria','link rather than copy','decision','source path','current/stale status','next action','small promotion card/summary only']\nmissing=[x for x in required if x not in prd]\nassert not missing, missing\nPY` | No wholesale `.omx`; no stale duplicate copies; no new dependencies. |
| DOC2-TB-3 HITL checkpoint | Block silent movement from ignored/local history into tracked/canonical policy. | `docs/plans/prd-omx-planning-history-promotion.md`; `docs/plans/test-spec-omx-planning-history-promotion.md` | Fails if HITL language does not cover `.omx` move, rewrite, archive, delete, canonical promotion, and force-add. | `grep -n "HITL\|move\|rewrite\|archive\|delete\|canonical promotion\|force-add" docs/plans/prd-omx-planning-history-promotion.md docs/plans/test-spec-omx-planning-history-promotion.md` | No `.omx` mutation or canonicalization before human approval. |
| DOC2-TB-4 Test-spec tracer coverage | Mirror every DOC2 tracer in executable docs-only validation. | `docs/plans/test-spec-omx-planning-history-promotion.md` | Fails if the test spec omits any `DOC2-TB-*` row or the stale-duplication guard. | `python3 - <<'PY'\nfrom pathlib import Path\nspec=Path('docs/plans/test-spec-omx-planning-history-promotion.md').read_text()\nrequired=['DOC2-TB-1','DOC2-TB-2','DOC2-TB-3','DOC2-TB-4','DOC2-TB-5','stale-duplication guard']\nmissing=[x for x in required if x not in spec]\nassert not missing, missing\nPY` | Test docs only; no `src`, `schemas`, `patients`, or `scripts` edits. |
| DOC2-TB-5 Board row snippet only | Provide a non-canonical future board handoff without editing the board in this lane. | `docs/plans/prd-omx-planning-history-promotion.md`; `docs/plans/test-spec-omx-planning-history-promotion.md` | Fails if the PRD lacks a future handoff snippet or fails to mark it non-canonical until an integration/verifier owner applies it. | `grep -n "future handoff snippet only\|not a direct edit request\|integration/verifier owns board application" docs/plans/prd-omx-planning-history-promotion.md docs/plans/test-spec-omx-planning-history-promotion.md` | No direct `docs/plans/kanban-prd-board.md` edit; board application is deferred. |

## Candidate classes worth preserving after HITL

These are candidate classes, not approvals:

| Candidate class | Worth preserving when | Likely tracked home | Notes |
|---|---|---|---|
| Source maps and authority inventories | They prevent future agents from rescanning local history and identify source-of-truth relationships. | Existing or future `docs/plans/*source-map*.md` or card section. | Example source candidate: `.omx/plans/doc-sprawl-source-map.md`; summarize, do not copy wholesale. |
| Acceptance/evidence reports | They record verified behavior and exact test evidence that changes sequencing. | Board follow-up row, acceptance report under `docs/plans/`, or linked PRD evidence section. | Example source candidate: `.omx/plans/workstream-a-memory-proof-acceptance-report.md`; preserve only decision/evidence/next action. |
| Consensus planning contracts | They define future tracer bullets, ownership, deferrals, and verification that are not yet represented in tracked docs. | Paired `prd-*.md` / `test-spec-*.md` under `docs/plans/`. | Promote only if still current and not duplicative of existing board/PRD surfaces. |
| HITL decisions or deferral registers | They prevent stale proposals from being treated as accepted policy. | ADR, board row, or decision PRD depending on authority. | Must label accepted/current/deferred/superseded/rejected. |

## Non-canonical future board handoff snippet

This is a future handoff snippet only. It is not a direct edit request for `docs/plans/kanban-prd-board.md`; integration/verifier owns board application.

| Card | PRD | Test spec | Status | Next action | HITL gate |
|---|---|---|---|---|---|
| DOC-002 `.omx` planning history promotion | [`prd-omx-planning-history-promotion.md`](prd-omx-planning-history-promotion.md) | [`test-spec-omx-planning-history-promotion.md`](test-spec-omx-planning-history-promotion.md) | Executable docs-only promotion policy; HITL-gated. | Run `DOC2-TB-1` through `DOC2-TB-5`; then choose one `.omx` candidate class for later tracked summary, if any. | Human approves source artifact/class, target tracked file, output status, and stale omissions before any `.omx` move/rewrite/archive/delete/canonical promotion/force-add. |

## HITL checkpoint

Before any action beyond this PRD/test-spec pair, a human must approve the candidate artifact or artifact class. The approval must identify:

- source `.omx/...` path(s),
- target tracked `docs/plans` file or board row,
- whether the output is policy, evidence, source map, or execution handoff,
- stale/conflicting sections to omit or mark deferred,
- confirmation that no `.omx` move, rewrite, archive, delete, canonical promotion, or force-add is authorized unless explicitly stated.

No `.omx` move, rewrite, archive, delete, canonical promotion, or force-add occurs before HITL approval.

## Acceptance criteria

1. Future agents can start at `docs/plans/kanban-prd-board.md`, then read this PRD/test spec without scanning all `.omx` history.
2. The PRD contains 3–6 thin tracer bullets with owned files, first validation, verification command, and boundary for each bullet.
3. Promotion criteria are testable and require durable value, non-duplication, source links, current/stale status, link-not-copy summarization, and `docs/plans` need.
4. Do-not-promote criteria explicitly exclude runtime churn, private/local state, hidden simulator state, stale unlabeled proposals, duplicative drafts, and wholesale `.omx` tracking.
5. The HITL checkpoint blocks any `.omx` move, rewrite, archive, delete, canonical promotion, or force-add before human approval.
6. DOC-002 remains docs-only: no product roots, no new dependencies, no direct board edit, and no `.omx` mutation are authorized.
7. The paired test spec validates tracer IDs, stale-duplication guard, board snippet non-canonical wording, and lane boundaries.

## Verification command

```bash
python3 - <<'PY'
from pathlib import Path
prd_path = Path('docs/plans/prd-omx-planning-history-promotion.md')
spec_path = Path('docs/plans/test-spec-omx-planning-history-promotion.md')
prd = prd_path.read_text()
spec = spec_path.read_text()
required_prd = [
    'durable backlog entrypoint',
    'DOC2-TB-1', 'DOC2-TB-2', 'DOC2-TB-3', 'DOC2-TB-4', 'DOC2-TB-5',
    'Promotion criteria', 'Do not promote criteria',
    'link rather than copy', 'decision', 'source path', 'current/stale status', 'next action',
    '.omx/state/**', '.omx/logs/**', 'private/local credentials', 'hidden simulator state',
    'future handoff snippet only', 'not a direct edit request', 'integration/verifier owns board application',
    'No `.omx` move, rewrite, archive, delete, canonical promotion, or force-add occurs before HITL approval',
]
missing_prd = [item for item in required_prd if item not in prd]
if missing_prd:
    print('Missing PRD requirements:', missing_prd)
    raise SystemExit(1)
required_spec = [
    'DOC2-TB-1', 'DOC2-TB-2', 'DOC2-TB-3', 'DOC2-TB-4', 'DOC2-TB-5',
    'stale-duplication guard',
    'source-linked', 'current/stale-marked', 'non-duplicative', 'link rather than copy',
    'docs/plans/prd-omx-planning-history-promotion.md',
    'docs/plans/test-spec-omx-planning-history-promotion.md',
]
missing_spec = [item for item in required_spec if item not in spec]
if missing_spec:
    print('Missing test-spec requirements:', missing_spec)
    raise SystemExit(1)
PY
```

## Explicit deferrals

- No promotion of a specific `.omx` artifact in this lane.
- No direct edit to `docs/plans/kanban-prd-board.md`; only the non-canonical handoff snippet above is provided.
- No archive, rewrite, deletion, movement, canonical promotion, or force-add of `.omx` content.
- No final decision that older `.omx` drafts are superseded, rejected, or accepted.
- No product-code, schema, patient fixture, script, runtime test, or dependency changes.
- No acceptance of proposed/memo-only clinical, actor, adapter, FHIR/openEHR, or simulator policy by implication.
