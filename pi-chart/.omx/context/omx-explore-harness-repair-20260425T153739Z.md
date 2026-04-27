# OMX current explore harness repair

Task statement: Make oh-my-codex v0.14.4 doctor pass with a functional current omx explore harness; remove stale older native caches.
Desired outcome: omx doctor reports Explore Harness OK without relying on 0.12.4; omx explore runs in ~/pi-rn/pi-chart.
Known facts/evidence: omx v0.14.4 is installed at /home/ark/.local/lib/node_modules/oh-my-codex; cargo/rustc are not installed; stale native cache contains 0.12.4 explore harness that rejects new --instructions-file arg; shell network fetch to GitHub failed; sudo is unavailable inside this sandbox.
Constraints: no destructive user data changes; user requested aggressive cleanup of stale OMX native artifacts; approval policy prevents privilege escalation here.
Unknowns/open questions: whether the user terminal outside this sandbox can run sudo apt install; whether direct network fetch works outside this sandbox.
Likely touchpoints: ~/.cache/oh-my-codex/native, ~/.local/lib/node_modules/oh-my-codex/bin, ~/.codex/.omx-config.json, Cargo build scripts.
