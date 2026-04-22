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

```bash
python3 -m venv /tmp/pi-rn-monitor-ui-venv
source /tmp/pi-rn-monitor-ui-venv/bin/activate
pip install -r monitor-ui/requirements.txt
```

## Run

```bash
python3 monitor-ui/app.py
```

Or from the repo root:

```bash
npm run monitor:ui
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
