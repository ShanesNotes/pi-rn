---
id: dobutamine
class: inotrope
indication: Low cardiac output states (cardiogenic shock with preserved BP, decompensated HF, septic cardiomyopathy).
dosing:
  typical_infusion: "2–20 mcg/kg/min"
pk:
  onset_s: 90
  decay_s: 210
  half_life_s: 120
  boluslike: false
  notes: "onset 1–2 min; steady state 10 min; offset τ 2–5 min"
pd:
  hr:     { magnitude: 10, per: "5 mcg/kg/min", note: "+5–15 low-mod; +20–30 above 10 mcg/kg/min" }
  bp_sys: { magnitude: 10, per: "5 mcg/kg/min", note: "+5–15 mmHg from CO; DBP may fall (β2)" }
  bp_dia: { magnitude: -5, per: "5 mcg/kg/min", note: "β2 vasodilation drops DBP" }
sources:
  - { claim: "CO +25–50% at 5–10 mcg/kg/min", ref: "Leier 1977 PMID 319838" }
  - { claim: "β1/β2 inotropic mechanism",     ref: "Ruffolo 1987 PMID 3661477" }
status: cited
---

<!-- resources/physiology/drugs/dobutamine.md -->

# Dobutamine

## Indication
Low cardiac output states: cardiogenic shock with preserved BP, decompensated HF with hypoperfusion, septic shock with persistent hypoperfusion despite adequate MAP.

## Dosing
- Infusion: **2–20 mcg/kg/min** (rarely up to 40).

## PK / PD

- **t½ plasma:** 2 min.
- **Onset:** hemodynamic effect within **1–2 min** of rate change; steady state 10 min.
- **Offset:** τ 2–5 min after stopping.

## Hemodynamic magnitude

- **Cardiac output:** **+25–50%** at 5–10 mcg/kg/min (Leier et al., *Circulation* 1977, PMID 319838; Ruffolo, *Am J Med Sci* 1987, PMID 3661477).
- **HR:** **+5–15 bpm** at low-moderate doses; **+20–30 bpm** above 10 mcg/kg/min.
- **SBP:** variable; usually +5 to +15 mmHg from increased CO, but **DBP may fall** (β2 vasodilation) so MAP change is modest.
- **PAOP/wedge:** falls (reduced filling pressures).

## Secondary effects
- Arrhythmogenic: atrial and ventricular ectopy common.
- Tachyphylaxis with continuous infusion >72 h (β1 receptor downregulation).
- Eosinophilic hypersensitivity myocarditis (rare but reported).

## Cessation
- Rapid offset; rebound hypotension possible if patient was dependent on β1 support.
- Often paired with norepinephrine in cardiogenic shock to maintain MAP while supporting CO.

## Open questions
- In septic shock "cardiac dysfunction," trials have not shown clear mortality benefit of dobutamine; its role remains pragmatic.
- Tachyphylaxis magnitude varies 20–60% across reports; hard to model deterministically.
