"use client";

import { useMemo, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";
import { fontFamilyForKey } from "@/lib/content/fonts";
import { GalleryContent, TextStyle } from "@/lib/content/types";

type Props = {
  gallery: GalleryContent;
  initialLikes: Record<string, number>;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function GalleryClient({ gallery, initialLikes }: Props) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [likes, setLikes] = useState<Record<string, number>>(initialLikes);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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

  const items = gallery.rows.flatMap((row) => row.items);
  const displayItems = items.filter((item) => item.url);

  const openLightbox = (itemId: string) => {
    const index = displayItems.findIndex((item) => item.id === itemId);
    if (index >= 0) setActiveIndex(index);
  };

  const activeItem = activeIndex !== null ? displayItems[activeIndex] : null;

  const handleLike = async (itemId: string) => {
    setLikes((prev) => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }));
    const { error } = await supabase.from("gallery_likes").insert({ item_id: itemId });
    if (error) {
      setLikes((prev) => ({
        ...prev,
        [itemId]: Math.max(0, (prev[itemId] ?? 1) - 1),
      }));
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <div className="rounded-[36px] border border-stone-200 bg-white/90 p-10 shadow-xl shadow-amber-900/10">
        <h1
          className="text-4xl font-semibold text-stone-900 sm:text-5xl"
          style={styleFrom(gallery.headingStyle)}
        >
          {gallery.heading}
        </h1>
        <p
          className="mt-3 max-w-3xl text-sm text-stone-600"
          style={styleFrom(gallery.subheadingStyle)}
        >
          {gallery.subheading}
        </p>
        <div
          className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6"
          style={{ gap: `${gallery.tileGap ?? 16}px` }}
        >
          {items.map((item) => {
            const likeCount = likes[item.id] ?? 0;
            const favorite =
              likeCount >= (gallery.favoriteThreshold ?? 12) && item.url;
            return (
              <div
                key={item.id}
                className={`group relative aspect-square overflow-hidden rounded-2xl border ${
                  item.url
                    ? "border-stone-200 bg-stone-100 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
                    : "border-dashed border-stone-300 bg-stone-50"
                }`}
              >
                {item.url ? (
                  <>
                    <img
                      src={item.url}
                      alt={item.alt || "Gallery image"}
                      className="h-full w-full object-cover"
                      onClick={() => openLightbox(item.id)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
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
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <button
                        className="rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-semibold text-stone-800 shadow"
                        onClick={() => handleLike(item.id)}
                        type="button"
                      >
                        ❤ {likeCount}
                      </button>
                      {favorite ? (
                        <span
                          className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-800 shadow"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          Customer favorite
                        </span>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
                    Empty slot
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {activeItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="relative w-full max-w-4xl">
            <img
              src={activeItem.url}
              alt={activeItem.alt || "Gallery image"}
              className="h-auto w-full rounded-3xl object-contain"
            />
            <button
              className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-stone-800 shadow"
              onClick={() => setActiveIndex(null)}
              type="button"
            >
              Close
            </button>
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-stone-800 shadow"
              onClick={() =>
                setActiveIndex((prev) =>
                  prev === null
                    ? null
                    : (prev - 1 + displayItems.length) % displayItems.length
                )
              }
              type="button"
            >
              ←
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-stone-800 shadow"
              onClick={() =>
                setActiveIndex((prev) =>
                  prev === null ? null : (prev + 1) % displayItems.length
                )
              }
              type="button"
            >
              →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
