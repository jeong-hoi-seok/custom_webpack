import type { Asset } from "./createAsset.js";

/**
 * 의존성 그래프를 받아 하나의 실행 가능한 번들 문자열을 만든다.
 *
 * 핵심 아이디어:
 *  - 브라우저에는 require / module.exports 가 없다.
 *  - 그래서 각 모듈을 function(require, module, exports){...} 로 감싸고,
 *    우리가 만든 require 함수를 직접 주입해서 모듈 시스템을 "흉내" 낸다.
 */
export function bundle(graph: Asset[]): string {
  // 1) 각 모듈을 [실행함수, 매핑] 쌍으로 나열한 거대한 객체 문자열을 만든다.
  //    id 를 key 로 쓴다. 예: 0: [fn, {"./message.js": 1}], 1: [...], ...
  let modules = "";
  for (const asset of graph) {
    modules += `${asset.id}: [
      function (require, module, exports) {
        ${asset.code}
      },
      ${JSON.stringify(asset.mapping)},
    ],`;
  }

  // 2) 런타임. 즉시실행함수(IIFE)로 감싸 전역을 오염시키지 않는다.
  //    - require(id): 해당 모듈을 실행하고 module.exports 를 돌려준다.
  //    - localRequire(path): 모듈 코드 안의 require("./message.js") 를
  //      위 mapping 을 통해 실제 id 기반 require 로 바꿔준다.
  const result = `
(function (modules) {
  function require(id) {
    const [fn, mapping] = modules[id];

    function localRequire(relativePath) {
      return require(mapping[relativePath]);
    }

    const module = { exports: {} };

    fn(localRequire, module, module.exports);

    return module.exports;
  }

  // id 0 = 엔트리 모듈. 여기서 전체 실행이 시작된다.
  require(0);
})({${modules}});
`;

  return result;
}
