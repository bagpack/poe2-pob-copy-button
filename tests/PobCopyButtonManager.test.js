import test from "node:test";
import assert from "node:assert/strict";
import { createPobCopyButtonManager } from "../src/content/PobCopyButtonManager.js";

const BUTTON_CLASS = "pob-copy-btn";
const STALE_PROCESSED_ATTR = "data-pob-copy-injected";

const createLeft = () => ({
  nodeType: 1,
  children: [],
  querySelector(selector) {
    if (selector !== `.${BUTTON_CLASS}`) return null;
    return (
      this.children.find((child) => child.className === BUTTON_CLASS) ?? null
    );
  },
  insertBefore(child) {
    this.children.unshift(child);
  },
});

const createRow = ({ dataId = null, left = null } = {}) => {
  const attributes = {};
  if (dataId) attributes["data-id"] = dataId;

  return {
    nodeType: 1,
    left,
    attributes,
    getAttribute(name) {
      return this.attributes[name] ?? null;
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    matches(selector) {
      return (
        selector === ".row[data-id]" && Boolean(this.getAttribute("data-id"))
      );
    },
    querySelector(selector) {
      if (selector === ".left") return this.left;
      if (selector === ".verifiedStatus") return null;
      return null;
    },
  };
};

const createTestEnvironment = (rows) => {
  let observerCallback = null;
  let observedTarget = null;
  let observeOptions = null;
  let observeCallCount = 0;
  const previousGlobals = {
    document: globalThis.document,
    MutationObserver: globalThis.MutationObserver,
    window: globalThis.window,
  };
  const findRows = (selector) =>
    rows.filter(
      (row) => row.getAttribute("data-id") && selector === ".row[data-id]"
    );

  globalThis.window = { setTimeout: () => 1 };
  globalThis.MutationObserver = class {
    constructor(callback) {
      observerCallback = callback;
    }

    observe(target, options) {
      observedTarget = target;
      observeOptions = options;
      observeCallCount += 1;
    }
  };
  globalThis.document = {
    querySelectorAll: findRows,
    createElement: () => ({
      dataset: {},
      classList: { add() {} },
      addEventListener() {},
    }),
  };

  return {
    emitMutation(...mutations) {
      const deliverableMutations = mutations.filter(
        (mutation) =>
          mutation.type !== "attributes" ||
          !observeOptions?.attributeFilter ||
          observeOptions.attributeFilter.includes(mutation.attributeName)
      );
      if (deliverableMutations.length) observerCallback(deliverableMutations);
    },
    getObserveCallCount() {
      return observeCallCount;
    },
    getObservedTarget() {
      return observedTarget;
    },
    getObserveOptions() {
      return observeOptions;
    },
    restore() {
      globalThis.document = previousGlobals.document;
      globalThis.MutationObserver = previousGlobals.MutationObserver;
      globalThis.window = previousGlobals.window;
    },
  };
};

const createManager = (overrides = {}) =>
  createPobCopyButtonManager({
    itemCache: { get: () => null },
    textBuilder: { buildPobFullText: () => "" },
    clipboard: { copy: async () => {} },
    labels: { ready: "PoB Copy" },
    resetDelayMs: 1,
    buttonClass: BUTTON_CLASS,
    ...overrides,
  });

test("起動時に検索結果行へボタンを注入する", () => {
  const left = createLeft();
  const rows = [createRow({ dataId: "listing-id", left })];
  const environment = createTestEnvironment(rows);

  try {
    createManager().start();

    assert.equal(left.children.length, 1);
  } finally {
    environment.restore();
  }
});

test("DOM変更通知で2回目の検索結果へボタンを注入する", async () => {
  const rows = [];
  const environment = createTestEnvironment(rows);

  try {
    createManager().start();
    const left = createLeft();
    rows.push(createRow({ dataId: "listing-id", left }));
    environment.emitMutation({
      type: "childList",
      target: globalThis.document,
      addedNodes: rows,
    });
    await Promise.resolve();

    assert.equal(left.children.length, 1);
  } finally {
    environment.restore();
  }
});

test("同じ行のボタンが再描画で消えてもDOM変更通知で再注入する", async () => {
  const left = createLeft();
  const row = createRow({ dataId: "listing-id", left });
  const environment = createTestEnvironment([row]);

  try {
    createManager().start();
    left.children = [];
    environment.emitMutation({
      type: "childList",
      target: row,
      addedNodes: [],
    });
    await Promise.resolve();

    assert.equal(left.children.length, 1);
  } finally {
    environment.restore();
  }
});

test("startを複数回呼んでもMutationObserverを重複登録しない", () => {
  const environment = createTestEnvironment([]);

  try {
    const manager = createManager();
    manager.start();
    manager.start();

    assert.equal(environment.getObserveCallCount(), 1);
    assert.equal(environment.getObservedTarget(), globalThis.document);
  } finally {
    environment.restore();
  }
});

test("初回走査が例外でもMutationObserverを登録する", () => {
  const environment = createTestEnvironment([]);

  try {
    globalThis.document.querySelectorAll = () => {
      throw new Error("scan failed");
    };

    assert.doesNotThrow(() =>
      createManager({ logger: { error() {} } }).start()
    );
    assert.equal(environment.getObserveCallCount(), 1);
  } finally {
    environment.restore();
  }
});

test("注入済みマーカーが残っていてもボタンが消えた行へ再注入する", () => {
  const left = createLeft();
  const row = createRow({ dataId: "listing-id", left });
  row.setAttribute(STALE_PROCESSED_ATTR, "true");
  const environment = createTestEnvironment([row]);

  try {
    createManager().start();

    assert.equal(left.children.length, 1);
  } finally {
    environment.restore();
  }
});
