import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(
  await readFile(new URL("../public/manifest.json", import.meta.url), "utf8")
);

test("trade2 TOPページにもコンテンツスクリプトを注入する", () => {
  const matches = manifest.content_scripts
    .flatMap((contentScript) => contentScript.matches)
    .filter((match) => match.includes("trade2"));

  assert.ok(matches.includes("https://pathofexile.com/trade2*"));
  assert.ok(matches.includes("https://*.pathofexile.com/trade2*"));
});
