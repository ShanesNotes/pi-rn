# π-chart cockpit · v0.5 scaffold

A captured layout scaffold for the agent-native clinical cockpit. Imported
from a Claude Design handoff bundle (see
[`../../design/v0-5-design-system/`](../../design/v0-5-design-system/)) and
adapted so the runtime data flows through three named seams instead of being
inlined.

This prototype is **directional product evidence**, not implementation
authority (ADR 018). The substrate it points at is now `pi-ledger`
consumed through a future `pi-chart` adapter/projection seam (ADR 020);
older ADR 019 `pi-chart/src/claim-ledger/` path language is superseded.

## Run

Open `index.html` in a browser. No build step. React 18 + Babel-standalone
load from CDN; the cockpit renders against fixture-backed adapters.

```bash
xdg-open docs/prototypes/v0-5-cockpit/index.html
# or
python3 -m http.server -d docs/prototypes/v0-5-cockpit 8080
```

## Layout

The cockpit is a 1480px desktop surface organised as:

```
  ┌─ DocBand ────────────────────────────────────────────────────────┐
  │ π-chart · cycle 0.5-12 · loop t+0:32 · LIVE · as of 14:54:31     │
  ├─ Patient strip ──────────────────────────────────────────────────┤
  │ Smith, Linda · FULL · Bed 12B · 58 F · day 1 CAP · sepsis · 1:1  │
  ├──────────────────────────────────────┬───────────────────────────┤
  │  Tabs: Vitals · Labs · MAR · Notes   │  Scratchpad · pi-agent    │
  │        Orders · I&O · Events         │                           │
  │                                      │  filters · all/draft/…    │
  │  ┌─ Vitals tiles (live) ─────────┐   │  ┌─ artifact cards ────┐  │
  │  │ HR · SpO₂ · RR · MAP          │   │  │ assessment, orders, │  │
  │  │ + waveforms                   │   │  │ handoff, addendum,  │  │
  │  └───────────────────────────────┘   │  │ draft               │  │
  │  ┌─ Vitals flowsheet ────────────┐   │  └─────────────────────┘  │
  │  │ time × parameter grid         │   │  gate: RN sig required    │
  │  └───────────────────────────────┘   │  ┌─ chat (process) ────┐  │
  │                                      │  │ RN ↔ pi-agent       │  │
  │                                      │  └─────────────────────┘  │
  ├──────────────────────────────────────┴───────────────────────────┤
  │  CommitBar: cycle 0.5-12 · drafts · staged · [chart N · sign]    │
  └──────────────────────────────────────────────────────────────────┘
```

## Adapter seams

The cockpit binds to three adapter modules. Each owns one source surface and
exposes a hook the App composes:

| Adapter | Hook | Wraps | Today | Future |
|---|---|---|---|---|
| `adapters/pi-monitor.js` | `PiMonitor.useVitalsStream` | pi-monitor public-frame contract | fixture tiles, waveforms, flowsheet | poll/EventSource over `current.json`, `vitals.jsonl`, `timeline.jsonl` |
| `adapters/pi-agent.js`   | `PiAgent.useAgentCanvas`   | pi-agent harness | fixture chat + artifact lifecycle | HTTP/SSE bridge to `pi-agent` runs |
| `adapters/pi-chart.js`   | `PiChart.useChartSubstrate` | `pi-ledger` via future chart adapter/projection (ADR 020) | fixture labs/MAR/notes/orders/I&O/events/patient/docband | view primitives over ledger-backed chart projections once stable |

**Connector contract (per project memory).** Every adapter call accepts
`(patientId, encounterId, asOf)` and never hardcodes either:

```js
const ctx = { patientId: "patient_002", encounterId: "enc_p002_001", asOf: "14:54:31" };
const monitor = PiMonitor.useVitalsStream({ ...ctx, window: "4h" });
const agent   = PiAgent.useAgentCanvas(ctx);
const chart   = PiChart.useChartSubstrate(ctx);
```

`patient_002 / enc_p002_001` is the cockpit demo target. `patient_001` is
the modularity regression target — when the adapters become real, the
cockpit must continue to render against either patient unchanged.

## Hard rules carried over from the design system

- **Paper / scratchpad aesthetic** — warm off-white, rust-red signal,
  brutalist 1px black borders, zero radius, mono labels at 9.5px /
  letter-spacing 0.16em.
- **Chat is process. Chartable output lands in the scratchpad — never
  in chat.** `PiAgent.send()` does not echo agent product into the
  chat stream.
- **Agent cannot commit.** RN signature is required at the cycle close;
  the gate banner and `chart N · sign` action enforce that.
- **No emoji, no animation beyond pulses, no rounded corners.**

## What this scaffold deliberately does NOT do

- Does **not** retrofit `src/types.ts`, `src/schema.ts`, or any v0.4
  prototype generator (per ADR 020 — `pi-ledger` proves the kernel first).
- Does **not** import from `pi-sim` internals or hidden simulator state
  (per ADR 018 — pi-monitor public surface only).
- Does **not** bundle or include a build step. The repo is mid-rebase;
  a static prototype keeps the surface readable and reviewable.
- Does **not** define the agent's chartable output schema. Artifact
  shape today is illustrative; the canonical shape is owned by pi-agent.

## Source-of-truth bundle

Everything in this prototype derives from the Claude Design handoff bundle
captured at `docs/design/v0-5-design-system/`. If the visual language
disagrees with this prototype, the design system wins — re-derive the
prototype from the bundle, not the other way around.
