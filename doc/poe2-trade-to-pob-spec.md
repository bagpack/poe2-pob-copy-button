# PoE2 Trade Fetch → PoB2 Create Custom 出力仕様書

## 1. 目的

PoE2 の Trade Fetch API (`/api/trade2/fetch`) レスポンスから取得したアイテム情報を、  
**PoB2 の Create Custom 形式で利用可能なテキスト**に変換する。

---

## 2. 入力データ

### 入力オブジェクト

- `Item`（Trade Fetch API の `result[].item`）

参照元フィールド：

- `implicitMods?: (string | ModObject)[]`
- `runeMods?: (string | ModObject)[]`
- `enchantMods?: (string | ModObject)[]`
- `fracturedMods?: (string | ModObject)[]`
- `explicitMods?: (string | ModObject)[]`
- `desecratedMods?: (string | ModObject)[]`
- `properties?: { name: string; values: [string, number][] }[]`（Quality取得用）
- `properties?: { name: string; values: [string, number][] }[]`（Radius取得用）
- （補助）`extended`（数値補完用・任意）

`ModObject` は、少なくとも文字列の `description` を持つオブジェクトを指す。
`hash`、`flags`、`mods` などのメタデータは、本文生成時に必要な範囲だけ使用する。

---

## 3. 出力データ

### 出力形式

- プレーンテキスト
- UTF-8
- 改行区切り
- **1行 = 1 modifier**

### 出力先

- PoB2 の「Create Custom」入力欄
- もしくはクリップボード

### PoB2 Create Custom形式との関係

本仕様は **PoB2 Create Custom 形式** を対象とする。  
アイテムヘッダと `Implicits: N` を含む形式で出力する。
詳細は `doc/pob2-paste-format-spec.md` を参照。

最小構成の例（参考）:

```
Rarity: RARE
Custom Item
Vaal Axe
Quality: 20
Implicits: 0
<Mod行...>
```

※ ベース名がPoB2のデータに存在しない場合は解析に失敗する。

### Quality取得ルール

- Trade APIの `properties` にある `name` が `"[Quality]"` の項目から取得する
- `values[0][0]` の `+20%` のような値から数値部分を抽出し、`Quality: <num>` として出力する

### Radius取得ルール

- Trade APIの `properties` にある `name` が `"Radius"` の項目から取得する
- `values[0][0]` の文字列をそのまま `Radius: <label>` として出力する

---

## 4. Mod 行の出力順序（推奨）

以下の順で上から出力する：

1. `runeMods`
2. `enchantMods`
3. `implicitMods`
4. `fracturedMods`
5. `explicitMods`
6. `desecratedMods`

※ PoB の計算上、順序は本質的に影響しないが、人間可読性のためこの順を推奨。

---

## 5. 行変換ルール

### 5.1 基本ルール

- 配列要素が文字列の場合は **そのまま1行として出力**
- 配列要素がオブジェクトの場合は `description` を1行として出力
- オブジェクトの `description` が文字列でない要素はスキップ
- `null` / `undefined` / 空文字はスキップ

### 5.2 オブジェクト形式modのフラグ

現在の `trade2/fetch` は、`explicitMods` などの一部配列を次の形式で返すことがある。

```json
{
  "description": "+3 to Level of all [Minion|Minion] Skills",
  "hash": "stat.explicit.stat_2162097452",
  "flags": { "fractured": true },
  "mods": []
}
```

出力時は `description` を使用し、`flags` はPoB用の先頭タグへ変換する。

- `fractured` → `{fractured}`
- `desecrated` → `{desecrated}`
- `mutated` → `{mutated}`
- `crafted` → `{custom}`
- `enchant` / `implicit` / `rune` → 同名のタグ

文字列形式の既存レスポンスでは、配列の種類に対応するタグを使用する。

### 5.3 言語

- **英語のみ対応**
- 日本語・他言語は PoB の ModParser にマッチしないため不可
- Chrome Extension 実装時は英語レスポンス取得を推奨

---

## 6. 正規化（Normalization）

PoB のパーサ互換性を高めるため、以下の正規化を行う。

### 6.1 角括弧タグの扱い（重要）

Trade APIの角括弧タグは、**効果対象の補足情報**として必要になる場合がある。
無条件に削除すると文が不完全になり、PoBで解釈できない行が発生する。

対応方針:

- 角括弧タグは原則**そのまま保持**する

例:

```
+52 to maximum [Life]
71% increased [Damage]
```

---

### 6.2 空白正規化

- 連続空白は1つにまとめる
- 行頭・行末の空白は trim

---

## 7. 数値プレースホルダ (#) の扱い（重要）

### 7.1 原則

PoB2 Create Custom は以下を **解釈できない**：

```
Adds # to # Fire Damage
Gain #% of Damage as Extra Chaos Damage
```

そのため、`#` を含む行は **確定値に変換する必要がある**。

---

### 7.2 確定値化ルール（優先順）

1. `item.extended.mods.*[].magnitudes[]` が存在し、
   - 対応する stat が特定できる場合  
     → `min` / `max` を使用して確定値を埋める
2. 特定できない場合  
   → **その行は出力しない**

※ 初期実装では「# を含む行は除外＋警告」でも実用可。

---

## 8. 出力対象外の情報

以下は PoB2 Create Custom 形式で使用しないため **出力しない**：

- `extended` 系の数値（DPS 等）
- price / listing 情報
- socket / rune の構造データ（ソケットリンク等）

---

## 9. 出力例

### 入力（Trade API）

```json
{
  "name": "Foe Cutter",
  "typeLine": "Vaal Axe",
  "rarity": "Rare",
  "properties": [{ "name": "[Quality]", "values": [["+20%", 1]] }],
  "implicitMods": ["+20% to Fire Resistance"],
  "runeMods": ["Adds 5 to 10 Damage"],
  "enchantMods": ["+1 to Level of all Skills"],
  "fracturedMods": ["+30 to Strength"],
  "explicitMods": ["Minions deal 80% increased Damage"]
}
```

### 出力（PoB2 Create Custom 形式）

```
Rarity: RARE
Foe Cutter
Vaal Axe
Quality: 20
Implicits: 2
{rune}Adds 5 to 10 Damage
{enchant}+1 to Level of all Skills
{implicit}+20% to Fire Resistance
{fractured}+30 to Strength
Minions deal 80% increased Damage
```
