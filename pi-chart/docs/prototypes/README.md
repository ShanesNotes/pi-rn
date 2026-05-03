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

## v0.5 Cockpit Scaffold

Captured layout from the v0.5 Claude Design handoff bundle. Lives at
[`v0-5-cockpit/`](v0-5-cockpit/) — open `index.html` in a browser; no build
step. The runtime data plane is split across three named adapter modules:

- `adapters/pi-monitor.js` — vitals tiles + waveforms + vitals flowsheet
  (will wrap pi-monitor's public-frame contract)
- `adapters/pi-agent.js` — agent chat + artifact lifecycle (will wrap
  pi-agent harness)
- `adapters/pi-chart.js` — patient/labs/MAR/notes/orders/I&O/events
  (will wrap `pi-ledger` through a chart adapter/projection after ADR 020)

Source-of-truth design system lives at
[`../design/v0-5-design-system/`](../design/v0-5-design-system/).

## Screenshots

Capture a prototype with the local browser helper:

```bash
npm run screenshot:prototype -- docs/prototypes/pi-chart-scratchpad.html /tmp/pi-chart-scratchpad.png --width 1480 --height 1000
```

The equivalent wrapper is `scripts/playwright.sh`.
