# Human-agent workflow boundary

Status: ready-for-human
Parent PRD: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`
Source issue: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/07-human-agent-workflow-boundary.md`
Depends on:
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/workflow-item-source-authority-grammar.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/bedside-verification-and-mismatch-prompts.md`

## Purpose

Define the v0.5 boundary between human-owned clinical workflow and bounded in-chart assistant behavior. The assistant can summarize, cite, explain, compare, suggest, and prompt review over chart memory and derived projections. It cannot become silent canonical chart memory, direct accepted-write authority, autonomous task-creation authority, autonomous completion authority, or final handoff owner.

## Core boundary

| Area | Human authority | Assistant allowance | Hard stop |
| --- | --- | --- | --- |
| Chart truth | Humans and sanctioned chart workflows create, correct, review, attest, and finalize canonical chart facts/actions/notes/refs | May cite and summarize source-linked chart memory | No direct accepted-writes into canonical chart truth |
| Workflow task creation | Humans, orders, policies/protocols, and sanctioned system projections create active workflow obligations | May propose an agent-created task as `suggested` only | Agent suggestion cannot become active workflow without human acceptance |
| Task completion | Humans complete, defer, block, carry forward, reject, or mark not clinically appropriate through sanctioned workflow | May suggest completion only when explicit modeled evidence supports it | No autonomous task completion, deferral, block, or carry-forward |
| Review/reconciliation | Humans resolve report/chart/bedside conflicts and chart reconciliation | May surface mismatch prompts with source links | May not decide which source is true |
| Handoff | Humans own final handoff content | May propose derived handoff/watch carry-forward content | No silent final handoff truth |
| Site/workflow control | Humans/site policy may enable, disable, or scope assistant suggestions | May operate only within enabled suggestion surfaces | No required always-on agent task suggestion mode |

## Agent-created task states

| State | Meaning | Allowed transitions | Clinician-facing posture |
| --- | --- | --- | --- |
| `suggested` | Assistant/system proposes an item from evidence, uncertainty, trend, or mismatch. It is visible but provisional. | Human accepts, modifies then accepts, rejects/dismisses, or leaves provisional. | "Suggested" / "review if useful". Not an obligation. |
| `accepted` | Human promotes the suggestion into active workflow, possibly after editing source, label, priority, due window, or completion criteria. | Human completes, defers, blocks, carries forward, edits, or cancels through sanctioned workflow. | Active workflow item with visible original suggestion provenance. |
| `rejected/dismissed` | Human decides the suggestion is irrelevant, wrong, duplicate, not clinically appropriate, or not useful now. | May remain as audit/provenance only if future governance requires; should not clutter active view. | Quiet/no active obligation. |

A suggested item must preserve its evidence source, generated reason, timestamp/as-of frame, and assistant/projection provenance. Acceptance should record human action and any edits. Rejection/dismissal should avoid punitive wording and should not imply the clinician ignored care.

## Disable-able suggestion contract

Agent task suggestions must be disable-able at a site, unit, patient, session, or user/workflow level when policy or clinician preference requires it. When disabled:

- canonical chart memory and human-authored workflow remain usable;
- source-linked summaries and chart navigation may remain allowed if separately enabled;
- no new agent-created task suggestions appear;
- existing accepted human-promoted items remain human-owned workflow, not agent-owned tasks;
- disabled state should be visible enough that users know suggestions are unavailable by design, not missing because nothing matters.

This is a product/domain boundary, not a runtime configuration design.

## Completion-suggestion rules

The assistant may suggest that a task appears satisfied only when explicit modeled evidence supports the suggestion. The suggestion is still provisional.

| Scenario | Assistant may say | Assistant may not do |
| --- | --- | --- |
| MAR administration exists for a medication-due task | "A matching MAR administration may satisfy this med-due item; review before marking complete." | Mark med task complete or write MAR action |
| Lab specimen/action and resulting lab workflow are explicitly modeled | "This draw/result may satisfy the linked lab workflow; verify linkage." | Close the lab task silently |
| Device/import observation updates a charted fact | "New observation may affect this attention item." | Treat device/import evidence as nursing task completion unless completion semantics are explicitly modeled and human accepted |
| Bedside mismatch appears resolved after a new charted action | "New charted action may reconcile the prior mismatch; review prompt status." | Declare the conflict resolved as canonical truth |
| Routine task has no modeled completion action | "No source-linked completion evidence appears in this packet." | Infer completion from absence, elapsed time, or hidden state |

## Allowed assistant behaviors

The assistant may:

- summarize source-linked H&P, ICU note, vitals, labs, MAR/orders, I&O, and workflow state;
- cite source, time, author/provenance, review state, and uncertainty;
- detect conflicting, stale, source-needed, or report-only material;
- generate mismatch prompts;
- suggest inspection next steps;
- suggest provisional tasks or care clusters when explicit evidence supports them;
- explain priority rationale using clinical-risk/supportive-language rules;
- help draft handoff/watch proposals for human review;
- keep its own outputs marked as derived/provisional/suggested.

## Forbidden assistant behaviors

The assistant may not:

- directly write accepted canonical chart facts;
- promote its own suggestions to active workflow;
- complete, defer, block, carry forward, or reject tasks without human action;
- mark results reviewed or handoff finalized;
- decide which conflicting source is true;
- hide source/provenance/review uncertainty;
- turn report-only content into accepted chart truth;
- operate when task suggestions are disabled;
- use hidden `pi-sim` internals, oracle truth, latent state, validation internals, or private simulator source;
- select backend/vector/OpenBrain/storage/runtime/access-plane architecture;
- expand `pi-ledger` kernel scope.

## Human-owned final states

The following finalizing actions remain human-owned or sanctioned-chart-workflow-owned:

- charting an assessment, observation, note, medication action, order action, review, attestation, correction, or communication;
- accepting, modifying, or rejecting an agent suggestion;
- completing, deferring, blocking, carrying forward, or marking workflow not clinically appropriate now;
- deciding that bedside/report/chart conflict is reconciled;
- finalizing handoff content;
- changing medication timing, entering verbal/telephone orders, documenting readback, or handling co-sign state;
- deciding local policy around assistant suggestion enablement.

## Verification prompts for later slices

A future implementation or prototype should prove:

1. Agent-created items start as `suggested` and are visually/procedurally distinct from active workflow.
2. Only human acceptance promotes a suggestion to active workflow.
3. Suggestions can be rejected/dismissed without punitive language or active-list clutter.
4. Suggestion functionality can be disabled without breaking human-authored workflow.
5. Completion suggestions require explicit modeled evidence and remain provisional.
6. The agent cannot directly write accepted chart truth, complete tasks, finalize handoff, or resolve conflicts.
7. Assistant output remains source-linked, time-aware, and visibly derived/provisional.

## Boundary closeout

- [x] Suggested, accepted, and rejected/dismissed states defined.
- [x] Human acceptance required before an agent suggestion becomes active workflow.
- [x] Agent task suggestions are disable-able.
- [x] Humans complete workflow tasks and own final handoff content.
- [x] Agent completion suggestions allowed only with explicit modeled evidence and human review.
- [x] Negative cases for no direct agent accepted-writes and no autonomous task completion included.
- [x] No backend/vector/OpenBrain/storage/runtime/access-plane decision.
- [x] No hidden `pi-sim` coupling or `pi-ledger` kernel expansion.
