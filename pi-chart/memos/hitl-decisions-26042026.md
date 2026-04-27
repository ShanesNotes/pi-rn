# HITL decision record — 2026-04-26

Status: HITL dispositions captured via deep-interview chat session.
Operator: Shane (smccusker22@gmail.com)
Source survey: Phase A status report + post-a3-vitals lane review.
Records 11 governance decisions blocking further pi-chart work.

This record is decision-only. Each disposition authorizes a follow-up lane (PRD, ADR, commit, or tracker update); no implementation is performed by recording the disposition itself.

## Decision summary

| # | Blocker | Decision | Follow-up lane |
|---|---|---|---|
| 1 | ADR17 disposition | **Accept** | Update `decisions/017-actor-attestation-review-taxonomy.md` to status: accepted; update `docs/plans/kanban-prd-board.md` ADR17-001 row from "proposed/non-canonical" to "accepted". |
| 2 | a3 vitals strictness | **Permissive (window OR event-refs)** | New TB-V slice: land `V-VITALS-01` in `src/validate.ts` flagging only the "no vital evidence at all" shape. Test 4 marker in `src/views/vitalsTrend.test.ts` resolves. |
| 3 | Untracked `src/views/bundle.ts` + `bundle.test.ts` | **Open new PRD** | Write `docs/plans/prd-context-bundle-implementation.md` + test-spec; new board card distinct from S5-001 (which stays docs-only); land bundle.ts under that authority. |
| 4 | Dirty agent-canvas baseline | **Commit as one prototype lane** | Single tracked commit: agent-canvas changes + `docs/design/` add + `design-inbox/` deletes. No new PRD. Restores clean baseline precondition for next planning lane. |
| 5 | Phase A next-artifact selection | **a6/a7 notes (combined)** | Open `docs/plans/prd-phase-a-notes-translation.md` + test-spec for provider+nursing notes view/validator translation. Mirror a3 TB-style boundary discipline. |
| 6 | A9b orderset invocation | **Plan-only ADR lane** | Write ADR (proposed `decisions/018-orderset-invocation.md`) capturing direction without authorizing implementation. No PRD/test-spec until separate HITL go-ahead. |
| 7 | PHA-TB-1 remaining open-schema anchors | **Batch by topic now** | Schedule TB-1.5 lane: group remaining ~65 anchors in `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md` by clinical topic (vitals, MAR, notes, orders); per-topic disposition pass. |
| 8 | ADR012/ADR013 identity/hash + invalidation | **Plan-only ADRs** | Write ADR012 (identity/hash chain) + ADR013 (invalidation cache) capturing direction; do not authorize `src/hash.ts` / `src/identity.ts` implementation. |
| 9 | ADR008 profile registry | **Plan-only ADR008** | Refresh ADR008 to capture profile-registry direction; do not authorize `profiles/`, `schemas/profile.schema.json`, or registry loader. `V-PROFILE-01` hook stays inert. |
| 10 | BND-001 adapter boundary | **Keep deferred** | No concrete consumer named. Export-only remains default. BND-TB-0..4 stay planning-only tracer bullets. Board row unchanged. |
| 11 | DOC-002 .omx promotion | **Batch promote durable summaries** | Schedule DOC-002 lane: per the spec criteria (durable, non-duplicative, source-linked, current, non-runtime-churn), batch promote qualifying `.omx/plans/` artifacts into `docs/plans/` summaries in one pass. |

## Unblock graph

Decision-only items below unblock work without further interview. Each follow-up lane is now authorized by this record; the lane itself still needs its own PRD/test-spec where applicable.

**Immediate code-eligible lanes (PRD/test-spec authorized):**
- #2 → TB-V slice for `V-VITALS-01` (smallest; one validator rule + tests)
- #3 → context-bundle implementation PRD (untracked code already written; PRD legitimizes it)
- #5 → a6/a7 notes translation PRD (mid-size; mirrors a3 pattern)

**Decision capture lanes (ADR/markdown only, no code):**
- #1 → update ADR017 + board row
- #6 → write proposed ADR018 (orderset invocation)
- #8 → write ADR012 + ADR013 (identity/hash + invalidation)
- #9 → refresh ADR008 (profile registry)

**Repository hygiene lanes:**
- #4 → single agent-canvas/prototype commit
- #7 → schedule TB-1.5 anchor disposition pass
- #11 → schedule DOC-002 promotion pass

**No-action lanes:**
- #10 → BND-001 stays deferred; no follow-up

## Recommended sequencing

1. **#4 baseline cleanup** — preconditions for any other lane. One commit.
2. **#1 ADR17 update + #2 V-VITALS-01 + #3 bundle PRD** — small, parallel, immediate unblocks. Decision-only or tiny code.
3. **#5 a6/a7 notes translation** — next major Phase A lane.
4. **#6, #8, #9 plan-only ADRs** — write in one batch; no code, parallel-safe.
5. **#7 TB-1.5 anchor disposition** — heavy ledger pass; schedule when next major implementation lane needs it.
6. **#11 DOC-002 batch promotion** — administrative; lowest urgency.

## Open follow-up questions (not asked in this round)

These were not asked but should be recorded as known unknowns for the next governance interview:

- For #5 a6/a7: should provider and nursing notes share a single view file or be split (mirroring trend.ts vs vitalsTrend.ts)?
- For #6 ADR018 (orderset): is the primitive an `intent.orderset_invocation` or a composition of existing `intent.order` events with a shared `template_id`?
- For #8 ADR012: does logical_id replace the existing `id` field or augment it?
- For #11 DOC-002: who decides which `.omx/plans/` artifacts qualify as "durable" — same operator or a separate review pass?

## Provenance

- Survey: pi-chart status report at `~/.claude/plans/i-recently-complete-phase-fancy-trinket.md` (this session, 2026-04-26).
- Source board: `docs/plans/kanban-prd-board.md`.
- Source acceptance reports: `docs/plans/phase-a-bridge-acceptance-report.md`, `docs/plans/v03-foundation-reconciliation-acceptance-report.md`.
- Interview transport: AskUserQuestion (deep-interview skill, 11 rounds, one question per round).
- Record format: per global feedback memory `feedback_artifacts_in_repo_memos.md` (memos/ with DDMMYYYY suffix).
