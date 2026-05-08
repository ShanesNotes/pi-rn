# Next-stage plan: shift-start packet + report projection + workflow grammar

Status: ready-for-human
Parent PRD: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`
Depends on completed issues:
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/01-per-patient-shift-start-workflow-tracer.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/02-canonical-memory-vs-derived-projection-contract.md`

## Purpose

Plan the next execution lane after the Ralph-completed foundation docs. Issues 01 and 02 established the ICU nurse shift-start workflow spine and the canonical-memory vs derived-projection safety contract. The next stage should turn that foundation into the first usable derived context surfaces without selecting implementation architecture.

## Recommended next lane

Run issues 03, 04, and 06 as the next small batch:

1. **Issue 03 — One-page nursing report projection**
   - Builds the derived handoff/report scaffold from canonical chart facts/actions/notes/refs.
   - Keeps the Corewell-style report sheet as workflow evidence, not UI mandate or chart truth.
2. **Issue 04 — Shift-start chart-digging packet**
   - Defines what the nurse needs during report: H&P, ICU note, vitals, drips/dose rates, I&O, labs, and task list.
   - Applies hot/warm/cold behavior without backend or retrieval decisions.
3. **Issue 06 — Workflow item source and authority grammar**
   - Defines why a task is on the list, who/what created it, authority posture, due window, completion criteria, and defer/block/carry-forward state.
   - Enables later human-agent boundary, prioritization, med timing, and order-set/cadence slices.

## Why this order

- Issue 03 makes the nurse handoff sheet concrete as a derived projection.
- Issue 04 fills the chart-digging packet behind the report surface.
- Issue 06 gives workflow items enough source/authority grammar for later prioritization and agent-suggestion work.

These three are independent enough for a small `$team` or sequential `$ralph`, but they share enough vocabulary that the leader should verify consistency afterward.

## Execution options

### Option A — Sequential Ralph

Use `$ralph` on issues 03, 04, and 06 in order.

Best when:

- preserving conceptual consistency matters more than throughput;
- user wants one owner to integrate language;
- no source implementation is planned.

Suggested stop condition:

- three artifacts created;
- issues 03, 04, and 06 marked `ready-for-human` with acceptance criteria checked;
- structural docs verification passes;
- architect review approves consistency with issues 01 and 02.

### Option B — Small team

Run a three-lane docs team with one issue per lane, then leader integration.

Best when:

- user wants faster drafting;
- workers can stay strictly inside separate artifact files;
- leader can reconcile terminology afterward.

Suggested lanes:

- Lane A: report projection artifact for issue 03.
- Lane B: chart-digging packet artifact for issue 04.
- Lane C: workflow item source/authority grammar artifact for issue 06.
- Leader: integration review against issues 01 and 02, then closeout evidence.

## Required boundaries for the next lane

- Docs-only unless explicitly re-scoped.
- No backend/vector/OpenBrain/storage/runtime/access-plane choice.
- No adapter architecture choice.
- No `pi-ledger` kernel expansion.
- No hidden `pi-sim` internals.
- No direct agent accepted-writes.
- No autonomous task completion.
- One-page report visuals remain workflow evidence only.
- Nonpunitive, clinician-supportive language remains mandatory.

## Verification checklist

- [ ] Issue 03 artifact maps report categories to canonical chart memory or marks source-needing/report-only categories.
- [ ] Issue 04 artifact defines H&P, ICU note, vitals, drips/dose rates, I&O, labs, and task-list packet fields with hot/warm/cold posture.
- [ ] Issue 06 artifact defines source hierarchy, authority posture, due window, completion criteria, defer/block/carry-forward, and examples.
- [ ] All three artifacts use the same canonical-memory/projection vocabulary as issue 02.
- [ ] Agent language remains bounded-assistant language.
- [ ] No architecture/backing-store/retrieval/adapter decision leaks in.

## Later lane preview

After issues 03, 04, and 06 are complete, the next cluster should be:

1. Issue 05 — bedside verification and mismatch prompts.
2. Issue 07 — human-agent workflow boundary.
3. Issue 08 — clinical-risk prioritization and supportive language.

Issue 11 should wait. If Phase A order-set evidence is insufficient when issue 11 starts, create a bounded deep-research query brief instead of inventing an order-set template.
