import { createReadStream, existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { basename, dirname, extname, join, normalize, relative } from "node:path";
import { startWatch } from "./watch.js";
import type { Compiler } from "./compiler.js";

type CompilerFactory = () => Promise<Compiler>;

interface ServeOptions {
  port: number;
  extraWatchFiles?: string[];
}

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

export async function serve(createCompiler: CompilerFactory, options: ServeOptions): Promise<void> {
  const watcher = await startWatch(createCompiler, options.extraWatchFiles ?? []);

  const server = createServer(async (request, response) => {
    const context = watcher.getContext();

    if (!context) {
      response.writeHead(503);
      response.end("Build not ready");
      return;
    }

    const outputFile = context.config.output.filename;
    const outputDir = dirname(outputFile);
    const bundleName = basename(outputFile);
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname === "/") {
      const indexFile = join(outputDir, "index.html");

      if (existsSync(indexFile)) {
        response.writeHead(200, { "Content-Type": mimeTypes[".html"] });
        createReadStream(indexFile).pipe(response);
        return;
      }

      response.writeHead(200, { "Content-Type": mimeTypes[".html"] });
      response.end(`<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <title>custom-webpack dev server</title>
  </head>
  <body>
    <script src="/${bundleName}"></script>
  </body>
</html>`);
      return;
    }

    const requestedFile = normalize(join(outputDir, pathname));

    if (relative(outputDir, requestedFile).startsWith("..")) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    try {
      const file = await readFile(requestedFile);
      response.writeHead(200, { "Content-Type": mimeTypes[extname(requestedFile)] ?? "application/octet-stream" });
      response.end(file);
    } catch {
      response.writeHead(404);
      response.end("Not Found");
    }
  });

  server.listen(options.port, () => {
    console.log(`🚀 dev server 실행 중: http://localhost:${options.port}`);
  });

  await new Promise<void>(() => {});
}
