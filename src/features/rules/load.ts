import type { ClockConfigV1 } from "./types";
import { validateConfigV1 } from "./validate";

export function parseConfigFromJson(text: string): ClockConfigV1 {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("JSONの構文が正しくありません");
  }
  return validateConfigV1(raw);
}

export type BuiltinConfig = {
  id: string;
  fileName: string;
  raw: string;
  config: ClockConfigV1;
};

function toFileName(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? path;
}

function toId(fileName: string): string {
  return fileName.replace(/\.json$/i, "");
}

const builtinJsonRawModules = import.meta.glob("./builtins/*.json", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const allConfigs: BuiltinConfig[] = Object.entries(builtinJsonRawModules)
  .map(([path, raw]) => {
    const fileName = toFileName(path);
    const id = toId(fileName);
    const config = parseConfigFromJson(raw);
    return { id, fileName, raw, config };
  })
  .sort((a, b) => a.config.name.localeCompare(b.config.name, "ja"));

export function getAllConfigs(): BuiltinConfig[] {
  return allConfigs;
}
