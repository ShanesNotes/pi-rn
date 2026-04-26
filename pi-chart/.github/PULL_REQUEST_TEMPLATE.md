## Pass label

Apply exactly one pass label before merge:

- [ ] `pass:1` — dock UX / artifact pane layout
- [ ] `pass:2` — data spine / constants / fixtures
- [ ] `pass:3` — connector / intent semantics / mock adapter
- [ ] `pass:4` — patient_002 mapping / freshness / review fixture
- [ ] `pass:5` — `.pi` extension spike

## Safety checks

- [ ] Chart truth still changes only through clinician-mediated **Chart** actions.
- [ ] Advisory copy remains source-data-verification language.
- [ ] MAR medication administration remains blocked without scan/attestation.
- [ ] No hidden `pi-sim` internals are imported or exposed.
