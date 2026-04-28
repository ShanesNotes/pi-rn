> **Status: HISTORICAL VISUAL REFERENCE ONLY.**
> These notes describe the old in-repo PySide `monitor-ui` visual research. Current display implementation authority lives in sibling `../pi-monitor`; current `pi-sim` architecture authority is ADR 003. Do not treat PySide-specific implementation hints here as current direction.

---

# Module 10 — QRS Morphology and Lead Selection (3-model synthesis)

Source: Philips IntelliVue training video #10 (`XzDNhomB4nU`), 720p, 183s.
Independent passes: `passes/claude.md` (8 frames), `passes/codex.md` (16 frames), `passes/gemini.md` (10 frames).

This module is the **canonical reference for the waveform widget** — Phase 2 of monitor-ui implementation. Read this when building `WaveformWidget`.

---

## ECG row anatomy (consensus, all 3 models)

```
[lead label]    ←── e.g. "II" / "V" / "III", green channel color, top-left of row
M               ←── mode marker below label (likely "Monitoring" filter)

[1mV cal mark]  ←── small vertical bar near left quarter of trace, just after the
                    first complex. Standard ECG amplitude reference. Always present.

   ╱╲    ╱╲    ╱╲    ╱╲    ╱╲   ←── scrolling sweep trace, bright green
```

- **Lead label color**: green. Codex hex `~#43FF02`; gemini hex `#00FF00`. Use the channel-palette green chosen for ECG; either is close enough for a first draft.
- **Mode marker `M`**: small green text below label. Hardcode for now; semantic = filter mode (Monitoring vs Diagnostic vs ST).
- **1mV calibration mark**: vertical white-ish bar with text `1mV` adjacent. Position fixed at start-of-trace, not scrolling.
- **`Sinus Rhythm`** label (or other classification) pinned upper-right of ECG channel.

Two ECG rows shown: primary (top) and secondary (second). Lead change to top row updates only the top row, secondary stays. Confirms primary/secondary slot architecture.

---

## Sweep direction — DISAGREEMENT to resolve

| Model | Claim |
|---|---|
| Claude | unspecified |
| Gemini | left-to-right |
| Codex | "newest complexes at right edge, implies right-to-left motion" `[?]` |

**Resolution by re-reading frames**: IntelliVue real-world hardware supports two modes:
- **Erase-bar mode** (classic, "Static Waves"): trace draws left-to-right; an erase bar moves left-to-right erasing old data ahead of the new draw. Effectively newest at the position just-passed by the cursor.
- **Scrolling mode** (newer, "Dynamic Waves"): entire trace scrolls right-to-left; newest always at right edge.

The info bar in this module shows `Dynamic Waves*` — implies **scrolling mode is active**, which matches codex's observation. Gemini's "left-to-right" likely describes what they expected, not what they saw.

**Recommendation**: implement BOTH modes, default to erase-bar (hardware default), allow profile switch to scrolling. The `*` suffix on `Dynamic Waves` may indicate a non-default profile.

---

## ST analysis column (consensus M03 + M10)

8-row column between ECG and Pleth. All cells `0.0` in this demo. Rows in observed order:
- ST-I, ST-II, ST-III (top group)
- ST-aVR, ST-aVL, ST-aVF (middle group)
- ST-V, ST-MCL (bottom group)

Color matches ECG channel (green). Monospace label/value rows.

---

## Lead-row context menu (cross-module consensus M03 + M10)

**Trigger**: tap on the ECG row body or lead label.

**Modal**: centered-left over the waveform area. Title bar = lead name (e.g. `II`), connector/lead icon top-left, close `X` top-right. **Beige surface `~#D6D2C7`** (codex confirms M02 modal-surface finding).

**Items** (cross-module union):
- `Freeze Wave`
- `Primary Lead : <current>` — opens nested side picker
- `Secondary Lead : <current>` — M03 only
- `New Lead Setup`
- `Auto Size`
- `Size Up ↑`
- `Size Down ↓`
- `Annotate Arrhy` — M03 only

▲▼ pager chevrons at bottom for additional items.

---

## Nested side picker (cross-module consensus)

**Confirmed pattern from M02 SpO2 spinner + M10 lead picker**: when a row in the main modal needs an enumerated value, a **narrow beige side panel** opens attached to the right edge of the parent modal. Vertical scroll list with current row highlighted darker gray. Independent ▲▼ pager.

**Lead picker entries observed**: `I`, `II`, `III`, `aVR`, `aVL`, … (additional entries hidden under hand-pointer overlay).

**Implication**: build one reusable `IntelliVueSidePicker` widget for limit values, lead names, profile names, etc.

---

## Selection visualisation

**Consensus claude+gemini+codex**: selected waveform row gets a **purple outline/glow** around the row.

- Gemini hex: `~#8A2BE2`
- Codex hex: `~#9F66D1` to `~#A769D6` (lighter, with darker edge `#6D4991`)

The two hex ranges differ — likely a glow gradient from outer edge inward. Use a `QGraphicsDropShadowEffect` with the lighter purple as the glow color and darker edge as the inner border.

**Multi-lead vs single-lead analysis** (codex+claude): purple-row-highlight cardinality conveys mode. Both rows glow = `Multi-lead analysis mode` (algorithm uses both for HR + arrhythmia detection). Single row glows = `Single-lead analysis` (used when only one lead has clean signal).

---

## Touch-screen interaction model (codex+claude consensus)

Purple hand-pointer overlay throughout the module demonstrates tap interaction. UI is touch-first; mouse is secondary. Implementation must handle `touchTap` events, ensure 44pt minimum touch targets.

---

## Arrhythmia annotations on the trace

**Consensus claude+codex from explainer cards** (frames 7, 10):

- **Paced pulse**: small **double-bar `‖‖` glyph** rendered inline at the position of a pacer spike. Distinct from the QRS itself. Color: green or default trace color [?].
- **Ectopic beat / PAC**: when the arrhythmia detector classifies a beat, a faint **lavender translucent rectangle** overlays the QRS region with a label `Ectopic beat` and subtype `Premature Atrial Contraction (PAC)` below.

Other arrhythmia subtypes implied (not all shown): PVC, VT, VF, asystole, etc.

---

## Footer toolbar variant (claude-only frame 19)

`Acknowledge | « | Start/Stop NBP | Stop All NBP | Zero | Vitals Trend | Quick Admit | Patient Demogr. | Monitor Standby | » | Main Setup | Main Screen | [battery]`

New observations:
- **`Quick Admit`** button — fast-path admit dialog (subset of full Patient Demographics).
- **`Start/Stop NBP`** / **`Stop All NBP`** — confirms M02's bare `Start/Stop` was specifically the NBP cycle control.

---

## Color palette (codex hex estimates)

| Channel | Hex |
|---|---|
| ECG / HR | green `~#43FF02` (codex) or `#00FF00` (gemini) |
| Pleth / SpO2 | cyan `~#71D0D6` to `~#5DF6FC` |
| ABP | red `~#EF1414` (M20) |
| Resp / RR | pale yellow `~#E8ED9D` to `~#FAFF6A` |
| ECG black bg | `~#010000` |
| Modal surface | beige `~#D6D2C7` (M02 + M10 consensus) |
| Selection glow | purple `~#9F66D1` to `~#A769D6` outer, `~#6D4991` edge |
| Main Setup / Main Screen tile | blue `~#2555D1` |
| Yellow alarm | `~#F8EF1F`, blink-dim `~#8B8C1A` |
| Cyan INOP | `~#28DDD8` |
| Red alarm | `~#EF1414` |
| Amber lane outline | `~#EBA322` (M20) |

These are **estimates from JPEG frames** — slight shift from real Philips palette likely. Use as starting point; tune from actual hardware photos if available.

---

## Implications for `monitor-ui/` (Phase 2 — waveform widget)

| Pattern | Hint |
|---|---|
| `WaveformWidget` ECG row | left-stacked lead label + mode marker, fixed `1mV` calibration bar at row start, scrolling trace area, `Sinus Rhythm` label slot top-right |
| Two-mode sweep | support **erase-bar** (default) and **scrolling** (`Dynamic Waves`) modes; switchable via profile setting; mark profile change with `*` suffix in info bar |
| Dual ECG row architecture | primary (top) and secondary (second) rows are independently configured; lead change updates only one |
| `STAnalysisWidget` | 8-row column between ECG and Pleth, configurable per-lead, monospace label/value, channel-color (green) |
| Lead context menu | `WaveformContextMenu`: tap row → centered-left `IntelliVueModal` (beige `~#D6D2C7`); items: Freeze Wave / Primary Lead {current} / Secondary Lead {current} / New Lead Setup / Auto Size / Size Up / Size Down / Annotate Arrhy |
| `IntelliVueSidePicker` | reusable side panel widget for enumerated value selection (leads, limits, profiles), narrow beige, attached to right edge of parent modal |
| Selection halo | `QGraphicsDropShadowEffect` purple `~#A769D6` outer + `#6D4991` edge; toggle on `set_selected(True)` |
| Single vs multi-lead mode | independent of selection — drives HR/arrhythmia analysis algorithm choice; render via row-glow cardinality |
| Touch interaction | wire `QGestureRecognizer` for tap; 44pt min touch targets; `mousePressEvent` and touch both work |
| Paced-pulse marker | small `‖‖` glyph at beat position when input includes `paced=True` flag |
| Arrhythmia overlay | translucent lavender rectangle over QRS region for PAC/PVC events; floating event-label tag below |
| `RhythmLabel` | upper-right of ECG channel; bind to classifier output: SV Rhythm / Sinus Rhythm / Learning Rhythm / xTachy / xBrady / Ectopic / etc. |
| `Quick Admit` footer button | fast-path admit dialog (subset of Patient Demographics) |
| Footer NBP button labels | rename `Start/Stop` → `Start/Stop NBP`; `Stop All` → `Stop All NBP` for clarity |
| `Dynamic Waves*` indicator | `*` suffix when sweep mode (or layout) deviates from saved profile |

---

## Disagreements + resolutions

- **Sweep direction**: gemini said L→R, codex said R→L `[?]`, claude unspecified. **Resolved as two-mode**: implement both (erase-bar default, scrolling for `Dynamic Waves`). The `*` suffix on `Dynamic Waves*` indicator suggests scrolling mode was active in this video.
- **Selection glow color**: gemini `#8A2BE2` vs codex `#9F66D1`–`#A769D6`. **Resolved as glow gradient** (light outer, darker edge) rather than single solid color. Implementation: `QGraphicsDropShadowEffect` with the lighter shade as glow color.
- **Modal surface color**: 3rd cross-module confirmation (M02 said beige `#C6BFB5`, M10 codex says `#D6D2C7`). Slight variance is JPEG quantization — call it `~#D0CCC0` for consistency.
- **Green hex precision**: gemini `#00FF00` (idealized) vs codex `#43FF02` (measured). Use either as starting point; the channel-palette green is the truth, not a frame measurement.

---

## Frames cited (union of all 3 passes)

m10_001, m10_004, m10_007, m10_009, m10_010, m10_012, m10_013, m10_014, m10_015, m10_016, m10_017, m10_018, m10_019, m10_020, m10_021, m10_022
