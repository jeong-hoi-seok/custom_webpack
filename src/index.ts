import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createGraph } from "./createGraph.js";
import { bundle } from "./bundle.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

// webpack.config 의 entry / output 에 해당하는 설정.
const entry = resolve(projectRoot, "example/src/index.js");
const outputFile = resolve(projectRoot, "dist/bundle.js");

console.log("📦 의존성 그래프를 만드는 중...");
const graph = createGraph(entry);

console.log(`   모듈 ${graph.length}개 발견:`);
for (const asset of graph) {
  console.log(`   - [id ${asset.id}] ${asset.filename.replace(projectRoot, ".")}`);
}

console.log("🔧 번들 생성 중...");
const output = bundle(graph);

mkdirSync(dirname(outputFile), { recursive: true });
writeFileSync(outputFile, output, "utf-8");

console.log(`✅ 완료 → ${outputFile.replace(projectRoot, ".")}`);
