//! Reusable cryptographic claim-ledger kernel for pi-rn.
//!
//! This crate intentionally starts as a narrow scaffold. Behavior should land
//! through the active `.scratch/pi-ledger-claim-ledger-kernel/` TDD issues,
//! beginning with canonicalization and record hashing.

pub mod canonical;
pub mod claim;
pub mod fixture;
pub mod hash;
pub mod ledger;
pub mod predicates;
pub mod query;
pub mod time;

/// Version marker for the scaffolded kernel crate.
pub const LEDGER_CORE_SCAFFOLD: &str = "pi-ledger.core.scaffold.v1";

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exposes_scaffold_marker() {
        assert_eq!(LEDGER_CORE_SCAFFOLD, "pi-ledger.core.scaffold.v1");
    }
}
