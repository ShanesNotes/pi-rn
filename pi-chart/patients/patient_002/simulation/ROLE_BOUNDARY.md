# Role boundary: what belongs in the chart before vs during the live demo

## Preloaded backend

The preloaded backend is the patient’s record as it exists when the MICU nurse receives
report. It may contain historical outpatient/inpatient records and the ED course already
completed before the live demo starts.

## Latent, non-RN documentation

These events can be pre-authored but should be released by the simulator at their
recorded time or when prerequisites are satisfied. Examples: provider orders, RT notes,
pharmacy verification/recommendations, lab results, imaging reports, consult notes, and
case-management documentation.

## Live RN/pi-agent charting

RN-owned charting should not be visible before the live demo action occurs. Examples:
MAR administration, infusion start/stop/titration, focused assessments, I&O, Foley and
line-device documentation, nursing shift notes, bedside handoff, patient/family nursing
updates, glucose checks, and protocol checklists.

## Important implementation rule

Do not use a completed ICU chart as the runtime chart. Use it as a reference transcript.
The runtime chart should be assembled over time from:

1. initial backend records;
2. latent releases from non-RN systems/staff;
3. actual live RN/pi-agent charting.

Provider or ancillary notes that cite reference RN event IDs must be remapped to actual
live event IDs before being injected into the visible chart.
