---
id: esmolol
class: antiarrhythmic
indication: Rate control SVT/AF; perioperative HTN; thyroid storm; aortic dissection.
dosing:
  typical_iv_bolus: "500 mcg/kg over 1 min load"
  typical_infusion: "50–200 mcg/kg/min"
pk:
  onset_s: 210
  decay_s: 600
  half_life_s: 540
  boluslike: false
  notes: "peak 2–5 min; recovery 10–30 min after stop (RBC esterase hydrolysis)"
pd:
  hr:     { magnitude: -22, per: "100 mcg/kg/min infusion", note: "−15 to −30 bpm at standard rates" }
  bp_sys: { magnitude: -10, per: "100 mcg/kg/min infusion", note: "−5 to −15 mmHg; negative inotropy contributes" }
sources:
  - { claim: "t½ ~9 min, recovery 10–30 min", ref: "Wiest 1991 PMID 1860732" }
  - { claim: "esmolol mortality benefit septic shock (single trial)", ref: "Morelli 2013 PMID 24108515" }
status: cited
---

<!-- resources/physiology/drugs/esmolol.md -->

# Esmolol

## Indication
Rate control of SVT/atrial fibrillation/flutter; perioperative HTN; thyroid storm; aortic dissection (rate/BP control).

## Dosing
- Loading: 500 mcg/kg over 1 min.
- Infusion: 50–200 mcg/kg/min (rarely up to 300).

## PK / PD

- **t½ plasma:** **~9 min** (rapid hydrolysis by RBC esterases — unique among β-blockers).
- **Onset:** peak effect **2–5 min** after loading dose.
- **Offset:** full recovery **10–30 min** after stopping (Wiest et al., *Clin Pharmacokinet* 1991, PMID 1860732).

## Hemodynamic magnitude

- **HR:** **−15 to −30 bpm** at standard infusion rates; reliable rate control in SVT/AF.
- **SBP:** modest fall **−5 to −15 mmHg**; negative inotropy contributes.
- **β1-selective** but selectivity lost at high doses.

## Secondary effects
- Negative inotropy — caution in LV dysfunction.
- Bronchospasm less than non-selective agents but real at high doses.

## Cessation
- Rapid offset (τ 5–15 min) — the feature that makes it preferred for titration in critical care.
- No true rebound with short courses.

## Open questions
- Esmolol's role in septic shock (Morelli et al., *JAMA* 2013, PMID 24108515 — mortality benefit) has not been replicated in larger trials; parameter effects on microcirculation are unclear.
