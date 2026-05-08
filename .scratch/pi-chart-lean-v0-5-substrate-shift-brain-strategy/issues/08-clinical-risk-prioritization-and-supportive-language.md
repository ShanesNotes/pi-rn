# Clinical-risk prioritization and supportive language

Status: ready-for-human
Type: AFK
User stories covered: 38-48, 75, 100

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define the shift-brain prioritization and language contract. The projection should tier work by clinical risk and context first, then sort by due/overdue time within tiers. It should use supportive, nonpunitive language that assumes competent clinician reprioritization under load.

The slice should help a real nurse plan the shift without feeling judged, while giving the in-chart agent a safe language and priority model for prompts and summaries.

## Acceptance criteria

- [x] Defines priority tiers: now/safety critical, due soon/time-sensitive, routine care, and handoff/watch.
- [x] States that time matters, but clinical risk wins.
- [x] Defines neutral language such as needs attention, due, due soon, delayed, carry forward, review priority, blocked, waiting on, deferred by clinician, not clinically appropriate now, and bundled with next care cluster.
- [x] Forbids routine blame-oriented framing such as failed, noncompliant, or nurse-failed language.
- [x] Defines defer/block/carry-forward reasons that preserve clinical judgment.
- [x] Defines when prompts should be prominent versus quiet to avoid alarm fatigue.

## Blocked by

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/06-workflow-item-source-and-authority-grammar.md`


## Implementation notes

- Added `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/clinical-risk-prioritization-and-supportive-language.md`.
- Defined priority tiers and sort rule: clinical risk/context first, due/delayed time within tier.
- Defined neutral/supportive vocabulary and routine blame-language exclusions.
- Defined defer, block, carry-forward, not-clinically-appropriate, and care-cluster reasons.
- Defined prominent versus quiet prompt rules to protect safety without alarm fatigue.
- Kept assistant language bounded and nonpunitive.

## Closeout evidence

- `python3` structural check — PASS: artifact status, four priority tiers, clinical-risk-first sort rule, supportive vocabulary, blame-language exclusions, defer/block/carry-forward reasons, prominent/quiet rules, and issue checklist verified.
- `git diff --check` — PASS.
