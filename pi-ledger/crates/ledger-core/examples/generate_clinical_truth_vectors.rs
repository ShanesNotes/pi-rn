use ledger_core::conformance::clinical_truth_v1alpha1_vital_sign_vectors;

fn main() {
    let suite = clinical_truth_v1alpha1_vital_sign_vectors()
        .expect("clinical truth vital.sign vector generation should succeed");
    println!(
        "{}",
        serde_json::to_string_pretty(&suite)
            .expect("clinical truth vital.sign vector suite should serialize")
    );
}
