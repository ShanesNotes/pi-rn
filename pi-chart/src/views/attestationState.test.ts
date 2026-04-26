// HANDOFF: ADR17-17c attestation view characterization. Unblocks taxonomy ledger T06.
// ADR 017 lines 113-153 (proposed-not-canonical): communication.attestation.v1 profile.
// Output: failing tests that ADR17-17V validator integration consumes for V-ATTEST-01 V-ATTEST-02 V-ATTEST-03 V-ATTEST-04.

import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveAttestationState, type AttestationState } from "./attestationState.js";

test("ADR17-17c: target with no attestation events projects as none (rule 2)", () => {
  const target = { id: "evt_target", source: { kind: "agent_synthesis" } };
  const result = deriveAttestationState("evt_target", [target]);
  assert.deepEqual(result, { kind: "none" });
});

test("ADR17-17c: target with single cosign attestation projects as single (rule 3) — T06, V-ATTEST-01", () => {
  const target = { id: "evt_target", source: { kind: "agent_synthesis" } };
  const att = {
    id: "evt_cosign",
    type: "communication",
    subtype: "attestation",
    profile: "communication.attestation.v1",
    source: { kind: "clinician_chart_action" },
    author: { id: "md_lee", role: "md" },
    data: { attests_to: "evt_target", attestation_role: "cosign" },
    links: { supports: [{ ref: "evt_target", kind: "event" }] },
    recorded_at: "2026-04-26T11:00:00Z",
  };
  const result: AttestationState = deriveAttestationState("evt_target", [target, att]);
  assert.deepEqual(result, { kind: "single", role: "cosign", by: "md_lee", eventId: "evt_cosign", on_behalf_of: undefined });
});

test("ADR17-17c: target with multiple attestations projects as chain ordered by recorded_at (rule 4)", () => {
  const target = { id: "evt_target", source: { kind: "agent_synthesis" } };
  const a1 = { id: "a1", type: "communication", subtype: "attestation", profile: "communication.attestation.v1",
    author: { id: "rn_amy", role: "rn" }, source: { kind: "nurse_charted" },
    data: { attests_to: "evt_target", attestation_role: "verify" },
    recorded_at: "2026-04-26T11:00:00Z" };
  const a2 = { id: "a2", type: "communication", subtype: "attestation", profile: "communication.attestation.v1",
    author: { id: "md_lee", role: "md" }, source: { kind: "clinician_chart_action" },
    data: { attests_to: "evt_target", attestation_role: "cosign" },
    recorded_at: "2026-04-26T11:30:00Z" };
  const result = deriveAttestationState("evt_target", [target, a2, a1]);
  assert.equal(result.kind, "chain");
  if (result.kind === "chain") {
    assert.equal(result.roles.length, 2);
    assert.deepEqual(result.roles[0], { role: "verify", by: "rn_amy", eventId: "a1" });
    assert.deepEqual(result.roles[1], { role: "cosign", by: "md_lee", eventId: "a2" });
  }
});

test("ADR17-17c: scribe role without on_behalf_of projects as none (rule 6, V-ATTEST-04)", () => {
  const target = { id: "evt_target", source: { kind: "nurse_charted" } };
  const att = { id: "a1", type: "communication", subtype: "attestation", profile: "communication.attestation.v1",
    author: { id: "rn_amy", role: "rn" }, source: { kind: "nurse_charted" },
    data: { attests_to: "evt_target", attestation_role: "scribe" },
    recorded_at: "2026-04-26T11:00:00Z" };
  const result = deriveAttestationState("evt_target", [target, att]);
  assert.deepEqual(result, { kind: "none" });
});

test("ADR17-17c: scribe role with on_behalf_of projects as single (rule 3 + 6)", () => {
  const target = { id: "evt_target", source: { kind: "nurse_charted" } };
  const att = { id: "a1", type: "communication", subtype: "attestation", profile: "communication.attestation.v1",
    author: { id: "rn_amy", role: "rn" }, source: { kind: "nurse_charted" },
    data: { attests_to: "evt_target", attestation_role: "scribe", on_behalf_of: "rn_pat" },
    recorded_at: "2026-04-26T11:00:00Z" };
  const result = deriveAttestationState("evt_target", [target, att]);
  assert.deepEqual(result, { kind: "single", role: "scribe", by: "rn_amy", eventId: "a1", on_behalf_of: "rn_pat" });
});

test("ADR17-17c: unknown attestation_role is rejected (rule 5, V-ATTEST-02)", () => {
  const target = { id: "evt_target", source: { kind: "nurse_charted" } };
  const att = { id: "a1", type: "communication", subtype: "attestation", profile: "communication.attestation.v1",
    author: { id: "rn_amy", role: "rn" }, source: { kind: "nurse_charted" },
    data: { attests_to: "evt_target", attestation_role: "made_up_role" },
    recorded_at: "2026-04-26T11:00:00Z" };
  const result = deriveAttestationState("evt_target", [target, att]);
  assert.deepEqual(result, { kind: "none" });
});

test("ADR17-17c: attestation linked via links.supports also matches target (rule 1)", () => {
  const target = { id: "evt_target", source: { kind: "agent_synthesis" } };
  const att = { id: "a1", type: "communication", subtype: "attestation", profile: "communication.attestation.v1",
    author: { id: "md_lee", role: "md" }, source: { kind: "clinician_chart_action" },
    data: { attestation_role: "verify" },
    links: { supports: [{ ref: "evt_target", kind: "event" }] },
    recorded_at: "2026-04-26T11:00:00Z" };
  const result = deriveAttestationState("evt_target", [target, att]);
  assert.equal(result.kind, "single");
});

test("ADR17-17c: clinician-family author contract is view-visible and validator-enforced later (V-ATTEST-03)", () => {
  const target = { id: "evt_target", source: { kind: "agent_synthesis" } };
  const att = { id: "a1", type: "communication", subtype: "attestation", profile: "communication.attestation.v1",
    author: { id: "pi", role: "agent" }, source: { kind: "agent_review" },
    data: { attests_to: "evt_target", attestation_role: "verify" },
    recorded_at: "2026-04-26T11:00:00Z" };
  const result = deriveAttestationState("evt_target", [target, att]);
  assert.deepEqual(result, { kind: "single", role: "verify", by: "pi", eventId: "a1", on_behalf_of: undefined });
});

test("ADR17-17c: empty allEvents returns none", () => {
  const result = deriveAttestationState("evt_x", []);
  assert.deepEqual(result, { kind: "none" });
});

test("ADR17-17c: deriveAttestationState does not mutate inputs", () => {
  const target = { id: "evt_target", source: { kind: "agent_synthesis" } };
  const att = { id: "a1", type: "communication", subtype: "attestation", profile: "communication.attestation.v1",
    author: { id: "md_lee", role: "md" }, source: { kind: "clinician_chart_action" },
    data: { attests_to: "evt_target", attestation_role: "cosign" },
    recorded_at: "2026-04-26T11:00:00Z" };
  const targetSnap = JSON.stringify(target);
  const attSnap = JSON.stringify(att);
  deriveAttestationState("evt_target", [target, att]);
  assert.equal(JSON.stringify(target), targetSnap);
  assert.equal(JSON.stringify(att), attSnap);
});
