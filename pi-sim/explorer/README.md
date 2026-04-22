# Pulse Explorer — optional visual companion

Kitware's Pulse Explorer is a Qt5 desktop GUI that bundles its own Pulse engine instance. **It is not wired into pi-sim's vitals pipeline** — this directory exists purely to let you watch a Qt bedside-monitor visualization in parallel with (or instead of) the pi-sim TUI.

## Why it's separate from pi-sim runtime

Explorer owns its engine in-process (no REST, no file watch, no IPC hook). Trying to make it read pi-sim's `vitals/current.json` is not supported by the app's architecture. The sane pattern is:

- **pi-sim** runs its own Pulse engine (Docker sidecar), drives the scenario, writes `vitals/current.json`. pi-agent reads those files.
- **You** (human) launch Explorer separately, open an equivalent scenario, and watch the Qt monitor as a visual reference.

Both engines read the same patient-state file and the same action list, so the narrative matches. Tick-for-tick numerics will drift slightly because the two engines are independent instances — treat Explorer as illustrative, not authoritative.

## Install (prebuilt binary — recommended)

Prebuilt binaries for Linux, macOS, and Windows are published on Kitware's Pulse Explorer wiki:
  https://gitlab.kitware.com/physiology/explorer/-/wikis/home

**Use the binary matching Pulse engine 4.3.1** (the version pinned in `../pulse/docker-compose.yml`). Version drift between Explorer and engine can produce surprising numerical divergence.

Drop the downloaded binary/bundle under `explorer/` (the binary itself is gitignored).

## Install (source build — discouraged)

Source: https://gitlab.kitware.com/physiology/explorer. Requires Qt5, CMake 3.7+, JDK, and protobuf. Multi-GB working tree, long build. Skip this unless you intend to modify Explorer itself.

## Run

Launch Explorer, then **File → Open Scenario** and point it at a Pulse-format scenario file. pi-sim's scenario manifests (`../vitals/scenarios/*.json`) are *not* in Pulse's native scenario format — they are pi-sim's action-timeline wrappers read by our Node harness.

For Explorer use, either:
1. **Use Pulse's shipped scenarios** — the Kitware image comes with a scenario library (hemorrhage, pharma dosing, ventilation) under `bin/scenarios/` inside the container. Copy one out:
   ```bash
   docker compose -f ../pulse/docker-compose.yml cp pulse:/pulse/bin/scenarios/Hemorrhage.json ./
   ```
2. **Author a Pulse-native scenario from the pi-sim timeline** — translate `vitals/scenarios/<name>.json` into Pulse's `AnyAction`/`AdvanceTime` format by hand. A translation helper script may be added later under `pulse/shim/` if this becomes a frequent workflow.

## Boundary reminder

Explorer is not a dependency of pi-sim, not part of the agent runtime, and not required for validation. You can delete this whole directory and the simulator still works.
