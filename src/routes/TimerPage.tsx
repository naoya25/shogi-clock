import { useClock } from "../features/clock/useClock";
import { getAllConfigs, type BuiltinConfig } from "../features/rules/load";
import { beep, disableBeep, enableBeep } from "../features/audio/beep";
import { playPublicAudio, SOUND } from "../features/audio/voice";
import { formatMs } from "../lib/formatter";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { appPath } from "../routes";

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
  const { state, tap, pause, resume } = useClock(config.time);

  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const hasAnnouncedTimeoutRef = useRef(false);

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

  const tapWithBeep = (player: 0 | 1) => {
    if (state.finished) return;

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
          </div>
        </button>
      </div>

      {/* 操作 */}
      <div className="p-3 grid grid-cols-2 gap-2">
        <div className="col-span-2 text-center text-xs opacity-70">
          先手 持ち時間: {config.time.player1.mainSeconds}s / 秒読み:{" "}
          {config.time.player1.byoyomiSeconds ?? 0}s / フィッシャー:{" "}
          {config.time.player1.fischerSeconds ?? 0}s ｜ 後手 持ち時間:{" "}
          {config.time.player2.mainSeconds}s / 秒読み:{" "}
          {config.time.player2.byoyomiSeconds ?? 0}s / フィッシャー:{" "}
          {config.time.player2.fischerSeconds ?? 0}s
        </div>
        <button
          className="rounded bg-indigo-600 py-2"
          onClick={state.running ? pause : resume}
        >
          {state.running ? "一時停止" : "再開"}
        </button>
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
          className={`rounded-md px-3 py-2 text-sm transition-colors ${
            isAudioEnabled
              ? "bg-emerald-700 hover:bg-emerald-600"
              : "bg-gray-800 hover:bg-gray-700"
          }`}
        >
          {isAudioEnabled ? "音声: ON" : "音声: OFF"}
        </button>
        <Link
          to={appPath.settings({ rule: builtin.id })}
          className="col-span-2 rounded-md bg-gray-800 px-3 py-2 text-center text-sm hover:bg-gray-700"
        >
          設定
        </Link>
      </div>
    </div>
  );
}
