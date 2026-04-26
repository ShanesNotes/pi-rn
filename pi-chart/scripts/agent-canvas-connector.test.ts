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
