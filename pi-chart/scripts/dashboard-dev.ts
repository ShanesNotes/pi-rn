#!/usr/bin/env tsx
// Dev server for the kanban dashboard — rebuilds in memory on each request and
// pushes a Server-Sent Events "reload" message when the source markdown changes.
// Pure node stdlib (http + fs.watch); no new deps, no WebSocket handshake.

import { promises as fs, watch as fsWatch } from "node:fs";
import http from "node:http";
import path from "node:path";
import { parseBoard, renderHtml } from "./dashboard.js";

const PORT = Number(process.env.PORT ?? 5173);
const SOURCE_BOARD = path.resolve(
  import.meta.dirname,
  "..",
  "docs",
  "plans",
  "kanban-prd-board.md",
);

const RELOAD_SNIPPET = `<script>
  const es = new EventSource("/events");
  es.addEventListener("reload", () => location.reload());
  es.onerror = () => console.warn("dashboard dev: SSE disconnected, will retry");
</script>`;

const sseClients = new Set<http.ServerResponse>();

async function renderPage(): Promise<string> {
  const markdown = await fs.readFile(SOURCE_BOARD, "utf8");
  const html = renderHtml(parseBoard(markdown));
  return html.replace("</body>", `${RELOAD_SNIPPET}\n</body>`);
}

function broadcast(eventName: string): void {
  for (const res of sseClients) {
    res.write(`event: ${eventName}\ndata: 1\n\n`);
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(": connected\n\n");
    sseClients.add(res);
    req.on("close", () => sseClients.delete(res));
    return;
  }

  if (req.url === "/" || req.url === "/index.html") {
    try {
      const html = await renderPage();
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(html);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`render error: ${message}`);
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`dashboard build failed:\n${message}\n`);
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("not found");
});

let debounceTimer: NodeJS.Timeout | null = null;
fsWatch(path.dirname(SOURCE_BOARD), (_event, filename) => {
  if (filename !== path.basename(SOURCE_BOARD)) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    console.log(`board changed → broadcasting reload to ${sseClients.size} client(s)`);
    broadcast("reload");
  }, 200);
});

const heartbeat = setInterval(() => {
  for (const res of sseClients) res.write(": heartbeat\n\n");
}, 30000);

server.listen(PORT, () => {
  console.log(`dashboard dev server: http://localhost:${PORT}`);
  console.log(`watching: ${SOURCE_BOARD}`);
  console.log(`Ctrl-C to stop`);
});

function shutdown(): void {
  clearInterval(heartbeat);
  for (const res of sseClients) res.end();
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => {
  console.log("\nshutting down");
  shutdown();
});
process.on("SIGTERM", shutdown);
