import { useClock } from "../features/clock/useClock";
import { formatMs } from "../lib/formatter";

export default function TimerPage() {
  const { state, tap, pause, resume } = useClock([600, 300]);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* 上（Player 1） */}
      <button
        className={`flex-1 ${state.active === 0 ? "bg-gray-800" : "bg-gray-700"}`}
        onClick={() => tap(0)}
      >
        <div className="h-full flex flex-col items-center justify-center">
          <div className="text-sm opacity-70">Player 1</div>
          <div className="text-6xl font-mono">
            {formatMs(state.players[0].remainingMs)}
          </div>
        </div>
      </button>

      {/* 下（Player 2） */}
      <button
        className={`flex-1 ${state.active === 1 ? "bg-gray-800" : "bg-gray-700"}`}
        onClick={() => tap(1)}
      >
        <div className="h-full flex flex-col items-center justify-center">
          <div className="text-sm opacity-70">Player 2</div>
          <div className="text-6xl font-mono">
            {formatMs(state.players[1].remainingMs)}
          </div>
        </div>
      </button>

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
