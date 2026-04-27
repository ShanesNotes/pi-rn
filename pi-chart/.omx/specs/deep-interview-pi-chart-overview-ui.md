# Deep Interview Spec — Pi Chart Overview UI

## Metadata
- Profile: standard
- Context type: brownfield
- Final ambiguity: 12%
- Threshold: 20%
- Context snapshot: `.omx/context/pi-chart-overview-ui-20260426T170623Z.md`

## Clarity breakdown
| Dimension | Score | Notes |
| --- | ---: | --- |
| Intent | 0.95 | Make pi-chart read as a serious clinical cockpit, not chat/SaaS. |
| Outcome | 0.95 | Overview default matching target layout and original prototype style. |
| Scope | 0.90 | Update existing cockpit prototype in place. |
| Constraints | 0.95 | Product language, medication safety, synthetic fixture data, no new dependencies. |
| Success criteria | 0.95 | Provided visual, clinical, and engineering acceptance checks. |
| Context | 0.90 | Static generator and screenshot tooling identified. |

## Intent
Implement the next pi-chart UI iteration as a clinical cockpit defaulted to Overview, preserving chart truth boundaries and using the original prototype’s sharp, dense clinical instrument aesthetic.

## Desired outcome
`docs/prototypes/pi-chart-agent-canvas.html`, generated from `scripts/agent-canvas.ts`, should display the Overview screen by default with:
- product header and `π-chart / overview` title
- patient banner with `FULL CODE` next to Patient 002
- left nav with Overview selected
- vitals strip
- problem-oriented timeline
- right clinical worklist
- floating editable artifact pane
- slim persistent bottom Pi-agent dock

## In scope
- Update design tokens for cream/off-white boundary, panel surface, black/soft rules, clinical red/orange, muted text, selected nav background.
- Use Patient 002 fixture content: CAP day 1, SpO₂ 89% on 6L simple mask, HR 112, RR 30, lactate 2.8, open loop due 09:50, escalation if SpO₂ < 90% or accessory muscle use persists, Zosyn due 12:00 blocked pending scan/attestation.
- Make artifact pane resizable and keep markdown/editor affordances.
- Use actions: Discard draft, Stage draft, Chart; Chart must imply FINAL CLINICAL WRITE.
- Add/update test or visual/screenshot path supported by repo.

## Out of scope / non-goals
- No new dependencies.
- No SaaS dashboard styling, pastel card palette, oversized radius, or consumer chat-app redesign.
- No real clinical data or live EHR integration.
- No auto-charting medications.
- No direct coupling to `pi-sim` source.

## Decision boundaries
OMX may decide exact component decomposition, CSS class names, token names, static fixture layout, and screenshot output path. OMX may update the existing static cockpit generator in place. OMX should not add dependencies or introduce a new app framework.

## Constraints
- Use Chart/Charted/final clinical write language only; no Commit/Committed UI copy.
- Clinical worklist right rail must include Due / Overdue, Staged Charting, Generated Drafts, Blocked MAR Items, Charted / Done.
- Zosyn MAR item must remain blocked pending scan/attestation.
- Preserve readability at 1440x1080 and 1280-wide viewports.

## Acceptance criteria
- Visual acceptance list from user prompt passes by inspection.
- Clinical content acceptance list from user prompt passes by DOM/text inspection.
- Static fixture data separated from rendering where practical.
- Components are reasonably decomposed in generator functions.
- Validation runs: available lint/build/test equivalents (`typecheck`, `check`, `test`) plus screenshot capture.

## Brownfield evidence vs inference
- Evidence: `scripts/agent-canvas.ts` is current cockpit HTML generator; `scripts/screenshot-prototype.mjs` can capture HTML screenshots; no Storybook files detected.
- Inference accepted by user: current generated prototype is the main chart page implementation surface for this iteration.
