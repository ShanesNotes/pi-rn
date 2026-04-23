# Module 02 — Understanding Alarms (3-model synthesis)

Source: Philips IntelliVue training video #02, "Understanding Alarms" (`tTu9zgkdA0k`), 720p, 467s.
Independent passes: `passes/claude.md` (18 frames sampled every 6th), `passes/codex.md` (37 frames every 3rd), `passes/gemini.md` (37 frames every 3rd).

Consensus claims are stated bare. Single-source observations carry `[claude-only]` / `[codex-only]` / `[gemini-only]` provenance. 2-of-3 consensus carries `[2/3]` and the dissenting model is named.

---

## Alarm taxonomy — 6 tiers, NOT 3

The training video shows a **6-row severity ribbon** (codex frame 13 + gemini analysis), with two parallel hierarchies:

| Tier | Prefix | Color | Class | Example |
|---|---|---|---|---|
| 1 | `***` | red | physiological alarm | `*** Apnea`, `***xTachy 120>115` |
| 2 | `!!!` | red | INOP (technical) | `!!! ECG Leads Off` |
| 3 | `**`  | yellow | physiological alarm | `** Pulse Low`, `**ABPs 120>110` |
| 4 | `!!`  | yellow | INOP (technical) | `!! Batt Empty` |
| 5 | `*`   | yellow | physiological alarm (low priority) | `* Irregular HR`, `* HR 120>110` |
| 6 | (none) `!`[?] | cyan | INOP (technical, info) | `ABP Artifact` |

**My (claude) initial pass missed the alarm/INOP split entirely** — captured only the 3 physiological tiers. Codex + gemini both surfaced it; resolved against my pass.

---

## Banner architecture — two layers

Top-of-screen alarm region is rendered as **two independent stacked layers** [codex-only, validated by re-reading frames 19, 49, 97]:

1. **Inner pill** — rounded colored rectangle with text. Fill = priority color. Text = `[direction-arrow] [ack-mark] [prefix] [code] [value][>|<][limit]` e.g. `↑ * HR 120>115`, `✓ **ABPs 120>110`.
2. **Outer red outline** — thin full-width frame around the banner lane. Present when an active alarm is **un-acknowledged**, regardless of pill color. Disappears when acknowledged.

Acknowledgement signaled by `✓` prefix in the pill text **and** removal of outer outline. Both must update together.

Direction prefix: `↑` = value above high limit, `↓` = value below low limit. Persists after acknowledgement (becomes `↑✓`).

---

## Per-tile alarm visualisation

Alarmed `NumericPanel` tile transformations:

- **Background fill** swaps from black to priority color (yellow `#D9D919`[?] / red `#F12929`[?] / cyan for INOP).
- **Text color** flips to **black** for legibility on bright fill [claude-only — confirm in frames 25, 31, 49].
- **Blink animation** [codex-only, important] — yellow tile alternates between bright yellow `#D9D919` and dim olive `#727205` at ~1Hz. The earlier frames I labeled "different priority" were actually the same alarm captured at different blink phases.
- **Per-tile badge slot** at upper-left of every tile [codex-only, confirm in frames 7, 79, 103] — small white square with red crossed-bell icon when alarm is silenced for that channel. Always visible on `Pulse` (alarm-off by default) and on `RR` after silencing.
- **Selection outline**: red 2px rectangle around the tile when its setup dialog is open [consensus].

---

## State cues

- **Color** — primary signal (red > yellow > cyan).
- **Asterisk count vs exclamation count** — secondary signal. Use `*` for physiological, `!` for technical/INOP.
- **Direction arrow** `↑` / `↓` — shows breach direction.
- **`✓` mark** — acknowledged.
- **Crossed-bell icon** — alarm audio off for this channel.
- **`SV Rhythm` / `Learning Rhythm` / `xTachy`** — small gray annotation above ECG row, output of arrhythmia classifier.
- **`Auto` text in NBP row** — NBP cycle timing mode.
- **`DEMO` pill (centered, gray)** over waveform area when not connected to live patient. Distinct from a small **`DEMO` text** in the battery row [claude-only, frames 67, 73, 79].
- **Footer button states**:
  - `Acknowledge` = momentary filled state when pressed [codex-only].
  - `Pause Alarms` = persistent yellow outlined toggle [codex+claude consensus, gemini silent].
  - `Stop All` = grayed when alarms already paused [claude-only, from M1 prior knowledge].

---

## Modal/dialog inventory (alarm-related)

| Modal | Fields / structure |
|---|---|
| **Setup ECG / SpO2 / Resp / NBP / ABP** | Common pattern: title bar with module icon + `X`. Rows: `High Limit`, `Low Limit`, `Desat Limit` (SpO2 only), `Apnea Time` (Resp only, e.g. `20 sec`) [codex-only], `Alarms` On/Off, `Size Up`/`Size Down`, `Detection Auto` (Resp only) [codex-only], `Pulse (SpO2)`, `Label`, `Set Perf Ref.`. Yellow band on focused row. ▲▼ pagination. |
| **Limit edit spinner (overlay on Setup-X)** | Side panel anchored right of the value column. Vertical scroll list of numeric values (e.g. `92, 91, 90, 89, 88, 87`) with current row highlighted darker gray. Independent ▲▼ pagination. SpO2 tile in bedside gets red outline marking the parameter being edited [claude detail confirmed by codex]. |
| **Alarm Limits (summary)** | Multi-parameter overview. Rows: `HR`, `Show ST Limits`, `QTc`, `ΔQTc`, `SpO2`, `NBPs`, `ABPs`. Each row shows limit brackets + horizontal bar with marker for current value, OR `Off` [codex+gemini consensus]. |
| **Alarm Messages (active)** | Compact list of currently-active alarms with `✓` ack marks. Distinct dialog from Review Alarms [codex-only]. |
| **Review Alarms (history)** | Table: `[timestamp] | [event] | [duration]`. Sample rows: `19 Feb 10:30:40 AlarmsAcknowledged`, `19 Feb 10:30:36 **ABPs 120>110`, `19 Feb 10:29:58 * HR 120>110 4 min 58 sec`, `19 Feb 10:18:46 ABP Artifact 5 sec`, `19 Feb 10:17:51 ECG Leads Off 56 sec`. Right-side detail pane with yellow background showing selected event explanation, e.g. for `ECG Leads Off`: *"Not all required leads for ECG monitoring are attached. Check cable connections and ensure that all required leads are attached and connected. For ECG/Resp: RA, LA and LL are r... EASI requires all 5 electrodes. Source: Companion"* [claude-only on detail-pane content; modal existence is consensus]. |

**Modal surface color**: warm beige `#C6BFB5`[?] background (not the dark gray I assumed) [codex-only]. Yellow band for focused row, gray for selected list-item.

---

## Footer toolbar — page-contextual

Two distinct button sets observed:

**Default monitor page**: `Acknowledge | Pause Alarms (yellow) | « | Start/Stop | Stop All | Zero | Recordings | Vitals Trend | Patient Demogr. | Monitor Standby | » | Main Setup | Main Screen | [battery] [DEMO]`.

**Alarms page** (Review Alarms / Active Alarms / Limits view): `Acknowledge | Pause Alarms (yellow) | Alarm Limits | Active Alarms | PauseAl. 5 min | PauseAl. 10 min | Print | Main Setup | Main Screen` plus codex saw `Alarm Volume`, `Delayed Record` here.

Implication: footer is page-contextual — `MainWindow.set_page(page_id)` reconfigures the toolbar button list.

---

## Implications for `monitor-ui/` (PySide6)

| Pattern | Hint |
|---|---|
| Alarm priority enum | `class Severity(Enum): RED, YELLOW_HIGH, YELLOW_LOW, INOP_RED, INOP_YELLOW, INOP_CYAN` — 6-way, drives color + prefix character (`*` vs `!`) |
| Two-layer banner | `BannerLayer` (pill widget) + `OutlineLayer` (full-width red `QFrame` border). Toggle independently: pill always reflects current alarm; outline only when un-acknowledged |
| Pill text composition | format string: `{direction_arrow}{ack_mark} {prefix} {code} {value}{op}{limit}` e.g. `↑✓ **ABPs 120>110` |
| Per-tile alarm fill | extend `NumericPanel` with `set_alarm(severity)` → swap QSS class; text color → black on bright fills |
| Tile blink animation | `QPropertyAnimation` on background-color, alternating bright ↔ dim variants of severity color at 1 Hz. ONE animator per tile, started on alarm-on, stopped on alarm-off |
| Per-tile badge slot | reserved upper-left region in `NumericPanel`, holds `QIcon` for alarm-off / signal-loss / lead-off etc. |
| Modal surface | reusable `IntelliVueModal` base — beige `#C6BFB5` background, dark title bar with module icon + close X, scroll bar, ▲▼ pager, yellow row highlight |
| Limit-edit spinner | `LimitSpinnerOverlay` widget that pops out beside a focused row in `IntelliVueModal`; SpO2 tile in bedside auto-gets red outline while open |
| Alarm Limits summary widget | custom `QWidget` per row: label + low-bracket + horizontal limit bar with current-value marker + high-bracket. `QPainter` for the bar/marker |
| Active vs Historical alarms | `AlarmMessagesDialog` (compact, current state) and `ReviewAlarmsDialog` (table, full history with detail pane) — separate widgets, separate footer |
| Page-contextual footer | `MainWindow.set_page(page_id)` reconfigures `QToolBar` button list |
| Acknowledge vs Pause Alarms button states | momentary fill-on-click vs persistent outlined-toggle |
| `SV Rhythm` / `Learning Rhythm` annotation | floating `QLabel` above ECG channel, bound to arrhythmia classifier output |
| INOP routing | when input is "ECG Leads Off" or "ABP Artifact", emit INOP severity; tile gets cyan or red INOP fill, banner pill uses `!`/`!!`/`!!!` prefix |

---

## Disagreements + resolutions

- **Alarm priority count**: claude said 3 (alarm only). Codex + gemini said 6 (alarm + INOP). **Resolved 6-tier** by re-reading codex's frame 13 ribbon image — explicit ribbon legend confirms.
- **Modal surface color**: claude said dark gray. Codex said beige `#C6BFB5`. Gemini silent. **Resolved beige** by re-reading frame 85 — modal panel fill is clearly warm tan, not neutral gray.
- **Yellow tile color blink**: claude said two different priorities (bright vs dim). Codex said one alarm at two animation phases. **Resolved blink-phase** — frames 25/31/37/43 all show same `**ABPs 120>110` alarm with the tile alternating between bright/dim, never a separate priority transition.

---

## Frames cited (union of all 3 passes)

m02_001, m02_004, m02_007, m02_010, m02_013, m02_016, m02_019, m02_022, m02_025, m02_028, m02_031, m02_034, m02_037, m02_040, m02_043, m02_046, m02_049, m02_052, m02_055, m02_058, m02_061, m02_064, m02_067, m02_070, m02_073, m02_076, m02_079, m02_082, m02_085, m02_088, m02_091, m02_094, m02_097, m02_100, m02_103, m02_106, m02_108
