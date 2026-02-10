"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";
import { defaultGalleryContent } from "@/lib/content/defaults";
import ColorPicker from "@/components/admin/ColorPicker";
import { fontFamilyForKey, fontOptions } from "@/lib/content/fonts";
import { GalleryContent, GlobalSettings, PageContent, TextStyle } from "@/lib/content/types";

type Props = {
  content: PageContent;
  globals: GlobalSettings;
  onChangeContent: (content: PageContent) => void;
};

type GalleryTarget = {
  rowId: string;
  index: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const styleFrom = (style?: TextStyle) =>
  style
    ? {
        fontFamily: fontFamilyForKey(style.font),
        fontSize: style.size ? `${style.size}px` : undefined,
        fontWeight: style.weight,
        letterSpacing: style.tracking ? `${style.tracking}em` : undefined,
        textTransform: style.transform,
        color: style.color,
      }
    : undefined;

const ensureGallery = (gallery: GalleryContent) => {
  let changed = false;
  const rows = gallery.rows.map((row, rowIndex) => {
    const rowId = row.id || `gallery-row-${rowIndex + 1}`;
    if (rowId !== row.id) changed = true;
    const items = Array.from({ length: 6 }).map((_, index) => {
      const item = row.items[index] ?? { id: `${rowId}-${index + 1}` };
      const id = item.id || `${rowId}-${index + 1}`;
      if (id !== item.id) changed = true;
      if (!item.commentDisplay) changed = true;
      return {
        ...item,
        id,
        commentDisplay: item.commentDisplay ?? "hover",
      };
    });
    if (row.items.length !== 6) changed = true;
    return { ...row, id: rowId, items };
  });
  return {
    gallery: {
      ...gallery,
      rows,
      commentX: gallery.commentX ?? 8,
      commentY: gallery.commentY ?? 82,
      commentSize: gallery.commentSize ?? 12,
      commentColor: gallery.commentColor ?? "#ffffff",
      commentOpacity: gallery.commentOpacity ?? 0.9,
      tileGap: gallery.tileGap ?? 16,
      favoriteThreshold: gallery.favoriteThreshold ?? 12,
    },
    changed,
  };
};

export default function GalleryInlinePreview({
  content,
  globals: _globals,
  onChangeContent,
}: Props) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [active, setActive] = useState<GalleryTarget | null>(null);
  const [dragging, setDragging] = useState<GalleryTarget | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryItems, setLibraryItems] = useState<{ name: string; url: string }[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const fallback = defaultGalleryContent.gallery!;
  const normalized = useMemo(
    () => ensureGallery(content.gallery ?? fallback),
    [content.gallery, fallback]
  );
  const gallery = normalized.gallery;

  useEffect(() => {
    if (!normalized.changed && content.gallery) return;
    onChangeContent({ ...content, gallery });
  }, [content, gallery, normalized.changed, onChangeContent]);

  const updateGallery = (patch: Partial<GalleryContent>) =>
    onChangeContent({ ...content, gallery: { ...gallery, ...patch } });

  const updateItem = (rowId: string, index: number, patch: any) => {
    updateGallery({
      rows: gallery.rows.map((row) =>
        row.id !== rowId
          ? row
          : {
              ...row,
              items: row.items.map((item, itemIndex) =>
                itemIndex !== index ? item : { ...item, ...patch }
              ),
            }
      ),
    });
  };

  const handleDrop = (targetRowId: string, targetIndex: number) => {
    if (!dragging) return;
    const sourceRow = gallery.rows.find((row) => row.id === dragging.rowId);
    const targetRow = gallery.rows.find((row) => row.id === targetRowId);
    if (!sourceRow || !targetRow) return;
    const sourceItem = sourceRow.items[dragging.index];
    const targetItem = targetRow.items[targetIndex];
    updateGallery({
      rows: gallery.rows.map((row) => {
        if (row.id === dragging.rowId) {
          const items = [...row.items];
          items[dragging.index] = targetItem;
          return { ...row, items };
        }
        if (row.id === targetRowId) {
          const items = [...row.items];
          items[targetIndex] = sourceItem;
          return { ...row, items };
        }
        return row;
      }),
    });
    setDragging(null);
  };

  const loadLibrary = async () => {
    setLoadingLibrary(true);
    const { data } = await supabase.storage.from("media").list("", {
      limit: 200,
      sortBy: { column: "updated_at", order: "desc" },
    });
    const items =
      data?.map((item) => ({
        name: item.name,
        url: supabase.storage.from("media").getPublicUrl(item.name).data.publicUrl,
      })) ?? [];
    setLibraryItems(items);
    setLoadingLibrary(false);
  };

  const handleUpload = async (file: File) => {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `gallery-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(fileName, file, {
      upsert: true,
    });
    if (error) return;
    const url = supabase.storage.from("media").getPublicUrl(fileName).data.publicUrl;
    if (active) {
      updateItem(active.rowId, active.index, { url, alt: "Gallery image" });
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <div className="rounded-[36px] border border-stone-200 bg-white/90 p-8 shadow-xl shadow-amber-900/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1
              className="text-4xl font-semibold text-stone-900 sm:text-5xl"
              contentEditable
              suppressContentEditableWarning
              onBlur={(event) =>
                updateGallery({ heading: event.currentTarget.textContent ?? "" })
              }
              onClick={(event) => event.stopPropagation()}
              style={styleFrom(gallery.headingStyle)}
            >
              {gallery.heading}
            </h1>
            <p
              className="mt-3 max-w-3xl text-sm text-stone-600"
              contentEditable
              suppressContentEditableWarning
              onBlur={(event) =>
                updateGallery({ subheading: event.currentTarget.textContent ?? "" })
              }
              onClick={(event) => event.stopPropagation()}
              style={styleFrom(gallery.subheadingStyle)}
            >
              {gallery.subheading}
            </p>
          </div>
          <button
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-stone-600 shadow"
            onClick={() =>
              updateGallery({
                rows: [
                  ...gallery.rows,
                  {
                    id: `gallery-row-${gallery.rows.length + 1}`,
                    items: Array.from({ length: 6 }).map((_, index) => ({
                      id: `gallery-${gallery.rows.length + 1}-${index + 1}`,
                      url: "",
                      alt: "",
                      comment: "",
                      commentDisplay: "hover",
                    })),
                  },
                ],
              })
            }
            type="button"
          >
            Add row
          </button>
        </div>

        <div
          className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6"
          style={{ gap: `${gallery.tileGap ?? 16}px` }}
        >
          {gallery.rows.map((row) =>
            row.items.map((item, index) => {
              const isActive = active?.rowId === row.id && active.index === index;
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDragging({ rowId: row.id, index })}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDrop(row.id, index)}
                  className={`group relative aspect-square overflow-hidden rounded-2xl border ${
                    item.url
                      ? "border-stone-200 bg-stone-100 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
                      : "border-dashed border-stone-300 bg-stone-50"
                  } ${isActive ? "ring-2 ring-amber-500" : ""}`}
                  onClick={() => setActive({ rowId: row.id, index })}
                >
                  {item.url ? (
                    <img
                      src={item.url}
                      alt={item.alt || "Gallery image"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
                      Empty slot
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                  {item.comment ? (
                    <div
                      className={`absolute z-10 max-w-[85%] rounded-full px-3 py-1 text-xs font-semibold text-white shadow ${
                        item.commentDisplay === "always"
                          ? "opacity-100"
                          : "opacity-0 transition group-hover:opacity-100"
                      }`}
                      style={{
                        left: `${clamp(gallery.commentX ?? 8, 0, 90)}%`,
                        top: `${clamp(gallery.commentY ?? 82, 0, 90)}%`,
                        fontSize: `${gallery.commentSize ?? 12}px`,
                        color: gallery.commentColor ?? "#ffffff",
                        opacity: gallery.commentOpacity ?? 0.9,
                        transform: "translate(-10%, -10%)",
                        fontFamily: fontFamilyForKey(gallery.commentFont),
                      }}
                    >
                      {item.comment}
                    </div>
                  ) : null}
                  <div className="absolute left-3 top-3 flex gap-2 opacity-0 transition group-hover:opacity-100">
                    <button
                      className="rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-semibold text-stone-800 shadow"
                      onClick={(event) => {
                        event.stopPropagation();
                        setActive({ rowId: row.id, index });
                        uploadInputRef.current?.click();
                      }}
                      type="button"
                    >
                      Upload
                    </button>
                    <button
                      className="rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-semibold text-stone-800 shadow"
                      onClick={(event) => {
                        event.stopPropagation();
                        setActive({ rowId: row.id, index });
                        setLibraryOpen(true);
                        loadLibrary();
                      }}
                      type="button"
                    >
                      Select
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 text-xs text-stone-600">
            <h3 className="text-sm font-semibold text-stone-800">Gallery text styling</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                Heading font
                <select
                  className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs"
                  value={gallery.headingStyle?.font ?? "sans"}
                  onChange={(event) =>
                    updateGallery({
                      headingStyle: {
                        ...(gallery.headingStyle ?? {}),
                        font: event.target.value as TextStyle["font"],
                      },
                    })
                  }
                >
                  {fontOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                Heading size
                <input
                  className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-xs"
                  type="number"
                  min={12}
                  max={96}
                  value={gallery.headingStyle?.size ?? 48}
                  onChange={(event) =>
                    updateGallery({
                      headingStyle: {
                        ...(gallery.headingStyle ?? {}),
                        size: Number(event.target.value),
                      },
                    })
                  }
                />
              </label>
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                  Heading color
                </label>
                <div className="mt-2">
                  <ColorPicker
                    value={gallery.headingStyle?.color ?? "#111827"}
                    onChange={(color) =>
                      updateGallery({
                        headingStyle: {
                          ...(gallery.headingStyle ?? {}),
                          color,
                        },
                      })
                    }
                  />
                </div>
              </div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                Subheading font
                <select
                  className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs"
                  value={gallery.subheadingStyle?.font ?? "sans"}
                  onChange={(event) =>
                    updateGallery({
                      subheadingStyle: {
                        ...(gallery.subheadingStyle ?? {}),
                        font: event.target.value as TextStyle["font"],
                      },
                    })
                  }
                >
                  {fontOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                Subheading size
                <input
                  className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-xs"
                  type="number"
                  min={8}
                  max={36}
                  value={gallery.subheadingStyle?.size ?? 14}
                  onChange={(event) =>
                    updateGallery({
                      subheadingStyle: {
                        ...(gallery.subheadingStyle ?? {}),
                        size: Number(event.target.value),
                      },
                    })
                  }
                />
              </label>
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                  Subheading color
                </label>
                <div className="mt-2">
                  <ColorPicker
                    value={gallery.subheadingStyle?.color ?? "#475569"}
                    onChange={(color) =>
                      updateGallery({
                        subheadingStyle: {
                          ...(gallery.subheadingStyle ?? {}),
                          color,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-4 text-xs text-stone-600">
            <h3 className="text-sm font-semibold text-stone-800">Comment styling</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                Comment X (%)
                <input
                  className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-xs"
                  type="number"
                  min={0}
                  max={100}
                  value={gallery.commentX ?? 8}
                  onChange={(event) =>
                    updateGallery({ commentX: Number(event.target.value) })
                  }
                />
              </label>
              <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                Comment Y (%)
                <input
                  className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-xs"
                  type="number"
                  min={0}
                  max={100}
                  value={gallery.commentY ?? 82}
                  onChange={(event) =>
                    updateGallery({ commentY: Number(event.target.value) })
                  }
                />
              </label>
              <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                Comment size
                <input
                  className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-xs"
                  type="number"
                  min={8}
                  max={32}
                  value={gallery.commentSize ?? 12}
                  onChange={(event) =>
                    updateGallery({ commentSize: Number(event.target.value) })
                  }
                />
              </label>
              <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                Comment color
                <div className="mt-2">
                  <ColorPicker
                    value={gallery.commentColor ?? "#ffffff"}
                    onChange={(color) => updateGallery({ commentColor: color })}
                  />
                </div>
              </label>
              <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                Comment font
                <select
                  className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs"
                  value={gallery.commentFont ?? "sans"}
                  onChange={(event) =>
                    updateGallery({ commentFont: event.target.value as GalleryContent["commentFont"] })
                  }
                >
                  {fontOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-4 text-xs text-stone-600">
            <h3 className="text-sm font-semibold text-stone-800">Selected tile</h3>
            {active ? (
              (() => {
                const row = gallery.rows.find((rowItem) => rowItem.id === active.rowId);
                const item = row?.items[active.index];
                if (!row || !item) return null;
                return (
                  <div className="mt-3 space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                      Comment (max 30)
                      <input
                        className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-xs"
                        maxLength={30}
                        value={item.comment ?? ""}
                        onChange={(event) =>
                          updateItem(active.rowId, active.index, {
                            comment: event.target.value.slice(0, 30),
                          })
                        }
                      />
                    </label>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                      Comment display
                      <select
                        className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs"
                        value={item.commentDisplay ?? "hover"}
                        onChange={(event) =>
                          updateItem(active.rowId, active.index, {
                            commentDisplay: event.target.value,
                          })
                        }
                      >
                        <option value="hover">Show on hover</option>
                        <option value="always">Always show</option>
                      </select>
                    </label>
                    <div className="flex gap-2">
                      <button
                        className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600"
                        onClick={() => uploadInputRef.current?.click()}
                        type="button"
                      >
                        Upload image
                      </button>
                      <button
                        className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600"
                        onClick={() => {
                          setLibraryOpen(true);
                          loadLibrary();
                        }}
                        type="button"
                      >
                        Select image
                      </button>
                    </div>
                    <button
                      className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600"
                      onClick={() =>
                        updateItem(active.rowId, active.index, { url: "", alt: "" })
                      }
                      type="button"
                    >
                      Clear image
                    </button>
                  </div>
                );
              })()
            ) : (
              <p className="mt-3 text-xs text-stone-400">Select a tile to edit.</p>
            )}
          </div>
        </div>
      </div>

      <input
        ref={uploadInputRef}
        className="hidden"
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleUpload(file);
          event.currentTarget.value = "";
        }}
      />

      {libraryOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-800">Media library</h3>
              <button
                className="rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold"
                onClick={() => setLibraryOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>
            {loadingLibrary ? (
              <p className="mt-6 text-sm text-stone-500">Loading assets...</p>
            ) : (
              <div className="mt-6 grid max-h-[60vh] grid-cols-2 gap-4 overflow-y-auto md:grid-cols-3">
                {libraryItems.map((item) => (
                  <button
                    key={item.name}
                    className="group relative overflow-hidden rounded-2xl border border-stone-200"
                    onClick={() => {
                      if (active) {
                        updateItem(active.rowId, active.index, {
                          url: item.url,
                          alt: "Gallery image",
                        });
                      }
                      setLibraryOpen(false);
                    }}
                    type="button"
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="h-40 w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 transition group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
