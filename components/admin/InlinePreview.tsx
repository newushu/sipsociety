"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ContentBlock, GlobalSettings, PageContent, TextStyle } from "@/lib/content/types";
import { fontFamilyForKey, fontOptions } from "@/lib/content/fonts";
import { InlineEditTarget } from "@/components/admin/inlineEditTypes";
import ColorPalette from "@/components/admin/ColorPalette";
import BlockRenderer from "@/components/blocks/BlockRenderer";
import { sanitizeRichHtml } from "@/lib/content/rich";

type Props = {
  content: PageContent;
  globals: GlobalSettings;
  onChangeContent: (content: PageContent) => void;
  onChangeGlobals: (globals: GlobalSettings) => void;
  activeEdit: InlineEditTarget | null;
  onSelectEdit: (target: InlineEditTarget) => void;
  mode?: "desktop" | "mobile";
  layout?: "viewport" | "frame";
  showChips?: boolean;
};

const chipBase =
  "rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600 shadow-sm";

const chipActive = "border-amber-300 bg-amber-200 text-stone-900 shadow-md";

const overlayBoxBase =
  "rounded-xl border-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300";

const EDIT_LABELS: Record<string, string> = {
  heroVideo: "Edit video",
  heroImage: "Edit image",
  heroLogo: "Edit logo",
  logoText: "Edit logo text",
  heroTagline: "Edit tagline",
  brandLogo: "Edit logo",
  brandHeading: "Edit heading",
  brandMessage: "Edit message",
  leftLogo: "Edit logo",
  leftTitle: "Edit title",
  leftBody: "Edit body",
  middleMedia: "Edit media",
  rightMedia: "Edit media",
  landscapeMedia: "Edit media",
  brandTopImage: "Edit image",
  brandBgVideo: "Edit video",
  caption: "Edit caption",
  footerTagline: "Edit footer",
  footerLead: "Edit lead",
  footerButton: "Edit button",
  brandAnimation: "Edit animation",
};

type OverlayItem = {
  id: string;
  target: InlineEditTarget;
  label: string;
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
};

const isSameTarget = (a: InlineEditTarget, b: InlineEditTarget) =>
  a.kind === b.kind &&
  a.scope === b.scope &&
  (a.blockIndex === undefined || b.blockIndex === undefined || a.blockIndex === b.blockIndex);

const updateBlock = (blocks: ContentBlock[], index: number, block: ContentBlock) =>
  blocks.map((item, i) => (i === index ? block : item));

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const ensureTextStyle = (style?: TextStyle): TextStyle => ({
  size: style?.size ?? 16,
  weight: style?.weight ?? 500,
  italic: style?.italic ?? false,
  x: style?.x ?? 0,
  y: style?.y ?? 0,
  font: style?.font,
});

const toPlainText = (html: string) => {
  if (typeof window === "undefined") return html.replace(/<[^>]*>/g, "");
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent ?? "";
};

const mapEditToTarget = (
  edit: string,
  blockIndex: number
): InlineEditTarget | null => {
  switch (edit) {
    case "heroVideo":
      return { kind: "media", scope: "heroVideo", blockIndex };
    case "heroImage":
      return { kind: "media", scope: "heroImage", blockIndex };
    case "heroLogo":
      return { kind: "logo", scope: "hero", blockIndex };
    case "logoText":
      return { kind: "text", scope: "logoText", blockIndex };
    case "heroTagline":
      return { kind: "text", scope: "tagline", blockIndex };
    case "brandLogo":
      return { kind: "logo", scope: "brand", blockIndex };
    case "brandHeading":
      return { kind: "text", scope: "brandHeading", blockIndex };
    case "brandMessage":
      return { kind: "text", scope: "brandMessage", blockIndex };
    case "leftLogo":
      return { kind: "logo", scope: "left", blockIndex };
    case "leftTitle":
      return { kind: "text", scope: "leftTitle", blockIndex };
    case "leftBody":
      return { kind: "text", scope: "leftBody", blockIndex };
    case "middleMedia":
      return { kind: "media", scope: "middleMedia", blockIndex };
    case "rightMedia":
      return { kind: "media", scope: "rightMedia", blockIndex };
    case "landscapeMedia":
      return { kind: "media", scope: "landscapeMedia", blockIndex };
    case "brandTopImage":
      return { kind: "media", scope: "brandTopImage", blockIndex };
    case "brandBgVideo":
      return { kind: "media", scope: "brandBgVideo", blockIndex };
    case "brandAnimation":
      return { kind: "animation", scope: "brandAnimation", blockIndex };
    case "caption":
      return { kind: "text", scope: "caption", blockIndex };
    case "footerTagline":
      return { kind: "text", scope: "footerTagline", blockIndex };
    case "footerLead":
      return { kind: "text", scope: "footerLead", blockIndex };
    case "footerButton":
      return { kind: "text", scope: "footerButton", blockIndex };
    default:
      return null;
  }
};

export default function InlinePreview({
  content,
  globals,
  onChangeContent,
  onChangeGlobals,
  activeEdit,
  onSelectEdit,
  showChips = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [chipOffsets, setChipOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const chipDragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const dragRef = useRef<{
    kind: "logo" | "text";
    scope: "hero" | "brand" | "left" | InlineEditTarget["scope"];
    blockIndex: number;
    startX: number;
    startY: number;
    startValueX: number;
    startValue: number;
  } | null>(null);
  const editableNodeRef = useRef<HTMLElement | null>(null);
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [toolbarColor, setToolbarColor] = useState("#ff0000");
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const selectionRef = useRef<Range | null>(null);
  const toolbarInteractingRef = useRef(false);
  const pendingTextRef = useRef<{ html: string; text: string } | null>(null);
  const applyColor = useCallback((color: string) => {
    if (typeof document === "undefined") return;
    const selection = window.getSelection();
    if (!selection) return;
    const range = selectionRef.current ?? (selection.rangeCount ? selection.getRangeAt(0) : null);
    if (!range) return;
    if (
      !editableNodeRef.current ||
      !editableNodeRef.current.contains(range.commonAncestorContainer)
    ) {
      return;
    }
    selection.removeAllRanges();
    selection.addRange(range);
    try {
      const span = document.createElement("span");
      span.style.color = color;
      span.style.webkitTextFillColor = color;
      span.appendChild(range.extractContents());
      range.insertNode(span);
      selection.removeAllRanges();
      const nextRange = document.createRange();
      nextRange.selectNodeContents(span);
      selection.addRange(nextRange);
      selectionRef.current = nextRange.cloneRange();
    } catch {
      // Ignore range errors.
    }
  }, []);

  const rgbToHex = (value: string) => {
    const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) return null;
    const [r, g, b] = match.slice(1, 4).map((num) => parseInt(num, 10));
    if ([r, g, b].some((num) => Number.isNaN(num))) return null;
    return `#${[r, g, b]
      .map((num) => num.toString(16).padStart(2, "0"))
      .join("")}`;
  };

  const applyFontFamily = useCallback((family: string) => {
    if (typeof document === "undefined") return;
    const selection = window.getSelection();
    const range =
      selectionRef.current ?? (selection?.rangeCount ? selection.getRangeAt(0) : null);
    if (!editableNodeRef.current || !range) return;
    if (!editableNodeRef.current.contains(range.commonAncestorContainer)) return;
    try {
      if (selection && range) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      document.execCommand("styleWithCSS", false, "true");
      const ok = document.execCommand("fontName", false, family);
      if (ok && editableNodeRef.current) {
        pendingTextRef.current = {
          html: editableNodeRef.current.innerHTML,
          text: editableNodeRef.current.textContent ?? "",
        };
        return;
      }
      const span = document.createElement("span");
      span.style.setProperty("font-family", family, "important");
      span.appendChild(range.extractContents());
      range.insertNode(span);
      const nextRange = document.createRange();
      nextRange.selectNodeContents(span);
      selection?.removeAllRanges();
      selection?.addRange(nextRange);
      selectionRef.current = nextRange.cloneRange();
      if (editableNodeRef.current) {
        pendingTextRef.current = {
          html: editableNodeRef.current.innerHTML,
          text: editableNodeRef.current.textContent ?? "",
        };
      }
    } catch {
      // Ignore range errors.
    }
  }, []);

  const exec = useCallback((command: string, value?: string) => {
    if (typeof document === "undefined") return;
    const selection = window.getSelection();
    if (selectionRef.current && selection) {
      selection.removeAllRanges();
      selection.addRange(selectionRef.current);
    }
    editableNodeRef.current?.focus();
    try {
      if (command === "foreColor" && value) {
        document.execCommand("styleWithCSS", false, "true");
        document.execCommand(command, false, value);
        applyColor(value);
        setToolbarColor(value);
        if (editableNodeRef.current) {
          pendingTextRef.current = {
            html: editableNodeRef.current.innerHTML,
            text: editableNodeRef.current.textContent ?? "",
          };
        }
        return;
      }
      if (command === "fontName" && value) {
        applyFontFamily(value);
        return;
      }
      if (command === "fontName") {
        document.execCommand("styleWithCSS", false, "true");
      }
      document.execCommand(command, false, value);
      if (editableNodeRef.current) {
        pendingTextRef.current = {
          html: editableNodeRef.current.innerHTML,
          text: editableNodeRef.current.textContent ?? "",
        };
      }
    } catch {
      // Ignore unsupported commands.
    }
  }, [applyColor]);

  const getTextAccess = useCallback(
    (target: InlineEditTarget) => {
      if (target.kind !== "text") return null;
      const blockIndex = target.blockIndex ?? 0;
      const block = content.blocks[blockIndex];
      const updateBlockData = (patch: Partial<ContentBlock["data"]>) =>
        updateBlock(content.blocks, blockIndex, {
          ...block,
          data: { ...(block as ContentBlock).data, ...patch },
        } as ContentBlock);

      switch (target.scope) {
        case "tagline":
          if (!block || block.type !== "hero") return null;
          return {
            rich: block.data.taglineRich ?? false,
            html: block.data.taglineHtml ?? "",
            text: block.data.tagline,
            setHtml: (next: string) =>
              onChangeContent({
                ...content,
                blocks: updateBlockData({
                  taglineHtml: next,
                  tagline: toPlainText(next),
                }),
              }),
            setText: (next: string) =>
              onChangeContent({
                ...content,
                blocks: updateBlockData({ tagline: next }),
              }),
          };
        case "brandHeading":
          if (!block || block.type !== "brand-message") return null;
          return {
            rich: block.data.headingRich ?? false,
            html: block.data.headingHtml ?? "",
            text: block.data.heading,
            setHtml: (next: string) =>
              onChangeContent({
                ...content,
                blocks: updateBlockData({
                  headingHtml: next,
                  heading: toPlainText(next),
                }),
              }),
            setText: (next: string) =>
              onChangeContent({
                ...content,
                blocks: updateBlockData({ heading: next }),
              }),
          };
        case "brandMessage":
          if (!block || block.type !== "brand-message") return null;
          return {
            rich: true,
            html: block.data.messageHtml ?? "",
            text: block.data.message,
            setHtml: (next: string) => {
              const plain = toPlainText(next);
              onChangeContent({
                ...content,
                blocks: updateBlockData({
                  messageHtml: next,
                  message: plain,
                }),
              });
            },
            setText: (next: string) => {
              onChangeContent({
                ...content,
                blocks: updateBlockData({ message: next }),
              });
            },
          };
        case "leftTitle":
          if (!block || block.type !== "triple-media") return null;
          return {
            rich: true,
            html: block.data.leftTitleHtml ?? "",
            text: block.data.leftTitle,
            setHtml: (next: string) =>
              onChangeContent({
                ...content,
                blocks: updateBlockData({
                  leftTitleHtml: next,
                  leftTitle: toPlainText(next),
                }),
              }),
            setText: (next: string) =>
              onChangeContent({
                ...content,
                blocks: updateBlockData({ leftTitle: next }),
              }),
          };
        case "leftBody":
          if (!block || block.type !== "triple-media") return null;
          return {
            rich: true,
            html: block.data.leftBodyHtml ?? "",
            text: block.data.leftBody,
            setHtml: (next: string) =>
              onChangeContent({
                ...content,
                blocks: updateBlockData({
                  leftBodyHtml: next,
                  leftBody: toPlainText(next),
                }),
              }),
            setText: (next: string) =>
              onChangeContent({
                ...content,
                blocks: updateBlockData({ leftBody: next }),
              }),
          };
        case "caption":
          if (!block || block.type !== "landscape") return null;
          return {
            rich: block.data.captionRich ?? false,
            html: block.data.captionHtml ?? "",
            text: block.data.caption,
            setHtml: (next: string) =>
              onChangeContent({
                ...content,
                blocks: updateBlockData({
                  captionHtml: next,
                  caption: toPlainText(next),
                }),
              }),
            setText: (next: string) =>
              onChangeContent({
                ...content,
                blocks: updateBlockData({ caption: next }),
              }),
          };
        case "footerLead":
          if (!block || block.type !== "footer") return null;
          return {
            rich: block.data.leadTextRich ?? false,
            html: block.data.leadTextHtml ?? "",
            text: block.data.leadText ?? "",
            setHtml: (next: string) =>
              onChangeContent({
                ...content,
                blocks: updateBlockData({
                  leadTextHtml: next,
                  leadText: toPlainText(next),
                }),
              }),
            setText: (next: string) =>
              onChangeContent({
                ...content,
                blocks: updateBlockData({ leadText: next }),
              }),
          };
        case "footerButton":
          if (!block || block.type !== "footer") return null;
          return {
            rich: block.data.leadButtonTextRich ?? false,
            html: block.data.leadButtonTextHtml ?? "",
            text: block.data.leadButtonText ?? "",
            setHtml: (next: string) =>
              onChangeContent({
                ...content,
                blocks: updateBlockData({
                  leadButtonTextHtml: next,
                  leadButtonText: toPlainText(next),
                }),
              }),
            setText: (next: string) =>
              onChangeContent({
                ...content,
                blocks: updateBlockData({ leadButtonText: next }),
              }),
          };
        case "footerTagline":
          if (!block || block.type !== "footer") return null;
          return {
            rich: block.data.taglineRich ?? false,
            html: block.data.taglineHtml ?? "",
            text: block.data.tagline,
            setHtml: (next: string) =>
              onChangeContent({
                ...content,
                blocks: updateBlockData({
                  taglineHtml: next,
                  tagline: toPlainText(next),
                }),
              }),
            setText: (next: string) =>
              onChangeContent({
                ...content,
                blocks: updateBlockData({ tagline: next }),
              }),
          };
        default:
          return null;
      }
    },
    [content, globals, onChangeContent, onChangeGlobals]
  );
  const resizeRef = useRef<{
    blockIndex: number;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    mode: "width" | "height";
  } | null>(null);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (resizeRef.current) {
        const { blockIndex, startX, startY, startWidth, startHeight, mode } =
          resizeRef.current;
        const block = content.blocks[blockIndex];
        if (!block || block.type !== "brand-message") return;
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;
        const nextWidth =
          mode === "width"
            ? clamp(startWidth - deltaX, 240, 5000)
            : startWidth;
        const nextHeight =
          mode === "height"
            ? clamp(startHeight + deltaY, 80, 5000)
            : startHeight;
        onChangeContent({
          ...content,
          blocks: updateBlock(content.blocks, blockIndex, {
            ...block,
            data: {
              ...block.data,
              messageBoxWidthPx: Math.round(nextWidth),
              messageBoxHeightPx: Math.round(nextHeight),
            },
          }),
        });
        return;
      }
      if (!dragRef.current) return;
      const { kind, scope, blockIndex, startX, startY, startValueX, startValue } =
        dragRef.current;
      const deltaY = (event.clientY - startY) / 2;
      const deltaX = (event.clientX - startX) / 2;
      const block = content.blocks[blockIndex];
      if (kind === "logo") {
        const nextX = clamp(startValueX + deltaX, -100, 100);
        const nextY = clamp(startValue + deltaY, -100, 100);
        if (!block) return;
        if (scope === "left" && block.type === "triple-media") {
          onChangeContent({
            ...content,
            blocks: updateBlock(content.blocks, blockIndex, {
              ...block,
              data: { ...block.data, leftLogoX: nextX, leftLogoY: nextY },
            }),
          });
        }
        if (scope === "hero" && block.type === "hero") {
          onChangeContent({
            ...content,
            blocks: updateBlock(content.blocks, blockIndex, {
              ...block,
              data: { ...block.data, logoX: nextX, logoY: nextY },
            }),
          });
        }
        if (scope === "brand" && block.type === "brand-message") {
          onChangeContent({
            ...content,
            blocks: updateBlock(content.blocks, blockIndex, {
              ...block,
              data: { ...block.data, logoX: nextX, logoY: nextY },
            }),
          });
        }
      }
      if (kind === "text") {
        const nextX = startValueX;
        const nextY = clamp(startValue + deltaY, -400, 400);
        if (!block) return;
        const scopeKey = scope as InlineEditTarget["scope"];
        if (scopeKey === "logoText") {
          const base = ensureTextStyle(globals.logoTextStyle);
          onChangeGlobals({
            ...globals,
            logoTextStyle: { ...base, x: nextX, y: nextY },
          });
        }
        if (scopeKey === "tagline" && block.type === "hero") {
          const base = ensureTextStyle(block.data.taglineStyle);
          onChangeContent({
            ...content,
            blocks: updateBlock(content.blocks, blockIndex, {
              ...block,
              data: { ...block.data, taglineStyle: { ...base, x: nextX, y: nextY } },
            }),
          });
        }
        if (scopeKey === "brandHeading" && block.type === "brand-message") {
          const base = ensureTextStyle(block.data.headingStyle);
          onChangeContent({
            ...content,
            blocks: updateBlock(content.blocks, blockIndex, {
              ...block,
              data: { ...block.data, headingStyle: { ...base, x: nextX, y: nextY } },
            }),
          });
        }
        if (scopeKey === "brandMessage" && block.type === "brand-message") {
          const base = ensureTextStyle(globals.brandMessageStyle ?? block.data.messageStyle);
          onChangeGlobals({
            ...globals,
            brandMessageStyle: { ...base, x: nextX, y: nextY },
          });
        }
        if (scopeKey === "leftTitle" && block.type === "triple-media") {
          const base = ensureTextStyle(block.data.leftTitleStyle);
          onChangeContent({
            ...content,
            blocks: updateBlock(content.blocks, blockIndex, {
              ...block,
              data: { ...block.data, leftTitleStyle: { ...base, x: nextX, y: nextY } },
            }),
          });
        }
        if (scopeKey === "leftBody" && block.type === "triple-media") {
          const base = ensureTextStyle(block.data.leftBodyStyle);
          onChangeContent({
            ...content,
            blocks: updateBlock(content.blocks, blockIndex, {
              ...block,
              data: { ...block.data, leftBodyStyle: { ...base, x: nextX, y: nextY } },
            }),
          });
        }
        if (scopeKey === "caption" && block.type === "landscape") {
          const base = ensureTextStyle(block.data.captionStyle);
          onChangeContent({
            ...content,
            blocks: updateBlock(content.blocks, blockIndex, {
              ...block,
              data: { ...block.data, captionStyle: { ...base, x: nextX, y: nextY } },
            }),
          });
        }
        if (scopeKey === "footerTagline" && block.type === "footer") {
          const base = ensureTextStyle(block.data.taglineStyle);
          onChangeContent({
            ...content,
            blocks: updateBlock(content.blocks, blockIndex, {
              ...block,
              data: { ...block.data, taglineStyle: { ...base, x: nextX, y: nextY } },
            }),
          });
        }
      }
    };
    const handleUp = () => {
      resizeRef.current = null;
      dragRef.current = null;
      chipDragRef.current = null;
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [content, globals, onChangeContent, onChangeGlobals]);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (!chipDragRef.current) return;
      const { id, startX, startY, baseX, baseY } = chipDragRef.current;
      const next = {
        x: baseX + (event.clientX - startX),
        y: baseY + (event.clientY - startY),
      };
      setChipOffsets((prev) => ({ ...prev, [id]: next }));
    };
    const handleUp = () => {
      chipDragRef.current = null;
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, []);

  const beginDrag = (
    event: React.PointerEvent,
    scope: "hero" | "brand" | "left",
    blockIndex: number,
    currentX: number,
    currentY: number
  ) => {
    event.preventDefault();
    dragRef.current = {
      kind: "logo",
      scope,
      blockIndex,
      startX: event.clientX,
      startY: event.clientY,
      startValueX: currentX,
      startValue: currentY,
    };
  };

    const getLogoPosition = useCallback(
    (target: InlineEditTarget) => {
      if (target.kind !== "logo") return null;
      const block = content.blocks[target.blockIndex];
      if (!block) return null;
      if (target.scope === "hero" && block.type === "hero")
        return { x: block.data.logoX ?? 0, y: block.data.logoY ?? 0 };
      if (target.scope === "brand" && block.type === "brand-message")
        return { x: block.data.logoX ?? 0, y: block.data.logoY ?? 0 };
      if (target.scope === "left" && block.type === "triple-media")
        return { x: block.data.leftLogoX ?? 0, y: block.data.leftLogoY ?? 0 };
      return null;
    },
    [content.blocks]
  );

  const getTextPosition = useCallback(
    (target: InlineEditTarget) => {
      if (target.kind !== "text") return null;
      const block = target.blockIndex !== undefined ? content.blocks[target.blockIndex] : null;
      const scope = target.scope;
      if (scope === "logoText") {
        const style = ensureTextStyle(globals.logoTextStyle);
        return { x: style.x ?? 0, y: style.y ?? 0 };
      }
      if (scope === "tagline" && block?.type === "hero") {
        const style = ensureTextStyle(block.data.taglineStyle);
        return { x: style.x ?? 0, y: style.y ?? 0 };
      }
      if (scope === "brandHeading" && block?.type === "brand-message") {
        const style = ensureTextStyle(block.data.headingStyle);
        return { x: style.x ?? 0, y: style.y ?? 0 };
      }
      if (scope === "brandMessage" && block?.type === "brand-message") {
        const style = ensureTextStyle(globals.brandMessageStyle ?? block.data.messageStyle);
        return { x: style.x ?? 0, y: style.y ?? 0 };
      }
      if (scope === "leftTitle" && block?.type === "triple-media") {
        const style = ensureTextStyle(block.data.leftTitleStyle);
        return { x: style.x ?? 0, y: style.y ?? 0 };
      }
      if (scope === "leftBody" && block?.type === "triple-media") {
        const style = ensureTextStyle(block.data.leftBodyStyle);
        return { x: style.x ?? 0, y: style.y ?? 0 };
      }
      if (scope === "caption" && block?.type === "landscape") {
        const style = ensureTextStyle(block.data.captionStyle);
        return { x: style.x ?? 0, y: style.y ?? 0 };
      }
      if (scope === "footerTagline" && block?.type === "footer") {
        const style = ensureTextStyle(block.data.taglineStyle);
        return { x: style.x ?? 0, y: style.y ?? 0 };
      }
      if (scope === "footerLead" && block?.type === "footer") {
        const style = ensureTextStyle(block.data.leadStyle);
        return { x: style.x ?? 0, y: style.y ?? 0 };
      }
      if (scope === "footerButton" && block?.type === "footer") {
        const style = ensureTextStyle(block.data.leadButtonStyle);
        return { x: style.x ?? 0, y: style.y ?? 0 };
      }
      return null;
    },
    [content.blocks, globals]
  );

  const updateOverlays = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const nodes = Array.from(
      container.querySelectorAll<HTMLElement>("[data-edit][data-block-index]")
    );
    const next: OverlayItem[] = [];
    nodes.forEach((node, idx) => {
      const edit = node.dataset.edit;
      const blockIndex = Number(node.dataset.blockIndex);
      if (!edit || Number.isNaN(blockIndex)) return;
      const target = mapEditToTarget(edit, blockIndex);
      if (!target) return;
      const rect = node.getBoundingClientRect();
      const top = rect.top - containerRect.top;
      const left = rect.left - containerRect.left;
      if (rect.width === 0 || rect.height === 0) return;
      next.push({
        id: `${edit}-${blockIndex}-${idx}`,
        target,
        label: EDIT_LABELS[edit] ?? "Edit",
        rect: {
          top,
          left,
          width: rect.width,
          height: rect.height,
        },
      });
    });
    setOverlays(next);
  }, [content.blocks, globals]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => updateOverlays());
    return () => cancelAnimationFrame(frame);
  }, [updateOverlays, content, globals]);

  useEffect(() => {
    const handle = () => updateOverlays();
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, true);
    const container = containerRef.current;
    const scrollParent = container?.closest("[data-inline-scroll]");
    scrollParent?.addEventListener("scroll", handle);
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
      scrollParent?.removeEventListener("scroll", handle);
    };
  }, [updateOverlays]);

  useEffect(() => {
    if (!activeEdit || activeEdit.kind !== "text") {
      if (editableNodeRef.current) {
        editableNodeRef.current.removeAttribute("contenteditable");
        editableNodeRef.current = null;
      }
      return;
    }
    const container = containerRef.current;
    if (!container) return;
    const node = container.querySelector<HTMLElement>(
      `[data-edit=\"${activeEdit.scope}\"][data-block-index=\"${activeEdit.blockIndex}\"]`
    );
    const access = getTextAccess(activeEdit);
    if (!node || !access) return;
    editableNodeRef.current = node;
    node.setAttribute("contenteditable", "true");
    node.setAttribute("spellcheck", "false");
    if (access.rich && access.html) {
      node.innerHTML = access.html;
    } else {
      node.textContent = access.text;
    }
    const handleInput = () => {
      if (!editableNodeRef.current) return;
      pendingTextRef.current = {
        html: editableNodeRef.current.innerHTML,
        text: editableNodeRef.current.textContent ?? "",
      };
    };
    const handleSelectionUpdate = () => {
      if (typeof document === "undefined") return;
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      if (!node.contains(range.commonAncestorContainer)) return;
      selectionRef.current = range.cloneRange();
    };
    const handleBlur = () => {
      if (toolbarInteractingRef.current) {
        requestAnimationFrame(() => {
          editableNodeRef.current?.focus();
        });
        return;
      }
      const pending = pendingTextRef.current;
      if (pending) {
        if (access.rich) {
          access.setHtml(sanitizeRichHtml(pending.html));
        } else {
          access.setText(pending.text);
        }
      }
      pendingTextRef.current = null;
      setToolbarVisible(false);
    };
    node.addEventListener("input", handleInput);
    node.addEventListener("keyup", handleSelectionUpdate);
    node.addEventListener("mouseup", handleSelectionUpdate);
    node.addEventListener("blur", handleBlur);
    node.focus();
    return () => {
      node.removeEventListener("input", handleInput);
      node.removeEventListener("keyup", handleSelectionUpdate);
      node.removeEventListener("mouseup", handleSelectionUpdate);
      node.removeEventListener("blur", handleBlur);
      node.removeAttribute("contenteditable");
      if (editableNodeRef.current === node) {
        editableNodeRef.current = null;
      }
    };
  }, [activeEdit, getTextAccess]);

  useEffect(() => {
    const handleSelection = () => {
      const node = editableNodeRef.current;
      const clearSelection = () => {
        setToolbarVisible(false);
        window.dispatchEvent(
          new CustomEvent("admin-richtext-selection", { detail: { active: false } })
        );
      };
      if (!node) {
        clearSelection();
        return;
      }
      const access = activeEdit ? getTextAccess(activeEdit) : null;
      if (!access || !access.rich) {
        clearSelection();
        return;
      }
      const selection = window.getSelection();
      const activeEl = document.activeElement;
      if (toolbarRef.current && activeEl && toolbarRef.current.contains(activeEl)) {
        return;
      }
      if (!selection || selection.rangeCount === 0) {
        clearSelection();
        return;
      }
      const range = selection.getRangeAt(0);
      if (!node.contains(range.commonAncestorContainer)) {
        clearSelection();
        return;
      }
      selectionRef.current = range.cloneRange();
      const colorNode =
        range.commonAncestorContainer.nodeType === Node.TEXT_NODE
          ? range.commonAncestorContainer.parentElement
          : (range.commonAncestorContainer as HTMLElement);
      if (colorNode) {
        const computed = window.getComputedStyle(colorNode).color;
        const hex = rgbToHex(computed);
        if (hex) setToolbarColor(hex);
        window.dispatchEvent(
          new CustomEvent("admin-richtext-selection", {
            detail: { active: true, color: hex ?? null },
          })
        );
      }
      const rect = range.getBoundingClientRect();
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      setToolbarPos({
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top - 48,
      });
      setToolbarVisible(true);
    };
    document.addEventListener("selectionchange", handleSelection);
    return () => {
      document.removeEventListener("selectionchange", handleSelection);
    };
  }, []);

  useEffect(() => {
    const handleCommand = (event: Event) => {
      if (!activeEdit) return;
      const access = getTextAccess(activeEdit);
      if (!access || !access.rich) return;
      const detail = (event as CustomEvent<{ command: string; value?: string }>).detail;
      if (!detail?.command) return;
      exec(detail.command, detail.value);
    };
    window.addEventListener("admin-richtext-command", handleCommand as EventListener);
    return () => {
      window.removeEventListener("admin-richtext-command", handleCommand as EventListener);
    };
  }, [activeEdit, exec, getTextAccess]);

  const overlayNodes = showChips
    ? overlays.map((overlay) => {
        const active = activeEdit ? isSameTarget(activeEdit, overlay.target) : false;
        const hovered = hoverId === overlay.id;
        const allowInteract =
          !(active && overlay.target.kind === "text") &&
          overlay.target.scope !== "brandBgVideo" &&
          overlay.target.scope !== "brandAnimation";
        const highlightClass = `${overlayBoxBase} ${
          active || hovered ? "border-amber-300" : "border-transparent"
        }`;
        const offset = chipOffsets[overlay.id] ?? { x: 0, y: 0 };
        return (
          <div key={overlay.id}>
            <button
              type="button"
              className={`${highlightClass} absolute`}
              style={{
                top: overlay.rect.top,
                left: overlay.rect.left,
                width: overlay.rect.width,
                height: overlay.rect.height,
                touchAction: "none",
                pointerEvents: allowInteract ? "auto" : "none",
              }}
              onPointerEnter={() => setHoverId(overlay.id)}
              onPointerLeave={() => setHoverId((prev) => (prev === overlay.id ? null : prev))}
              onClick={() => onSelectEdit(overlay.target)}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (overlay.target.kind === "logo") {
                  const pos = getLogoPosition(overlay.target);
                  if (!pos) return;
                  beginDrag(
                    event,
                    overlay.target.scope,
                    overlay.target.blockIndex,
                    pos.x,
                    pos.y
                  );
                }
                if (overlay.target.kind === "text") {
                  const position = getTextPosition(overlay.target);
                  if (!position) return;
                  dragRef.current = {
                    kind: "text",
                    scope: overlay.target.scope,
                    blockIndex: overlay.target.blockIndex ?? 0,
                    startX: event.clientX,
                    startY: event.clientY,
                    startValueX: position.x,
                    startValue: position.y,
                  };
                }
              }}
            >
              <span className="sr-only">{overlay.label}</span>
            </button>
            {overlay.target.kind === "text" &&
            overlay.target.scope === "brandMessage" ? (
              <>
                <button
                  type="button"
                  className="absolute z-10 h-8 w-2 cursor-ew-resize rounded-full bg-amber-300/80"
                  style={{
                    top: overlay.rect.top + overlay.rect.height / 2 - 16,
                    left: overlay.rect.left - 6,
                  }}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    resizeRef.current = {
                      blockIndex: overlay.target.blockIndex ?? 0,
                      startX: event.clientX,
                      startY: event.clientY,
                      startWidth: overlay.rect.width,
                      startHeight: overlay.rect.height,
                      mode: "width",
                    };
                  }}
                >
                  <span className="sr-only">Resize width</span>
                </button>
                <button
                  type="button"
                  className="absolute z-10 h-2 w-8 cursor-ns-resize rounded-full bg-amber-300/80"
                  style={{
                    top: overlay.rect.top + overlay.rect.height - 6,
                    left: overlay.rect.left + overlay.rect.width / 2 - 16,
                  }}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    resizeRef.current = {
                      blockIndex: overlay.target.blockIndex ?? 0,
                      startX: event.clientX,
                      startY: event.clientY,
                      startWidth: overlay.rect.width,
                      startHeight: overlay.rect.height,
                      mode: "height",
                    };
                  }}
                >
                  <span className="sr-only">Resize height</span>
                </button>
              </>
            ) : null}
            <div
              className="absolute"
              style={{
                top: overlay.rect.top - 34 + offset.y,
                left: overlay.rect.left + overlay.rect.width / 2 + offset.x,
                transform: "translateX(-50%)",
              }}
            >
              <button
                type="button"
                className={`${chipBase} ${active ? chipActive : ""}`}
                onPointerEnter={() => setHoverId(overlay.id)}
                onPointerLeave={() =>
                  setHoverId((prev) => (prev === overlay.id ? null : prev))
                }
                onClick={() => onSelectEdit(overlay.target)}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  const current = chipOffsets[overlay.id] ?? { x: 0, y: 0 };
                  chipDragRef.current = {
                    id: overlay.id,
                    startX: event.clientX,
                    startY: event.clientY,
                    baseX: current.x,
                    baseY: current.y,
                  };
                }}
              >
                {overlay.label}
              </button>
            </div>
          </div>
        );
      })
    : null;

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ fontFamily: fontFamilyForKey(globals.bodyFont) }}
    >
      <BlockRenderer blocks={content.blocks} globals={globals} />
      <div className="pointer-events-none absolute inset-0 z-40">
        {toolbarVisible && toolbarPos ? (
          <div
            ref={toolbarRef}
            className="pointer-events-auto absolute flex flex-wrap items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600 shadow-lg"
            style={{
              top: Math.max(8, toolbarPos.y),
              left: Math.max(8, toolbarPos.x),
            }}
            onMouseDown={(event) => {
              toolbarInteractingRef.current = true;
              const target = event.target as HTMLElement | null;
              if (target?.tagName !== "SELECT" && target?.tagName !== "INPUT") {
                event.preventDefault();
              }
            }}
            onMouseUp={() => {
              toolbarInteractingRef.current = false;
            }}
          >
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => exec("bold")}
            >
              Bold
            </button>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => exec("italic")}
            >
              Italic
            </button>
            <div className="max-h-[320px] w-80 overflow-y-auto rounded-lg border border-stone-200 bg-white p-2 shadow-lg">
              <select
                className="mb-2 w-full rounded-md border border-stone-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600"
                onChange={(event) => {
                  const next = fontOptions.find((opt) => opt.value === event.target.value);
                  if (!next) return;
                  exec("fontName", fontFamilyForKey(next.value));
                }}
                defaultValue=""
                onMouseDown={(event) => event.stopPropagation()}
              >
                <option value="">Font</option>
                {fontOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ColorPalette
                value={toolbarColor}
                onChange={(next) => exec("foreColor", next)}
                label="Highlight color"
              />
            </div>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                const url = window.prompt("Link URL");
                if (!url) return;
                exec("createLink", url);
                exec("underline");
                exec("foreColor", "#2563eb");
              }}
            >
              Link
            </button>
          </div>
        ) : null}
        <div
          className="pointer-events-auto"
          style={{ pointerEvents: activeEdit?.kind === "text" ? "none" : "auto" }}
        >
          {overlayNodes}
        </div>
      </div>
    </div>
  );
}
