# Module 26 — Navigate the IntelliVue X3 (3-model synthesis)

Source: Philips IntelliVue training video #26 (`JmAc_1Y9Ync`), 720p, 246s.
Independent passes: `passes/claude.md` (9 frames), `passes/codex.md` (24 frames, near-full set), `passes/gemini.md` (11 frames).

## Critical reframing — X3 is a form-factor variant

**Consensus, all 3 models.** X3 is the **portable / handheld** member of the IntelliVue family. Different physical envelope (right-side carry handle, smaller display) drives **different navigation chrome** but **shares all underlying widgets** (Setup-X dialogs, banner zones, numeric tiles, beige modal toolkit, channel palette).

**Treat as `FormFactor.X3`** in `monitor-ui/`, parallel to `FormFactor.MX_SERIES`. Same widget vocabulary, different chrome layout.

---

## What changes on X3 (vs MX-series)

| Aspect | MX-series | X3 |
|---|---|---|
| Footer | horizontal `QToolBar`, 10-15 buttons, scroll overflow `«»` | **3-button vertical rail on LEFT** inside display |
| Action menu | inline footer buttons | `SmartKeys` **3×6 grid overlay** (18 buttons), launched by `Keys` rail button |
| Setup-X dialogs | centered modal floating over waveforms | **split-screen**: live preview left, settings right |
| Default waveforms | 4–6 rows (II/V/Pleth/ABP/Resp) | **3 rows** (II/Pleth/Resp) |
| ST analysis column | 8 rows | **2 rows** (`ST-I`, `ST-V5`) |
| `DEMO` indicator | centered gray pill over waveform area | small text label in info bar |
| Device ID | `IVPM`, `MX700-1` | `X3-1`, `X3-4` |
| `«»` overflow | yes | not observed |

## What stays the same (cross-form-factor consistency)

**Consensus, all 3 models** — same beige modal surface `~#D6D2C7`, same 3-slot banner zone (cyan/yellow/red), same channel palette (green/cyan/red/yellow), same Setup-X field schemas, same alarm taxonomy (6-tier), same arrhythmia classification slot, same touch-first interaction model.

---

## X3 navigation chrome (consensus, all 3 models)

### Vertical 3-button left rail

```
┌─────────────┐
│  △✓         │ Acknowledge   ← top
│             │
│  Acknowl-   │
│  edge       │
├─────────────┤
│   □         │ Screen        ← middle
│             │
│  Screen     │
├─────────────┤
│   ⋮⋮         │ Keys          ← bottom
│             │
│  Keys       │
└─────────────┘
```

**State colors** (codex hex measurements):
- Idle tile: dark gray `~#595959`
- Focus glow: cyan `~#77BEB6`
- Selected: blue fill `~#2940AE` (claude saw bright blue, gemini said `#0047BA`)

**Position**: roughly x `223`–`299`, y `216`–`568` of 1280×720 frame [codex]. Inside the display rectangle, not on the device bezel.

### Top status bar

`[patient icon] Johansen, Georgia | X3-1 | 7:10 | DEMO | [device icons] | [battery]`

Background: dark gray `~#68696B` [codex]. `DEMO` rendered as small text label, not centered pill.

### Three-slot banner zone (preserved cross-form-factor)

Initial home-screen frames show the same 3-slot pattern from M20:
- Cyan: `Some ECG AlarmsOff` (`~#25DFD7`)
- Yellow: `* HR Low` (`~#CED712`)
- Red: `*** Apnea` (`~#E23039`)

Banner row is **gone in later frames** [codex] — implies alarms auto-dismiss after acknowledgement / clearance. Track for the live demo.

---

## SmartKeys overlay (consensus, all 3 models)

Triggered by `Keys` rail button. Full-content-area modal, `SmartKeys` title with `X` close. **3 rows × 6 columns = 18 buttons**, icon over text per cell.

```
Start/Stop NBP | Stop All NBP   | NBP Modes      | Veni Puncture | Zero          | Monitor Standby
Patient Demogr.| Profiles       | Capture 12 Lead| Report List   | Vitals Trend  | End Case
Pause Alarms   | Alarm Volume   | QRS Volume     | Delayed Record| Meas. Select. | Main Setup
```

Replaces the MX-series horizontal-overflow toolbar entirely. `Main Setup` lives as a grid cell (bottom-right), not a separate persistent button.

---

## Modal/dialog inventory

### Setup-X dialogs — SPLIT-SCREEN on X3

**Gemini+codex consensus, claude initially missed**: X3 Setup-X dialogs use a **split-screen layout** instead of the centered modal seen on MX-series.

- **Left half**: live preview of the parameter (e.g., HR `60` green numeric + small ECG waveform for Setup ECG; `120/80 (90)` red NBP numeric for Setup NBP).
- **Right half**: scrollable settings list with `X` close.

**Setup ECG** (frame 17): rows = `High Limit 120 / Low Limit 50 / ECG/Arrhy Alarms On / AlarmSrc(Auto) / Paced Mode Off / Arrhythmia [more below]`.

**Setup NBP** (frame 19, codex): rows = `Alarms from Sys. / Sys. High 160 / Sys. Low 90 / Alarms On / Start/Stop NBP`.

**Implementation**: reusable `X3SetupDialog(QSplitter)` — left pane = live preview widget for the parameter, right pane = `IntelliVueModal` settings list. Maintain field-schema parity with MX-series (same fields, different presentation).

### Main Setup list

**Codex+gemini**: triggered by tapping `Main Setup` SmartKey. Scrolling dark list with thin dividers. Visible rows: `Measurements`, `Equipment`, `Alarms`, `Notifications`, `Trends`. Vertical scroll bar on the right. Same modal toolkit (beige with X close).

### Change Screen modal

**Consensus, all 3 models**. Title `Change Screen`, X close. **Two-pane layout**:

- **Left action column**: `Previous Screen` / `Auto Rotation` / `Lock Touch` (sub-actions specific to this dialog).
- **Right preset list**: `3 Waves` / `4 Waves` / `5 Waves A` / `5 Waves B` / `5 Waves C` / `Overlapping...`

While open, the rail's `Screen` tile stays blue-selected.

### Lock Touch confirmation flow

**Consensus claude+codex**: triggered by `Lock Touch` action. Touch input disabled, footer rail tiles grayed. Bottom yellow band: `Select 'Confirm' to enable touch operation.` with right-aligned `Confirm` button. Confirm bar position: x `331`–`1036`, y `483`–`536` [codex]. Bar bg `~#4E4859`, button `~#5A5A5A`.

### Orientation warning

**Consensus claude+gemini+codex**: when X3 is rotated to portrait with **handle pointing down**, a yellow status pill `This device orientation is not supported` appears. Bedside layout still attempts to render. Adjacent training card: `The X3 should NOT be mounted with the handle pointing down.`

### Companion Mode boot state

**Codex-only** (frames 4, 8): early frames show a black boot screen with blue `Companion Mode` bar, plus a `No Alarm Display` bar in the docked-with-host frame. Indicates X3 can dock with an MX host monitor and operate in subordinate mode. Not part of standalone runtime UI.

---

## Implications for `monitor-ui/`

| Pattern | Hint |
|---|---|
| `FormFactor` enum | `class FormFactor(Enum): MX_SERIES, X3` in `MonitorConfig` — drives footer chrome, default waveform count, info-bar density, Setup-X dialog layout |
| **X3 vertical rail** | 3-button vertical `QToolBar` on left when `form_factor=X3`. Buttons: `Acknowledge` (`△✓` icon) / `Screen` (`□`) / `Keys` (`⋮⋮`). Idle `#595959`, focus glow `#77BEB6`, selected `#2940AE` |
| `SmartKeysOverlay` | full-content-area `QGridLayout` (3×6), icon-over-text `QToolButton`, X close. Triggered by `Keys` rail button |
| `X3SetupDialog` | split-screen `QSplitter` — left = live preview widget, right = `IntelliVueModal` settings list. Reuse field schemas from MX Setup-X |
| `MainSetupListDialog` | scrolling beige list with thin dividers + scroll bar. Items: Measurements / Equipment / Alarms / Notifications / Trends |
| `ChangeScreenDialog` | two-pane: left action column (Previous Screen / Auto Rotation / Lock Touch) + right preset list (3 Waves / 4 Waves / 5 Waves A/B/C / Overlapping). `Screen` rail tile stays selected while open |
| `Auto Rotation` toggle | persistent setting; if true, `screen-orientation-changed` triggers re-layout |
| `Lock Touch` flow | disable touch input, gray rail tiles, render bottom yellow `Confirm` bar. Re-enable on `Confirm` tap |
| Orientation overlay | detect device orientation; if portrait + handle-down, render yellow status pill `This device orientation is not supported` |
| **Banner zone preserved** | same 3-slot cyan/yellow/red on X3 as on MX-series (no chrome change for alarms) |
| Compact info bar | drop centered DEMO pill on X3, render DEMO as small text label in info bar |
| Reduced ST column | X3 ST analysis = 2 rows. Make `STAnalysisWidget` accept a configurable lead-list arg |
| Compact waveform default | X3 default = 3 waveforms (II/Pleth/Resp). MX default = 5–6. Driven by `Change Screen` selection persisted in profile |
| Companion Mode (deferred) | docked-host operation — not needed in v1 simulator. Note for future |

---

## Disagreements + resolutions

- **Setup-X presentation**: claude said "centered modal" (MX-style) initially. Gemini+codex said split-screen with live preview. **Resolved as split-screen on X3** by re-reading frames 17 + 19 — confirmed live numeric on left, settings list on right.
- **Selection halo color confusion**: claude saw cyan around screen content in frame 9 and called it `[?]`. Codex described it as cyan glow on the rail tile (focus state). Gemini said sidebar button highlight `#0047BA` (selected). **Resolved**: cyan = focus (transient), blue = selected (persistent). Two distinct states on the rail tiles.
- **Chrome layout**: all 3 agree on left vertical rail; gemini said it's a "sidebar"; codex measured exact pixel coordinates inside the display window. Consensus: rail is **inside** the display rect, not on the bezel.

---

## Frames cited (union of all 3 passes)

m26_003, m26_004, m26_005, m26_006, m26_007, m26_008, m26_009, m26_010, m26_011, m26_012, m26_013, m26_014, m26_015, m26_016, m26_017, m26_018, m26_019, m26_020, m26_021, m26_022, m26_023, m26_024, m26_025, m26_027, m26_028, m26_029, m26_031
