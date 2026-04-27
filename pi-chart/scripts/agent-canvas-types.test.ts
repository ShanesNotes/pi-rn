import test from "node:test";
import assert from "node:assert/strict";

import {
  ADVISORY_BANNER_COPY,
  BLOCK_STATES,
  GRID_DENSE_VIEWS,
  INTENTS,
  REQUIRES_REVIEW,
} from "./agent-canvas-constants.js";
import { patient002ContextFixture } from "./agent-canvas-fixtures.js";
import { chartViews, densityForView } from "./agent-canvas-view-catalog.js";
import type { Intent } from "./agent-canvas-types.js";

type _NoReviewIntent = Extract<Intent, "review"> extends never ? true : never;
const noReviewIntent: _NoReviewIntent = true;

test("agent canvas constants pin clinical intent and block-state vocabulary", () => {
  assert.equal(noReviewIntent, true);
  assert.deepEqual([...INTENTS], [
    "administration",
    "documentation",
    "clarification",
    "question",
    "other",
  ]);
  assert.ok(!INTENTS.includes("review" as never), "review is reserved for provenance.review semantics");
  assert.deepEqual([...BLOCK_STATES], ["blocked", "unblocked"]);
});

test("advisory banner copy is pinned as source-data verification language", () => {
  assert.equal(
    ADVISORY_BANNER_COPY,
    "Advisory co-pilot. Verify with source data. Final clinical write requires clinician action.",
  );
});

test("chart view fixture declares density for smart-collapse behavior", () => {
  assert.equal(densityForView("overview"), "narrative");
  assert.equal(densityForView("notes"), "narrative");
  assert.equal(densityForView("mar"), "grid");
  assert.equal(densityForView("vitals"), "grid");
  assert.ok(GRID_DENSE_VIEWS.includes("flowsheet"));
  assert.ok(chartViews.some((view) => view.id === "vitals" && view.label === "Vitals / flowsheet"));
});

test("patient_002 context fixture keeps MAR block and review-required artifacts explicit", () => {
  assert.equal(patient002ContextFixture.view, "overview");
  assert.ok(patient002ContextFixture.mar.activeBlocks.length > 0);
  assert.ok(patient002ContextFixture.mar.activeBlocks[0]?.reason.includes("barcode scan"));
  assert.ok(REQUIRES_REVIEW.has("clinical-note"));
  assert.ok(REQUIRES_REVIEW.has("open-loop-disposition"));
  assert.ok(patient002ContextFixture.recentArtifacts.every((artifact) => artifact.sourceRefs.length > 0));
});
