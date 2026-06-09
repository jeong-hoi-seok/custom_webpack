import { resolve } from "node:path";
import { Compiler } from "./compiler.js";
import { findConfigFile, loadConfig } from "./config.js";
import { LoggerPlugin } from "./loggerPlugin.js";
import { serve } from "./devServer.js";
import { watch } from "./watch.js";

interface CliOptions {
  command: "build" | "watch" | "serve";
  configFile?: string;
  port: number;
}

function parseArgs(argv: string[]): CliOptions {
  const [command = "build", ...args] = argv;
  const options: CliOptions = {
    command: command === "watch" || command === "serve" ? command : "build",
    port: 3000,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--config" || arg === "-c") {
      options.configFile = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--port" || arg === "-p") {
      options.port = Number(args[index + 1]);
      index += 1;
    }
  }

  return options;
}

async function createCompiler(configFile?: string): Promise<Compiler> {
  const root = process.cwd();
  const config = await loadConfig(root, configFile);
  config.plugins = [new LoggerPlugin(), ...config.plugins];
  return new Compiler(config);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const root = process.cwd();
  const configFile = findConfigFile(root, options.configFile);

  if (options.command === "watch") {
    await watch(() => createCompiler(options.configFile), configFile ? [resolve(configFile)] : []);
    return;
  }

  if (options.command === "serve") {
    await serve(() => createCompiler(options.configFile), {
      port: options.port,
      extraWatchFiles: configFile ? [resolve(configFile)] : [],
    });
    return;
  }

  const compiler = await createCompiler(options.configFile);
  compiler.run();
}

main().catch((error) => {
  console.error(`ERROR: ${(error as Error).message}`);
  process.exitCode = 1;
});
