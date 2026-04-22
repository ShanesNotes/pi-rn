---
id: atropine
class: other
indication: Symptomatic bradycardia; cholinergic poisoning.
dosing:
  typical_iv_bolus: "0.5–1 mg IV q3–5 min, max 3 mg"
pk:
  onset_s: 60
  decay_s: 2700
  half_life_s: 9000
  boluslike: true
  notes: "HR effect within 1 min; tachycardia 30–60 min; anticholinergic effects last hours"
pd:
  hr:     { magnitude: 30, per: "0.5 mg IV", note: "+20–40 bpm in vagally-mediated bradycardia; ineffective infranodal" }
  bp_sys: { magnitude: 5, per: "0.5 mg IV", note: "minor rise from HR" }
sources:
  - { claim: "HR +20–40 bpm per 0.5 mg, paradoxical brady <0.5 mg", ref: "AHA ACLS 2020 Panchal PMID 33081529" }
  - { claim: "ineffective in transplanted heart",                    ref: "AHA ACLS 2020 guidelines" }
status: cited
---

<!-- resources/physiology/drugs/atropine.md -->

# Atropine

## Indication
Symptomatic bradycardia; organophosphate / cholinergic poisoning (different dosing); pre-medication for intubation (rarely used in adults).

## Dosing
- **Bradycardia:** 0.5–1 mg IV, repeat q 3–5 min to max 3 mg (AHA ACLS 2020).
- **Organophosphate:** 1–2 mg IV, doubling dose q 5 min until secretions controlled; can require hundreds of mg.

## PK / PD

- **t½ plasma:** 2–3 h.
- **Onset:** HR effect within **1 min**; peak **2–4 min**.
- **Duration:** tachycardic effect 30–60 min; anticholinergic effects (dry mouth, mydriasis) several hours.

## Hemodynamic magnitude

- **HR:** **+20–40 bpm** per 0.5 mg in vagally-mediated bradycardia. Ineffective if block is below AV node (type II AV block, 3rd-degree block) — these patients need pacing.
- **Paradoxical bradycardia** at doses <0.5 mg — central vagal stimulation dominates; hence minimum dose 0.5 mg.
- **BP:** minimal direct effect; rises slightly with HR increase.

## Secondary effects
- Dry mouth, mydriasis, urinary retention (elderly especially).
- Delirium at high doses (anticholinergic toxidrome).
- Ineffective in heart-transplant patients (denervated heart).

## Cessation
- Long duration; cannot rapidly titrate.

## Open questions
- 2020 AHA guidelines removed atropine from asystole/PEA algorithms; its role in PEA with bradycardia remains controversial.
- In cholinergic poisoning, dose requirements vary 10–1,000×; pediatric and adult dosing differ dramatically.
