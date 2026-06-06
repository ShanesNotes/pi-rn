use std::fs::{self, File, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};

use ledger_core::ledger::{AcceptedMetadata, AppendLedger, LedgerEntry, LedgerSnapshot};
use serde_json::Value;

use crate::{IdempotencyRecord, RevisionTargetProof, accepted_entry_view, claim_id};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum WalDurability {
    Fsync,
    TestModeNoFsync,
}

impl WalDurability {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Fsync => "fsync",
            Self::TestModeNoFsync => "test_mode_no_fsync",
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WalAppendRecordInfo {
    pub wal_record_version: u32,
    pub kind: String,
    pub patient_id: String,
    pub seq: u64,
    pub previous_head_hash: Option<String>,
    pub head_hash_after_append: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum StorageError {
    Io(String),
    InvalidRecord { line: usize, reason: String },
    PatientMismatch { expected: String, actual: String },
    CorruptLog { line: Option<usize>, reason: String },
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FileWalPatientLedgerStore {
    root_dir: PathBuf,
    durability: WalDurability,
}
impl FileWalPatientLedgerStore {
    pub fn open(
        root_dir: impl Into<PathBuf>,
        durability: WalDurability,
    ) -> Result<Self, StorageError> {
        let root_dir = root_dir.into();
        fs::create_dir_all(&root_dir).map_err(storage_io_error)?;
        Ok(Self {
            root_dir,
            durability,
        })
    }

    pub fn root_dir(&self) -> &Path {
        &self.root_dir
    }

    pub fn durability(&self) -> WalDurability {
        self.durability
    }

    pub fn log_path_for_patient(&self, patient_id: &str) -> PathBuf {
        self.root_dir
            .join(format!("patient-{}.jsonl", encode_patient_id(patient_id)))
    }

    pub fn append_entry(
        &mut self,
        patient_id: &str,
        entry: &LedgerEntry,
        operation: &'static str,
        client_request_id: &str,
        payload_fingerprint: &str,
        target_proof: Option<&RevisionTargetProof>,
    ) -> Result<WalAppendRecordInfo, StorageError> {
        if claim_id(entry).is_none() {
            return Err(StorageError::InvalidRecord {
                line: 0,
                reason: "accepted entry record is missing Claim id".to_string(),
            });
        }
        let claim_patient_id = entry
            .record
            .pointer("/subject/patientId")
            .and_then(Value::as_str)
            .ok_or_else(|| StorageError::InvalidRecord {
                line: 0,
                reason: "accepted entry record is missing subject.patientId".to_string(),
            })?;
        if claim_patient_id != patient_id {
            return Err(StorageError::PatientMismatch {
                expected: patient_id.to_string(),
                actual: claim_patient_id.to_string(),
            });
        }
        let info = WalAppendRecordInfo {
            wal_record_version: 1,
            kind: "accepted_entry".to_string(),
            patient_id: patient_id.to_string(),
            seq: entry.accepted.seq,
            previous_head_hash: entry.previous_entry_hash.clone(),
            head_hash_after_append: entry.entry_hash.clone(),
        };
        let target_proof_value = target_proof.map(|proof| {
            serde_json::json!({
                "target_claim_id": &proof.target_claim_id,
                "target_record_hash": &proof.target_record_hash,
                "target_entry_hash": &proof.target_entry_hash,
                "target_seq": proof.target_seq,
            })
        });
        let record = serde_json::json!({
            "wal_record_version": info.wal_record_version,
            "kind": info.kind,
            "patient_id": info.patient_id,
            "seq": info.seq,
            "previous_head_hash": info.previous_head_hash,
            "head_hash_after_append": info.head_hash_after_append,
            "operation": operation,
            "client_request_id": client_request_id,
            "payload_fingerprint": payload_fingerprint,
            "target_proof": target_proof_value,
            "entry": ledger_entry_to_value(entry),
        });
        let path = self.log_path_for_patient(patient_id);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(storage_io_error)?;
        }
        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(path)
            .map_err(storage_io_error)?;
        serde_json::to_writer(&mut file, &record).map_err(storage_json_error)?;
        file.write_all(b"\n").map_err(storage_io_error)?;
        file.flush().map_err(storage_io_error)?;
        if self.durability == WalDurability::Fsync {
            file.sync_all().map_err(storage_io_error)?;
        }
        Ok(info)
    }

    pub fn load_snapshot(&self, patient_id: &str) -> Result<Option<LedgerSnapshot>, StorageError> {
        let path = self.log_path_for_patient(patient_id);
        if !path.exists() {
            return Ok(None);
        }
        let file = File::open(path).map_err(storage_io_error)?;
        let mut entries = Vec::new();
        let mut expected_previous_head: Option<String> = None;
        let mut head_hash: Option<String> = None;
        for (index, line) in BufReader::new(file).lines().enumerate() {
            let line_no = index + 1;
            let line = line.map_err(storage_io_error)?;
            if line.trim().is_empty() {
                continue;
            }
            let record: Value =
                serde_json::from_str(&line).map_err(|error| StorageError::InvalidRecord {
                    line: line_no,
                    reason: format!("WAL line is not JSON: {error}"),
                })?;
            parse_required_u64(&record, "wal_record_version", line_no).and_then(|version| {
                if version == 1 {
                    Ok(version)
                } else {
                    Err(StorageError::InvalidRecord {
                        line: line_no,
                        reason: format!("unsupported wal_record_version {version}"),
                    })
                }
            })?;
            let kind = parse_required_str(&record, "kind", line_no)?;
            if kind != "accepted_entry" {
                return Err(StorageError::InvalidRecord {
                    line: line_no,
                    reason: format!("unsupported WAL record kind {kind}"),
                });
            }
            let actual_patient_id = parse_required_str(&record, "patient_id", line_no)?;
            if actual_patient_id != patient_id {
                return Err(StorageError::PatientMismatch {
                    expected: patient_id.to_string(),
                    actual: actual_patient_id.to_string(),
                });
            }
            let seq = parse_required_u64(&record, "seq", line_no)?;
            let previous_head = parse_optional_str(&record, "previous_head_hash", line_no)?;
            if previous_head != expected_previous_head {
                return Err(StorageError::CorruptLog {
                    line: Some(line_no),
                    reason: format!(
                        "previous_head_hash mismatch: expected {:?}, actual {:?}",
                        expected_previous_head, previous_head
                    ),
                });
            }
            let entry = ledger_entry_from_value(
                record
                    .get("entry")
                    .ok_or_else(|| StorageError::InvalidRecord {
                        line: line_no,
                        reason: "missing entry".to_string(),
                    })?,
                line_no,
            )?;
            if entry.accepted.seq != seq {
                return Err(StorageError::CorruptLog {
                    line: Some(line_no),
                    reason: format!(
                        "WAL seq {} does not match entry seq {}",
                        seq, entry.accepted.seq
                    ),
                });
            }
            if entry.previous_entry_hash != previous_head {
                return Err(StorageError::CorruptLog {
                    line: Some(line_no),
                    reason: "entry previous hash does not match WAL previous_head_hash".to_string(),
                });
            }
            let head_after = parse_required_str(&record, "head_hash_after_append", line_no)?;
            if head_after != entry.entry_hash {
                return Err(StorageError::CorruptLog {
                    line: Some(line_no),
                    reason: "head_hash_after_append does not match entry_hash".to_string(),
                });
            }
            expected_previous_head = Some(head_after.to_string());
            head_hash = Some(head_after.to_string());
            entries.push(entry);
        }
        let snapshot = LedgerSnapshot {
            patient_id: patient_id.to_string(),
            entries,
            head_hash,
        };
        AppendLedger::from_snapshot(snapshot.clone()).map_err(|error| {
            StorageError::CorruptLog {
                line: None,
                reason: format!("trusted replay validation failed: {error:?}"),
            }
        })?;
        Ok(Some(snapshot))
    }

    pub(crate) fn load_idempotency_records(
        &self,
        patient_id: &str,
    ) -> Result<Vec<(String, IdempotencyRecord)>, StorageError> {
        let path = self.log_path_for_patient(patient_id);
        if !path.exists() {
            return Ok(Vec::new());
        }
        let file = File::open(path).map_err(storage_io_error)?;
        let mut records = Vec::new();
        for (index, line) in BufReader::new(file).lines().enumerate() {
            let line_no = index + 1;
            let line = line.map_err(storage_io_error)?;
            if line.trim().is_empty() {
                continue;
            }
            let record: Value =
                serde_json::from_str(&line).map_err(|error| StorageError::InvalidRecord {
                    line: line_no,
                    reason: format!("WAL line is not JSON: {error}"),
                })?;
            parse_required_u64(&record, "wal_record_version", line_no).and_then(|version| {
                if version == 1 {
                    Ok(version)
                } else {
                    Err(StorageError::InvalidRecord {
                        line: line_no,
                        reason: format!("unsupported wal_record_version {version}"),
                    })
                }
            })?;
            let kind = parse_required_str(&record, "kind", line_no)?;
            if kind != "accepted_entry" {
                return Err(StorageError::InvalidRecord {
                    line: line_no,
                    reason: format!("unsupported WAL record kind {kind}"),
                });
            }
            let actual_patient_id = parse_required_str(&record, "patient_id", line_no)?;
            if actual_patient_id != patient_id {
                return Err(StorageError::PatientMismatch {
                    expected: patient_id.to_string(),
                    actual: actual_patient_id.to_string(),
                });
            }
            let operation = parse_operation(&record, line_no)?;
            let client_request_id =
                parse_required_str(&record, "client_request_id", line_no)?.to_string();
            let payload_fingerprint =
                parse_required_str(&record, "payload_fingerprint", line_no)?.to_string();
            let entry = ledger_entry_from_value(
                record
                    .get("entry")
                    .ok_or_else(|| StorageError::InvalidRecord {
                        line: line_no,
                        reason: "missing entry".to_string(),
                    })?,
                line_no,
            )?;
            let target_proof = parse_optional_target_proof(record.get("target_proof"), line_no)?;
            if operation == "AppendRevisionClaim" && target_proof.is_none() {
                return Err(StorageError::InvalidRecord {
                    line: line_no,
                    reason: "revision WAL record missing target_proof".to_string(),
                });
            }
            if records.iter().any(|(existing_client_request_id, _)| {
                existing_client_request_id == &client_request_id
            }) {
                return Err(StorageError::CorruptLog {
                    line: Some(line_no),
                    reason: format!("duplicate client_request_id {client_request_id} in WAL"),
                });
            }
            records.push((
                client_request_id,
                IdempotencyRecord {
                    operation,
                    payload_fingerprint,
                    entry: accepted_entry_view(&entry),
                    target_proof,
                },
            ));
        }
        Ok(records)
    }
}
fn ledger_entry_to_value(entry: &LedgerEntry) -> Value {
    serde_json::json!({
        "record": entry.record,
        "record_hash": entry.record_hash,
        "previous_entry_hash": entry.previous_entry_hash,
        "entry_hash": entry.entry_hash,
        "record_kind": entry.record_kind,
        "entry_version": entry.entry_version,
        "accepted": {
            "accepted_at": entry.accepted.accepted_at,
            "seq": entry.accepted.seq,
            "batch_id": entry.accepted.batch_id,
        },
    })
}

fn ledger_entry_from_value(value: &Value, line: usize) -> Result<LedgerEntry, StorageError> {
    let accepted = value
        .get("accepted")
        .ok_or_else(|| StorageError::InvalidRecord {
            line,
            reason: "entry missing accepted metadata".to_string(),
        })?;
    Ok(LedgerEntry {
        record: value
            .get("record")
            .ok_or_else(|| StorageError::InvalidRecord {
                line,
                reason: "entry missing record".to_string(),
            })?
            .clone(),
        record_hash: parse_required_str(value, "record_hash", line)?.to_string(),
        previous_entry_hash: parse_optional_str(value, "previous_entry_hash", line)?,
        entry_hash: parse_required_str(value, "entry_hash", line)?.to_string(),
        record_kind: parse_required_str(value, "record_kind", line)?.to_string(),
        entry_version: u32::try_from(parse_required_u64(value, "entry_version", line)?).map_err(
            |_| StorageError::InvalidRecord {
                line,
                reason: "entry_version exceeds u32 range".to_string(),
            },
        )?,
        accepted: AcceptedMetadata {
            accepted_at: parse_required_str(accepted, "accepted_at", line)?.to_string(),
            seq: parse_required_u64(accepted, "seq", line)?,
            batch_id: parse_required_str(accepted, "batch_id", line)?.to_string(),
        },
    })
}

fn parse_operation(value: &Value, line: usize) -> Result<&'static str, StorageError> {
    match parse_required_str(value, "operation", line)? {
        "AppendClaim" => Ok("AppendClaim"),
        "AppendRevisionClaim" => Ok("AppendRevisionClaim"),
        other => Err(StorageError::InvalidRecord {
            line,
            reason: format!("unsupported WAL operation {other}"),
        }),
    }
}

fn parse_optional_target_proof(
    value: Option<&Value>,
    line: usize,
) -> Result<Option<RevisionTargetProof>, StorageError> {
    let Some(value) = value else {
        return Ok(None);
    };
    if value.is_null() {
        return Ok(None);
    }
    let object = value
        .as_object()
        .ok_or_else(|| StorageError::InvalidRecord {
            line,
            reason: "target_proof must be an object or null".to_string(),
        })?;
    Ok(Some(RevisionTargetProof {
        target_claim_id: object
            .get("target_claim_id")
            .and_then(Value::as_str)
            .ok_or_else(|| StorageError::InvalidRecord {
                line,
                reason: "target_proof missing target_claim_id".to_string(),
            })?
            .to_string(),
        target_record_hash: object
            .get("target_record_hash")
            .and_then(Value::as_str)
            .ok_or_else(|| StorageError::InvalidRecord {
                line,
                reason: "target_proof missing target_record_hash".to_string(),
            })?
            .to_string(),
        target_entry_hash: object
            .get("target_entry_hash")
            .and_then(Value::as_str)
            .ok_or_else(|| StorageError::InvalidRecord {
                line,
                reason: "target_proof missing target_entry_hash".to_string(),
            })?
            .to_string(),
        target_seq: object
            .get("target_seq")
            .and_then(Value::as_u64)
            .ok_or_else(|| StorageError::InvalidRecord {
                line,
                reason: "target_proof missing target_seq".to_string(),
            })?,
    }))
}

fn parse_required_str<'a>(
    value: &'a Value,
    field: &'static str,
    line: usize,
) -> Result<&'a str, StorageError> {
    value
        .get(field)
        .and_then(Value::as_str)
        .ok_or_else(|| StorageError::InvalidRecord {
            line,
            reason: format!("missing or invalid string field {field}"),
        })
}

fn parse_optional_str(
    value: &Value,
    field: &'static str,
    line: usize,
) -> Result<Option<String>, StorageError> {
    match value.get(field) {
        None | Some(Value::Null) => Ok(None),
        Some(Value::String(value)) => Ok(Some(value.clone())),
        _ => Err(StorageError::InvalidRecord {
            line,
            reason: format!("invalid optional string field {field}"),
        }),
    }
}

fn parse_required_u64(
    value: &Value,
    field: &'static str,
    line: usize,
) -> Result<u64, StorageError> {
    value
        .get(field)
        .and_then(Value::as_u64)
        .ok_or_else(|| StorageError::InvalidRecord {
            line,
            reason: format!("missing or invalid integer field {field}"),
        })
}

fn encode_patient_id(patient_id: &str) -> String {
    patient_id
        .as_bytes()
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

fn storage_io_error(error: std::io::Error) -> StorageError {
    StorageError::Io(error.to_string())
}

fn storage_json_error(error: serde_json::Error) -> StorageError {
    StorageError::Io(error.to_string())
}
