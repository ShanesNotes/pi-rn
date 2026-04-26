import { GRID_DENSE_VIEWS } from "./agent-canvas-constants.js";
import type { ChartContextBundle, ChartView, ChartViewId } from "./agent-canvas-types.js";

export const chartViews = [
  { id: "overview", label: "Overview", density: "narrative" },
  { id: "handoff", label: "Care plan / handoff", density: "narrative" },
  { id: "vitals", label: "Vitals / flowsheet", density: "grid" },
  { id: "mar", label: "Meds / MAR", density: "grid" },
  { id: "notes", label: "Notes", density: "narrative" },
  { id: "labs", label: "Labs / dx", density: "grid" },
  { id: "radiology", label: "Radiology / imaging", density: "narrative" },
  { id: "agent", label: "Agent Canvas", density: "narrative" },
] as const satisfies readonly ChartView[];

export const chartViewById = new Map<ChartViewId, ChartView>(
  chartViews.map((view) => [view.id, view]),
);

export function densityForView(view: ChartViewId): ChartView["density"] {
  return chartViewById.get(view)?.density ?? ((GRID_DENSE_VIEWS as readonly ChartViewId[]).includes(view) ? "grid" : "narrative");
}

export const patient002ContextFixture = {
  view: "overview",
  mar: {
    activeBlocks: [
      {
        kind: "clinical-note",
        reason: "Piperacillin/Tazobactam administration requires barcode scan and clinician attestation before MAR documentation.",
      },
    ],
  },
  recentArtifacts: [
    {
      kind: "open-loop-disposition",
      id: "resp-reassessment-draft",
      sourceRefs: ["vitals://enc_p002_001/spo2#vital_647c98955de3bdeb", "vitals://enc_p002_001/respiratory_rate#vital_44c37c3ce5537f71"],
    },
    {
      kind: "clinical-note",
      id: "handoff-draft",
      sourceRefs: ["patient_002/timeline/2026-04-19/notes/0930_handoff.md", "vitals://enc_p002_001/spo2#vital_647c98955de3bdeb"],
    },
  ],
  requiresReview: ["clinical-note", "open-loop-disposition"],
} as const satisfies ChartContextBundle;
