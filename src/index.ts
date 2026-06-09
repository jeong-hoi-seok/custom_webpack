import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Compiler } from "./compiler.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(__dirname, "..");

// webpack.config 의 entry / output 에 해당하는 설정.
const compiler = new Compiler({
  root: projectRoot,
  entry: resolve(projectRoot, "example/src/index.js"),
  output: {
    filename: resolve(projectRoot, "dist/bundle.js"),
  },
  plugins: [],
});

compiler.run();
