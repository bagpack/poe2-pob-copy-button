export const createPobCopyButtonManager = ({
  itemCache,
  textBuilder,
  clipboard,
  labels,
  resetDelayMs,
  buttonClass,
  logger = console,
}) => {
  const rowSelector = ".row[data-id]";
  let started = false;
  let scanScheduled = false;

  const setButtonStatus = (button, status) => {
    button.dataset.status = status;
    button.textContent = labels[status] || labels.ready;
  };

  const handleCopy = async (row, button) => {
    const itemId = row.getAttribute("data-id");
    if (!itemId) {
      setButtonStatus(button, "error");
      return;
    }

    if (button._pobResetTimer) {
      clearTimeout(button._pobResetTimer);
      button._pobResetTimer = null;
    }

    setButtonStatus(button, "loading");
    button.disabled = true;

    try {
      const item = itemCache.get(itemId);
      const text = textBuilder.buildPobFullText(item);
      if (!text) {
        throw new Error("No valid mod lines");
      }
      await clipboard.copy(text);
      setButtonStatus(button, "ok");
    } catch (error) {
      setButtonStatus(button, "error");
    } finally {
      button._pobResetTimer = window.setTimeout(() => {
        setButtonStatus(button, "ready");
        button.disabled = false;
        button._pobResetTimer = null;
      }, resetDelayMs);
    }
  };

  const injectButton = (row) => {
    const left = row.querySelector(".left");
    if (!left) return;
    if (left.querySelector(`.${buttonClass}`)) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = buttonClass;
    button.title = "Copy full item text for PoB Create Custom";
    setButtonStatus(button, "ready");
    button.addEventListener("click", () => handleCopy(row, button));

    const verifiedStatus = row.querySelector(".verifiedStatus");
    if (verifiedStatus && verifiedStatus.parentNode) {
      button.classList.add("pob-copy-btn--below-verified");
      verifiedStatus.insertAdjacentElement("afterend", button);
    } else {
      left.insertBefore(button, left.firstChild);
    }
  };

  const scanAndInject = (root = document) => {
    const rows = root.matches?.(rowSelector) ? [root] : [];
    root.querySelectorAll?.(rowSelector).forEach((row) => rows.push(row));
    rows.forEach((row) => {
      try {
        injectButton(row);
      } catch (error) {
        logger.error("[poe2-pob-copy] row injection failed", error);
      }
    });
  };

  const runScan = (root = document) => {
    try {
      scanAndInject(root);
    } catch (error) {
      logger.error("[poe2-pob-copy] scan failed", error);
    }
  };

  const pendingRoots = new Set();

  const scheduleScan = (root = document) => {
    pendingRoots.add(root);
    if (scanScheduled) return;
    scanScheduled = true;
    Promise.resolve().then(() => {
      scanScheduled = false;
      const roots = [...pendingRoots];
      pendingRoots.clear();
      roots.forEach((scanRoot) => runScan(scanRoot));
    });
  };

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type !== "childList" && mutation.type !== "attributes") {
        return;
      }
      const row = mutation.target.closest?.(rowSelector);
      scheduleScan(row || mutation.target);
    });
  });

  const start = () => {
    if (started) return;
    started = true;
    observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-id", "class"],
    });
    runScan();
  };

  return { start };
};
