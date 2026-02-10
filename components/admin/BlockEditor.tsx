"use client";

import { useMemo, useState } from "react";
import { ContentBlock, MediaAsset } from "@/lib/content/types";
import { createBrowserClient } from "@/lib/supabase/browser";

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
  const supabase = useMemo(() => createBrowserClient(), []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const setData = (data: ContentBlock["data"]) => {
    onChange({ ...block, data } as ContentBlock);
  };
  const handleUpload = async (file: File, onUrl: (url: string) => void) => {
    setUploading(true);
    setUploadError(null);
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      setUploadError(error.message);
      setUploading(false);
      return;
    }
    const publicUrl = supabase.storage.from("media").getPublicUrl(fileName).data.publicUrl;
    onUrl(publicUrl);
    setUploading(false);
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
          <div className="rounded-xl border border-dashed border-stone-200 p-3">
            <label className="flex items-center gap-2 text-xs text-stone-500">
              <input
                type="checkbox"
                checked={block.data.showTopImage ?? false}
                onChange={(event) =>
                  setData({ ...block.data, showTopImage: event.target.checked })
                }
              />
              Show top image
            </label>
            {block.data.showTopImage ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-stone-500">
                  Image URL
                  <input
                    className={inputClass}
                    value={block.data.topImageUrl ?? ""}
                    onChange={(event) =>
                      setData({ ...block.data, topImageUrl: event.target.value })
                    }
                  />
                </label>
                <label className="text-xs text-stone-500">
                  Alt text
                  <input
                    className={inputClass}
                    value={block.data.topImageAlt ?? ""}
                    onChange={(event) =>
                      setData({ ...block.data, topImageAlt: event.target.value })
                    }
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-stone-500 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={block.data.topImageLinkEnabled ?? false}
                    onChange={(event) =>
                      setData({
                        ...block.data,
                        topImageLinkEnabled: event.target.checked,
                      })
                    }
                  />
                  Enable image link
                </label>
                {block.data.topImageLinkEnabled ? (
                  <label className="text-xs text-stone-500 sm:col-span-2">
                    Link URL
                    <input
                      className={inputClass}
                      value={block.data.topImageLinkUrl ?? ""}
                      onChange={(event) =>
                        setData({
                          ...block.data,
                          topImageLinkUrl: event.target.value,
                        })
                      }
                    />
                  </label>
                ) : null}
                <label className="text-xs text-stone-500 sm:col-span-2">
                  Upload image
                  <input
                    className="mt-2 w-full text-[11px] text-stone-600"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        handleUpload(file, (url) =>
                          setData({ ...block.data, topImageUrl: url })
                        );
                      }
                    }}
                  />
                </label>
                {uploading ? (
                  <p className="text-[10px] text-stone-400 sm:col-span-2">Uploading...</p>
                ) : null}
                {uploadError ? (
                  <p className="text-[10px] text-red-500 sm:col-span-2">{uploadError}</p>
                ) : null}
              </div>
            ) : null}
          </div>
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
          <div className="rounded-xl border border-dashed border-stone-200 p-3">
            <label className="flex items-center gap-2 text-xs text-stone-500">
              <input
                type="checkbox"
                checked={block.data.showBgVideo ?? false}
                onChange={(event) =>
                  setData({ ...block.data, showBgVideo: event.target.checked })
                }
              />
              Show background video
            </label>
            {block.data.showBgVideo ? (
              <div className="mt-3 grid gap-3">
                <label className="text-xs text-stone-500">
                  Video URL
                  <input
                    className={inputClass}
                    value={block.data.bgVideoUrl ?? ""}
                    onChange={(event) =>
                      setData({ ...block.data, bgVideoUrl: event.target.value })
                    }
                  />
                </label>
                <label className="text-xs text-stone-500">
                  Upload video
                  <input
                    className="mt-2 w-full text-[11px] text-stone-600"
                    type="file"
                    accept="video/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        handleUpload(file, (url) =>
                          setData({ ...block.data, bgVideoUrl: url })
                        );
                      }
                    }}
                  />
                </label>
                {uploading ? (
                  <p className="text-[10px] text-stone-400">Uploading...</p>
                ) : null}
                {uploadError ? (
                  <p className="text-[10px] text-red-500">{uploadError}</p>
                ) : null}
                <label className="text-xs text-stone-500">
                  Opacity ({(block.data.bgVideoOpacity ?? 0.4).toFixed(2)})
                  <input
                    className={rangeClass}
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={block.data.bgVideoOpacity ?? 0.4}
                    onChange={(event) =>
                      setData({
                        ...block.data,
                        bgVideoOpacity: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label className="text-xs text-stone-500">
                  Feather ({(block.data.bgVideoFeather ?? 0).toFixed(2)})
                  <input
                    className={rangeClass}
                    type="range"
                    min={0}
                    max={0.4}
                    step={0.02}
                    value={block.data.bgVideoFeather ?? 0}
                    onChange={(event) =>
                      setData({
                        ...block.data,
                        bgVideoFeather: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label className="text-xs text-stone-500">
                  Desaturate ({(block.data.bgVideoDesaturate ?? 0).toFixed(2)})
                  <input
                    className={rangeClass}
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={block.data.bgVideoDesaturate ?? 0}
                    onChange={(event) =>
                      setData({
                        ...block.data,
                        bgVideoDesaturate: Number(event.target.value),
                      })
                    }
                  />
                </label>
              </div>
            ) : null}
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
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-xs text-stone-500">
              <input
                type="checkbox"
                checked={block.data.rightMediaCurtainEnabled ?? false}
                onChange={(event) =>
                  setData({
                    ...block.data,
                    rightMediaCurtainEnabled: event.target.checked,
                  })
                }
              />
              Curtain wipe on right video
            </label>
            <label className="text-xs text-stone-500">
              Left border effect
              <select
                className={inputClass}
                value={block.data.leftBorderEffect ?? "none"}
                onChange={(event) =>
                  setData({
                    ...block.data,
                    leftBorderEffect: event.target.value as
                      | "none"
                      | "tracer"
                      | "sweep"
                      | "both",
                  })
                }
              >
                {["none", "tracer", "sweep", "both"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
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
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <p className={labelClass}>Lead capture</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-stone-500">
                Lead text
                <input
                  className={inputClass}
                  value={block.data.leadText ?? ""}
                  onChange={(event) =>
                    setData({ ...block.data, leadText: event.target.value })
                  }
                />
              </label>
              <label className="text-xs text-stone-500">
                Join label
                <input
                  className={inputClass}
                  value={block.data.joinLabel ?? ""}
                  onChange={(event) =>
                    setData({ ...block.data, joinLabel: event.target.value })
                  }
                />
              </label>
              <label className="text-xs text-stone-500">
                Placeholder
                <input
                  className={inputClass}
                  value={block.data.leadPlaceholder ?? ""}
                  onChange={(event) =>
                    setData({ ...block.data, leadPlaceholder: event.target.value })
                  }
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-stone-500">
                <input
                  type="checkbox"
                  checked={block.data.showLeadLogo ?? true}
                  onChange={(event) =>
                    setData({ ...block.data, showLeadLogo: event.target.checked })
                  }
                />
                Show logo above lead
              </label>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-stone-500">
                Lead size ({block.data.leadStyle?.size ?? 16}px)
                <input
                  className={rangeClass}
                  type="range"
                  min={12}
                  max={36}
                  step={1}
                  value={block.data.leadStyle?.size ?? 16}
                  onChange={(event) =>
                    setData({
                      ...block.data,
                      leadStyle: {
                        size: Number(event.target.value),
                        weight: block.data.leadStyle?.weight ?? 600,
                        italic: block.data.leadStyle?.italic ?? false,
                        x: block.data.leadStyle?.x ?? 0,
                        y: block.data.leadStyle?.y ?? 0,
                      },
                    })
                  }
                />
              </label>
              <label className="text-xs text-stone-500">
                Lead weight
                <select
                  className={inputClass}
                  value={block.data.leadStyle?.weight ?? 600}
                  onChange={(event) =>
                    setData({
                      ...block.data,
                      leadStyle: {
                        size: block.data.leadStyle?.size ?? 16,
                        weight: Number(event.target.value),
                        italic: block.data.leadStyle?.italic ?? false,
                        x: block.data.leadStyle?.x ?? 0,
                        y: block.data.leadStyle?.y ?? 0,
                      },
                    })
                  }
                >
                  {[300, 400, 500, 600, 700].map((weight) => (
                    <option key={weight} value={weight}>
                      {weight}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-stone-500">
              Link size ({block.data.linkStyle?.size ?? 13}px)
              <input
                className={rangeClass}
                type="range"
                min={10}
                max={24}
                step={1}
                value={block.data.linkStyle?.size ?? 13}
                onChange={(event) =>
                  setData({
                    ...block.data,
                    linkStyle: {
                      size: Number(event.target.value),
                      weight: block.data.linkStyle?.weight ?? 600,
                      italic: block.data.linkStyle?.italic ?? false,
                      x: block.data.linkStyle?.x ?? 0,
                      y: block.data.linkStyle?.y ?? 0,
                    },
                  })
                }
              />
            </label>
            <label className="text-xs text-stone-500">
              Link weight
              <select
                className={inputClass}
                value={block.data.linkStyle?.weight ?? 600}
                onChange={(event) =>
                  setData({
                    ...block.data,
                    linkStyle: {
                      size: block.data.linkStyle?.size ?? 13,
                      weight: Number(event.target.value),
                      italic: block.data.linkStyle?.italic ?? false,
                      x: block.data.linkStyle?.x ?? 0,
                      y: block.data.linkStyle?.y ?? 0,
                    },
                  })
                }
              >
                {[300, 400, 500, 600, 700].map((weight) => (
                  <option key={weight} value={weight}>
                    {weight}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2 text-xs text-stone-500">
            <input
              type="checkbox"
              checked={block.data.linkStyle?.italic ?? false}
              onChange={(event) =>
                setData({
                  ...block.data,
                  linkStyle: {
                    size: block.data.linkStyle?.size ?? 13,
                    weight: block.data.linkStyle?.weight ?? 600,
                    italic: event.target.checked,
                    x: block.data.linkStyle?.x ?? 0,
                    y: block.data.linkStyle?.y ?? 0,
                  },
                })
              }
            />
            Italic links
          </label>
          <div className="space-y-3">
            <p className={labelClass}>Links</p>
            {block.data.links.map((link, linkIndex) => (
              <div key={`${link.label}-${linkIndex}`} className="grid gap-2 sm:grid-cols-2">
                <input
                  className={inputClass}
                  value={link.label}
                  onChange={(event) => {
                    const next = [...block.data.links];
                    next[linkIndex] = { ...next[linkIndex], label: event.target.value };
                    setData({ ...block.data, links: next });
                  }}
                  placeholder="Label"
                />
                <input
                  className={inputClass}
                  value={link.href}
                  onChange={(event) => {
                    const next = [...block.data.links];
                    next[linkIndex] = { ...next[linkIndex], href: event.target.value };
                    setData({ ...block.data, links: next });
                  }}
                  placeholder="https://"
                />
                <button
                  className={buttonClass}
                  onClick={() => {
                    const next = block.data.links.filter((_, i) => i !== linkIndex);
                    setData({ ...block.data, links: next });
                  }}
                >
                  Remove link
                </button>
              </div>
            ))}
            <button
              className={buttonClass}
              onClick={() =>
                setData({
                  ...block.data,
                  links: [...block.data.links, { label: "New link", href: "#" }],
                })
              }
            >
              Add link
            </button>
          </div>
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
