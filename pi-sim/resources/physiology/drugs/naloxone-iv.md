---
id: naloxone-iv
class: antagonist
indication: Opioid overdose with respiratory depression.
dosing:
  typical_iv_bolus: "0.04–0.4 mg IV titrated; 0.4–2 mg in arrest"
pk:
  onset_s: 90
  decay_s: 3600
  half_life_s: 3600
  boluslike: true
  notes: "onset 1–2 min; duration 30–90 min — shorter than many opioids → re-sedation risk"
pd:
  rr:     { magnitude: 8, per: "0.4 mg IV", note: "rises toward normal within 1–3 min" }
  hr:     { magnitude: 15, per: "0.4 mg IV", note: "+10–20 bpm sympathetic surge" }
  bp_sys: { magnitude: 15, per: "0.4 mg IV", note: "+10–20 mmHg sympathetic surge" }
sources:
  - { claim: "pulmonary edema 1–4% incidence post-reversal", ref: "Osterwalder 1996 PMID 8745893" }
  - { claim: "titrated dosing preferred",                   ref: "Boyer 2012 PMID 22784117" }
status: cited
---

<!-- resources/physiology/drugs/naloxone-iv.md -->

# Naloxone IV

## Indication
Opioid overdose with respiratory depression.

## Dosing
- **Titrated for respiratory drive:** 0.04–0.4 mg IV push; repeat q 2–3 min up to 2 mg. Goal: restore RR ≥10–12, not full arousal.
- **Arrest / severe OD:** 0.4–2 mg IV push.
- **Infusion:** 2/3 of effective wake-up dose per hour (rule of thumb).
- **IN:** 4 mg (for layperson use); IM 0.4 mg.

## PK / PD

- **t½ plasma:** **30–90 min**.
- **Onset IV:** **1–2 min**.
- **Duration:** **30–90 min** — critically, **shorter than most opioids**. Methadone (t½ 15–60 h), extended-release morphine, fentanyl (long-acting fentanyl analogues) can all outlast naloxone → re-sedation / re-respiratory-depression is predictable.

## Hemodynamic magnitude

- **RR:** rises toward normal within 1–3 min if dose adequate; full opioid reversal can push RR to 20+.
- **HR/BP:** typical rise **+10–20 bpm, +10–20 mmHg** on reversal (sympathetic surge from withdrawal).
- **Complications:** pulmonary edema (~1–4%), seizure, arrhythmia — all from abrupt sympathetic surge (Osterwalder, *J Emerg Med* 1996, PMID 8745893).

## Secondary effects
- Acute opioid withdrawal syndrome: agitation, vomiting, diarrhea, pain, tachycardia.
- Flash pulmonary edema (mechanism debated; catecholamine surge vs. direct pulmonary effect).
- Violent arousal — safety concern in field use.

## Cessation
- Offset **30–90 min** — plan for re-dosing or observation.
- Infusion recommended for long-acting opioids.

**Flag:** Many clinicians use 2 mg push "standard dose"; guideline-recommended titrated dosing (0.04–0.4 mg) is better tolerated and still effective for reversing respiratory depression without full arousal (Boyer, *N Engl J Med* 2012, PMID 22784117).

## Open questions
- Fentanyl analogue era has complicated simulation: some synthetic opioids require higher naloxone doses but the dose-response is not well-characterized in humans.
- Naloxone-induced pulmonary edema incidence is reported 1–4% in older series but may be lower with modern titrated dosing.
