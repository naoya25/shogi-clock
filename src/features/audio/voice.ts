const cache = new Map<string, HTMLAudioElement>();

export const SOUND = {
  yoroshiku: "audio/1/yoroshiku.wav",
  jikangiredesu: "audio/1/jikangiredesu.wav",
  one: "audio/1/1.wav",
  two: "audio/1/2.wav",
  three: "audio/1/3.wav",
  four: "audio/1/4.wav",
  five: "audio/1/5.wav",
  six: "audio/1/6.wav",
  seven: "audio/1/7.wav",
  eight: "audio/1/8.wav",
  nine: "audio/1/9.wav",
  ten: "audio/1/10.wav",
  twenty: "audio/1/20.wav",
  thirty: "audio/1/30.wav",
  forty: "audio/1/40.wav",
  fifty: "audio/1/50.wav",
  byou: "audio/1/byou.wav",
  fun: "audio/1/fun.wav",
  nokori: "audio/1/nokori.wav",
  thuudanshimasu: "audio/1/thuudanshimasu.wav",
} as const;

export type Sound = (typeof SOUND)[keyof typeof SOUND];

function normalizePublicPath(publicPath: string) {
  // 例: "audio/1/yoroshiku.wav" / "/audio/1/yoroshiku.wav" の両方に対応
  return publicPath.startsWith("/") ? publicPath.slice(1) : publicPath;
}

function getAudio(publicPath: string) {
  const key = normalizePublicPath(publicPath);
  const cached = cache.get(key);
  if (cached) return cached;

  const src = `${import.meta.env.BASE_URL}${key}`;
  const audio = new Audio(src);
  audio.preload = "auto";
  cache.set(key, audio);
  return audio;
}

export type PlayPublicAudioOptions = {
  volume?: number; // 0.0 - 1.0
  restart?: boolean; // true: 先頭から再生し直す
};

export function playPublicAudio(
  publicPath: string,
  options: PlayPublicAudioOptions = {},
) {
  const audio = getAudio(publicPath);

  if (typeof options.volume === "number") {
    audio.volume = Math.min(1, Math.max(0, options.volume));
  }

  if (options.restart ?? true) {
    // 連続再生できるように先頭に戻す（失敗しても再生は試みる）
    try {
      audio.currentTime = 0;
    } catch {
      // no-op
    }
  }

  return audio.play();
}
