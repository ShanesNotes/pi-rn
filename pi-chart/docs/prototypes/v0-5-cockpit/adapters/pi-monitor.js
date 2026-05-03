/* pi-monitor vitals adapter ── π-chart cockpit prototype
 * ─────────────────────────────────────────────────────────────────────
 * Bridges the cockpit's "vitals stream" surface (continuous monitor
 * tiles + waveforms + vitals flowsheet) onto the pi-monitor public
 * contract. The cockpit binds to the snapshot shape returned by
 * `useVitalsStream`; replacing the fixture body with a real subscriber
 * does not change that surface.
 *
 * Seam ────────────────────────────────────────────────────────────────
 *   π-chart MUST NOT read pi-sim internals or hidden simulator state
 *   (ADR 018, source-authority). It consumes only pi-monitor's public
 *   surface — see:
 *     - ../../../../pi-monitor/README.md       (read-only file ingest)
 *     - ../../../../pi-sim/vitals/README.md    (producer authority)
 *     - ../../../../pi-sim/vitals/.lanes.json  (lane contract)
 *
 *   Public files pi-monitor exposes today:
 *     current.json / current.json.monitor   ← scalar tile lanes
 *     vitals.jsonl                          ← append-only timeline
 *     timeline.jsonl                        ← waveform frames
 *     status.json                           ← provider freshness
 *     events.jsonl                          ← alarms / shift markers
 *
 *   Live (dev-only) channels:
 *     localhost TCP NDJSON 127.0.0.1:8791   ← `monitor-cli live-tcp`
 *
 * Connector contract ──────────────────────────────────────────────────
 *   Every read accepts (patientId, encounterId, asOf). The adapter
 *   never hardcodes either. patient_002 is the cockpit demo target;
 *   patient_001 is the modularity regression target.
 *
 * Future ──────────────────────────────────────────────────────────────
 *   Replace FIXTURE_* with a poll/EventSource fetcher reading the
 *   public files above. Push setState on every frame; the snapshot
 *   shape (`tiles | waveforms | flowsheet`) stays stable.
 */

(function (global) {
  const { useState, useMemo } = global.React;

  // ── waveform path generators (stand in for real monitor frames) ──
  function ecgD() {
    const W = 600, H = 38, m = H / 2, beats = 13, bp = W / beats;
    let d = `M0,${m}`;
    for (let i = 0; i < beats; i++) {
      const x = i * bp;
      d += ` L${x + 8},${m} Q${x + 12},${m - 3} ${x + 16},${m}`;
      d += ` L${x + 22},${m} L${x + 24},${m + 2} L${x + 26},${m - 15} L${x + 28},${m + 6} L${x + 30},${m}`;
      d += ` L${x + 36},${m} Q${x + 40},${m - 5} ${x + 44},${m} L${x + bp},${m}`;
    }
    return d;
  }
  function plethD() {
    const W = 600, H = 38, m = H / 2, beats = 10, bp = W / beats;
    let d = `M0,${m + 10}`;
    for (let i = 0; i < beats; i++) {
      const x = i * bp;
      d += ` Q${x + 4},${m - 15} ${x + 10},${m - 12}`;
      d += ` Q${x + 14},${m - 7} ${x + 18},${m - 2}`;
      d += ` Q${x + 22},${m + 3} ${x + 26},${m + 1}`;
      d += ` Q${x + 32},${m + 10} ${x + bp},${m + 10}`;
    }
    return d;
  }
  function respD() {
    const W = 600, H = 38, m = H / 2;
    let d = `M0,${m}`;
    for (let x = 0; x <= W; x += 4) {
      const y = m + Math.sin((x / W) * Math.PI * 4.5) * 11;
      d += ` L${x},${y.toFixed(1)}`;
    }
    return d;
  }
  const WAVES = {
    ecg: ecgD(), pleth: plethD(), resp: respD(),
    trend: "M0,8 L50,9 L100,11 L150,12 L200,14 L250,15 L300,17 L350,18 L400,20 L450,21 L500,24 L550,28 L600,30",
  };

  // ── tile snapshot (stand-in for current.json.monitor) ─────────────
  const FIXTURE_TILES = [
    { k: "HR",   n: "118", u: "bpm",   alarm: "crit", signal: true,  wave: "ecg"   },
    { k: "SpO₂", n: "94", u: "%", alarm: "ok",   signal: false, wave: "pleth" },
    { k: "RR",   n: "22",  u: "/min",  alarm: "warn", signal: false, wave: "resp"  },
    { k: "MAP",  n: "62",  u: "mmHg",  alarm: "crit", signal: true,  wave: "trend" },
  ];

  // ── flowsheet snapshot (stand-in for vitals.jsonl windowing) ──────
  const FIXTURE_FLOWSHEET_TIMES = ["15:00", "14:30", "14:00", "13:30", "13:00", "12:30", "12:00", "11:00", "10:00", "08:00"];

  const FIXTURE_FLOWSHEET_ROWS = [
    { k:"HR", ref:"baseline 88 bpm", unit:"bpm", signal:true,
      spark:"0,28 30,26 60,24 90,21 120,18 150,15 180,12 210,10 240,9 270,8 300,7 330,6 360,5",
      cells:[ {v:"118",cls:"high"}, {v:"114",cls:"high"}, {v:"108",cls:"high"}, {v:"102",cls:"high"}, {v:"96"}, {v:"94"}, {v:"92"}, {v:"90"}, {v:"88"}, {v:"86"} ] },
    { k:"BP", ref:"goal sys ≥ 90", unit:"mmHg", signal:true,
      spark:"0,8 30,10 60,12 90,14 120,16 150,18 180,20 210,22 240,24 270,25 300,26 330,27 360,28",
      cells:[ {v:"94/52",cls:"low"}, {v:"96/54",cls:"low"}, {v:"100/58"}, {v:"104/60"}, {v:"108/64"}, {v:"112/66"}, {v:"116/68"}, {v:"118/70"}, {v:"122/72"}, {v:"124/74"} ] },
    { k:"MAP", ref:"goal ≥ 65 mmHg", unit:"mmHg", signal:true,
      spark:"0,8 30,10 60,12 90,14 120,17 150,20 180,22 210,24 240,26 270,28 300,29 330,30 360,30",
      cells:[ {v:"62",cls:"crit"}, {v:"64",cls:"low"}, {v:"68"}, {v:"72"}, {v:"76"}, {v:"80"}, {v:"84"}, {v:"86"}, {v:"88"}, {v:"90"} ] },
    { k:"SpO₂", ref:"goal ≥ 92 %", unit:"%",
      spark:"0,15 60,14 120,16 180,15 240,14 300,16 360,15",
      cells:[ {v:"94"}, {v:"95"}, {v:"94"}, {v:"95"}, {v:"96"}, {v:"96"}, {v:"95"}, {v:"96"}, {v:"97"}, {v:"97"} ] },
    { k:"RR", ref:"baseline 16 /min", unit:"/min",
      spark:"0,22 60,20 120,18 180,15 240,12 300,10 360,8",
      cells:[ {v:"22",cls:"high"}, {v:"21",cls:"high"}, {v:"20",cls:"high"}, {v:"19"}, {v:"18"}, {v:"17"}, {v:"16"}, {v:"16"}, {v:"15"}, {v:"16"} ] },
    { k:"Temp", ref:"normal 36.5–37.5 °C", unit:"°C",
      spark:"0,28 60,24 120,20 180,16 240,12 300,10 360,8",
      cells:[ {v:"38.4",cls:"high"}, {v:"38.2",cls:"high"}, {v:"38.0",cls:"high"}, {v:"37.8",cls:"high"}, {v:"37.6",cls:"high"}, {v:"37.4"}, {v:"37.2"}, {v:"37.0"}, {v:"36.9"}, {v:"37.0"} ] },
    { k:"Pain", ref:"0–10 scale", unit:"",
      spark:"0,18 60,18 120,16 180,14 240,12 300,12 360,10",
      cells:[ {v:"4"}, {v:"4"}, {v:"3"}, {v:"3"}, {v:"3"}, {v:"2"}, {v:"2"}, {v:"2"}, {v:"1"}, {v:"2"} ] },
  ];

  /**
   * useVitalsStream({ patientId, encounterId, asOf, window })
   *   → { tiles, waveforms, flowsheet, meta }
   *
   * tiles      : VitalTile[]                — the four streaming readouts
   * waveforms  : { [wave]: SVG path d }     — per-tile waveform paths
   * flowsheet  : { times: string[], rows[] }— Epic-style time-series grid
   * meta       : { source, asOf, patientId, encounterId } provenance
   */
  function useVitalsStream({ patientId, encounterId, asOf, window: w = "4h" }) {
    void w;

    // Today: synchronous fixture. Future: useEffect → subscribe to public
    // contract files / private TCP NDJSON, setState on each frame.
    const [snapshot] = useState(() => ({
      tiles: FIXTURE_TILES,
      waveforms: WAVES,
      flowsheet: { times: FIXTURE_FLOWSHEET_TIMES, rows: FIXTURE_FLOWSHEET_ROWS },
    }));

    const meta = useMemo(
      () => ({ source: "fixture", asOf, patientId, encounterId }),
      [asOf, patientId, encounterId]
    );

    return { ...snapshot, meta };
  }

  global.PiMonitor = { useVitalsStream };
})(window);
