import { useClock } from "../features/clock/useClock";
import { parseConfigFromJson } from "../features/rules/load";
import { beep, disableBeep, enableBeep } from "../features/audio/beep";
import { playPublicAudio, SOUND } from "../features/audio/voice";
import { formatMs } from "../lib/formatter";
import sampleText from "../features/rules/builtins/sample.json?raw";
import { useState } from "react";

export default function TimerPage() {
  const config = parseConfigFromJson(sampleText);
  const { state, tap, pause, resume } = useClock([
    config.time.player1.mainSeconds,
    config.time.player2.mainSeconds,
  ]);

  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);

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
      </div>
    </div>
  );
}
