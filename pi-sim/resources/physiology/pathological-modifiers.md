<!-- resources/physiology/parameters/pathological-modifiers.md -->

# Pathological modifiers

Disease-state overrides on the baseline parameters in `ode-math.md`. Each active condition applies a set of multipliers, offsets, and new saturation limits to the healthy values. Multiple conditions can coexist and compose (e.g., sepsis + CHF).

**Composition rule:** apply modifiers multiplicatively on gains/compliances, additively on thresholds and set-points. When two conditions modify the same parameter, take the most extreme value (`min` for gains that are being depressed; `max` for set-points being elevated) rather than multiplying the two multipliers — this matches clinical observation that pathology saturates rather than compounding linearly.

**Time course:** each modifier has a ramp-up `τ_onset` and, where applicable, a recovery `τ_recovery`. Apply as a first-order interpolation from baseline to pathological value:

```
modifier(t) = 1 + (target_mult − 1) · (1 − exp(−t/τ_onset))
```

Recovery uses `τ_recovery` when the pathological driver resolves (e.g., sepsis source control, volume restoration).

---

## 1. Sepsis / Septic Shock

Phased progression with distinct early and late kinetics. The modifiers below assume the patient has progressed to septic shock (MAP <65 requiring vasopressors); earlier sepsis uses fractional multipliers.

### Cardiovascular

| Parameter | Baseline | Septic shock | Mechanism | Source |
|---|---|---|---|---|
| Baroreflex gain `G_bar` | 15 ms/mmHg | **3–5 ms/mmHg** (0.2–0.3× baseline) | Central A3AR upregulation in NTS; TNF-α/IL-1 blunts vagal arc | La Rovere et al., *Lancet* 1998, PMID 9482439 (normal reference); Carrara et al., *Shock* 2018, PMID 29112634 (Shockomics cohort, n=21) |
| Ees (end-systolic elastance) | 2.3 ± 1 mmHg/mL | **0.7 ± 0.2 mmHg/mL** (~0.3× baseline) | Myocardial depression; β1 downregulation, Ca²⁺ desensitization, mitochondrial dysfunction | Guarracino et al., *Crit Care* 2019 (PMC 7333110); Werdan et al., *Can J Physiol Pharmacol* 2009, PMID 19198654 |
| Ea (arterial elastance) | 2.2 ± 0.8 mmHg/mL | **1.4 ± 0.3 mmHg/mL** | Vasoplegia, but maintained by tachycardia | Guarracino 2019 |
| Ea/Ees ratio | 1.0 ± 0.36 | **1.8 ± 0.3** (decoupled) | Proportionally greater fall in Ees than Ea | Guarracino 2019 |
| SVR | 900–1,400 dynes·s·cm⁻⁵ | **<800 dynes·s·cm⁻⁵** (often 400–700) | iNOS-driven NO flood; smooth muscle hyperpolarization | Lambden et al., *Crit Care* 2018, PMID 30053964 (vasoplegia review) |
| Total vascular compliance | ~1.5 mL/mmHg/kg | **0.7–0.9 mL/mmHg/kg** (~0.5× baseline) | Endothelial dysfunction, stiffening | Magder & De Varennes, *Crit Care Med* 1998, PMID 9445278 |
| Pulse pressure amplification | +15–20% central → peripheral | **Inverted** (central PP > peripheral) | Spatial compliance disarray | Nichols & O'Rourke, *McDonald's Blood Flow*, 6th ed. (textbook) |

### Volume kinetics (applied to Hahn model in `ode-math.md`)

| Parameter | Healthy | Septic | Note |
|---|---|---|---|
| k12 (central → peripheral) | 0.043 /min | **~0.09 /min** (2×) | Accelerated capillary leak via glycocalyx shedding |
| k21 (peripheral → central) | 0.043 /min | **~0.02 /min** (0.5×) | Impaired return flow |
| k10 (elimination) | 0.027 /min | **~0.008 /min** (0.3×) | Reduced urinary output |
| Plasma retention at 60 min | 10–20% | **<5%** | Net effect of above |

Source: Hahn et al., *Crit Care* 2025, PMID 41085930 (porcine stabilized sepsis); Hahn 2020, PMID 31863457 (review).

### Glycocalyx / Starling (revised)

| Parameter | Healthy | Septic |
|---|---|---|
| Osmotic reflection coefficient σ | ~0.9 | **0.3–0.6** |
| Hydraulic conductance Lp | baseline | **2–5×** |

Source: Chelazzi et al., *Crit Care Res Pract* 2015, PMID 25705516; Uchimido et al., *Crit Care* 2019, PMID 30808399.

### Thermoregulation

| Parameter | Healthy | Septic |
|---|---|---|
| T_setpoint | 36.8 °C | **+1 to +2.5 °C** (IL-6 cytokine storm) OR **−0.5 to −1 °C** (hypothermic phenotype, ~10% of cases) |
| τ_rise (fever onset) | 30 min | **20–30 min** (similar) |

Hypothermic sepsis is a distinct phenotype with higher mortality — Kushimoto et al., *Crit Care* 2013, PMID 23787080. A simulator should sample phenotype probabilistically (~85% febrile, 10% hypothermic, 5% normothermic).

### Respiratory

| Parameter | Healthy | Septic shock |
|---|---|---|
| RR_baseline | 14 /min | **22–30 /min** (compensatory for metabolic acidosis) |
| Central chemoreflex slope `S_c` | 2.3 L/min/mmHg | **1.0–1.5 L/min/mmHg** (~0.5×) if chronic lactic acidosis |
| V̇E drive | from chemoreflex | +metabolic acidosis drive proportional to (pH_target − pH) × 8 L/min per 0.1 pH unit |

### Pharmacodynamic refractoriness

When `SVR < 800 dynes·s·cm⁻⁵`, apply a vasopressor Emax multiplier:

```
vasopressor_Emax_mult = max(0.3, (SVR − 500) / 300)
```

At SVR 500, Emax falls to 0.3× (severely refractory); at SVR 800, Emax is fully preserved (1.0). Each 100 dynes·s·cm⁻⁵ drop in SVR below 800 corresponds to ~20% additional pressor refractoriness (independently increasing mortality risk by 20% per 100 dynes — Lambden 2018).

### Time course

| Parameter | τ_onset | τ_recovery |
|---|---|---|
| Baroreflex blunting | 12–24 h | 3–7 days after source control |
| Ees depression | 6–12 h | 5–10 days (reversible if survival) |
| Glycocalyx shedding | 1–4 h | 24–72 h partial; full recovery weeks |
| Vasoplegia (iNOS) | 6–12 h | 48–96 h after infection clearance |

---

## 2. Chronic Heart Failure (CHF) with reduced EF

Baseline state modifiers for a patient with NYHA III–IV HFrEF (LVEF <30%). These are **chronic set-point shifts**, not acute transitions — apply continuously when CHF profile is active.

### Cardiovascular

| Parameter | Healthy | CHF (HFrEF) | Source |
|---|---|---|---|
| Baroreflex gain `G_bar` | 15 ms/mmHg | **<3 ms/mmHg** (often approaching 0) | La Rovere et al., *Lancet* 1998, PMID 9482439 (ATRAMI); Mortara et al., *Circulation* 1997, PMID 9403568 |
| Baroreflex upper HR saturation α | 140 bpm supine | **100–120 bpm** (shifted right; resting tachycardia = high baseline) | Mortara 1997 |
| Baroreflex inflection γ | 100 mmHg | **+15 to +25 mmHg** (rightward shift) | Chronic RVLM AT1 upregulation |
| Ees | 2.3 mmHg/mL | **0.8–1.2 mmHg/mL** (~0.4× baseline) | LV remodeling |
| Ea/Ees ratio | 1.0 | **>1.5** | Chronic decoupling |
| Central chemoreflex gain `S_c` | 2.3 L/min/mmHg | **4–7 L/min/mmHg** (2–3× baseline) | Cheyne-Stokes mechanism | Javaheri, *Circulation* 1999, PMID 10066674; Francis, *Circulation* 2000, PMID 10683365 |

### Set-point shifts (steady-state baselines)

| Vital | Healthy | NYHA II–III | NYHA IV |
|---|---|---|---|
| HR resting | 70 | 75–95 | 95–110 |
| SBP | 115 | 100–120 | often <100 |
| RR | 14 | 18–22 | 20–26 |
| SpO2 | 98% | 92–96% | 88–94% |

Source: Yancy et al., ACC/AHA HF Guidelines, *J Am Coll Cardiol* 2013, PMID 23747642.

### Time constants

| Process | Healthy | CHF |
|---|---|---|
| Baroreflex sympathetic arm τ | 10 s | **30–60 s** (severe inertia) |
| MAP response to fluid bolus | 5–8 min | **10–15 min** (blunted) |
| Renal sodium handling | hours | days (slow) |

### Drug response modifiers

- β-blocker effect on HR: **preserved or amplified** (patient sensitized to small doses).
- Diuretic response: **diuretic resistance** after chronic use; Emax for furosemide drops to 0.3–0.5× in advanced CHF, requiring higher doses or continuous infusion — Ellison, *N Engl J Med* 2019 (diuretic resistance review).
- Nitrate response: enhanced preload sensitivity; BP drop per unit dose 1.5–2× baseline.

---

## 3. Hemorrhagic shock (trauma)

Dynamic, stage-dependent. Apply as function of estimated blood loss fraction `BL` (0–1 of total blood volume).

### Stage-dependent modifiers

| Parameter | Class I (<15%) | Class II (15–30%) | Class III (30–40%) | Class IV (>40%) |
|---|---|---|---|---|
| Catecholamine multiplier on SVR | 1.2× | 1.8–2.5× | 3–4× | **collapses to 0.3–0.5×** |
| Baroreflex gain | preserved | preserved | mildly depressed | exhausted (near-zero) |
| HR target | baseline + N(5,5²) | +15 to +30 | +30 to +60 | >140 **or** BJR-mode (see below) |
| SBP target | baseline | preserved (DBP up, PP narrow) | −20 to −40 mmHg | <70 |
| RR target | 14 | 16–20 | 22–28 | >30 |

### Sympathetic surge — catecholamine kinetics

Measured catecholamine rise during controlled hemorrhage (primate and human LBNP models):
- Norepinephrine: **+56% above baseline** within 15 min (Chien et al., *Am J Physiol* 1981, PMID 7246770; Convertino et al., *J Trauma* 2006, PMID 16688115)
- Epinephrine: **6× baseline** within 15 min
- Duration of sympathetic compensation (sustainable catecholamine flux): **<60 min** before receptor internalization/desensitization begins

### Decompensation inflection

When `BL ≥ 0.30`:
- Apply exponential decay on the catecholamine multiplier with τ ≈ 15 min
- Trigger a stochastic "decompensation cliff" — once catecholamine multiplier drops below 1.5, MAP collapse is rapid (τ 2–5 min)

### Bezold-Jarisch activation (state-switch, not smooth)

**Trigger condition:**
```
if (BL > 0.40) AND (LVEDV_estimate < 25 mL OR SVI < 15 mL/m²) AND (catecholamine_level > 3× baseline):
    BJR_active = true
```

**When active:**
- HR_target → **min(50, baseline)** (paradoxical bradycardia)
- SVR multiplier → 0
- Bypass normal baroreflex (set `G_bar_effective = 0`)
- Lock until volume restored to BL <30% for >3 min

Source: Barriot & Riou, *Intensive Care Med* 1987, PMID 3584544 (paradoxical bradycardia in hemorrhage); Mark, *J Am Coll Cardiol* 1983, PMID 6826948 (BJR mechanism).

### Glycocalyx shedding (trauma)

Same modifiers as sepsis but faster τ_onset (minutes rather than hours) — Torres Filho et al., *Microvasc Res* 2013, PMID 23603471.

### Crystalloid ceiling

After `cumulative_crystalloid > 1–1.5 L` in active hemorrhage, apply progressive penalties:
- Clotting factor dilution → coagulopathy onset
- Reduced RBC-carrying capacity → tissue hypoxia accelerates
- Interstitial edema → worsened gas exchange

Practical implementation: after 1.5 L crystalloid, MAP response to further bolus drops to 0.5× and declines toward 0 by 3 L. Blood products bypass this ceiling.

Source: Bickell et al., *N Engl J Med* 1994, PMID 7935634; Holcomb et al., PROPPR, *JAMA* 2015, PMID 25647203.

---

## 4. COPD (chronic)

Chronic baseline state; apply continuously when COPD profile active.

### Respiratory

| Parameter | Healthy | COPD (GOLD 3–4) |
|---|---|---|
| SpO2 baseline | 98% | **88–92%** (often lower in CO2 retainers) |
| PaCO2 baseline | 40 mmHg | **45–55 mmHg** (chronic retention) |
| Central chemoreflex slope `S_c` | 2.3 L/min/mmHg | **0.8–1.2 L/min/mmHg** (~0.4×) |
| Peripheral chemoreflex gain | baseline | **preserved or elevated** (hypoxic drive dominant) |
| RR baseline | 14 | **18–24** |

### Hypoxic drive dependence (critical for O2 therapy simulation)

When COPD profile is active, peripheral chemoreflex supplies >60% of total ventilatory drive. If FiO2 raises PaO2 above ~70 mmHg:
```
if (COPD_profile AND PaO2 > 70):
    V̇E_drive *= max(0.3, 1 - (PaO2 - 70)/100)
    PaCO2 rises by up to +15 mmHg over 30–60 min → CO2 narcosis risk
```

Source: Austin et al., *BMJ* 2010, PMID 20959284 (high-flow O2 harm in prehospital COPD); O'Driscoll et al., BTS emergency oxygen guideline, *Thorax* 2017, PMID 28507176.

### Cardiovascular

- HR baseline: +5 to +10 vs. age-matched (β2 agonist use + hypoxic drive)
- Right heart strain in GOLD 4 — consider adding cor pulmonale submodule if simulating exacerbations

---

## 5. Pregnancy (physiologic, not pathologic — included for baseline shifts)

Apply continuously during pregnancy profile. Trimester-dependent.

| Parameter | Non-pregnant | 1st trimester | 2nd trimester | 3rd trimester |
|---|---|---|---|---|
| HR | 70 | +5 to +10 | +15 | +15 to +20 |
| SBP | 115 | −5 | −5 to −10 (nadir ~20 wk) | returns to baseline |
| DBP | 72 | −5 to −10 | −10 to −15 | returns to baseline |
| RR | 14 | 14 | 15–16 | 15–16 |
| T | 36.8 | +0.3 to +0.5 | +0.3 to +0.5 | +0.3 to +0.5 |
| Total blood volume | 4.5 L | +10% | +30% | **+45 to +50%** |
| Cardiac output | 5 L/min | +10% | +30% | +30–50% |

**Aortocaval compression** (supine, 3rd trimester): MAP can drop 10–15 mmHg; apply positional modifier.

Source: Sanghavi & Rutherford, *Circulation* 2014, PMID 25223771; Hill & Pickinpaugh, *Surg Clin North Am* 2008, PMID 18358260.

---

## 6. Chronic hypertension on therapy

Apply as baseline shift when "HTN" profile is active.

| Parameter | Healthy | HTN on therapy |
|---|---|---|
| Baroreflex inflection γ | 100 mmHg | **+15 to +25 mmHg** (rightward reset) |
| Baroreflex gain β | 0.15/mmHg | **~0.10/mmHg** (flatter) |
| SVR baseline | 900–1,400 | 1,200–1,600 |
| SBP target | 115 | 125–135 |

### Drug-specific modifiers (ongoing therapy)

- **β-blocker therapy**: cap HR_max at 120, blunt catecholamine response (×0.5)
- **ACEi/ARB**: no HR effect; blunt RAAS response to hypovolemia; prolonged recovery from hypotension
- **Calcium channel blocker**: vasodilation, reduced SVR baseline (−100 to −200 dynes·s·cm⁻⁵)

Source: Kent et al., *Cardiology* 1972, PMID 5083547 (chronic HTN baroreflex reset); Whelton et al., ACC/AHA 2017, PMID 29146535.

---

## 7. Acidosis coupling (composes with any condition producing metabolic acidosis)

Metabolic acidosis modifies multiple primitives. Apply when arterial pH < 7.30.

| Parameter | pH 7.40 | pH 7.30 | pH 7.20 | pH 7.10 |
|---|---|---|---|---|
| Ees multiplier | 1.0 | 0.85 | **0.70** | 0.50 |
| Vasopressor Emax | 1.0 | 0.9 | **0.6** | 0.3 |
| Ventilatory drive (respiratory compensation) | baseline | +20% | +60% | +100% |
| HR target (compensatory) | baseline | +10 | +20 | +30 |

**Acidosis-inotropy coupling:** ex vivo human failing myocardium shows ~30% drop in twitch force for pH drop from 7.40 → 7.20 — Mulieri et al., *Circulation* 1992, PMID 1541429; Orchard & Kentish, *Am J Physiol* 1990, PMID 2404458.

**Bohr shift on SpO2:** acidosis right-shifts the Severinghaus curve (see `ode-math.md` § 3); apply Kelman correction factor directly rather than as a separate modifier.

---

## 8. Opioid effect (chronic use)

Apply when "chronic opioid" flag active.

| Parameter | Naïve | Chronic opioid |
|---|---|---|
| Central chemoreflex slope `S_c` | 2.3 | **1.2–1.5** (~0.6×) |
| Apneic threshold | 32–35 mmHg | +3–5 mmHg higher |
| Baseline respiratory drive | normal | reduced |
| Naloxone reversal dose needed | 0.04–0.4 mg | may need 2–4× more |

Source: Teichtahl et al., *Chest* 2005, PMID 15653989 (chronic opioid ventilatory response); Mogri et al., *Sleep Breath* 2008.

---

## 9. Specific infection modifiers (Faget / pulse-temperature dissociation)

Override Liebermeister gain when specific organism active:

| Organism | `G_liebermeister` multiplier | Source |
|---|---|---|
| *Salmonella typhi* | **0.3×** (3 bpm/°C) | Cunha, *Infect Dis Clin North Am* 1996, PMID 8891473 |
| *Brucella* | 0.3–0.5× | Cunha 1996 |
| *Legionella pneumophila* | 0.5× | Cunha 1996 |
| Yellow fever | 0.3× | Cunha 1996 |
| Tularemia | 0.5× | Cunha 1996 |
| Drug fever | 0.3–0.5× | Mackowiak & LeMaistre, *Ann Intern Med* 1987, PMID 3555388 |

---

## Composition examples

**Sepsis + chronic CHF** (septic patient with pre-existing HFrEF):
- Baroreflex gain: min(0.3× [sepsis], 0.2× [CHF]) → use **0.2× = 3 ms/mmHg**
- Ees: min(0.7 [sepsis], 1.0 [CHF]) → use **0.7 mmHg/mL** (sepsis dominates acute fall)
- Central chemoreflex: CHF amplifies (2.5×), sepsis acidosis blunts (0.5×) → net **1.25× baseline**
- Note: this patient's mortality risk is additive — decompensation is faster than sepsis alone

**Hemorrhagic shock + acidosis (late trauma)**:
- Apply hemorrhage Class III modifiers
- Layer pH 7.20 modifiers → Ees falls additionally 30%, vasopressor Emax drops to 0.4×
- Net effect: "lethal triad" (acidosis + coagulopathy + hypothermia) kicks in around pH <7.20

**Anaphylaxis + β-blocker therapy**:
- Standard anaphylaxis vasoplegia (SVR drops ~50%)
- β-blocker blocks reflex tachycardia → HR does NOT rise compensatorily
- Epinephrine Emax reduced (unopposed α effect, but blunted β) → may need glucagon rescue
- Hallmark: normal HR with profound hypotension in anaphylaxis = β-blocker modifier active

---

## Open questions

- **Sepsis phenotype heterogeneity:** the "hyperdynamic" vs. "hypodynamic" septic shock split isn't fully captured by these parameters; clustering work (Seymour et al., *JAMA* 2019, PMID 31104070) suggests 4 distinct phenotypes (α, β, γ, δ) with different trajectory shapes. Simulator may want to sample phenotype and adjust modifiers per cluster.
- **Timing of BJR trigger:** LVEDV threshold of 20–25 mL is heuristic; actual trigger depends on wall stress geometry not captured by simple volume.
- **Composition rule validation:** the "take the most extreme value" rule for multi-condition composition is a conservative heuristic; whether multiplicative compounding is ever correct (e.g., mild sepsis + mild CHF) is not well-studied.
- **Recovery τ values** are largely clinical estimates rather than measured; real recovery is heterogeneous (some patients stuck in "chronic critical illness" have permanent baroreflex dysfunction).
- **Glycocalyx parameters** (σ, Lp) lack bedside measurement; the 0.3–0.6 and 2–5× ranges are derived from biomarker studies (syndecan-1 shedding) rather than direct measurement.
- **CHF baroreflex**: β value <3 ms/mmHg is well-established but the specific inflection γ shift depends on chronic BP control; high-BP CHF and low-BP CHF have different reset points.
