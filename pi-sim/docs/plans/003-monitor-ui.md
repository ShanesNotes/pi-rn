# Plan: 003 — PySide6 Bedside Monitor UI

> Status: superseded for execution by `.omx/plans/prd-monitor-ui-execution-ready.md` and `.omx/plans/test-spec-monitor-ui-execution-ready.md`. Keep this document as ideation/reference only; do not use it as the controlling implementation plan.

## Context

pi-sim currently has two consumers of `vitals/current.json`: the in-process TUI (`scripts/render.ts`, ANSI) and sibling pi-agent. The narrative goal is a second, co-running viewer that looks and behaves like a Philips IntelliVue bedside monitor — black chassis, color-coded numerics, rolling waveform strips, red alarm banner. It must run alongside the existing TUI without interfering.

This plan delivers that viewer as a standalone PySide6 desktop app under `monitor-ui/`. The UI is a strict read-only consumer of `vitals/*.json`; it never imports `scripts/`, never speaks HTTP, never runs Docker. The vitals JSON schema is the permanent contract (it will survive the eventual Rust rewrite of the engine + UI), so all file IO is isolated to a single adapter module.

Waveforms are delivered in two phases: **Phase 1** synthesizes plausible ECG/Pleth/ART traces from the scalar frames (the only thing the shim emits today at DT_SIM=2), **Phase 2** (deferred) adds real Pulse waveform streaming via a separate file or socket. The first ship is complete and demo-ready using only Phase 1.

## Decisions (stated upfront)

1. **Language / framework**: Python 3.12 + PySide6 (Qt6). No C++. No Electron. No web.
2. **Data ingress**: `QFileSystemWatcher` on `vitals/current.json` + `vitals/timeline.json`, with a defensive 500 ms poll fallback (watchers miss rapid back-to-back writes on some filesystems). Reads tolerate partial JSON by swallowing `JSONDecodeError` and retrying next event.
3. **Waveform strategy**: Phase 1 — synthesize in-process from scalars (ECG QRS template, pleth sinusoid, ART systolic+dicrotic). Phase 2 — real Pulse samples via `vitals/waveforms.jsonl` or local socket, **deferred, not in this plan's ship**.
4. **Explorer reuse**: clone https://gitlab.kitware.com/physiology/explorer into `explorer/reference/` (already gitignored via `explorer/.gitignore`'s `*` rule). Extract `.ui` files and QSS snippets for layout + palette reference only; re-implement all logic in Python. Drop a `NOTICE` file attributing Apache 2.0 origin for anything copied verbatim.
5. **Coupling surface**: one module (`monitor_ui/vitals_source.py`) owns all `vitals/*.json` reading and exposes a typed `Frame` dataclass + Qt signals. Everything else consumes the signals. Eventual Rust port swaps this one file.
6. **Process model**: single Qt main thread; no background threads. File IO is synchronous on signal callbacks (JSON is tiny, <5 KB). Waveform animation driven by a single `QTimer` at ~30 Hz.
7. **Launch**: `npm run monitor:ui` → shells out to `python3 monitor-ui/app.py` passing through argv. Also directly runnable via `python3 monitor-ui/app.py`.
8. **Startup**: non-blocking. If `current.json` missing/empty at launch, show a "waiting for data…" placeholder. Start rendering as soon as first valid frame arrives.
9. **Shutdown**: `Ctrl-C` (via `signal.signal(SIGINT, …)` + a 100 ms no-op `QTimer` to let the signal fire into Qt) and window-close both tear down watcher, timer, and exit cleanly.

## Directory layout

```
monitor-ui/
  app.py                         thin entrypoint: parse env, build QApplication, show MainWindow
  requirements.txt               pyside6>=6.7, numpy>=1.26 (nothing else without justification)
  README.md                      how to install deps, run, env knobs; notes Phase 1 waveform caveat
  NOTICE                         Apache 2.0 attribution for Explorer-derived .ui/QSS snippets
  monitor_ui/
    __init__.py
    config.py                    env parsing: VITALS_DIR, MONITOR_BED, MONITOR_FULLSCREEN
    vitals_source.py             SCHEMA ADAPTER — reads current.json + timeline.json, emits QObject signals
    alarms.py                    reads alarms.json; maps alarm codes → human labels + affected field
    synth/
      __init__.py
      ecg.py                     QRS-template generator, HR-scaled sweep
      pleth.py                   pulse-wave synthesis from HR + SpO2
      art.py                     arterial pressure wave from bp_sys/bp_dia + HR
      sweep_buffer.py            ring-buffer primitive shared by all three
    widgets/
      __init__.py
      main_window.py             top-level layout: header + alarm banner + body grid
      alarm_banner.py            flashing red bar when any alarm active
      numeric_panel.py           one vital → big number + label + unit, color-coded, alarm-aware
      waveform_strip.py          renders a sweep_buffer via QPainter at ~30 Hz
      trend_sparkline.py         (optional/late phase) mini 10-min trend from timeline.json
    resources/
      monitor.qss                stylesheet (IntelliVue palette, panel borders, typography)
      bedside.ui                 Qt Designer layout (loaded via QUiLoader) — optional; code-built layout is the fallback
  tests/
    test_vitals_source.py        parses real vitals/current.json fixtures, asserts Frame shape
    test_synth_ecg.py            smoke test: feed HR=72, assert buffer ticks at expected rate
    fixtures/
      current_normal.json
      current_alarm.json
      timeline_60s.json
```

Root-level additions:
- `package.json` → add `"monitor:ui": "python3 monitor-ui/app.py"` script (pass-through via shell).
- No new entries in `vitals/`. The UI owns nothing there.

## Implementation phases

Phases are ordered so something visible ships on day 1 and each chunk ends with a runnable demo. Each is scoped to one focused edit session.

### Phase 1 — Skeleton app, empty window, env wiring

**Covers.** Create `monitor-ui/` directory, `requirements.txt` (pyside6, numpy), `README.md`, `app.py` that builds a 1280×800 black `QMainWindow` titled "pi-sim monitor — {BED}". Parses `VITALS_DIR`, `MONITOR_BED`, `MONITOR_FULLSCREEN` env vars in `monitor_ui/config.py`. Wires `SIGINT` handler + window-close to `QApplication.quit`. Adds `"monitor:ui"` to root `package.json`.

**Verify.**
```bash
python3 -m venv monitor-ui/.venv && source monitor-ui/.venv/bin/activate
pip install -r monitor-ui/requirements.txt
MONITOR_BED="ICU 7" python3 monitor-ui/app.py
# expect: black window, title shows "ICU 7", Ctrl-C in terminal closes it cleanly
npm run monitor:ui   # same result
```

### Phase 2 — Schema adapter (`vitals_source.py`) + fixture tests

**Covers.** Implement `Frame` dataclass mirroring the vitals schema exactly (every field from the `vitals/current.json` example is typed, all optional except `t`/`wallTime`/`alarms`). Implement `VitalsSource(QObject)` with:
- `frame_changed = Signal(Frame)` and `timeline_changed = Signal(list[Frame])`
- A `QFileSystemWatcher` on `current.json` + `timeline.json`
- Defensive `QTimer` poll at 500 ms (catches watcher drops on fast writes)
- `JSONDecodeError` + `FileNotFoundError` + empty-file handling → swallow, retry next tick
- `start()` / `stop()`; on stop, watcher + timer are torn down
- `last_frame` property for late subscribers

Write `tests/` with fixtures copied from a real `vitals/current.json` + `timeline.json` snapshot. Tests run under `pytest` (add to `requirements.txt` only if cheap — otherwise plain `python -m unittest`).

**Verify.**
```bash
cd monitor-ui && python -m pytest tests/ -v   # or python -m unittest
# assert Frame parses real fixture, alarms list preserved, missing fields → None
```

### Phase 3 — Minimal numerics view (no waveforms, no styling)

**Covers.** `MainWindow` subscribes to `VitalsSource.frame_changed`. Lays out a vertical stack of plain `QLabel`s showing HR / BP / MAP / SpO2 / RR / Temp / t (sim time). Uses dumb `str(frame.hr)`. No colors yet. Shows "waiting for data…" until the first frame arrives. Startup is non-blocking even if `vitals/` is empty.

**Verify.** Two terminals:
```bash
# term 1
npm run pulse:up && npm run monitor:shock
# term 2
npm run monitor:ui
# expect: labels update every DT_SIM seconds; values match scripts/render.ts TUI
```

### Phase 4 — Explorer reuse: clone, extract layout + palette

**Covers.** Clone upstream Explorer into `explorer/reference/` (gitignored). Inspect its `.ui` / `.qss` resources. Identify the bedside-monitor screen. Extract:
- Panel proportions (waveform column width, numerics column layout)
- Color palette (HR green, SpO2 cyan, NBP white, ART red, Temp yellow, etCO2 yellow)
- Typography (panel label size vs numeric size)

Drop extracted snippets into `monitor-ui/monitor_ui/resources/monitor.qss` and a `bedside.ui` if useful (Qt5→Qt6 port: watch for deprecated `QWidget::enabled` defaults, removed `QGraphicsEffect` subclasses, and `QFontDatabase` being static in Qt6). Code-built layout remains the fallback if `.ui` port is messy. Write `NOTICE` with Apache 2.0 attribution for any copied text.

**Verify.**
```bash
ls explorer/reference/.git   # clone present and gitignored
git status                    # explorer/reference not listed
cat monitor-ui/NOTICE         # Apache 2.0 + link to upstream commit hash
```
Then load `monitor.qss` in Phase 1 app and confirm black+gray panel borders render.

### Phase 5 — Numeric panels with IntelliVue styling

**Covers.** Replace plain `QLabel` stack with `NumericPanel` widget: label top-left (10pt), big numeric right-aligned (48–72pt), unit small next to numeric. Each panel gets a color from the extracted palette. Grid layout in `MainWindow` roughly matching IntelliVue: waveform column left (empty placeholder for now), numerics column right with HR / NBP+MAP / SpO2+PR / Temp / RR / etCO2 / CO stacked. `QSS` styles panel borders (thin gray, 1px). Panels subscribe to `frame_changed` and format their field.

**Verify.** Run both monitor + monitor:ui; visually compare against reference IntelliVue screenshot. Numeric values update; colors correct (HR green, SpO2 cyan, etc).

### Phase 6 — Alarm banner + per-panel alarm state

**Covers.** `AlarmBanner` widget across the top: hidden when `frame.alarms` empty, otherwise red bar with text joined from alarm codes (mapped via `alarms.py` to human labels: `"MAP_LOW" → "MAP LOW"`). `QTimer` at 2 Hz toggles a "flashing" class for CSS blink. `NumericPanel` checks whether its field is in any alarm (e.g., panel for `hr` reacts to `HR_LOW` / `HR_HIGH`) and switches text color to bright red when alarmed. `alarms.py` optionally loads `vitals/alarms.json` to annotate panels with the threshold band in small text below the numeric (e.g., "50–120").

**Verify.**
```bash
# force an alarm by editing alarms.json temporarily OR use a scenario that alarms
npm run monitor:shock
# expect: when MAP drops <65, top banner flashes "MAP LOW", MAP numeric turns red
```

### Phase 7 — Waveform synthesis module (no rendering yet)

**Covers.** Implement `synth/` in isolation — pure functions + a `SweepBuffer` ring buffer, zero Qt imports:
- `sweep_buffer.SweepBuffer(capacity, sample_rate_hz)` — numpy float32 ring, write N samples, read last N.
- `synth/ecg.py` — `ecg_tick(t_seconds, hr_bpm) -> float` using a canonical PQRST template (Gaussian/ triangle approximation is fine for Phase 1). Amplitude ~1 mV equivalent. Sample rate 125 Hz.
- `synth/pleth.py` — `pleth_tick(t, hr, spo2) -> float` sin-ish with dicrotic bump; amplitude modulated by SpO2 (low SpO2 → damped amplitude). 50 Hz.
- `synth/art.py` — `art_tick(t, hr, bp_sys, bp_dia) -> float` piecewise: sharp systolic upstroke to `bp_sys`, dicrotic notch, exponential decay to `bp_dia`. 125 Hz.

Unit tests feed 60s of synthesized samples, assert QRS count ≈ HR and amplitude in range.

**Verify.**
```bash
cd monitor-ui && python -m pytest tests/test_synth_ecg.py -v
# assert 60s at HR=72 produces 72±2 R-peaks
```

### Phase 8 — ECG waveform strip wired into UI

**Covers.** `WaveformStrip(QWidget)` renders a `SweepBuffer` via `QPainter` in `paintEvent`. `QTimer` at 30 Hz triggers `update()`. Strip knows how to ask a synth module for the next batch of samples given the elapsed wall-time and the most recent `Frame`. `MainWindow` places one ECG strip in the top-left waveform column, green traces on black. When any HR-related alarm fires, trace color switches to red.

**Verify.** Run full stack; see a single green ECG trace sweeping left-to-right, QRS rate matches displayed HR. Visually sanity-check at DT_SIM=1 and DT_SIM=30 — synthesis is driven by wall clock + latest scalar, so the trace should stay smooth regardless.

### Phase 9 — Pleth + ART strips; all three stacked

**Covers.** Add two more `WaveformStrip` instances below ECG: cyan pleth (driven by `synth.pleth`), red ART (driven by `synth.art`). Label each strip with its signal name + scale. Same 30 Hz redraw timer shared across strips (one `QTimer`, multiple `update()` calls).

**Verify.** Visual: three strips stacked, all smoothly sweeping. Color per convention. Amplitude on ART reflects current `bp_sys`/`bp_dia` numerically — cross-check against the NBP panel numbers.

### Phase 10 — Watcher robustness under fast writes (TIME_SCALE=0)

**Covers.** Stress-test `VitalsSource` under free-run (`TIME_SCALE=0`) where monitor writes at ~kHz. Expected fixes: debounce signal emission to ≤100 Hz (coalesce rapid events into a single `frame_changed` per animation tick), confirm the 500 ms poll still catches writes if the watcher stalls (Qt's `QFileSystemWatcher` sometimes unregisters on `rename` — re-add path on each event). Add an overload counter; if >1000 events/sec, log once and keep draining.

**Verify.**
```bash
TIME_SCALE=0 DT_SIM=1 npm run monitor:shock &
npm run monitor:ui
# expect: UI stays fluid, CPU stays < 15% of one core, scenario completes without UI freeze
```

### Phase 11 — Waiting-for-data state + clean shutdown audit

**Covers.** Polish the startup-before-first-frame state: centered "waiting for vitals…" label, subtle animated spinner. Audit shutdown: verify `QFileSystemWatcher`, `QTimer`, and any synth buffers are explicitly stopped in `closeEvent` and `aboutToQuit`. Add logging so Ctrl-C prints "monitor-ui: shutting down" once.

**Verify.**
```bash
python3 monitor-ui/app.py                 # vitals/ empty or pulse not running
# expect: "waiting for vitals…" spinner, no crash
# start pulse+monitor in another terminal; UI picks up within 1s of first write
# Ctrl-C in UI terminal: clean exit, no "RuntimeError: timer still active"
```

### Phase 12 — Trend sparklines + final polish (optional-in-scope)

**Covers.** `TrendSparkline` widget reads `timeline.json` on each update, plots last 10 minutes of a given field under the numeric (small, ~60×20 px). Add one sparkline under HR, MAP, SpO2. Header shows `BED`, sim time (HH:MM:SS from `frame.t`), and wall time from `frame.wallTime`. Fullscreen toggle via F11 when `MONITOR_FULLSCREEN=1`.

**Verify.**
```bash
MONITOR_FULLSCREEN=1 npm run monitor:ui
# expect: fullscreen black, sparklines draw a short trace, F11 toggles
```

---

## Out of scope / explicit follow-ups

- **Phase 2 waveforms (real Pulse samples).** Requires shim changes (`Lead3ElectricPotential`, `ArterialPressure` high-rate `DataRequest`s), a new transport (`vitals/waveforms.jsonl` append-only OR localhost socket), and a source swap in `WaveformStrip`. Interface boundary: `WaveformStrip` asks a `SampleProvider` for the next N samples — Phase 1 uses `SynthProvider`, Phase 2 swaps in `FileStreamProvider`. Tracked as a separate plan.
- **Trend graphs beyond 10 min sparkline.** Full HR/BP/SpO2 scrolling trend panels with axis labels.
- **Alarm audio.** No sound in ship. Follow-up: `QSoundEffect` with three-tone IntelliVue alarm cadence.
- **User interaction.** No freeze/pause/zoom/scroll/silence-alarm buttons. Strictly a viewer.
- **Historical review.** No rewind/scrub. `timeline.json` is only used for sparklines.
- **Multi-patient / multi-bed.** One window, one vitals directory.
- **Cross-platform.** Linux only. Mac/Windows unsupported (PySide6 is portable but untested here).

## Risks

- **Qt5 → Qt6 `.ui` port.** Explorer's `.ui` files were authored against Qt5. `QUiLoader` in PySide6 tolerates most of it but may fail on removed widgets or deprecated property names. Mitigation: code-built layout is primary; `.ui` is optional reference. Keep the code path runnable without the `.ui`.
- **`QFileSystemWatcher` unreliability.** On ext4 + atomic rename, the watcher occasionally unregisters itself because the inode changes. Mitigation: re-add the path on every event + 500 ms poll fallback. Not relying on watcher alone.
- **Fast-write saturation at `TIME_SCALE=0`.** Each write → decode cost. Mitigation: coalesce to animation frame rate; Phase 10 stress-tests this.
- **PySide6 install quirks.** `pyside6` wheels are big (~140 MB) and require `libGL` + `libxcb-cursor0` on bare-Ubuntu. `README.md` documents `apt install libgl1 libxcb-cursor0` if `pip install pyside6` fails at runtime.
- **Synthesized-vs-real confusion.** A clinician-eye viewer might assume the ECG is real. Mitigation: Phase 1 `README.md` + small "SYNTH" watermark in the waveform column corner. Removed in Phase 2 when real samples arrive.
- **Schema drift.** Someone adds a field to `vitals/current.json` and the UI silently ignores it. Mitigation: `Frame` dataclass has explicit fields; a `forward_compat` dict catches unknowns + logs a one-time warning so drift is surfaced.

## Critical files for implementation

- /home/ark/pi-rn/pi-sim/monitor-ui/app.py
- /home/ark/pi-rn/pi-sim/monitor-ui/monitor_ui/vitals_source.py
- /home/ark/pi-rn/pi-sim/monitor-ui/monitor_ui/widgets/main_window.py
- /home/ark/pi-rn/pi-sim/monitor-ui/monitor_ui/widgets/waveform_strip.py
- /home/ark/pi-rn/pi-sim/monitor-ui/monitor_ui/synth/ecg.py
