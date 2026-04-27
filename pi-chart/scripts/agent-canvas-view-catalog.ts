import { GRID_DENSE_VIEWS } from "./agent-canvas-constants.js";
import type { ChartView, ChartViewId } from "./agent-canvas-types.js";

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
