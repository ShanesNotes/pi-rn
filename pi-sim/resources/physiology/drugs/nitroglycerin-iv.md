---
id: nitroglycerin-iv
class: vasodilator
indication: ACS with ongoing ischemia; acute pulmonary edema; hypertensive emergency.
dosing:
  typical_infusion: "5–200 mcg/min titrated"
pk:
  onset_s: 90
  decay_s: 240
  half_life_s: 150
  boluslike: false
  notes: "onset 1–2 min; offset 3–5 min — rapidly titratable; tolerance in 24–48 h"
pd:
  bp_sys: { magnitude: -8, per: "low-dose 5–50 mcg/min", note: "−5 to −10 mmHg low dose; venodilator predominant" }
  bp_dia: { magnitude: -22, per: "high-dose >100 mcg/min", note: "−15 to −30 mmHg from arterial vasodilation" }
  hr:     { magnitude: 7, per: "high-dose >100 mcg/min", note: "+5 to +10 reflex tachycardia" }
sources:
  - { claim: "tolerance via sulfhydryl depletion 24–48 h", ref: "Münzel 2005 PMID 15692086" }
status: cited
---

<!-- resources/physiology/drugs/nitroglycerin-iv.md -->

# Nitroglycerin IV

## Indication
Acute coronary syndrome with ongoing ischemia; acute pulmonary edema / decompensated HF; hypertensive emergency (especially with pulmonary edema or MI).

## Dosing
- Infusion: **5–200 mcg/min**, titrated to effect. No absolute ceiling but >200 mcg/min rarely adds effect.
- SL (not IV): 0.4 mg q 5 min.

## PK / PD

- **t½ plasma:** 1–4 min.
- **Onset IV:** **1–2 min**.
- **Offset:** **3–5 min** — rapidly titratable, the feature that makes it preferred for HF/ACS.
- **Tolerance develops within 24–48 h** of continuous infusion (free radical / sulfhydryl depletion); drug-free interval required (Münzel et al., *Circ Res* 2005, PMID 15692086).

## Hemodynamic magnitude

- **Dose-dependent effect profile:**
  - **Low dose (5–50 mcg/min):** predominantly **venodilator** → preload reduction → wedge/LVEDP falls, MAP modestly drops (−5 to −10 mmHg).
  - **High dose (>100 mcg/min):** **arterial vasodilation** adds → afterload reduction, MAP falls more (−15 to −30 mmHg).
- **HR:** typically **+5 to +10 bpm** from reflex tachycardia at high doses.
- **CO:** increases in CHF (afterload reduction > preload drop), decreases in normal hearts.

## Secondary effects
- Headache (very common, ~60%).
- Methemoglobinemia at very high doses (rare).
- Paradoxical bradycardia / hypotension via Bezold-Jarisch — especially in volume-depleted or inferior MI patients.

## Cessation
- Rapid offset — MAP returns to pre-treatment in **3–5 min**.
- Rebound ischemia possible if abrupt withdrawal in chronic ischemic patients.

## Open questions
- Nitrate tolerance kinetics are debated — 24-h continuous infusion may retain 50–70% of initial effect; recommended intermittent dosing schedules vary by protocol.
- Meta-analyses show no clear mortality benefit in ACS despite physiological rationale; simulator should reflect hemodynamic effect without assuming outcome benefit.
