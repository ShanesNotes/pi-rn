---
id: acetaminophen-iv
class: antipyretic
indication: Antipyresis and multimodal analgesia in patients unable to tolerate enteral.
dosing:
  typical_iv_bolus: "1 g IV over 15 min q6h (max 4 g/day)"
pk:
  onset_s: 1350
  decay_s: 5400
  half_life_s: 9000
  boluslike: true
  notes: "antipyretic onset 15–30 min; peak 1–2 h; duration 4–6 h"
pd:
  temp:   { magnitude: -1.0, per: "1 g IV", note: "−0.5 to −1.5 °C from febrile baseline at peak (1–2 h)" }
  hr:     { magnitude: -10, per: "1 g IV", note: "−5 to −15 bpm via Liebermeister with temp fall" }
  bp_sys: { magnitude: -8, per: "1 g IV", note: "MAP fall 8 mmHg mean in critically ill (Kelly 2014); 10–35% have clinically significant hypotension" }
modulates_conditions:
  - { condition: fever, severity_mul: 0.5, note: "transient antipyresis 4–6 h" }
sources:
  - { claim: "peak antipyretic 1–2 h IV, 2–3 h PO",         ref: "Groeneveld 2011 PMID 21494761" }
  - { claim: "MAP fall mean 8 mmHg, intervention in 34%",   ref: "Kelly 2014 PMID 25035122" }
  - { claim: "hypotension rate ~10–35% in critically ill",  ref: "Chiam 2018 PMID 29680478" }
  - { claim: "no mortality benefit fever Rx in ICU",        ref: "Young 2015 HEAT PMID 26436473" }
status: cited
---

<!-- resources/physiology/drugs/acetaminophen-iv.md -->

# Acetaminophen IV (paracetamol IV)

## Indication
Antipyresis; multimodal analgesia (postoperative, procedural); fever in patients unable to tolerate enteral.

## Dosing
- 1 g IV over 15 min q 6 h (adults ≥50 kg); max 4 g/day.
- 12.5–15 mg/kg IV q 6 h for adults <50 kg.

## PK / PD

- **t½ plasma:** 2–3 h.
- **Onset analgesic:** **~5–10 min**; peak analgesia 1 h.
- **Onset antipyretic:** **temperature begins to fall 15–30 min** after IV infusion complete.
- **Peak antipyretic effect:** **1–2 h** after IV (vs. 2–3 h after oral) — Groeneveld et al., *Eur J Clin Pharmacol* 2011, PMID 21494761.
- **Duration antipyresis:** 4–6 h.

## Hemodynamic magnitude

- **Temperature drop:** typical **−0.5 to −1.5 °C** from a febrile baseline at 1–2 h post-dose; proportional to starting temperature.
- **Effective τ (falling limb):** **30–60 min**; fever returns with τ **60–120 min** as drug wanes.
- **HR:** falls in parallel with temperature via Liebermeister (typically **−5 to −15 bpm**).
- **BP:** Neutral in most patients. **Clinically significant hypotension** (MAP fall >15 mmHg) occurs in **~10–35% of critically ill patients** after IV acetaminophen (Chiam et al., *Br J Anaesth* 2018, PMID 29680478; Kelly et al., *Intensive Care Med* 2014, PMID 25035122 — mean MAP drop 8 mmHg; in 34% of episodes, intervention needed).

**Flag:** The antipyretic-hypotension effect is under-appreciated clinically. Mechanism debated — likely central temperature set-point reset causes peripheral vasodilation as patient "unloads" heat. Simulator should model a transient MAP dip (−5 to −15 mmHg) over 15–30 min after IV acetaminophen in hemodynamically marginal patients.

## Secondary effects
- Hepatotoxicity at supratherapeutic doses or with chronic hepatic dysfunction; IV route does not bypass first-pass-generated NAPQI.
- Transient transaminitis at therapeutic dose (minor, common).

## Cessation
- Temperature rises back to fevered baseline over 4–6 h as drug clears unless pyrogen source removed.

## Open questions
- Whether fever reduction with acetaminophen improves outcome is unclear — HEAT trial (Young et al., *N Engl J Med* 2015, PMID 26436473) showed no mortality difference in critically ill with fever.
- Mechanism of post-acetaminophen hypotension: unclear whether central (hypothalamic) or peripheral (direct vasodilator).
