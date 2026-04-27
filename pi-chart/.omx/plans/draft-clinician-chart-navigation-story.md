# Draft RALPLAN — Clinician Chart Navigation Story

## RALPLAN-DR Summary

### Principles
1. Chart-first: Pi-chart is the clinical cockpit; Pi-agent chat is process support, not chart truth.
2. Shift-work realism: the journey must follow the order a nurse actually uses under time pressure.
3. Orientation without hiding detail: the overview should reveal urgent work while allowing fast drill-down into vitals, MAR, notes, labs, radiology, and handoff.
4. Safe charting boundaries: medication administration is never auto-charted; scan/attestation gates remain explicit.
5. Dense clinical instrument style: thin black rules, compact typography, warm boundary, restrained signal color.

### Decision Drivers
1. Can a clinician build a safe mental model of the patient in the first 3–5 minutes of shift?
2. Can urgent due work interrupt the review flow without losing the clinician’s place?
3. Can the UI separate final clinical writes from drafts, generated summaries, and chat advice?

### Viable Options

#### Option A — Static storyboard states first (recommended)
Create a scenario-driven storyboard in the existing prototype: each navigation destination appears as a concrete chart state/pane, with tests and screenshots for the full nurse journey.
- Pros: Fastest way to stress-test IA and layout; fits current static generator; no new framework; easy screenshot validation.
- Cons: Limited interaction realism; state changes are represented, not fully executable.

#### Option B — Minimal interactive chart shell
Add client-side state transitions for left-nav destinations, worklist item opening, due-vitals charting, and Pi-agent prompt output.
- Pros: Better tests for real navigation, attention recovery, and action state.
- Cons: More implementation complexity inside a static HTML generator; risks premature behavior design before story is stable.

#### Option C — Separate clickable prototype artifact
Create a new dedicated HTML/storyboard file and leave current overview mostly unchanged.
- Pros: Lower risk to existing prototype.
- Cons: Splits product truth; user already selected updating existing cockpit; weaker integration with current tests.

Recommended: Option A now, with Option B as follow-up after storyboard acceptance.

## Primary User Story
As a bedside nurse coming onto day shift for Patient 002, I need to use pi-chart as my clinical cockpit to rapidly understand the patient, reconcile due work, safely chart routine observations, and ask Pi-agent to organize my shift, so I can start care with a clear prioritized plan without confusing drafts, chat, or pending tasks with chart truth.

## Narrative Scenario: “Start of Shift Clinical Recon”

### Actor
- Bedside RN `rn_shane`, beginning shift.
- Patient 002, CAP day 1, respiratory watcher.
- Synthetic fixture data only.

### Preconditions
- The nurse opens pi-chart to Patient 002 Overview.
- Current alert: SpO₂ 89% on 6L simple mask, HR 112, RR 30, lactate 2.8.
- Open loop: reassess oxygen response/work of breathing by 09:50.
- Zosyn due 12:00 is visible but blocked pending medication scan/attestation.
- Pi-agent has generated draft artifacts, but none are final clinical writes until clinician action.

### Journey Steps and UI Stress Tests
1. **Land on Overview and orient.**
   - The nurse sees Patient 002, FULL CODE, acuity/WATCHER banner, current oxygen support, and the right clinical worklist.
   - Stress test: header must not crowd; urgent status must read before any chat content.

2. **Open handoff report.**
   - The nurse selects `Care plan / handoff` or a `Staged Charting` handoff item.
   - Floating pane opens as a handoff report workspace with source context and Chart/Stage/Discard actions.
   - Stress test: handoff is readable while patient banner, worklist, and Pi-agent dock remain available.

3. **Review previous-shift vitals.**
   - The nurse opens Vitals/flowsheet from left nav.
   - The center shifts from timeline summary to a previous-shift vital trend view with SpO₂, HR, RR, BP, O₂ device changes, and due vitals.
   - Stress test: user can compare 07:00–09:30 trend without losing the active handoff pane.

4. **Review MAR.**
   - The nurse opens Meds/MAR.
   - MAR view distinguishes scheduled meds, due/overdue meds, last Charted administrations, held/refused meds, and scan-required meds.
   - Zosyn due 12:00 is blocked pending scan/attestation; Pi-agent can remind or stage context but cannot Chart med administration.
   - Stress test: med safety boundary is impossible to miss.

5. **Read provider notes.**
   - The nurse opens Notes or provider note stream.
   - Provider assessment/plan, prior nursing notes, and Pi-agent summaries are visually distinct.
   - Stress test: generated summaries must link to source notes and must not look Charted unless charted.

6. **Vitals become due during review.**
   - A due-vitals worklist item surfaces without replacing the current note/MAR context.
   - The nurse opens a vitals charting workspace and enters SpO₂, HR, RR, BP, O₂ device, work-of-breathing notes, and timestamp.
   - Chart action reads as final clinical write.
   - Stress test: routine vitals charting should be quick, but escalation conditions remain visible.

7. **Review labs.**
   - The nurse opens Labs/dx.
   - ABG/lactate result is visible with timestamp, trend relevance, and links back to respiratory watch.
   - Stress test: abnormal/relevant labs are prioritized without hiding normal labs.

8. **Review radiology reports.**
   - The nurse opens Radiology/imaging from Labs/dx or Evidence.
   - CXR/report impression is visible with timestamp, status, and relevance to CAP/respiratory trajectory.
   - Stress test: imaging report can be read alongside the current respiratory problem timeline.

9. **Ask Pi-agent to organize the shift.**
   - The nurse opens Pi-agent dock/chat and asks: “Organize my shift and tell me what to pay attention to.”
   - Agent response produces a structured shift plan: immediate watch items, due tasks, meds requiring scan/attestation, labs/radiology to follow, and documentation suggestions.
   - Stress test: response appears as advice/process; any draft output enters artifact/worklist lane and is not chart truth.

10. **Return to Overview.**
   - The nurse returns to Overview and sees the same key anchors: respiratory watcher, due loop, Charted/done items, blocked MAR, and any staged drafts.
   - Stress test: no lost context; right rail reflects updated state.

## Screen/Component Implications
- `ProductHeader`: must support working session metadata and keep the title readable.
- `PatientBanner`: must keep code status and acuity visible across all states.
- `LeftChartNav`: must include Handoff, Vitals/flowsheet, MAR, Notes, Labs/dx, Radiology/imaging or equivalent path.
- `ClinicalWorklist`: must support cross-cutting due work, staged charting, generated drafts, blocked MAR, done.
- `Floating workspace panes`: must represent handoff, vitals charting, note review, lab/radiology context, and generated draft review.
- `PiAgentDock`: must open into a co-pilot workflow without visually becoming the chart source of truth.

## Acceptance Criteria
- The story can be followed from start to finish using visible UI affordances.
- Overview remains the default starting and return point.
- Handoff report can be opened as a workspace.
- Previous-shift vitals can be reviewed with trend and O₂ device context.
- MAR review clearly blocks Zosyn charting until scan/attestation.
- Provider notes are reachable and distinguish source notes from generated summaries.
- Due vitals can be charted through a final clinical write action.
- Labs and radiology reports are reachable and linked to the respiratory problem.
- Pi-agent can organize the shift, but response is advice/process and not chart truth.
- Right rail remains a clinical worklist, not an artifact scratchpad.
- No forbidden Commit/Committed language appears.

## Validation Approach
- Add/extend static tests for journey labels, section ordering, safety boundary copy, and no forbidden language.
- Capture screenshots at 1440x1080 and 1280x1080 for at least Overview and one “shift recon active” storyboard state.
- If implementation becomes interactive, add Playwright checks for navigation sequence and worklist state changes.

## Risks
- Storyboard may overfit a single nurse workflow if not kept problem-oriented.
- Static prototype may not reveal interaction friction around returning to prior context.
- Too many destinations can make left nav dense; radiology may need to live under Labs/dx or Evidence rather than its own primary nav item.
- Agent shift-organizing response can accidentally look authoritative; visual treatment must keep it advisory.
