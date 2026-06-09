import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import { transformFromAstSync } from "@babel/core";
import { cssLoader, jsLoader, jsonLoader, type Loader } from "./loaders.js";

// @babel/traverse 는 CommonJS 모듈이라 ESM 환경에서 default 로 한 번 더 감싸진다.
// (이게 그 유명한 "traverse is not a function" 의 원인이다.)
const traverse = (_traverse as unknown as { default: typeof _traverse }).default ?? _traverse;

let nextId = 0;

export function resetAssetIds(): void {
  nextId = 0;
}

const loaders: Record<string, Loader> = {
  ".js": jsLoader,
  ".json": jsonLoader,
  ".css": cssLoader,
};

export interface Asset {
  id: number;
  filename: string;
  dependencies: string[]; // 이 파일이 import 하는 상대경로들 (예: "./message.js")
  code: string; // 브라우저가 실행 가능한 CommonJS 코드
  mapping: Record<string, number>; // "상대경로" -> "그 모듈의 id" (그래프 단계에서 채움)
}

/**
 * 파일 하나를 받아서 "에셋"으로 만든다.
 * 에셋 = 그 파일에 대해 번들러가 알아야 하는 모든 정보(누구를 의존하는지 + 실행 코드).
 */
export function createAsset(filename: string): Asset {
  const content = readFileSync(filename, "utf-8");
  const extension = extname(filename);
  const loader = loaders[extension];

  if (!loader) {
    throw new Error(`No loader configured for ${extension || "unknown"} file: ${filename}`);
  }

  if (extension !== ".js") {
    return {
      id: nextId++,
      filename,
      dependencies: [],
      code: loader(content, filename),
      mapping: {},
    };
  }

  // 1) 소스 코드를 AST(추상 구문 트리)로 바꾼다.
  //    문자열 "import { x } from './a'" 는 컴퓨터가 분석하기 어렵지만,
  //    트리 구조가 되면 "이건 ImportDeclaration 노드구나" 하고 다룰 수 있다.
  const ast = parse(content, { sourceType: "module" });

  // 2) AST 를 순회하며 import 구문만 골라 의존성 경로를 수집한다.
  const dependencies: string[] = [];
  traverse(ast, {
    ImportDeclaration({ node }) {
      dependencies.push(node.source.value);
    },
  });

  // 3) import/export(ESM) 문법을 브라우저에 없는 require/module.exports(CommonJS)로 변환한다.
  //    브라우저에는 모듈 시스템이 없으므로, 우리가 런타임에서 흉내 낼 형태로 맞추는 것.
  const { code } = transformFromAstSync(ast, loader(content, filename), {
    presets: ["@babel/preset-env"],
  })!;

  return {
    id: nextId++,
    filename,
    dependencies,
    code: code ?? "",
    mapping: {},
  };
}
