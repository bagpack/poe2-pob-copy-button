# ビルド手順（Vite）

## 前提

- Node.js がインストールされていること

## セットアップ

```
npm install
```

## ビルド

```
npm run build
```

複数のエントリ（content-script/background/page-hook）をモードごとに個別ビルドして `dist/` に出力します。

`dist/` に拡張機能一式が出力されるので、Chrome の「パッケージ化されていない拡張機能を読み込む」から `dist/` を指定してください。

## 動作確認

公式トレードサイトの `trade2` TOPページから検索を実行し、各アイテムに `PoB Copy` ボタンが表示されることを確認します。コンテンツスクリプトは `trade2` TOPページを含むURLへ注入され、DOM変更を監視して検索結果へボタンを追加します。検索トップへ戻って再検索しても表示されることを確認してください。

## 個別ビルド（必要な場合）

```
npm run build -- --mode content
npm run build -- --mode background
npm run build -- --mode page-hook
```

## アイコン生成

`public/icons/icon.svg` を元にPNGを生成します。

```
npm run icons
```

## フォーマット

```
npm run format
```

## Releaseルール

`v*` タグをpushするとGitHub Actionsがビルドし、
`poe2-pob-copy-button-dist.zip` をReleaseに添付します。

例:

```
git tag v0.2.0
git push origin v0.2.0
```
