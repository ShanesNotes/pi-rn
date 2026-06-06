#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUN_DIR="$ROOT/.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal"
EVIDENCE_DIR="$RUN_DIR/evidence"
mkdir -p "$EVIDENCE_DIR"

run() {
  local name="$1"
  shift
  local out="$EVIDENCE_DIR/$name.txt"
  echo "$ $*" | tee "$out"
  (cd "$ROOT" && "$@") 2>&1 | tee -a "$out"
}

run_shell() {
  local name="$1"
  shift
  local out="$EVIDENCE_DIR/$name.txt"
  echo "$ $*" | tee "$out"
  (cd "$ROOT" && bash -lc "$*") 2>&1 | tee -a "$out"
}

run g010-regenerate-vectors cargo run --manifest-path pi-ledger/Cargo.toml --example generate_clinical_truth_vectors --quiet
run_shell g010-vectors-diff-clean "git diff --exit-code -- pi-ledger/conformance/clinical_truth/v1alpha1/vital_sign_vectors.json"
run g010-service-core-tests cargo test --manifest-path pi-ledger/Cargo.toml -p clinical-truth-service
run g010-pi-chart-typecheck npm --prefix pi-chart run typecheck
run_shell g010-pi-chart-adapter-tests "cd pi-chart && node --test --import tsx src/clinical-truth-contract.test.ts src/clinical-truth-adapter.test.ts"
run_shell g010-pi-chart-adapter-boundary-scan "! rg -n 'pi-sim|hidden_truth|clinical-truth-service|crates/clinical-truth-service|createHash|canonical_json\\(|record_hash\\(' pi-chart/src/clinical-truth-contract.ts pi-chart/src/clinical-truth-adapter.ts"
run_shell g010-pi-ledger-boundary-scan "! rg -n 'pi-chart/|../pi-chart|pi-sim/|../pi-sim|patients/|showcase/' pi-ledger/crates/ledger-core/src pi-ledger/crates/clinical-truth-service/src --glob '!fixture.rs'"
run_shell g010-diff-check "git diff --check"

echo "G010 verification harness completed. Evidence: $EVIDENCE_DIR/g010-*.txt"
