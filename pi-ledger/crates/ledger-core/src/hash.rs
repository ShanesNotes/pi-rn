use std::fmt;

const PREFIX: &str = "sha256:";
const HEX_DIGITS: usize = 64;
const SHA256_DIGEST_BYTES: usize = 32;

/// Typed SHA-256 hash value proving canonical Claim record content.
#[derive(Clone, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct RecordHash(String);

impl RecordHash {
    pub fn parse(value: impl AsRef<str>) -> Result<Self, HashError> {
        parse_hash(value.as_ref()).map(Self)
    }

    pub(crate) fn from_sha256_digest(digest: impl AsRef<[u8]>) -> Self {
        Self(format_sha256_digest(digest.as_ref()))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }

    pub fn into_string(self) -> String {
        self.0
    }
}

impl AsRef<str> for RecordHash {
    fn as_ref(&self) -> &str {
        self.as_str()
    }
}

impl fmt::Display for RecordHash {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.as_str())
    }
}

impl std::str::FromStr for RecordHash {
    type Err = HashError;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        Self::parse(value)
    }
}

/// Typed SHA-256 hash value used for append-chain entry identity.
#[derive(Clone, Debug, Eq, Hash, Ord, PartialEq, PartialOrd)]
pub struct EntryHash(String);

impl EntryHash {
    pub fn parse(value: impl AsRef<str>) -> Result<Self, HashError> {
        parse_hash(value.as_ref()).map(Self)
    }

    pub(crate) fn from_sha256_digest(digest: impl AsRef<[u8]>) -> Self {
        Self(format_sha256_digest(digest.as_ref()))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }

    pub fn into_string(self) -> String {
        self.0
    }
}

impl AsRef<str> for EntryHash {
    fn as_ref(&self) -> &str {
        self.as_str()
    }
}

impl fmt::Display for EntryHash {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.as_str())
    }
}

impl std::str::FromStr for EntryHash {
    type Err = HashError;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        Self::parse(value)
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum HashError {
    InvalidHash { value: String },
}

fn parse_hash(value: &str) -> Result<String, HashError> {
    let Some(hex) = value.strip_prefix(PREFIX) else {
        return Err(HashError::InvalidHash {
            value: value.to_string(),
        });
    };
    if hex.len() != HEX_DIGITS
        || !hex
            .bytes()
            .all(|byte| matches!(byte, b'0'..=b'9' | b'a'..=b'f'))
    {
        return Err(HashError::InvalidHash {
            value: value.to_string(),
        });
    }
    Ok(value.to_string())
}

fn format_sha256_digest(digest: &[u8]) -> String {
    debug_assert_eq!(digest.len(), SHA256_DIGEST_BYTES);
    let mut hash = String::with_capacity(PREFIX.len() + HEX_DIGITS);
    hash.push_str(PREFIX);
    for byte in digest {
        write_lower_hex_byte(&mut hash, *byte);
    }
    hash
}

fn write_lower_hex_byte(output: &mut String, byte: u8) {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    output.push(HEX[(byte >> 4) as usize] as char);
    output.push(HEX[(byte & 0x0f) as usize] as char);
}

#[cfg(test)]
mod tests {
    use super::*;

    const VALID: &str = "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    #[test]
    fn t_k8_01_record_and_entry_hash_parse_valid_prefixed_lowercase_sha256_values() {
        let record_hash = RecordHash::parse(VALID).unwrap();
        let entry_hash = EntryHash::parse(VALID).unwrap();

        assert_eq!(record_hash.as_str(), VALID);
        assert_eq!(entry_hash.as_str(), VALID);
    }

    #[test]
    fn t_k8_01_record_and_entry_hash_reject_missing_prefix() {
        assert_rejected_by_both("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
    }

    #[test]
    fn t_k8_01_record_and_entry_hash_reject_wrong_length() {
        assert_rejected_by_both("sha256:0123456789abcdef");
        assert_rejected_by_both(
            "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef00",
        );
    }

    #[test]
    fn t_k8_01_record_and_entry_hash_reject_uppercase_hex() {
        assert_rejected_by_both(
            "sha256:0123456789abcdef0123456789ABCDEF0123456789abcdef0123456789abcdef",
        );
    }

    #[test]
    fn t_k8_01_record_and_entry_hash_reject_non_hex_characters() {
        assert_rejected_by_both(
            "sha256:0123456789abcdef0123456789abcdeg0123456789abcdef0123456789abcdef",
        );
    }

    fn assert_rejected_by_both(value: &str) {
        assert_eq!(
            RecordHash::parse(value).unwrap_err(),
            HashError::InvalidHash {
                value: value.to_string()
            }
        );
        assert_eq!(
            EntryHash::parse(value).unwrap_err(),
            HashError::InvalidHash {
                value: value.to_string()
            }
        );
    }
}
