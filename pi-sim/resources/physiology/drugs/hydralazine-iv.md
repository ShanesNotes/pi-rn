---
id: hydralazine-iv
class: vasodilator
indication: Hypertensive urgency/emergency (second-line); pregnancy HTN.
dosing:
  typical_iv_bolus: "5–20 mg IV slow push q20–30 min"
pk:
  onset_s: 750
  decay_s: 14400
  half_life_s: 18000
  boluslike: true
  notes: "onset 5–20 min variable; duration 2–6 h; CYP2D6/NAT2 polymorphism — wide individual variance"
pd:
  bp_sys: { magnitude: -20, per: "10 mg IV", note: "MAP −10 to −30 per 10 mg; highly variable" }
  hr:     { magnitude: 17, per: "10 mg IV", note: "+10 to +25 bpm reflex tachycardia" }
sources:
  - { claim: "wide variance in onset / Emax (acetylator status)", ref: "Stoelting Pharmacology 5th ed" }
status: incomplete
---

<!-- resources/physiology/drugs/hydralazine-iv.md -->

# Hydralazine IV

## Indication
Hypertensive urgency/emergency (second-line); pregnancy HTN; acute severe HTN when short-acting titratable agent unavailable.

## Dosing
- 5–20 mg IV slow push q 20–30 min.

## PK / PD

- **t½ plasma:** 2–8 h (CYP2D6/NAT2 polymorphism — fast vs. slow acetylators have very different t½).
- **Onset:** **5–20 min** (variable — often delayed, leading to dose-stacking errors).
- **Duration:** **2–6 h** per dose.

## Hemodynamic magnitude

- **BP:** unpredictable response. Typical MAP fall **−10 to −30 mmHg** per 10 mg; some patients minimal response, others precipitous drop.
- **Direct arterial vasodilator** → reflex tachycardia **+10 to +25 bpm** and CO increase.

## Secondary effects
- Reflex tachycardia (can worsen myocardial ischemia — avoid in aortic dissection).
- Fluid retention; sodium retention via renin release.
- Drug-induced lupus with chronic use (not relevant for acute simulator).

## Cessation
- Slow offset; no titration possible.
- Limited role in modern critical care — replaced by nicardipine, clevidipine, labetalol for most indications.

**Flag:** Hydralazine IV is frequently criticized for unpredictable onset/duration leading to dose-stacking and precipitous hypotension; a simulator should model this unpredictability (wide τ, wide Emax variance).

## Open questions
- Slow-acetylator vs. fast-acetylator PK differences are well-established but pharmacogenetic testing is rarely used clinically; individual variability is the norm.
