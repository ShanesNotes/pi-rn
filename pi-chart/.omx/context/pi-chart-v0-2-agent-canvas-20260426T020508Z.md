# pi-chart v0.2 Agent Canvas Intake

Task: Read `docs/design-inbox/pi-chart-handoff v0.2.0.zip`, read the README inside, and implement the primary design.

Desired outcome: Bring the Claude Design `Pi-Chart Agent Canvas.html` direction into the local prototype surface so Pi-chart has a cockpit/overview plus an Agent Canvas where chat is process and generated artifacts are the chartable product.

Known facts/evidence:
- Bundle README says the primary file is `pi-chart/project/Pi-Chart Agent Canvas.html` and should be read fully before implementation.
- Primary design is a 3014-line HTML/CSS/React prototype.
- Primary design introduces a persistent patient banner with vitals strip, left nav with `Overview` and `Agent Canvas`, an overview cockpit with subtle draft indicators, an Agent Canvas tab, a bottom chat dock, and a generated artifact scratchpad.
- The design reinforces source-of-truth boundaries: generated artifacts are not chart truth until committed.

Constraints:
- Preserve existing repo patterns and static prototype generation.
- Do not overwrite unrelated dirty work in planning docs or dashboard files.
- No new dependency is needed for implementation; Playwright was already added by the user for screenshots.
- Keep the implementation scoped to prototype/design files unless the handoff requires otherwise.

Unknowns/open questions:
- Whether the Claude React/CDN prototype should be treated as a reference artifact only or converted into the data-backed TypeScript prototype generator. Working assumption: implement as a repo prototype and keep data-backed generation where practical.

Likely touchpoints:
- `scripts/scratchpad.ts`
- `docs/prototypes/pi-chart-scratchpad.html`
- `docs/prototypes/README.md`
- `package.json`
- Potential new `docs/prototypes/pi-chart-agent-canvas.html` and `scripts/agent-canvas.ts`
