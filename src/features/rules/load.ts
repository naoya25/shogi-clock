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
