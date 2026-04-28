## Recommendation

Build **`pi-monitor` as a standalone, display-only native/hybrid monitor app**, not as a normal pi-chart web page and not as part of the EHR/charting workflow. The updated prompt explicitly lifts the “web browser application” constraint and requires public Pulse output only, no pi-agent coupling, no hidden pi-sim imports, and a live display path separate from any future EHR adapter. 

My preferred production architecture is:

**Rust/native telemetry + renderer-agnostic monitor core + kiosk-style monitor UI.**

For M1, the pragmatic implementation is a **Tauri-style native shell** or equivalent native desktop shell: Rust owns file watching, validation, freshness, and process/window lifecycle; the UI can still use HTML/CSS/Canvas inside the shell for fast monitor rendering. That gives you a standalone app with no external browser, no Node bridge, no HTTP server by default, and still preserves the excellent Canvas/DOM testability from the original web idea. The original report’s browser/SSE proposal is still valuable as a fallback/debug transport, but it should no longer be the default architecture once the monitor is allowed to be a standalone subsystem. 

**Do not build** a Unity, Unreal, Qt fork, browser-only route, or EHR-adjacent “vitals” page. Those are either too coupled, too heavy, too action-oriented, or too easy to confuse with chart truth.

---

## Ranked architecture options

|  Rank | Option                                                                                                                                 | Verdict                                                                                                                                                                                                                                                                                                                                                                                  |
| ----: | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Standalone native/hybrid `pi-monitor` app**: Rust file watcher + pure monitor core + kiosk UI using Canvas/WebView or native drawing | **Best balance.** No browser dependency, no network server by default, production kiosk feel, easy launch from pi-chart, clean display-only boundary.                                                                                                                                                                                                                                    |
| **2** | **Pure native renderer**: Rust + egui/Slint/wgpu/Skia-style renderer                                                                   | Cleanest “not web” answer, excellent performance, but more work for exact layout, fonts, screenshot tests, and rapid UI iteration. Good M2 hardening target.                                                                                                                                                                                                                             |
| **3** | **Embedded web/SSE module**                                                                                                            | Good prototype and remote-view fallback. Not best default after the constraint lift because it adds an HTTP surface and keeps the monitor mentally inside the chart app.                                                                                                                                                                                                                 |
| **4** | **Electron/React**                                                                                                                     | Works, but heavier than necessary. Use only if the existing pi-chart app is already Electron.                                                                                                                                                                                                                                                                                            |
| **5** | **Qt/C++ port inspired by Pulse Explorer**                                                                                             | Visually tempting but wrong strategically. Pulse Explorer is a Qt app and source exists, but its UI includes scenario/actions/control affordances that pi-monitor must not inherit. Kitware describes Explorer as a Qt visualization tool with binaries/source, and the 3.0 release added simulator/control-oriented features such as ventilator UI and arrhythmia actions. ([Pulse][1]) |
| **6** | **Unity or Unreal monitor**                                                                                                            | Do not use unless pi-chart itself becomes an immersive simulator. The Unity and Unreal examples are valuable pattern references, not application foundations. Unity’s monitor uses `PulseEngineDriver`, `PulseDataLineRenderer`, and `PulseDataNumberRenderer`; Unreal exposes Pulse through an Actor Component and Blueprint example project. ([Kitware][2])                            |
| **7** | **TUI**                                                                                                                                | Useful only as a diagnostic `pi-monitor-cli watch current.json`. It cannot deliver bedside-monitor feel.                                                                                                                                                                                                                                                                                 |

---

## Target architecture from scratch

### 1. Public schema package

Create a small shared package, for example **`pulse-public-frame`**, that defines only the public `current.json` contract. Both pi-monitor and a later EHR adapter may depend on this package, but **pi-monitor must never depend on the EHR adapter**.

Recommended frame shape:

```json
{
  "schemaVersion": 1,
  "source": "pi-sim/pulse",
  "sequence": 12345,
  "runState": "running",
  "simTime_s": 842.04,
  "vitals": {
    "HeartRate": { "value": 73.2, "unit": "1/min" },
    "SystolicArterialPressure": { "value": 114, "unit": "mmHg" },
    "DiastolicArterialPressure": { "value": 73, "unit": "mmHg" },
    "MeanArterialPressure": { "value": 94, "unit": "mmHg" },
    "PulseOximetry": { "value": 0.97, "unit": "unitless" },
    "RespirationRate": { "value": 15.2, "unit": "1/min" },
    "CoreTemperature": { "value": 37.0, "unit": "degC" },
    "EndTidalCarbonDioxidePressure": { "value": 36, "unit": "mmHg" }
  },
  "events": ["Tachycardia"],
  "heartRhythm": "NormalSinus",
  "waveforms": {
    "ArterialPressure": {
      "unit": "mmHg",
      "sampleRate_Hz": 50,
      "t0_s": 841.80,
      "values": [113.2, 116.4, 119.1]
    }
  }
}
```

Pulse’s own scenario-file documentation names a “Vitals Monitor” scenario and requests HeartRate, ArterialPressure, Mean/Systolic/Diastolic pressure, OxygenSaturation, EndTidal CO₂ fraction, RespirationRate, and SkinTemperature; use that as the compatibility baseline, but prefer CoreTemperature and PulseOximetry where pi-sim can expose them. ([Pulse][3])

### 2. Telemetry ingest layer

Implement a native **read-only file ingest** layer:

`pi-sim/vitals/current.json → monitor-ingest → validated frame stream`

The ingest layer should:

* Watch `current.json` with native filesystem notifications, plus a low-frequency poll fallback.
* Open the file read-only.
* Debounce writes by 50–150 ms to avoid reading partial JSON.
* Treat parse failure as “invalid frame candidate,” not immediate failure, because file replacement can race.
* Prefer atomic pi-sim writes: `current.tmp` then rename to `current.json`.
* Stamp each accepted frame with **local monotonic receipt time**, not wall time.
* Detect sequence gaps and sim-time regressions.
* Keep the last valid frame available while marking the current source stale/invalid/offline.

No Node bridge is needed for the default local monitor. If a remote monitor view becomes necessary later, expose an optional read-only SSE/WebSocket adapter from the same core, bound to localhost by default.

### 3. Monitor core

The monitor core is a pure deterministic state machine:

`validated public frame + local monotonic time → display model`

It owns:

* Unit conversion.
* Numeric precision.
* Fresh/stale/offline/invalid state.
* Alarm prioritization.
* HR tick scheduling.
* Waveform ring buffers.
* Renderer-independent layout model.
* “No chart truth” guardrails.

Keep this core UI-framework-free. The same core should drive the native/hybrid UI, screenshot tests, fixture replay, and the debug CLI.

### 4. Presentation layer

The production UI should feel like a bedside monitor, but it must not look like the charting UI.

Recommended M1 layout:

* Left: waveform area, even if some strips say **“waveform feed unavailable”**.
* Right: numeric stack for HR, BP/MAP, SpO₂, EtCO₂, RR, Temp.
* Top: **LIVE SIM MONITOR**, source, connection state, sim time.
* Alarm row: active Pulse events/rhythm chips.
* Footer: **“Live simulation display · not charted · not part of the medical record.”**

Do not put the monitor inside normal chart tabs named “Vitals.” Launch it as **Monitor**, **Live Sim Monitor**, or **Bedside Monitor**.

### 5. Optional future EHR adapter

The later EHR adapter should be a separate process:

`current.json → ehr-vitals-adapter → vitals.jsonl`

It may share the public schema and unit-conversion library, but it must not import the monitor UI, renderer, or state machine. The display path must keep working when the persistence path is absent or broken.

---

## Pulse UI sources and what to borrow

| Pulse source                        | Source link to inspect                                                                                                                    | Stack                                          | Reuse posture                                                                                                              | What matters                                                                                                                                                                                                                                                           |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pulse Explorer**                  | `https://gitlab.kitware.com/physiology/explorer` and Kitware’s Pulse Explorer 3.0 post                                                    | C++ / Qt                                       | Borrow visual hierarchy only. Do not port Qt code or controls.                                                             | Explorer is the canonical dark bedside visual: waveforms left, numerics right, high-contrast vitals. The 3.0 release notes confirm open-source Explorer, binaries/source, vitals monitor look/feel improvements, ventilator UI, and arrhythmia actions. ([Kitware][4]) |
| **Pulse Unity Asset VitalsMonitor** | `https://gitlab.kitware.com/physiology/unity` and Unity Asset blog                                                                        | Unity / C# / native Pulse plugin               | Borrow architecture pattern: driver + line renderers + number renderers. Do not copy action controls or Unity plugin code. | Kitware says the Unity asset auto-advances simulation time, retrieves sim time/ECG/HR/BP/SpO₂/EtCO₂/RR/temp/airway CO₂/blood volume, and displays graph/number data via reusable components. ([Kitware][2])                                                            |
| **Pulse Unreal Plugin**             | `https://gitlab.kitware.com/physiology/unreal` and Kitware Unreal post                                                                    | Unreal C++ / Actor Component / Blueprint / UMG | Borrow confirmation of channel grouping and game-loop integration. Do not copy Blueprint/UMG.                              | Kitware says the plugin is Apache 2.0, built for UE 4.26/5.0, exposes Pulse through an Actor Component, and includes an example project with a vitals monitor. ([Kitware][5])                                                                                          |
| **Pulse validation/plotting tools** | `https://pulse.kitware.com/version.html`, engine tooling                                                                                  | Python / CSV plotting / validation reports     | Use for fixtures, generated plots, and regression expectations; not runtime UI.                                            | Pulse 4.3 notes mention Python validation tooling and the ability to create vitals-monitor and ventilator-monitor plots from CSV files. ([Pulse][6])                                                                                                                   |
| **Scenario + CDM docs**             | `https://pulse.kitware.com/_scenario_file.html`, `https://pulse.kitware.com/_c_d_m_tables.html`, `https://pulse.kitware.com/modules.html` | Doxygen/CDM docs                               | Treat as the wire-contract authority.                                                                                      | The scenario docs define the canonical vitals-monitor requests, CDM tables define events and heart rhythms, and modules distinguish PulseOximetry from OxygenSaturation. ([Pulse][3])                                                                                  |

---

## Pulse concepts to borrow

Borrow these:

1. **Explorer visual hierarchy**: dark background, waveforms left, numeric vitals right, grouped BP/MAP, unmistakable monitor typography.
2. **Unity component model**: one driver, reusable line renderer, reusable numeric renderer. In pi-monitor terms: `ingest driver`, `waveform renderer`, `numeric tile renderer`.
3. **Pulse event/rhythm authority**: alarms should come from Pulse events and `HeartRhythm`, not from pi-chart hard-coded thresholds. Pulse’s CDM event table includes Bradycardia, Tachycardia, Hypoxia, Hypercapnia, Hypothermia, Hyperthermia, shock states, ventilator alarms, and more; heart rhythm is a separate enum with NormalSinus, Asystole, ventricular fibrillation/tachycardia variants, and PEA. ([Pulse][7])
4. **Exact Pulse property names and units**: keep Pulse-native names on the wire, convert only for display.
5. **Engine cadence awareness**: Pulse runs at a fixed 0.02 s / 50 Hz transient timestep, so waveform batches should preserve 50 Hz when pi-sim provides them. ([Pulse][8])

Do not borrow these:

* Explorer scenario authoring, action dialogs, ventilator controls, or arrhythmia controls.
* Unity `PulseActionOnClick`, Unity `Plugins/`, Editor tooling, or Asset Store package code.
* Unreal Blueprint/UMG implementation.
* Any control that mutates Pulse.
* Any “save,” “commit,” “chart,” or “capture vital” affordance.
* Any synthetic waveform that could be mistaken for engine output.

---

## Milestone 1

M1 should be numeric-first and brutally reliable.

Required:

* Standalone `pi-monitor` app or launchable module.
* Public `current.json` reader only.
* Schema validation.
* Sim-time clock in `HH:MM:SS`.
* Numeric tiles:

  * HR
  * BP sys/dia with MAP
  * SpO₂
  * RR
  * Temp
  * EtCO₂ if present
* Alarm/rhythm row from frame-provided Pulse events and heart rhythm.
* Connection states: fresh, stale, offline, invalid.
* HR tick visual.
* “Live simulation display · not chart truth” header/footer.
* Fixture replay mode.
* CLI debug watcher.

M1 should not require waveforms. A numeric-only monitor with honest “waveform feed unavailable” panels is better than fake ECG/pleth/capnogram.

---

## Deferred to M2+

* ECG waveform from `Lead3ElectricPotential`.
* ABP waveform from instantaneous `ArterialPressure`.
* Capnogram from airway/carinal CO₂ partial pressure samples.
* Multi-strip waveform renderer with sweep mode.
* Optional remote monitor transport.
* Audible alarms.
* Multi-patient wall view.
* Trends/playback.
* Native-renderer replacement if the WebView shell becomes a liability.
* User-configurable alarm thresholds.

Pulse’s own cardiovascular methodology explains that ECG output is a waveform representation for supported rhythms rather than a detailed electrophysiology model, so treat it as simulation output, not clinical signal truth. ([Pulse][9])

---

## Handling key edge cases

### Sim time vs wall time

Display sim time as **simulation time**, not wall clock. Pulse’s engine interface exposes `GetSimulationTime(unit)` as the current simulation time, and `AdvanceModelTime` advances the engine at its fixed timestep. ([Pulse][10])

Recommended UI:

```text
SIM 00:14:02     received 14:23:18 local     source pi-sim
```

Freshness must use local monotonic receipt time, not sim time. A paused simulation can have fresh telemetry with unchanged sim time; that should show **PAUSED**, not **STALE**, if pi-sim exposes `runState`.

### Fresh / stale / offline / invalid

Use these states:

| State             | Rule                                                                 | UI behavior                                                                             |
| ----------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Fresh**         | Last valid frame received < 2 s ago                                  | Normal display                                                                          |
| **Stale**         | 2–10 s since valid frame                                             | Dim values, show STALE, freeze waveforms                                                |
| **Offline**       | >10 s, file missing, ingest stopped, or source unreachable           | Replace values with `---`, show NO SIGNAL                                               |
| **Invalid frame** | JSON parse/schema/unit/NaN problem                                   | Keep last valid values but flag invalid fields; after grace period, mark source invalid |
| **Paused**        | Explicit `runState=paused` or heartbeat with stable sequence/simTime | Freeze values, show PAUSED, not stale                                                   |

### Alarms

Do not compute clinical alarms in pi-monitor unless pi-sim does not provide events. Pulse’s event table already defines physiologic and equipment events, and heart rhythm is a separate enum. ([Pulse][7])

Use a small severity map:

* **Critical red**: CardiacArrest, Asystole, ventricular fibrillation, pulseless VT, HypovolemicShock, CardiogenicShock, CriticalBrainOxygenDeficit, Apnea-type ventilator alarms.
* **Warning yellow**: Tachycardia, Bradycardia, Tachypnea, Bradypnea, Hypoxia, Hypercapnia, Hyperthermia, Hypothermia.
* **Info gray**: Stabilizing, equipment informational states.

Do not display `StartOfCardiacCycle`, `StartOfInhale`, or `StartOfExhale` as alarms. Use them as timing cues only.

### Numeric precision

| Display | Source                                                                                 |    Conversion | Precision |
| ------- | -------------------------------------------------------------------------------------- | ------------: | --------: |
| HR      | `HeartRate` `1/min`                                                                    |           bpm |   integer |
| BP      | `SystolicArterialPressure`, `DiastolicArterialPressure`, `MeanArterialPressure` `mmHg` |          mmHg |   integer |
| RR      | `RespirationRate` `1/min`                                                              |   breaths/min |   integer |
| SpO₂    | Prefer `PulseOximetry`; fallback `OxygenSaturation`                                    | `value * 100` | integer % |
| Temp    | Prefer `CoreTemperature`; fallback `SkinTemperature`                                   |      °C or °F | 1 decimal |
| EtCO₂   | `EndTidalCarbonDioxidePressure`                                                        |          mmHg |   integer |

The important SpO₂ caveat is that Pulse defines `OxygenSaturation` as oxygen-bound hemoglobin fraction, while `PulseOximetry` is the optical-equivalent measurement that can include carbon monoxide effects. ([Pulse][11])

### HR tick visual

Best source order:

1. `StartOfCardiacCycle` event from pi-sim.
2. ECG R-peak if ECG waveform is provided.
3. Fallback scheduler from displayed HR: interval = `60000 / HR`.

Suppress tick when HR is missing, stale, offline, zero, Asystole, or pulseless rhythm. The tick is a visual heartbeat cue, not an audible clinical alarm.

### Waveform limitations

Do not fake waveforms from scalar vitals.

* SpO₂/OxygenSaturation is not a waveform; Kitware specifically notes that OxygenSaturation usually holds steady and should not be expected to “bounce” like a waveform. ([Kitware][12])
* Pulse’s own team says their vitals monitor uses `ArterialPressure_mmHg` for the pleth-like trace, so if pi-sim provides instantaneous arterial pressure samples, label it ABP or “pleth proxy,” not a true optical pleth. ([Kitware][13])
* EtCO₂ scalar is not a capnogram. A capnogram needs airway CO₂ partial-pressure samples.

---

## Testing strategy

### Unit tests

Test the pure monitor core without UI:

* Frame schema validation.
* Missing field handling.
* Unit conversion.
* SpO₂ 0–1 to percent.
* Rejection of NaN, Infinity, strings, negative impossible values.
* Sim-time formatting.
* Fresh/stale/offline/paused transitions with fake monotonic clock.
* Alarm severity mapping.
* Heart-rhythm handling.
* HR tick scheduler.
* Waveform ring-buffer append, trim, and sequence-gap behavior.

### Live update tests

Use fixture streams:

* Stable healthy vitals.
* Tachycardia + Hypoxia.
* Asystole / HR 0.
* Partial JSON write then rename.
* Missing file.
* NaN field.
* Sequence gap.
* Sim-time regression.
* Paused sim.
* High-frequency waveform batch.
* Stale after exactly 2 s.
* Offline after exactly 10 s.

### Renderer tests

For the UI:

* Golden screenshots at 1920×1080, 1366×768, and high-DPI scale.
* Assert no text matching `/save|commit|chart|document/i`.
* Assert footer always visible.
* Assert `---` appears for invalid/offline values.
* Assert alarm chips render and clear correctly.
* Assert waveform renderer holds 60 fps with 50 Hz batches.
* Assert stale/offline visual states are impossible to miss.

### Boundary checks

Hard-check:

* Saturation values accidentally arriving as 97 instead of 0.97.
* Temp unit mismatch.
* MAP missing while sys/dia present.
* HR > 300 or < 0.
* BP impossible values.
* RR = 0 under apnea.
* `HeartRhythm` inconsistent with HR.
* `events=[]` vs `events` missing. Missing means **alarms unavailable**, not **no alarms**.

---

## License and dependency cautions

Pulse’s official site presents the engine as open source, multi-platform, and available through the Kitware physiology repositories; the Unity Asset source is described as Apache 2.0 on the Pulse site, while the Unity Asset Store package itself carries the Standard Unity Asset Store EULA. ([Pulse][1])

Use this posture:

* Pull from **Kitware GitLab source**, not Unity Asset Store or Unreal Marketplace packages.
* Keep Apache 2.0 NOTICE attribution if adapting enum lists, layout ideas, or source patterns.
* Do not copy Unity/Unreal marketplace-distributed code into pi-chart.
* Avoid making Qt a new dependency unless you accept LGPL/commercial implications.
* Avoid Unity/Unreal as runtime dependencies for pi-chart.
* Do not use any non-public pi-sim internals.
* Do not build a Pulse WASM/web engine for this subsystem. pi-sim already owns Pulse execution. Even though recent Pulse/Unity WebGL discussion shows WebGL builds are possible and version-specific, that is unnecessary complexity for a monitor that only consumes `current.json`. ([Kitware][14])

---

## Exact Pulse links for the coding agent to inspect first

1. `https://pulse.kitware.com/_scenario_file.html` — canonical vitals-monitor data requests.
2. `https://pulse.kitware.com/modules.html` — exact property definitions, including `PulseOximetry`, `OxygenSaturation`, pressure, heart rhythm, respiratory outputs.
3. `https://pulse.kitware.com/_c_d_m_tables.html` — `eEvent` and `eHeartRhythm`.
4. `https://pulse.kitware.com/_system_methodology.html` — engine timestep and timing.
5. `https://pulse.kitware.com/class_physiology_engine.html` — `GetSimulationTime`, `GetTimeStep`, engine interface.
6. `https://gitlab.kitware.com/physiology/explorer` — visual reference; inspect, do not port wholesale.
7. `https://www.kitware.com/pulse-explorer-3-0-release/` — Explorer features and release context.
8. `https://gitlab.kitware.com/physiology/unity` — inspect `PulseEngineDriver`, `PulseDataLineRenderer`, `PulseDataNumberRenderer`, `VitalsMonitor`.
9. `https://www.kitware.com/pulse-is-now-available-on-the-unity-asset-store/` — Unity monitor component pattern.
10. `https://gitlab.kitware.com/physiology/unreal` — inspect example monitor only for architecture confirmation.
11. `https://www.kitware.com/kitware-and-lumeto-develop-pulse-unreal-plugin-for-medical-simulation-and-training-on-unreal-engine/` — Unreal plugin features/license context.
12. `https://pulse.kitware.com/version.html` — validation/plotting-tool release notes.

Some Kitware GitLab pages are protected from automated browsing, so the terminal agent should inspect them by cloning or opening in an authenticated browser session rather than relying only on scraped web output.

---

## Implementation guidance for the terminal GPT-5.5 agent

Create these packages/modules:

```text
pi-monitor/
  crates-or-packages/
    pulse-public-frame/      # schema, serde/zod/json-schema, unit constants
    monitor-core/            # pure display state machine
    monitor-ingest/          # current.json watcher, validator, fixture replay
    monitor-ui/              # kiosk monitor renderer
    monitor-cli/             # debug watcher and fixture player
  fixtures/
    stable.json
    alarming.json
    asystole.json
    paused.json
    invalid_nan.json
    missing_fields.json
    waveform_abp.json
```

Hard rules for the agent:

* The monitor process reads `current.json` and writes nothing except local logs.
* No import from pi-agent.
* No import from hidden pi-sim internals.
* No fake ECG/pleth/capnogram.
* No client-side clinical threshold alarms when Pulse events are available.
* Use Pulse property names and units on the wire.
* Convert only at the display boundary.
* Treat missing alarms as “alarm feed unavailable,” not “normal.”
* Treat stale/offline/invalid as first-class visual states, not log-only errors.

The final build target should be a standalone monitor that pi-chart can launch or embed behind a hard boundary, but that remains operational even if the charting application, EHR adapter, or pi-agent disappears.

Yes — there **is** useful material to add, but it **does not change the core recommendation**.

I would **build off the original architecture I gave you**, then apply a small “delta patch” from the prematurely stopped research. The pasted research is strongest on **Pulse-specific implementation details**, especially waveform channels, visual references, fixture/testing specifics, and a few naming gotchas. It is weaker as a final architecture recommendation because parts of it still drift back toward a browser/SSE/React default, which the updated prompt explicitly freed us from. 

## Bottom line

Keep the original recommendation:

> **Build a standalone, display-only `pi-monitor` subsystem with a native/hybrid shell, a pure monitor core, and read-only ingestion from `pi-sim/vitals/current.json`. Do not build an EHR-adjacent vitals page, Pulse control surface, Unity/Unreal/Qt port, or browser-bound monitor as the default.**

Then add the following refinements.

---

# Additions worth borrowing

## 1. Add more precise waveform roadmap language

The pasted research adds useful specificity on what is and is not a real Pulse waveform.

I would add this to the M2 waveform section:

```text
Waveform source hierarchy:

1. ECG:
   Prefer Pulse ECG `Lead3ElectricPotential` in mV.
   Do not assume Lead I / Lead II are valid unless pi-sim explicitly exposes them.

2. ABP:
   Use instantaneous `ArterialPressure` in mmHg as the real arterial pressure waveform.

3. Pleth:
   Do not claim a true optical pleth waveform.
   If using arterial pressure as a pleth-like visual proxy, label it honestly as ABP or pleth proxy.

4. Capnogram:
   Do not use scalar EtCO₂ as a capnogram.
   A capnogram needs sampled airway/carinal CO₂ partial pressure, for example gas-compartment CO₂ partial-pressure samples.

5. Respiratory waveforms:
   Defer until pi-sim exposes sampled flow/pressure values at adequate cadence.
```

This strengthens the earlier warning not to fake ECG/pleth/capnogram from scalar vitals. The pasted report is especially useful in calling out that Explorer/Unity appear to use arterial pressure as a pleth-like trace, and that continuous capnography requires sampled airway CO₂ rather than scalar EtCO₂. 

---

## 2. Add the exact “preferred vital source” policy

My original answer already covered most of this, but the pasted report makes the priority rules clearer.

Add this to the schema/display rules:

```text
Preferred source order:

SpO₂:
  1. PulseOximetry, unitless 0–1
  2. OxygenSaturation, unitless 0–1, fallback only

Temperature:
  1. CoreTemperature
  2. SkinTemperature, fallback only

EtCO₂:
  1. EndTidalCarbonDioxidePressure in mmHg
  2. EndTidalCarbonDioxideFraction only if pressure is unavailable and display clearly converts/labels it

Blood pressure:
  - SystolicArterialPressure
  - DiastolicArterialPressure
  - MeanArterialPressure
  - ArterialPressure only for waveform/trend, not as a replacement for sys/dia/MAP tiles
```

This matters because `OxygenSaturation` and `PulseOximetry` are not semantically identical, and because the stock Pulse scenario may include `SkinTemperature` even though `CoreTemperature` is the more bedside-monitor-like value. 

---

## 3. Add “schema-driven units only; no silent guessing”

The pasted research emphasizes a failure mode worth making explicit: SpO₂ may accidentally arrive as `97` instead of `0.97`.

Add this hard rule:

```text
Never infer whether a saturation is unitless or percent from magnitude alone.

Valid:
  { value: 0.97, unit: "unitless" }
  { value: 97, unit: "%" }

Invalid:
  { value: 97, unit: "unitless" }
  { value: 0.97, unit: "%" } unless explicitly allowed by schemaVersion

The schemaVersion, not UI guesswork, determines conversion.
```

This is one of the most valuable practical additions.

---

## 4. Add more concrete upstream source inspection targets

The pasted research gives a better “what files to inspect first” list for the coding agent.

Add these to the agent instructions:

```text
When inspecting Pulse Unity source, prioritize:

- PulseEngineDriver.cs
- PulseDataLineRenderer.cs
- PulseDataNumberRenderer.cs
- VitalsMonitor.unity

Borrow:
- driver → renderer decomposition
- per-channel numeric renderer idea
- per-channel line renderer idea
- sweep/ring-buffer behavior

Do not borrow:
- Unity Plugins/
- Unity Editor/
- PulseActionOnClick
- scene lifecycle assumptions
- anything that sends actions to Pulse
```

This fits well with the original architecture: borrow the **component pattern**, not Unity as a runtime dependency. 

---

## 5. Add a stronger “buffer reset” rule

The pasted report adds a subtle but important operational point: renderer buffers must reset on source discontinuities.

Add this to the waveform/ring-buffer rules:

```text
Reset all waveform and trend buffers when any of the following occur:

- simTime decreases
- sequence decreases
- source changes
- schemaVersion changes
- file disappears and later reconnects
- runState changes from stopped/restarting to running
- frame gap exceeds configured discontinuity threshold
- monitor receives an explicit simulation restart marker
```

This is better than only saying “detect sim-time regression.”

---

## 6. Add optional SSE/web route as a secondary adapter, not default architecture

The pasted report argues hard for Node/Express + chokidar + SSE. That is useful **only as an optional transport**.

I would phrase it this way:

```text
Default local monitor:
  Native/hybrid app reads current.json directly through monitor-ingest.

Optional debug/remote transport:
  monitor-ingest may expose read-only SSE:
    GET /snapshot
    GET /events
    GET /health

Rules:
  - Bind localhost by default.
  - No commands.
  - No Pulse actions.
  - No writes.
  - No charting endpoints.
  - SSE emits normalized MonitorFrame plus transport metadata.
```

This preserves the useful one-way-stream idea while avoiding the old browser-bound assumption. The pasted report’s SSE reasoning is sound for a web renderer, but the updated prompt’s constraint lift means SSE should be **an adapter**, not the backbone. 

---

## 7. Add visual reference details, but do not overfit them

The pasted report gives more concrete visual claims about Pulse Explorer:

```text
Pulse Explorer visual reference:
- dark bedside-monitor visual grammar
- large right-side numeric tiles
- waveform strips
- HR
- ABP sys/dia/MAP
- SpO₂
- EtCO₂
- RR
- temperature
- sim time
```

Use that as a visual target, but not a dependency. The report correctly warns that Explorer has action/scenario/control surfaces that should not be copied into pi-monitor. 

I would **not** hard-code the exact Explorer colors unless the team wants that. Use bedside-monitor conventions, but make the pi-monitor identity distinct enough that it does not look like an EHR charting screen.

---

## 8. Add one more risk: display/persistence drift

The pasted research makes a good point about a future adapter writing `vitals.jsonl` with different timing or rounding than the monitor.

Add this risk to the architecture section:

```text
Future EHR adapter drift risk:

The monitor and future EHR adapter may read the same public frame but display/persist different values if they use different unit conversion, rounding, or source-priority rules.

Mitigation:
- share pulse-public-frame schema
- share unit conversion library
- share value-source priority policy
- do not share UI state machine
- do not let EHR adapter depend on monitor UI
- persist raw Pulse-native values plus units where possible
```

This keeps the separation, but avoids inconsistent truth later. 

---

## 9. Add a stronger fixture set

My original testing section was already pretty comprehensive. The pasted research adds a few useful named fixtures and Playwright-style assertions that are worth borrowing even if the final app is native/hybrid.

Add these fixtures:

```text
fixtures/
  stable_healthy.json
  tachycardia_hypoxia.json
  asystole_hr_zero.json
  stale_source.json
  offline_missing_file/
  malformed_json_partial_write.json
  invalid_spo2_unitless_97.json
  invalid_nan_hr.json
  paused_no_simtime_advance.json
  simtime_regression_restart.json
  sequence_gap.json
  waveform_abp_50hz_batch.json
  waveform_capnogram_carina_co2.json
```

Add these renderer assertions:

```text
- no text matching /save|commit|chart|document/i in monitor module
- footer always contains "not charted" or equivalent
- stale appears exactly at configured stale threshold
- offline appears exactly at configured offline threshold
- invalid field does not overwrite last valid value
- missing alarms means "alarm feed unavailable", not "normal"
- reconnect after sim reset clears waveform buffers
```

The “no chart/commit language” assertion is a particularly good addition because it turns a UX boundary into an automated test. 

---

# Small corrections I would make to the pasted research

## Do not call pi-monitor “browser-side” by default

The pasted report says the module should be a passive browser-side bedside display via Node SSE. That was appropriate under the original web-bound constraint, but not under the updated prompt. The updated prompt explicitly allows standalone/native/hybrid and asks the agent not to assume the web prototype is the right foundation. 

So I would rewrite that as:

> The monitor should be a passive display subsystem. The renderer may be web technology inside a native shell, but the architecture should not depend on an external browser or charting-page lifecycle.

## Be careful with “all Pulse UIs are Apache 2.0”

The pasted report says the Kitware-published Pulse UIs are Apache 2.0 at source, while also warning that Unity Asset Store and Unreal Marketplace distributions carry storefront EULAs. Keep the cautious version:

```text
Use Kitware GitLab source and official docs as the licensing basis.
Do not copy from Unity Asset Store or Unreal Marketplace packages.
Preserve Apache 2.0 LICENSE/NOTICE if adapting code or enum lists.
Verify each repo’s LICENSE/NOTICE before copying source.
```

That is safer than making a blanket redistribution claim.

## Do not rely on color conventions too heavily

The pasted report recommends clinical monitor colors such as HR green, SpO₂ cyan, ABP red, RR yellow. That may be visually familiar, but do not make color the only signal. Add labels, units, alarm chips, and banners for accessibility.

---

# Final “patch” to append to the original output

You can paste this directly under the original architecture recommendation:

```text
Delta from secondary Pulse research:

Keep the standalone native/hybrid monitor architecture. Do not revert to a browser-bound Node/SSE app as the default. However, borrow the following Pulse-specific details:

1. Prefer PulseOximetry over OxygenSaturation for displayed SpO₂. Both are unitless 0–1 on the wire; display as percent only at render.
2. Prefer CoreTemperature over SkinTemperature for bedside temp. Use SkinTemperature only as a fallback.
3. Treat EndTidalCarbonDioxidePressure as the preferred EtCO₂ display value. Do not render scalar EtCO₂ as a capnogram.
4. M2 ECG should use Lead3ElectricPotential if pi-sim exposes it. Do not assume Lead I or Lead II are valid.
5. M2 ABP waveform should use instantaneous ArterialPressure.
6. Do not claim a true pleth waveform unless pi-sim emits one. If arterial pressure is used visually as a pleth proxy, label it honestly.
7. A real capnogram requires sampled airway/carinal CO₂ partial pressure, not EndTidalCO₂ scalar.
8. Reset waveform/trend buffers on sim-time regression, sequence regression, source change, schema change, offline→reconnect, or explicit sim restart.
9. Borrow Unity’s driver/line-renderer/number-renderer decomposition as a design pattern only:
   - ingest driver
   - waveform renderer
   - numeric tile renderer
10. Add automated UI tests that assert the monitor contains no Save/Commit/Chart affordance and always displays a “live simulation / not charted” boundary.
11. Keep an optional localhost-only SSE adapter for debug/remote display, but make direct native file ingest the default local architecture.
```

So yes: **download/build from the original output**, but fold in the above patch. The pasted research is valuable as an implementation-detail supplement, not as a reason to change the top-level architecture.


[1]: https://pulse.kitware.com/?utm_source=chatgpt.com "Pulse Physiology Engine"
[2]: https://www.kitware.com/pulse-is-now-available-on-the-unity-asset-store/ "Pulse Is Now Available on the Unity Asset Store"
[3]: https://pulse.kitware.com/_scenario_file.html "Pulse Physiology Engine"
[4]: https://www.kitware.com/pulse-explorer-3-0-release/ "Pulse Explorer 3.0 Release"
[5]: https://www.kitware.com/kitware-and-lumeto-develop-pulse-unreal-plugin-for-medical-simulation-and-training-on-unreal-engine/ "Kitware and Lumeto Develop Pulse Unreal Plugin for Medical Simulation and Training on Unreal Engine"
[6]: https://pulse.kitware.com/version.html "Pulse Physiology Engine"
[7]: https://pulse.kitware.com/_c_d_m_tables.html "Pulse Physiology Engine"
[8]: https://pulse.kitware.com/_system_methodology.html "Pulse Physiology Engine"
[9]: https://pulse.kitware.com/_cardiovascular_methodology.html "Pulse Physiology Engine"
[10]: https://pulse.kitware.com/class_physiology_engine.html?utm_source=chatgpt.com "Pulse Physiology Engine - Kitware Inc."
[11]: https://pulse.kitware.com/modules.html "Pulse Physiology Engine"
[12]: https://discourse.kitware.com/t/minimum-and-maximu-value-for-oxygensaturation/1216 "Minimum and Maximu Value for OxygenSaturation - Pulse Physiology Engine - Kitware"
[13]: https://discourse.kitware.com/t/show-pleth-graph-with-pulse-engine/1229 "Show PLETH graph with Pulse Engine - Pulse Physiology Engine - Kitware"
[14]: https://discourse.kitware.com/t/pulse-engine-on-webgl-unity-build/1135 "Pulse Engine on WebGL (Unity build) - Pulse Physiology Engine - Kitware"

