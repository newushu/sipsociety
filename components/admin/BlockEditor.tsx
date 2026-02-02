"use client";

import { ContentBlock, MediaAsset } from "@/lib/content/types";

const inputClass =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm";

const labelClass = "text-xs font-semibold uppercase tracking-[0.2em] text-stone-500";

const buttonClass =
  "rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-600 hover:border-stone-400 hover:text-stone-900";

const rangeClass =
  "h-2 w-full appearance-none rounded-full bg-stone-200 accent-amber-500";

type Props = {
  block: ContentBlock;
  index: number;
  onChange: (block: ContentBlock) => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
};

const updateMedia = (media: MediaAsset, patch: Partial<MediaAsset>) => ({
  ...media,
  ...patch,
});

export default function BlockEditor({ block, index, onChange, onRemove, onMove }: Props) {
  const setData = (data: ContentBlock["data"]) => {
    onChange({ ...block, data } as ContentBlock);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-stone-200 bg-white/80 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-stone-900">
          {index + 1}. {block.type.toUpperCase()}
        </p>
        <div className="flex gap-2">
          <button className={buttonClass} onClick={() => onMove("up")}>
            Move up
          </button>
          <button className={buttonClass} onClick={() => onMove("down")}>
            Move down
          </button>
          <button className={buttonClass} onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>

      {block.type === "hero" && (
        <div className="grid gap-4">
          <div>
            <p className={labelClass}>Video URL</p>
            <input
              className={inputClass}
              value={block.data.videoUrl}
              onChange={(event) => setData({ ...block.data, videoUrl: event.target.value })}
            />
          </div>
          <div>
            <p className={labelClass}>Tagline</p>
            <input
              className={inputClass}
              value={block.data.tagline}
              onChange={(event) => setData({ ...block.data, tagline: event.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs text-stone-500">
              X position ({block.data.videoX ?? 50}%)
              <input
                className={rangeClass}
                type="range"
                min={0}
                max={100}
                value={block.data.videoX ?? 50}
                onChange={(event) =>
                  setData({ ...block.data, videoX: Number(event.target.value) })
                }
              />
            </label>
            <label className="text-xs text-stone-500">
              Y position ({block.data.videoY ?? 50}%)
              <input
                className={rangeClass}
                type="range"
                min={0}
                max={100}
                value={block.data.videoY ?? 50}
                onChange={(event) =>
                  setData({ ...block.data, videoY: Number(event.target.value) })
                }
              />
            </label>
            <label className="text-xs text-stone-500">
              Scale ({(block.data.videoScale ?? 1).toFixed(2)})
              <input
                className={rangeClass}
                type="range"
                min={0.6}
                max={1.6}
                step={0.02}
                value={block.data.videoScale ?? 1}
                onChange={(event) =>
                  setData({ ...block.data, videoScale: Number(event.target.value) })
                }
              />
            </label>
          </div>
          <div>
            <p className={labelClass}>Overlay opacity ({block.data.overlayOpacity})</p>
            <input
              className={rangeClass}
              type="range"
              min={0.1}
              max={0.9}
              step={0.05}
              value={block.data.overlayOpacity}
              onChange={(event) =>
                setData({ ...block.data, overlayOpacity: Number(event.target.value) })
              }
            />
          </div>
          <div>
            <p className={labelClass}>
              Desaturate ({(block.data.videoDesaturate ?? 0.6).toFixed(2)})
            </p>
            <input
              className={rangeClass}
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={block.data.videoDesaturate ?? 0.6}
              onChange={(event) =>
                setData({ ...block.data, videoDesaturate: Number(event.target.value) })
              }
            />
          </div>
        </div>
      )}

      {block.type === "brand-message" && (
        <div className="grid gap-4">
          <div>
            <p className={labelClass}>Heading</p>
            <input
              className={inputClass}
              value={block.data.heading}
              onChange={(event) => setData({ ...block.data, heading: event.target.value })}
            />
          </div>
          <div>
            <p className={labelClass}>Message</p>
            <textarea
              className={`${inputClass} min-h-[88px]`}
              value={block.data.message}
              onChange={(event) => setData({ ...block.data, message: event.target.value })}
            />
          </div>
        </div>
      )}

      {block.type === "triple-media" && (
        <div className="grid gap-4">
          <div>
            <p className={labelClass}>Left title</p>
            <input
              className={inputClass}
              value={block.data.leftTitle}
              onChange={(event) => setData({ ...block.data, leftTitle: event.target.value })}
            />
          </div>
          <div>
            <p className={labelClass}>Left body</p>
            <textarea
              className={`${inputClass} min-h-[72px]`}
              value={block.data.leftBody}
              onChange={(event) => setData({ ...block.data, leftBody: event.target.value })}
            />
          </div>
          <div>
            <p className={labelClass}>Left accent</p>
            <input
              className={inputClass}
              value={block.data.leftAccent}
              onChange={(event) => setData({ ...block.data, leftAccent: event.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <MediaEditor
              label="Middle image"
              media={block.data.middleMedia}
              onChange={(media) => setData({ ...block.data, middleMedia: media })}
            />
            <MediaEditor
              label="Right video"
              media={block.data.rightMedia}
              onChange={(media) => setData({ ...block.data, rightMedia: media })}
            />
          </div>
        </div>
      )}

      {block.type === "landscape" && (
        <div className="grid gap-4">
          <MediaEditor
            label="Landscape image"
            media={block.data.media}
            onChange={(media) => setData({ ...block.data, media })}
          />
          <div>
            <p className={labelClass}>Caption</p>
            <input
              className={inputClass}
              value={block.data.caption}
              onChange={(event) => setData({ ...block.data, caption: event.target.value })}
            />
          </div>
        </div>
      )}

      {block.type === "footer" && (
        <div className="grid gap-4">
          <div>
            <p className={labelClass}>Tagline</p>
            <input
              className={inputClass}
              value={block.data.tagline}
              onChange={(event) => setData({ ...block.data, tagline: event.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MediaEditor({
  label,
  media,
  onChange,
}: {
  label: string;
  media: MediaAsset;
  onChange: (media: MediaAsset) => void;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className={labelClass}>{label}</p>
      <input
        className={`${inputClass} mt-2`}
        value={media.url}
        onChange={(event) => onChange(updateMedia(media, { url: event.target.value }))}
      />
      <input
        className={`${inputClass} mt-2`}
        value={media.alt}
        onChange={(event) => onChange(updateMedia(media, { alt: event.target.value }))}
      />
      <div className="mt-3 grid gap-3">
        <label className="text-xs text-stone-500">
          X position ({media.x}%)
          <input
            className={rangeClass}
            type="range"
            min={0}
            max={100}
            value={media.x}
            onChange={(event) =>
              onChange(updateMedia(media, { x: Number(event.target.value) }))
            }
          />
        </label>
        <label className="text-xs text-stone-500">
          Y position ({media.y}%)
          <input
            className={rangeClass}
            type="range"
            min={0}
            max={100}
            value={media.y}
            onChange={(event) =>
              onChange(updateMedia(media, { y: Number(event.target.value) }))
            }
          />
        </label>
        <label className="text-xs text-stone-500">
          Scale ({media.scale.toFixed(2)})
          <input
            className={rangeClass}
            type="range"
            min={0.6}
            max={1.6}
            step={0.02}
            value={media.scale}
            onChange={(event) =>
              onChange(updateMedia(media, { scale: Number(event.target.value) }))
            }
          />
        </label>
      </div>
    </div>
  );
}
