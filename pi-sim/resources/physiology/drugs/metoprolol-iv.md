---
id: metoprolol-iv
class: antiarrhythmic
indication: Rate control SVT/AF; acute MI; HTN urgency.
dosing:
  typical_iv_bolus: "2.5–5 mg IV q5–10 min, max 15 mg"
pk:
  onset_s: 450
  decay_s: 16200
  half_life_s: 12600
  boluslike: true
  notes: "peak 5–10 min IV; duration 3–6 h"
pd:
  hr:     { magnitude: -17, per: "5 mg IV", note: "−10 to −25 bpm per 5 mg in AF/RVR" }
  bp_sys: { magnitude: -10, per: "5 mg IV", note: "−5 to −15 mmHg" }
sources:
  - { claim: "HR −10 to −25 per 5 mg in AF RVR", ref: "Demircan 2005 PMID 16046754" }
status: cited
---

<!-- resources/physiology/drugs/metoprolol-iv.md -->

# Metoprolol IV

## Indication
Rate control of SVT/AF; acute MI (rate control, anti-ischemic); HTN urgency (not preferred).

## Dosing
- 2.5–5 mg IV over 2–5 min; may repeat q 5–10 min up to 15 mg.

## PK / PD

- **t½ plasma:** 3–4 h (much longer than esmolol).
- **Onset IV:** peak effect **5–10 min**.
- **Duration:** hemodynamic effect **3–6 h** after single dose.

## Hemodynamic magnitude

- **HR:** **−10 to −25 bpm** per 5 mg dose in AF with RVR (Demircan et al., *Emerg Med J* 2005, PMID 16046754).
- **SBP:** **−5 to −15 mmHg**.
- **β1-selective** at standard doses.

## Secondary effects
- Negative inotropy; bronchospasm risk (less than non-selective).
- Metabolized by CYP2D6 — poor metabolizers have prolonged effect.

## Cessation
- Long offset (4–6 h); cannot titrate rapidly.
- Often used as bridge to oral β-blocker.

## Open questions
- Metoprolol tartrate IV vs. succinate oral: different PK; simulator should model IV tartrate only (succinate is oral ER only).
