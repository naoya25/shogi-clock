import { useClock } from "../features/clock/useClock";
import { formatMs } from "../lib/formatter";

export default function TimerPage() {
  const { state, tap, pause, resume } = useClock([600, 300]);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* プレイヤー（横並び） */}
      <div className="flex-1 flex">
        <button
          className={`flex-1 transition-colors ${
            state.active === 0
              ? "bg-emerald-500 text-gray-950"
              : "bg-gray-700 text-white"
          }`}
          onClick={() => tap(0)}
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
              ? "bg-emerald-500 text-gray-950"
              : "bg-gray-700 text-white"
          }`}
          onClick={() => tap(1)}
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
      </div>
    </div>
  );
}
