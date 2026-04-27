# Deep Interview Transcript — durable kanban PRD surface

## Round 1

Question: What should be the canonical deliverable at the end of this chat?

Answer: Kanban PRD index — create one durable canonical board that links to existing/new PRDs and slice cards; minimize rewriting existing artifacts.

## Round 2

Question: For the kanban PRD index, what should each actionable card represent?

Answer: User was not familiar with kanban boards and delegated the choice to the agent based on what would be most valuable for future agents.

Resolution: Use a mixed hierarchy. PRD cards carry source/conflict context; ready tracer-bullet cards carry owners, first tests, boundaries, and verification commands.

## Round 3

Question: Which non-goals must stay out of scope for this chat's deliverable?

Answer: No product code changes.

## Round 4

Question: Where should the durable kanban PRD surface live so future agents reliably find it?

Answer: Create tracked `docs/plans`.

## Round 5

Question: What is the minimum proof that a future agent can safely pick a card without re-reading all memos?

Answer: Both, but staged — PRD cards carry source/conflict context; Ready cards also carry test/owner/verification details.
