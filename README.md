# custom-webpack

웹팩(번들러)의 동작 원리를 이해하기 위해 **직접 만들어보는 미니 번들러**입니다.

> "vite/webpack이 그냥 해주니까 아~ 하면서 썼는데, 이제는 이해하고 싶다."
> 그래서 번들러의 뼈대를 TypeScript로 처음부터 만들어 봅니다.

## 번들러란? (멘탈 모델)

webpack, Rollup, Vite 같은 도구가 하는 일은 결국 4단계입니다.

```
1. Entry            : 시작 파일 하나를 정한다 (예: src/index.js)
2. Dependency Graph : import/require를 따라가며 "누가 누구를 필요로 하는지" 그래프를 만든다
3. Transform        : 각 파일을 브라우저가 읽을 수 있게 변환한다 (ESM import → require 등)
4. Bundle           : 모든 모듈을 함수로 감싸 하나의 파일로 합치고,
                      브라우저엔 없는 require/module.exports를 "직접 구현한 런타임"으로 흉내 낸다
```

핵심 깨달음: **브라우저에는 원래 `require`나 `module.exports`가 없다.**
번들러는 우리가 쓴 `import`/`require`를 자기가 만든 작은 런타임 함수로 바꿔치기해서
"마치 모듈 시스템이 있는 것처럼" 동작하게 만든다. 그게 마법의 정체다.

## 동작 흐름

```
원본 파일들 ──[읽기]──────────────> 문자열
            ──[@babel/parser]─────> AST
            ──[traverse]──────────> 의존성 목록 (import 경로)
            ──[@babel/preset-env]─> CommonJS 코드
모든 에셋 ──[createGraph]─────────> 의존성 그래프 (경로→id 매핑 포함)
그래프 ──[bundle]────────────────> 함수로 감싼 모듈들 + require 런타임 = 단일 파일
```

## 프로젝트 구조

```
custom_webpack/
├── src/                  # 번들러 본체 (TypeScript)
│   ├── createAsset.ts    # 파일 1개 → AST 파싱 → 의존성 추출 → 코드 변환
│   ├── createGraph.ts    # 엔트리부터 BFS로 의존성 그래프 구성
│   ├── bundle.ts         # 그래프 → 단일 번들 + require 런타임 구현
│   └── index.ts          # entry/output 설정 후 전체 실행
├── example/src/          # 번들링 대상 예제 앱
│   ├── index.js          # 엔트리 (message.js, name.js를 import)
│   ├── message.js        # util.js를 import
│   ├── name.js
│   └── util.js
└── dist/bundle.js        # 생성 결과물 (gitignore)
```

예제 앱의 의존성 그래프:

```
index.js ──> message.js ──> util.js
        └──> name.js
```

## 실행 방법

```bash
npm install      # 의존성 설치
npm run build    # 번들 생성 → dist/bundle.js
node dist/bundle.js
# 출력: Hello, WEBPACK!
```

## 각 모듈이 대응하는 webpack 개념

| 파일 | 하는 일 | webpack의 대응 개념 |
|------|---------|---------------------|
| `createAsset.ts` | 파일 1개를 파싱해 의존성 + 코드 추출 | Module |
| `createGraph.ts` | import를 따라가며 전체 그래프 구성 + 경로 해석 | Dependency Graph / Module Resolution |
| `bundle.ts` | 모듈을 함수로 감싸고 require 런타임 주입 | Bundling / Runtime |

## 생성된 번들의 구조

```js
(function (modules) {
  function require(id) {
    const [fn, mapping] = modules[id];
    function localRequire(relativePath) {
      return require(mapping[relativePath]); // 경로 → id 변환
    }
    const module = { exports: {} };
    fn(localRequire, module, module.exports); // 모듈 실행 (독립 스코프)
    return module.exports;
  }
  require(0); // 엔트리부터 시작
})({ 0: [fn, {"./message.js":1, ...}], 1: [...], ... });
```

- **변환**: `import`가 사라지고 `require`로 바뀐다 (브라우저에 없는 문법 제거).
- **격리**: 각 모듈이 `function (require, module, exports)`로 감싸져 변수가 안 섞인다.
- **런타임**: `require`를 직접 구현. `"경로" → id` 매핑이 빌드 타임에 미리 박혀 있다.
- **시작점**: 마지막 `require(0)` 한 줄이 도미노처럼 전체 실행을 시작한다.

## 의도적인 한계 (학습용 단순화 / 다음 단계 떡밥)

- **중복 제거 없음**: 같은 모듈을 여러 곳에서 import하면 중복 포함됨 (실제 webpack은 캐싱).
- **JS만 처리**: `.css`, `.json`, 이미지는 불가 → Loader 단계에서 해결 예정.
- **확장자 자동 해석 없음**: `import "./util"`처럼 `.js`를 빼면 못 찾음.
- **순환 의존성 / 동적 import 미지원.**

## 로드맵

- [x] 1단계: AST 파싱 → 의존성 그래프
- [x] 2단계: 그래프 → 단일 번들 (require 런타임 구현)
- [ ] 3단계: Loader 시스템 (CSS, JSON 등 비-JS 처리)
- [ ] 4단계: Plugin 시스템 (빌드 라이프사이클 훅)
- [ ] 5단계: config 파일 + CLI (`webpack.config.js`)
- [ ] 6단계: watch / 간단한 dev server

## 기술 스택

- TypeScript + tsx
- `@babel/parser` (파싱), `@babel/traverse` (AST 순회), `@babel/core` + `@babel/preset-env` (코드 변환)
