# pi-chart ↔ pi-agent connector contract sketch

Status: draft interface note for the prototype. This is not a real agent integration yet.

## Ownership

- `pi-chart` owns the clinical cockpit UI, chart navigation, worklist, floating charting panes, and the agent dock shell.
- `pi-agent` owns model/provider selection, prompt orchestration, reasoning/tool loops, and draft generation.
- A connector boundary passes bounded chart context to the agent and returns advisory messages, draft artifacts, and worklist suggestions.
- `pi-agent` must not read `pi-sim` hidden physiology or simulator internals. Simulated observable facts should enter `pi-chart` first.

## Product boundary

- Pi-chart is the cockpit.
- Pi-agent is the co-pilot.
- Chat is process/advice, not chart truth.
- Generated artifacts are draft workspaces until a clinician Charts them.
- `Chart` / `Charted` / `final clinical write` are the clinical finalization words.
- Medication administration remains blocked unless MAR scan/attestation is represented by the appropriate clinical workflow.

## Chart → agent request

```ts
export type AgentDockRequest = {
  requestId: string;
  patientId: string;
  encounterId: string;
  asOf: string;
  user: {
    id: string;
    role: "rn" | "provider" | "rt" | "unknown";
  };
  currentView:
    | "overview"
    | "handoff"
    | "vitals"
    | "mar"
    | "notes"
    | "labs"
    | "radiology"
    | "agent";
  prompt: string;
  context: ChartContextBundle;
};

export type ChartContextBundle = {
  patient: {
    id: string;
    encounterId: string;
    codeStatus?: string;
    location?: string;
    acuity?: string;
    oxygenSupport?: string;
  };
  latestVitals: Array<{
    metric: "spo2" | "heart_rate" | "resp_rate" | "blood_pressure" | string;
    value: string;
    unit?: string;
    recordedAt: string;
    source?: "charted" | "device" | "agent_inferred" | "unknown";
  }>;
  activeProblems: Array<{
    id: string;
    label: string;
    status?: string;
  }>;
  openLoops: Array<{
    id: string;
    title: string;
    dueAt?: string;
    priority?: "critical" | "high" | "routine";
    escalationCriteria?: string;
  }>;
  worklist: Array<{
    id: string;
    title: string;
    section: string;
    status: "due" | "staged" | "draft" | "blocked" | "done";
    blockedReason?: string;
  }>;
  recentTimeline: Array<{
    time: string;
    kind: string;
    text: string;
    source: string;
  }>;
  evidence?: Array<{
    ref: string;
    label: string;
    source: string;
  }>;
};
```

## Agent → chart response

```ts
export type AgentDockResponse = {
  requestId: string;
  role: "agent";
  message: {
    kind: "advisory";
    markdown: string;
  };
  drafts?: ArtifactDraft[];
  worklistSuggestions?: WorklistSuggestion[];
  safetyNotes?: SafetyNote[];
};

export type ArtifactDraft = {
  id: string;
  title: string;
  suggestedSurface:
    | "handoff"
    | "assessment"
    | "sbar"
    | "flowsheet"
    | "note_addendum";
  bodyMarkdown: string;
  sourceRefs: string[];
  chartable: boolean;
  requiresClinicianChartAction: true;
};

export type WorklistSuggestion = {
  id: string;
  title: string;
  priority: "critical" | "high" | "routine";
  reason: string;
  suggestedSection: "Due / Overdue" | "Generated Drafts" | "Staged Charting";
  sourceRefs: string[];
};

export type SafetyNote = {
  surface: "MAR" | "orders" | "code_status" | "allergy" | "problem_list" | "narrative";
  level: "blocked" | "requires_attestation" | "advisory_only";
  reason: string;
};
```

## Future pi extension role

A project-local pi extension could later expose safe tools to the pi-agent harness, for example:

- `pi_chart_context` — read a bounded chart context bundle for a patient/encounter.
- `pi_chart_propose_artifact` — create a draft artifact proposal, not final chart truth.
- `pi_chart_propose_worklist_item` — suggest worklist items for clinician review.
- `pi_chart_request_chart_action` — request a clinician-mediated Chart action; blocked for MAR med administration without scan/attestation.

The extension should be a harness-side adapter, not the cockpit UI implementation. The cockpit UI remains in `pi-chart`; the extension gives the pi-agent safe, explicit tools.

## Safety invariants

1. Agent responses are advisory unless converted into a draft artifact/worklist item.
2. Draft artifacts are not chart truth.
3. Chart truth changes only after a clinician action in pi-chart.
4. MAR medication administration cannot be charted from agent chat or artifact panes without scan/attestation.
5. The connector must carry source/evidence references for generated summaries.
6. Hidden simulator state is never exposed to pi-agent.
