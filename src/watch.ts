import { watch as watchFile, type FSWatcher } from "node:fs";
import type { Compiler } from "./compiler.js";
import type { CompilerContext } from "./types.js";

type CompilerFactory = () => Promise<Compiler>;

export interface WatchController {
  close(): void;
  getContext(): CompilerContext | undefined;
}

export async function startWatch(
  createCompiler: CompilerFactory,
  extraWatchFiles: string[] = [],
): Promise<WatchController> {
  const watchers = new Map<string, FSWatcher>();
  let context: CompilerContext | undefined;
  let rebuildTimer: NodeJS.Timeout | undefined;

  const closeWatchers = () => {
    for (const watcher of watchers.values()) {
      watcher.close();
    }

    watchers.clear();
  };

  const scheduleRebuild = () => {
    if (rebuildTimer) {
      clearTimeout(rebuildTimer);
    }

    rebuildTimer = setTimeout(async () => {
      console.log("♻️ 변경 감지. 다시 빌드합니다.");
      await buildAndWatch();
    }, 100);
  };

  const watchFiles = (files: string[]) => {
    closeWatchers();

    for (const file of new Set(files)) {
      watchers.set(
        file,
        watchFile(file, () => {
          scheduleRebuild();
        }),
      );
    }
  };

  const buildAndWatch = async () => {
    const compiler = await createCompiler();
    context = compiler.run();
    watchFiles([...context.graph.map((asset) => asset.filename), ...extraWatchFiles]);
  };

  await buildAndWatch();

  return {
    close() {
      closeWatchers();
    },
    getContext() {
      return context;
    },
  };
}

export async function watch(createCompiler: CompilerFactory, extraWatchFiles: string[] = []): Promise<void> {
  await startWatch(createCompiler, extraWatchFiles);
  console.log("👀 watch 모드 실행 중...");
  await new Promise<void>(() => {});
}
