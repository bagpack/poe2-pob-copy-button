import test from "node:test";
import assert from "node:assert/strict";
import { createItemTextBuilder } from "../src/content/ItemTextBuilder.js";

const SOURCE_SETS = [
  { key: "runeMods", tag: "rune" },
  { key: "enchantMods", tag: "enchant" },
  { key: "implicitMods", tag: "implicit" },
  { key: "fracturedMods", tag: "fractured" },
  { key: "explicitMods", tag: null },
  { key: "desecratedMods", tag: "desecrated" },
];

test("オブジェクト形式のexplicitModsをPoB用テキストへ変換する", () => {
  const builder = createItemTextBuilder(SOURCE_SETS);
  const item = {
    rarity: "Rare",
    name: "Cataclysm Pendant",
    typeLine: "Absent Amulet",
    implicitMods: ["-1 Prefix Modifier allowed"],
    explicitMods: [
      {
        description: "50% increased [Evasion|Evasion Rating]",
        flags: { fractured: true },
      },
      { description: "+3 to Level of all [Minion|Minion] Skills" },
      {
        description: "+18% to all [ElementalDamage|Elemental] [Resistances]",
        flags: { desecrated: true },
      },
      {
        description: "+20% to Maximum [Quality]",
        flags: { crafted: true },
      },
    ],
  };

  assert.equal(
    builder.buildPobFullText(item),
    [
      "Rarity: RARE",
      "Cataclysm Pendant",
      "Absent Amulet",
      "Implicits: 1",
      "{implicit}-1 Prefix Modifier allowed",
      "{fractured}50% increased [Evasion|Evasion Rating]",
      "+3 to Level of all [Minion|Minion] Skills",
      "{desecrated}+18% to all [ElementalDamage|Elemental] [Resistances]",
      "{custom}+20% to Maximum [Quality]",
    ].join("\n")
  );
});

test("descriptionを持たないmodオブジェクトを無視する", () => {
  const builder = createItemTextBuilder(SOURCE_SETS);
  const item = {
    rarity: "Rare",
    name: "Safe Item",
    typeLine: "Simple Base",
    explicitMods: [
      { mods: [] },
      { description: "15% increased Damage", flags: null },
    ],
  };

  assert.equal(
    builder.buildPobFullText(item),
    [
      "Rarity: RARE",
      "Safe Item",
      "Simple Base",
      "Implicits: 0",
      "15% increased Damage",
    ].join("\n")
  );
});
