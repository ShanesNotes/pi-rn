---
id: albumin-colloid
class: colloid
indication: Volume resuscitation; SBP/cirrhosis adjunct; large-volume paracentesis.
dosing:
  typical_iv_bolus: "5% albumin 250–500 mL; 25% albumin 50–100 mL"
pk:
  onset_s: 1350
  decay_s: 14400
  boluslike: true
  notes: "rise in 15–30 min; durable hours; intravascular t½ days–weeks"
pd:
  bp_sys: { magnitude: 10, per: "500 mL 5% albumin", note: "+5–15 mmHg in sepsis (SAFE)" }
modulates_conditions:
  - { condition: shock_hemorrhagic, severity_mul: 0.6, note: "intravascular volume restoration; ~25% more durable than crystalloid" }
  - { condition: shock_septic,     severity_mul: 0.7, note: "MAP rise but no mortality benefit (ALBIOS)" }
sources:
  - { claim: "5% retention 60–80% healthy / 40–60% sepsis", ref: "Caironi 2014 ALBIOS PMID 24635773" }
  - { claim: "no mortality benefit vs saline; TBI worse",   ref: "Finfer 2004 SAFE PMID 15163774" }
  - { claim: "albumin reduces HRS in SBP",                  ref: "Sort 1999 PMID 10432325" }
  - { claim: "HES harmful in sepsis",                       ref: "Myburgh 2012 CHEST PMID 23075127" }
status: cited
---

<!-- resources/physiology/drugs/albumin-colloid.md -->

# Albumin / colloid bolus

## Indication
- **5% albumin:** volume resuscitation (alternative or adjunct to crystalloid).
- **25% albumin ("salt-poor"):** hepatic cirrhosis (large-volume paracentesis, SBP, hepatorenal syndrome); some use in refractory edema.
- **Hydroxyethyl starches:** formerly used; now essentially abandoned after CHEST/6S trials.

## Dosing
- 5% albumin: 250–500 mL bolus.
- 25% albumin: 50–100 mL (osmotically equivalent to ~250–500 mL intravascular expansion).
- In SBP: 1.5 g/kg day 1, 1 g/kg day 3.

## PK / Volume kinetics

- **Intravascular retention of 5% albumin at 1 h:** **~60–80%** in healthy; **40–60%** in sepsis/inflammation (Hahn 2020; ALBIOS trial secondary analyses: Caironi et al., *N Engl J Med* 2014, PMID 24635773).
- **Plasma volume expansion of 25% albumin:** 100 mL → ~300–450 mL intravascular expansion over 30–60 min.
- **Half-life of exogenous albumin in plasma:** 15–20 days in health; shorter (days) in capillary-leak states.
- **Effective volume expansion τ:** rise within 15–30 min; durable over hours.

## Hemodynamic magnitude

- **MAP rise per 500 mL 5% albumin in sepsis:** +5 to +15 mmHg; not statistically different from crystalloid in SAFE trial (Finfer et al., *N Engl J Med* 2004, PMID 15163774 — saline vs. albumin; no mortality difference; TBI subgroup worse with albumin).
- **CVP rise:** 1–2 mmHg greater per mL than crystalloid, reflecting better intravascular retention.
- **Sustained MAP benefit at 4 h vs. crystalloid:** modest, estimated **~25% more durable** effect.

## Secondary effects
- **Albumin:** generally well-tolerated; rare anaphylactoid reactions. In TBI, associated with increased mortality (SAFE-TBI subgroup).
- **Starches (HES):** increased AKI and 90-day mortality in sepsis (CHEST: Myburgh et al., *N Engl J Med* 2012, PMID 23075127; 6S: Perner et al., *N Engl J Med* 2012, PMID 22738085). Now contraindicated in sepsis and critically ill; EMA suspended authorization 2022.
- **Cost:** albumin ~20–50× cost of crystalloid; cost-effectiveness debated.

## Specific contexts
- **SBP + cirrhosis:** albumin reduces hepatorenal syndrome and mortality (Sort et al., *N Engl J Med* 1999, PMID 10432325; meta-analyses confirm).
- **Large-volume paracentesis (>5 L):** albumin 6–8 g per liter removed reduces post-paracentesis circulatory dysfunction.
- **Sepsis:** ALBIOS trial showed albumin safely raises MAP faster than crystalloid but no mortality benefit at 28 or 90 days. Surviving Sepsis 2021 suggests considering albumin when "substantial amounts" of crystalloid have been given.

## Open questions
- Precise PD advantage of albumin over crystalloid in septic shock: clinically measurable (faster MAP rise, less total fluid) but not outcome-changing in aggregate trials.
- Whether targeted (e.g., hypoalbuminemic) subgroups benefit more than general population is unresolved.
- 20–25% albumin for ICU diuresis adjunct: pathophysiologically appealing but trials mixed.
