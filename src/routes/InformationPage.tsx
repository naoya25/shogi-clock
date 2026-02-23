import { Link } from "react-router-dom";
import { appPath } from "../routes";

export default function InformationPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">情報</h1>
        <div className="flex items-center gap-2">
          <Link
            to={appPath.timer()}
            className="rounded-md bg-gray-800 px-3 py-2 text-sm hover:bg-gray-700"
          >
            対局へ
          </Link>
          <Link
            to={appPath.settings()}
            className="rounded-md bg-gray-800 px-3 py-2 text-sm hover:bg-gray-700"
          >
            設定へ
          </Link>
        </div>
      </header>

      <main className="mt-4 space-y-4">
        <section className="rounded-xl border border-gray-700 p-4 space-y-2">
          <h2 className="font-semibold">このアプリについて</h2>
          <p className="text-sm opacity-90">
            将棋用の対局時計（2人用）です。画面タップ、または PC では Enter / Space
            で手番を切り替えます。
          </p>
        </section>

        <section className="rounded-xl border border-gray-700 p-4 space-y-2">
          <h2 className="font-semibold">操作</h2>
          <ul className="list-disc pl-5 text-sm opacity-90 space-y-1">
            <li>画面タップで手番切り替え</li>
            <li>Enter / Space で手番切り替え（PC）</li>
            <li>一時停止 / 再開 / リセット / 左右入替 / 設定</li>
          </ul>
        </section>

        <section className="rounded-xl border border-gray-700 p-4 space-y-2">
          <h2 className="font-semibold">設定ページ</h2>
          <p className="text-sm opacity-90">
            右上の「設定へ」から設定ページに移動できます。設定ページでは、対局ルール
            （持ち時間、秒読み、フィッシャー増分、読み上げなど）を選んでから対局を開始できます。
          </p>
        </section>
      </main>
    </div>
  );
}

