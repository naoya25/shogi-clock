## shogi-clock

将棋用の**対局時計（2人用）**です。画面をタップして手番を切り替えます。

## 使い方

- **左右の時間表示**: タップで手番切り替え（初回タップ時に開始）
- **一時停止 / 再開**
- **音声: ON / OFF**（効果音・ボイス）

※ 現状の持ち時間は `src/features/rules/builtins/sample.json` を読み込んでいます。

## 開発

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

## 音声

音声ファイルは `public/audio/` にあります。


## TODO
- 時間切れ判定
- フィッシャー実装
- 秒読み実装
- 音声実装
