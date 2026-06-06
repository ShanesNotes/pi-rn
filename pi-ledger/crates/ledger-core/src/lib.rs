//! Reusable cryptographic claim-ledger kernel for pi-rn.
//!
//! The safe append lifecycle is:
//!
//! 1. validate raw Claim JSON into a [`claim::ValidatedClaim`];
//! 2. admit base Claims through [`admission::AppendAdmissibleClaim`];
//! 3. admit correction Claims through [`admission::RevisionAdmissibleClaim`];
//! 4. append through [`ledger::AppendLedger::append_admissible`] or
//!    [`ledger::AppendLedger::append_revision_admissible`];
//! 5. read trusted entries through [`query::point_read`].
//!
//! The adapter-facing Interface inventory lives in
//! `pi-ledger/docs/ledger-core-public-interface.md`; the clinician-readable
//! proof lifecycle lives in `pi-ledger/docs/admission-proof-lifecycle.md`;
//! the trusted history rebuild Seam lives in
//! `pi-ledger/docs/trusted-history-rebuild-seam.md`.

pub mod admission;
pub mod canonical;
pub mod claim;
pub mod conformance;
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
