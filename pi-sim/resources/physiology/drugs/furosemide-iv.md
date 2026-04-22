---
id: furosemide-iv
class: other
indication: Volume overload — ADHF, pulmonary edema, hypertensive emergency with overload.
dosing:
  typical_iv_bolus: "20–40 mg IV (naïve); 40–80 mg if AKI"
  typical_infusion: "5–40 mg/h"
pk:
  onset_s: 600
  decay_s: 14400
  half_life_s: 5400
  boluslike: true
  notes: "venodilation 5–10 min; diuresis 5–15 min; duration 2–6 h"
pd:
  bp_sys: { magnitude: -10, per: "40 mg IV", note: "−5 to −15 mmHg over hours; brief paradoxical rise possible early" }
modulates_conditions:
  - { condition: pulmonary_edema, severity_mul: 0.5, note: "preload reduction within 15 min via venodilation, then diuresis" }
sources:
  - { claim: "venodilation precedes diuresis (~15 min)", ref: "Dikshit 1973 PMID 4734628" }
  - { claim: "rebound sodium retention after dose ends", ref: "Almeshari 1993 PMID 8297674" }
  - { claim: "bolus vs infusion equivalent in ADHF",      ref: "Felker 2011 DOSE PMID 21366472" }
status: cited
---

<!-- resources/physiology/drugs/furosemide-iv.md -->

# Furosemide IV

## Indication
Volume overload: acute decompensated HF; pulmonary edema; hypertensive emergency with volume overload; AKI with oliguria (decongestive — does not prevent or treat AKI itself).

## Dosing
- Naïve: 20–40 mg IV bolus.
- Loop-diuretic-naïve with AKI: 40–80 mg.
- Chronic user: IV dose = oral dose (or 1–2.5× oral daily dose IV).
- Infusion: 5–40 mg/h (may reduce ototoxicity at high total doses).

## PK / PD

- **t½ plasma:** 1–2 h in normal renal function; up to 10 h in severe AKI/CKD.
- **Onset:** diuretic effect **5–15 min** IV; urine flow peaks at 30–60 min.
- **Duration:** **2–6 h** per dose.
- **Hemodynamic effect (venodilation)** precedes diuresis by ~15 min — seen as modest preload reduction within 5–10 min, independent of urine output (Dikshit et al., *N Engl J Med* 1973, PMID 4734628).

## Hemodynamic magnitude

- **Urine output:** 200–2,000 mL in first hour, dose- and volume-dependent.
- **CVP/PAOP:** falls 2–5 mmHg within 15 min (venodilation), then further 5–15 mmHg over 1–2 h from diuresis.
- **BP:** modest fall (−5 to −15 mmHg) over hours with diuresis; acute bolus may briefly **raise** BP before diuresis by releasing renin/noradrenaline (paradoxical early response).

## Secondary effects
- Hypokalemia, hypomagnesemia, hypocalcemia, metabolic alkalosis.
- Ototoxicity at high doses or rapid infusion (>4 mg/min).
- Hyperuricemia, gout flare.
- Prerenal AKI if over-diuresed.

## Cessation
- Effect tapers as dose ends; no rebound BP but "rebound sodium retention" is well-described (Almeshari et al., *J Am Soc Nephrol* 1993, PMID 8297674) — urine sodium drops sharply after diuretic effect ends, which is why scheduled dosing matters.

## Open questions
- DOSE trial (Felker et al., *NEJM* 2011, PMID 21366472) established that bolus vs. infusion in ADHF produces similar symptom relief; high-dose (2.5× home) vs. low-dose (equal-to-home) trades more AKI for more symptom relief.
- Diuretic resistance mechanisms are multifactorial; simulator should include an Emax ceiling that rises with chronic use.
