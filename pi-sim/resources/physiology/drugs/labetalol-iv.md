---
id: labetalol-iv
class: antiarrhythmic
indication: Hypertensive emergency, acute stroke BP control, pregnancy HTN.
dosing:
  typical_iv_bolus: "10–20 mg IV q10 min, double up to 300 mg cumulative"
  typical_infusion: "0.5–2 mg/min"
pk:
  onset_s: 450
  decay_s: 16200
  half_life_s: 23400
  boluslike: true
  notes: "peak 5–10 min IV; duration 3–6 h per bolus; t½ 5–8 h"
pd:
  bp_sys: { magnitude: -20, per: "20 mg IV", note: "MAP −15 to −25 mmHg per 20 mg" }
  hr:     { magnitude: -7, per: "20 mg IV", note: "modest fall −5 to −10; β-blockade prevents reflex tachy from α-blockade" }
sources:
  - { claim: "MAP −15 to −25 per 20 mg, β:α ~7:1 IV", ref: "Pearce 1986 Arch Intern Med" }
status: cited
---

<!-- resources/physiology/drugs/labetalol-iv.md -->

# Labetalol IV

## Indication
Hypertensive emergency / urgency; acute stroke BP control; pregnancy HTN (first-line — does not cross placenta significantly).

## Dosing
- IV bolus: **10–20 mg** over 2 min; double q 10 min up to 300 mg cumulative.
- Infusion: 0.5–2 mg/min.

## PK / PD

- **t½ plasma:** **5–8 h**.
- **Onset IV:** peak **5–10 min**.
- **Duration:** 3–6 h per bolus.

## Hemodynamic magnitude

- **Mixed α1 + non-selective β antagonism; β:α ratio ~7:1 IV.**
- **BP:** MAP falls **−15 to −25 mmHg** per 20 mg bolus in hypertensive emergency (Pearce et al., *Arch Intern Med* 1986 — classic dose-finding).
- **HR:** **modest fall (−5 to −10)** or unchanged — the α-blockade would reflexively raise HR, but β-blockade prevents this. Net HR change small — a distinguishing feature vs. pure β-blockers.

## Secondary effects
- Bronchospasm risk (non-selective β).
- Orthostatic hypotension.
- Safe in pregnancy (does not reduce uteroplacental flow at usual doses).

## Cessation
- Long offset; cannot rapidly reverse if overshoot.
- Not first-choice when rapid titratability is needed (use nicardipine or nitroprusside).

## Open questions
- Head-to-head trials vs. nicardipine in stroke BP control show similar efficacy; choice is institutional.
