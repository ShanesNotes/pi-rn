// HANDOFF: ADR17-17a actor classification. Unblocks taxonomy ledger rows T01, T02, T09, T10, T11.
// Memo: source.kind is provenance, not review state. Authorship-class is derived classification (memo C3).

import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveAuthorshipClass } from "./projection.js";

test("ADR17-17a: nurse_charted event projects as human-authored (T09)", () => {
  const ev = { source: { kind: "nurse_charted" }, author: { id: "rn_amy", role: "rn" } };
  assert.equal(deriveAuthorshipClass(ev), "human-authored");
});

test("ADR17-17a: agent_inference event projects as agent-authored (T10)", () => {
  const ev = { source: { kind: "agent_inference" }, author: { id: "pi_agent", role: "agent", run_id: "run_x" } };
  assert.equal(deriveAuthorshipClass(ev), "agent-authored");
});

test("ADR17-17a: agent_synthesis event projects as agent-authored (T10)", () => {
  const ev = { source: { kind: "agent_synthesis" }, author: { id: "pi_agent", role: "rn_agent", run_id: "run_y" } };
  assert.equal(deriveAuthorshipClass(ev), "agent-authored");
});

test("ADR17-17a: clinician_chart_action event projects as human-authored (T09)", () => {
  const ev = { source: { kind: "clinician_chart_action" }, author: { id: "md_lee", role: "hospitalist" } };
  assert.equal(deriveAuthorshipClass(ev), "human-authored");
});

test("ADR17-17a: monitor_extension event projects as device-authored", () => {
  const ev = { source: { kind: "monitor_extension" }, author: { id: "monitor_03", role: "system" } };
  assert.equal(deriveAuthorshipClass(ev), "device-authored");
});

test("ADR17-17a: synthea_import event projects as imported", () => {
  const ev = { source: { kind: "synthea_import" }, author: { id: "synthea", role: "system" } };
  assert.equal(deriveAuthorshipClass(ev), "imported");
});

test("ADR17-17a: agent author with on_behalf_of human projects as agent-on-behalf-of-human (T11)", () => {
  const ev = {
    source: { kind: "agent_action" },
    author: {
      id: "rn_agent_01",
      role: "rn_agent",
      run_id: "run_z",
      on_behalf_of: { id: "rn_amy", role: "rn" },
    },
  };
  assert.equal(deriveAuthorshipClass(ev), "agent-on-behalf-of-human");
});

test("ADR17-17a: human author with on_behalf_of does NOT project as agent-on-behalf-of-human (must be agent role)", () => {
  const ev = {
    source: { kind: "nurse_charted" },
    author: { id: "rn_amy", role: "rn", on_behalf_of: { id: "rn_pat", role: "rn" } },
  };
  // Scribe-style human delegation is NOT agent-on-behalf-of-human; it stays human-authored per memo lines 97-110.
  assert.equal(deriveAuthorshipClass(ev), "human-authored");
});

test("ADR17-17a: unknown source.kind projects as unknown", () => {
  const ev = { source: { kind: "totally_made_up_kind" }, author: { id: "x", role: "y" } };
  assert.equal(deriveAuthorshipClass(ev), "unknown");
});

test("ADR17-17a: missing source.kind projects as unknown", () => {
  const ev = { author: { id: "x", role: "y" } };
  assert.equal(deriveAuthorshipClass(ev), "unknown");
});

test("ADR17-17a: deriveAuthorshipClass does not mutate event (memo C4)", () => {
  const ev = { source: { kind: "agent_inference" }, author: { id: "pi", role: "agent" } };
  const snapshot = JSON.stringify(ev);
  deriveAuthorshipClass(ev);
  assert.equal(JSON.stringify(ev), snapshot, "projection must not mutate event");
});
