# Per-patient shift-start workflow tracer

Status: ready-for-human
Type: AFK
User stories covered: 10-14, 81-100

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define a narrow, verifiable per-patient shift-start workflow tracer from the perspective of an incoming critical care nurse and the bounded agent inside the chart. The slice should describe the end-to-end sequence: select assigned patient, receive nurse-to-nurse report, use the one-page report visual, skim H&P, skim the most recent ICU note, review vitals/drips/I&O/labs/tasks, verify bedside medications and monitor state, handle urgent findings, plan early medications, cluster first assessment, and chart the assessment after care.

The output should be a durable issue/workflow artifact, not source implementation. It should make the clinician's real-time chart-reading path explicit enough that later slices can test whether projections gather the right context at the right time.

## Acceptance criteria

- [x] Describes the incoming ICU nurse shift-start sequence from login/patient selection through assessment charting.
- [x] Separates what the clinician hears in report, sees on the one-page sheet, reads in the chart, and verifies at bedside.
- [x] Names where the in-chart agent can help by summarizing, linking evidence, and prompting review without acting autonomously.
- [x] Preserves that the nurse owns judgment, prioritization, charting, completion, and final handoff truth.
- [x] Treats the one-page report sheet as workflow/product evidence, not canonical chart truth or a UI mandate.
- [x] Includes verification prompts for H&P, ICU note, vitals, drips/dose rates, I&O, labs, task list, bedside monitor, medications, med-pass planning, care clustering, and assessment charting.

## Blocked by

None - can start immediately


## Completion evidence

- Artifact: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/shift-start-workflow-tracer.md`
- Ralph context: `.omx/context/pi-chart-lean-v0-5-ralph-issues-01-02-20260504T145349Z.md`
- Verification: structural docs checks run in Ralph iteration 1.
