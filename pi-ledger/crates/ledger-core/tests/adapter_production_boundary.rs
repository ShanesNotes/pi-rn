//! Default production consumers must not treat fixture helpers as Adapter API.
//! Integration tests that need fixtures enable `ledger-core/test-support`.

#[test]
fn fixture_module_is_feature_gated_in_lib_rs() {
    let lib_rs = include_str!("../src/lib.rs");

    assert!(
        lib_rs.contains("#[cfg(any(test, feature = \"test-support\"))]"),
        "fixture must be gated behind test or test-support feature"
    );
    assert!(
        lib_rs.contains("pub mod fixture;"),
        "fixture module declaration must remain explicit"
    );
}

#[test]
fn cargo_manifest_declares_test_support_feature() {
    let manifest = include_str!("../Cargo.toml");

    assert!(
        manifest.contains("test-support"),
        "ledger-core must declare a test-support feature for fixture quarantine"
    );
    for test_name in ["public_append_interface", "trusted_history_rebuild"] {
        assert!(
            manifest.contains(test_name),
            "integration test `{test_name}` must be listed with required-features"
        );
        assert!(
            manifest.contains("required-features"),
            "fixture-using integration tests must require test-support"
        );
    }
}