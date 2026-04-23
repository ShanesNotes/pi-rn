# Monitor-UI Phased Build

Bedside monitor recreation for pi-sim. Reference style: Philips IntelliVue (see `refs/patterns.md`). Do not copy assets.

## Status

- Phases 1–3 already on `main` (see `app.py`, `monitor_ui/`, `tests/`).
- This document defines Phases 4–7 plus a back-fill check on 1–3 against `refs/patterns.md`.

## Pipeline used to build the reference

### v1 (Module 1 — 360p, scene-cut only)
1. `yt-dlp -f 'worst[height>=360][ext=mp4]'` → 360p mp4 (~11 MB)
2. `ffmpeg -vf "select='gt(scene,0.10)'" -vsync vfr -q:v 2` → 17 useful frames
3. Multimodal read of every frame → `refs/patterns.md`

### v2.1 (Module 3 — 720p + transcript + dedup, what we ran without installing whisper/scenedetect/imagehash)
1. `yt-dlp -f 'bestvideo[height=720][ext=mp4]+bestaudio[ext=m4a]' --merge-output-format mp4 --write-auto-subs --sub-langs en --convert-subs srt` → 720p mp4 (12 MB) + SRT
2. `ffmpeg -vf "select='gt(scene,0.08)+not(mod(n,250))',mpdecimate=hi=64*48:lo=64*16:frac=0.5"` → 42 frames (scene-cut OR every ~8s, mpdecimate culls near-duplicates)
3. Multimodal read of strategic sample (every 3rd) → 14 frames covered all distinct UI states
4. SRT used for context only — auto-subs have heavy duplicate-line cruft, not trustworthy as a topic index without a dedup pass

### v2.2 (Module 02 onward — three-model SYNTHESIS pipeline, currently active)
1. **Shared download + extraction** (deterministic): same as v2.1 (720p mp4 + auto-subs, ffmpeg scene+8s+mpdecimate).
2. **Three independent multimodal passes** in parallel on the same frames:
   - Claude (me) reads via Read tool, writes `refs/m{NN}/passes/claude.md`
   - `codex exec "<prompt>"` background, writes `refs/m{NN}/passes/codex.md`
   - `gemini -p "<prompt>" --include-directories=<frames-dir> --yolo` background, writes `refs/m{NN}/passes/gemini.md`
3. **Synthesis** (claude only): I read all 3 pass files, resolve disagreements by re-reading cited frames, write `refs/m{NN}/SYNTHESIS.md` with provenance tags `[claude-only]` / `[codex-only]` / `[gemini-only]` for non-consensus claims.
4. Append a Module N summary section to canonical `refs/patterns.md` linking to `SYNTHESIS.md`.
5. Commit per module.

**Cost note:** ~230k tokens per module on the codex side. Each model adds ~3–5 min wallclock. Worth it: m02 pass demonstrated codex+gemini caught the INOP/cyan distinction and the bright/olive blink-phase animation that single-model claude alone missed entirely.

**Lesson learned m02:** sample density matters — claude every-6th sampling missed states codex+gemini caught with every-3rd. Match density of background passes when running synthesis: every-3rd on all three models.

### v3 (next — install gates required)
- `pip install imagehash scikit-image scenedetect` — enables SSIM dedup + content-detector.
- `apt install tesseract-ocr` + `pip install pytesseract` — enables OCR pre-filter to drop title/legal cards.
- `pip install openai-whisper` (CPU, 1–2 GB models) — Whisper-aligned variable cadence (1 fps default, 5 fps when narrator says "alarm", "setup", "limit").

### Critique sources (pipeline design)
- **Codex (gpt-5.4)**: scene-cut too brittle for small UI deltas; recommended fixed-interval + pHash backbone, PySceneDetect for coarse only.
- **Gemini (0.38.2)**: 360p insufficient for production fidelity; YUV 4:2:0 smears alarm-state colors; sweep-rendering needs higher-cadence bursts. Recommended Whisper alignment, SSIM over pHash, OCR pre-filter.
- Both runs are independent — disagreement is signal, agreement is confidence.

`refs/source/` and `refs/frames/` and `refs/m*/passes/` are gitignored. `refs/patterns.md` and `refs/m{NN}/SYNTHESIS.md` are tracked.

## Phases

### Phase 0 — Reference capture ✅
- Frames + `patterns.md` produced. Gaps logged at bottom of patterns.md.

### Phase 1 — Layout grid ✅ (verify)
- Verify against patterns.md §"Global Layout": 4-zone grid (status / waves+numerics / NBP / footer).
- Verify status bar fields match (host, patient, datetime, profile, wave mode, battery).
- → produce diff list of mismatches in `monitor-ui/REVIEW_P1.md`.

### Phase 2 — Waveform widgets ✅ (verify)
- Verify ECG/Pleth/ABP/Resp colors match channel palette in patterns.md.
- Verify sweep-erase rendering (no fade tail), label+scale on left.
- Add NBP-only row (no waveform) if missing.

### Phase 3 — Numeric tiles ✅ (verify)
- Verify tile structure: label/units/limits stacked, big number, channel color.
- Verify tile selection state (white outline) is reachable.

### Phase 4 — Alarm + state visuals
- DEMO pill (top-center, gray) when input is the simulator stream.
- "Al. Paused MM:SS" red status pill upper-right with live countdown.
- Limit-violation per-tile flash (red high-priority, yellow medium, cyan info).
- Acknowledge / Stop All footer button state machine.
- Tests: simulate violation → assert tile class transitions.

### Phase 5 — Modals + menus
- Main Setup → Measurements / Equipment / Alarms / Notifications / Trends.
- Setup-{ECG, SpO2, NBP, Resp} dialogs with high/low/desat limits + alarm on/off.
- Waveform context menu (right-click on row): Freeze, Secondary Lead, Size Up/Down.
- Yellow focus-row highlight, X-close behavior, ▲▼ pagination.

### Phase 6 — Pulse stream wiring
- Bind tiles + waveforms to pi-sim Pulse engine output (`shim` HTTP).
- Per-channel ring buffer at 25 mm/s sweep rate.
- Reconnect handling when shim is down → grayed numerics + signal-loss icon.

### Phase 7 — Polish
- Vitals Trend page (deferred from Phase 5 — needs second reference video).
- Theme tokens (channel palette as QSS variables).
- Accessibility: keyboard navigation through tiles, screen-reader labels, prefers-reduced-motion respects sweep speed cap.
- Snapshot tests for each phase's QSS-rendered widget.

## Order rationale

Verification of 1–3 first — cheap, catches drift before piling Phase 4 visuals on a wrong grid. Phase 4 (alarms) before Phase 5 (modals) because alarms are runtime-visible during Pulse-stream demo, modals are operator-only. Phase 6 last among functional work — engine wiring needs the visuals settled to surface real bugs.

## Open questions (decide before Phase 4)

- Snapshot test framework: `pytest-qt` + `QImage.save` golden-master, or pixelmatch via `imagehash`?
- Theme palette: QSS variables vs. Python constants? (Affects how easily we re-skin for different reference monitors.)
- Should the simulator-DEMO pill differ from a real-DEMO pill, or reuse?
