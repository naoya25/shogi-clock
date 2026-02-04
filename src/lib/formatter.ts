export function formatMs(ms: number) {
  const totalMs = Math.max(0, Math.floor(ms));
  const m = Math.floor(totalMs / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const deci = Math.floor((totalMs % 1000) / 100); // 0-9 (100ms)
  return `${m}:${s.toString().padStart(2, "0")}.${deci}`;
}
