use anyhow::{Context, Result, bail};
use monitor_core::MonitorCore;
use monitor_ingest::{
    IngestEvent, MonotonicClock, ReceiptClock, WatchConfig, read_current_file, read_fixture, watch,
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
        "help" | "--help" | "-h" => {
            usage();
            Ok(())
        }
        other => bail!("unknown command {other}"),
    }
}

fn render_cmd(args: Vec<String>) -> Result<()> {
    let opts = parse_opts(args)?;
    let source = opts.source.context("render requires --source <path>")?;
    let clock = MonotonicClock::default();
    let event = read_current_file(&source, &clock);
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
    let source = opts.source.context("watch requires --source <path>")?;
    let mut core = MonitorCore::new();
    let clock = MonotonicClock::default();
    let mut config = WatchConfig::new(source);
    config.poll_interval = Duration::from_millis(opts.poll_millis.unwrap_or(250));
    config.debounce = Duration::from_millis(opts.debounce_millis.unwrap_or(100));
    watch(config, |event| {
        apply_event(&mut core, event);
        print!(
            "{}",
            render_terminal(&core.display_model(clock.now_millis()))
        );
        true
    })
}

fn replay_cmd(args: Vec<String>) -> Result<()> {
    let opts = parse_opts(args)?;
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

fn apply_event(core: &mut MonitorCore, event: IngestEvent) {
    match event {
        IngestEvent::Frame(frame) => core.accept_frame(frame.frame, frame.received_millis),
        IngestEvent::InvalidCandidate(message) => core.mark_invalid(message),
        IngestEvent::Offline(message) => core.mark_offline(message),
    }
}

#[derive(Debug, Default)]
struct Opts {
    source: Option<PathBuf>,
    html: Option<PathBuf>,
    fixtures: Vec<PathBuf>,
    poll_millis: Option<u64>,
    debounce_millis: Option<u64>,
    no_sleep: bool,
}

fn parse_opts(args: Vec<String>) -> Result<Opts> {
    let mut opts = Opts::default();
    let mut iter = args.into_iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--source" => opts.source = Some(iter.next().context("--source needs path")?.into()),
            "--html" => opts.html = Some(iter.next().context("--html needs path")?.into()),
            "--fixture" => opts
                .fixtures
                .push(iter.next().context("--fixture needs path")?.into()),
            "--poll-ms" => {
                opts.poll_millis = Some(iter.next().context("--poll-ms needs value")?.parse()?)
            }
            "--debounce-ms" => {
                opts.debounce_millis =
                    Some(iter.next().context("--debounce-ms needs value")?.parse()?)
            }
            "--no-sleep" => opts.no_sleep = true,
            other => bail!("unknown option {other}"),
        }
    }
    Ok(opts)
}

fn usage() {
    eprintln!(
        "pi-monitor display-only CLI\n\nCommands:\n  render --source <current.json> [--html <out.html>]\n  watch --source <current.json> [--poll-ms 250] [--debounce-ms 100]\n  replay --fixture <path> [--fixture <path> ...] [--no-sleep]\n"
    );
}
