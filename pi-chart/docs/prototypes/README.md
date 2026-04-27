# UI Prototypes

Static prototype outputs live here. They are implementation sketches over the
current pi-chart substrate, not canonical clinical policy.

## Pi-Chart Cockpit

Generate the cockpit prototype from current chart data:

```bash
npm run cockpit
```

Output:

- `pi-chart-cockpit.html`

The prototype is read-only and self-contained. It uses `patient_002` because
that fixture exercises the broad EHR skeleton: vitals, nursing assessment,
notes, orders/actions, lab result, care plan, open loops, and handoff.

## Pi-Agent Canvas

Generate the agent documentation workspace prototype:

```bash
npm run scratchpad
```

Output:

- `pi-chart-scratchpad.html`

This prototype explores the clinician/agent documentation surface. It treats
the chart cockpit as the source-of-truth area and frames Pi-agent as a separate
Agent Canvas workspace where chat is process and Charted artifacts are product.

Generate the v0.2 Agent Canvas handoff implementation:

```bash
npm run agent-canvas
```

Output:

- `pi-chart-agent-canvas.html`

This version follows the Claude Design v0.2 handoff: Overview stays chart-first,
Agent Canvas becomes the documentation workbench, chat moves to the bottom of
the main surface, and the right side is an artifact scratchpad with stage,
discard, and Chart actions.

## Screenshots

Capture a prototype with the local browser helper:

```bash
npm run screenshot:prototype -- docs/prototypes/pi-chart-scratchpad.html /tmp/pi-chart-scratchpad.png --width 1480 --height 1000
```

The equivalent wrapper is `scripts/playwright.sh`.
