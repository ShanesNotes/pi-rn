import test from "node:test";
import assert from "node:assert/strict";

import { INTENTS } from "./agent-canvas-constants.js";
import {
  buildContextBundle,
  deriveMarState,
  isToolAllowed,
  mockAgentRespond,
} from "./agent-canvas-connector.js";

test("connector keeps pinned intent order", () => {
  assert.deepEqual([...INTENTS], [
    "administration",
    "documentation",
    "clarification",
    "question",
    "other",
  ]);
});

test("MAR-blocked administration requests are advisory only", () => {
  const contextBundle = buildContextBundle("overview", {
    mar: { activeBlocks: [{ kind: "clinical-note", reason: "scan required" }] },
  });
  const response = mockAgentRespond({
    view: "overview",
    intent: "administration",
    marState: "blocked",
    prompt: "draft the dose",
    contextBundle,
  });

  assert.equal(deriveMarState(contextBundle), "blocked");
  assert.equal(response.kind, "advisory");
  assert.ok(!("suggestedDrafts" in response), "blocked med admin must not return suggestedDrafts");
  assert.match(response.banner, /Medication administration remains blocked/);
});

test("MAR-blocked administration derives block state from context bundle when caller state is stale", () => {
  const contextBundle = buildContextBundle("mar", {
    mar: { activeBlocks: [{ kind: "clinical-note", reason: "barcode scan required" }] },
  });
  const response = mockAgentRespond({
    view: "mar",
    intent: "administration",
    marState: "unblocked",
    prompt: "chart this medication administration",
    contextBundle,
  });

  assert.equal(response.kind, "advisory");
  assert.ok(!("suggestedDrafts" in response), "context-level MAR block must fail closed");
  assert.match(response.banner, /blocked until bedside scan and clinician attestation/);
});

test("administration requests never produce medication administration drafts", () => {
  const contextBundle = buildContextBundle("mar");
  const response = mockAgentRespond({
    view: "mar",
    intent: "administration",
    marState: deriveMarState(contextBundle),
    prompt: "prepare the med admin charting",
    contextBundle,
  });

  assert.equal(response.kind, "advisory");
  assert.ok(!("suggestedDrafts" in response), "med administration path must stay advisory");
});

test("documentation requests can return source-linked draft suggestions", () => {
  const contextBundle = buildContextBundle("notes", {
    recentArtifacts: [{ kind: "clinical-note", id: "handoff-draft", sourceRefs: ["vitals://enc/s/abc"] }],
  });
  const response = mockAgentRespond({
    view: "notes",
    intent: "documentation",
    marState: deriveMarState(contextBundle),
    prompt: "prepare my handoff",
    contextBundle,
  });

  assert.equal(response.kind, "draft");
  assert.equal(response.suggestedDrafts.length, 1);
  assert.equal(response.suggestedDrafts[0]?.kind, "clinical-note");
  assert.ok((response.suggestedDrafts[0]?.sourceRefs.length ?? 0) > 0);
});

test("documentation intent cannot be used to draft medication administration", () => {
  const contextBundle = buildContextBundle("mar", {
    mar: { activeBlocks: [{ kind: "clinical-note", reason: "barcode scan required" }] },
  });
  const response = mockAgentRespond({
    view: "mar",
    intent: "documentation",
    marState: deriveMarState(contextBundle),
    prompt: "draft the dose documentation for MAR",
    contextBundle,
  });

  assert.equal(response.kind, "advisory");
  assert.ok(!("suggestedDrafts" in response), "medication administration docs must not bypass MAR");
  assert.match(response.banner, /MAR workflow/);
});

test("buildContextBundle exposes fixture artifact without source refs for warning badge path", () => {
  const bundle = buildContextBundle("overview");
  assert.equal(bundle.view, "overview");
  assert.ok(bundle.recentArtifacts.some((artifact) => artifact.id === "sbar-draft" && artifact.sourceRefs.length === 0));
});

test("tool allowlist permits read-like names and rejects write-like camel segments", () => {
  assert.equal(isToolAllowed("connectAndWrite"), false);
  assert.equal(isToolAllowed("getUpdate"), false);
  assert.equal(isToolAllowed("getPatient"), true);
  assert.equal(isToolAllowed("readNotes"), true);
  assert.equal(isToolAllowed("writePatient"), false);
});
