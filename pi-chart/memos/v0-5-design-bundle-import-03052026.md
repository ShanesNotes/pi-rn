# v0.5 design bundle import

Date: 2026-05-03
Author: Shane (with Claude Code assistance)
Related: ADR 018, ADR 019, project memory `project_demo_target_patients`

## What landed

A Claude Design handoff bundle for the π-chart cockpit + agent canvas was
unpacked into the repo as two artefacts:

1. **`pi-chart/docs/design/v0-5-design-system/`** — durable design system
   reference. Holds the bundle README, design tokens (`colors_and_type.css`),
   π glyph + wordmark assets, and 15 preview cards covering ink/paper/semantic
   palette, type, spacing, components, and brand. An `IMPORT.md` records the
   provenance and the hard rules to preserve when re-deriving.

2. **`pi-chart/docs/prototypes/v0-5-cockpit/`** — runnable cockpit scaffold.
   `index.html` opens in a browser with no build step (React 18 + Babel
   standalone via CDN, matching the existing pi-chart prototype pattern).

## What changed vs the bundle's runnable kit

The bundle's `ui_kits/pi-chart/index.html` inlined every constant. The
imported version splits the data plane across three named adapter modules
to make the v0.5 reorganisation seams explicit:

| Adapter | Owns | Future wiring |
|---|---|---|
| `adapters/pi-monitor.js` | vitals tiles, waveforms, vitals flowsheet | poll/EventSource over `current.json`, `vitals.jsonl`, `timeline.jsonl` (ADR 018 boundary — public-frame only) |
| `adapters/pi-agent.js` | chat, artifacts, draft → staged → committed lifecycle | HTTP/SSE bridge to pi-agent runs |
| `adapters/pi-chart.js` | patient bar, doc band, labs, MAR, notes, orders, I&O, event stream | view primitives over `pi-ledger`-backed chart projections once ADR 020 adapter work stabilises |

Each adapter is fixture-backed today but hooks into React state, so swapping
the body for a real subscriber is a per-adapter change that does not touch
the cockpit components.

## Connector contract

Per project memory `project_demo_target_patients`: every adapter call
accepts `(patientId, encounterId, asOf)` and never hardcodes either.

```js
const ctx = { patientId: "patient_002", encounterId: "enc_p002_001", asOf: "14:54:31" };
const monitor = PiMonitor.useVitalsStream({ ...ctx, window: "4h" });
const agent   = PiAgent.useAgentCanvas(ctx);
const chart   = PiChart.useChartSubstrate(ctx);
```

`patient_002 / enc_p002_001` is the cockpit demo target. `patient_001` is
the modularity regression target — when the adapters become real, the
cockpit must continue to render against either patient unchanged.

## Why this is captured but not promoted to implementation authority

ADR 018 is explicit: UI prototypes and generated cockpit artefacts are
directional product evidence only. They do not define the core
architecture. ADR 020 narrows that further: the reusable kernel is owned
by `pi-ledger`; do not retrofit `src/types.ts` or current `EventEnvelope`
modules ahead of the kernel and adapter proof.

The scaffold therefore preserves the visual language and the adapter
seams (durable) without committing to any specific data shape on the
substrate side (volatile).

## Open follow-ups

- The bundle's standalone `ui_kits/*.jsx` files reference older
  CSS class names (`.vital`, `.spark`) that are inconsistent with the
  bundle's own `styles.css`. The unified `index.html` is canonical;
  the standalone JSX files were intentionally not promoted.
- ADRs 020–024 are not yet drafted in the repo. As substrate-side
  decisions land, the `pi-chart.js` adapter is the cleanest place to
  carry the kernel's view primitives forward.
- A screenshot regression for the v0.5 scaffold can be added later
  via `scripts/screenshot-prototype.mjs` if visual drift becomes a
  concern.
