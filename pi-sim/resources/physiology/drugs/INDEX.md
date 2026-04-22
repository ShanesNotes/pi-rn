# Drug PK/PD Compendium

One file per drug with citation-backed YAML front-matter (pk + pd blocks). The compendium is now **human/agent reference material** — the physics engine is Pulse, which models drug PK/PD internally. Use this library to:

- choose clinically realistic infusion rates and bolus doses when authoring `vitals/scenarios/*.json` timelines
- sanity-check Pulse's drug response against published expectations
- decide which Pulse substance to invoke (Pulse substance names: `Norepinephrine`, `Epinephrine`, `Phenylephrine`, `Succinylcholine`, etc.)

## Pulse substance coverage

Pulse 4.3.1 ships validated PK/PD for: Albuterol, Atropine, Diazepam, Epinephrine, Etomidate, Fentanyl, Furosemide, Ketamine, Lidocaine, Midazolam, Morphine, Naloxone, Norepinephrine, Pralidoxime, Prednisone, Propofol, Rocuronium, Sarin, Succinylcholine, TMP-SMX, Vasopressin (check `./pulse/bin/substances/` inside the container for the authoritative list).

Pulse does **not** ship: acetaminophen, crystalloid/colloid as substances (handled via `SubstanceCompoundInfusion` with `Saline` / `LactatedRingers` / `Blood`), esmolol, labetalol, metoprolol, hydralazine, nitroglycerin, phenylephrine — some of these are in the substance library but not validated; check before authoring a scenario that relies on them.

## Available drugs (this compendium)

| Drug | Class | File |
|---|---|---|
| Acetaminophen IV | antipyretic | [acetaminophen-iv.md](acetaminophen-iv.md) |
| Albumin / colloid | colloid | [albumin-colloid.md](albumin-colloid.md) |
| Atropine | other | [atropine.md](atropine.md) |
| Crystalloid bolus | fluid | [crystalloid-bolus.md](crystalloid-bolus.md) |
| Dobutamine | inotrope | [dobutamine.md](dobutamine.md) |
| Epinephrine | vasopressor | [epinephrine.md](epinephrine.md) |
| Esmolol | antiarrhythmic | [esmolol.md](esmolol.md) |
| Flumazenil IV | antagonist | [flumazenil-iv.md](flumazenil-iv.md) |
| Furosemide IV | other | [furosemide-iv.md](furosemide-iv.md) |
| Hydralazine IV | vasodilator | [hydralazine-iv.md](hydralazine-iv.md) |
| Labetalol IV | antiarrhythmic | [labetalol-iv.md](labetalol-iv.md) |
| Metoprolol IV | antiarrhythmic | [metoprolol-iv.md](metoprolol-iv.md) |
| Naloxone IV | antagonist | [naloxone-iv.md](naloxone-iv.md) |
| Nitroglycerin IV | vasodilator | [nitroglycerin-iv.md](nitroglycerin-iv.md) |
| Norepinephrine | vasopressor | [norepinephrine.md](norepinephrine.md) |
| Phenylephrine | vasopressor | [phenylephrine.md](phenylephrine.md) |
| Vasopressin | vasopressor | [vasopressin.md](vasopressin.md) |

## Promised but not delivered

- propofol — sedation (not in current cloud research output)
- fentanyl — analgesia/sedation
- midazolam — sedation

## Front-matter schema

```yaml
---
id: <slug>
class: <vasopressor|inotrope|vasodilator|antiarrhythmic|fluid|colloid|antipyretic|antagonist|other>
indication: <one short sentence>
dosing:
  typical_iv_bolus: "<dose>"      # if applicable
  typical_infusion: "<low–high mcg/kg/min or mcg/min>"  # if applicable
pk:
  onset_s: <number>               # midpoint of cited range, or single value
  decay_s: <number>               # midpoint of cited range
  half_life_s: <number>           # if cited
  boluslike: <true|false>
  notes: "<one-line caveat if onset/decay range was wide>"
pd:
  # one entry per affected vital with cited magnitude
  hr:     { magnitude: <signed number>, per: "<dose unit>", note: "<optional>" }
  bp_sys: { magnitude: <signed number>, per: "<dose unit>", note: "<optional>" }
  bp_dia: { magnitude: <signed number>, per: "<dose unit>", note: "<optional>" }
  rr:     { magnitude: <signed number>, per: "<dose unit>", note: "<optional>" }
  spo2:   { magnitude: <signed number>, per: "<dose unit>", note: "<optional>" }
  temp:   { magnitude: <signed number>, per: "<dose unit>", note: "<optional>" }
modulates_conditions:                # optional — list any conditions this drug attenuates
  - { condition: shock_hemorrhagic, severity_mul: 0.6, note: "fluid restoration" }
sources:
  - { claim: "onset 60–90s",        ref: "Beloeil 2005 PMID 15820913" }
  - { claim: "MAP +10–15 per 0.1",  ref: "Martin 1993 PMID 8354217" }
status: cited
---
```

## Conventions

- Magnitudes are signed (negative = drop).
- All numeric values cite Tier 1 (PMID) or Tier 2 (guideline / textbook).
- `status: cited` means every value has a citation in `sources`. `status: incomplete` means at least one field was unsourced.
- For boluses: `boluslike: true`, `decay_s` = full duration to wear-off.
- For infusions: `boluslike: false`, `decay_s` = post-stop washout τ.
- `per` is the dose unit the magnitude is normalized to (e.g. "0.1 mcg/kg/min" or "1 g IV" or "500 mL bolus").
- For drugs with no PD effect on a vital, OMIT that vital entry — don't write a 0.
