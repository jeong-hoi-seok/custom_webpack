import type { Compiler } from "./compiler.js";
import type { Plugin } from "./types.js";

export class LoggerPlugin implements Plugin {
  apply(compiler: Compiler): void {
    compiler.hooks.beforeRun.tap("LoggerPlugin", (config) => {
      console.log("📦 의존성 그래프를 만드는 중...");
      console.log(`   entry: ${config.entry.replace(config.root, ".")}`);
    });

    compiler.hooks.afterGraph.tap("LoggerPlugin", (context) => {
      console.log(`   모듈 ${context.graph.length}개 발견:`);

      for (const asset of context.graph) {
        console.log(`   - [id ${asset.id}] ${asset.filename.replace(context.config.root, ".")}`);
      }
    });

    compiler.hooks.emit.tap("LoggerPlugin", () => {
      console.log("🔧 번들 생성 중...");
    });

    compiler.hooks.done.tap("LoggerPlugin", (context) => {
      console.log(`✅ 완료 → ${context.config.output.filename.replace(context.config.root, ".")}`);
    });
  }
}
