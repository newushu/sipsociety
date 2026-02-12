export const sanitizeRichHtml = (html: string): string => {
  if (!html) return "";

  const allowed = new Set([
    "span",
    "a",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "br",
    "font",
  ]);
  const blockTags = new Set(["div", "p"]);

  const escapeAttr = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

  const sanitizeStyle = (style: string) => {
    const allowedProps = new Set([
      "color",
      "font-size",
      "font-weight",
      "font-style",
      "text-decoration",
      "text-decoration-line",
      "text-decoration-color",
      "text-decoration-thickness",
      "font-family",
    ]);
    const next = style
      .split(";")
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        const [rawKey, ...rest] = chunk.split(":");
        if (!rawKey || !rest.length) return null;
        const key = rawKey.trim().toLowerCase();
        if (!allowedProps.has(key)) return null;
        return `${key}: ${rest.join(":").trim()}`;
      })
      .filter(Boolean);
    return next.join("; ");
  };

  const sanitizeHref = (href: string) => {
    const trimmed = href.trim();
    if (!trimmed) return "";
    if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed;
    if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
    return trimmed;
  };

  const readAttr = (attrs: string, name: string) => {
    const match = attrs.match(
      new RegExp(`${name}\\s*=\\s*(\"([^\"]*)\"|'([^']*)'|([^\\s>]+))`, "i")
    );
    return match ? (match[2] ?? match[3] ?? match[4] ?? "") : "";
  };

  let safe = html;
  safe = safe.replace(/<\/?(div|p)[^>]*>/gi, (match, tag) =>
    match.startsWith("</") ? "<br />" : ""
  );
  safe = safe.replace(/<\s*br\s*\/?\s*>/gi, "<br />");

  safe = safe.replace(
    /<\s*(\/?)\s*([a-z0-9-]+)([^>]*)>/gi,
    (_match, slash, rawTag, rawAttrs) => {
      const tag = String(rawTag).toLowerCase();
      if (blockTags.has(tag)) return "";
      if (!allowed.has(tag)) return "";
      if (tag === "br") return "<br />";
      const outputTag = tag === "font" ? "span" : tag;
      if (slash) return `</${outputTag}>`;

      let attrs = "";
      const styleChunks: string[] = [];
      if (tag === "a") {
        const href = sanitizeHref(readAttr(rawAttrs, "href"));
        if (href) {
          attrs += ` href="${escapeAttr(href)}"`;
          attrs += ` target="_blank" rel="noreferrer noopener"`;
        }
      }
      if (tag === "font") {
        const color = readAttr(rawAttrs, "color");
        if (color) styleChunks.push(`color: ${color}`);
        const face = readAttr(rawAttrs, "face");
        if (face) styleChunks.push(`font-family: ${face}`);
        const size = readAttr(rawAttrs, "size");
        if (size) {
          const numeric = Number.parseInt(size, 10);
          const fontSizeMap = [10, 13, 16, 18, 24, 32, 48];
          if (!Number.isNaN(numeric)) {
            const clamped = Math.max(1, Math.min(7, numeric));
            styleChunks.push(`font-size: ${fontSizeMap[clamped - 1]}px`);
          }
        }
      }
      const style = sanitizeStyle(readAttr(rawAttrs, "style"));
      if (style) styleChunks.push(style);
      if (styleChunks.length) {
        attrs += ` style="${escapeAttr(styleChunks.join("; "))}"`;
      }
      return `<${outputTag}${attrs}>`;
    }
  );

  return safe;
};
