---
id: epinephrine
class: vasopressor
indication: Anaphylaxis, cardiac arrest, refractory shock, severe bronchospasm.
dosing:
  typical_iv_bolus: "1 mg IV (arrest); 0.3–0.5 mg IM (anaphylaxis)"
  typical_infusion: "0.01–0.5 mcg/kg/min"
pk:
  onset_s: 60
  decay_s: 450
  half_life_s: 150
  boluslike: true
  notes: "IV bolus peak <1 min; effect lasts 5–10 min"
pd:
  hr:     { magnitude: 20, per: "0.05 mcg/kg/min low-dose", note: "β-predominant, +10–30 bpm" }
  bp_sys: { magnitude: 30, per: "0.1+ mcg/kg/min high-dose", note: "+20–40 mmHg α-predominant" }
  bp_dia: { magnitude: -5, per: "<0.05 mcg/kg/min low-dose", note: "biphasic; β2 lowers DBP at low dose" }
sources:
  - { claim: "IV bolus peak <1 min, duration 5–10 min", ref: "Simons 2001 PMID 11349011" }
  - { claim: "biphasic β/α dose-response crossover",     ref: "Overgaard & Dzavík 2008 PMID 18810019" }
  - { claim: "lactate rise within 30 min",               ref: "Levy 2005 PMID 15750711" }
  - { claim: "ACLS arrest dosing 1 mg q3–5 min",         ref: "Panchal 2020 PMID 33081529" }
status: cited
---

<!-- resources/physiology/drugs/epinephrine.md -->

# Epinephrine

## Indication
Anaphylaxis (first-line IM); cardiac arrest (IV push); refractory shock; severe bronchospasm.

## Dosing
- **Anaphylaxis IM:** 0.3–0.5 mg (0.01 mg/kg), may repeat q 5–15 min (AAAAI/ACAAI 2020 parameter: Shaker et al., *J Allergy Clin Immunol* 2020, PMID 32001253).
- **Cardiac arrest:** 1 mg IV push q 3–5 min (AHA ACLS 2020: Panchal et al., *Circulation* 2020, PMID 33081529).
- **Infusion:** 0.01–0.5 mcg/kg/min.

## PK / PD

- **t½ plasma:** 2–3 min.
- **Onset IV bolus:** hemodynamic peak **<1 min**; IM deltoid peak **~8 min** (Simons et al., *J Allergy Clin Immunol* 2001, PMID 11349011); IM thigh faster, peak ~5 min.
- **Duration single IV bolus:** hemodynamic effect lasts **5–10 min**.

## Hemodynamic magnitude

- **Low dose (<0.05 mcg/kg/min):** β-predominant → HR rises 10–30 bpm; SBP rises via increased CO; DBP may fall.
- **High dose (>0.1 mcg/kg/min):** α-predominant → MAP rises 20–40 mmHg; SVR rises.
- **Biphasic dose response** is the hallmark: low doses drop DBP (β2 vasodilation), high doses raise it (α1 vasoconstriction) — crossover around 0.05 mcg/kg/min (Overgaard & Dzavík, *Circulation* 2008, PMID 18810019).

## Secondary effects
- Strongly arrhythmogenic; arrhythmia rate higher than norepinephrine.
- Hyperglycemia, hyperlactatemia (β2 skeletal-muscle glycolysis; **lactate rises within 30 min** and can confound sepsis monitoring — Levy et al., *Intensive Care Med* 2005, PMID 15750711).
- Bronchodilation (β2).

## Cessation
- Rapid offset after IV; offset τ 2–5 min.
- No rebound except when used for prolonged infusion in septic shock (same principle as norepinephrine).

## Open questions
- IM thigh vs. deltoid onset differences are well-established for young adults; obese adults may have substantially delayed IM absorption with depot effect.
- Lactate rise from epinephrine confounds sepsis resuscitation — unclear how to separate epi-induced from sepsis-induced lactate in real-time.
