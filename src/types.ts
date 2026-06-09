import type { Asset } from "./createAsset.js";
import type { Compiler } from "./compiler.js";

export interface OutputOptions {
  filename: string;
}

export interface BundlerConfig {
  entry: string;
  output: OutputOptions;
  plugins?: Plugin[];
}

export interface ResolvedBundlerConfig {
  root: string;
  entry: string;
  output: OutputOptions;
  plugins: Plugin[];
}

export interface Plugin {
  apply(compiler: Compiler): void;
}

export interface CompilerContext {
  config: ResolvedBundlerConfig;
  graph: Asset[];
  bundleCode: string;
}
