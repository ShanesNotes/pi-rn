<!-- resources/physiology/parameters/response-time-constants.md -->

# Vital response time constants

First-order approximation: *d(vital)/dt = (target − vital) / τ*. Values are measured (not theoretical) in healthy adults unless noted. Where two time constants are clearly separable (fast + slow, or rise + fall), both are given.

## HR response to baroreflex stimulation

Dual-compartment model fits data better than single τ.

- **Cardiovagal arm (parasympathetic):** phase delay **<1 s**; primary-phase τ **0.5–1.5 s**; effect within 1–2 heartbeats — Eckberg, *J Physiol* 1980, PMID 7381779.
- **Sympathetic arm:** τ **5–15 s**; full development of vascular resistance change 15–30 s — Borst & Karemaker, *J Auton Nerv Syst* 1983, PMID 6886566.
- **Total adaptation to postural step change:** steady state ~60 s.

## BP response to volume change

### Acute hemorrhage (BP fall) — biphasic

Two distinct kinetic phases:
- **Rapid phase (venous capacitance / RA stretch):** τ **30–90 s**, largely a function of venous system emptying — classical physiology data (Wiggers, *Physiology of Shock*, 1950); Convertino et al., *J Trauma* 2006, PMID 16688115 (LBNP simulating 20–30% loss, SBP fall τ 90–150 s).
- **Slow phase (transcapillary redistribution):** τ **5–15 min** as interstitial fluid enters the vascular space (transcapillary refill).
- **Decompensation discontinuity:** gradual hemorrhage <5 mL/kg/min shows compensation phase with long apparent τ (5–10 min), then abrupt **"decompensation cliff"** when compensatory mechanisms fail. First-order model cannot capture this without a threshold/switch term.

### Bolus resuscitation (BP rise)
- **500 mL crystalloid over 15 min in hypovolemic adult:** MAP rise peaks at **~15–20 min**; τ_rise ≈ **5–8 min** — Aya et al., *Br J Anaesth* 2014, PMID 24631766.
- **Decay after bolus:** MAP effect lost with τ **20–40 min**; at 60 min, only ~20% of infused volume remains intravascular — Hahn, *Anesthesiology* 2010, PMID 20613481.
- **Colloid/albumin:** decay τ longer (**1–4 h**); more sustained MAP response.

**Flag vs. clinical teaching:** Bedside teaching often holds that "a liter of saline raises BP for an hour or two." Volume-kinetic modeling shows intravascular persistence is far shorter: in septic / endothelial-dysfunction states, **≤5% remains intravascular at 60 min** — Sánchez et al., *J Crit Care* 2011, PMID 20869839; Hahn, *Br J Anaesth* 2020, PMID 31767114. Use τ_decay 20–40 min healthy, 5–15 min sepsis.

## RR response to hypoxia

- **Step from FiO2 0.21 → 0.10 (PaO2 ~45 mmHg):** V̇E rises with τ **20–30 s**; peaks at 1–3 min — Weil et al., *J Clin Invest* 1970, PMID 5435984.
- **Hypoxic ventilatory decline (HVD):** after 5–15 min sustained hypoxia, V̇E drops to ~70–80% of peak even with PaO2 unchanged — second time constant τ **10–15 min**, negative gain — Easton et al., *J Appl Physiol* 1986, PMID 3700307.

Recommended model: two-compartment — fast peripheral chemoreflex (τ 25 s) summed with slow central depression (τ 12 min, negative gain).

## RR response to hypercapnia

- **Rebreathing-induced PaCO2 rise:** V̇E response τ **60–90 s** — Read rebreathing method, Read, *Australas Ann Med* 1967, PMID 6059894.
- **Steady-state method (fixed inspired CO2):** equilibration 4–6 min; τ **90–120 s** to reach 63% of final response — Mohan & Duffin, *Respir Physiol* 1997, PMID 9407565.

## SpO2 response to FiO2 change — asymmetric wash-in / wash-out

**The key physiology insight: SpO2 response is NOT symmetric.** Wash-in (rising SpO2 with supplemental O2) is faster than wash-out (falling SpO2 with reduced FiO2 or apnea) because sigmoidal hemoglobin-O2 binding delays desaturation — a simulator using one τ for both directions will over-predict apneic desaturation speed and under-predict recovery on O2.

### Onset varies dramatically by O2 delivery device

| Device | Effective FiO2 | Wash-in τ to SpO2 plateau |
|---|---|---|
| Nasal cannula 2 L/min | 0.24–0.28 | **60–120 s** |
| Nasal cannula 6 L/min | 0.35–0.44 | **45–90 s** |
| Simple mask 6–10 L/min | 0.35–0.55 | **45–75 s** |
| Non-rebreather 15 L/min | 0.60–0.85 | **30–60 s** |
| Intubated, FiO2 step change | set value | **15–45 s** (limited by N2 washout + circulation delay ~8–12 s arm-probe lag) |

### Wash-out (apneic desaturation from preoxygenated state)
- **τ ≈ 60–180 s** to fall to 90% SpO2 in preoxygenated healthy adults; strongly dependent on FRC, BMI, and metabolic rate — Benumof, *Anesthesiology* 1997, PMID 9135717.
- **Obese patients:** apneic desaturation can reach 90% within **30–60 s** even when preoxygenated.

### Clinical data on asymmetry (COPD and healthy adults)
- Measured wash-in/wash-out time constants from COPD literature confirm wash-out >> wash-in; full clinical equilibrium on wash-in typically 1–3 min, wash-out 3–5 min — Petersson & Glenny, *Eur Respir J* 2014 (context); specific clinical measurements in supplemental-O2 trials in severe COPD (Austin et al., *BMJ* 2010, PMID 20959284).

### Probe-site lag (bedside monitor display vs. actual arterial saturation)
- **Finger probe:** 8–20 s lag behind arterial O2 change — Sum-Ping et al., *Anesth Analg* 1989, PMID 2486450.
- **Earlobe / forehead probe:** 2–5 s lag.
- A simulator modeling the bedside display should add this lag *after* the physiological τ, not fold it in.

**Flag — skin pigmentation:** Pulse oximetry systematically overestimates SpO2 in darker skin — Sjoding et al., *N Engl J Med* 2020, PMID 33326721; occult hypoxemia (true SaO2 <88% when SpO2 reads 92–96%) is ~3× more common in Black vs. White ICU patients. A simulator that treats SpO2 as ground truth inherits this bias.

## Core temperature response to fever / antipyretic

Thermal inertia is large; core temperature operates with the slowest τ in the system.

### Fever onset
- **Endotoxin (LPS) challenge in humans:** rectal temp begins to rise ~30 min after IV challenge; peaks at **90–120 min**; effective τ **30–45 min** for the rising limb — Suffredini et al., *N Engl J Med* 1989, PMID 2664522.
- **Rigor phase** produces a sharp upward inflection (heat generation outpaces dissipation); first-order model undershoots unless a separate heat-generation term is added.

### Antipyretic response (acetaminophen)
- **Oral acetaminophen 1 g:** temp begins to fall **30–60 min**; nadir **2–3 h**; duration 4–6 h — Clark & Cumming, *Clin Pharmacol Ther* 1981, PMID 7273604.
- **IV acetaminophen 1 g:** onset **15 min**, nadir **1 h**; faster because no gastric absorption — Groeneveld et al., *Eur J Clin Pharmacol* 2011, PMID 21494761.
- **Typical temperature drop:** 0.5–1.5 °C; rarely returns fully to normothermia if underlying pyrogen persists.
- **Effective τ (falling limb):** **30–60 min**.

**Flag:** Many simulators model fever/antipyresis as symmetrical. In reality, **rise is faster than fall** (rigor-driven rise vs. passive heat dissipation on the way down). Use asymmetric τ: τ_rise 30 min, τ_fall 45–60 min.

## Open questions

- No clean human data on BP response τ to sudden afterload changes (aortic cross-clamp); mostly surgical case series, not controlled physiology.
- Central chemoreflex τ depends on CSF bicarbonate kinetics; "acute" (s–min) vs. "chronic" (hours) adaptation have different τ but are rarely separated in the literature.
- Pulse-oximeter probe-site lag times are rarely systematically measured; the values above are synthesized from anesthesia literature and may underestimate real-world bedside delays.
- First-order approximation breaks down at thresholds (decompensation cliff in hemorrhage; CO2 narcosis above ~70 mmHg PaCO2; hypoxic ventilatory depression at PaO2 <35). Simulator may need piecewise functions.
- SpO2 asymmetry is well-established qualitatively but published τ for wash-in vs. wash-out across device types are sparse — values above are midpoints of reported ranges.
