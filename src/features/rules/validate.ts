import { isInt, isObject, isString } from "../../lib/validate";
import type { ClockConfigV1 } from "./types";

export function validateConfigV1(raw: unknown): ClockConfigV1 {
  if (!isObject(raw))
    throw new Error("JSONのトップがオブジェクトではありません");

  // name
  if (!isString(raw.name) || raw.name.trim() === "")
    throw new Error("nameが不正です");

  // time
  if (!isObject(raw.time)) throw new Error("timeが不正です");
  if (!isObject(raw.time.player1)) throw new Error("time.player1が不正です");
  if (!isInt(raw.time.player1.mainSeconds) || raw.time.player1.mainSeconds < 0)
    throw new Error("time.player1.mainSecondsが不正です");
  if (
    raw.time.player1.byoyomiSeconds !== undefined &&
    (!isInt(raw.time.player1.byoyomiSeconds) ||
      raw.time.player1.byoyomiSeconds < 0)
  )
    throw new Error("time.player1.byoyomiSecondsが不正です（>=0）");

  if (
    raw.time.player1.fischerSeconds !== undefined &&
    (!isInt(raw.time.player1.fischerSeconds) ||
      raw.time.player1.fischerSeconds < 0)
  )
    throw new Error("time.player1.fischerSecondsが不正です（>=0）");

  if (!isObject(raw.time.player2)) throw new Error("time.player2が不正です");
  if (!isInt(raw.time.player2.mainSeconds) || raw.time.player2.mainSeconds < 0)
    throw new Error("time.player2.mainSecondsが不正です");

  if (
    raw.time.player2.byoyomiSeconds !== undefined &&
    (!isInt(raw.time.player2.byoyomiSeconds) ||
      raw.time.player2.byoyomiSeconds < 0)
  )
    throw new Error("time.player2.byoyomiSecondsが不正です（>=0）");
  if (
    raw.time.player2.fischerSeconds !== undefined &&
    (!isInt(raw.time.player2.fischerSeconds) ||
      raw.time.player2.fischerSeconds < 0)
  )
    throw new Error("time.player2.fischerSecondsが不正です（>=0）");

  // audio
  if (!isObject(raw.audio)) throw new Error("audioが不正です");
  if (
    !Array.isArray(raw.audio.announceMinutes) ||
    !raw.audio.announceMinutes.every((x) => isInt(x) && x >= 0)
  ) {
    throw new Error("audio.announceMinutesが不正です");
  }
  if (
    !Array.isArray(raw.audio.announceSeconds) ||
    !raw.audio.announceSeconds.every((x) => isInt(x) && x >= 0)
  ) {
    throw new Error("audio.announceAtが不正です");
  }
  if (!isInt(raw.audio.countdownFrom) || raw.audio.countdownFrom < 0) {
    throw new Error("audio.countdownFromが不正です");
  }

  return {
    version: 1,
    name: raw.name,
    time: {
      player1: {
        mainSeconds: raw.time.player1.mainSeconds,
        byoyomiSeconds: raw.time.player1.byoyomiSeconds,
        fischerSeconds: raw.time.player1.fischerSeconds,
      },
      player2: {
        mainSeconds: raw.time.player2.mainSeconds,
        byoyomiSeconds: raw.time.player2.byoyomiSeconds,
        fischerSeconds: raw.time.player2.fischerSeconds,
      },
    },
    audio: {
      announceMinutes: raw.audio.announceMinutes,
      announceSeconds: raw.audio.announceSeconds,
      countdownFrom: raw.audio.countdownFrom,
    },
  };
}
