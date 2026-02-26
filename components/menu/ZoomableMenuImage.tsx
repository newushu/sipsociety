"use client";

import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  heightPx?: number;
  widthPx?: number;
};

export default function ZoomableMenuImage({
  src,
  alt,
  heightPx = 430,
  widthPx,
}: Props) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState<1 | 2>(2);

  return (
    <>
      <button
        type="button"
        className="group relative block w-full overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-sm"
        style={{ width: widthPx ? `${widthPx}px` : "100%" }}
        onClick={() => {
          setZoom(2);
          setOpen(true);
        }}
      >
        <img
          src={src}
          alt={alt}
          className="h-auto w-full select-none"
          draggable={false}
        />
      </button>
      {open ? (
        <div className="fixed inset-0 z-[260] bg-black/80 p-4 sm:p-8" onClick={() => setOpen(false)}>
          <div
            className="mx-auto flex h-full w-full max-w-7xl flex-col rounded-2xl bg-stone-950/70 p-3 sm:p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-end gap-2">
              <button
                className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white"
                type="button"
                onClick={() => setZoom((prev) => (prev === 1 ? 2 : 1))}
              >
                {zoom === 2 ? "1x" : "2x"}
              </button>
              <button
                className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white"
                type="button"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto rounded-xl bg-stone-900/40 p-2 sm:p-4">
              <img
                src={src}
                alt={alt}
                className="mx-auto block w-full max-w-none select-none rounded-lg"
                draggable={false}
                style={{
                  maxHeight: `${heightPx * 2.1}px`,
                  transform: `scale(${zoom})`,
                  transformOrigin: "top center",
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
