import { useClock } from "../features/clock/useClock";
import { getAllConfigs, type BuiltinConfig } from "../features/rules/load";
import { beep, disableBeep, enableBeep } from "../features/audio/beep";
import {
  COUNTDOWN_SOUND,
  playPublicAudio,
  playPublicAudioUntilEnd,
  remainingMinutesPublicPath,
  remainingSecondsPublicPath,
  SOUND,
} from "../features/audio/voice";
import { formatMs } from "../lib/formatter";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { appPath } from "../routes";
import { IconButton, IconLinkButton } from "../components/IconButtons";
import { FiPause, FiPlay, FiRotateCcw, FiSettings } from "react-icons/fi";

export default function TimerPage() {
  const [searchParams] = useSearchParams();
  const ruleIdFromQuery = searchParams.get("rule");

  const { selected, errorMessage } = useMemo(() => {
    const all = getAllConfigs();
    if (all.length === 0) {
      return {
        selected: null as BuiltinConfig | null,
        errorMessage: "ルール定義が見つかりません",
      };
    }
    const hit = ruleIdFromQuery
      ? all.find((c) => c.id === ruleIdFromQuery)
      : undefined;
    return { selected: hit ?? all[0], errorMessage: null as string | null };
  }, [ruleIdFromQuery]);

  if (!selected) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <header className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">対局</h1>
          <Link
            to={appPath.settings()}
            className="rounded-md bg-gray-800 px-3 py-2 text-sm hover:bg-gray-700"
          >
            設定へ
          </Link>
        </header>
        <main className="mt-4 space-y-3">
          <p className="rounded-md border border-red-500/60 bg-red-500/10 p-3 text-sm">
            {errorMessage ?? "不明なエラー"}
          </p>
        </main>
      </div>
    );
  }

  return <TimerPageInner key={selected.id} builtin={selected} />;
}

function TimerPageInner({ builtin }: { builtin: BuiltinConfig }) {
  const config = builtin.config;
  const { state, tap, pause, resume, reset } = useClock(config.time);

  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const hasAnnouncedTimeoutRef = useRef(false);
  const prevRemainingSecRef = useRef<[number | null, number | null]>([
    null,
    null,
  ]);
  const announceQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!state.finished) return;
    if (hasAnnouncedTimeoutRef.current) return;
    hasAnnouncedTimeoutRef.current = true;

    if (!isAudioEnabled) return;
    try {
      void playPublicAudio(SOUND.jikangiredesu);
    } catch {
      // no-op
    }
  }, [state.finished, isAudioEnabled]);

  useEffect(() => {
    if (state.finished) return;
    if (!state.running || state.active === null) return;
    if (!isAudioEnabled) return;

    const active = state.active;
    const remainingMs = state.players[active].remainingMs;

    const currentSec = Math.max(0, Math.floor(remainingMs / 1000));
    const prevSec = prevRemainingSecRef.current[active];

    // initialize / time increased (byoyomi reset, fischer, etc.)
    if (prevSec === null || currentSec > prevSec) {
      prevRemainingSecRef.current[active] = currentSec;
      // 秒読み開始/リセット直後に countdownFrom 以下なら、その秒から読み上げ開始
      if (state.players[active].inByoyomi) {
        const countdownFrom = config.audio.countdownFrom ?? 0;
        if (countdownFrom > 0 && currentSec <= countdownFrom) {
          const sound = COUNTDOWN_SOUND[currentSec];
          if (sound) {
            announceQueueRef.current = announceQueueRef.current
              .then(() => playPublicAudioUntilEnd(sound))
              .catch(() => {
                // no-op
              });
          }
        }
      }
      return;
    }

    // update for next tick early
    prevRemainingSecRef.current[active] = currentSec;

    if (prevSec === currentSec) return;

    // 秒読み中は、countdownFrom 以下でカウントダウン（持ち時間中はしない）
    if (state.players[active].inByoyomi) {
      const countdownFrom = config.audio.countdownFrom ?? 0;
      if (countdownFrom <= 0) return;
      if (currentSec > countdownFrom) return;
      if (prevSec <= currentSec) return;

      const start = Math.min(prevSec - 1, countdownFrom);
      const end = Math.max(currentSec, 1);

      for (let n = start; n >= end; n--) {
        const sound = COUNTDOWN_SOUND[n];
        if (!sound) continue;
        announceQueueRef.current = announceQueueRef.current
          .then(() => playPublicAudioUntilEnd(sound))
          .catch(() => {
            // no-op
          });
      }
      return;
    }

    const minutes = config.audio.announceMinutes ?? [];
    const seconds = config.audio.announceSeconds ?? [];

    const triggers: Array<
      | { kind: "minutes"; n: number; targetSec: number }
      | { kind: "seconds"; n: number; targetSec: number }
    > = [];

    for (const m of minutes) {
      const targetSec = m * 60;
      if (prevSec > targetSec && currentSec <= targetSec) {
        triggers.push({ kind: "minutes", n: m, targetSec });
      }
    }
    for (const s of seconds) {
      const targetSec = s;
      if (prevSec > targetSec && currentSec <= targetSec) {
        triggers.push({ kind: "seconds", n: s, targetSec });
      }
    }

    if (triggers.length === 0) return;
    triggers.sort((a, b) => b.targetSec - a.targetSec);

    for (const t of triggers) {
      const publicPath =
        t.kind === "minutes"
          ? remainingMinutesPublicPath(t.n)
          : remainingSecondsPublicPath(t.n);

      announceQueueRef.current = announceQueueRef.current
        .then(() => playPublicAudioUntilEnd(publicPath))
        .catch(() => {
          // no-op
        });
    }
  }, [
    state.running,
    state.active,
    state.finished,
    state.players,
    config.audio.countdownFrom,
    config.audio.announceMinutes,
    config.audio.announceSeconds,
    isAudioEnabled,
  ]);

  const tapWithBeep = (player: 0 | 1) => {
    if (state.finished) return;
    if (state.active !== null && !state.running) return;

    const nextActive = player === 0 ? 1 : 0;
    const willSwitch = state.active !== nextActive;

    if (isAudioEnabled && state.active === null) {
      try {
        void playPublicAudio(SOUND.yoroshiku);
      } catch {
        // no-op
      }
    }

    if (isAudioEnabled && willSwitch) {
      try {
        enableBeep();
        beep();
      } catch {
        // no-op
      }
    }

    tap(player);
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* プレイヤー（横並び） */}
      <div className="flex-1 flex relative">
        {state.active === null && (
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gray-500/70" />
        )}
        <button
          className={`flex-1 transition-colors ${
            state.active === 0
              ? state.running
                ? "bg-emerald-500 text-gray-950"
                : "bg-emerald-700 text-emerald-50"
              : "bg-gray-700 text-white"
          }`}
          onClick={() => tapWithBeep(0)}
        >
          <div className="h-full flex flex-col items-center justify-center">
            <div className="text-6xl font-mono">
              {formatMs(state.players[0].remainingMs)}
            </div>
            {state.players[0].inByoyomi && (
              <div className="mt-2 text-sm opacity-80">秒読み</div>
            )}
          </div>
        </button>

        <button
          className={`flex-1 transition-colors ${
            state.active === 1
              ? state.running
                ? "bg-emerald-500 text-gray-950"
                : "bg-emerald-700 text-emerald-50"
              : "bg-gray-700 text-white"
          }`}
          onClick={() => tapWithBeep(1)}
        >
          <div className="h-full flex flex-col items-center justify-center">
            <div className="text-6xl font-mono">
              {formatMs(state.players[1].remainingMs)}
            </div>
            {state.players[1].inByoyomi && (
              <div className="mt-2 text-sm opacity-80">秒読み</div>
            )}
          </div>
        </button>
      </div>

      {/* 操作 */}
      <div className="p-3 space-y-2">
        <div className="text-center text-xs opacity-70">
          先手 持ち時間: {config.time.player1.mainSeconds}s / 秒読み:{" "}
          {config.time.player1.byoyomiSeconds ?? 0}s / フィッシャー:{" "}
          {config.time.player1.fischerSeconds ?? 0}s ｜ 後手 持ち時間:{" "}
          {config.time.player2.mainSeconds}s / 秒読み:{" "}
          {config.time.player2.byoyomiSeconds ?? 0}s / フィッシャー:{" "}
          {config.time.player2.fischerSeconds ?? 0}s
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {state.running ? (
            <IconButton
              label="一時停止"
              icon={<FiPause />}
              className="bg-indigo-600 hover:bg-indigo-500"
              onClick={() => {
                if (isAudioEnabled) {
                  try {
                    void playPublicAudio(SOUND.thuudanshimasu);
                  } catch {
                    // no-op
                  }
                }
                pause();
              }}
            />
          ) : (
            <IconButton
              label="再開"
              icon={<FiPlay />}
              className="bg-indigo-600 hover:bg-indigo-500"
              onClick={resume}
              disabled={state.active === null || state.finished}
            />
          )}
          <button
            onClick={async () => {
              if (isAudioEnabled) {
                setIsAudioEnabled(false);
                await disableBeep();
                return;
              }
              setIsAudioEnabled(true);
              enableBeep();
            }}
            className={`h-9 rounded-md px-2 text-xs transition-colors ${
              isAudioEnabled
                ? "bg-emerald-700 hover:bg-emerald-600"
                : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            {isAudioEnabled ? "音声: ON" : "音声: OFF"}
          </button>
          <IconButton
            label="リセット"
            icon={<FiRotateCcw />}
            onClick={() => {
              hasAnnouncedTimeoutRef.current = false;
              prevRemainingSecRef.current = [null, null];
              announceQueueRef.current = Promise.resolve();
              reset();
            }}
          />
          <IconLinkButton
            label="設定"
            icon={<FiSettings />}
            to={appPath.settings({ rule: builtin.id })}
          />
        </div>
      </div>
    </div>
  );
}
