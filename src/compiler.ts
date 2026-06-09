import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { bundle } from "./bundle.js";
import { createGraph } from "./createGraph.js";
import type { CompilerContext, ResolvedBundlerConfig } from "./types.js";

type HookHandler<T> = (context: T) => void;

class SyncHook<T> {
  private handlers: HookHandler<T>[] = [];

  tap(name: string, handler: HookHandler<T>): void {
    this.handlers.push(handler);
  }

  call(context: T): void {
    for (const handler of this.handlers) {
      handler(context);
    }
  }
}

export class Compiler {
  hooks = {
    beforeRun: new SyncHook<ResolvedBundlerConfig>(),
    afterGraph: new SyncHook<CompilerContext>(),
    emit: new SyncHook<CompilerContext>(),
    done: new SyncHook<CompilerContext>(),
  };

  constructor(public config: ResolvedBundlerConfig) {
    for (const plugin of config.plugins) {
      plugin.apply(this);
    }
  }

  run(): CompilerContext {
    this.hooks.beforeRun.call(this.config);

    const graph = createGraph(this.config.entry);
    const context: CompilerContext = {
      config: this.config,
      graph,
      bundleCode: bundle(graph),
    };

    this.hooks.afterGraph.call(context);
    this.hooks.emit.call(context);

    mkdirSync(dirname(this.config.output.filename), { recursive: true });
    writeFileSync(this.config.output.filename, context.bundleCode, "utf-8");

    this.hooks.done.call(context);

    return context;
  }
}
