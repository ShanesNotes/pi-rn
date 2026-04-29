---
id: note_20260418T1140_pharmacy_med_rec
type: communication
subtype: pharmacy_med_rec_note
subject: patient_001
encounter_id: enc_001
effective_at: '2026-04-18T11:40:00-05:00'
recorded_at: '2026-04-18T11:42:00-05:00'
author:
  id: clinical_pharmacist
  role: pharmd
source:
  kind: clinician_chart_action
  ref: pharmacy_med_rec
status: final
references:
  - evt_20260418T0925_01
  - evt_20260418T0925_02
  - evt_20260418T0925_03
  - evt_20260418T1130_01
  - evt_20260418T1130_02
  - evt_20260418T1135_01
---

# Pharmacy medication reconciliation — 11:40

Reviewed admission antibiotic orderset against patient_001 allergy profile and renal function.

Allergy guard.

- Penicillin anaphylaxis (1998) confirmed in the constraint set and re-verified at admission. Class hold on all beta-lactams documented as a separate medication_order intent [evt_20260418T0925_03] and fulfilled by the bedside RN as a class hold action [evt_20260418T1130_02].

Antibiotic strategy.

- Levofloxacin 750 mg IV q24h selected as the primary CAP coverage for typical pathogens [evt_20260418T0925_01]; first dose given at 11:30 [evt_20260418T1130_01].
- Azithromycin 500 mg IV q24h selected for atypical coverage [evt_20260418T0925_02]; first dose given at 11:35 [evt_20260418T1135_01].
- Renal dosing: Cr 1.0 with normal renal function; standard doses of both agents are appropriate; no adjustment indicated.

Plan.

- Continue current regimen; reassess for transition to oral levofloxacin after AM repeat labs and CXR on 2026-04-19.
- Watch for QT-prolongation interaction (levofloxacin + azithromycin); patient is not on additional QT-prolonging agents per current chart, no telemetry alert needed at this time.
- No stewardship-driven de-escalation pending blood-culture results.
