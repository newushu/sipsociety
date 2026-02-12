"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { defaultMenuContent } from "@/lib/content/defaults";
import { fontFamilyForKey, fontOptions } from "@/lib/content/fonts";
import { normalizeMenuBlock } from "@/lib/content/menu";
import { GlobalSettings, MenuBlock, PageContent, TextStyle } from "@/lib/content/types";
import ColorPicker from "@/components/admin/ColorPicker";

type Props = {
  content: PageContent;
  globals: GlobalSettings;
  onChangeContent: (content: PageContent) => void;
};

type FieldKey = `${string}::${string}::${"name" | "detail" | "price"}`;

const fieldKey = (sectionId: string, itemId: string, field: "name" | "detail" | "price") =>
  `${sectionId}::${itemId}::${field}` as const;

const parseFieldKey = (key: FieldKey) => {
  const [sectionId, itemId, field] = key.split("::") as [
    string,
    string,
    "name" | "detail" | "price"
  ];
  return { sectionId, itemId, field };
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function MenuInlinePreview({ content, globals: _globals, onChangeContent }: Props) {
  const menuBlockIndex = content.blocks.findIndex((block) => block.type === "menu");
  const baseBlock =
    (menuBlockIndex >= 0 ? (content.blocks[menuBlockIndex] as MenuBlock) : null) ??
    (defaultMenuContent.blocks[0] as MenuBlock);
  const normalized = useMemo(() => normalizeMenuBlock(baseBlock), [baseBlock]);
  const menuBlock = normalized.block;

  useEffect(() => {
    if (menuBlockIndex < 0) {
      onChangeContent({ ...content, blocks: [menuBlock, ...content.blocks] });
      return;
    }
    if (!normalized.changed) return;
    onChangeContent({
      ...content,
      blocks: content.blocks.map((block, index) =>
        index === menuBlockIndex ? menuBlock : block
      ),
    });
  }, [content, menuBlock, menuBlockIndex, normalized.changed, onChangeContent]);

  const [multiSelect, setMultiSelect] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [styleTarget, setStyleTarget] = useState<
    | "heading"
    | "subheading"
    | "note"
    | "sectionTitle"
    | "itemName"
    | "itemDetail"
    | "itemPrice"
  >("heading");
  const [selected, setSelected] = useState<FieldKey[]>([]);
  const [markerX, setMarkerX] = useState(220);
  const [markerY, setMarkerY] = useState(40);
  const [markerDrag, setMarkerDrag] = useState<"x" | "y" | null>(null);
  const [markerSectionId, setMarkerSectionId] = useState<string | null>(null);
  const [lastMarkerSectionId, setLastMarkerSectionId] = useState<string | null>(null);
  const [markerHits, setMarkerHits] = useState<{
    x: Record<FieldKey, "left" | "right">;
    y: Record<FieldKey, "top" | "bottom">;
  }>({ x: {}, y: {} });
  const [pageGuide, setPageGuide] = useState<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });
  const [dragGuide, setDragGuide] = useState<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });

  const menuCanvasRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const fieldRefs = useRef<Record<FieldKey, HTMLDivElement | null>>({} as Record<
    FieldKey,
    HTMLDivElement | null
  >);

  useEffect(() => {
    if (!lastMarkerSectionId && menuBlock.data.sections[0]) {
      setLastMarkerSectionId(menuBlock.data.sections[0].id);
    }
  }, [lastMarkerSectionId, menuBlock.data.sections]);

  const updateMenuBlock = (nextBlock: MenuBlock) => {
    const nextContent =
      menuBlockIndex >= 0
        ? {
            ...content,
            blocks: content.blocks.map((block, index) =>
              index === menuBlockIndex ? nextBlock : block
            ),
          }
        : { ...content, blocks: [nextBlock, ...content.blocks] };
    onChangeContent(nextContent);
  };

  const updateItem = (
    sectionId: string,
    itemId: string,
    patch: Partial<{
      name: string;
      detail: string;
      price: string;
      showPrice: boolean;
      namePos: { x: number; y: number };
      detailPos: { x: number; y: number };
      pricePos: { x: number; y: number };
    }>
  ) => {
    updateMenuBlock({
      ...menuBlock,
      data: {
        ...menuBlock.data,
        sections: menuBlock.data.sections.map((section) =>
          section.id !== sectionId
            ? section
            : {
                ...section,
                items: section.items.map((item) =>
                  item.id !== itemId ? item : { ...item, ...patch }
                ),
              }
        ),
      },
    });
  };

  const toggleSelect = (key: FieldKey) => {
    if (!multiSelect) {
      setSelected([key]);
      return;
    }
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const SNAP_THRESHOLD = 6;
  const GRID_SIZE = 40;

  const handleDrag =
    (
      sectionId: string,
      itemId: string,
      field: "name" | "detail" | "price",
      startX: number,
      startY: number
    ) =>
    (event: PointerEvent) => {
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      const item = menuBlock.data.sections
        .find((section) => section.id === sectionId)
        ?.items.find((menuItem) => menuItem.id === itemId);
      if (!item) return;
      const key = fieldKey(sectionId, itemId, field);
      const el = fieldRefs.current[key];
      const container = sectionRefs.current[sectionId];
      const canvas = menuCanvasRef.current;
      const width = el?.getBoundingClientRect().width ?? 0;
      const height = el?.getBoundingClientRect().height ?? 0;
      const base =
        field === "name"
          ? item.namePos
          : field === "detail"
            ? item.detailPos
            : item.pricePos;
      let nextX = (base?.x ?? 0) + deltaX;
      let nextY = (base?.y ?? 0) + deltaY;

      let snapX: number | null = null;
      let snapY: number | null = null;
      if (width) {
        if (Math.abs(nextX - markerX) <= SNAP_THRESHOLD) {
          nextX = markerX;
          snapX = markerX;
        } else if (Math.abs(nextX + width - markerX) <= SNAP_THRESHOLD) {
          nextX = markerX - width;
          snapX = markerX;
        } else if (showGrid && container && canvas) {
          const containerRect = container.getBoundingClientRect();
          const canvasRect = canvas.getBoundingClientRect();
          const offsetLeft = containerRect.left - canvasRect.left;
          const leftGlobal = offsetLeft + nextX;
          const rightGlobal = leftGlobal + width;
          const nearestLeftGlobal = Math.round(leftGlobal / GRID_SIZE) * GRID_SIZE;
          const nearestRightGlobal = Math.round(rightGlobal / GRID_SIZE) * GRID_SIZE;
          if (Math.abs(leftGlobal - nearestLeftGlobal) <= SNAP_THRESHOLD) {
            nextX = nearestLeftGlobal - offsetLeft;
            snapX = nextX;
          } else if (Math.abs(rightGlobal - nearestRightGlobal) <= SNAP_THRESHOLD) {
            nextX = nearestRightGlobal - offsetLeft - width;
            snapX = nextX;
          }
        }
      }
      if (height) {
        if (Math.abs(nextY - markerY) <= SNAP_THRESHOLD) {
          nextY = markerY;
          snapY = markerY;
        } else if (Math.abs(nextY + height - markerY) <= SNAP_THRESHOLD) {
          nextY = markerY - height;
          snapY = markerY;
        }
      }

      setDragGuide({ x: snapX, y: snapY });
      const next = { x: nextX, y: nextY };
      if (field === "name") updateItem(sectionId, itemId, { namePos: next });
      if (field === "detail") updateItem(sectionId, itemId, { detailPos: next });
      if (field === "price") updateItem(sectionId, itemId, { pricePos: next });
    };

  const startDrag = (
    event: React.PointerEvent,
    sectionId: string,
    itemId: string,
    field: "name" | "detail" | "price"
  ) => {
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const move = handleDrag(sectionId, itemId, field, startX, startY);
    const handleMove = (moveEvent: PointerEvent) => move(moveEvent);
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      setDragGuide({ x: null, y: null });
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const startMarkerDrag = (
    event: React.PointerEvent,
    axis: "x" | "y",
    container: HTMLElement | null,
    sectionId: string
  ) => {
    if (!container) return;
    event.stopPropagation();
    const rect = container.getBoundingClientRect();
    setMarkerDrag(axis);
    setMarkerSectionId(sectionId);
    setLastMarkerSectionId(sectionId);
    if (axis === "x") {
      setPageGuide({ x: rect.left + markerX, y: pageGuide.y });
    } else {
      setPageGuide({ x: pageGuide.x, y: rect.top + markerY });
    }
    const handleMove = (moveEvent: PointerEvent) => {
      if (axis === "x") {
        const next = clamp(moveEvent.clientX - rect.left, 0, rect.width);
        setMarkerX(next);
        setPageGuide({ x: moveEvent.clientX, y: pageGuide.y });
        const hits: Record<FieldKey, "left" | "right"> = {};
        Object.entries(fieldRefs.current).forEach(([key, node]) => {
          if (!node) return;
          if (parseFieldKey(key as FieldKey).sectionId !== sectionId) return;
          const nodeRect = node.getBoundingClientRect();
          const left = nodeRect.left - rect.left;
          const right = nodeRect.right - rect.left;
          if (Math.abs(left - next) <= SNAP_THRESHOLD) hits[key as FieldKey] = "left";
          else if (Math.abs(right - next) <= SNAP_THRESHOLD)
            hits[key as FieldKey] = "right";
        });
        setMarkerHits((prev) => ({ ...prev, x: hits }));
      } else {
        const next = clamp(moveEvent.clientY - rect.top, 0, rect.height);
        setMarkerY(next);
        setPageGuide({ x: pageGuide.x, y: moveEvent.clientY });
        const hits: Record<FieldKey, "top" | "bottom"> = {};
        Object.entries(fieldRefs.current).forEach(([key, node]) => {
          if (!node) return;
          if (parseFieldKey(key as FieldKey).sectionId !== sectionId) return;
          const nodeRect = node.getBoundingClientRect();
          const top = nodeRect.top - rect.top;
          const bottom = nodeRect.bottom - rect.top;
          if (Math.abs(top - next) <= SNAP_THRESHOLD) hits[key as FieldKey] = "top";
          else if (Math.abs(bottom - next) <= SNAP_THRESHOLD)
            hits[key as FieldKey] = "bottom";
        });
        setMarkerHits((prev) => ({ ...prev, y: hits }));
      }
    };
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      setMarkerDrag(null);
      setMarkerSectionId(null);
      setMarkerHits({ x: {}, y: {} });
      setPageGuide({ x: null, y: null });
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const styleFrom = (style?: TextStyle) =>
    style
      ? {
          fontSize: `${style.size}px`,
          fontWeight: style.weight,
          fontStyle: style.italic ? "italic" : "normal",
          transform: `translate(${style.x ?? 0}px, ${style.y ?? 0}px)`,
          fontFamily: fontFamilyForKey(style.font),
          color: style.color,
        }
      : undefined;

  const resolveStyle = (style?: TextStyle): TextStyle => ({
    size: style?.size ?? 16,
    weight: style?.weight ?? 500,
    italic: style?.italic ?? false,
    x: style?.x ?? 0,
    y: style?.y ?? 0,
    font: style?.font,
    color: style?.color,
  });

  const currentStyle = resolveStyle(
    styleTarget === "heading"
      ? menuBlock.data.headingStyle
      : styleTarget === "subheading"
        ? menuBlock.data.subheadingStyle
        : styleTarget === "note"
          ? menuBlock.data.noteStyle
          : styleTarget === "sectionTitle"
            ? menuBlock.data.sectionTitleStyle
            : styleTarget === "itemName"
              ? menuBlock.data.itemNameStyle
              : styleTarget === "itemDetail"
                ? menuBlock.data.itemDetailStyle
                : menuBlock.data.itemPriceStyle
  );

  const updateStyle = (next: TextStyle) => {
    updateMenuBlock({
      ...menuBlock,
      data: {
        ...menuBlock.data,
        headingStyle: styleTarget === "heading" ? next : menuBlock.data.headingStyle,
        subheadingStyle:
          styleTarget === "subheading" ? next : menuBlock.data.subheadingStyle,
        noteStyle: styleTarget === "note" ? next : menuBlock.data.noteStyle,
        sectionTitleStyle:
          styleTarget === "sectionTitle" ? next : menuBlock.data.sectionTitleStyle,
        itemNameStyle:
          styleTarget === "itemName" ? next : menuBlock.data.itemNameStyle,
        itemDetailStyle:
          styleTarget === "itemDetail" ? next : menuBlock.data.itemDetailStyle,
        itemPriceStyle:
          styleTarget === "itemPrice" ? next : menuBlock.data.itemPriceStyle,
      },
    });
  };

  const [fallbackGuide, setFallbackGuide] = useState<{ x: number | null; y: number | null }>(
    { x: null, y: null }
  );

  useEffect(() => {
    if (!markerDrag || !lastMarkerSectionId) {
      setFallbackGuide({ x: null, y: null });
      return;
    }
    const sectionEl = sectionRefs.current[lastMarkerSectionId];
    if (!sectionEl) {
      setFallbackGuide({ x: null, y: null });
      return;
    }
    const rect = sectionEl.getBoundingClientRect();
    setFallbackGuide({
      x: rect.left + markerX,
      y: rect.top + markerY,
    });
  }, [markerDrag, lastMarkerSectionId, markerX, markerY]);

  const guideX = pageGuide.x ?? fallbackGuide.x;
  const guideY = pageGuide.y ?? fallbackGuide.y;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      {markerDrag === "x" && guideX !== null ? (
        <div
          className="pointer-events-none fixed left-0 top-0 z-[9999] h-screen w-[2px] bg-amber-500"
          style={{ transform: `translateX(${guideX}px)` }}
        />
      ) : null}
      {markerDrag === "y" && guideY !== null ? (
        <div
          className="pointer-events-none fixed left-0 top-0 z-[9999] h-[2px] w-screen bg-amber-500"
          style={{ transform: `translateY(${guideY}px)` }}
        />
      ) : null}
      <div className="rounded-[36px] border border-stone-200 bg-white/90 p-6 shadow-xl shadow-amber-900/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-amber-500/80">
              Sip Society Menu
            </p>
            <h1
              className="mt-4 text-4xl font-semibold text-stone-900 sm:text-5xl"
              style={styleFrom(menuBlock.data.headingStyle)}
              contentEditable
              suppressContentEditableWarning
              onBlur={(event) =>
                updateMenuBlock({
                  ...menuBlock,
                  data: { ...menuBlock.data, heading: event.currentTarget.textContent ?? "" },
                })
              }
            >
              {menuBlock.data.heading}
            </h1>
            <p
              className="mt-3 max-w-2xl text-sm text-stone-600"
              style={styleFrom(menuBlock.data.subheadingStyle)}
              contentEditable
              suppressContentEditableWarning
              onBlur={(event) =>
                updateMenuBlock({
                  ...menuBlock,
                  data: {
                    ...menuBlock.data,
                    subheading: event.currentTarget.textContent ?? "",
                  },
                })
              }
            >
              {menuBlock.data.subheading}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600 shadow-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={menuBlock.data.showPrices !== false}
                onChange={(event) =>
                  updateMenuBlock({
                    ...menuBlock,
                    data: { ...menuBlock.data, showPrices: event.target.checked },
                  })
                }
              />
              Show prices
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showRulers}
                onChange={(event) => setShowRulers(event.target.checked)}
              />
              Show rulers
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(event) => setShowGrid(event.target.checked)}
              />
              Show grid
            </label>
            <button
              className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em] ${
                multiSelect
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-stone-200 text-stone-600"
              }`}
              onClick={() => {
                setMultiSelect((prev) => !prev);
                setSelected([]);
              }}
              type="button"
            >
              Multi select
            </button>
          </div>
        </div>
        {menuBlock.data.note ? (
          <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-5 py-4 text-sm text-stone-600">
            <span
              style={styleFrom(menuBlock.data.noteStyle)}
              contentEditable
              suppressContentEditableWarning
              onBlur={(event) =>
                updateMenuBlock({
                  ...menuBlock,
                  data: { ...menuBlock.data, note: event.currentTarget.textContent ?? "" },
                })
              }
            >
              {menuBlock.data.note}
            </span>
          </div>
        ) : null}

        <div ref={menuCanvasRef} className="relative mt-10 grid gap-8 lg:grid-cols-2">
          {showGrid ? (
            <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,rgba(245,158,11,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(245,158,11,0.2)_1px,transparent_1px)] [background-size:40px_40px]" />
          ) : null}
          {menuBlock.data.sections.map((section) => {
            const coords = section.items.flatMap((item) => [
              item.namePos?.y ?? 0,
              item.detailPos?.y ?? 0,
              item.pricePos?.y ?? 0,
            ]);
            const maxY = coords.length ? Math.max(...coords) : 0;
            const minHeight = Math.max(240, maxY + 96);
            return (
              <section
                key={section.id}
                className="relative z-10 rounded-3xl border border-stone-200 bg-stone-50/80 p-6"
                style={{ minHeight }}
                ref={(el: HTMLElement | null) => {
                  sectionRefs.current[section.id] = el;
                }}
              >
                <h2
                  className="text-lg font-semibold text-stone-800"
                  style={styleFrom(menuBlock.data.sectionTitleStyle)}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(event) =>
                    updateMenuBlock({
                      ...menuBlock,
                      data: {
                        ...menuBlock.data,
                        sections: menuBlock.data.sections.map((item) =>
                          item.id === section.id
                            ? { ...item, title: event.currentTarget.textContent ?? "" }
                            : item
                        ),
                      },
                    })
                  }
                >
                  {section.title}
                </h2>
                <div className="relative mt-4">
                  {showRulers ? (
                    <>
                      <div
                        className={`pointer-events-none absolute left-0 top-0 h-full w-[3px] ${
                          markerDrag === "x" ? "bg-amber-500" : "bg-amber-400/80"
                        }`}
                        style={{ transform: `translateX(${markerX}px)` }}
                      />
                      <div
                        className={`pointer-events-none absolute left-0 top-0 h-[3px] w-full ${
                          markerDrag === "y" ? "bg-amber-500" : "bg-amber-400/80"
                        }`}
                        style={{ transform: `translateY(${markerY}px)` }}
                      />
                    </>
                  ) : null}
                  <button
                    className="absolute -top-4 z-10 flex h-7 w-7 -translate-x-1/2 cursor-ew-resize items-center justify-center rounded-full border border-amber-500 bg-white text-[10px] font-semibold text-amber-600 shadow"
                    style={{ left: markerX }}
                    onPointerDown={(event) =>
                      startMarkerDrag(
                        event,
                        "x",
                        sectionRefs.current[section.id],
                        section.id
                      )
                    }
                    type="button"
                  >
                    X
                  </button>
                  <button
                    className="absolute -left-6 z-10 flex h-7 w-7 -translate-y-1/2 cursor-ns-resize items-center justify-center rounded-full border border-amber-500 bg-white text-[10px] font-semibold text-amber-600 shadow"
                    style={{ top: markerY }}
                    onPointerDown={(event) =>
                      startMarkerDrag(
                        event,
                        "y",
                        sectionRefs.current[section.id],
                        section.id
                      )
                    }
                    type="button"
                  >
                    Y
                  </button>
                  <button
                    className="absolute -right-6 z-10 flex h-7 w-7 -translate-y-1/2 cursor-ns-resize items-center justify-center rounded-full border border-amber-500 bg-white text-[10px] font-semibold text-amber-600 shadow"
                    style={{ top: markerY }}
                    onPointerDown={(event) =>
                      startMarkerDrag(
                        event,
                        "y",
                        sectionRefs.current[section.id],
                        section.id
                      )
                    }
                    type="button"
                  >
                    Y
                  </button>
                  {dragGuide.x !== null ? (
                    <div
                      className="pointer-events-none absolute left-0 top-0 h-full w-[2px] bg-amber-600"
                      style={{ transform: `translateX(${dragGuide.x}px)` }}
                    />
                  ) : null}
                  {dragGuide.y !== null ? (
                    <div
                      className="pointer-events-none absolute left-0 top-0 h-[2px] w-full bg-amber-600"
                      style={{ transform: `translateY(${dragGuide.y}px)` }}
                    />
                  ) : null}

                  {section.items.map((item) => (
                    <div key={item.id} className="relative">
                      {(["name", "detail", "price"] as const).map((field) => {
                        if (field === "price") {
                          if (menuBlock.data.showPrices === false || item.showPrice === false) {
                            return null;
                          }
                        }
                        const pos =
                          field === "name"
                            ? item.namePos
                            : field === "detail"
                              ? item.detailPos
                              : item.pricePos;
                        const key = fieldKey(section.id, item.id, field);
                        const selectedState = selected.includes(key);
                        const showHits = markerSectionId === section.id && markerDrag !== null;
                        const hitX = showHits ? markerHits.x[key] : undefined;
                        const hitY = showHits ? markerHits.y[key] : undefined;
                        return (
                          <div
                            key={key}
                            ref={(el) => {
                              fieldRefs.current[key] = el;
                            }}
                            className={`group absolute left-0 top-0 rounded px-1 ${
                              selectedState ? "ring-2 ring-amber-500" : ""
                            }`}
                            style={{
                              transform: `translate(${pos?.x ?? 0}px, ${pos?.y ?? 0}px)`,
                            }}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleSelect(key);
                            }}
                          >
                            {hitX ? (
                              <div
                                className="pointer-events-none absolute top-0 h-full w-[2px] bg-blue-500"
                                style={{ [hitX]: 0 }}
                              />
                            ) : null}
                            {hitY ? (
                              <div
                                className="pointer-events-none absolute left-0 h-[2px] w-full bg-blue-500"
                                style={{ [hitY]: 0 }}
                              />
                            ) : null}
                            <span
                            className={
                              field === "detail"
                                ? "text-xs text-stone-500"
                                : "text-sm font-semibold text-stone-900"
                            }
                            style={
                              field === "name"
                                ? styleFrom(menuBlock.data.itemNameStyle)
                                : field === "detail"
                                  ? styleFrom(menuBlock.data.itemDetailStyle)
                                  : styleFrom(menuBlock.data.itemPriceStyle)
                            }
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(event) => {
                                const next = event.currentTarget.textContent ?? "";
                                if (field === "name") updateItem(section.id, item.id, { name: next });
                                if (field === "detail")
                                  updateItem(section.id, item.id, { detail: next });
                                if (field === "price")
                                  updateItem(section.id, item.id, { price: next });
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  (event.currentTarget as HTMLSpanElement).blur();
                                }
                              }}
                            >
                              {field === "name"
                                ? item.name
                                : field === "detail"
                                  ? item.detail
                                  : item.price}
                            </span>
                            <button
                              className="absolute -right-2 -top-2 h-5 w-5 items-center justify-center rounded-full border border-stone-300 bg-white text-[10px] text-stone-600 shadow-sm opacity-0 transition group-hover:flex group-hover:opacity-100 hover:shadow"
                              type="button"
                              onPointerDown={(event) =>
                                startDrag(event, section.id, item.id, field)
                              }
                            >
                              ⠿
                            </button>
                            {field === "price" ? (
                              <button
                                className="absolute -left-2 -bottom-2 hidden rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[9px] uppercase text-stone-500 shadow group-hover:block"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  updateItem(section.id, item.id, {
                                    showPrice: !(item.showPrice ?? true),
                                  });
                                }}
                                type="button"
                              >
                                {item.showPrice === false ? "Show" : "Hide"}
                              </button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-10 grid gap-4 rounded-2xl border border-stone-200 bg-white p-4 text-xs text-stone-600 sm:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
              Text styles
            </p>
            <select
              className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs"
              value={styleTarget}
              onChange={(event) =>
                setStyleTarget(event.target.value as typeof styleTarget)
              }
            >
              <option value="heading">Heading</option>
              <option value="subheading">Subheading</option>
              <option value="note">Note</option>
              <option value="sectionTitle">Section title</option>
              <option value="itemName">Item name</option>
              <option value="itemDetail">Item detail</option>
              <option value="itemPrice">Item price</option>
            </select>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                Size ({currentStyle.size}px)
                <input
                  className="mt-2 h-2 w-full appearance-none rounded-full bg-stone-200 accent-amber-500"
                  type="range"
                  min={10}
                  max={48}
                  value={currentStyle.size}
                  onChange={(event) =>
                    updateStyle({ ...currentStyle, size: Number(event.target.value) })
                  }
                />
              </label>
              <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                Weight
                <select
                  className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs"
                  value={currentStyle.weight}
                  onChange={(event) =>
                    updateStyle({ ...currentStyle, weight: Number(event.target.value) })
                  }
                >
                  {[300, 400, 500, 600, 700].map((weight) => (
                    <option key={weight} value={weight}>
                      {weight}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                Font
                <select
                  className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs"
                  value={currentStyle.font ?? ""}
                  onChange={(event) =>
                    updateStyle({
                      ...currentStyle,
                      font: event.target.value
                        ? (event.target.value as TextStyle["font"])
                        : undefined,
                    })
                  }
                >
                  <option value="">Use global</option>
                  {fontOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <ColorPicker
                  label="Color"
                  value={currentStyle.color ?? "#1c1917"}
                  onChange={(next) => updateStyle({ ...currentStyle, color: next })}
                />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-stone-500">
            Select a text target and adjust font + color.
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
              Quick Menu View
            </p>
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-stone-500">
              <input
                type="checkbox"
                checked={menuBlock.data.showPrices !== false}
                onChange={(event) =>
                  updateMenuBlock({
                    ...menuBlock,
                    data: { ...menuBlock.data, showPrices: event.target.checked },
                  })
                }
              />
              Show prices
            </label>
          </div>
          <div className="mt-3 grid gap-3">
            {menuBlock.data.sections.map((section) => (
              <div key={section.id} className="rounded-xl border border-stone-200/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                  {section.title}
                </p>
                <div className="mt-3 grid gap-2">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid items-center gap-2 sm:grid-cols-[1.4fr_0.9fr_auto]"
                    >
                      <div className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-700">
                        {item.name}
                      </div>
                      <input
                        className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700"
                        value={item.price ?? ""}
                        onChange={(event) =>
                          updateItem(section.id, item.id, { price: event.target.value })
                        }
                        placeholder="Price"
                      />
                      <button
                        className="rounded-full border border-stone-200 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-stone-500"
                        onClick={() =>
                          updateItem(section.id, item.id, {
                            showPrice: !(item.showPrice ?? true),
                          })
                        }
                        type="button"
                      >
                        {item.showPrice === false ? "Show" : "Hide"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-stone-500">
            Prices update the display menu immediately. Item names are locked here.
          </p>
        </div>
      </div>
    </div>
  );
}
