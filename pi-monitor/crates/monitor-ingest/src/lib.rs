use anyhow::{Context, Result};
use notify::{RecursiveMode, Watcher, recommended_watcher};
use pulse_public_frame::{FrameError, PublicFrame, parse_public_frame};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::mpsc;
use std::thread;
use std::time::{Duration, Instant, SystemTime};

#[derive(Debug, Clone, PartialEq)]
pub struct IngestedFrame {
    pub frame: PublicFrame,
    pub received_millis: u64,
}

#[derive(Debug, Clone, PartialEq)]
pub enum IngestEvent {
    Frame(IngestedFrame),
    InvalidCandidate(String),
    Offline(String),
}

pub fn read_current_file(path: impl AsRef<Path>, clock: &impl ReceiptClock) -> IngestEvent {
    let path = path.as_ref();
    let text = match fs::read_to_string(path) {
        Ok(text) => text,
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => {
            return IngestEvent::Offline(format!("{} missing", path.display()));
        }
        Err(err) => return IngestEvent::Offline(format!("{} unreadable: {err}", path.display())),
    };
    match parse_public_frame(&text) {
        Ok(frame) => IngestEvent::Frame(IngestedFrame {
            frame,
            received_millis: clock.now_millis(),
        }),
        Err(err) => IngestEvent::InvalidCandidate(err.to_string()),
    }
}

pub trait ReceiptClock {
    fn now_millis(&self) -> u64;
}

#[derive(Debug, Clone)]
pub struct MonotonicClock {
    start: Instant,
}

impl Default for MonotonicClock {
    fn default() -> Self {
        Self {
            start: Instant::now(),
        }
    }
}

impl ReceiptClock for MonotonicClock {
    fn now_millis(&self) -> u64 {
        self.start
            .elapsed()
            .as_millis()
            .try_into()
            .unwrap_or(u64::MAX)
    }
}

#[derive(Debug, Clone)]
pub struct WatchConfig {
    pub source: PathBuf,
    pub poll_interval: Duration,
    pub debounce: Duration,
}

impl WatchConfig {
    pub fn new(source: impl Into<PathBuf>) -> Self {
        Self {
            source: source.into(),
            poll_interval: Duration::from_millis(250),
            debounce: Duration::from_millis(100),
        }
    }
}

pub fn watch(config: WatchConfig, mut on_event: impl FnMut(IngestEvent) -> bool) -> Result<()> {
    match watch_native(config.clone(), &mut on_event) {
        Ok(()) => Ok(()),
        Err(_) => watch_polling(config, on_event),
    }
}

pub fn watch_native(
    config: WatchConfig,
    on_event: &mut impl FnMut(IngestEvent) -> bool,
) -> Result<()> {
    let clock = MonotonicClock::default();
    let (tx, rx) = mpsc::channel();
    let mut watcher = recommended_watcher(move |result| {
        let _ = tx.send(result);
    })?;
    let watch_root = config.source.parent().unwrap_or_else(|| Path::new("."));
    watcher.watch(watch_root, RecursiveMode::NonRecursive)?;
    let mut last_modified: Option<SystemTime> = Some(SystemTime::UNIX_EPOCH);
    loop {
        match rx.recv_timeout(config.poll_interval) {
            Ok(Ok(event)) => {
                if !event.paths.iter().any(|path| path == &config.source) {
                    continue;
                }
                thread::sleep(config.debounce);
                if !on_event(read_current_file(&config.source, &clock)) {
                    return Ok(());
                }
            }
            Ok(Err(err)) => return Err(err.into()),
            Err(mpsc::RecvTimeoutError::Timeout) => {
                let modified = fs::metadata(&config.source)
                    .and_then(|metadata| metadata.modified())
                    .ok();
                if modified != last_modified {
                    last_modified = modified;
                    if !on_event(read_current_file(&config.source, &clock)) {
                        return Ok(());
                    }
                }
            }
            Err(mpsc::RecvTimeoutError::Disconnected) => return Ok(()),
        }
    }
}

pub fn watch_polling(
    config: WatchConfig,
    mut on_event: impl FnMut(IngestEvent) -> bool,
) -> Result<()> {
    let clock = MonotonicClock::default();
    let mut last_modified: Option<SystemTime> = Some(SystemTime::UNIX_EPOCH);
    loop {
        let modified = fs::metadata(&config.source)
            .and_then(|metadata| metadata.modified())
            .ok();
        let changed = modified != last_modified;
        if changed {
            last_modified = modified;
            thread::sleep(config.debounce);
            if !on_event(read_current_file(&config.source, &clock)) {
                return Ok(());
            }
        }
        thread::sleep(config.poll_interval);
    }
}

pub fn read_fixture(path: impl AsRef<Path>) -> Result<PublicFrame> {
    let path = path.as_ref();
    let text =
        fs::read_to_string(path).with_context(|| format!("read fixture {}", path.display()))?;
    parse_public_frame(&text)
        .map_err(|err: FrameError| anyhow::anyhow!(err))
        .with_context(|| format!("parse fixture {}", path.display()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[derive(Debug)]
    struct FixedClock(u64);
    impl ReceiptClock for FixedClock {
        fn now_millis(&self) -> u64 {
            self.0
        }
    }

    #[test]
    fn reads_valid_current_json() {
        let mut file = tempfile::NamedTempFile::new().unwrap();
        write!(file, r#"{{"t":1,"hr":70,"alarms":[]}}"#).unwrap();
        match read_current_file(file.path(), &FixedClock(123)) {
            IngestEvent::Frame(frame) => {
                assert_eq!(frame.received_millis, 123);
                assert_eq!(frame.frame.sim_time_s, 1.0);
            }
            other => panic!("unexpected event: {other:?}"),
        }
    }

    #[test]
    fn parse_failure_is_invalid_candidate_not_offline() {
        let mut file = tempfile::NamedTempFile::new().unwrap();
        write!(file, "{{partial").unwrap();
        match read_current_file(file.path(), &FixedClock(0)) {
            IngestEvent::InvalidCandidate(message) => assert!(message.contains("invalid JSON")),
            other => panic!("unexpected event: {other:?}"),
        }
    }

    #[test]
    fn missing_file_is_offline() {
        match read_current_file("/tmp/pi-monitor-definitely-missing.json", &FixedClock(0)) {
            IngestEvent::Offline(message) => assert!(message.contains("missing")),
            other => panic!("unexpected event: {other:?}"),
        }
    }
}
