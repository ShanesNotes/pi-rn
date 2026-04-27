# Pi Chart Overview UI Context

Task statement: Implement the next pi-chart UI iteration for the main chart page, defaulted to Overview, matching `docs/design/pi-chart-overview-v.0.4.5/target-overview.png` for layout and `docs/design/pi-chart-overview-v.0.4.5/style-reference-original-prototype.png` for visual style.

Desired outcome: A dense clinical cockpit page for Patient 002 with Overview selected, persistent patient/banner/vitals/timeline/worklist/floating editor/Pi-agent dock, using product language Chart/Charted/final clinical write and avoiding Commit/Committed.

Stated solution: Build/update the static pi-chart cockpit prototype/page and supporting fixture/test/screenshot paths using existing Node/TypeScript tooling; no new dependencies.

Probable intent hypothesis: The user wants the prototype to stop reading as a SaaS/chat dashboard and instead look like the original precise clinical instrument while preserving the new overview information architecture.

Known facts/evidence:
- Repo is a TypeScript/Node static clinical-memory/prototype workspace, not a Next app. No `app/page` route was found.
- Existing relevant implementation is `scripts/agent-canvas.ts`, generating `docs/prototypes/pi-chart-agent-canvas.html` with cockpit UI, patient banner, vitals, worklist, modal editor, and Pi-agent dock.
- Screenshot tooling exists at `scripts/screenshot-prototype.mjs` and can target local HTML files.
- Tests exist via `node --test --import tsx` and dashboard parser tests; no Storybook files found in initial scan.
- Design references exist under `docs/design/pi-chart-overview-v.0.4.5/` (note repo path includes `v.0.4.5`, not `v0.4.5`).

Constraints:
- Synthetic fixture data only.
- Agent must not auto-chart medications.
- Zosyn due 12:00 remains blocked pending scan/attestation.
- Use “Chart”, “Charted”, “final clinical write”; never “Commit” or “Committed”.
- Use design tokens/classes, no new dependencies, no generic SaaS/pastel/large-radius dashboard styling.
- Run lint/build/test and screenshot validation.

Unknowns/open questions:
- Whether the canonical deliverable should replace `docs/prototypes/pi-chart-agent-canvas.html` via `scripts/agent-canvas.ts` or create a new overview-specific generator/output.

Decision-boundary unknowns:
- Whether OMX may decide the static prototype generator is the “main chart page” in absence of app route structure.

Likely codebase touchpoints:
- `scripts/agent-canvas.ts`
- `scripts/screenshot-prototype.mjs`
- `scripts/dashboard.test.ts` or new script tests if needed
- `docs/prototypes/pi-chart-agent-canvas.html` generated output
- `docs/design/pi-chart-overview-v.0.4.5/*`

Prompt-safe initial-context summary status: not_needed.
