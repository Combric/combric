import { readFile, realpath } from "node:fs/promises";
import { isAbsolute, join, relative, sep } from "node:path";

import {
  CliError,
  type CliConfig,
  type Mode,
  type PackageManager,
} from "./model.js";

export const CONFIG_FILE = "combric.config.json";
export const MODES: readonly Mode[] = [
  "css",
  "react",
  "tailwind",
  "react-tailwind",
];
export const MANAGERS: readonly PackageManager[] = [
  "pnpm",
  "npm",
  "yarn",
  "bun",
];

export function parseConfig(value: unknown): {
  config: CliConfig;
  unknownFields: string[];
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new CliError(
      "Combric config must be a JSON object.",
      "INVALID_CONFIG",
    );
  }
  const fields = value as Record<string, unknown>;
  if (fields.schemaVersion !== 1) {
    throw new CliError(
      `Unsupported Combric config schemaVersion ${String(fields.schemaVersion)}. Use a compatible CLI or review the config manually.`,
      "UNSUPPORTED_CONFIG_SCHEMA",
    );
  }
  if (!MANAGERS.includes(fields.packageManager as PackageManager)) {
    throw new CliError(
      "Combric config has an invalid packageManager.",
      "INVALID_CONFIG",
    );
  }
  if (!MODES.includes(fields.mode as Mode)) {
    throw new CliError("Combric config has an invalid mode.", "INVALID_CONFIG");
  }
  if (typeof fields.cssFile !== "string" || !fields.cssFile.trim()) {
    throw new CliError(
      "Combric config needs a relative cssFile.",
      "INVALID_CONFIG",
    );
  }
  return {
    config: {
      schemaVersion: 1,
      packageManager: fields.packageManager as PackageManager,
      mode: fields.mode as Mode,
      cssFile: fields.cssFile,
    },
    unknownFields: Object.keys(fields).filter(
      (key) =>
        !["schemaVersion", "packageManager", "mode", "cssFile"].includes(key),
    ),
  };
}

export async function readConfig(root: string): Promise<{
  config: CliConfig | null;
  error: string | null;
  unknownFields: string[];
}> {
  let contents: string;
  try {
    const resolved = await realpath(join(root, CONFIG_FILE));
    const inside = relative(root, resolved);
    if (
      !inside ||
      inside === ".." ||
      inside.startsWith(`..${sep}`) ||
      isAbsolute(inside)
    ) {
      return {
        config: null,
        error: "Combric config resolves outside the project root.",
        unknownFields: [],
      };
    }
    contents = await readFile(resolved, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { config: null, error: null, unknownFields: [] };
    }
    throw error;
  }
  try {
    const parsed: unknown = JSON.parse(contents);
    const result = parseConfig(parsed);
    return {
      config: result.config,
      error: null,
      unknownFields: result.unknownFields,
    };
  } catch (error) {
    return {
      config: null,
      error: error instanceof Error ? error.message : String(error),
      unknownFields: [],
    };
  }
}

export function serializeConfig(config: CliConfig): string {
  return `${JSON.stringify(config, null, 2)}\n`;
}
