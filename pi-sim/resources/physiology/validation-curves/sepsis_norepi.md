# sepsis_norepi

**Status:** no published Pulse validation curve found — checkpoints intentionally empty.
**Scenario:** `vitals/scenarios/sepsis_norepi.json`
**Reference curve:** `resources/physiology/validation-curves/sepsis_norepi.json`

## Reference search summary

Pulse Physiology Engine v4.3.1 (January 2025) **does not publish a quantitative validation trajectory for sepsis or sepsis-with-vasopressor**. We searched the following on 2026-04-18:

- https://pulse.kitware.com/_cardiovascular_methodology.html — Table 3 lists hemorrhage Class 1–3, arrhythmias, CPR, pericardial effusion. No sepsis row.
- https://pulse.kitware.com/_nervous_methodology.html — baroreceptor (acute hemorrhage) and TBI only.
- https://pulse.kitware.com/_endocrine_methodology.html — acute stress (mild pain / mental stress / panic), hormones. No sepsis.
- https://pulse.kitware.com/_system_methodology.html — combined-effects scenarios are airway/anesthesia/trauma; showcases are Combat Multitrauma, Asthma, Heat Stroke, Environment Exposure. No sepsis.
- https://pulse.kitware.com/_blood_chemistry_methodology.html — resting physiology and hemorrhage only.
- https://pulse.kitware.com/_drugs_methodology.html — Norepinephrine PK validated in Table 9 (rates 0.01, 0.06, 0.1, 0.14, 0.2 ug/kg/min) on a healthy patient model only. At 0.1 ug/kg/min: HR 72, SBP 125, DBP 82. No sepsis backdrop.
- https://pulse.kitware.com/_s_e_sepsis_8h_source.html — `SESepsis` C++ class exists (severity 0..1) but no validation report.
- https://pulse.kitware.com/published.html — hemorrhage publications listed; **no sepsis validation publications**.

## Trajectory

Empty. The validator handles this gracefully (`status=skipped`) for reference-mode runs.

## Intervention timing (from our scenario, for reference)

- t = 60 s: sepsis onset, severity 0.7 (SESepsis with single severity scalar).
- t = 480 s: norepinephrine infusion at 0.12 ug/kg/min.

## What we'd need to populate this

Either:
1. A locally executed Pulse run of a custom `Sepsis + Norepinephrine` scenario, exporting per-second CSV — Pulse supports this via `SESepsis` + `SESubstanceInfusion`, but it requires building/running the engine and is out of scope here.
2. A published external validation of Pulse's sepsis output (e.g. the SIAM 2024 MIMIC-III digital-twin assessment) with extractable curves — none currently identified with usable tabular data.
3. A MIMIC-III/IV septic-shock cohort median trajectory pulled from credentialed PhysioNet, treated as ground truth rather than a Pulse-vs-pi-rn comparison.

## Citation

Pulse Physiology Engine. *Sepsis Condition (SESepsis class)*. Kitware, Inc. v4.3.1, January 2025. https://pulse.kitware.com/_s_e_sepsis_8h_source.html (accessed 2026-04-18).

Pulse Physiology Engine. *Drugs Methodology — Norepinephrine Validation*. Kitware, Inc. v4.3.1, January 2025. https://pulse.kitware.com/_drugs_methodology.html (accessed 2026-04-18).

Bray, A., Webb, J. B., Enquobahrie, A., Vicory, J., Heneghan, J., Hubal, R., TerMaath, S., Asare, P., & Clipp, R. B. (2019). Pulse Physiology Engine: an Open-Source Software Platform for Computational Modeling of Human Medical Simulation. *SN Comprehensive Clinical Medicine*, 1, 362–377. https://doi.org/10.1007/s42399-019-00053-w
