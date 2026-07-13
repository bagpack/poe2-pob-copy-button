export const createItemTextBuilder = (sourceSets) => {
  const FLAG_TAGS = [
    ["fractured", "fractured"],
    ["desecrated", "desecrated"],
    ["mutated", "mutated"],
    ["crafted", "custom"],
    ["enchant", "enchant"],
    ["implicit", "implicit"],
    ["rune", "rune"],
  ];

  const normalizeLine = (line) => {
    if (typeof line !== "string" || !line) return "";
    return line.replace(/\s+/g, " ").trim();
  };

  const getFlagTag = (mod) => {
    if (!mod || !mod.flags || typeof mod.flags !== "object") return null;
    const flagTag = FLAG_TAGS.find(([flag]) => mod.flags[flag]);
    return flagTag ? flagTag[1] : null;
  };

  const normalizeMod = (mod, sourceTag) => {
    if (typeof mod === "string") {
      return { line: mod, tag: sourceTag };
    }
    if (!mod || typeof mod !== "object") return null;
    if (typeof mod.description !== "string") return null;
    return { line: mod.description, tag: sourceTag || getFlagTag(mod) };
  };

  const countMods = (mods) => (Array.isArray(mods) ? mods.length : 0);

  const getQualityFromItem = (item) => {
    if (!item || !Array.isArray(item.properties)) return null;
    for (const property of item.properties) {
      if (!property || typeof property.name !== "string") continue;
      const name = property.name.replace(/\s+/g, "").toLowerCase();
      if (name !== "[quality]") continue;
      const value = property.values?.[0]?.[0];
      if (typeof value !== "string") continue;
      const match = value.match(/-?\d+/);
      if (match) return Number(match[0]);
    }
    return null;
  };

  const getRadiusFromItem = (item) => {
    if (!item || !Array.isArray(item.properties)) return null;
    for (const property of item.properties) {
      if (!property || typeof property.name !== "string") continue;
      const name = property.name.replace(/\s+/g, "").toLowerCase();
      if (name !== "radius") continue;
      const value = property.values?.[0]?.[0];
      if (typeof value !== "string") continue;
      return value.trim();
    }
    return null;
  };

  const buildModLines = (item) => {
    if (!item) return [];
    const lines = [];
    for (const source of sourceSets) {
      const mods = item[source.key];
      if (!Array.isArray(mods)) continue;
      for (const mod of mods) {
        const normalizedMod = normalizeMod(mod, source.tag);
        if (!normalizedMod) continue;
        let line = normalizeLine(normalizedMod.line);
        if (!line) continue;
        if (line.includes("#")) continue;
        if (normalizedMod.tag) {
          line = `{${normalizedMod.tag}}${line}`;
        }
        lines.push(line);
      }
    }
    return lines;
  };

  const buildPobFullText = (item) => {
    if (!item) return "";
    const rarity =
      typeof item.rarity === "string" && item.rarity.trim()
        ? item.rarity.trim().toUpperCase()
        : "RARE";
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const typeLine =
      typeof item.typeLine === "string"
        ? item.typeLine.trim()
        : typeof item.baseType === "string"
          ? item.baseType.trim()
          : "";

    const headerLines = [`Rarity: ${rarity}`];

    if (rarity === "UNIQUE" || rarity === "RELIC" || rarity === "RARE") {
      headerLines.push(name || "Custom Item");
      headerLines.push(typeLine || name || "Unknown Base");
    } else {
      let displayName = typeLine || name || "Custom Item";
      if (name && typeLine && !name.includes(typeLine)) {
        displayName = `${name} ${typeLine}`.trim();
      }
      headerLines.push(displayName);
    }

    const implicitCount =
      countMods(item.runeMods) +
      countMods(item.implicitMods) +
      countMods(item.enchantMods);
    const quality = getQualityFromItem(item);
    if (Number.isFinite(quality)) {
      headerLines.push(`Quality: ${quality}`);
    }
    const radius = getRadiusFromItem(item);
    if (radius) {
      headerLines.push(`Radius: ${radius}`);
    }
    headerLines.push(`Implicits: ${implicitCount}`);
    if (item.corrupted) {
      headerLines.push("Corrupted");
    }
    if (item.mirrored) {
      headerLines.push("Mirrored");
    }

    const modLines = buildModLines(item);
    return [...headerLines, ...modLines].join("\n");
  };

  return { buildPobFullText };
};
