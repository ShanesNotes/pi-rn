---
id: vasopressin
class: vasopressor
indication: Adjunct to norepinephrine in septic shock; refractory vasodilatory shock.
dosing:
  typical_infusion: "fixed 0.03 U/min (up to 0.04)"
pk:
  onset_s: 600
  decay_s: 2700
  half_life_s: 900
  boluslike: false
  notes: "onset 5–15 min; offset 15–30 min after stop; longer than catecholamines"
pd:
  bp_sys: { magnitude: 17, per: "0.03 U/min", note: "MAP +10–25 mmHg added to norepi (VASST)" }
  hr:     { magnitude: -3, per: "0.03 U/min", note: "may slightly decrease (baroreflex + direct)" }
modulates_conditions:
  - { condition: shock_septic, severity_mul: 0.7, note: "norepi-sparing ~25% (VASST)" }
sources:
  - { claim: "norepi-sparing, MAP rise; no mortality benefit", ref: "Russell 2008 VASST PMID 18305265" }
  - { claim: "no AKI benefit/harm vs norepi",                  ref: "Gordon 2016 VANISH PMID 27483065" }
  - { claim: "abrupt cessation may cause hypotension",         ref: "Bissell 2019 PMID 30914376" }
status: cited
---

<!-- resources/physiology/drugs/vasopressin.md -->

# Vasopressin (AVP)

## Indication
Adjunct to norepinephrine in septic shock to achieve MAP target / decrease norepi dose (Surviving Sepsis 2021); vasodilatory shock refractory to catecholamines; diabetes insipidus (different indication).

## Dosing
- **Septic shock infusion:** fixed **0.03 U/min** (not weight-based); up to 0.04 U/min in some protocols. Higher doses (>0.04) have been associated with ischemia.
- **Cardiac arrest:** historically 40 U IV (now removed from 2020 AHA ACLS — no mortality benefit over epinephrine).

## PK / PD

- **t½ plasma:** 10–20 min (longer than catecholamines).
- **Onset:** **5–15 min** to peak MAP effect after infusion start.
- **Duration:** MAP effect persists 15–30 min after stopping infusion.

## Hemodynamic magnitude

- **MAP rise:** **+10–25 mmHg** on 0.03 U/min added to norepinephrine (VASST trial: Russell et al., *N Engl J Med* 2008, PMID 18305265 — norepi-sparing effect ~25%).
- **HR:** may slightly decrease (baroreflex + direct effect).
- **CO:** usually unchanged or slight fall.

## Secondary effects
- Renal cortical vasoconstriction partial-offset by V2-mediated water retention; net effect on renal function unclear but **VANISH trial** (Gordon et al., *JAMA* 2016, PMID 27483065) showed no AKI benefit or harm.
- Splanchnic vasoconstriction; ischemic complications at >0.04 U/min.
- Hyponatremia (V2 effect).

## Cessation
- Slower offset than catecholamines; MAP falls over 30–60 min.
- Taper recommended; abrupt discontinuation may cause hypotension (Bissell et al., *Am J Health Syst Pharm* 2019, PMID 30914376).

## Open questions
- Optimal sequencing (norepi-first then add vasopressin vs. combined early) is not settled; Surviving Sepsis 2021 suggests adding vasopressin when norepi dose reaches 0.25–0.5 mcg/kg/min.
- Non-linear dose response above 0.04 U/min — higher doses do not reliably produce higher MAP but do cause ischemia.
