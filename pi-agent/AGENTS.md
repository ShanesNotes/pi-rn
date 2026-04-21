# pi-rn

This repo is a project-local Pi scaffold.

## Intent

- Keep Pi customization in `.pi/`
- Keep instructions in this `AGENTS.md` concise and project-specific
- Prefer Pi's default behavior unless the project needs a real extension, skill, prompt, or theme
- Favor small, explicit additions over framework-heavy scaffolding

## Resource layout

```text
.pi/
  settings.json
  extensions/
  skills/
  prompts/
  themes/
  sessions/
chart/
  imaging/
  progress-notes/
  vitals-charted/
```

## Conventions

- Put project-local agent code in `.pi/extensions/`
- Put reusable prompt workflows in `.pi/prompts/`
- Put project-specific skills in `.pi/skills/`
- Use `pi install -l ...` for packages that should live with this repo
- Keep `chart/` as the app's barebones clinical charting surface
- Do not add a `.pi/SYSTEM.md` unless the project truly needs to replace Pi's default system prompt

## Docker

Running Pi inside Docker does not change the project layout:

- keep repo-local config in `/workspace/pi-rn/.pi/`
- keep project instructions in `/workspace/pi-rn/AGENTS.md`
- mount a persistent global Pi dir only if you want durable auth, global settings, or session history outside the repo

If needed, set `PI_CODING_AGENT_DIR` inside the container to control the global Pi home.
