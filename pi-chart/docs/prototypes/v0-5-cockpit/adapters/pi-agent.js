/* pi-agent canvas adapter ── π-chart cockpit prototype
 * ─────────────────────────────────────────────────────────────────────
 * Bridges the cockpit's right-rail "scratchpad + chat" onto pi-agent.
 * Owns three pieces of state:
 *   - chat       : process loop between RN and pi-agent (never product)
 *   - artifacts  : agent-drafted chartable outputs (the product surface)
 *   - cycle      : draft → staged → committed → discarded lifecycle
 *
 * Seam ────────────────────────────────────────────────────────────────
 *   pi-agent receives only bounded chart-visible context through
 *   explicit interfaces (ADR 018). The adapter is the only place the
 *   cockpit talks to the agent — components below it must not import
 *   agent runtime modules.
 *
 *   Today this adapter is fixture-backed. Future wiring options:
 *     - HTTP: POST /agent/runs, GET /agent/artifacts (cycle-scoped)
 *     - SSE / WebSocket: stream chat tokens + artifact diffs
 *     - In-process: direct call into pi-agent harness for dev runs
 *
 *   Cycle and run identifiers (`cycle 0.5-12`, `run 0.5-12`) are
 *   issued by the agent runtime, not the cockpit.
 *
 * Connector contract ──────────────────────────────────────────────────
 *   useAgentCanvas({ patientId, encounterId, asOf }) — never hardcoded.
 *   patient_002 is the demo target; patient_001 is regression.
 *
 * Invariant ───────────────────────────────────────────────────────────
 *   "Chat is process. Chartable output lands in the scratchpad — never
 *    in chat." `send()` MUST NOT echo agent product into the chat
 *   stream. Output → artifact only.
 */

(function (global) {
  const { useState, useMemo, useCallback } = global.React;

  const INITIAL_RUN = "0.5-12";

  const INITIAL_ARTS = [
    { id:"a1", kind:"assessment", title:"Septic shock — fluid-refractory trending",
      sub:"trend(MAP, 4h) · cite(lab.lactate) · cite(vitals.MAP)",
      conf:74, run:"0.5-12", status:"draft" },
    { id:"a2", kind:"order set", title:"Norepinephrine 0.05 mcg/kg/min",
      sub:"per institutional sepsis protocol · MD signature required",
      conf:68, run:"0.5-11", status:"draft" },
    { id:"a3", kind:"handoff", title:"Night shift handoff — Bed 12B",
      sub:"openLoops() · pendingResults() · 4 items",
      conf:82, run:"0.5-08", status:"staged" },
    { id:"a4", kind:"addendum", title:"Family conversation note",
      sub:"daughter at bedside · ICU transfer discussed",
      conf:91, run:"0.5-10", status:"committed" },
    { id:"a5", kind:"draft", title:"Family education — sepsis bundle",
      sub:"plain-language · held until stable",
      conf:55, run:"0.5-07", status:"discarded" },
  ];

  const INITIAL_CHAT = [
    { who:"RN · Maya", agent:false, time:"14:53",
      txt:"Lactate redrew at 14:42 came back 3.4 — up from 2.6. Want a fresh draft of the assessment with the new value and the second bolus.",
      scope:"scope · problem #2 · cite(lab.lactate, vitals.MAP)" },
    { who:"pi-agent", agent:true, time:"14:53",
      txt:"Drafting. Including bolus #2 and trend(MAP, 4h). Confidence will drop until I see post-bolus MAP. Output is in the scratchpad.",
      scope:"output → scratchpad · run 0.5-12 · 0.7s" },
  ];

  /**
   * useAgentCanvas({ patientId, encounterId, asOf })
   *   → {
   *       arts, visible, chat, run, activeId, filter, counts,
   *       setActiveId, setFilter, send, stage, setStatus,
   *       commitAll, discardStaged,
   *     }
   */
  function useAgentCanvas({ patientId, encounterId, asOf }) {
    void patientId; void encounterId; void asOf;

    const [run] = useState(INITIAL_RUN);
    const [arts, setArts] = useState(INITIAL_ARTS);
    const [chat, setChat] = useState(INITIAL_CHAT);
    const [activeId, setActiveId] = useState("a1");
    const [filter, setFilter] = useState("all");

    const counts = useMemo(() => ({
      all: arts.length,
      draft: arts.filter(a => a.status === "draft").length,
      staged: arts.filter(a => a.status === "staged").length,
      committed: arts.filter(a => a.status === "committed").length,
      discarded: arts.filter(a => a.status === "discarded").length,
    }), [arts]);

    const visible = useMemo(
      () => filter === "all" ? arts : arts.filter(a => a.status === filter),
      [arts, filter]
    );

    const setStatus = useCallback((id, status) => {
      setArts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    }, []);

    const stage = useCallback((id) => {
      setArts(prev => prev.map(a =>
        a.id === id ? { ...a, status: a.status === "staged" ? "draft" : "staged" } : a
      ));
    }, []);

    const commitAll = useCallback(() => {
      setArts(prev => prev.map(a => a.status === "staged" ? { ...a, status: "committed" } : a));
    }, []);

    const discardStaged = useCallback(() => {
      setArts(prev => prev.map(a => a.status === "staged" ? { ...a, status: "discarded" } : a));
    }, []);

    /**
     * send(text) — append the RN turn to chat, then append the
     * agent's process acknowledgement. The agent's chartable output
     * lands as a new artifact (future), never as a chat message.
     */
    const send = useCallback((text) => {
      const t = (text || "").trim();
      if (!t) return;
      setChat(prev => [
        ...prev,
        { who:"RN · Maya", agent:false, time:"now", txt:t, scope:"scope · live" },
        { who:"pi-agent", agent:true, time:"now",
          txt:"Acknowledged. Drafting in scratchpad — output appears as a new artifact, never in chat.",
          scope:`output → scratchpad · run ${run}` },
      ]);
    }, [run]);

    return {
      arts, visible, chat, run, activeId, filter, counts,
      setActiveId, setFilter,
      send, stage, setStatus, commitAll, discardStaged,
    };
  }

  global.PiAgent = { useAgentCanvas };
})(window);
