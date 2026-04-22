---
id: crystalloid-bolus
class: fluid
indication: Hypovolemia, hemorrhage bridge, sepsis initial resuscitation, DKA, burns.
dosing:
  typical_iv_bolus: "500 mL bolus over 15 min; sepsis 30 mL/kg over 3 h"
pk:
  onset_s: 900
  decay_s: 1800
  boluslike: true
  notes: "peak MAP 15–20 min; returns to baseline by 60–90 min; V1 τ 15–40 min"
pd:
  bp_sys: { magnitude: 10, per: "500 mL bolus", note: "+5–15 mmHg in healthy hypovolemic; +10–20 if septic responder; <5 in non-responders (50% rate)" }
  hr:     { magnitude: -10, per: "500 mL bolus", note: "−5 to −15 bpm if preload-responsive" }
modulates_conditions:
  - { condition: shock_hemorrhagic, severity_mul: 0.7, note: "bridge to blood; crystalloid ceiling ~1–1.5 L" }
  - { condition: shock_septic,      severity_mul: 0.7, note: "responder rate ~50%; declines after 6 h" }
sources:
  - { claim: "intravascular retention 10–20% at 60 min healthy",  ref: "Hahn 2020 PMID 31767114" }
  - { claim: "responder rate ~50%, drops after 6 h",              ref: "Monnet 2016 PMID 27858374" }
  - { claim: "balanced fluids reduce AKI/death by 1.1% absolute", ref: "Semler 2018 SMART PMID 29485925" }
  - { claim: "restrictive vs liberal no mortality diff",          ref: "Meyhoff 2022 CLASSIC PMID 35709019" }
status: cited
---

<!-- resources/physiology/drugs/crystalloid-bolus.md -->

# Crystalloid bolus (0.9% NaCl, Lactated Ringer's, Plasma-Lyte)

## Indication
Hypovolemia, hemorrhage (bridge to blood products), sepsis initial resuscitation, DKA, burns.

## Dosing
- **Sepsis:** 30 mL/kg within first 3 h (Surviving Sepsis 2021: Evans et al., *Intensive Care Med* 2021, PMID 34599691) — though this guideline is weakened ("suggest" not "recommend") based on CLOVERS, CLASSIC.
- **Hemorrhage:** ≤1 L crystalloid before transitioning to blood products (ATLS 10th ed.; damage-control resuscitation principle).
- **DKA:** 15–20 mL/kg first hour.

## PK / Volume kinetics

Volume kinetics framework (Hahn, *Anesthesiology* 2010, PMID 20613481; Hahn, *Br J Anaesth* 2020, PMID 31767114) — crystalloid infusion behaves as a 2-compartment system:

- **V1 (plasma):** fills rapidly during infusion; decays with τ **15–40 min** in healthy adults.
- **V2 (interstitium):** fills from V1; slow return over hours.
- **Intravascular retention at 30 min after 1 L bolus:** 20–30% (healthy volunteers).
- **Intravascular retention at 60 min:** **10–20%** healthy; **5–15%** in sepsis; **<5%** in severe capillary leak / endothelial dysfunction.

**Flag — clinical teaching vs. data:** Traditional teaching "25% of crystalloid stays intravascular" assumed Starling's classical model. The revised Starling model with glycocalyx (Woodcock & Woodcock, *Br J Anaesth* 2012, PMID 22290457) shows **faster redistribution** than taught, especially in inflammation. Simulator should model intravascular retention as a rapidly-decaying compartment (τ 20–40 min) with a "leak" multiplier in sepsis/inflammation.

## Hemodynamic magnitude

- **MAP rise per 500 mL bolus over 15 min:**
  - Healthy hypovolemic volunteer: **+5 to +15 mmHg**; peak at 15–20 min; returns to baseline by 60–90 min.
  - Septic shock responder: **+10 to +20 mmHg** (if preload-responsive); non-responder **<5 mmHg** change.
  - "Responder" rate in septic shock: **~50%** at initial bolus; drops below 50% after first 6 h (Monnet et al., *Ann Intensive Care* 2016, PMID 27858374).
- **HR:** falls **−5 to −15 bpm** if preload-responsive (reduced sympathetic drive).
- **CVP:** rises 2–5 mmHg per 500 mL.
- **Pulse pressure variation / stroke volume variation** falls if responsive.

## 0.9% NaCl vs. balanced solutions
- 0.9% NaCl causes hyperchloremic metabolic acidosis at >2 L and is associated with AKI in observational and RCT data (Semler et al., SMART trial, *N Engl J Med* 2018, PMID 29485925 — balanced fluids reduced composite AKI/death by 1.1% absolute).
- LR and Plasma-Lyte are pH-buffered and do not cause this; current consensus favors balanced crystalloid for most critical care resuscitation.
- Hemodynamic effect essentially identical between NaCl and balanced solutions — simulator can treat them as equivalent for BP/HR purposes and differ only in acid-base.

## Cessation / ceiling
- **"Crystalloid ceiling" in hemorrhage:** beyond ~1–1.5 L, further crystalloid worsens outcomes by diluting clotting factors, dropping oncotic pressure, and increasing interstitial edema (Bickell et al., *N Engl J Med* 1994, PMID 7935634 — delayed-resuscitation trial; Morrison et al., *J Trauma* 2011, PMID 21610537).
- In sepsis, **"fluid overload" threshold** around +10% body weight or cumulative +5 L net positive balance — associated with increased mortality (Acheampong & Vincent, *Crit Care* 2015, PMID 26250780).
- CLASSIC trial (Meyhoff et al., *N Engl J Med* 2022, PMID 35709019) — restrictive vs. liberal fluids in septic shock showed no difference in 90-day mortality, reinforcing that "more is not better."

## Open questions
- Volume kinetic parameters in true shock states are inferred from observational data; no controlled kinetic studies exist in frank hemorrhagic shock (ethical).
- The glycocalyx-damage-during-inflammation model is mechanistically compelling but doesn't yet yield clinician-accessible parameters for bedside prediction.
- Fluid responsiveness assessment (PPV, SVV, passive leg raise) has well-established sensitivity/specificity but the 50% responder rate means half of "indicated" boluses fail physiologically.
