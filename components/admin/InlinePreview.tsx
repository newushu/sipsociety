"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ContentBlock, GlobalSettings, PageContent, TextStyle } from "@/lib/content/types";
import { fontFamilyForKey } from "@/lib/content/fonts";
import { InlineEditTarget } from "@/components/admin/inlineEditTypes";
import BlockRenderer from "@/components/blocks/BlockRenderer";

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

const mapEditToTarget = (
  edit: string,
  blockIndex: number
): InlineEditTarget | null => {
  switch (edit) {
    case "heroVideo":
      return { kind: "media", scope: "heroVideo", blockIndex };
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

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
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

  const overlayNodes = showChips
    ? overlays.map((overlay) => {
        const active = activeEdit ? isSameTarget(activeEdit, overlay.target) : false;
        const hovered = hoverId === overlay.id;
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
        <div className="pointer-events-auto">{overlayNodes}</div>
      </div>
    </div>
  );
}
