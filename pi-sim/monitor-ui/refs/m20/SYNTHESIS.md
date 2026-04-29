> **Status: HISTORICAL VISUAL REFERENCE ONLY.**
> These notes describe the old in-repo PySide `monitor-ui` visual research. Current display implementation authority lives in sibling `../pi-monitor`; current `pi-sim` architecture authority is ADR 003. Do not treat PySide-specific implementation hints here as current direction.

---

# Module 20 — Acknowledge / Adjust / Pause Alarms (3-model synthesis)

Source: Philips IntelliVue training video #20, "Acknowledge, adjust and pause alarms at the bedside" (`6KnZfIxokzk`), 720p, 182s.
Independent passes: `passes/claude.md` (13 frames sampled), `passes/codex.md` (21 frames, full set), `passes/gemini.md` (12 frames sampled).

**Caveat — title is misleading.** All 3 models agree this video is primarily a *taxonomy* explainer (alarm classes, INOP types, yellow sub-types) rather than an action workflow. Despite the title, no `Acknowledge` press, no pause-countdown, no limit-adjust dialog appears in any of the 21 frames. The action UI must be inferred from M02 + future modules.

---

## Three-slot top-bar banner zone

**Consensus, all 3 models.** Top of screen reserves three fixed positions for parallel alarm pills:

| Slot | Position | Color | Class | Example |
|---|---|---|---|---|
| 1 | left | cyan `~#28DDD8` | INOP (technical) | `Some ECG AlarmsOff`, `Unsupported LAN` |
| 2 | center | yellow `~#F8EF1F` | patient yellow | `**RR High 24>20` |
| 3 | right | red `~#EF1414` | patient red | `*** xBrady 100<105` |

All three can render simultaneously. Each is independent — the renderer must NOT collapse multiple alarms into a single stacked pill.

Hex estimates [codex-only]. Approximate; verify against actual Philips palette if pixel-accurate fidelity matters.

---

## Two-layer banner — confirmed cross-module

**Consensus claude+codex** (codex frame `m20_006`): in addition to the three pills, the entire alarm lane can carry a **separate full-width amber/red outline** independent of the pills themselves. Codex measured the outline as amber `~#EBA322` in m20_006; M02 had it as red. May be a different color per priority of the dominant alarm.

This validates the M02 finding: pills + outline are independent compositional layers.

---

## Bright/olive yellow blink — confirmed cross-module

**Codex-only confirmation, second module.** Same yellow `**RR High 24>20` pill renders at bright yellow in earlier frames and darker olive `~#8B8C1A` in later frames. Same alarm, same priority, just different animation phase.

This is the **second independent observation** (after M02) that yellow alarm visuals **blink between bright/dim** at ~1Hz. Treat as confirmed pattern, not artifact.

---

## Yellow patient-alarm sub-types

**Claude-only from training overlays** (frames 11, 13, 14):

- `**` long yellow alarm = **alarm limit violations** (sustained, e.g., `Resp high/low`). Audible.
- `*` short yellow alarm = **arrhythmia-related patient conditions** (transient events). Audible.

Both have audio (red speaker icons in both training cards). The "long/short" naming refers to **alarm duration class**, not audio differences. Drives downstream routing semantics (logging, ack-on-clear behavior), not visual treatment.

---

## INOP sub-types: Hard vs Soft + 3-tier severity

**Consensus claude+codex+gemini.** Two orthogonal classifications within INOPs:

**By audibility** (claude+codex from training overlays, frames 16, 17, 19, 20):
- **Hard INOP** = banner + speaker icon (audible).
- **Soft INOP** = banner only (silent, visual only).

**By severity** (claude+gemini+codex consensus from training overlays):
- `!!!` red INOP — pill `~#EF1414`.
- `!!` yellow INOP — pill `~#F8EF1F`. Factory default for "ECG leads off" [gemini].
- (no prefix) cyan INOP — pill `~#28DDD8`. Network/connectivity issues like `Unsupported LAN`.

Encode as:
- `Severity` enum: 6-way as defined in M02 SYNTHESIS.
- `audible: bool` field on alarm event — distinguishes Hard vs Soft INOP. Patient alarms are always audible.

---

## Per-tile alarm visualisation

**Consensus, all 3 models.**

- Alarmed `NumericPanel` tile = priority-color background, dark text on bright fill.
- Frame 7 / 21: SpO2 yellow tile (`88`), RR yellow tile (`24`). Other tiles unalarmed (HR green, ABP red — note ABP red is normal channel color, NOT alarm-fill red).
- Critical: distinguish "channel is red because palette is red" (ABP) from "tile is red because alarm-active" (red fill ≠ palette red).

**Per-tile crossed-bell badge** (codex+claude consensus):
- Small white square with red crossed-speaker icon at upper-left of value area.
- Visible on `Pulse` tile in nearly all bedside frames — Pulse alarm is off by default in this configuration.
- Reserve this slot in `NumericPanel` even on tiles that never use it.

---

## Visual silence indicator

**Gemini-only** (frame `m20_007`): a **red X over a speaker icon** appears next to the `*** xBrady` red banner pill, indicating audible alarm for that specific parameter has been silenced. Distinct from the per-tile crossed-bell badge — this one is in the **banner area**, not on the numeric tile.

Implementation: banner pill widget needs an optional inline silence indicator badge (right of pill text), separate from the per-tile badge.

---

## Banner pill secondary indicator [?]

**Claude-only [unresolved]** (frames 10, 11, 13, 14): a small red rectangle visible at the right edge of the yellow `**RR High` pill, inside the rounded corner. Possible interpretations:
- Queue-depth indicator (more alarms in this slot waiting)
- Delayed-record cue
- Severity-priority sub-mark

Codex did not surface this. Gemini did not surface this. Mark for re-examination in M26 frames where the full toolbar may be visible at higher resolution.

---

## What's missing from this module (explicit gaps)

**Codex+claude both call out**: no acknowledge action, no pause countdown, no adjust dialog visible in any frame. This module is taxonomy-only.

To close these gaps:
- Acknowledge UX → M02 frames 55, 61, 97 captured `↑✓` and `✓` prefixes; M02 SYNTHESIS already documents.
- Pause countdown → seen in M3 (`Al. Paused 0:29` red status pill upper-right) — already in patterns.md.
- Limit adjust → M02 SYNTHESIS captured Setup-X dialogs with spinner overlays.

So the M20 ingest is complementary to M02, not a replacement for it.

---

## Implications for `monitor-ui/` (delta to existing)

| Pattern | Hint |
|---|---|
| **3-slot banner zone** (new) | Top-bar `QHBoxLayout` with 3 fixed positions: `inop_slot` (left, cyan) / `yellow_slot` (center) / `red_slot` (right). Each slot holds zero or one `BannerPill`. Multiple alarms within a class queue inside the slot |
| **Hard vs Soft INOP** (new) | `audible: bool` field on alarm event; Hard INOP triggers audio dispatch, Soft INOP banner only |
| **Long vs Short yellow** (semantic) | Routing-level distinction (ack-on-clear behavior, logging detail), no visual difference. Could be a `subtype: Literal['limit', 'arrhythmia']` field |
| **Banner silence badge** | Optional inline red-X-over-speaker badge in `BannerPill`, distinct from per-tile crossed-bell |
| **Two-layer outline** (cross-module confirmed) | Full-lane outline `QFrame` border, color matches dominant-alarm priority (red for ***/!!!, amber for **/!!), independently toggleable from pills |
| **Yellow blink animation** (cross-module confirmed) | `QPropertyAnimation` on tile + pill background, alternating bright `~#F8EF1F` ↔ olive `~#8B8C1A` at 1Hz |

---

## Disagreements + resolutions

- **`Some ECG AlarmsOff` color**: claude+codex+gemini all said cyan. No disagreement. (Note: this is INOP-cyan, not patient-yellow.)
- **Olive yellow tile interpretation**: codex framed as blink phase. Claude in m02 SYNTHESIS already resolved as blink phase. Consensus stands.
- **Action workflow visibility**: no disagreement — all 3 said no action UI visible. Resolved as explicit gap.

---

## Frames cited (union of all 3 passes)

m20_001 through m20_021 (full set, codex). Subset by claude (13) and gemini (12).
