> **Status: SUPERSEDED — legacy/historical monitor implementation.**
> **Do not execute as current display direction.** The current monitor direction lives in sibling `../pi-monitor` and `.omx/plans/plan-pulse-live-vitals-monitor.md`. `pi-sim` now owns patient-runtime/provider telemetry per `docs/adr/003-pi-sim-patient-runtime-provider-architecture.md`.

---

# monitor-ui

Standalone PySide6 bedside monitor for `pi-rn`.

## Scope

- Read-only consumer of:
  - `vitals/current.json`
  - `vitals/timeline.json`
  - `vitals/alarms.json`
- Single file-IO boundary: `monitor_ui/vitals_source.py`
- No runtime dependency on `scripts/`, `pulse/`, Docker helpers, Explorer assets, or `.ui` files

## Install

From the repo root:

```bash
python3 -m venv monitor-ui/.venv
monitor-ui/.venv/bin/pip install -r monitor-ui/requirements.txt
```

## Run

```bash
npm run monitor:ui
```

Or directly:

```bash
monitor-ui/.venv/bin/python monitor-ui/app.py
```

## Environment

- `VITALS_DIR` — override vitals directory path. Defaults to `<repo>/vitals`.
- `MONITOR_BED` — bed label shown in the header. Defaults to `Bed A`.
- `MONITOR_FULLSCREEN=1` — start fullscreen.
- `MONITOR_POLL_MS` — JSON polling interval in milliseconds. Defaults to `500`.

## Current delivery

- Phase 1: bedside shell and launcher
- Phase 2: polling JSON ingress adapter with waiting state and alarm metadata loading
- Phase 3: live numerics and alarm banner

Waveform rails are placeholders in this delivery lane. They stay independent from the JSON ingress boundary so a later waveform provider can replace them cleanly.

`vitals/timeline.json` is a demo-mode full-history file. Long-duration or multi-patient monitor runs should move to JSONL or bounded-window reads before replay scale becomes part of the contract.
