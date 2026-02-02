"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { InlineEditTarget } from "@/components/admin/inlineEditTypes";
import { GlobalSettings, MediaAsset, PageContent, TextStyle } from "@/lib/content/types";
import { createBrowserClient } from "@/lib/supabase/browser";

const cardClass =
  "rounded-2xl border border-stone-200 bg-white p-4 text-xs text-stone-700 shadow-sm";

const labelClass = "text-[10px] uppercase tracking-[0.3em] text-stone-500";

const inputClass =
  "mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700";

const rangeClass =
  "mt-2 h-2 w-full appearance-none rounded-full bg-stone-200 accent-amber-500";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type Props = {
  target: InlineEditTarget | null;
  content: PageContent;
  globals: GlobalSettings;
  onChangeContent: (content: PageContent) => void;
  onChangeGlobals: (globals: GlobalSettings) => void;
  onClear?: () => void;
};

const updateBlock = (
  content: PageContent,
  index: number,
  patch: Record<string, unknown>
) => ({
  ...content,
  blocks: content.blocks.map((block, i) =>
    i === index ? { ...block, data: { ...block.data, ...patch } } : block
  ),
});

const ensureTextStyle = (style?: TextStyle): TextStyle => ({
  size: style?.size ?? 16,
  weight: style?.weight ?? 500,
  italic: style?.italic ?? false,
  x: style?.x ?? 0,
  y: style?.y ?? 0,
});

export default function InlineEditPanel({
  target,
  content,
  globals,
  onChangeContent,
  onChangeGlobals,
  onClear,
}: Props) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [assets, setAssets] = useState<string[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);

  const handleUpload = async (file: File, onUrl: (url: string) => void) => {
    setUploading(true);
    setUploadError(null);
    const fileName = `${Date.now()}-${file.name}`.replace(/\s+/g, "-");
    const { error } = await supabase.storage.from("media").upload(fileName, file, {
      upsert: true,
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

  const loadAssets = async () => {
    setLoadingAssets(true);
    setAssetError(null);
    const { data, error } = await supabase.storage.from("media").list("", {
      limit: 60,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) {
      setAssetError(error.message);
      setLoadingAssets(false);
      return;
    }
    const urls =
      data?.map((item) => supabase.storage.from("media").getPublicUrl(item.name).data.publicUrl) ??
      [];
    setAssets(urls);
    setLoadingAssets(false);
  };

  useEffect(() => {
    setUploading(false);
    setUploadError(null);
    setAssetError(null);
  }, [target]);

  useEffect(() => {
    if (target?.kind === "media") {
      loadAssets();
    }
  }, [target]);

  const isVideoUrl = (url: string) => /\.(mp4|mov|webm|m4v|ogg)(\?.*)?$/i.test(url);

  if (!target) {
    return (
      <div className={cardClass}>
        <p className={labelClass}>Inline editor</p>
        <p className="mt-2 text-[11px] text-stone-500">
          Click a chip in the preview to edit that element here.
        </p>
      </div>
    );
  }

  if (target.kind === "logo") {
    const block = content.blocks[target.blockIndex];
    if (!block) {
      return null;
    }

    const baseCard = (children: ReactNode) => (
      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <p className={labelClass}>Logo</p>
          {onClear ? (
            <button
              className="text-[10px] uppercase tracking-[0.2em] text-stone-400"
              onClick={onClear}
            >
              Clear
            </button>
          ) : null}
        </div>
        {children}
      </div>
    );

    if (target.scope === "left" && block.type === "triple-media") {
      const scale = block.data.leftLogoScale ?? 1;
      const boxScale = block.data.leftLogoBoxScale ?? 1;
      const x = block.data.leftLogoX ?? 0;
      const y = block.data.leftLogoY ?? 0;

      return baseCard(
        <div className="mt-3 space-y-3">
          <label className="text-[10px] text-stone-500">
            Logo size ({scale.toFixed(2)})
            <input
              className={rangeClass}
              type="range"
              min={0.3}
              max={3}
              step={0.02}
              value={scale}
              onChange={(event) =>
                onChangeContent(
                  updateBlock(content, target.blockIndex, {
                    leftLogoScale: Number(event.target.value),
                  })
                )
              }
            />
          </label>
          <label className="text-[10px] text-stone-500">
            Box size ({boxScale.toFixed(2)})
            <input
              className={rangeClass}
              type="range"
              min={0.3}
              max={3}
              step={0.02}
              value={boxScale}
              onChange={(event) =>
                onChangeContent(
                  updateBlock(content, target.blockIndex, {
                    leftLogoBoxScale: Number(event.target.value),
                  })
                )
              }
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] text-stone-500">
              X ({x.toFixed(0)}%)
              <input
                className={rangeClass}
                type="range"
                min={-50}
                max={50}
                step={1}
                value={x}
                onChange={(event) =>
                  onChangeContent(
                    updateBlock(content, target.blockIndex, {
                      leftLogoX: Number(event.target.value),
                    })
                  )
                }
              />
            </label>
            <label className="text-[10px] text-stone-500">
              Y ({y.toFixed(0)}%)
              <input
                className={rangeClass}
                type="range"
                min={-50}
                max={50}
                step={1}
                value={y}
                onChange={(event) =>
                  onChangeContent(
                    updateBlock(content, target.blockIndex, {
                      leftLogoY: Number(event.target.value),
                    })
                  )
                }
              />
            </label>
          </div>
          <button
            className="w-full rounded-full border border-stone-200 px-3 py-1 text-[10px] font-semibold text-stone-700"
            onClick={() =>
              onChangeContent(
                updateBlock(content, target.blockIndex, {
                  leftLogoX: 0,
                  leftLogoY: 0,
                })
              )
            }
          >
            Center logo
          </button>
        </div>
      );
    }

    if (
      (target.scope === "hero" && block.type === "hero") ||
      (target.scope === "brand" && block.type === "brand-message")
    ) {
      const scale = block.data.logoScale ?? 1;
      const boxScale = block.data.logoBoxScale ?? 1;
      const x = block.data.logoX ?? 0;
      const y = block.data.logoY ?? 0;

      return baseCard(
        <div className="mt-3 space-y-3">
          <label className="text-[10px] text-stone-500">
            Logo size ({scale.toFixed(2)})
            <input
              className={rangeClass}
              type="range"
              min={0.3}
              max={3}
              step={0.02}
              value={scale}
              onChange={(event) =>
                onChangeContent(
                  updateBlock(content, target.blockIndex, {
                    logoScale: Number(event.target.value),
                  })
                )
              }
            />
          </label>
          <label className="text-[10px] text-stone-500">
            Box size ({boxScale.toFixed(2)})
            <input
              className={rangeClass}
              type="range"
              min={0.3}
              max={3}
              step={0.02}
              value={boxScale}
              onChange={(event) =>
                onChangeContent(
                  updateBlock(content, target.blockIndex, {
                    logoBoxScale: Number(event.target.value),
                  })
                )
              }
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] text-stone-500">
              X ({x.toFixed(0)}%)
              <input
                className={rangeClass}
                type="range"
                min={-50}
                max={50}
                step={1}
                value={x}
                onChange={(event) =>
                  onChangeContent(
                    updateBlock(content, target.blockIndex, {
                      logoX: Number(event.target.value),
                    })
                  )
                }
              />
            </label>
            <label className="text-[10px] text-stone-500">
              Y ({y.toFixed(0)}%)
              <input
                className={rangeClass}
                type="range"
                min={-50}
                max={50}
                step={1}
                value={y}
                onChange={(event) =>
                  onChangeContent(
                    updateBlock(content, target.blockIndex, {
                      logoY: Number(event.target.value),
                    })
                  )
                }
              />
            </label>
          </div>
          <button
            className="w-full rounded-full border border-stone-200 px-3 py-1 text-[10px] font-semibold text-stone-700"
            onClick={() =>
              onChangeContent(
                updateBlock(content, target.blockIndex, {
                  logoX: 0,
                  logoY: 0,
                })
              )
            }
          >
            Center logo
          </button>
        </div>
      );
    }

    return null;
  }

  if (target.kind === "media") {
    const block = content.blocks[target.blockIndex];
    if (!block) {
      return null;
    }

    if (target.scope === "heroVideo" && block.type === "hero") {
      const videoX = block.data.videoX ?? 50;
      const videoY = block.data.videoY ?? 50;
      const videoScale = block.data.videoScale ?? 1;
      const desaturate = block.data.videoDesaturate ?? 0.6;
      return (
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <p className={labelClass}>Hero video</p>
            {onClear ? (
              <button className="text-[10px] uppercase tracking-[0.2em] text-stone-400" onClick={onClear}>
                Clear
              </button>
            ) : null}
          </div>
          <label className="mt-3 text-[10px] text-stone-500">
            Video URL
            <input
              className={inputClass}
              value={block.data.videoUrl}
              onChange={(event) =>
                onChangeContent(
                  updateBlock(content, target.blockIndex, { videoUrl: event.target.value })
                )
              }
            />
          </label>
          <label className="mt-3 text-[10px] text-stone-500">
            Upload video
            <input
              className="mt-2 w-full text-[11px] text-stone-600"
              type="file"
              accept="video/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  handleUpload(file, (url) =>
                    onChangeContent(
                      updateBlock(content, target.blockIndex, { videoUrl: url })
                    )
                  );
                }
              }}
            />
          </label>
          {uploading ? (
            <p className="mt-2 text-[10px] text-stone-400">Uploading...</p>
          ) : null}
          {uploadError ? (
            <p className="mt-2 text-[10px] text-red-500">{uploadError}</p>
          ) : null}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className={labelClass}>Media library</p>
              <button
                className="text-[10px] uppercase tracking-[0.2em] text-stone-400"
                onClick={loadAssets}
                type="button"
              >
                Refresh
              </button>
            </div>
            {loadingAssets ? (
              <p className="mt-2 text-[10px] text-stone-400">Loading...</p>
            ) : assetError ? (
              <p className="mt-2 text-[10px] text-red-500">{assetError}</p>
            ) : (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {assets.filter(isVideoUrl).map((url) => (
                  <button
                    key={url}
                    className="h-16 w-full overflow-hidden rounded-lg border border-stone-200"
                    onClick={() =>
                      onChangeContent(updateBlock(content, target.blockIndex, { videoUrl: url }))
                    }
                  >
                    <video className="h-full w-full object-cover" src={url} muted />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] text-stone-500">
              X ({videoX}%)
              <input
                className={rangeClass}
                type="range"
                min={0}
                max={100}
                value={videoX}
                onChange={(event) =>
                  onChangeContent(
                    updateBlock(content, target.blockIndex, {
                      videoX: Number(event.target.value),
                    })
                  )
                }
              />
            </label>
            <label className="text-[10px] text-stone-500">
              Y ({videoY}%)
              <input
                className={rangeClass}
                type="range"
                min={0}
                max={100}
                value={videoY}
                onChange={(event) =>
                  onChangeContent(
                    updateBlock(content, target.blockIndex, {
                      videoY: Number(event.target.value),
                    })
                  )
                }
              />
            </label>
          </div>
          <label className="mt-3 text-[10px] text-stone-500">
            Scale ({videoScale.toFixed(2)})
            <input
              className={rangeClass}
              type="range"
              min={0.6}
              max={1.6}
              step={0.02}
              value={videoScale}
              onChange={(event) =>
                onChangeContent(
                  updateBlock(content, target.blockIndex, {
                    videoScale: Number(event.target.value),
                  })
                )
              }
            />
          </label>
          <label className="mt-3 text-[10px] text-stone-500">
            Desaturate ({desaturate.toFixed(2)})
            <input
              className={rangeClass}
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={desaturate}
              onChange={(event) =>
                onChangeContent(
                  updateBlock(content, target.blockIndex, {
                    videoDesaturate: Number(event.target.value),
                  })
                )
              }
            />
          </label>
        </div>
      );
    }

    const media: MediaAsset | null =
      target.scope === "middleMedia" && block.type === "triple-media"
        ? block.data.middleMedia
        : target.scope === "rightMedia" && block.type === "triple-media"
          ? block.data.rightMedia
          : target.scope === "landscapeMedia" && block.type === "landscape"
            ? block.data.media
            : null;

    if (!media) {
      return null;
    }

    const updateMedia = (next: MediaAsset) => {
      if (target.scope === "middleMedia" && block.type === "triple-media") {
        onChangeContent(updateBlock(content, target.blockIndex, { middleMedia: next }));
      } else if (target.scope === "rightMedia" && block.type === "triple-media") {
        onChangeContent(updateBlock(content, target.blockIndex, { rightMedia: next }));
      } else if (target.scope === "landscapeMedia" && block.type === "landscape") {
        onChangeContent(updateBlock(content, target.blockIndex, { media: next }));
      }
    };

    return (
      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <p className={labelClass}>
            {target.scope === "middleMedia"
              ? "Media photo"
              : target.scope === "rightMedia"
                ? "Media video"
                : "Landscape image"}
          </p>
          {onClear ? (
            <button className="text-[10px] uppercase tracking-[0.2em] text-stone-400" onClick={onClear}>
              Clear
            </button>
          ) : null}
        </div>
        <label className="mt-3 text-[10px] text-stone-500">
          Media URL
          <input
            className={inputClass}
            value={media.url}
            onChange={(event) => updateMedia({ ...media, url: event.target.value })}
          />
        </label>
        <label className="mt-3 text-[10px] text-stone-500">
          Upload {media.type}
          <input
            className="mt-2 w-full text-[11px] text-stone-600"
            type="file"
            accept={media.type === "video" ? "video/*" : "image/*"}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                handleUpload(file, (url) => updateMedia({ ...media, url }));
              }
            }}
          />
        </label>
        {uploading ? (
          <p className="mt-2 text-[10px] text-stone-400">Uploading...</p>
        ) : null}
        {uploadError ? (
          <p className="mt-2 text-[10px] text-red-500">{uploadError}</p>
        ) : null}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className={labelClass}>Media library</p>
            <button
              className="text-[10px] uppercase tracking-[0.2em] text-stone-400"
              onClick={loadAssets}
              type="button"
            >
              Refresh
            </button>
          </div>
          {loadingAssets ? (
            <p className="mt-2 text-[10px] text-stone-400">Loading...</p>
          ) : assetError ? (
            <p className="mt-2 text-[10px] text-red-500">{assetError}</p>
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {assets
                .filter((url) => (media.type === "video" ? isVideoUrl(url) : !isVideoUrl(url)))
                .map((url) => (
                  <button
                    key={url}
                    className="h-16 w-full overflow-hidden rounded-lg border border-stone-200"
                    onClick={() => updateMedia({ ...media, url })}
                  >
                    {media.type === "video" ? (
                      <video className="h-full w-full object-cover" src={url} muted />
                    ) : (
                      <img className="h-full w-full object-cover" src={url} alt="" />
                    )}
                  </button>
                ))}
            </div>
          )}
        </div>
        <label className="mt-3 text-[10px] text-stone-500">
          Alt text
          <input
            className={inputClass}
            value={media.alt}
            onChange={(event) => updateMedia({ ...media, alt: event.target.value })}
          />
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-[10px] text-stone-500">
            X ({media.x}%)
            <input
              className={rangeClass}
              type="range"
              min={0}
              max={100}
              value={media.x}
              onChange={(event) => updateMedia({ ...media, x: Number(event.target.value) })}
            />
          </label>
          <label className="text-[10px] text-stone-500">
            Y ({media.y}%)
            <input
              className={rangeClass}
              type="range"
              min={0}
              max={100}
              value={media.y}
              onChange={(event) => updateMedia({ ...media, y: Number(event.target.value) })}
            />
          </label>
        </div>
        <label className="mt-3 text-[10px] text-stone-500">
          Scale ({media.scale.toFixed(2)})
          <input
            className={rangeClass}
            type="range"
            min={0.6}
            max={1.6}
            step={0.02}
            value={media.scale}
            onChange={(event) => updateMedia({ ...media, scale: Number(event.target.value) })}
          />
        </label>
      </div>
    );
  }

  if (target.kind === "text") {
    const block = target.blockIndex !== undefined ? content.blocks[target.blockIndex] : null;
    const label =
      target.scope === "logoText"
        ? "Logo text"
        : target.scope === "tagline"
          ? "Hero text"
          : target.scope === "brandHeading"
            ? "Brand heading"
            : target.scope === "brandMessage"
              ? "Brand message"
              : target.scope === "leftTitle"
                ? "Left title"
                : target.scope === "leftBody"
                  ? "Left body"
                  : target.scope === "caption"
                    ? "Caption"
                    : "Footer text";

    const multiline =
      target.scope === "brandMessage" || target.scope === "leftBody" || target.scope === "caption";

    let value = "";
    let style: TextStyle | undefined;
    let onValueChange: (next: string) => void = () => {};
    let onStyleChange: (next: TextStyle) => void = () => {};

    if (target.scope === "logoText") {
      value = globals.logoText;
      style = globals.logoTextStyle;
      onValueChange = (next) => onChangeGlobals({ ...globals, logoText: next });
      onStyleChange = (next) => onChangeGlobals({ ...globals, logoTextStyle: next });
    } else if (target.scope === "tagline" && block?.type === "hero") {
      value = block.data.tagline;
      style = block.data.taglineStyle;
      onValueChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { tagline: next }));
      onStyleChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { taglineStyle: next }));
    } else if (target.scope === "brandHeading" && block?.type === "brand-message") {
      value = block.data.heading;
      style = block.data.headingStyle;
      onValueChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { heading: next }));
      onStyleChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { headingStyle: next }));
    } else if (target.scope === "brandMessage" && block?.type === "brand-message") {
      value = globals.brandMessage ?? block.data.message;
      style = globals.brandMessageStyle ?? block.data.messageStyle;
      onValueChange = (next) => {
        onChangeGlobals({ ...globals, brandMessage: next });
        onChangeContent(updateBlock(content, target.blockIndex!, { message: next }));
      };
      onStyleChange = (next) => onChangeGlobals({ ...globals, brandMessageStyle: next });
    } else if (target.scope === "leftTitle" && block?.type === "triple-media") {
      value = block.data.leftTitle;
      style = block.data.leftTitleStyle;
      onValueChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { leftTitle: next }));
      onStyleChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { leftTitleStyle: next }));
    } else if (target.scope === "leftBody" && block?.type === "triple-media") {
      value = block.data.leftBody;
      style = block.data.leftBodyStyle;
      onValueChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { leftBody: next }));
      onStyleChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { leftBodyStyle: next }));
    } else if (target.scope === "caption" && block?.type === "landscape") {
      value = block.data.caption;
      style = block.data.captionStyle;
      onValueChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { caption: next }));
      onStyleChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { captionStyle: next }));
    } else if (target.scope === "footerTagline" && block?.type === "footer") {
      value = block.data.tagline;
      style = block.data.taglineStyle;
      onValueChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { tagline: next }));
      onStyleChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { taglineStyle: next }));
    }

    const resolvedStyle = ensureTextStyle(style);

    return (
      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <p className={labelClass}>{label}</p>
          {onClear ? (
            <button className="text-[10px] uppercase tracking-[0.2em] text-stone-400" onClick={onClear}>
              Clear
            </button>
          ) : null}
        </div>
        <label className="mt-3 text-[10px] text-stone-500">
          Text
          {multiline ? (
            <textarea
              className={`${inputClass} min-h-[90px]`}
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
            />
          ) : (
            <input
              className={inputClass}
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
            />
          )}
        </label>
        <label className="mt-3 text-[10px] text-stone-500">
          Size ({resolvedStyle.size}px)
          <input
            className={rangeClass}
            type="range"
            min={10}
            max={80}
            step={1}
            value={resolvedStyle.size}
            onChange={(event) =>
              onStyleChange({ ...resolvedStyle, size: Number(event.target.value) })
            }
          />
        </label>
        <label className="mt-3 text-[10px] text-stone-500">
          Weight
          <select
            className={inputClass}
            value={resolvedStyle.weight}
            onChange={(event) =>
              onStyleChange({ ...resolvedStyle, weight: Number(event.target.value) })
            }
          >
            {[300, 400, 500, 600, 700].map((weight) => (
              <option key={weight} value={weight}>
                {weight}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 flex items-center gap-2 text-[10px] text-stone-500">
          <input
            type="checkbox"
            checked={resolvedStyle.italic ?? false}
            onChange={(event) =>
              onStyleChange({ ...resolvedStyle, italic: event.target.checked })
            }
          />
          Italic
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-[10px] text-stone-500">
            X ({resolvedStyle.x ?? 0}px)
            <input
              className={rangeClass}
              type="range"
              min={-200}
              max={200}
              step={1}
              value={clamp(resolvedStyle.x ?? 0, -200, 200)}
              onChange={(event) =>
                onStyleChange({ ...resolvedStyle, x: Number(event.target.value) })
              }
            />
          </label>
          <label className="text-[10px] text-stone-500">
            Y ({resolvedStyle.y ?? 0}px)
            <input
              className={rangeClass}
              type="range"
              min={-200}
              max={200}
              step={1}
              value={clamp(resolvedStyle.y ?? 0, -200, 200)}
              onChange={(event) =>
                onStyleChange({ ...resolvedStyle, y: Number(event.target.value) })
              }
            />
          </label>
        </div>
        <button
          className="mt-2 w-full rounded-full border border-stone-200 px-3 py-1 text-[10px] font-semibold text-stone-700"
          onClick={() => onStyleChange({ ...resolvedStyle, x: 0, y: 0 })}
        >
          Center text
        </button>
      </div>
    );
  }

  return null;
}
