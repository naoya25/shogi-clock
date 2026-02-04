let ctx: AudioContext | null = null;

export function enableBeep() {
  if (!ctx) ctx = new AudioContext();
  // iOS対策：ユーザー操作内でresumeしておく
  void ctx.resume();
}

export async function disableBeep() {
  if (!ctx) return;
  try {
    await ctx.suspend();
  } catch {
    // no-op
  }
}

export function beep(
  freq = 1300, // 周波数（将棋時計っぽい）
  durationMs = 80, // 短め
  volume = 0.12, // 小さめ
) {
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.value = freq;

  // クリック音防止のため、少しだけフェードさせる
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + durationMs / 1000 + 0.02);
}
