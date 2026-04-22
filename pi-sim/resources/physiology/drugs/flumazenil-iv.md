---
id: flumazenil-iv
class: antagonist
indication: Reversal of benzodiazepine-induced sedation (procedural / iatrogenic).
dosing:
  typical_iv_bolus: "0.2 mg IV q1 min up to 1 mg cumulative"
pk:
  onset_s: 90
  decay_s: 2700
  half_life_s: 3600
  boluslike: true
  notes: "onset 1–2 min; duration 30–60 min — shorter than most benzodiazepines"
pd:
  rr:     { magnitude: 4, per: "0.2 mg IV", note: "RR improvement is primary goal" }
  hr:     { magnitude: 5, per: "0.2 mg IV", note: "modest rise from arousal" }
  bp_sys: { magnitude: 5, per: "0.2 mg IV", note: "modest rise from arousal" }
sources:
  - { claim: "seizure risk in chronic BZD users / TCA co-ingestion", ref: "Hoffman & Goldfrank 1995 J Toxicol Clin Toxicol" }
status: cited
---

<!-- resources/physiology/drugs/flumazenil-iv.md -->

# Flumazenil IV

## Indication
Reversal of benzodiazepine-induced sedation (procedural, iatrogenic). **Not recommended for undifferentiated overdose** due to seizure risk in chronic benzo users and mixed ingestions (Hoffman & Goldfrank, *J Toxicol Clin Toxicol* 1995).

## Dosing
- 0.2 mg IV over 15 s; repeat 0.2 mg q 1 min up to 1 mg cumulative.

## PK / PD

- **t½ plasma:** **~1 h** — shorter than most benzodiazepines.
- **Onset:** **1–2 min**.
- **Duration:** **30–60 min**; re-sedation common with long-acting benzodiazepines (diazepam, flurazepam).

## Hemodynamic magnitude

- Minimal direct hemodynamic effect.
- HR/BP may rise modestly with arousal.
- RR improvement is primary goal.

## Secondary effects
- **Seizures** in chronic benzodiazepine users or co-ingestion with TCAs / proconvulsants.
- Anxiety, agitation on emergence.

## Cessation
- Offset 30–60 min — re-sedation if long-acting benzo was ingested.

## Open questions
- Role in hepatic encephalopathy (some evidence of short-term mental status improvement): Als-Nielsen et al., *Cochrane* 2017 — modest effect, unclear clinical utility.
