/* pi-chart substrate adapter ── π-chart cockpit prototype
 * ─────────────────────────────────────────────────────────────────────
 * Bridges the cockpit's chart surface (patient bar, labs, MAR, notes,
 * orders, I&O, event stream, doc band) onto the pi-chart clinical
 * truth substrate.
 *
 * Seam ────────────────────────────────────────────────────────────────
 *   The substrate is being rebuilt under `src/claim-ledger/` per
 *   ADR 019 (V0.5 clean-canvas claim-ledger kernel). Once the kernel
 *   stabilises, this adapter wraps:
 *
 *     - currentState(patientId, encounterId, asOf) → labs, MAR, orders
 *     - timeline(patientId, encounterId, asOf, window) → event stream
 *     - narrative(patientId, encounterId)            → notes
 *     - openLoops(patientId, encounterId, asOf)      → doc-band loops
 *
 *   Adapter calls MUST go through view primitives. Components MUST
 *   NOT read NDJSON files, schemas, or v0.4 prototype generators
 *   directly — those are evidence, not implementation authority
 *   (ADR 018, ADR 019).
 *
 * Connector contract ──────────────────────────────────────────────────
 *   useChartSubstrate({ patientId, encounterId, asOf }) — never
 *   hardcoded. Demo target patient_002, encounter enc_p002_001.
 *   Regression target patient_001 (modularity check).
 *
 * Future ──────────────────────────────────────────────────────────────
 *   Replace fixture body with real reads from the claim-ledger kernel
 *   once it lands. Snapshot shape stays stable; that is what the
 *   cockpit binds to.
 */

(function (global) {
  const { useMemo } = global.React;

  // ── doc band (chart clock + cycle metadata, owned by pi-chart) ────
  const FIXTURE_DOCBAND = {
    cycle: "0.5-12",
    loop:  "t+0:32",
    close: "16:22",
    run:   "0.5-12",
    asOf:  "14:54:31",
  };

  // ── patient bar ───────────────────────────────────────────────────
  const FIXTURE_PATIENT = {
    name:   "Smith, Linda",
    meta:   "Bed 12B · MRN 4471 · 58 F · day 1 CAP",
    code:   "FULL",
    acuity: "sepsis · 1:1",
  };

  // ── labs ─────────────────────────────────────────────────────────
  const LAB_TIMES = ["14:42", "12:18", "10:30", "08:14", "yesterday"];
  const LABS_FS = [
    { section:"chem 7" },
    { k:"Sodium", ref:"135–145 mEq/L",
      spark:"0,16 90,15 180,15 270,14 360,15",
      cells:[ {v:"—",cls:"empty"}, {v:"138"}, {v:"139"}, {v:"137"}, {v:"139"} ] },
    { k:"Potassium", ref:"3.5–5.0 mEq/L",
      spark:"0,18 90,16 180,15 270,14 360,15",
      cells:[ {v:"—",cls:"empty"}, {v:"4.1"}, {v:"4.2"}, {v:"3.9"}, {v:"4.0"} ] },
    { k:"Chloride", ref:"98–107 mEq/L",
      spark:"0,15 90,14 180,14 270,15 360,16",
      cells:[ {v:"—",cls:"empty"}, {v:"104"}, {v:"103"}, {v:"101"}, {v:"100"} ] },
    { k:"Bicarbonate", ref:"22–28 mEq/L", signal:true,
      spark:"0,8 90,12 180,16 270,18 360,20",
      cells:[ {v:"—",cls:"empty"}, {v:"19",cls:"low"}, {v:"21",cls:"low"}, {v:"23"}, {v:"24"} ] },
    { k:"BUN", ref:"7–20 mg/dL", signal:true,
      spark:"0,28 90,22 180,18 270,14 360,12",
      cells:[ {v:"—",cls:"empty"}, {v:"28",cls:"high"}, {v:"24",cls:"high"}, {v:"19"}, {v:"16"} ] },
    { k:"Creatinine", ref:"0.6–1.2 mg/dL", signal:true,
      spark:"0,28 90,22 180,16 270,12 360,8",
      cells:[ {v:"—",cls:"empty"}, {v:"1.6",cls:"high"}, {v:"1.3",cls:"high"}, {v:"1.0"}, {v:"0.9"} ] },
    { k:"Glucose", ref:"70–110 mg/dL", signal:true,
      spark:"0,28 90,24 180,18 270,14 360,12",
      cells:[ {v:"—",cls:"empty"}, {v:"168",cls:"high"}, {v:"142",cls:"high"}, {v:"118",cls:"high"}, {v:"104"} ] },

    { section:"cbc" },
    { k:"WBC", ref:"4.5–11.0 K/μL", signal:true,
      spark:"0,28 90,22 180,16 270,12 360,8",
      cells:[ {v:"—",cls:"empty"}, {v:"18.4",cls:"crit"}, {v:"14.2",cls:"high"}, {v:"9.8"}, {v:"7.1"} ] },
    { k:"Hgb", ref:"12.0–15.5 g/dL",
      spark:"0,8 90,11 180,14 270,16 360,18",
      cells:[ {v:"—",cls:"empty"}, {v:"11.2",cls:"low"}, {v:"11.4",cls:"low"}, {v:"12.4"}, {v:"12.8"} ] },
    { k:"Plt", ref:"150–400 K/μL",
      spark:"0,8 90,12 180,16 270,18 360,20",
      cells:[ {v:"—",cls:"empty"}, {v:"142",cls:"low"}, {v:"168"}, {v:"212"}, {v:"230"} ] },
    { k:"Bands", ref:"0–5 %", signal:true,
      spark:"0,28 90,22 180,16 270,8 360,4",
      cells:[ {v:"—",cls:"empty"}, {v:"12",cls:"high"}, {v:"8",cls:"high"}, {v:"3"}, {v:"2"} ] },

    { section:"sepsis markers" },
    { k:"Lactate", ref:"< 2.0 mmol/L", signal:true,
      spark:"0,28 90,22 180,16 270,12 360,8",
      cells:[ {v:"3.4",cls:"crit"}, {v:"2.6",cls:"high"}, {v:"2.2",cls:"high"}, {v:"1.8"}, {v:"—",cls:"empty"} ] },
    { k:"Procalcitonin", ref:"< 0.5 ng/mL", signal:true,
      spark:"0,8 360,28",
      cells:[ {v:"—",cls:"empty"}, {v:"4.2",cls:"crit"}, {v:"—",cls:"empty"}, {v:"—",cls:"empty"}, {v:"—",cls:"empty"} ] },
  ];

  const CULTURES = [
    { name:"Blood culture × 2", ts:"drawn 12:14", st:"pending", days:"day 0" },
    { name:"Urine culture", ts:"drawn 12:18", st:"pending", days:"day 0" },
    { name:"Sputum gram", ts:"resulted 13:40", st:"GPC chains", days:"prelim" },
  ];

  // ── MAR ──────────────────────────────────────────────────────────
  const MAR_SCHED = [
    { time:"08:00", med:"Cefepime 2g", note:"IV piggyback · q8h", route:"IV", st:"given", by:"RN Maya" },
    { time:"12:00", med:"Acetaminophen 650mg", note:"PO · q6h PRN fever", route:"PO", st:"given", by:"RN Maya" },
    { time:"14:00", med:"Cefepime 2g", note:"IV piggyback · q8h", route:"IV", st:"given", by:"RN Maya" },
    { time:"15:00", med:"Pantoprazole 40mg", note:"IV · daily", route:"IV", st:"due", by:"" },
    { time:"14:30", med:"Heparin 5000u SC", note:"q8h DVT ppx", route:"SC", st:"late", by:"" },
  ];
  const MAR_PRN = [
    { time:"14:48", med:"NS 1L bolus #2", note:"500/1000 mL infused", route:"IV", st:"continuous", by:"pump:B" },
    { time:"13:22", med:"Ondansetron 4mg", note:"PRN nausea", route:"IV", st:"given", by:"RN Maya" },
  ];
  const MAR_CONT = [
    { time:"started 14:01", med:"Norepinephrine 0.05 mcg/kg/min", note:"titrate to MAP ≥ 65", route:"IV", st:"continuous", by:"pump:A" },
    { time:"started 12:00", med:"D5 ½NS @ 75 mL/hr", note:"maintenance", route:"IV", st:"continuous", by:"pump:C" },
  ];

  // ── notes (mixed: human + agent drafts; agent drafts are flagged) ─
  const NOTES = [
    {
      by:"Dr Park", role:"hospitalist", ts:"14:38", signed:true, agent:false,
      body:[
        "Patient with worsening hemodynamics despite 2L crystalloid. Lactate trending up (1.8 → 3.4). Meeting septic shock criteria.",
        "Plan: start norepinephrine, broaden coverage, reassess in 1h. Discussed transfer to ICU with charge."
      ],
      chips:["plan","septic shock","ICU pending"]
    },
    {
      by:"RN Maya", role:"primary", ts:"14:31", signed:true, agent:false,
      body:[
        "Family at bedside. Daughter asking about prognosis and ICU likelihood. Reassured, MD update pending. Patient A&Ox3 but fatigued."
      ],
      chips:["family","communication"]
    },
    {
      by:"pi-agent", role:"co-pilot", ts:"14:54", signed:false, agent:true,
      body:[
        "Draft assessment: septic shock, fluid-refractory trending. Citing trend(MAP, 4h) and lab.lactate. Confidence 74%, will recompute when post-bolus MAP arrives."
      ],
      chips:["draft","scratchpad","run 0.5-12"]
    },
  ];

  // ── orders ───────────────────────────────────────────────────────
  const ORDERS = [
    { ts:"14:42", what:"Norepinephrine drip", note:"0.05 mcg/kg/min · titrate MAP ≥ 65", by:"Dr Park", st:"queued" },
    { ts:"14:40", what:"Lactate q2h × 4", note:"trend monitoring", by:"Dr Park", st:"active" },
    { ts:"14:38", what:"Cefepime 2g IV", note:"piggyback now, then q8h", by:"Dr Park", st:"active" },
    { ts:"14:24", what:"NS 1L bolus #2", note:"over 30m", by:"Dr Park", st:"active" },
    { ts:"12:14", what:"Blood cx × 2 + UA + lactate", note:"sepsis panel", by:"Dr Park", st:"active" },
    { ts:"08:00", what:"Acetaminophen PO PRN", note:"q6h fever > 38.5", by:"Dr Singh (admit)", st:"active" },
    { ts:"08:00", what:"Continuous telemetry", note:"discontinued — transitioned to ICU monitor", by:"Dr Singh", st:"dc" },
  ];

  // ── intake & output ──────────────────────────────────────────────
  const IO_TOTALS = {
    in:"2240", out:"480", net:"+1760", since:"shift start 07:00",
    inDelta:"+500 last 30m (bolus #2)",
    outDelta:"oliguric — 0.4 mL/kg/hr last 2h",
    netDelta:"positive net · ↑ from +1240",
  };
  const IO_HOURS = ["14:00", "13:00", "12:00", "11:00", "10:00", "09:00", "08:00", "07:00"];
  const IO_FS = [
    { section:"intake" },
    { k:"PO",
      cells:[ {v:"0"}, {v:"0"}, {v:"0"}, {v:"60"}, {v:"0"}, {v:"120"}, {v:"0"}, {v:"180"} ] },
    { k:"IV crystalloid", signal:true,
      cells:[ {v:"500",cls:"high"}, {v:"75"}, {v:"1000",cls:"high"}, {v:"75"}, {v:"75"}, {v:"75"}, {v:"75"}, {v:"75"} ] },
    { k:"IV other",
      cells:[ {v:"12"}, {v:"0"}, {v:"0"}, {v:"0"}, {v:"0"}, {v:"0"}, {v:"0"}, {v:"0"} ] },
    { k:"Total in", total:true,
      cells:[ {v:"512"}, {v:"75"}, {v:"1000"}, {v:"135"}, {v:"75"}, {v:"195"}, {v:"75"}, {v:"255"} ] },

    { section:"output" },
    { k:"Urine", signal:true,
      cells:[ {v:"45",cls:"low"}, {v:"60",cls:"low"}, {v:"95"}, {v:"110"}, {v:"125"}, {v:"140"}, {v:"100"}, {v:"75"} ] },
    { k:"Stool",
      cells:[ {v:"0"}, {v:"0"}, {v:"0"}, {v:"0"}, {v:"0"}, {v:"0"}, {v:"0"}, {v:"0"} ] },
    { k:"Other",
      cells:[ {v:"0"}, {v:"0"}, {v:"0"}, {v:"0"}, {v:"0"}, {v:"0"}, {v:"0"}, {v:"0"} ] },
    { k:"Total out", total:true,
      cells:[ {v:"45"}, {v:"60"}, {v:"95"}, {v:"110"}, {v:"125"}, {v:"140"}, {v:"100"}, {v:"75"} ] },

    { section:"net" },
    { k:"Hourly net", total:true, signal:true,
      cells:[ {v:"+467",cls:"high"}, {v:"+15"}, {v:"+905",cls:"high"}, {v:"+25"}, {v:"−50"}, {v:"+55"}, {v:"−25"}, {v:"+180"} ] },
    { k:"Cumulative", total:true, signal:true,
      cells:[ {v:"+1760",cls:"high"}, {v:"+1293",cls:"high"}, {v:"+1278",cls:"high"}, {v:"+373"}, {v:"+348"}, {v:"+398"}, {v:"+343"}, {v:"+368"} ] },
  ];

  // ── event stream (timeline projection) ────────────────────────────
  const EVENTS = [
    { t:"14:54", type:"vital", summary:"HR climb 106→118 over 6m", src:"monitor", signal:true },
    { t:"14:51", type:"obs",   summary:"Cap refill 4s · skin mottled to knees", src:"RN bedside" },
    { t:"14:48", type:"med",   summary:"NS 1L bolus #2 · 500/1000 mL infused", src:"pump:B" },
    { t:"14:42", type:"lab",   summary:"Lactate 3.4 (↑ from 2.6 @ 12:18)", src:"chem panel", signal:true },
    { t:"14:38", type:"order", summary:"Cefepime 2g IV piggyback queued", src:"Dr Park" },
    { t:"14:31", type:"comm",  summary:"Family at bedside, asking re: ICU", src:"phone log" },
    { t:"14:22", type:"shift", summary:"Loop opened — sepsis bundle hour 1", src:"pi-agent" },
  ];

  /**
   * useChartSubstrate({ patientId, encounterId, asOf })
   *   → { docband, patient, labs, mar, notes, orders, io, events }
   *
   * Each sub-key carries `summary` strings the cockpit binds to nav
   * counters (e.g. "3 crit", "1 late · 1 due").
   */
  function useChartSubstrate({ patientId, encounterId, asOf }) {
    void patientId; void encounterId; void asOf;

    return useMemo(() => ({
      docband: FIXTURE_DOCBAND,
      patient: FIXTURE_PATIENT,
      labs: {
        times: LAB_TIMES,
        rows: LABS_FS,
        cultures: CULTURES,
        summary: "3 crit",
      },
      mar: {
        scheduled: MAR_SCHED,
        prn: MAR_PRN,
        continuous: MAR_CONT,
        summary: "1 late · 1 due",
      },
      notes: NOTES,
      orders: { rows: ORDERS, summary: "1 queued" },
      io: { totals: IO_TOTALS, hours: IO_HOURS, rows: IO_FS, summary: IO_TOTALS.net },
      events: EVENTS,
    }), []);
  }

  global.PiChart = { useChartSubstrate };
})(window);
