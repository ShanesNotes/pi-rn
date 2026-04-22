<!-- resources/physiology/coupling/reflex-map.md -->

# Cross-coupling reflex gains

All values are for healthy adults unless noted. Gain signs follow the convention: positive = output rises when input rises. This file synthesizes two independent research passes — where they converge, consensus values are given; where they diverge, both are reported with methodology split.

## Arterial baroreflex — HR response to MAP

The baroreflex has **two commonly-reported gains that differ by ~2–3×** depending on method. A simulator that picks one and calls it "the" baroreflex gain will be wrong for the other regime.

### Gain by method

- **Pharmacological / modified Oxford method** (phenylephrine bolus, full cardiovagal arc): typical gain **−14 to −18 ms RR-interval per mmHg** in healthy young adults (range −9 to −27); equivalent to roughly **−0.8 to −1.2 bpm per mmHg** at resting HR of 70 — Kardos et al., *Am J Physiol* 2001, PMID 11454571; La Rovere et al., *Lancet* 1998, PMID 9482439 (ATRAMI, n=1,284, mean BRS 12.8 ±8.6 ms/mmHg post-MI).
- **Sequence method / spontaneous** (beat-to-beat correlation of spontaneous SBP and RR fluctuations): typical gain **10–22 ms/mmHg** in healthy adults; correlates with modified Oxford at r ≈ 0.6–0.8 but systematically lower in absolute magnitude — Parati et al., *Hypertension* 2000, PMID 10720594; Laude et al., *Am J Physiol Regul Integr Comp Physiol* 2004, PMID 14962823 (EuroBaVar multi-center).
- **Neck-suction / neck-chamber** (isolates carotid sinus from aortic arc): carotid-sinus-specific gain **~0.3–0.5 bpm per mmHg** of carotid pressure stimulus — Eckberg et al., *Circ Res* 1976, PMID 1253215.

### Sigmoidal response curve and saturation

The HR-to-MAP relationship is **sigmoidal**, not linear. Operating-range bounds matter for a simulator:
- **Linear operating range:** MAP ~60–160 mmHg; saturates above and below.
- **Upper HR saturation (tachycardic ceiling):** ~140 bpm supine, extending to ~170 bpm under orthostatic stress as the curve resets rightward — Ogoh et al., *Am J Physiol Heart Circ Physiol* 2006, PMID 16443670; Fu et al., *J Physiol* 2012, PMID 22473780.
- **Lower HR saturation (bradycardic floor):** ~45 bpm supine.
- **Setpoint (inflection):** typically resting MAP ± 5 mmHg; chronic hypertension shifts the curve rightward without major slope change — Kent et al., *Cardiology* 1972, PMID 5083547.
- **Orthostatic reset:** head-up tilt shifts the entire operating curve upward (higher HR for given MAP) and increases gain — important for modeling postural scenarios (Schwartz et al., *Front Physiol* 2013, PMID 24133454).

### Time constants (two-compartment)

- **Cardiovagal arm:** phase delay <1 s; responds within **1–2 heartbeats** (effective τ ≈ **0.5–1.5 s**) — Eckberg, *J Physiol* 1980, PMID 7381779; Borst & Karemaker, *J Auton Nerv Syst* 1983, PMID 6886566.
- **Sympathetic arm** (vasomotor, then indirect HR): τ **5–15 s**; full vascular-resistance development over 15–30 s.
- **Complete postural adaptation:** steady state within ~60 s.

### Age effect
BRS drops roughly 50% from age 20 to age 75 — from ~18 to ~8 ms/mmHg (Monahan, *Am J Physiol Regul Integr Comp Physiol* 2007, PMID 17569765). Elderly also show **hysteresis asymmetry**: response to pressure rises differs from falls, producing poor orthostatic tolerance.

### Dominant scenarios
Orthostatic challenge, hemorrhage (until Class III), vasodilator response, brainstem stroke (loss of reflex).

**Flag — common teaching vs. data:** The textbook "1 bpm per mmHg" rule of thumb matches pharmacological method but is about **2× the sequence method** values. Resting spontaneous BRS in a healthy 50-year-old is often closer to **8–10 ms/mmHg** (≈ 0.5 bpm/mmHg). A simulator should split this into a fast vagal arm (τ 1 s) and a slow sympathetic arm (τ 10 s).

## Cardiopulmonary baroreflex (Bainbridge — HR response to RA filling)

- **Rapid volume loading 10–20 mL/kg:** HR rises **8–15 bpm** in healthy adults when starting from normovolemia; response is *inverted* (HR decreases) in dehydrated state — Crystal & Salem, *Anesth Analg* 2012, PMID 22253269 (modern review).
- **The original Bainbridge reflex is far weaker in humans than in dogs.** Bainbridge's 1915 dog experiments (*J Physiol* 1915, PMC 1420446) show HR increases of 30–50% with saline infusion; in humans the HR response to rapid volume is typically **<15%** and often obscured by simultaneous arterial baroreflex activation — Barbieri et al., *Am J Physiol* 1996, PMID 8764238.
- **Gain estimate:** roughly **+2–4 bpm per 5 mmHg rise in RA pressure** at low RA pressures (<5 mmHg); the relationship plateaus or reverses above RA ~8 mmHg.
- **Time constant:** 10–30 s after volume challenge.
- **Dominant scenarios:** early volume resuscitation, large-bore IV bolus.

**Flag:** Many simulators implement Bainbridge as a strong symmetric reflex (extrapolating from canine data). Human data support a weak, unidirectional, dehydration-gated response; clinically overshadowed by arterial baroreflex in most scenarios.

## Peripheral chemoreflex (RR response to hypoxia)

Standard hyperbolic model — Weil et al., *J Clin Invest* 1970, PMID 5435984:

    V̇E = V̇E₀ + A / (PaO2 − 32)

- **A parameter (hypoxic sensitivity):** median **186 L·min⁻¹·mmHg** in healthy adults; 5th–95th percentile **40–650** — **>10× interindividual variability** (Weil 1970; Rebuck & Campbell, *Am Rev Respir Dis* 1974, PMID 4814083).
- **Threshold for meaningful ventilatory response:** PaO2 **~60 mmHg** (≈ SpO2 90%); below this V̇E rises steeply.
- **At SpO2 80% (PaO2 ~50 mmHg):** V̇E roughly **doubles**; at SpO2 70% it triples.
- **CO2 dependence:** peripheral chemoreflex gain is **modulated by baseline PaCO2** — hypercapnia amplifies the hypoxic response; hypocapnia blunts it. Isocapnic rebreathing is the gold-standard measurement for this reason (Mohan & Duffin, *Respir Physiol* 1997, PMID 9407565).
- **Time constant:** onset τ **~20–30 s**; peak response within 1–3 min; then **hypoxic ventilatory decline (HVD)** over 15–30 min as central depression counteracts peripheral drive — Easton et al., *J Appl Physiol* 1986, PMID 3700307.
- **Saturation:** V̇E can reach 50–80 L/min; limited by mechanical ventilation ceiling and by hypocapnic alkalosis that develops.
- **Demographic modifiers:** blunted in breath-hold-trained athletes (swimmers, freedivers), chronic COPD CO2-retainers, chronic opioid users.

**Flag:** The "A/(PaO2−32)" form breaks down below PaO2 ~35 mmHg where response becomes erratic and depression can occur. Don't extrapolate.

## Central chemoreflex (RR response to PaCO2)

- **Hypercapnic ventilatory response (HCVR) slope:** typical **2–5 L·min⁻¹·mmHg⁻¹ PaCO2** in healthy adults — Read, *Australas Ann Med* 1967, PMID 6059894 (rebreathing method); Mohan & Duffin 1997 (modified rebreathing).
- **Apneic threshold:** ventilation essentially ceases below PaCO2 ~32–35 mmHg in awake subjects, ~38–42 mmHg during sleep — Dempsey et al., *Respir Physiol Neurobiol* 2004, PMID 15134604.
- **Linear operating range:** PaCO2 **40–70 mmHg**; above this, response plateaus or falls (CO2 narcosis).
- **Time constant:** τ **~60–120 s** for step change in inspired CO2 (slow because it depends on CSF pH equilibration via CO2 diffusion across blood-brain barrier); fully developed by 4–5 min.
- **CHF amplification:** CHF patients show **increased controller gain** (up to 2–3× normal), producing oscillatory/Cheyne-Stokes breathing — Javaheri, *Circulation* 1999, PMID 10066674; Francis et al., *Circulation* 2000, PMID 10683365.
- **Dominant scenarios:** respiratory failure, opioid overdose reversal, sleep-disordered breathing, Cheyne-Stokes in CHF.

**Flag:** HCVR slope is reduced ~30–50% in chronic opioid users and in long-standing COPD; a fixed gain will mis-predict both populations.

## Cushing reflex (HR/BP response to ICP)

- **Triggering ICP:** onset usually when CPP (MAP − ICP) falls below **~50 mmHg** — Cushing's original observations (Cushing, *Am J Med Sci* 1902, historical); Fodstad et al., *Neurosurgery* 2006, PMID 16462481.
- **Near-1:1 tracking:** as ICP approaches 40–60 mmHg, sympathetic activation drives MAP upward roughly matching ICP rise to preserve CPP.
- **BP rise magnitude:** MAP can rise **30–80 mmHg** over minutes.
- **HR response:** classically bradycardia (reflex vagal activation via baroreflex once MAP spikes), but often **absent or initially tachycardic** in acute rises. The full triad (hypertension, bradycardia, irregular respiration) is seen in **<33%** of cases at ICP crisis — Fodstad 2006.
- **Time constant:** onset within seconds to minutes of critical ICP; does not self-terminate until ICP falls.
- **Dominant scenarios:** brain herniation, severe TBI, massive intracerebral hemorrhage.

**Flag:** Clinical teaching treats the Cushing triad as diagnostic; in reality it is present in a minority of brain-injured patients at herniation. Simulator should model the reflex as physiological truth but not pretend it's always visible.

## Bezold-Jarisch reflex

- **Trigger:** activation of cardiac mechanosensitive and chemosensitive C-fibers (vagal afferents) by ventricular stretch, ischemia, or certain drugs (veratrum alkaloids, nitrates, serotonin agonists).
- **Response:** triad of **bradycardia + hypotension + peripheral vasodilation** — opposite direction of arterial baroreflex.
- **Magnitude:** HR drops 20–40 bpm within seconds; MAP drops 20–50 mmHg. Often transient (self-terminates in 1–3 min) unless the stimulus persists — Mark, *J Am Coll Cardiol* 1983, PMID 6826948.
- **Time constant:** onset τ **<5 s**, very fast vagal arc.
- **Acts as a state-switch, not a linear gain** — when triggered, it effectively suppresses sympathetic outflow entirely; modeling as a binary mode toggle is more faithful than a gradient term.
- **Dominant scenarios:** inferior-wall MI (right coronary territory rich in afferents), spinal anesthesia with venous pooling, vasovagal syncope, post-intubation hypotension in hypovolemic patients, nitroglycerin-induced syncope, Class IV hemorrhage with empty ventricle.

## Liebermeister rule (HR per °C)

- **Original source:** Liebermeister, C. *Handbuch der Pathologie und Therapie des Fiebers*, Leipzig: F.C.W. Vogel, 1875. Proposed **8 bpm per 1 °C** above baseline.
- **Commonly-taught rule of thumb:** 10 bpm per °C (or 18 bpm per °F).
- **Modern validation — the number is smaller than taught.**
  - Karjalainen & Viitasalo (*Acta Med Scand* 1986, PMID 3739773, n=100 adults with fever): **8.5 bpm per °C**, confirming Liebermeister's original.
  - Davies et al. (*Scand J Prim Health Care* 2009, PMID 19929185): 93 febrile adults, slope **~10 bpm per °C** but R² only **0.26** — high individual variability.
  - Race et al. (*BMJ Open* 2020, DOI 10.1136/bmjopen-2019-034886): large ED cohort — mean **8.5 bpm per °C** with 95% prediction interval **±18 bpm**.
- **Faget sign (pulse-temperature dissociation):** attenuated HR response in typhoid (*Salmonella typhi*), brucellosis, Legionella, yellow fever, tularemia, some viral infections, and drug fever — Cunha, *Infect Dis Clin North Am* 1996, PMID 8891473.

**Flag:** A simulator that implements "HR_target = HR_baseline + 10 × (T − 37)" gives smooth deterministic results; reality has σ ≈ 10 bpm around that line. Recommend: baseline gain **8–10 bpm/°C** with a random-effect term per patient, and a Faget-mode flag for specific infections.

## Sympathetic surge magnitudes

### Pain
- Acute noxious stimulus (post-op VAS 7/10): HR **+15 to +30 bpm**, SBP **+15 to +30 mmHg** within 30 s; τ 20–60 s — Möltner et al., *Pain* 1990, PMID 2326094; Loggia et al., *Pain* 2011, PMID 21570770 (HR–VAS correlation r ≈ 0.4–0.6, weak at individual level).

### Anxiety / acute stress
- Trier Social Stress Test or equivalent: HR **+10 to +25 bpm**; SBP **+15 to +25 mmHg**; onset within 1–2 min, offset 5–15 min — Kirschbaum et al., *Neuropsychobiology* 1993, PMID 8255414; Kudielka et al., *Psychoneuroendocrinology* 2004, PMID 15219648.
- HRV drops sharply (parasympathetic withdrawal).

### Hypovolemia — response by blood-volume loss
From ATLS 10th ed. (American College of Surgeons, 2018) and human LBNP studies (Convertino et al., *J Trauma* 2006, PMID 16688115):

| Blood loss | HR | SBP | RR | Key feature |
|---|---|---|---|---|
| <15% (Class I) | **+0 to +10 bpm** | unchanged | unchanged | Often **no tachycardia** — HR commonly <100 |
| 15–30% (Class II) | +10 to +20 (HR 100–120) | narrow PP; SBP preserved | +4 to +6 | Diastolic rises from vasoconstriction |
| 30–40% (Class III) | +20 to +40 (HR 120–140) | SBP falls 20–40 | +6 to +10 | First frank hypotension |
| >40% (Class IV) | HR >140 **or paradoxical bradycardia** | SBP <70 | >35 | **~30% show bradycardia** via Bezold-Jarisch-like vagal reflex |

**Flag — large clinical-teaching / data divergence:** Tachycardia is widely taught as the earliest sign of hemorrhage. In trauma registries, roughly **30–40% of patients with >15% blood loss present with HR <100** — Brasel et al., *J Trauma* 2007, PMID 17435552; Victorino et al., *Arch Surg* 2003, PMID 12967992. The ATLS class system itself has been largely invalidated by registry data — Mutschler et al., *Crit Care* 2013, PMID 23394077 — real patients don't cleanly match the classes. Paradoxical bradycardia in Class IV hemorrhage is mediated by the same vagal C-fibers as the Bezold-Jarisch reflex — Barriot & Riou, *Intensive Care Med* 1987, PMID 3584544.

## Reflexes you should consider adding

- **Renin–angiotensin–aldosterone (RAAS) slow loop** — operates on 10-min to hours time scale; restores BP after sustained volume loss. Ignore at peril if simulating scenarios >30 min.
- **Anrep effect** — myocardial contractility autoregulation in response to sudden afterload increase (intrinsic, τ ~1–2 min); relevant for acute hypertension and afterload-mismatch scenarios.
- **Cold-pressor response** — rapid SBP rise +15–25 mmHg to peripheral cold; distinct arc from pain; τ ~60 s — Victor et al., *Hypertension* 1987, PMID 3570421.
- **Diving reflex / oculocardiac reflex** — facial cold + breath-hold produces bradycardia; relevant for drowning, certain resuscitation scenarios.
- **Hering-Breuer inflation reflex** — tidal-volume-dependent inhibition of inspiration; matters for mechanical ventilation simulation.

## Open questions

- No dataset cleanly separates the fast vagal vs. slow sympathetic arms of arterial baroreflex with tight CIs; estimates are indirect (phase analysis of Mayer waves).
- Peripheral chemoreflex "A" parameter has 10× interindividual spread with no published way to predict from demographics.
- Bainbridge reflex: whether it is clinically meaningful in humans at normal RA pressures remains unsettled.
- Cushing reflex: no clean ICP-vs-HR dose-response curve in humans; animal extrapolations vary by species.
- CHF chemoreflex amplification: gain increase is well-documented but mapping to individual-patient multipliers is not yet standardized.
