import { dirname, resolve } from "node:path";
import { createAsset, resetAssetIds, type Asset } from "./createAsset.js";

/**
 * 엔트리 파일 하나에서 출발해, import 를 타고 들어가며
 * 프로젝트의 모든 모듈을 찾아 "의존성 그래프"(에셋 배열)를 만든다.
 */
export function createGraph(entry: string): Asset[] {
  resetAssetIds();

  const entryAsset = createAsset(entry);
  const graph: Asset[] = [entryAsset];

  // 큐에 있는 에셋을 하나씩 꺼내, 그 의존성들을 다시 에셋으로 만들어 큐에 넣는다.
  for (const asset of graph) {
    const currentDir = dirname(asset.filename);

    for (const relativePath of asset.dependencies) {
      // "./message.js" 같은 상대경로를 실제 파일 시스템의 절대경로로 해석한다.
      // 이게 webpack 의 "module resolution" 에 해당한다.
      const absolutePath = resolve(currentDir, relativePath);

      const child = createAsset(absolutePath);

      // 이 모듈 안에서 "./message.js" 가 곧 id=N 모듈임을 기록해 둔다.
      // 런타임의 require("./message.js") 가 이 매핑으로 올바른 모듈을 찾는다.
      asset.mapping[relativePath] = child.id;
      graph.push(child);
    }
  }

  return graph;
}
