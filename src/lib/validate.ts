export function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export function isInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n);
}

export function isString(x: unknown): x is string {
  return typeof x === "string";
}

export function isArray<T = unknown>(x: unknown): x is T[] {
  return Array.isArray(x);
}
