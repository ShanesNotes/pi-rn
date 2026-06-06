# Boundary, security, and access plan

Date: 2026-05-31
Ultragoal story: `G007-boundary-security-and-access-plan`
Status: planning artifact; implementation deferred.

## Purpose

Record the access and boundary constraints that must surround the private clinical-truth service and the `pi-chart` backend client before any production seam implementation.

## Canonical access path

```text
clinical entry points
  (browser UI, EHR chart, task list, specialty workflow, background agent queue)
    -> Pi-RN / pi-chart app-backend boundary
      -> private/internal clinical-truth service over local/private transport
        -> ledger-core safe lifecycle paths
```

No clinical entry point calls the clinical-truth service directly. The app/backend mediates auth, session, workflow, proposal/review, source context, and projection before service calls.

## Boundary rules

| Boundary | Rule | Rationale |
| --- | --- | --- |
| Clinical entry point -> backend | Entry points request workflow actions or views from app/backend only. | Prevents divergent local truth copies and direct exposure of ledger semantics. |
| Backend -> clinical-truth service | Backend is the first client over private/local gRPC/UDS or equivalent private transport. | Keeps service internal and deployment-flexible. |
| Service -> `ledger-core` | Service uses safe kernel lifecycle paths only. | Avoids admission bypass and private implementation coupling. |
| `pi-chart` views -> truth | Views project accepted facts; they do not store chart truth. | Preserves chart-once/project-many invariant. |
| `pi-agent` -> context | Agent sees explicit exposed chart/public surfaces only. | Supports future bounded/containerized runtime. |
| `pi-sim` -> consumers | Only public telemetry/reveal surfaces may cross. Hidden provider/oracle/latent state stays hidden. | Prevents simulation truth leakage into clinical chart/agent context. |
| `pi-monitor` -> chart | Monitor is display-only; chart truth requires explicit adapter/clinician validation. | Observable values are not chart truth by visibility alone. |

## Service exposure posture

- Service socket/transport is private to the app/backend deployment boundary.
- No browser, EHR plugin, external workflow tool, or `pi-agent` runtime receives service address, socket path, or credentials.
- Service API is not a public clinical API.
- Service does not serve clinician-facing labels directly; it serves accepted ledger entries, hashes, and point-read facts.
- Service logs/audits should not expose hidden simulator paths or latent truth.

## App/backend responsibilities

The Pi-RN/pi-chart app/backend owns:

- user/session/auth/workflow context;
- accepted-write authorization checks;
- human-agent suggestion policy;
- mapping chart field-contract payloads into service requests;
- interpreting service errors as clinician-safe review/retry prompts;
- projection into Shift Brain, Report View, Handoff View, Chart Review Packet, Current Snapshot, and Source trail;
- hiding service internals from clinical entry points.

## Clinical-truth service responsibilities

The service owns:

- per-patient append order;
- durable WAL/log state;
- Claim validation/admission/revision admission;
- predicate registry policy;
- canonicalization and Record/Entry hashes;
- service-assigned K3 metadata;
- bitemporal point reads over trusted accepted entries;
- snapshot/rebuild validation.

The service does not own:

- clinician-facing label language;
- Shift Brain or Handoff workflow authority;
- UI auth/session policy;
- suggestion clinical policy;
- hidden simulator state;
- vector/retrieval/OpenBrain architecture.

## Human-agent suggestion boundary

- Pi may suggest, explain, cite, and prompt review.
- Pi does not chart, complete care, verify, sign, co-sign, reconcile, resolve, or decide for the clinician.
- `Suggested by Pi` is source/provenance and advisory authority, not accepted chart truth by itself.
- `Add to Shift Brain` or equivalent promotion is a human-owned action and must be modeled separately.
- Accepted writes require backend-mediated policy and service append; no direct `pi-agent` accepted-write authority is introduced in this ultragoal.

## Observable charting seam

Public telemetry path:

```text
pi-sim hidden runtime -> pi-sim/vitals public telemetry -> explicit pi-chart adapter and/or clinician validation -> chart/service accepted fact
```

Rules:

- Public telemetry may be evidence/source input.
- Display-only monitor values do not become chart truth merely by appearing on a screen.
- Hidden `pi-sim/scripts`, provider state, latent findings, validation oracles, scenario secrets, and scoring keys are forbidden inputs for `pi-chart`, `pi-ledger`, and `pi-agent`.
- Adapter tests may use `pi-sim/vitals/README.md`, `.lanes.json`, and public-contract fixtures; they must not import hidden runtime internals.

## Bounded `pi-agent` runtime contract

Future smoke tests should prove:

- mounted context excludes hidden `pi-sim` source and private service storage;
- agent-visible tools expose only sanctioned chart/public surfaces;
- no service UDS path or credential is present in the agent workspace;
- agent proposal outputs remain proposals until human/backend policy promotes them;
- agent context receipts, if implemented, record what chart context was exposed without granting direct accepted-write authority.

## Threat/risk register for the next implementation ultragoal

| Risk | Guardrail |
| --- | --- |
| UI or EHR plugin connects directly to ledger service | Boundary test fails if direct transport config appears outside backend. |
| TypeScript adapter clones canonicalization/hash | Adapter tests forbid local authoritative hash recomputation; service-returned hashes only. |
| Hidden simulator truth leaks into chart or agent context | Static/path scans for hidden `pi-sim` imports and fixture provenance checks. |
| Suggestion becomes accepted truth without clinician action | Proposal-vs-accepted fixtures and promotion tests. |
| Service starts owning clinician-facing workflow labels | Surface derivation tests keep labels in `pi-chart`. |
| Storage corruption served as truth | WAL/rebuild fail-closed tests. |
| Stale correction target accepted | Revision admission under patient lock and stale-target negative vector. |

## Minimum boundary verification commands for later source work

These are candidate checks for a future implementation ultragoal:

```sh
rg "pi-sim/(scripts|pulse|session-log|resources)" pi-chart pi-ledger pi-agent
rg "canonical_json|record_hash|sha256" pi-chart/src
rg "clinical-truth-service|UDS|socket" pi-agent pi-chart/src
```

The exact commands should be refined once implementation files exist.

## Non-decisions

This plan does not choose production auth, network deployment, key management, encryption-at-rest, external API strategy, public EHR integration shape, or vector/retrieval architecture.
