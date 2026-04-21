# pi-rn

Minimal project-local scaffold for building on top of Pi.

## Structure

```text
AGENTS.md            project instructions loaded by Pi
.pi/
  settings.json      project-local Pi settings
  extensions/        project-local extensions
  skills/            project-local skills
  prompts/           project-local prompt templates
  themes/            project-local themes
  sessions/          optional project-local session history
```

## Local setup

```bash
cd ~/pi-rn
npm install
npx pi
```

Pi will automatically discover:

- `AGENTS.md`
- `.pi/settings.json`
- `.pi/extensions/`
- `.pi/skills/`
- `.pi/prompts/`
- `.pi/themes/`

## Docker

The recommended pattern is the same inside a container: keep the scaffold in the repo.

```bash
docker run --rm -it \
  -v "$PWD":/workspace/pi-rn \
  -w /workspace/pi-rn \
  node:20 bash
```

Inside the container:

```bash
npm install
npx pi
```

If you want persistent global Pi state inside Docker, mount a directory and point `PI_CODING_AGENT_DIR` at it.

## Notes

- This scaffold intentionally stays close to stock Pi
- Add extensions, skills, and prompts only when the project actually needs them
