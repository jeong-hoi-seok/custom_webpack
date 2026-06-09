class BuildStatsPlugin {
  apply(compiler) {
    compiler.hooks.done.tap("BuildStatsPlugin", (context) => {
      console.log(`📊 bundle size: ${context.bundleCode.length} bytes`);
    });
  }
}

export default {
  entry: "./example/src/index.js",
  output: {
    filename: "./dist/bundle.js",
  },
  plugins: [new BuildStatsPlugin()],
};
