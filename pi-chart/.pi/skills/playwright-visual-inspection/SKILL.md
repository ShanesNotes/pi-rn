---
name: playwright-visual-inspection
description: Capture and inspect UI screenshots with Playwright. Use for visual QA of web UI work, prototypes, dashboards, responsive layouts, screenshots, browser console errors, and before/after UI verification.
---

# Playwright Visual Inspection

Use this skill whenever doing UI work that benefits from actually seeing the result.

## Workflow

1. Start or identify the UI URL/file to inspect.
   - For this repo's dashboard: `PORT=5173 npm run dashboard:dev` then open `http://127.0.0.1:5173/`.
   - Static files may be passed as filesystem paths; the helper converts them to `file://` URLs.
2. Capture a screenshot with the helper:

   ```bash
   node .pi/skills/playwright-visual-inspection/scripts/capture.mjs <url-or-file> /tmp/ui-shot.png --width 1440 --height 1000
   ```

3. Use the `read` tool on the generated PNG to visually inspect it.
4. Fix issues and repeat until the screenshot matches the intended design.
5. Also review the helper's JSON output for console errors, page errors, HTTP failures, title, URL, and viewport.

## Helper options

```bash
node .pi/skills/playwright-visual-inspection/scripts/capture.mjs <target> [output.png] [options]

Options:
  --width <px>        viewport width (default 1440)
  --height <px>       viewport height (default 1000)
  --wait <selector>   wait for a selector before capture
  --delay <ms>        wait extra time before capture
  --clip x,y,w,h      screenshot only a region
  --no-full-page      capture viewport only instead of full page
```

## Notes

- Playwright is already installed in `pi-chart`; a smoke test passed with headless Chromium.
- Prefer `127.0.0.1` over `localhost` if a dev server binds IPv4 only.
- Keep screenshots in `/tmp` unless the user asks to commit artifacts.
- For responsive UI, capture at least desktop and mobile widths, e.g. `1440x1000` and `390x844`.
