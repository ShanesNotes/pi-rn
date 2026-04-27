import type { ChartContextBundle } from "./agent-canvas-types.js";

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
