# hemorrhagic_shock

**Status:** populated from Pulse Physiology Engine v4.3.1 published validation pages.
**Scenario:** `vitals/scenarios/hemorrhagic_shock.json`
**Reference curve:** `resources/physiology/validation-curves/hemorrhagic_shock.json`

## Reference source

- Engine: Pulse Physiology Engine v4.3.1 (Kitware, released January 2025; documentation generated 2026-02-01, build `10710baa2`).
- Scenario file: **HemorrhageClass2Saline** (primary), with cross-reference to **HemorrhageClass1Femoral** and **HemorrhageClass2Blood**.
- Validation pages fetched 2026-04-18:
  - https://pulse.kitware.com/md__hemorrhage__class2_saline.html
  - https://pulse.kitware.com/md__hemorrhage__class1_femoral.html
  - https://pulse.kitware.com/md__hemorrhage__class2_blood.html
  - https://pulse.kitware.com/_cardiovascular_methodology.html
  - https://pulse.kitware.com/version.html
- Methodology: Pulse validates against peer-reviewed literature (per-segment values compared to published swine-model and human hemorrhage data; see Clipp et al., *MHSRS 2020/2025*). We extracted the segment-level engine outputs Pulse publishes in its validation tables.
- Extraction method: published-text (no plot sampling needed; tabular).

## Trajectory (Pulse engine, mapped to our scenario timeline)

| t (s) | phase                              | HR  | BP_sys | BP_dia | RR   | SpO2 | Temp |
|-------|------------------------------------|-----|--------|--------|------|------|------|
| 30    | baseline                           | 72  | 114    | 74     | 12   | 97.0 | 37.1 |
| 200   | early hemorrhage, compensated      | 93  | 107    | 79     | 12.4 | 97.0 | 37.1 |
| 350   | peak hemorrhage, pre-resuscitation | 112 | 98.5   | 77.6   | 12.8 | 96.5 | 37.2 |
| 500   | post first 1 L crystalloid bolus   | 100 | 105    | 78     | 12.8 | 96.5 | 37.2 |
| 720   | post second bolus, recovery        | 93.5| 112    | 76     | 12.8 | 97.0 | 37.1 |

Units: HR bpm, BP mmHg, RR /min, SpO2 %, Temp degC.

## Intervention timing (from our scenario)

- t = 60 s: hemorrhage onset, severity 0.50 (Pulse-equivalent: ~140 mL/min Class-2 hemorrhage from right arm + vena cava).
- t = 240 s: hemorrhage severity escalates to 0.75.
- t = 360 s: first 1 L crystalloid IV bolus (Pulse-equivalent: 100 mL/min IV saline, 500 mL bag).
- t = 540 s: second 1 L crystalloid IV bolus.

## Mapping caveats

- Pulse publishes per-segment summary values, not dense time-series. Each checkpoint above corresponds to a Pulse segment endpoint mapped onto our scenario timing.
- Our scenario uses a more aggressive insult (severity 0.50 then 0.75) than Pulse Class 2 Saline alone — divergence is expected and informative.
- Temperature and SpO2 are stable in Pulse hemorrhage scenarios (no overt tissue hypoxia until Class 3+); we accept Pulse's flat trajectory here.
- Tolerance: 15% relative default; SpO2 +/- 2 absolute; temperature +/- 0.3 degC absolute.

## Citation

Pulse Physiology Engine. *Hemorrhage Validation — Class 2 with Saline Administration*. Kitware, Inc. v4.3.1, January 2025. https://pulse.kitware.com/md__hemorrhage__class2_saline.html (accessed 2026-04-18).

Bray, A., Webb, J. B., Enquobahrie, A., Vicory, J., Heneghan, J., Hubal, R., TerMaath, S., Asare, P., & Clipp, R. B. (2019). Pulse Physiology Engine: an Open-Source Software Platform for Computational Modeling of Human Medical Simulation. *SN Comprehensive Clinical Medicine*, 1, 362–377. https://doi.org/10.1007/s42399-019-00053-w

Clipp, R. B., Bray, A., & Webb, J. B. (2020). An Integrated Model for Hemorrhagic Shock and Fluid Resuscitation. *Military Health System Research Symposium (MHSRS)*.
