use anyhow::{Context, Result, bail};
use monitor_core::MonitorCore;
use monitor_ingest::{
    IngestEvent, JsonlFrameTailer, MonotonicClock, ReceiptClock, WatchConfig, read_current_file,
    read_fixture, read_vitals_dir, watch, watch_live_tcp, watch_vitals_dir,
};
use monitor_ui::{render_html, render_terminal};
use std::fs;
use std::path::PathBuf;
use std::thread;
use std::time::Duration;

fn main() -> Result<()> {
    let mut args = std::env::args().skip(1);
    let Some(command) = args.next() else {
        usage();
        return Ok(());
    };
    match command.as_str() {
        "render" => render_cmd(args.collect()),
        "watch" => watch_cmd(args.collect()),
        "replay" => replay_cmd(args.collect()),
        "replay-dir" => replay_dir_cmd(args.collect()),
        "tail-jsonl" => tail_jsonl_cmd(args.collect()),
        "live-tcp" => live_tcp_cmd(args.collect()),
        "help" | "--help" | "-h" => {
            usage();
            Ok(())
        }
        other => bail!("unknown command {other}"),
    }
}

fn render_cmd(args: Vec<String>) -> Result<()> {
    let opts = parse_opts(args)?;
    opts.reject_replay_inputs("render")?;
    opts.reject_live_tcp("render")?;
    if opts.no_sleep || opts.poll_millis.is_some() || opts.debounce_millis.is_some() {
        bail!("render does not accept --no-sleep, --poll-ms, or --debounce-ms");
    }
    opts.validate_source_choice("render")?;
    let clock = MonotonicClock::default();
    let event = if let Some(source_dir) = &opts.source_dir {
        read_vitals_dir(source_dir, &clock)
    } else {
        let source = opts.source.as_ref().expect("validated source");
        read_current_file(source, &clock)
    };
    let mut core = MonitorCore::new();
    apply_event(&mut core, event);
    let model = core.display_model(clock.now_millis());
    if let Some(html_path) = opts.html {
        fs::write(&html_path, render_html(&model))
            .with_context(|| format!("write {}", html_path.display()))?;
        println!("wrote {}", html_path.display());
    } else {
        print!("{}", render_terminal(&model));
    }
    Ok(())
}

fn watch_cmd(args: Vec<String>) -> Result<()> {
    let opts = parse_opts(args)?;
    opts.reject_replay_inputs("watch")?;
    opts.reject_live_tcp("watch")?;
    if opts.html.is_some() || opts.no_sleep {
        bail!("watch does not accept --html or --no-sleep");
    }
    opts.validate_source_choice("watch")?;
    let mut core = MonitorCore::new();
    let clock = MonotonicClock::default();
    let mut config = WatchConfig::new(
        opts.source_dir
            .clone()
            .or(opts.source.clone())
            .expect("validated source"),
    );
    config.poll_interval = Duration::from_millis(opts.poll_millis.unwrap_or(250));
    config.debounce = Duration::from_millis(opts.debounce_millis.unwrap_or(100));
    let mut on_event = |event| {
        apply_event(&mut core, event);
        print!(
            "{}",
            render_terminal(&core.display_model(clock.now_millis()))
        );
        true
    };
    if opts.source_dir.is_some() {
        watch_vitals_dir(config, &mut on_event)
    } else {
        watch(config, &mut on_event)
    }
}

fn replay_cmd(args: Vec<String>) -> Result<()> {
    let opts = parse_opts(args)?;
    opts.reject_sources("replay")?;
    opts.reject_live_tcp("replay")?;
    if opts.html.is_some() || !opts.fixture_dirs.is_empty() || opts.debounce_millis.is_some() {
        bail!("replay accepts --fixture, --poll-ms, and --no-sleep only");
    }
    if opts.fixtures.is_empty() {
        bail!("replay requires at least one --fixture <path>");
    }
    let mut core = MonitorCore::new();
    for (idx, fixture) in opts.fixtures.iter().enumerate() {
        let frame = read_fixture(fixture)?;
        core.accept_frame(frame, (idx as u64) * 1_000);
        print!(
            "{}",
            render_terminal(&core.display_model((idx as u64) * 1_000))
        );
        if !opts.no_sleep {
            thread::sleep(Duration::from_millis(opts.poll_millis.unwrap_or(700)));
        }
    }
    Ok(())
}

fn live_tcp_cmd(args: Vec<String>) -> Result<()> {
    let opts = parse_opts(args)?;
    if opts.source.is_some()
        || opts.source_dir.is_some()
        || !opts.fixtures.is_empty()
        || !opts.fixture_dirs.is_empty()
        || opts.html.is_some()
        || opts.poll_millis.is_some()
        || opts.debounce_millis.is_some()
        || opts.no_sleep
    {
        bail!("live-tcp accepts only --addr <127.0.0.1:port>");
    }
    let addr = opts
        .live_tcp
        .context("live-tcp requires --addr <127.0.0.1:port>")?;
    let mut core = MonitorCore::new();
    let clock = MonotonicClock::default();
    watch_live_tcp(&addr, |event| {
        apply_event(&mut core, event);
        print!(
            "{}",
            render_terminal(&core.display_model(clock.now_millis()))
        );
        true
    })
}

fn tail_jsonl_cmd(args: Vec<String>) -> Result<()> {
    let opts = parse_opts(args)?;
    let source = opts
        .source
        .clone()
        .context("tail-jsonl requires --source <timeline.jsonl>")?;
    if opts.source_dir.is_some()
        || !opts.fixtures.is_empty()
        || !opts.fixture_dirs.is_empty()
        || opts.html.is_some()
        || opts.live_tcp.is_some()
        || opts.no_sleep
        || opts.debounce_millis.is_some()
    {
        bail!("tail-jsonl accepts only --source <timeline.jsonl> and --poll-ms");
    }
    let clock = MonotonicClock::default();
    let mut core = MonitorCore::new();
    let mut tailer = JsonlFrameTailer::new();
    loop {
        for event in tailer.poll_path(&source, &clock) {
            apply_event(&mut core, event);
            print!(
                "{}",
                render_terminal(&core.display_model(clock.now_millis()))
            );
        }
        thread::sleep(Duration::from_millis(opts.poll_millis.unwrap_or(100)));
    }
}

fn replay_dir_cmd(args: Vec<String>) -> Result<()> {
    let opts = parse_opts(args)?;
    opts.reject_sources("replay-dir")?;
    opts.reject_live_tcp("replay-dir")?;
    if opts.html.is_some() || !opts.fixtures.is_empty() || opts.debounce_millis.is_some() {
        bail!("replay-dir accepts --fixture-dir, --poll-ms, and --no-sleep only");
    }
    if opts.fixture_dirs.is_empty() {
        bail!("replay-dir requires at least one --fixture-dir <path>");
    }
    let clock = MonotonicClock::default();
    let mut core = MonitorCore::new();
    for (idx, fixture_dir) in opts.fixture_dirs.iter().enumerate() {
        let event = read_vitals_dir(fixture_dir, &clock);
        apply_event(&mut core, event);
        print!(
            "{}",
            render_terminal(&core.display_model((idx as u64) * 1_000))
        );
        if !opts.no_sleep {
            thread::sleep(Duration::from_millis(opts.poll_millis.unwrap_or(700)));
        }
    }
    Ok(())
}

fn apply_event(core: &mut MonitorCore, event: IngestEvent) {
    match event {
        IngestEvent::Frame(frame) => core.accept_frame(frame.frame, frame.received_millis),
        IngestEvent::VitalsSnapshot(snapshot) => {
            core.accept_frame(snapshot.snapshot.frame, snapshot.received_millis)
        }
        IngestEvent::InvalidCandidate(message) => core.mark_invalid(message),
        IngestEvent::Offline(message) => core.mark_offline(message),
    }
}

#[derive(Debug, Default)]
struct Opts {
    source: Option<PathBuf>,
    source_dir: Option<PathBuf>,
    html: Option<PathBuf>,
    fixtures: Vec<PathBuf>,
    fixture_dirs: Vec<PathBuf>,
    poll_millis: Option<u64>,
    debounce_millis: Option<u64>,
    no_sleep: bool,
    live_tcp: Option<String>,
}

impl Opts {
    fn validate_source_choice(&self, command: &str) -> Result<()> {
        match (&self.source, &self.source_dir) {
            (Some(_), Some(_)) => bail!("{command} accepts --source or --source-dir, not both"),
            (None, None) => bail!("{command} requires --source <path> or --source-dir <dir>"),
            _ => Ok(()),
        }
    }

    fn reject_sources(&self, command: &str) -> Result<()> {
        if self.source.is_some() || self.source_dir.is_some() {
            bail!("{command} does not accept --source or --source-dir");
        }
        Ok(())
    }

    fn reject_replay_inputs(&self, command: &str) -> Result<()> {
        if !self.fixtures.is_empty() || !self.fixture_dirs.is_empty() {
            bail!("{command} does not accept replay fixture options");
        }
        Ok(())
    }

    fn reject_live_tcp(&self, command: &str) -> Result<()> {
        if self.live_tcp.is_some() {
            bail!("{command} does not accept --addr/--live-tcp");
        }
        Ok(())
    }
}

fn parse_opts(args: Vec<String>) -> Result<Opts> {
    let mut opts = Opts::default();
    let mut iter = args.into_iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--source" => opts.source = Some(iter.next().context("--source needs path")?.into()),
            "--source-dir" => {
                opts.source_dir = Some(iter.next().context("--source-dir needs path")?.into())
            }
            "--html" => opts.html = Some(iter.next().context("--html needs path")?.into()),
            "--fixture" => opts
                .fixtures
                .push(iter.next().context("--fixture needs path")?.into()),
            "--fixture-dir" => opts
                .fixture_dirs
                .push(iter.next().context("--fixture-dir needs path")?.into()),
            "--poll-ms" => {
                opts.poll_millis = Some(iter.next().context("--poll-ms needs value")?.parse()?)
            }
            "--debounce-ms" => {
                opts.debounce_millis =
                    Some(iter.next().context("--debounce-ms needs value")?.parse()?)
            }
            "--no-sleep" => opts.no_sleep = true,
            "--addr" | "--live-tcp" => {
                opts.live_tcp = Some(iter.next().context("--addr needs host:port")?)
            }
            other => bail!("unknown option {other}"),
        }
    }
    Ok(opts)
}

fn usage() {
    eprintln!(
        "pi-monitor display-only CLI\n\nCommands:\n  render --source <current.json> [--html <out.html>]\n  render --source-dir <vitals-dir> [--html <out.html>]\n  watch --source <current.json> [--poll-ms 250] [--debounce-ms 100]\n  watch --source-dir <vitals-dir> [--poll-ms 250] [--debounce-ms 100]\n  replay --fixture <path> [--fixture <path> ...] [--no-sleep]\n  replay-dir --fixture-dir <public-contract-case> [--fixture-dir <case> ...] [--no-sleep]\n  tail-jsonl --source <timeline.jsonl> [--poll-ms 100]\n  live-tcp --addr <127.0.0.1:port>\n"
    );
}
