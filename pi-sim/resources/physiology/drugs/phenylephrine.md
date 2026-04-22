---
id: phenylephrine
class: vasopressor
indication: Hypotension with preserved CO; refractory vasoplegia; tachyarrhythmic shock.
dosing:
  typical_iv_bolus: "50–200 mcg IV q2–5 min"
  typical_infusion: "0.15–0.75 mcg/kg/min (10–180 mcg/min)"
pk:
  onset_s: 45
  decay_s: 540
  boluslike: true
  notes: "bolus peak <1 min; duration 5–15 min (distribution-limited)"
pd:
  bp_sys: { magnitude: 20, per: "100 mcg IV bolus", note: "MAP +15–25 mmHg lasting 5–10 min" }
  hr:     { magnitude: -10, per: "100 mcg IV bolus", note: "−5 to −15 bpm via baroreflex (distinguishing from norepi)" }
sources:
  - { claim: "MAP +15–25 mmHg per 100 mcg, 5–10 min duration", ref: "Goertz 1993 PMID 8214710" }
  - { claim: "phenylephrine vs norepi in septic shock — norepi favored", ref: "Morelli 2008 PMID 18715500" }
status: cited
---

<!-- resources/physiology/drugs/phenylephrine.md -->

# Phenylephrine

## Indication
Hypotension with preserved cardiac output (post-spinal, tachyarrhythmic shock, outflow-obstruction hypotension); refractory vasoplegia.

## Dosing
- IV bolus: 50–200 mcg q 2–5 min.
- Infusion: 0.15–0.75 mcg/kg/min (10–180 mcg/min).

## PK / PD

- **t½ plasma:** ~2.5 h, but hemodynamic duration is much shorter (distribution-limited): **5–15 min** per bolus (Stoelting & Hillier, *Pharmacology and Physiology in Anesthetic Practice*, 5th ed.).
- **Onset IV bolus:** **<1 min** to peak MAP effect.
- **Infusion steady-state:** τ 2–3 min.

## Hemodynamic magnitude

- **Bolus 100 mcg:** MAP rise **+15–25 mmHg** lasting 5–10 min (Goertz et al., *Anesth Analg* 1993, PMID 8214710).
- **Infusion 0.5 mcg/kg/min:** MAP **+15 mmHg** typical.
- **HR:** **falls 5–15 bpm** via baroreflex — a distinguishing feature vs. norepinephrine (which is net HR-neutral). Useful in tachyarrhythmic hypotension.

## Secondary effects
- Reduces CO modestly (increased afterload without inotropy); **avoid in depressed LV function**.
- Skin/splanchnic vasoconstriction; digital ischemia risk.
- No direct pulmonary effects.

## Cessation
- Rapid offset: MAP returns to baseline τ 5–10 min.
- No rebound.

## Open questions
- Evidence comparing phenylephrine to norepinephrine in septic shock favors norepi (Morelli et al., *Crit Care* 2008, PMID 18715500) but phenylephrine remains useful when β-agonism is unwanted.
