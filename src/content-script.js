import { createClipboardService } from "./content/ClipboardService.js";
import { createEnglishFetchClient } from "./content/EnglishFetchClient.js";
import { injectApiHook } from "./content/injectApiHook.js";
import { createItemCache } from "./content/ItemCache.js";
import { createItemTextBuilder } from "./content/ItemTextBuilder.js";
import { createPobCopyButtonManager } from "./content/PobCopyButtonManager.js";

(() => {
  const BUTTON_CLASS = "pob-copy-btn";
  const RESET_DELAY_MS = 1500;
  const MESSAGE_SOURCE = "pob-copy";
  const LABELS = {
    ready: "PoB Copy",
    loading: "Loading...",
    ok: "Copied!",
    error: "Failed",
  };
  const ENGLISH_ORIGINS = new Set([
    "https://pathofexile.com",
    "https://www.pathofexile.com",
  ]);

  const SOURCE_SETS = [
    { key: "runeMods", tag: "rune" },
    { key: "enchantMods", tag: "enchant" },
    { key: "implicitMods", tag: "implicit" },
    { key: "fracturedMods", tag: "fractured" },
    { key: "explicitMods", tag: null },
    { key: "desecratedMods", tag: "desecrated" },
  ];

  const itemCache = createItemCache();
  const textBuilder = createItemTextBuilder(SOURCE_SETS);
  const clipboard = createClipboardService();
  const englishFetchClient = createEnglishFetchClient({
    itemCache,
    englishOrigins: ENGLISH_ORIGINS,
  });
  const buttonManager = createPobCopyButtonManager({
    itemCache,
    textBuilder,
    clipboard,
    labels: LABELS,
    resetDelayMs: RESET_DELAY_MS,
    buttonClass: BUTTON_CLASS,
  });

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== MESSAGE_SOURCE) return;
    if (typeof data.url !== "string") return;
    englishFetchClient.handleApiMessage(
      data.url,
      typeof data.body === "string" ? data.body : null
    );
  });

  injectApiHook();
  buttonManager.start();
})();
