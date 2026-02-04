import { Link } from "react-router-dom";
import { appPath } from "../routes";

export default function TimerPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">対局</h1>
        <Link
          to={appPath.settings()}
          className="rounded-md bg-gray-800 px-3 py-2 text-sm hover:bg-gray-700"
        >
          設定
        </Link>
      </header>

      <main className="mt-4">
        <div className="h-[80vh] rounded-xl overflow-hidden border border-gray-700">
          <div className="h-1/2 flex items-center justify-center bg-gray-700">
            <div className="text-center">
              <div className="text-sm opacity-70">Player 2</div>
              <div className="text-5xl font-mono">5:00</div>
            </div>
          </div>

          <div className="h-1/2 flex items-center justify-center bg-gray-800">
            <div className="text-center">
              <div className="text-sm opacity-70">Player 1</div>
              <div className="text-5xl font-mono">5:00</div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button className="flex-1 rounded-md bg-gray-800 py-3 hover:bg-gray-700">
            一時停止
          </button>
          <button className="flex-1 rounded-md bg-gray-800 py-3 hover:bg-gray-700">
            リセット
          </button>
          <button className="flex-1 rounded-md bg-gray-800 py-3 hover:bg-gray-700">
            戻す
          </button>
        </div>
      </main>
    </div>
  );
}
