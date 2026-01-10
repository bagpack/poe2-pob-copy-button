# PoE2 PoB Copy Button

[English](README.md)

## 概要

Path of Exile 2 のトレード結果に「PoB Copy」ボタンを追加します。
ボタンを押すと、Path of Building 2（Create Custom）に貼り付けられる
アイテム全文テキストをクリップボードへコピーします。
非英語の言語でトレードサイトを閲覧していても利用できます。

## インストール（Release成果物）

1. GitHub Releasesから `poe2-pob-copy-button-dist.zip` をダウンロードします。
2. zipをローカルに展開します。
3. Chromeで `chrome://extensions/` を開きます。
4. 「デベロッパー モード」を有効にします。
5. 「パッケージ化されていない拡張機能を読み込む」で展開先フォルダを選択します。

## スクリーンショット

![トレード結果のPoB Copyボタン](doc/assets/trade-result.png)

## 使い方

1. PoE2 トレード検索ページを開きます。
   `https://pathofexile.com/trade2/search/poe2`
2. 各行に「PoB Copy」ボタンが表示されます。
3. クリックすると全文テキストがコピーされます。
4. Path of Building 2 の Create Custom に貼り付けます。

## 補足

- 非英語ドメインでは、PoB互換のため英語データをバックグラウンドで取得します。
- まだキャッシュされていない場合は「Failed」と表示されます。
  少し待って再クリックしてください。

## ライセンス

MIT License（`LICENSE` を参照）
