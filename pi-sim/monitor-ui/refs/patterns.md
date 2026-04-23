# IntelliVue UI Patterns — Reference Synthesis

Source: Philips IntelliVue Patient Monitoring Module 1 (Basic Operation), 2020.
Frames: `frames/scene_003.jpg` … `scene_019.jpg` (17 keepers).
Use: visual reference for PySide6 bedside monitor in `monitor-ui/`.
**Do not commit frames or copy assets. Recreate idiomatically.**

---

## Global Layout (4-zone grid)

```
+--------------------------------------------------------------+
|  STATUS BAR  (host | patient | date/time | profile | mode)  |  ~28 px
+--------------------------------------------------+-----------+
|                                                  |           |
|     WAVEFORM STACK (5–6 rows)                    | NUMERIC   |
|     II / V1 / Pleth / ABP / Resp                 | TILE COL  |
|     ~70% width                                   | ~30%      |
|                                                  |           |
+--------------------------------------------------+-----------+
|  NBP ROW (current large + 2-row history)                     |  ~64 px
+--------------------------------------------------------------+
|  FOOTER TOOLBAR (8–10 icon+label buttons)                    |  ~48 px
+--------------------------------------------------------------+
```

Background: pure black `#000`. All separators implicit (no chrome).

---

## Waveform Rows

Per row left-to-right:
- Label column (~48 px): trace name (`II`, `V1`, `Pleth`, `ABP`, `Resp`), unit/scale below in small text (`1mV`, `150 / 75 / 0`, `10/hm`).
- Trace area (rest of row): scrolling sweep, ~6 s visible.
- ECG rows show repeating beat complexes; Pleth/ABP show pulsatile shape; Resp shows slow sinusoid.

Colors (from frames):
| Trace | Color (approx) | Notes |
|-------|---------------|-------|
| ECG II / V1 | green `#00FF00` | brightest channel |
| Pleth (SpO2) | cyan `#00E0FF` | filled-ish curves |
| ABP (arterial) | red `#FF2020` | dotted high/low limit lines visible |
| Resp | white `#E0E0E0` | thin trace |
| NBP | red `#FF2020` | numeric only, no waveform |

Sweep mode: classic erase-bar (frame 17 shows clean sweep, frame 13 shows mid-sweep). No fade tail.

---

## Numeric Tile Column (right side)

Each tile = stacked block:
```
LABEL  units            <- small (~12 px), colored to channel
[hi]                    <- limits, ~14 px
[lo]
        BIG NUMBER      <- ~80–110 px, channel color
```

Observed tiles top-to-bottom:
1. **HR** bpm — green `60`, limits 120/50
2. **Pulse** bpm — green `60`, with crossed-pulse icon (signal ok/lost)
3. **Temp** °C — green `37.0`, limits 39.0/36.0
4. **SpO2** % — cyan `95`, limits 100/88, perfusion bar (small triangle wedge left of value)
5. **ABP** mmHg — red `120/70 (91)` (sys/dia (MAP)), limits 160/90
6. **RR** rpm — yellow `15`, limits 30/8

Selected tile gets a thin white rectangle outline (frame 8 highlights SpO2 tile).

---

## NBP Row (bottom band)

`NBP  mmHg  Pulse 60   Auto   17:50    NBP  mmHg  17:44 120/80(90)  17:50 120/80(90)`
`120/80  (90)`  ← huge, red

Two columns: live large readout left, history table right (2 rows of `time sys/dia(map)`).

---

## Footer Toolbar

Icon-above-label buttons, left-to-right:
`Acknowledge | Start/Stop | Stop All | Zero | Recordings | Vitals Trend | Patient Demogr. | Monitor Standby | Main Setup | Main Screen | …battery`

States: gray-icon = inactive (Stop All grayed in frame 3), blue-fill = active page (Main Setup / Main Screen highlighted blue in frames 3, 13).

---

## Status Bar (top)

Left → right: host code (`IVPM`), patient icon + name (`Doe, John`), date/time (`17 Feb 2020 17:54`), profile chip (`Profiles`), waveform mode (`Dynamic Waves`), battery glyph.

Right side reserved for transient banners: red `Al. Paused 0:29` countdown when alarms suspended (frame 3).

Center: contextual hint banner (`Select to change operating mode`) or mode badge (`DEMO` gray pill).

---

## Modals & Menus

Modal (`Setup ECG`, `Setup SpO2`, `V1`, `Measurements`, `Main Setup`):
- Centered, ~50% width, semi-opaque dark gray with thin white title bar.
- Title left, X close right.
- List rows, monospace alignment of label : value.
- Focused row: yellow band highlight (frame 9).
- Tutorial overlay arrow: red filled arrow pointing at field (frames 10–12) — training-only.

Menu hierarchies seen:
- **Main Setup** → Measurements / Equipment / Alarms / Notifications / Trends / ST Map / STE Map
- **Measurements** → ECG / Arrhythmia / ST Analysis / QT Analysis / IPI / Pulse / SpO2 (each with parameter-module icon)
- **Setup ECG** → High Limit / Low Limit / ECG/Arrhy Alarms On|Off / AlarmSrc / Paced Mode / Arrhythmia / ST Analysis
- **Setup SpO2** → High / Low / Desat Limit / Alarms / Pulse / Label / Set Perf Ref
- **V1 (waveform context)** → Freeze Wave / Secondary Lead / New Lead Setup / Auto Size / Size Up / Size Down / Annotate Arrhy

Pagination: small ▲ ▼ chevrons at bottom of long lists.

---

## Alarm / State Cues

- `Al. Paused 0:29` red status pill upper right with countdown when paused.
- `DEMO` gray pill top-center when not connected to live patient.
- Stop All button grays when alarms already paused.
- Limit lines drawn as horizontal dotted reference inside waveform rows (visible faintly on Pleth/ABP).

No flashing observed in this clip — alarm-active visuals (red flash on tile, audible pattern) likely shown in later modules.

---

## Implications for `monitor-ui/`

| Pattern | PySide6 hint |
|---|---|
| Black background, no chrome | `QMainWindow` with stylesheet `background: #000` |
| 4-zone grid | `QGridLayout` (status / waves+numerics split / NBP / footer) |
| Waveform rows | custom `QGraphicsScene` widget per channel, sweep via timer |
| Numeric tiles | `QFrame` subclass: label/limits/big-number stacked, color via QSS class |
| Modals | `QDialog` with custom title bar, dark theme |
| Footer | `QToolBar` with `QToolButton` (icon over text) |
| Status banner / DEMO pill | overlay `QLabel` positioned absolute |

Channel colors — single QSS palette so swap-out for theming is trivial.

Sweep speed — IntelliVue default ~25 mm/s; map to pixel speed once row width is known.

---

## Gaps to Capture in a Second Pass

Not in this clip:
- Active-alarm flashing colors / red borders.
- Trend page layout (Vitals Trend button exists but not opened).
- 12-lead / multi-lead view.
- Numeric edit input mode (knob / touch keypad).

---

# Module 3 Addendum — "Main Screen Display" (MX-series)

Source: `frames/m3/m3_*.jpg` (42 frames, 720p, scene + every-8s + mpdecimate dedup).

Module 3 shows the **MX-series** (not the older Module 1 layout). Same design language, new fields and buttons. Treat M3 as canonical for new builds; M1 patterns still hold for layout/colors/tile-structure.

## Info bar — extended fields (left → right)

`[network icon]  MX700-1  |  [patient-icon] Spangler, Carl  |  30 May 2019 20:12  |  Profiles  |  hd  |  6Waves  |  [battery]`

New vs M1:
- **Equipment label** (`MX700-1`) — drives surveillance-station sector mapping. Editable from Patient Demographics → Manage Patient.
- **`hd`** indicator (likely "high-density" display mode).
- **`6Waves`** — count of currently displayed waveform rows; clickable to change.
- Right side reserves space for the **alarm-state icon** (bell+triangle) showing audio level / off state.

## Waveform stack — variants

M3 layout shows 5 rows (II / V / Pleth / ABP|ART / Resp) with an **ST-analysis column** sandwiched between ECG-V and Pleth:

```
II   ━━━━━━━━━━━ (ECG green)
V    ━━━━━━━━━━━ (ECG green)
                                   ST-I   0.0
                                   ST-II  0.0
                                   ST-V   -.-
Pleth ∿∿∿∿∿∿∿∿                    ST-III 0.0
ABP   ╱╲╱╲╱╲╱╲                    ST-aVR 0.0
                                   ST-aVL 0.0
Resp  ⎺⎻⎼⎽⎺⎻⎼⎽                    ST-aVF 0.0
                                   ST-MCL -.-
```

ST column: small monospace label + value, one row per lead. Color matches its parent ECG channel (green).

Label flips:
- **ABP** ↔ **ART** — same red palette, different invasive-pressure source. Drive label from input channel metadata, not hardcoded.

## Numeric tiles — M3 variant

Now uses **2-column** layout (HR + Pulse on top row), then full-width tiles below:

```
HR  bpm 110/60   Pulse bpm
        80              80
                    [no-signal X]

ART mmHg sys
        119/80
        160/90
        (96)

RR rpm 30/8
        20
```

## Footer toolbar — M3 (extended)

Left → right (15 buttons typical):
`Silence | Pause Alarms | « | Start/Stop | Stop All | Repeat Time | Adjust Size | Zero | Enter Values | Recordings | Delayed Record | Vitals Trend | Patient Demogr. | Monitor Standby | » | Main Setup | Main Screen | [battery] [network]`

States:
- **Silence** / **Pause Alarms** = yellow background tiles (caution color, leftmost).
- **Main Setup** / **Main Screen** = blue fill when active (rightmost, persistent navigation pair).
- **«** / **»** = horizontal scroll for overflowing toolbar on narrower screens.

## Soft-button overlays

Distinct from footer: **Silence** + **Alarms Off** can pop in as a 2-button cluster (yellow tiles) anchored lower-left when an alarm is active. These are not part of the persistent toolbar — they're transient action buttons surfaced in response to state.

## Alarm-state corner icon

Upper-right of waveform area: a glyph compositing **bell + triangle limit-line**. Variants control:
- audio volume level (height of triangle)
- audio off / paused (bell with X or slash)
- alarm-suspended countdown (`Al. Paused 1:56` red pill replaces icon while active)

## Patient Demographics dialog

Two-pane structure observed:

**Patient Demographics page**:
```
[Title bar: Patient Demographics       ✕]
Spangler, Carl
1988172
Male       1 Jan
[TRAINING badge]
[gender icon]   [admit-status icon]
--- in       --- m²
Notes (1)
Notes (2)
```

**Identity sub-page** (different rows in same dialog frame):
```
* Last Name
  First Name
  MRN
  Visit Number
  Gender
  Date of Birth
```

Asterisks on required fields. `*` placement matches monitor convention.

## Tutorial-style callout boxes (training-mode only)

When the video annotates a UI region, a **white rounded rectangle** with the field label inside (e.g. `MX700-1`) is drawn over/near the element with a thin connector. These are for the training video — do not replicate in the simulator UI.

## M3 Implications for `monitor-ui/`

| New pattern | PySide6 hint |
|---|---|
| Equipment-label editable | bind info-bar field to a settable attribute, surface in patient-admit dialog |
| ST-analysis column | new widget: vertical label/value stack between ECG and Pleth, configurable per-lead |
| Configurable waveform count (6Waves) | data-driven row count, not fixed 5/6 |
| ABP/ART label flip | input metadata drives label; channel-color stays red |
| Footer overflow | `QToolBar` with `setMovable`/scroll buttons OR custom horizontal `QListView` |
| Soft-button overlay | floating `QFrame` z-ordered above waveform area, fade in/out on alarm state |
| Alarm corner icon | composite painter widget for bell+triangle, redraws on volume/state change |
| Patient Demographics dialog | tabbed `QDialog` (Demographics / Identity / Admit / Notes) |
| Training overlays | NOT a feature — drop |

---

# Module 02 Summary — "Understanding Alarms"

**Source:** training video #02 (`tTu9zgkdA0k`), 720p, 467s. **Full detail:** [`m02/SYNTHESIS.md`](m02/SYNTHESIS.md). 3-model synthesis (claude+codex+gemini).

## Key findings

- **6-tier severity ladder, NOT 3.** Two parallel hierarchies share the screen real estate:
  - Physiological alarms: `***` (red) / `**` (yellow-high) / `*` (yellow-low)
  - INOPs (technical): `!!!` (red) / `!!` (yellow) / cyan (info, no prefix observed)
  - Treat as one 6-way enum, not 3+3. Codex+gemini consensus; original claude-only reading missed the INOP split.
- **Banner is a two-layer overlay**: rounded inner pill (priority color, message text) + independent thin red outer outline. Outline = "un-acknowledged"; disappears on ack while pill persists with `✓` prefix added.
- **Per-tile alarm fill BLINKS at ~1Hz.** Yellow tile alternates bright `#D9D919` ↔ dim olive `#727205`. Animate with `QPropertyAnimation`, one per tile. Earlier reading mis-identified blink phases as different priorities.
- **Per-tile upper-left badge slot** holds crossed-bell icon when channel-specific alarm audio is silenced (independent of global alarm-pause). Reserve this slot in `NumericPanel` even on tiles that never use it.
- **Modal surface is beige** (`~#C6BFB5`), not dark gray. Yellow band for focused row, gray for selected list item.
- **Limit-edit overlay**: side spinner panel pops out beside the value column when a limit row gets focus. Bedside numeric tile gets red outline marking which parameter is being edited.
- **Active vs Historical alarms are separate dialogs**: `Alarm Messages` (compact, currently-active) and `Review Alarms` (table with timestamp/event/duration + right-side detail pane).
- **`Alarm Limits` summary modal** uses horizontal limit bars per parameter with current-value marker.
- **Footer toolbar is page-contextual** — alarms page swaps in `Alarm Limits / Active Alarms / PauseAl. 5 min / PauseAl. 10 min / Print / Alarm Volume / Delayed Record`.
- **Acknowledge button = momentary filled state**; **Pause Alarms button = persistent outlined toggle**. Different button-state semantics.
- **Direction prefix** `↑` (high breach) / `↓` (low breach) precedes the alarm code, persists after ack.

## Implications for `monitor-ui/` (delta to existing)

| New pattern | PySide6 hint |
|---|---|
| 6-way severity enum | `class Severity(Enum): RED, YELLOW_HIGH, YELLOW_LOW, INOP_RED, INOP_YELLOW, INOP_CYAN` |
| Two-layer banner | inner `BannerPill` widget + outer `QFrame` red border, toggled independently |
| Tile blink animation | `QPropertyAnimation` on background-color alternating bright/dim severity at 1 Hz |
| Per-tile badge slot | reserved upper-left region in `NumericPanel` for `QIcon` (alarm-off, signal-loss, lead-off) |
| Beige modal toolkit | reusable `IntelliVueModal` with `#C6BFB5` surface, scroll bar, ▲▼ pager, yellow focus row |
| Limit edit spinner overlay | `LimitSpinnerOverlay` pops beside focused row, bedside tile gets red outline |
| Alarm Limits row widget | custom `QPainter` widget: label + low-bracket + bar + marker + high-bracket |
| Page-contextual footer | `MainWindow.set_page(page_id)` reconfigures `QToolBar` button list |
| Acknowledge vs Pause | momentary fill vs persistent outlined toggle |
| Active vs Review dialogs | separate widgets — `AlarmMessagesDialog` and `ReviewAlarmsDialog` |
| INOP wiring | when input is technical (`ECG Leads Off`, `ABP Artifact`, `Batt Empty`), emit INOP severity → cyan/yellow/red INOP fill + `!` prefix |

