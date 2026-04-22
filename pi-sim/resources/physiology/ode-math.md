<!-- resources/physiology/parameters/ode-math.md -->

# ODE math reference

Equations and population parameters for the cross-coupling and transport functions in the simulator. This file gives you math you can paste into TypeScript, not prose. Every equation below has at least one primary-literature citation. Units are SI-ish except where clinical convention dictates (mmHg for pressures, bpm for HR, °C for temperature).

Notation:
- `y` — observed vital (output of integrator)
- `y*` — target / equilibrium (what y decays toward)
- `τ` — time constant (seconds or minutes; noted per section)
- `x̄ ± σ` — population mean ± SD
- First-order ODE form: `dy/dt = (y* − y) / τ`

---

## 1. Arterial baroreflex — Kent four-parameter logistic

**Equation** (Kent et al., *Cardiology* 1972, PMID 5083547; formulation per Potts/Taboni, *Acta Physiol* 2018, DOI 10.1111/apha.12979):

```
HR(MAP) = δ + α / (1 + exp(β · (MAP − γ)))
```

Where:
- `δ` = bradycardic asymptote (floor, bpm)
- `α` = HR response range (top − bottom, bpm)
- `β` = slope coefficient (1/mmHg; **β > 0** because HR falls as MAP rises, so the logistic is inverted-S)
- `γ` = centering pressure / inflection MAP (mmHg)

**Population parameters — healthy adults at rest** (Potts et al., *Am J Physiol Heart Circ Physiol* 1993; n reanalyzed in Taboni 2018):

| Parameter | Rest | 50% VO2max exercise | Units |
|---|---|---|---|
| δ (floor) | 50.4 ± 9.3 | ~60 (shifts up) | bpm |
| α (range) | 12.6 ± 4.8 | ~15 | bpm |
| β (slope) | 0.15 ± 0.21 | ~0.05 (flattens) | 1/mmHg |
| γ (inflection) | 99.7 ± 7.9 | ~110 (shifts right) | mmHg |

**Maximum gain at inflection** (steepest slope, from derivative at `MAP = γ`): `G_max = −α·β / 4` → roughly **−0.47 bpm/mmHg** with the resting numbers above. This matches the sequence-method BRS estimates; pharmacological (phenylephrine) estimates run about **2× higher** (~−1 bpm/mmHg) because the pharmacological method probes the full arc including central summation. See `coupling/reflex-map.md` for the full methodology split.

**Threshold and saturation** (5% of plateau — Chen et al., *Am J Physiol Heart Circ Physiol* 2006, PMID 16714364):

```
Thr₅% = γ − 2.944 / β
Sat₅% = γ + 2.944 / β
```

With β = 0.15, operating range ≈ **γ ± 20 mmHg** (i.e., roughly MAP 80–120 in a resting healthy adult). Do NOT use the older Kent formula `γ ± 2.0/β` — it underestimates operating range by ~32% (Chen 2006).

**Orthostatic reset:** head-up tilt shifts γ upward and reduces β (baroreflex resets to higher operating pressure). Roughly γ_tilted ≈ γ_supine + 10 mmHg — Ogoh et al., *Am J Physiol Heart Circ Physiol* 2006, PMID 16443670.

**Age effect** (apply as multiplier on β; Monahan, *Am J Physiol Regul Integr Comp Physiol* 2007, PMID 17569765):

```
β(age) ≈ β_young × (1 − 0.01 × (age − 20))   for age 20–75
```

→ β falls ~50% from age 20 to 75.

**Time constants — two-compartment** (Borst & Karemaker 1983, PMID 6886566; Eckberg 1980, PMID 7381779):

```
τ_vagal = 1.0 s    (fast parasympathetic arm)
τ_symp  = 10 s     (slow sympathetic arm)
```

Model as two parallel first-order responses toward the same `y*` with weights ~0.6 (vagal) / 0.4 (sympathetic) in healthy adults at rest; weights shift toward sympathetic in exercise or sustained stress.

**RR vs. HR axiomatic note (Taboni 2018):** if you implement the reflex on RR-interval (RR = 60/HR × 1000 ms) instead of HR, the sigmoid parameters must be recomputed; `G_max` of RR-vs-MAP differs from the HR-vs-MAP `G_max` both in magnitude and sign-behavior. For a TypeScript engine that operates on HR directly, use the HR form above.

---

## 2. Peripheral chemoreflex — Weil hyperbola + Duffin piecewise

### Weil 1970 hyperbolic form (hypoxic ventilatory response)

```
V̇E = V̇E₀ + A / (PaO2 − 32)    for PaO2 > 40 mmHg
```

- **A parameter** population distribution (Weil et al., *J Clin Invest* 1970, PMID 5435984; Rebuck & Campbell, *Am Rev Respir Dis* 1974, PMID 4814083):

| Percentile | A (L·min⁻¹·mmHg) |
|---|---|
| 5th | 40 |
| 50th (median) | 186 |
| 95th | 650 |

**Interindividual spread is >10×.** Model A as a log-normal random-effect per patient: `ln(A) ~ N(ln(186), 0.75²)`.

**Do not extrapolate below PaO2 = 35 mmHg** — hypoxic ventilatory depression can occur (V̇E falls with deeper hypoxia due to central depression).

### Duffin modified rebreathing — piecewise linear (more accurate for modeling)

Ventilation is flat below a CO2 recruitment threshold (VRT), then rises linearly with PaCO2. Two independent chemoreflex arcs:

```
V̇E = V̇E_basal                                      if PCO2 < VRT
V̇E = V̇E_basal + S · (PCO2 − VRT)                   if PCO2 ≥ VRT
```

**Population parameters** (Duffin et al., *Respir Physiol* 2000, PMID 10786641; Keir et al., *J Physiol* 2019, PMID 31087324; Huggard et al., *J Appl Physiol* 2023, PMID 37942527):

| Arc | Parameter | Value | Units |
|---|---|---|---|
| Central (hyperoxic) | V̇E_basal | 6.5 ± 4 | L/min |
| Central | VRT_c | 46 ± 3 | mmHg PCO2 |
| Central | S_c (slope) | 2.3 ± 0.9 to 4.9 ± 2.6 | L·min⁻¹·mmHg⁻¹ |
| Peripheral (hypoxic) | VRT_p | 41 ± 3 | mmHg PCO2 |
| Peripheral | S_p (hypoxia-dependent) | varies with PaO2 | L·min⁻¹·mmHg⁻¹ |

**Total ventilatory drive** = max(central, peripheral) — not additive in the piecewise region (Keir 2019 confirms equivalence of central and peripheral thresholds measured separately).

**Peripheral slope dependence on PaO2** (Mohan & Duffin, *Respir Physiol* 1997, PMID 9407565): `S_p` rises sharply as PaO2 falls below ~70 mmHg; roughly:

```
S_p(PaO2) ≈ 1.5 + 8 · exp(−(PaO2 − 40) / 20)    (heuristic fit; units L·min⁻¹·mmHg⁻¹)
```

This gives S_p ≈ 1.7 at PaO2 100 (normoxia), ≈ 5 at PaO2 60 (mild hypoxia), ≈ 9 at PaO2 40 (severe hypoxia).

**Time constants:**
- Peripheral chemoreflex: τ **20–30 s** — Weil 1970, Easton 1986 (PMID 3700307).
- Central chemoreflex: τ **60–120 s** — CSF pH equilibration rate-limiting.
- Hypoxic ventilatory decline (HVD) second phase: τ **10–15 min**, negative gain (~−30%).

### Apneic threshold
`V̇E → 0` when PaCO2 falls ~3–8 mmHg below VRT_c. In awake adults this is about **32–35 mmHg**; during sleep, shifts up to **38–42 mmHg** — Dempsey et al., *Respir Physiol Neurobiol* 2004, PMID 15134604.

### CHF amplification
CHF patients show 2–3× increased central chemoreflex gain — multiply `S_c` by 2–3 and expect Cheyne-Stokes oscillation (Javaheri, *Circulation* 1999, PMID 10066674; Francis, *Circulation* 2000, PMID 10683365).

### Opioid / COPD blunting
Chronic opioid use or CO2-retainer COPD reduces `S_c` by 30–50%.

---

## 3. Oxyhemoglobin dissociation — Severinghaus 1979

For mapping PaO2 → SpO2 (or inverting). Severinghaus equation has 0.55% maximum error vs. measured data above SpO2 70% (Collins et al., *Breathe* 2015, PMC 4666443).

### PaO2 → SO2

```
S = 1 / (23400 / (P³ + 150·P) + 1)
```

Where `S` is fraction saturation (0–1) and `P` is PaO2 in mmHg. Source: Severinghaus, *J Appl Physiol* 1979, PMID 35496.

### S → PaO2 (Ellis inversion)

```
P = exp( 0.385 · ln(1/S − 1)⁻¹ + 3.32 − 72·S⁻¹ − 0.17·S⁶ )
```

Ellis, *J Appl Physiol* 1989 (accuracy ±1 mmHg for S between 0.3 and 0.97).

### Bohr / Kelman corrections for pH, PaCO2, temperature

Apply to PaO2 before evaluating the dissociation curve (Kelman, *J Appl Physiol* 1966):

```
x = PaO2 · 10^[ 0.024·(37 − T) + 0.40·(pH − 7.40) + 0.06·(log₁₀(40) − log₁₀(PaCO2)) ]
```

Then substitute `x` for `P` in the Severinghaus equation. `T` in °C. This accounts for right-shift with acidosis, hyperthermia, hypercapnia.

**P50** (PaO2 at 50% saturation) in standard conditions: **26.86 mmHg** — Severinghaus 1979. Rises with right-shift (acidosis, fever, 2,3-DPG), falls with left-shift.

**Why this matters for the simulator:** when an intervention changes pH or temperature, SpO2 changes even with constant PaO2 — the Bohr correction is the right way to model this rather than ad-hoc coupling.

---

## 4. Volume kinetics — Hahn two/three-compartment

### Two-compartment model (Hahn, *Anesthesiology* 2010, PMID 20613481)

For crystalloid bolus into plasma (Vc) with exchange to interstitium (Vt) and elimination:

```
dVc/dt = R(t) − k12·(Vc − Vc₀) + k21·(Vt − Vt₀) − k10·(Vc − Vc₀)
dVt/dt = k12·(Vc − Vc₀) − k21·(Vt − Vt₀)
```

Where `R(t)` is infusion rate (mL/min), and kij are first-order rate constants (1/min).

### Population parameters — healthy adult volunteers, Ringer's acetate (Hahn & Drobin, *Acta Anaesthesiol Scand* 2016, PMID 26763732; n=76 volunteers):

| Parameter | Value | Interpretation |
|---|---|---|
| Vc₀ (plasma) | ~3.0 L | central compartment |
| Vt₀ (fast interstitium) | ~8.5 L | peripheral compartment |
| k12 | 0.043 /min (t½ = 16 min) | central → peripheral |
| k21 | 0.043 /min | peripheral → central (assumed symmetric in basic model) |
| k10 | 0.027 /min (t½ = 26 min) | elimination |

### Intravascular retention fraction over time

At end of 15-min infusion of 500 mL: plasma expansion ≈ **50–60%** of infused volume.
30 min post-infusion: retention ≈ **15–20%**.
60 min post-infusion: retention ≈ **10–15%** (healthy), **<5%** (sepsis).

### Sepsis modifier
Late sepsis (porcine stabilized model — Hahn et al., *Crit Care* 2025, PMID 41085930): k23 (flow to "third space") increases ~5–10×; k21 (return flow) decreases ~2×. Net: fluid accumulates in remote interstitium rather than returning to plasma. Simulator approximation:

```
k10_sepsis ≈ 0.3 × k10_healthy    (reduced urinary elimination)
k12_sepsis ≈ 2.0 × k12_healthy    (accelerated capillary leak)
k21_sepsis ≈ 0.5 × k21_healthy    (impaired return)
```

### Three-compartment regime (>1.5 L total)
Once infused volume exceeds ~1.5 L, a slow-exchange "third space" (Vt2) opens and plasma t½ extends from ~30 min to **~14 h** (Hahn, *Front Physiol* 2024, PMID 39263627). This is a piecewise switch — the simulator should detect cumulative dose and open the Vt2 compartment.

### Saline vs. Ringer's
0.9% saline elimination t½ is **~2× longer** than Ringer's (Hahn 2020, PMID 31863457) due to chloride-induced renal vasoconstriction. Apply a 0.5× multiplier to k10 for saline.

### Colloid (albumin 5%, dextran)
**No distribution phase** — single-compartment model; t½ in plasma **2–3 h**. Apply k12 → 0 and k10 ≈ 0.004/min.

---

## 5. Liebermeister (HR-temperature coupling) — population slope with noise

Simple linear model with explicit between-patient variance (see `coupling/reflex-map.md`):

```
HR_target = HR_baseline + G_liebermeister · (T − T_baseline)
```

With:
- `G_liebermeister = 8.5 bpm/°C` (population mean) — Karjalainen & Viitasalo, *Acta Med Scand* 1986, PMID 3739773; Race et al., *BMJ Open* 2020, DOI 10.1136/bmjopen-2019-034886.
- `σ_G = 9 bpm/°C` (between-patient SD, from Race 2020 95% PI ≈ ±18 bpm)
- `T_baseline ≈ 36.8 °C` (Geneva et al., *Open Forum Infect Dis* 2019, PMID 30976604; revises the traditional 37.0)

For Monte Carlo or stochastic simulation, sample G per simulated patient from `N(8.5, 9²)` truncated at 0 (to prevent negative gains).

**Faget-mode override** (typhoid, yellow fever, Legionella, brucellosis, drug fever): set `G_liebermeister = 3 bpm/°C` or lower to reproduce pulse-temperature dissociation (Cunha 1996, PMID 8891473).

---

## 6. SpO2 dynamics — asymmetric wash-in / wash-out

First-order with direction-dependent τ:

```
if (SpO2_target > SpO2):   τ = τ_washin(device)       // rising on O2
else:                      τ = τ_washout(patient)     // falling off O2 / apneic
```

### Wash-in τ by device (see `parameters/response-time-constants.md`)

| Device | τ_washin (s) |
|---|---|
| Room air → nasal cannula 2 L | 90 |
| Nasal cannula 6 L | 60 |
| Simple mask 6–10 L | 60 |
| Non-rebreather 15 L | 45 |
| Intubated, FiO2 step | 30 |

### Wash-out τ (preoxygenated apnea — Benumof 1997, PMID 9135717)

```
τ_washout = τ₀ · (FRC / FRC_ref) · (VO2_ref / VO2)
```

Baseline `τ₀ ≈ 180 s` for healthy 70 kg adult preoxygenated to FiO2 1.0 (time to desaturate to SpO2 90%). Multipliers:
- Obesity (BMI >35): τ₀ → 30–60 s
- Critical illness / increased VO2: τ₀ × 0.5
- Healthy volunteer breathing room air then apneic: τ₀ ≈ 60 s

### Probe-site lag (additive, on top of physiological τ)

| Site | Lag (s) |
|---|---|
| Finger | 15 (range 8–20) |
| Earlobe | 3 |
| Forehead | 3 |
| Cerebral / arterial line | 0–1 |

Implement as a fixed delay buffer on the display output, NOT as added τ.

---

## 7. Acetaminophen antipyretic response — asymmetric temperature ODE

The fever/antipyresis system needs asymmetric τ (see response-time-constants.md):

```
dT/dt = (T_target − T) / τ
where τ = τ_rise if (T_target > T) else τ_fall
```

| Parameter | Value | Source |
|---|---|---|
| τ_rise (fever onset) | 30 min | Suffredini et al., *N Engl J Med* 1989, PMID 2664522 |
| τ_fall (antipyretic) | 45–60 min | Groeneveld et al., *Eur J Clin Pharmacol* 2011, PMID 21494761 |
| T_target (fever) | T_baseline + 1.5 to +3 °C | condition-dependent |
| T_target (after APAP 1 g IV) | T_fever − 1.0 °C | typical drop |

**Side effect on MAP:** IV acetaminophen causes a 5–15 mmHg MAP dip in 10–35% of critically ill adults during the 15–30 min post-infusion. Model as a transient negative MAP target shift, τ ≈ 15 min, magnitude proportional to baseline fever height (Kelly et al., *Intensive Care Med* 2014, PMID 25035122).

---

## 8. Hypovolemia decompensation — piecewise threshold model

Hemorrhage cannot be captured as pure first-order. Suggested piecewise:

```
if blood_loss_fraction < 0.15:    // Class I
    HR_target = HR_baseline + N(5, 5²)          // ~half have no tachycardia
    MAP_target = MAP_baseline
elif blood_loss_fraction < 0.30:  // Class II
    HR_target = HR_baseline + 15 · (loss − 0.15) / 0.15
    MAP_target = MAP_baseline + 5 · (loss − 0.15) / 0.15  // narrowed PP, DBP up
    DBP_target = DBP_baseline + 10
elif blood_loss_fraction < 0.40:  // Class III
    HR_target = 120 + 100 · (loss − 0.30) / 0.10
    MAP_target = MAP_baseline − 30 · (loss − 0.30) / 0.10
else:                             // Class IV
    if random() < 0.3:                         // 30% paradoxical bradycardia
        HR_target = 50                         // Bezold-Jarisch activation
    else:
        HR_target = 140 + 20
    MAP_target = max(40, MAP_baseline − 60)
```

The **decompensation cliff** between Class II and III is sharp and partially stochastic — individual patients don't traverse it identically. The ATLS class system itself is an approximation criticized by Mutschler et al., *Crit Care* 2013, PMID 23394077 (large registry found classes don't match real presentations well) — see `scenarios/canonical-cases.md` for the fuller discussion.

---

## 9. Cushing reflex — threshold-triggered MAP tracking

Not a smooth reflex; activates when CPP falls below threshold:

```
if MAP - ICP < 50:                              // CPP threshold
    MAP_target = ICP + 50                        // track ICP to restore CPP
    HR_target = max(40, HR_baseline - 30)        // reflex bradycardia (shown in <33% of cases)
else:
    // Cushing inactive, ordinary reflexes dominate
```

Source: Cushing observations (historical); Fodstad et al., *Neurosurgery* 2006, PMID 16462481. Note: bradycardia component is inconsistent in real data — consider making it probabilistic (p ≈ 0.3).

---

## Open questions

- The Potts/Taboni numeric parameters for the Kent logistic are from a small-n human study; large-cohort population values are not published. Treat the σs as lower bounds on true between-subject variance.
- Duffin-form slope `S_c` differs substantially between the original Duffin 2000 (~2.3) and newer Huggard/Keir 2023 (~4.9) — likely due to protocol refinements. A simulator could default to the midpoint (~3.5) or treat as a tunable parameter.
- Severinghaus equation accuracy degrades below SpO2 70% — for extreme-hypoxia simulation, consider the Dash-Bassingthwaighte or Siggaard-Andersen models instead.
- Hahn k21 (interstitial-to-plasma return) is often assumed symmetric with k12 in simple models; recent three-compartment work shows strong asymmetry in disease states. The simple model will mispredict in sepsis even with the sepsis multipliers above.
- The piecewise hemorrhage model smoothes what is really a bifurcation system; continuous first-order ODEs cannot reproduce the sudden decompensation cliff faithfully. A proper treatment would use a slow variable (baroreflex "reserve") that depletes and triggers a fast collapse.
- No published decision-rule for when a patient transitions from Cushing-triggered to brainstem failure (MAP collapse); the current rule is binary threshold but terminal cases have hysteresis.
