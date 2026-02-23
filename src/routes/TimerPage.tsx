import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiPause,
  FiPlay,
  FiInfo,
  FiRepeat,
  FiRotateCcw,
  FiSettings,
} from "react-icons/fi";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { IconButton, IconLinkButton } from "../components/IconButtons";
import { beep, disableBeep, enableBeep } from "../features/audio/beep";
import {
  COUNTDOWN_SOUND,
  playPublicAudio,
  playPublicAudioUntilEnd,
  remainingMinutesPublicPath,
  remainingSecondsPublicPath,
  SOUND,
} from "../features/audio/voice";
import { useClock } from "../features/clock/useClock";
import { getAllConfigs, type BuiltinConfig } from "../features/rules/load";
import type { ClockConfigV1 } from "../features/rules/types";
import { validateConfigV1 } from "../features/rules/validate";
import { formatMs } from "../lib/formatter";
import { appPath } from "../routes";

const TURN_SWITCH_KEYS = ["Enter", " ", "Spacebar"] as const;
const TURN_SWITCH_KEY_SET = new Set<string>(TURN_SWITCH_KEYS);
const isTurnSwitchKey = (e: KeyboardEvent) => TURN_SWITCH_KEY_SET.has(e.key);

export default function TimerPage() {
  const [searchParams] = useSearchParams();
  const ruleIdFromQuery = searchParams.get("rule");
  const location = useLocation();

  const customFromState = (location.state as { customConfig?: unknown } | null)
    ?.customConfig;

  const { selected, errorMessage } = useMemo(() => {
    if (customFromState !== undefined) {
      try {
        const config = validateConfigV1(customFromState);
        return {
          selected: {
            kind: "custom" as const,
            config,
            key: `custom:${JSON.stringify(config)}`,
          },
          errorMessage: null as string | null,
        };
      } catch (e) {
        return {
          selected: null as
            | {
                kind: "builtin";
                builtin: BuiltinConfig;
                key: string;
              }
            | {
                kind: "custom";
                config: ClockConfigV1;
                key: string;
              }
            | null,
          errorMessage: e instanceof Error ? e.message : "ルールが不正です",
        };
      }
    }

    const all = getAllConfigs();
    if (all.length === 0) {
      return {
        selected: null as
          | {
              kind: "builtin";
              builtin: BuiltinConfig;
              key: string;
            }
          | {
              kind: "custom";
              config: ClockConfigV1;
              key: string;
            }
          | null,
        errorMessage: "ルール定義が見つかりません",
      };
    }
    const hit = ruleIdFromQuery
      ? all.find((c) => c.id === ruleIdFromQuery)
      : undefined;
    const builtin = hit ?? all[0];
    return {
      selected: { kind: "builtin" as const, builtin, key: builtin.id },
      errorMessage: null as string | null,
    };
  }, [customFromState, ruleIdFromQuery]);

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

  return (
    <TimerPageInner
      key={selected.key}
      selection={
        selected.kind === "builtin" ? selected.builtin : selected.config
      }
      settingsNav={
        selected.kind === "builtin"
          ? { kind: "builtin", ruleId: selected.builtin.id }
          : { kind: "custom", config: selected.config }
      }
    />
  );
}

function TimerPageInner({
  selection,
  settingsNav,
}: {
  selection: BuiltinConfig | ClockConfigV1;
  settingsNav:
    | { kind: "builtin"; ruleId: string }
    | { kind: "custom"; config: ClockConfigV1 };
}) {
  const config = "version" in selection ? selection : selection.config;
  const { state, tap, pause, resume, reset } = useClock(config.time);

  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isSidesSwapped, setIsSidesSwapped] = useState<boolean>(false);
  const hasAnnouncedTimeoutRef = useRef(false);
  const stateRef = useRef(state);
  const tapRef = useRef(tap);
  const isAudioEnabledRef = useRef(isAudioEnabled);
  const prevRemainingSecRef = useRef<[number | null, number | null]>([
    null,
    null,
  ]);
  const announceQueueRef = useRef<Promise<void>>(Promise.resolve());

  const leftPlayer: 0 | 1 = isSidesSwapped ? 1 : 0;
  const rightPlayer: 0 | 1 = isSidesSwapped ? 0 : 1;

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    tapRef.current = tap;
  }, [tap]);

  useEffect(() => {
    isAudioEnabledRef.current = isAudioEnabled;
  }, [isAudioEnabled]);

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

  // PC: Enter/Spaceキーで手番交代（タップと同等）
  // クリック後にボタンへフォーカスが移っても、キーのデフォルト(click/scroll)に負けないよう capture で奪う。
  useEffect(() => {
    const shouldIgnoreTarget = (target: EventTarget | null) => {
      if (!target) return false;
      if (target instanceof HTMLInputElement) return true;
      if (target instanceof HTMLTextAreaElement) return true;
      if (target instanceof HTMLSelectElement) return true;
      if (target instanceof HTMLElement && target.isContentEditable)
        return true;
      return false;
    };

    const preventKeyDefault = (e: KeyboardEvent) => {
      if (!isTurnSwitchKey(e)) return;
      if (e.repeat) return;
      if (e.isComposing) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (shouldIgnoreTarget(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    };

    const onKeyDownCapture = (e: KeyboardEvent) => {
      if (!isTurnSwitchKey(e)) return;
      if (e.repeat) return;
      if (e.isComposing) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (shouldIgnoreTarget(e.target)) return;

      e.preventDefault();
      e.stopPropagation();

      const s = stateRef.current;
      if (s.finished) return;
      if (s.active !== null && !s.running) return;

      // 進行中は「いま動いている側」を押した扱いで相手に手番を渡す。
      // 未開始(active=null)は右側を押した扱いにして左側から開始する。
      const playerToTap = s.active ?? rightPlayer;

      const isAudioEnabledNow = isAudioEnabledRef.current;
      const nextActive = playerToTap === 0 ? 1 : 0;
      const willSwitch = s.active !== nextActive;

      if (isAudioEnabledNow && s.active === null) {
        try {
          void playPublicAudio(SOUND.yoroshiku);
        } catch {
          // no-op
        }
      }

      if (isAudioEnabledNow && willSwitch) {
        try {
          enableBeep();
          beep();
        } catch {
          // no-op
        }
      }

      tapRef.current(playerToTap);

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    };

    window.addEventListener("keydown", onKeyDownCapture, true);
    window.addEventListener("keyup", preventKeyDefault, true);
    return () => {
      window.removeEventListener("keydown", onKeyDownCapture, true);
      window.removeEventListener("keyup", preventKeyDefault, true);
    };
  }, [rightPlayer]);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* プレイヤー（横並び） */}
      <div className="flex-1 flex relative">
        {state.active === null && (
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gray-500/70" />
        )}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none">
          <div className="text-5xl font-mono font-semibold text-white/80 drop-shadow">
            {state.ply}
          </div>
        </div>
        <button
          className={`flex-1 transition-colors ${
            state.active === leftPlayer
              ? state.running
                ? "bg-emerald-500 text-gray-950"
                : "bg-emerald-700 text-emerald-50"
              : "bg-gray-700 text-white"
          }`}
          onClick={() => tapWithBeep(leftPlayer)}
        >
          <div className="h-full flex flex-col items-center justify-center">
            <div className="text-6xl font-mono">
              {formatMs(state.players[leftPlayer].remainingMs)}
            </div>
            <div className="mt-2 text-sm opacity-80">
              プレイヤー{leftPlayer + 1}
            </div>
            <div className="mt-2 text-sm opacity-80">
              {leftPlayer === 0 ? (
                <>
                  持ち時間: {config.time.player1.mainSeconds}s / 秒読み:{" "}
                  {config.time.player1.byoyomiSeconds ?? 0}s / フィッシャー:{" "}
                  {config.time.player1.fischerSeconds ?? 0}s
                </>
              ) : (
                <>
                  持ち時間: {config.time.player2.mainSeconds}s / 秒読み:{" "}
                  {config.time.player2.byoyomiSeconds ?? 0}s / フィッシャー:{" "}
                  {config.time.player2.fischerSeconds ?? 0}s
                </>
              )}
            </div>
            {state.players[leftPlayer].inByoyomi && (
              <div className="mt-2 text-sm opacity-80">秒読み</div>
            )}
          </div>
        </button>

        <button
          className={`flex-1 transition-colors ${
            state.active === rightPlayer
              ? state.running
                ? "bg-emerald-500 text-gray-950"
                : "bg-emerald-700 text-emerald-50"
              : "bg-gray-700 text-white"
          }`}
          onClick={() => tapWithBeep(rightPlayer)}
        >
          <div className="h-full flex flex-col items-center justify-center">
            <div className="text-6xl font-mono">
              {formatMs(state.players[rightPlayer].remainingMs)}
            </div>
            <div className="mt-2 text-sm opacity-80">
              プレイヤー{rightPlayer + 1}
            </div>
            <div className="mt-2 text-sm opacity-80">
              {rightPlayer === 0 ? (
                <>
                  持ち時間: {config.time.player1.mainSeconds}s / 秒読み:{" "}
                  {config.time.player1.byoyomiSeconds ?? 0}s / フィッシャー:{" "}
                  {config.time.player1.fischerSeconds ?? 0}s
                </>
              ) : (
                <>
                  持ち時間: {config.time.player2.mainSeconds}s / 秒読み:{" "}
                  {config.time.player2.byoyomiSeconds ?? 0}s / フィッシャー:{" "}
                  {config.time.player2.fischerSeconds ?? 0}s
                </>
              )}
            </div>
            {state.players[rightPlayer].inByoyomi && (
              <div className="mt-2 text-sm opacity-80">秒読み</div>
            )}
          </div>
        </button>
      </div>

      {/* 操作 */}
      <div className="p-3 space-y-2">
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
          <IconButton
            label="左右入替"
            icon={<FiRepeat />}
            onClick={() => setIsSidesSwapped((v) => !v)}
          />
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
            label="説明"
            icon={<FiInfo />}
            to={appPath.information()}
          />
          <IconLinkButton
            label="設定"
            icon={<FiSettings />}
            to={
              settingsNav.kind === "builtin"
                ? appPath.settings({ rule: settingsNav.ruleId })
                : appPath.settings()
            }
            state={
              settingsNav.kind === "custom"
                ? { customConfig: settingsNav.config }
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
