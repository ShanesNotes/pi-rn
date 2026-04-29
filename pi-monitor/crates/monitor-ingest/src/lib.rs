use anyhow::{Context, Result};
use notify::{RecursiveMode, Watcher, recommended_watcher};
use pulse_public_frame::{
    AssessmentCurrent, AssessmentStatus, EncounterCurrent, FrameError, PublicEventV2, PublicFrame,
    PublicLaneManifest, RunStatus, WaveformCurrent, WaveformSourceDetails, WaveformStatus,
    parse_assessment_current, parse_assessment_status, parse_encounter_current,
    parse_lane_manifest, parse_public_events_jsonl, parse_public_frame, parse_run_status,
    parse_waveform_current, parse_waveform_status,
};
use std::fs;
use std::io::{Read, Seek, SeekFrom};
use std::net::{TcpStream, ToSocketAddrs};
#[cfg(unix)]
use std::os::unix::fs::MetadataExt;
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
pub struct IngestedVitalsSnapshot {
    pub snapshot: PublicVitalsSnapshot,
    pub received_millis: u64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct PublicVitalsSnapshot {
    pub frame: PublicFrame,
    pub manifest: Option<PublicLaneManifest>,
    pub status: Option<RunStatus>,
    pub timeline: Vec<PublicFrame>,
    pub timeline_jsonl: Vec<PublicFrame>,
    pub events: Vec<PublicEventV2>,
    pub encounter: Option<EncounterCurrent>,
    pub assessment_status: Option<AssessmentStatus>,
    pub assessment_current: Option<AssessmentCurrent>,
    pub waveform_status: Option<WaveformStatus>,
    pub waveform_current: Option<WaveformCurrent>,
    pub lane_warnings: Vec<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum IngestEvent {
    Frame(Box<IngestedFrame>),
    VitalsSnapshot(Box<IngestedVitalsSnapshot>),
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
        Ok(frame) => IngestEvent::Frame(Box::new(IngestedFrame {
            frame,
            received_millis: clock.now_millis(),
        })),
        Err(err) => IngestEvent::InvalidCandidate(err.to_string()),
    }
}

pub fn read_vitals_dir(source_dir: impl AsRef<Path>, clock: &impl ReceiptClock) -> IngestEvent {
    let source_dir = source_dir.as_ref();
    let snapshot = match read_public_vitals_snapshot(source_dir) {
        Ok(snapshot) => snapshot,
        Err(ReadDirError::Offline(message)) => return IngestEvent::Offline(message),
        Err(ReadDirError::Invalid(message)) => return IngestEvent::InvalidCandidate(message),
    };
    IngestEvent::VitalsSnapshot(Box::new(IngestedVitalsSnapshot {
        snapshot,
        received_millis: clock.now_millis(),
    }))
}

pub fn read_public_vitals_snapshot(
    source_dir: impl AsRef<Path>,
) -> Result<PublicVitalsSnapshot, ReadDirError> {
    let source_dir = source_dir.as_ref();
    let current_path = source_dir.join("current.json");
    let current_text = read_required(&current_path)?;
    let mut frame = parse_public_frame(&current_text)
        .map_err(|err| ReadDirError::Invalid(format!("{}: {err}", current_path.display())))?;
    let mut lane_warnings = Vec::new();

    let manifest = read_optional(
        source_dir.join(".lanes.json"),
        parse_lane_manifest,
        &mut lane_warnings,
    );
    let status = read_optional(
        source_dir.join("status.json"),
        parse_run_status,
        &mut lane_warnings,
    );
    let events = read_optional(
        source_dir.join("events.jsonl"),
        parse_public_events_jsonl,
        &mut lane_warnings,
    )
    .unwrap_or_default();
    let encounter = read_optional(
        source_dir.join("encounter/current.json"),
        parse_encounter_current,
        &mut lane_warnings,
    );
    let assessment_status = read_optional(
        source_dir.join("assessments/status.json"),
        parse_assessment_status,
        &mut lane_warnings,
    );
    let assessment_current = read_optional(
        source_dir.join("assessments/current.json"),
        parse_assessment_current,
        &mut lane_warnings,
    );
    let waveform_status = read_optional(
        source_dir.join("waveforms/status.json"),
        parse_waveform_status,
        &mut lane_warnings,
    );
    let mut waveform_current = read_optional(
        source_dir.join("waveforms/current.json"),
        parse_waveform_current,
        &mut lane_warnings,
    );
    if waveform_status
        .as_ref()
        .map(|status| {
            status.available
                && waveform_current
                    .as_ref()
                    .map(|current| !waveform_current_matches_status(status, current))
                    .unwrap_or(true)
        })
        .unwrap_or(false)
        && let Some(current) =
            reread_waveform_current_after_writer_race(source_dir, waveform_status.as_ref())
    {
        waveform_current = Some(current);
    }
    let timeline = read_optional(
        source_dir.join("timeline.json"),
        parse_timeline_json,
        &mut lane_warnings,
    )
    .unwrap_or_default();
    let timeline_jsonl = read_optional(
        source_dir.join("timeline.jsonl"),
        parse_timeline_jsonl,
        &mut lane_warnings,
    )
    .unwrap_or_default();

    if !timeline.is_empty() && !timeline_jsonl.is_empty() && timeline.len() != timeline_jsonl.len()
    {
        lane_warnings.push(format!(
            "timeline count mismatch: timeline.json has {}, timeline.jsonl has {}",
            timeline.len(),
            timeline_jsonl.len()
        ));
    }

    let context = LaneContext {
        status: status.as_ref(),
        events: &events,
        encounter: encounter.as_ref(),
        assessment_status: assessment_status.as_ref(),
        assessment_current: assessment_current.as_ref(),
        waveform_status: waveform_status.as_ref(),
        waveform_current: waveform_current.as_ref(),
    };
    apply_public_lane_context(&mut frame, context, &mut lane_warnings);

    Ok(PublicVitalsSnapshot {
        frame,
        manifest,
        status,
        timeline,
        timeline_jsonl,
        events,
        encounter,
        assessment_status,
        assessment_current,
        waveform_status,
        waveform_current,
        lane_warnings,
    })
}

#[derive(Debug, Clone, PartialEq)]
pub enum ReadDirError {
    Offline(String),
    Invalid(String),
}

impl std::fmt::Display for ReadDirError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ReadDirError::Offline(message) | ReadDirError::Invalid(message) => f.write_str(message),
        }
    }
}

impl std::error::Error for ReadDirError {}

fn read_required(path: &Path) -> Result<String, ReadDirError> {
    fs::read_to_string(path).map_err(|err| {
        if err.kind() == std::io::ErrorKind::NotFound {
            ReadDirError::Offline(format!("{} missing", path.display()))
        } else {
            ReadDirError::Offline(format!("{} unreadable: {err}", path.display()))
        }
    })
}

fn read_optional<T>(
    path: PathBuf,
    parser: fn(&str) -> Result<T, FrameError>,
    lane_warnings: &mut Vec<String>,
) -> Option<T> {
    match fs::read_to_string(&path) {
        Ok(text) => match parser(&text) {
            Ok(value) => Some(value),
            Err(err) => {
                lane_warnings.push(format!("{} ignored: {err}", path.display()));
                None
            }
        },
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => {
            lane_warnings.push(format!("optional lane absent: {}", path.display()));
            None
        }
        Err(err) => {
            lane_warnings.push(format!("{} unreadable: {err}", path.display()));
            None
        }
    }
}

fn parse_timeline_json(input: &str) -> Result<Vec<PublicFrame>, FrameError> {
    let values: Vec<serde_json::Value> =
        serde_json::from_str(input).map_err(|err| FrameError::Json(err.to_string()))?;
    values
        .into_iter()
        .map(|value| {
            let text =
                serde_json::to_string(&value).map_err(|err| FrameError::Json(err.to_string()))?;
            parse_public_frame(&text)
        })
        .collect()
}

fn parse_timeline_jsonl(input: &str) -> Result<Vec<PublicFrame>, FrameError> {
    input
        .lines()
        .filter(|line| !line.trim().is_empty())
        .map(parse_public_frame)
        .collect()
}

struct LaneContext<'a> {
    status: Option<&'a RunStatus>,
    events: &'a [PublicEventV2],
    encounter: Option<&'a EncounterCurrent>,
    assessment_status: Option<&'a AssessmentStatus>,
    assessment_current: Option<&'a AssessmentCurrent>,
    waveform_status: Option<&'a WaveformStatus>,
    waveform_current: Option<&'a WaveformCurrent>,
}

fn apply_public_lane_context(
    frame: &mut PublicFrame,
    context: LaneContext<'_>,
    lane_warnings: &mut Vec<String>,
) {
    if let Some(status) = context.status {
        frame.source = status.source.clone();
        frame.sequence = status.sequence.or(frame.sequence);
        frame.run_state = Some(status.run_state.clone());
        frame.sim_time_s = status.sim_time_s;
        frame.wall_time = status
            .updated_at
            .clone()
            .or_else(|| status.wall_time.clone())
            .or(frame.wall_time.clone());
        frame.compatibility_notes.push(format!(
            "public status lane: runState={} sequence={}",
            status.run_state,
            status
                .sequence
                .map(|sequence| sequence.to_string())
                .unwrap_or_else(|| "unknown".to_string())
        ));
    }
    if !context.events.is_empty() {
        let recent = context
            .events
            .iter()
            .rev()
            .take(3)
            .map(|event| event.kind.as_str())
            .collect::<Vec<_>>()
            .into_iter()
            .rev()
            .collect::<Vec<_>>()
            .join(", ");
        frame
            .compatibility_notes
            .push(format!("recent public events: {recent}"));
    }
    if let Some(encounter) = context.encounter {
        let phase = encounter.phase.as_deref().unwrap_or("unknown");
        frame.compatibility_notes.push(format!(
            "encounter context: {} phase={phase}",
            encounter.encounter_id
        ));
    }
    if let Some(status) = context.assessment_status {
        frame.compatibility_notes.push(format!(
            "assessment lane: available={} lastRequest={}",
            status.available,
            status.last_request_id.as_deref().unwrap_or("none")
        ));
    }
    if let Some(current) = context.assessment_current
        && let Some(summary) = &current.summary
    {
        frame
            .compatibility_notes
            .push(format!("assessment display summary: {summary}"));
    }
    match (context.waveform_status, context.waveform_current) {
        (Some(status), Some(current)) if status.available => {
            if waveform_current_matches_status(status, current) {
                frame.waveforms = current.windows.clone();
                frame.waveform_source = Some(WaveformSourceDetails {
                    source_kind: current
                        .source_kind
                        .clone()
                        .or_else(|| status.source_kind.clone())
                        .unwrap_or_else(|| "unknown".to_string()),
                    fidelity: current
                        .fidelity
                        .clone()
                        .or_else(|| status.fidelity.clone())
                        .unwrap_or_else(|| "unknown".to_string()),
                    synthetic: current.synthetic.or(status.synthetic).unwrap_or(false),
                });
                frame.compatibility_notes.push(format!(
                    "waveform lane: {} valid strip(s) · sourceKind={} fidelity={} synthetic={}",
                    frame.waveforms.len(),
                    frame
                        .waveform_source
                        .as_ref()
                        .map(|source| source.source_kind.as_str())
                        .unwrap_or("unknown"),
                    frame
                        .waveform_source
                        .as_ref()
                        .map(|source| source.fidelity.as_str())
                        .unwrap_or("unknown"),
                    frame
                        .waveform_source
                        .as_ref()
                        .map(|source| source.synthetic)
                        .unwrap_or(false),
                ));
            } else {
                lane_warnings.push(
                    "mismatch: waveforms/current.json ignored because sequence/simTime_s/source/runState differ from waveforms/status.json"
                        .to_string(),
                );
            }
        }
        (Some(status), Some(_)) if !status.available => {
            lane_warnings.push(
                "waveforms/current.json ignored: waveforms/status.json says unavailable"
                    .to_string(),
            );
        }
        (Some(status), None) if status.available => lane_warnings.push(
            "waveforms/status.json says available but waveforms/current.json is absent".to_string(),
        ),
        (Some(status), None) => frame.compatibility_notes.push(format!(
            "waveform lane unavailable: {}",
            status.reason.as_deref().unwrap_or("unspecified")
        )),
        (None, Some(_)) => lane_warnings
            .push("waveforms/current.json ignored: waveforms/status.json is absent".to_string()),
        (None, None) => {}
        (Some(_), Some(_)) => {}
    }
    frame.compatibility_notes.extend(
        lane_warnings
            .iter()
            .map(|warning| format!("lane warning: {warning}")),
    );
}

fn reread_waveform_current_after_writer_race(
    source_dir: &Path,
    status: Option<&WaveformStatus>,
) -> Option<WaveformCurrent> {
    let status = status?;
    let current_path = source_dir.join("waveforms/current.json");
    for _ in 0..5 {
        thread::sleep(Duration::from_millis(20));
        let text = fs::read_to_string(&current_path).ok()?;
        let current = parse_waveform_current(&text).ok()?;
        if waveform_current_matches_status(status, &current) {
            return Some(current);
        }
    }
    None
}

fn waveform_current_matches_status(status: &WaveformStatus, current: &WaveformCurrent) -> bool {
    status.sequence == current.sequence
        && status.source == current.source
        && status.run_state == current.run_state
        && (status.sim_time_s - current.sim_time_s).abs() < f64::EPSILON
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

pub fn watch_vitals_dir(
    config: WatchConfig,
    mut on_event: impl FnMut(IngestEvent) -> bool,
) -> Result<()> {
    match watch_vitals_dir_native(config.clone(), &mut on_event) {
        Ok(()) => Ok(()),
        Err(_) => watch_vitals_dir_polling(config, on_event),
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

pub fn watch_vitals_dir_native(
    config: WatchConfig,
    on_event: &mut impl FnMut(IngestEvent) -> bool,
) -> Result<()> {
    let clock = MonotonicClock::default();
    let (tx, rx) = mpsc::channel();
    let mut watcher = recommended_watcher(move |result| {
        let _ = tx.send(result);
    })?;
    watcher.watch(&config.source, RecursiveMode::Recursive)?;
    let mut last_modified = latest_modified_under(&config.source);
    loop {
        match rx.recv_timeout(config.poll_interval) {
            Ok(Ok(_event)) => {
                thread::sleep(config.debounce);
                if !on_event(read_vitals_dir(&config.source, &clock)) {
                    return Ok(());
                }
            }
            Ok(Err(err)) => return Err(err.into()),
            Err(mpsc::RecvTimeoutError::Timeout) => {
                let modified = latest_modified_under(&config.source);
                if modified != last_modified {
                    last_modified = modified;
                    thread::sleep(config.debounce);
                    if !on_event(read_vitals_dir(&config.source, &clock)) {
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

pub fn watch_vitals_dir_polling(
    config: WatchConfig,
    mut on_event: impl FnMut(IngestEvent) -> bool,
) -> Result<()> {
    let clock = MonotonicClock::default();
    let mut last_modified = latest_modified_under(&config.source);
    loop {
        let modified = latest_modified_under(&config.source);
        if modified != last_modified {
            last_modified = modified;
            thread::sleep(config.debounce);
            if !on_event(read_vitals_dir(&config.source, &clock)) {
                return Ok(());
            }
        }
        thread::sleep(config.poll_interval);
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct JsonlTailStats {
    pub byte_offset: u64,
    pub pending_bytes: usize,
    pub frames: u64,
    pub invalid_lines: u64,
    pub empty_lines: u64,
    pub oversized_lines: u64,
    pub resets: u64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct JsonlFrameTailer {
    byte_offset: u64,
    pending: Vec<u8>,
    max_line_bytes: usize,
    file_id: Option<FileIdentity>,
    file_prefix: Vec<u8>,
    stats: JsonlTailStats,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct FileIdentity {
    dev: u64,
    ino: u64,
}

impl Default for JsonlFrameTailer {
    fn default() -> Self {
        Self::new()
    }
}

impl JsonlFrameTailer {
    pub fn new() -> Self {
        Self::with_max_line_bytes(1024 * 1024)
    }

    pub fn with_max_line_bytes(max_line_bytes: usize) -> Self {
        let max_line_bytes = max_line_bytes.max(1);
        Self {
            byte_offset: 0,
            pending: Vec::new(),
            max_line_bytes,
            file_id: None,
            file_prefix: Vec::new(),
            stats: JsonlTailStats {
                byte_offset: 0,
                pending_bytes: 0,
                frames: 0,
                invalid_lines: 0,
                empty_lines: 0,
                oversized_lines: 0,
                resets: 0,
            },
        }
    }

    pub fn stats(&self) -> &JsonlTailStats {
        &self.stats
    }

    pub fn poll_path(
        &mut self,
        path: impl AsRef<Path>,
        clock: &impl ReceiptClock,
    ) -> Vec<IngestEvent> {
        let path = path.as_ref();
        let metadata = match fs::metadata(path) {
            Ok(metadata) => metadata,
            Err(err) if err.kind() == std::io::ErrorKind::NotFound => {
                return vec![IngestEvent::Offline(format!("{} missing", path.display()))];
            }
            Err(err) => {
                return vec![IngestEvent::Offline(format!(
                    "{} unreadable: {err}",
                    path.display()
                ))];
            }
        };

        let current_file_id = file_identity(&metadata);
        let current_prefix = match read_file_prefix(path) {
            Ok(prefix) => prefix,
            Err(err) => {
                return vec![IngestEvent::Offline(format!(
                    "{} unreadable: {err}",
                    path.display()
                ))];
            }
        };
        let file_identity_changed = self
            .file_id
            .zip(current_file_id)
            .map(|(previous, current)| previous != current)
            .unwrap_or(false);
        let file_prefix_changed = self.byte_offset > 0
            && !self.file_prefix.is_empty()
            && !current_prefix.starts_with(&self.file_prefix);
        if file_identity_changed || file_prefix_changed || metadata.len() < self.byte_offset {
            self.byte_offset = 0;
            self.pending.clear();
            self.stats.resets += 1;
        }
        self.file_id = current_file_id;
        self.file_prefix = current_prefix;
        if metadata.len() == self.byte_offset {
            self.update_stats();
            return Vec::new();
        }

        let mut file = match fs::File::open(path) {
            Ok(file) => file,
            Err(err) => {
                return vec![IngestEvent::Offline(format!(
                    "{} unreadable: {err}",
                    path.display()
                ))];
            }
        };
        if let Err(err) = file.seek(SeekFrom::Start(self.byte_offset)) {
            return vec![IngestEvent::Offline(format!(
                "{} seek failed at {}: {err}",
                path.display(),
                self.byte_offset
            ))];
        }
        let mut appended = Vec::new();
        if let Err(err) = file.read_to_end(&mut appended) {
            return vec![IngestEvent::Offline(format!(
                "{} read failed at {}: {err}",
                path.display(),
                self.byte_offset
            ))];
        }
        self.byte_offset = self
            .byte_offset
            .saturating_add(u64::try_from(appended.len()).unwrap_or(u64::MAX));
        self.pending.extend(appended);
        let mut events = self.drain_complete_lines(clock);
        if self.pending.len() > self.max_line_bytes {
            self.pending.clear();
            self.stats.invalid_lines += 1;
            self.stats.oversized_lines += 1;
            events.push(IngestEvent::InvalidCandidate(format!(
                "timeline.jsonl line exceeded {} bytes before newline",
                self.max_line_bytes
            )));
        }
        self.update_stats();
        events
    }

    fn drain_complete_lines(&mut self, clock: &impl ReceiptClock) -> Vec<IngestEvent> {
        let mut events = Vec::new();
        while let Some(newline_idx) = self.pending.iter().position(|byte| *byte == b'\n') {
            let mut line = self.pending.drain(..=newline_idx).collect::<Vec<_>>();
            if line.last() == Some(&b'\n') {
                line.pop();
            }
            if line.last() == Some(&b'\r') {
                line.pop();
            }
            if let Some(event) = self.event_for_line(line, clock) {
                events.push(event);
            }
        }
        events
    }

    fn event_for_line(&mut self, line: Vec<u8>, clock: &impl ReceiptClock) -> Option<IngestEvent> {
        if line.is_empty() {
            self.stats.empty_lines += 1;
            return None;
        }
        if line.len() > self.max_line_bytes {
            self.stats.invalid_lines += 1;
            self.stats.oversized_lines += 1;
            return Some(IngestEvent::InvalidCandidate(format!(
                "timeline.jsonl line exceeded {} bytes",
                self.max_line_bytes
            )));
        }
        let text = match std::str::from_utf8(&line) {
            Ok(text) => text,
            Err(err) => {
                self.stats.invalid_lines += 1;
                return Some(IngestEvent::InvalidCandidate(format!(
                    "timeline.jsonl invalid UTF-8: {err}"
                )));
            }
        };
        match parse_public_frame(text) {
            Ok(frame) => {
                self.stats.frames += 1;
                Some(IngestEvent::Frame(Box::new(IngestedFrame {
                    frame,
                    received_millis: clock.now_millis(),
                })))
            }
            Err(err) => {
                self.stats.invalid_lines += 1;
                Some(IngestEvent::InvalidCandidate(format!(
                    "timeline.jsonl invalid JSON frame: {err}"
                )))
            }
        }
    }

    fn update_stats(&mut self) {
        self.stats.byte_offset = self.byte_offset;
        self.stats.pending_bytes = self.pending.len();
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TcpNdjsonStats {
    pub frames: u64,
    pub invalid_lines: u64,
    pub empty_lines: u64,
    pub oversized_lines: u64,
    pub pending_bytes: usize,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TcpNdjsonDecoder {
    pending: Vec<u8>,
    max_line_bytes: usize,
    last_sequence: Option<u64>,
    stats: TcpNdjsonStats,
}

impl Default for TcpNdjsonDecoder {
    fn default() -> Self {
        Self::new()
    }
}

impl TcpNdjsonDecoder {
    pub fn new() -> Self {
        Self::with_max_line_bytes(1024 * 1024)
    }

    pub fn with_max_line_bytes(max_line_bytes: usize) -> Self {
        Self {
            pending: Vec::new(),
            max_line_bytes: max_line_bytes.max(1),
            last_sequence: None,
            stats: TcpNdjsonStats {
                frames: 0,
                invalid_lines: 0,
                empty_lines: 0,
                oversized_lines: 0,
                pending_bytes: 0,
            },
        }
    }

    pub fn stats(&self) -> &TcpNdjsonStats {
        &self.stats
    }

    pub fn feed(&mut self, bytes: &[u8], clock: &impl ReceiptClock) -> Vec<IngestEvent> {
        self.pending.extend_from_slice(bytes);
        let mut events = Vec::new();
        while let Some(newline_idx) = self.pending.iter().position(|byte| *byte == b'\n') {
            let mut line = self.pending.drain(..=newline_idx).collect::<Vec<_>>();
            if line.last() == Some(&b'\n') {
                line.pop();
            }
            if line.last() == Some(&b'\r') {
                line.pop();
            }
            if let Some(event) = self.event_for_line(line, clock) {
                events.push(event);
            }
        }
        if self.pending.len() > self.max_line_bytes {
            self.pending.clear();
            self.stats.invalid_lines += 1;
            self.stats.oversized_lines += 1;
            events.push(IngestEvent::InvalidCandidate(format!(
                "live TCP NDJSON line exceeded {} bytes before newline",
                self.max_line_bytes
            )));
        }
        self.stats.pending_bytes = self.pending.len();
        events
    }

    fn event_for_line(&mut self, line: Vec<u8>, clock: &impl ReceiptClock) -> Option<IngestEvent> {
        if line.is_empty() {
            self.stats.empty_lines += 1;
            return None;
        }
        if line.len() > self.max_line_bytes {
            self.stats.invalid_lines += 1;
            self.stats.oversized_lines += 1;
            return Some(IngestEvent::InvalidCandidate(format!(
                "live TCP NDJSON line exceeded {} bytes",
                self.max_line_bytes
            )));
        }
        let text = match std::str::from_utf8(&line) {
            Ok(text) => text,
            Err(err) => {
                self.stats.invalid_lines += 1;
                return Some(IngestEvent::InvalidCandidate(format!(
                    "live TCP NDJSON invalid UTF-8: {err}"
                )));
            }
        };
        match parse_tcp_envelope_frame(text).and_then(|(frame, sequence)| {
            self.validate_next_sequence(sequence)?;
            Ok(frame)
        }) {
            Ok(frame) => {
                self.stats.frames += 1;
                Some(IngestEvent::Frame(Box::new(IngestedFrame {
                    frame,
                    received_millis: clock.now_millis(),
                })))
            }
            Err(message) => {
                self.stats.invalid_lines += 1;
                Some(IngestEvent::InvalidCandidate(message))
            }
        }
    }

    fn validate_next_sequence(&mut self, sequence: u64) -> std::result::Result<(), String> {
        if let Some(previous) = self.last_sequence {
            let expected = previous.checked_add(1).ok_or_else(|| {
                "live TCP NDJSON previous sequence cannot be incremented".to_string()
            })?;
            if sequence != expected {
                return Err(format!(
                    "live TCP NDJSON sequence discontinuity: expected {expected}, got {sequence}"
                ));
            }
        }
        self.last_sequence = Some(sequence);
        Ok(())
    }
}

pub fn watch_live_tcp(addr: &str, mut on_event: impl FnMut(IngestEvent) -> bool) -> Result<()> {
    let socket_addrs = addr
        .to_socket_addrs()
        .with_context(|| format!("resolve live TCP address {addr}"))?
        .filter(|candidate| candidate.ip().is_loopback())
        .collect::<Vec<_>>();
    if socket_addrs.is_empty() {
        anyhow::bail!("live TCP address must resolve to loopback/private localhost: {addr}");
    }
    let mut last_error = None;
    let mut connected = None;
    for candidate in socket_addrs {
        match TcpStream::connect(candidate) {
            Ok(stream) => {
                connected = Some((candidate, stream));
                break;
            }
            Err(err) => last_error = Some((candidate, err)),
        }
    }
    let (socket_addr, mut stream) = connected.with_context(|| {
        if let Some((candidate, err)) = last_error {
            format!("connect live TCP NDJSON stream at {candidate}: {err}")
        } else {
            format!("connect live TCP NDJSON stream at {addr}")
        }
    })?;
    stream
        .set_nodelay(true)
        .with_context(|| format!("set TCP_NODELAY for {socket_addr}"))?;
    let clock = MonotonicClock::default();
    let mut decoder = TcpNdjsonDecoder::new();
    let mut buf = [0_u8; 8192];
    loop {
        let read = stream
            .read(&mut buf)
            .with_context(|| format!("read live TCP NDJSON stream at {socket_addr}"))?;
        if read == 0 {
            let _ = on_event(IngestEvent::Offline(format!(
                "live TCP NDJSON stream closed: {socket_addr}"
            )));
            return Ok(());
        }
        for event in decoder.feed(&buf[..read], &clock) {
            if !on_event(event) {
                return Ok(());
            }
        }
    }
}

fn parse_tcp_envelope_frame(input: &str) -> std::result::Result<(PublicFrame, u64), String> {
    let value: serde_json::Value = serde_json::from_str(input)
        .map_err(|err| format!("live TCP NDJSON invalid JSON: {err}"))?;
    let object = value
        .as_object()
        .ok_or_else(|| "live TCP NDJSON envelope must be a JSON object".to_string())?;
    match object
        .get("schemaVersion")
        .and_then(serde_json::Value::as_u64)
    {
        Some(1) => {}
        Some(version) => {
            return Err(format!(
                "live TCP NDJSON unsupported schemaVersion {version}; expected 1"
            ));
        }
        None => {
            return Err(
                "live TCP NDJSON envelope schemaVersion must be unsigned integer 1".to_string(),
            );
        }
    }
    match object.get("kind").and_then(serde_json::Value::as_str) {
        Some("frame") => {}
        Some(kind) => {
            return Err(format!(
                "live TCP NDJSON unsupported envelope kind {kind}; expected frame"
            ));
        }
        None => return Err("live TCP NDJSON envelope kind must be \"frame\"".to_string()),
    }
    let envelope_sequence = object
        .get("sequence")
        .and_then(serde_json::Value::as_u64)
        .ok_or_else(|| {
            "live TCP NDJSON envelope sequence must be an unsigned integer".to_string()
        })?;
    let payload = object
        .get("payload")
        .ok_or_else(|| "live TCP NDJSON envelope missing payload".to_string())?;
    if !payload.is_object() {
        return Err("live TCP NDJSON envelope payload must be a JSON object".to_string());
    }
    let payload_text = serde_json::to_string(payload)
        .map_err(|err| format!("live TCP NDJSON payload encode failed: {err}"))?;
    let frame = parse_public_frame(&payload_text)
        .map_err(|err| format!("live TCP NDJSON invalid payload frame: {err}"))?;
    if let Some(payload_sequence) = frame.sequence
        && envelope_sequence != payload_sequence
    {
        return Err(format!(
            "live TCP NDJSON envelope sequence {envelope_sequence} does not match payload sequence {payload_sequence}"
        ));
    }
    Ok((frame, envelope_sequence))
}

#[cfg(unix)]
fn file_identity(metadata: &fs::Metadata) -> Option<FileIdentity> {
    Some(FileIdentity {
        dev: metadata.dev(),
        ino: metadata.ino(),
    })
}

#[cfg(not(unix))]
fn file_identity(_metadata: &fs::Metadata) -> Option<FileIdentity> {
    None
}

fn read_file_prefix(path: &Path) -> std::io::Result<Vec<u8>> {
    const FILE_PREFIX_BYTES: usize = 256;
    let mut file = fs::File::open(path)?;
    let mut prefix = vec![0; FILE_PREFIX_BYTES];
    let read = file.read(&mut prefix)?;
    prefix.truncate(read);
    Ok(prefix)
}

fn latest_modified_under(path: &Path) -> Option<SystemTime> {
    let mut latest = fs::metadata(path)
        .and_then(|metadata| metadata.modified())
        .ok();
    let Ok(entries) = fs::read_dir(path) else {
        return latest;
    };
    for entry in entries.flatten() {
        let child = entry.path();
        let child_latest = if child.is_dir() {
            latest_modified_under(&child)
        } else {
            fs::metadata(&child)
                .and_then(|metadata| metadata.modified())
                .ok()
        };
        if child_latest > latest {
            latest = child_latest;
        }
    }
    latest
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
    use std::path::Path;

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

    #[test]
    fn jsonl_tailer_reads_only_complete_appended_lines_by_offset() {
        let mut file = tempfile::NamedTempFile::new().unwrap();
        writeln!(file, r#"{{"t":1,"hr":70,"alarms":[]}}"#).unwrap();
        write!(file, r#"{{"t""#).unwrap();
        file.flush().unwrap();

        let mut tailer = JsonlFrameTailer::new();
        let events = tailer.poll_path(file.path(), &FixedClock(10));
        assert_eq!(events.len(), 1);
        match &events[0] {
            IngestEvent::Frame(frame) => {
                assert_eq!(frame.received_millis, 10);
                assert_eq!(frame.frame.sim_time_s, 1.0);
            }
            other => panic!("unexpected event: {other:?}"),
        }
        assert!(tailer.stats().byte_offset > 0);
        assert_eq!(tailer.stats().pending_bytes, 4);

        writeln!(file, r#":2,"hr":71,"alarms":[]}}"#).unwrap();
        file.flush().unwrap();
        let events = tailer.poll_path(file.path(), &FixedClock(20));
        assert_eq!(events.len(), 1);
        match &events[0] {
            IngestEvent::Frame(frame) => assert_eq!(frame.frame.sim_time_s, 2.0),
            other => panic!("unexpected event: {other:?}"),
        }
        assert_eq!(tailer.stats().frames, 2);
        assert_eq!(tailer.stats().pending_bytes, 0);
    }

    #[test]
    fn jsonl_tailer_handles_file_replacement_even_when_length_does_not_shrink() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("timeline.jsonl");
        fs::write(&path, b"{\"t\":1}\n").unwrap();
        let mut tailer = JsonlFrameTailer::new();
        assert_eq!(tailer.poll_path(&path, &FixedClock(1)).len(), 1);
        let first_offset = tailer.stats().byte_offset;

        let replacement = dir.path().join("timeline-next.jsonl");
        fs::write(&replacement, b"{\"t\":2}\n{\"t\":3}\n").unwrap();
        fs::rename(&replacement, &path).unwrap();
        let events = tailer.poll_path(&path, &FixedClock(2));
        assert_eq!(events.len(), 2);
        assert_eq!(tailer.stats().resets, 1);
        assert!(tailer.stats().byte_offset > first_offset);
        match &events[0] {
            IngestEvent::Frame(frame) => assert_eq!(frame.frame.sim_time_s, 2.0),
            other => panic!("unexpected event: {other:?}"),
        }
    }

    #[test]
    fn jsonl_tailer_handles_truncation_reset() {
        let mut file = tempfile::NamedTempFile::new().unwrap();
        writeln!(file, r#"{{"t":1,"hr":70,"alarms":[]}}"#).unwrap();
        file.flush().unwrap();
        let mut tailer = JsonlFrameTailer::new();
        assert_eq!(tailer.poll_path(file.path(), &FixedClock(1)).len(), 1);

        file.as_file_mut().set_len(0).unwrap();
        file.as_file_mut().seek(SeekFrom::Start(0)).unwrap();
        writeln!(file, r#"{{"t":3}}"#).unwrap();
        file.flush().unwrap();
        let events = tailer.poll_path(file.path(), &FixedClock(2));
        assert_eq!(tailer.stats().resets, 1);
        match &events[0] {
            IngestEvent::Frame(frame) => assert_eq!(frame.frame.sim_time_s, 3.0),
            other => panic!("unexpected event: {other:?}"),
        }
    }

    #[test]
    fn jsonl_tailer_reports_invalid_utf8_json_empty_and_oversized_lines() {
        let mut file = tempfile::NamedTempFile::new().unwrap();
        file.write_all(b"\n\xff\nbad\n123456\n").unwrap();
        file.flush().unwrap();

        let mut tailer = JsonlFrameTailer::with_max_line_bytes(4);
        let events = tailer.poll_path(file.path(), &FixedClock(0));
        assert_eq!(events.len(), 3);
        let messages = events
            .iter()
            .map(|event| match event {
                IngestEvent::InvalidCandidate(message) => message.as_str(),
                other => panic!("unexpected event: {other:?}"),
            })
            .collect::<Vec<_>>()
            .join("\n");
        assert!(messages.contains("invalid UTF-8"));
        assert!(messages.contains("invalid JSON frame"));
        assert!(messages.contains("exceeded 4 bytes"));
        assert_eq!(tailer.stats().empty_lines, 1);
        assert_eq!(tailer.stats().invalid_lines, 3);
        assert_eq!(tailer.stats().oversized_lines, 1);
    }

    #[test]
    fn jsonl_tailer_reports_oversized_partial_line_before_newline() {
        let mut file = tempfile::NamedTempFile::new().unwrap();
        write!(file, "12345").unwrap();
        file.flush().unwrap();
        let mut tailer = JsonlFrameTailer::with_max_line_bytes(4);
        let events = tailer.poll_path(file.path(), &FixedClock(0));
        assert_eq!(events.len(), 1);
        match &events[0] {
            IngestEvent::InvalidCandidate(message) => assert!(message.contains("before newline")),
            other => panic!("unexpected event: {other:?}"),
        }
        assert_eq!(tailer.stats().pending_bytes, 0);
        assert_eq!(tailer.stats().oversized_lines, 1);
    }

    #[test]
    fn tcp_ndjson_decoder_accepts_envelope_and_checks_sequence() {
        let mut decoder = TcpNdjsonDecoder::new();
        let good = br#"{"schemaVersion":1,"kind":"frame","sequence":7,"payload":{"t":7,"hr":80,"alarms":[],"monitor":{"schemaVersion":1,"source":"pi-sim-demo-waveform","sequence":7,"runState":"running","events":[],"heartRhythm":"unavailable"}}}
"#;
        let events = decoder.feed(good, &FixedClock(77));
        assert_eq!(events.len(), 1);
        match &events[0] {
            IngestEvent::Frame(frame) => {
                assert_eq!(frame.received_millis, 77);
                assert_eq!(frame.frame.sequence, Some(7));
                assert_eq!(frame.frame.sim_time_s, 7.0);
            }
            other => panic!("unexpected event: {other:?}"),
        }

        let next = br#"{"schemaVersion":1,"kind":"frame","sequence":8,"payload":{"t":8,"hr":81,"alarms":[],"monitor":{"schemaVersion":1,"source":"pi-sim-demo-waveform","sequence":8,"runState":"running"}}}
"#;
        assert!(matches!(
            decoder.feed(next, &FixedClock(78)).as_slice(),
            [IngestEvent::Frame(_)]
        ));

        let bad = br#"{"schemaVersion":1,"kind":"frame","sequence":9,"payload":{"t":9,"hr":80,"alarms":[],"monitor":{"schemaVersion":1,"source":"pi-sim-demo-waveform","sequence":8,"runState":"running"}}}
"#;
        let events = decoder.feed(bad, &FixedClock(79));
        assert_eq!(events.len(), 1);
        match &events[0] {
            IngestEvent::InvalidCandidate(message) => assert!(message.contains("does not match")),
            other => panic!("unexpected event: {other:?}"),
        }
    }

    #[test]
    fn tcp_ndjson_decoder_rejects_sequence_gaps_duplicates_and_old_frames() {
        let mut decoder = TcpNdjsonDecoder::new();
        let first = br#"{"schemaVersion":1,"kind":"frame","sequence":100,"payload":{"t":100,"hr":80,"alarms":[],"monitor":{"schemaVersion":1,"source":"pi-sim-demo-waveform","sequence":100,"runState":"running"}}}
"#;
        assert!(matches!(
            decoder.feed(first, &FixedClock(1)).as_slice(),
            [IngestEvent::Frame(_)]
        ));

        for line in [
            br#"{"schemaVersion":1,"kind":"frame","sequence":100,"payload":{"t":100,"hr":80,"alarms":[],"monitor":{"schemaVersion":1,"source":"pi-sim-demo-waveform","sequence":100,"runState":"running"}}}
"#
            .as_slice(),
            br#"{"schemaVersion":1,"kind":"frame","sequence":99,"payload":{"t":99,"hr":80,"alarms":[],"monitor":{"schemaVersion":1,"source":"pi-sim-demo-waveform","sequence":99,"runState":"running"}}}
"#
            .as_slice(),
            br#"{"schemaVersion":1,"kind":"frame","sequence":102,"payload":{"t":102,"hr":80,"alarms":[],"monitor":{"schemaVersion":1,"source":"pi-sim-demo-waveform","sequence":102,"runState":"running"}}}
"#
            .as_slice(),
        ] {
            let events = decoder.feed(line, &FixedClock(2));
            assert_eq!(events.len(), 1);
            match &events[0] {
                IngestEvent::InvalidCandidate(message) => {
                    assert!(message.contains("sequence discontinuity"))
                }
                other => panic!("unexpected event: {other:?}"),
            }
        }

        let next = br#"{"schemaVersion":1,"kind":"frame","sequence":101,"payload":{"t":101,"hr":81,"alarms":[],"monitor":{"schemaVersion":1,"source":"pi-sim-demo-waveform","sequence":101,"runState":"running"}}}
"#;
        assert!(matches!(
            decoder.feed(next, &FixedClock(3)).as_slice(),
            [IngestEvent::Frame(_)]
        ));
    }

    #[test]
    fn tcp_ndjson_decoder_rejects_wrong_schema_kind_and_payload_shape() {
        let mut decoder = TcpNdjsonDecoder::new();
        for line in [
            br#"{"schemaVersion":2,"kind":"frame","sequence":1,"payload":{"t":1}}
"#
            .as_slice(),
            br#"{"schemaVersion":1,"kind":"event","sequence":1,"payload":{"t":1}}
"#
            .as_slice(),
            br#"{"schemaVersion":1,"kind":"frame","sequence":1,"payload":42}
"#
            .as_slice(),
            br#"{"schemaVersion":1,"kind":"frame","payload":{"t":1}}
"#
            .as_slice(),
        ] {
            let events = decoder.feed(line, &FixedClock(0));
            assert_eq!(events.len(), 1);
            assert!(matches!(events[0], IngestEvent::InvalidCandidate(_)));
        }
        assert_eq!(decoder.stats().frames, 0);
        assert_eq!(decoder.stats().invalid_lines, 4);
    }

    #[test]
    fn tcp_ndjson_decoder_handles_partial_invalid_utf8_json_empty_and_oversized() {
        let mut decoder = TcpNdjsonDecoder::with_max_line_bytes(8);
        assert!(decoder.feed(b"{\"schema", &FixedClock(0)).is_empty());
        assert_eq!(decoder.stats().pending_bytes, 8);
        let events = decoder.feed(b"Version\":1}\n\n\xff\nbad\n123456789\n", &FixedClock(0));
        let messages = events
            .iter()
            .map(|event| match event {
                IngestEvent::InvalidCandidate(message) => message.as_str(),
                other => panic!("unexpected event: {other:?}"),
            })
            .collect::<Vec<_>>()
            .join("\n");
        assert!(messages.contains("exceeded 8 bytes"));
        assert!(messages.contains("invalid UTF-8"));
        assert!(messages.contains("invalid JSON"));
        assert_eq!(decoder.stats().empty_lines, 1);
        assert_eq!(decoder.stats().invalid_lines, 4);
        assert_eq!(decoder.stats().oversized_lines, 2);
    }

    #[test]
    fn reads_scripted_demo_public_dir() {
        let manifest = fs::read_to_string(
            Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("../../fixtures/public-contract/.lanes.json"),
        )
        .and_then(|text| {
            parse_lane_manifest(&text)
                .map(|manifest| manifest.lanes)
                .map_err(std::io::Error::other)
        })
        .unwrap();
        assert!(manifest.iter().any(|lane| lane.path == "current.json"));
        assert!(manifest.iter().any(|lane| lane.path == "events.jsonl"));

        let snapshot = fixture_snapshot("scripted-demo");
        assert_eq!(snapshot.status.unwrap().run_state, "ended");
        assert_eq!(snapshot.timeline.len(), snapshot.timeline_jsonl.len());
        assert!(!snapshot.events.is_empty());
        assert_eq!(snapshot.events[0].event_index, 0);
        assert!(snapshot.encounter.is_some());
        assert!(snapshot.assessment_status.unwrap().available);
        assert!(snapshot.assessment_current.is_some());
        assert!(snapshot.waveform_status.is_some());
        assert!(snapshot.waveform_current.is_none());
        assert!(
            snapshot
                .frame
                .compatibility_notes
                .iter()
                .any(|note| note.contains("recent public events"))
        );
    }

    #[test]
    fn reads_scripted_alarm_public_dir() {
        let snapshot = fixture_snapshot("scripted-alarm");
        let text = snapshot
            .events
            .iter()
            .map(|event| event.payload.to_string())
            .collect::<Vec<_>>()
            .join("\n");
        assert!(text.contains("MAP_LOW"));
        assert!(text.contains("SPO2_LOW"));
    }

    #[test]
    fn provider_unavailable_maps_to_unavailable_run_state() {
        let snapshot = fixture_snapshot("provider-unavailable");
        assert_eq!(snapshot.frame.run_state.as_deref(), Some("unavailable"));
        assert_eq!(snapshot.events.last().unwrap().kind, "provider_unavailable");
    }

    #[test]
    fn stale_waveform_current_is_ignored_and_warned() {
        let snapshot = fixture_snapshot("stale-waveform");
        assert!(snapshot.frame.waveforms.is_empty());
        assert!(
            snapshot
                .lane_warnings
                .iter()
                .any(|warning| warning.contains("mismatch"))
        );
    }

    #[test]
    fn contract_shaped_available_waveform_windows_are_displayed() {
        let snapshot = fixture_snapshot("available-waveform");
        assert!(snapshot.frame.waveforms["ECG_LeadII"].values.len() > 10);
        assert!(snapshot.frame.waveforms["Pleth"].values.len() > 10);
        assert_eq!(
            snapshot.frame.waveform_source.as_ref().unwrap().source_kind,
            "demo"
        );
        assert_eq!(
            snapshot.frame.waveform_source.as_ref().unwrap().fidelity,
            "demo"
        );
        assert!(snapshot.frame.waveform_source.as_ref().unwrap().synthetic);
        assert!(snapshot.frame.compatibility_notes.iter().any(|note| {
            note.contains("waveform lane: 2 valid strip")
                && note.contains("sourceKind=demo")
                && note.contains("fidelity=demo")
                && note.contains("synthetic=true")
        }));
    }

    fn fixture_snapshot(case: &str) -> PublicVitalsSnapshot {
        let root = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../fixtures/public-contract")
            .join(case);
        match read_vitals_dir(root, &FixedClock(99)) {
            IngestEvent::VitalsSnapshot(ingested) => {
                assert_eq!(ingested.received_millis, 99);
                ingested.snapshot
            }
            other => panic!("unexpected event: {other:?}"),
        }
    }
}
