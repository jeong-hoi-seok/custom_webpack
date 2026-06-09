import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { BundlerConfig, ResolvedBundlerConfig } from "./types.js";

const DEFAULT_CONFIG_FILE = "custom-webpack.config.js";

export function findConfigFile(root: string, configFile?: string): string | undefined {
  const candidate = resolve(root, configFile ?? DEFAULT_CONFIG_FILE);
  return existsSync(candidate) ? candidate : undefined;
}

export async function loadConfig(root: string, configFile?: string): Promise<ResolvedBundlerConfig> {
  const resolvedConfigFile = findConfigFile(root, configFile);

  if (configFile && !resolvedConfigFile) {
    throw new Error(`Config file not found: ${resolve(root, configFile)}`);
  }

  if (!resolvedConfigFile) {
    return resolveConfig(root, {
      entry: "./example/src/index.js",
      output: {
        filename: "./dist/bundle.js",
      },
    });
  }

  const configModule = await import(`${pathToFileURL(resolvedConfigFile).href}?t=${Date.now()}`);
  const config = (configModule.default ?? configModule) as BundlerConfig;

  return resolveConfig(dirname(resolvedConfigFile), config);
}

export function resolveConfig(root: string, config: BundlerConfig): ResolvedBundlerConfig {
  return {
    root,
    entry: resolve(root, config.entry),
    output: {
      filename: resolve(root, config.output.filename),
    },
    plugins: config.plugins ?? [],
  };
}
