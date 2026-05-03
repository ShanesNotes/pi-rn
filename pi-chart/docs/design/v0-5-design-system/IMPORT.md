# v0.5 design system · import record

Imported on 2026-05-03 from a Claude Design handoff bundle. The bundle
described itself as the source of truth for the π-chart visual language:

> Substrate (today): a filesystem-native, append-only, provenance-rich
> clinical memory store. UI surface (this system): the clinical cockpit
> + agent canvas that lets a bedside RN read that memory and review
> agent-drafted artifacts before commit.

## What landed in the repo

| Path | What it is |
|---|---|
| `README.md`            | Bundle README — content fundamentals, visual foundations, manifest |
| `colors_and_type.css`  | Full design tokens (ink/paper/line/semantic + type scale) |
| `assets/`              | π glyph SVG and the official wordmark logo |
| `preview/`             | 15 design-system preview cards (ink, paper, semantic, type, spacing, components) |
| `IMPORT.md`            | This file — provenance and intent |

The runnable cockpit recreation that the bundle also included
(`ui_kits/pi-chart/`) was promoted to a working prototype at
[`../../prototypes/v0-5-cockpit/`](../../prototypes/v0-5-cockpit/). That
prototype refactors the data plane through three adapter modules
(pi-chart substrate, pi-monitor vitals, pi-agent canvas) so the seams
the project is reorganising around are explicit.

## Status

Directional product evidence only — see ADR 018 (architecture rebase:
clinical truth substrate) and ADR 020 (claim-ledger kernel owned by
`pi-ledger`). The visual language captured here is more durable than any
specific component or data shape; expect the substrate-side primitives
to evolve as the kernel and chart adapter prove themselves.

## Hard rules to preserve when re-deriving

1. Paper palette + rust-red signal + brutalist 1px borders + zero
   radius + mono labels at 9.5px / letter-spacing 0.16em.
2. Lower-case sentence-fragment captions for chrome; calm declarative
   clinical prose for content; never first-person, never emoji.
3. Vital readouts are big mono numbers (27px, weight 620). The chart
   speaks numerically.
4. Signal grammar = (color flip → accent) + (1px accent border) +
   (accent-soft fill). That trio is "this matters now."
5. Three-column shell at 1480px: nav · fluid centre · 374–408px right
   rail. Tablet/phone are out of scope as of v0.5.

## Caveats

- Fonts in this bundle are loaded from Google Fonts (Inter Tight +
  JetBrains Mono). The codebase uses generic `Inter, system-ui` and
  `ui-monospace`. Either is acceptable; the bundle's choice leans
  further into the editorial register.
- The `preview/` cards live as static HTML — they are reference
  surfaces, not part of the prototype build.
