---
id: norepinephrine
class: vasopressor
indication: First-line vasopressor in septic / vasodilatory / cardiogenic shock with hypotension.
dosing:
  typical_infusion: "0.05–0.5 mcg/kg/min (range 0.01–3)"
pk:
  onset_s: 75
  decay_s: 210
  half_life_s: 135
  boluslike: false
  notes: "onset τ 60–90s; offset τ 2–5 min after stop. Used by the bi-exp pkpd() shape. The 2-compartment model below replaces this for the engine's norepinephrine intervention from Phase 8 onward."
two_compartment:
  # Per Beloeil 2005 (population PK) — values are typical adult, not weight-normalized.
  # V_c, V_p in mL/kg of patient mass; rate constants in 1/s.
  # k_e derived from clearance ~3 L/min and V_c ~0.1 L/kg in a 70 kg patient.
  V_c: 100        # mL/kg (≈ 7 L in 70 kg adult — central plasma + highly perfused)
  V_p: 200        # mL/kg (≈ 14 L peripheral)
  k_12: 0.030     # 1/s — fast distribution α-phase (t½ ≈ 23 s)
  k_21: 0.015     # 1/s — return from peripheral
  k_e:  0.0072    # 1/s — elimination via NET/COMT/MAO (Cl ≈ 3 L/min, V_c ≈ 7 L)
hill_pd:
  # E_max and EC50 chosen so that at C_ss for 0.1 mcg/kg/min infusion
  # (~2.3 ng/mL), bp_sys effect ≈ +12.5 mmHg matching Martin 1993.
  bp_sys: { E_max: 60,  EC50: 8,  hill: 1, note: "saturates ~+60 mmHg at high dose" }
  bp_dia: { E_max: 50,  EC50: 8,  hill: 1, note: "tracks MAP rise" }
  hr:     { E_max: 18,  EC50: 5,  hill: 1, note: "modest β1 chronotropy; baroreflex coupling subtracts at high MAP for the 'near zero net' clinical observation" }
pd:
  bp_sys: { magnitude: 12.5, per: "0.1 mcg/kg/min", note: "MAP +10–15 per 0.1 (Martin 1993). Used by the bi-exp implementation; 2-comp + Hill above replaces this in the engine." }
  bp_dia: { magnitude: 10, per: "0.1 mcg/kg/min", note: "tracks MAP" }
  hr:     { magnitude: 7, per: "0.1 mcg/kg/min", note: "+5–15 bpm low dose; near zero at high dose due to baroreflex" }
modulates_conditions:
  - { condition: shock_septic, severity_mul: 0.6, note: "raises MAP via α1; norepi-sparing endpoint" }
sources:
  - { claim: "t½ 2–2.5 min, onset τ 60–90s",   ref: "Beloeil 2005 PMID 15820913" }
  - { claim: "MAP +10–15 mmHg per 0.1 mcg/kg/min", ref: "Martin 1993 PMID 8354217" }
  - { claim: "lower arrhythmia rate vs dopamine",  ref: "De Backer 2010 SOAP II PMID 20200382" }
  - { claim: "first-line in septic shock",         ref: "Evans 2021 SSC PMID 34599691" }
status: cited
---

<!-- resources/physiology/drugs/norepinephrine.md -->

# Norepinephrine

## Indication
First-line vasopressor in septic shock, vasodilatory shock, cardiogenic shock with hypotension (Surviving Sepsis Campaign 2021: Evans et al., *Intensive Care Med* 2021, PMID 34599691).

## Dosing
- Standard infusion: **0.01–3 mcg/kg/min** (commonly titrated 0.05–0.5 mcg/kg/min). No maximum is defined by guidelines; pragmatic upper limit 1–3 mcg/kg/min before adding second agent.
- Non-weight-based: 2–40 mcg/min.

## PK / PD

- **t½ plasma:** 2–2.5 min (Beloeil et al., *Br J Anaesth* 2005, PMID 15820913 — population PK).
- **Steady-state onset of hemodynamic effect:** τ **≈ 60–90 s** after rate change.
- **Offset after stopping infusion:** MAP returns to pre-drug baseline with τ **≈ 2–5 min** (multicompartment); clinical teaching "effect gone in 5 min" accurate.
- **Clearance:** rapid neuronal uptake (NET) + COMT/MAO; clearance roughly 3 L/min.

## Hemodynamic magnitude

- **MAP response:** approximately **+10–15 mmHg per 0.1 mcg/kg/min** increment, highly dependent on volume status and baseline vasomotor tone (Martin et al., *Chest* 1993, PMID 8354217; Hamzaoui et al., *Crit Care* 2010, PMID 20843356).
- **HR:** modest rise **+5 to +15 bpm** at low doses via β1; at higher doses reflex bradycardia from MAP rise partially offsets direct β1 effect — net HR change often minimal.
- **Cardiac output:** increases 10–20% at typical doses (combined β1 chronotropy/inotropy + preload augmentation from venoconstriction).

## Secondary effects
- Splanchnic and renal vasoconstriction at high doses; digital ischemia risk >1.0 mcg/kg/min.
- Hyperglycemia (α-mediated).
- Potentially arrhythmogenic but markedly less than epinephrine or dopamine (De Backer et al., *N Engl J Med* 2010, PMID 20200382 — SOAP II: 12% vs 24% arrhythmia rate vs. dopamine).

## Cessation
- Abrupt cessation → rapid BP fall (τ 2–5 min); taper recommended over 15–30 min once patient stabilized.
- "Norepinephrine withdrawal hypotension" phenomenon: some patients require prolonged tapers due to suppressed endogenous sympathetic activity.

## Open questions
- True dose–MAP relationship is non-linear and individual-variable; population PK/PD models (e.g., Beloeil 2005) fit Emax form but EC50 varies 5–10× across patients.
- Effect on venous return vs. arterial tone is drug-concentration-dependent and not cleanly separable in clinical trials.
