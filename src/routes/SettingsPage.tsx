import { Link } from "react-router-dom";
import { appPath } from "../routes";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">設定</h1>
        <Link
          to={appPath.timer()}
          className="rounded-md bg-gray-800 px-3 py-2 text-sm hover:bg-gray-700"
        >
          対局へ
        </Link>
      </header>

      <main className="mt-4 space-y-4">
        <section className="rounded-xl border border-gray-700 p-4">
          <h2 className="font-semibold">時間方式</h2>
          <div className="mt-3 flex gap-2">
            <button className="rounded-md bg-gray-800 px-3 py-2 text-sm hover:bg-gray-700">
              切れ負け
            </button>
            <button className="rounded-md bg-gray-800 px-3 py-2 text-sm hover:bg-gray-700">
              秒読み
            </button>
            <button className="rounded-md bg-gray-800 px-3 py-2 text-sm hover:bg-gray-700">
              フィッシャー
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-gray-700 p-4">
          <h2 className="font-semibold">プリセット</h2>
          <p className="mt-2 text-sm opacity-70">
            ここに「10分+秒読み30」などを並べます。
          </p>
        </section>

        <section className="rounded-xl border border-gray-700 p-4">
          <h2 className="font-semibold">JSON</h2>
          <p className="mt-2 text-sm opacity-70">
            ここに貼り付け／アップロード／エクスポートを作ります。
          </p>
        </section>

        <button className="w-full rounded-md bg-indigo-600 py-3 font-semibold hover:bg-indigo-500">
          この設定で開始
        </button>
      </main>
    </div>
  );
}
