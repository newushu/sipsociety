"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { InlineEditTarget } from "@/components/admin/inlineEditTypes";
import {
  ContentBlock,
  FontKey,
  GlobalSettings,
  MediaAsset,
  PageContent,
  TextStyle,
} from "@/lib/content/types";
import { fontFamilyForKey, fontOptions, sortFontOptions } from "@/lib/content/fonts";
import { createBrowserClient } from "@/lib/supabase/browser";
import { defaultAboutContent, defaultCareerContent } from "@/lib/content/defaults";
import ColorPicker from "@/components/admin/ColorPicker";

const cardClass =
  "rounded-2xl border border-stone-200 bg-white p-4 text-xs text-stone-700 shadow-sm";

const labelClass = "text-[10px] uppercase tracking-[0.3em] text-stone-500";

const inputClass =
  "mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700";

const rangeClass =
  "mt-2 h-2 w-full appearance-none rounded-full bg-stone-200 accent-amber-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-amber-500 [&::-moz-range-thumb]:shadow";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const aboutAnimationOptions = [
  { value: "none", label: "None" },
  { value: "move-up", label: "Move up" },
  { value: "move-down", label: "Move down" },
  { value: "move-left", label: "Move left" },
  { value: "move-right", label: "Move right" },
  { value: "slide-up", label: "Slide up" },
  { value: "zoom-in", label: "Zoom in" },
  { value: "zoom-out", label: "Zoom out" },
  { value: "fade", label: "Fade" },
  { value: "blur", label: "Blur in" },
  { value: "rotate", label: "Rotate in" },
  { value: "flip", label: "Flip" },
] as const;

type Props = {
  target: InlineEditTarget | null;
  content: PageContent;
  globals: GlobalSettings;
  onChangeContent: (content: PageContent) => void;
  onChangeGlobals: (globals: GlobalSettings) => void;
  onClear?: () => void;
};

type AssetItem = {
  name: string;
  url: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

const updateBlock = (
  content: PageContent,
  index: number,
  patch: Partial<ContentBlock["data"]>
): PageContent => ({
  ...content,
  blocks: content.blocks.map((block, i) =>
    i === index
      ? ({ ...block, data: { ...block.data, ...patch } } as ContentBlock)
      : block
  ),
});

const ensureTextStyle = (style?: TextStyle): TextStyle => ({
  size: style?.size ?? 16,
  weight: style?.weight ?? 500,
  italic: style?.italic ?? false,
  x: style?.x ?? 0,
  y: style?.y ?? 0,
  font: style?.font,
  color: style?.color,
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
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [hoverFont, setHoverFont] = useState<TextStyle["font"] | null>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const textInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const heroUploadInputRef = useRef<HTMLInputElement | null>(null);
  const heroImageUploadInputRef = useRef<HTMLInputElement | null>(null);
  const mediaUploadInputRef = useRef<HTMLInputElement | null>(null);
  const careerImageUploadInputRef = useRef<HTMLInputElement | null>(null);
  const [fontPickerOpen, setFontPickerOpen] = useState(false);
  const [fontPickerPos, setFontPickerPos] = useState<{ top: number; left: number }>({
    top: 120,
    left: 320,
  });
  const fontButtonRef = useRef<HTMLButtonElement | null>(null);
  const fontPanelRef = useRef<HTMLDivElement | null>(null);
  const [libraryExpanded, setLibraryExpanded] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryFilter, setLibraryFilter] = useState<"all" | "15m" | "1h" | "1d" | "1w">(
    "all"
  );
  const usedFonts = useMemo(() => {
    const used = new Set<FontKey>();
    if (globals.bodyFont) used.add(globals.bodyFont);
    if (globals.mottoFont) used.add(globals.mottoFont);
    if (globals.brandHeadingFont) used.add(globals.brandHeadingFont);
    if (globals.brandMessageFont) used.add(globals.brandMessageFont);
    if (globals.logoTextStyle?.font) used.add(globals.logoTextStyle.font);
    if (globals.mottoStyle?.font) used.add(globals.mottoStyle.font);
    if (globals.brandMessageStyle?.font) used.add(globals.brandMessageStyle.font);
    content.blocks.forEach((block) => {
      if (block.type === "hero" && block.data.taglineStyle?.font) {
        used.add(block.data.taglineStyle.font);
      }
      if (block.type === "brand-message") {
        if (block.data.headingStyle?.font) used.add(block.data.headingStyle.font);
        if (block.data.messageStyle?.font) used.add(block.data.messageStyle.font);
      }
      if (block.type === "triple-media") {
        if (block.data.leftTitleStyle?.font) used.add(block.data.leftTitleStyle.font);
        if (block.data.leftBodyStyle?.font) used.add(block.data.leftBodyStyle.font);
      }
      if (block.type === "landscape" && block.data.captionStyle?.font) {
        used.add(block.data.captionStyle.font);
      }
      if (block.type === "footer" && block.data.taglineStyle?.font) {
        used.add(block.data.taglineStyle.font);
      }
    });
    return used;
  }, [content.blocks, globals]);
  const [hoverPreview, setHoverPreview] = useState<{
    url: string;
    kind: "video" | "image";
    label: string;
    dateLabel: string;
    x: number;
    y: number;
  } | null>(null);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleUpload = async (file: File, onUrl: (url: string) => void) => {
    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    const fileName = `${Date.now()}-${file.name}`.replace(/\s+/g, "-");
    const { error } = await supabase.storage.from("media").upload(fileName, file, {
      upsert: true,
    });
    if (error) {
      setUploadError(error.message);
      setUploading(false);
      setUploadProgress(null);
      return;
    }
    const publicUrl = supabase.storage.from("media").getPublicUrl(fileName).data.publicUrl;
    onUrl(publicUrl);
    setUploadProgress(100);
    await loadAssets();
    setUploading(false);
    window.setTimeout(() => setUploadProgress(null), 800);
  };

  const loadAssets = async () => {
    setLoadingAssets(true);
    setAssetError(null);
    const { data, error } = await supabase.storage.from("media").list("", {
      limit: 200,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) {
      setAssetError(error.message);
      setLoadingAssets(false);
      return;
    }
    const items =
      data?.map((item) => ({
        name: item.name,
        url: supabase.storage.from("media").getPublicUrl(item.name).data.publicUrl,
        createdAt: item.created_at ?? null,
        updatedAt: item.updated_at ?? null,
      })) ?? [];
    setAssets(items);
    setLoadingAssets(false);
  };

  useEffect(() => {
    setUploading(false);
    setUploadError(null);
    setAssetError(null);
  }, [target]);

  useEffect(() => {
    setHoverFont(null);
    setHasSelection(false);
    setFontPickerOpen(false);
  }, [target?.kind, target?.scope, target?.blockIndex]);

  useEffect(() => {
    if (!fontPickerOpen) return;
    const handle = (event: MouseEvent) => {
      const targetNode = event.target as Node | null;
      if (!targetNode) return;
      if (fontPanelRef.current?.contains(targetNode)) return;
      if (fontButtonRef.current?.contains(targetNode)) return;
      setFontPickerOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFontPickerOpen(false);
    };
    window.addEventListener("mousedown", handle);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handle);
      window.removeEventListener("keydown", handleKey);
    };
  }, [fontPickerOpen]);

  useEffect(() => {
    if (target?.kind === "media") {
      loadAssets();
    }
  }, [target]);

  const isVideoUrl = (url: string) => /\.(mp4|mov|webm|m4v|ogg)(\?.*)?$/i.test(url);
  const isImageUrl = (url: string) => !isVideoUrl(url);
  const formatAssetDate = (asset: AssetItem) => {
    const stamp = asset.updatedAt ?? asset.createdAt;
    if (!stamp) return "Upload date unknown";
    const date = new Date(stamp);
    if (Number.isNaN(date.getTime())) return "Upload date unknown";
    // eslint-disable-next-line react-hooks/purity
    const minutesSince = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutesSince >= 0 && minutesSince <= 2) {
      return "Just uploaded";
    }
    if (minutesSince < 60) {
      return `Uploaded ${minutesSince} minutes ago`;
    }
    const hoursSince = Math.floor(minutesSince / 60);
    if (hoursSince < 24) {
      return `Uploaded ${hoursSince} hours ago`;
    }
    return `Uploaded ${date.toLocaleString()}`;
  };

  const handlePreviewEnter = (
    event: React.MouseEvent,
    asset: AssetItem,
    kind: "video" | "image"
  ) => {
    const dateLabel = formatAssetDate(asset);
    setHoverPreview({
      url: asset.url,
      kind,
      label: "Preview",
      dateLabel,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handlePreviewMove = (event: React.MouseEvent) => {
    setHoverPreview((prev) =>
      prev
        ? {
            ...prev,
            x: event.clientX,
            y: event.clientY,
          }
        : prev
    );
  };

  const handlePreviewLeave = () => setHoverPreview(null);

  const previewTooltip = hoverPreview ? (
    <div
      className="pointer-events-none fixed z-[9999] w-56 rounded-xl border border-stone-200 bg-white p-2 text-left shadow-2xl"
      style={{
        left:
          typeof window === "undefined"
            ? hoverPreview.x
            : Math.min(hoverPreview.x + 16, window.innerWidth - 240),
        top:
          typeof window === "undefined"
            ? hoverPreview.y
            : Math.min(hoverPreview.y + 16, window.innerHeight - 160),
      }}
    >
      {hoverPreview.kind === "video" ? (
        <video
          className="h-28 w-full rounded-lg object-cover"
          src={hoverPreview.url}
          muted
          playsInline
          autoPlay
          loop
        />
      ) : (
        <img
          className="h-28 w-full rounded-lg object-cover"
          src={hoverPreview.url}
          alt=""
        />
      )}
      <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-stone-500">
        {hoverPreview.label}
      </p>
      <p className="mt-1 text-[10px] text-stone-500">{hoverPreview.dateLabel}</p>
    </div>
  ) : null;

  const isAssetInRange = (asset: AssetItem, filter: typeof libraryFilter) => {
    if (filter === "all") return true;
    const stamp = asset.updatedAt ?? asset.createdAt;
    if (!stamp) return false;
    const date = new Date(stamp);
    if (Number.isNaN(date.getTime())) return false;
    // eslint-disable-next-line react-hooks/purity
    const minutes = (Date.now() - date.getTime()) / 60000;
    if (minutes < 0) return false;
    if (filter === "15m") return minutes <= 15;
    if (filter === "1h") return minutes <= 60;
    if (filter === "1d") return minutes <= 60 * 24;
    if (filter === "1w") return minutes <= 60 * 24 * 7;
    return true;
  };

  const filteredAssets = assets.filter((asset) => {
    const query = librarySearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      asset.name.toLowerCase().includes(query) ||
      asset.url.toLowerCase().includes(query);
    return matchesSearch && isAssetInRange(asset, libraryFilter);
  });
  const scopedAssets = filteredAssets;
  const currentMediaUrl =
    target?.kind === "media"
      ? (() => {
          const block = target.blockIndex !== undefined ? content.blocks[target.blockIndex] : null;
          if (!block) return "";
          if (target.scope === "careerHeroImage") {
            return content.career?.heroImageUrl ?? defaultCareerContent.heroImageUrl;
          }
          if (target.scope === "heroVideo" && block.type === "hero") return block.data.videoUrl ?? "";
          if (target.scope === "heroImage" && block.type === "hero") return block.data.imageUrl ?? "";
          if (target.scope === "middleMedia" && block.type === "triple-media") {
            return block.data.middleMedia.url ?? "";
          }
          if (target.scope === "rightMedia" && block.type === "triple-media") {
            return block.data.rightMedia.url ?? "";
          }
          if (target.scope === "landscapeMedia" && block.type === "landscape") {
            return block.data.media.url ?? "";
          }
          if (target.scope === "brandTopImage" && block.type === "brand-message") {
            return block.data.topImageUrl ?? "";
          }
          if (target.scope === "brandBgVideo" && block.type === "brand-message") {
            return block.data.bgVideoUrl ?? "";
          }
          return "";
        })()
      : "";

  const libraryModal =
    libraryExpanded && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 px-6"
            onClick={() => setLibraryExpanded(false)}
          >
            <div
              className="w-full max-w-3xl rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
                  Media library
                </p>
                <button
                  className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold"
                  onClick={() => setLibraryExpanded(false)}
                >
                  Close
                </button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                <input
                  className={inputClass}
                  placeholder="Search media..."
                  value={librarySearch}
                  onChange={(event) => setLibrarySearch(event.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  {[
                    ["all", "All"],
                    ["15m", "Last 15m"],
                    ["1h", "Last hour"],
                    ["1d", "Last day"],
                    ["1w", "Last week"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                        libraryFilter === value
                          ? "border-amber-300 bg-amber-200 text-stone-900"
                          : "border-stone-200 text-stone-500"
                      }`}
                      onClick={() =>
                        setLibraryFilter(value as typeof libraryFilter)
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                  {scopedAssets.map((asset) => {
                    const isVideo = isVideoUrl(asset.url);
                    const isActive = currentMediaUrl === asset.url;
                    return (
                      <button
                        key={asset.url}
                        className={`group relative rounded-xl border bg-white p-2 text-left ${
                          isActive ? "border-amber-400 ring-2 ring-amber-200" : "border-stone-200"
                        }`}
                        onClick={() => {
                          if (!target || target.kind !== "media") return;
                          const block = content.blocks[target.blockIndex];
                          if (!block) return;
                          if (target.scope === "heroVideo" && block.type === "hero") {
                            onChangeContent(
                              updateBlock(content, target.blockIndex, { videoUrl: asset.url })
                            );
                          } else if (target.scope === "heroImage" && block.type === "hero") {
                            onChangeContent(
                              updateBlock(content, target.blockIndex, { imageUrl: asset.url })
                            );
                          } else if (
                            target.scope === "middleMedia" &&
                            block.type === "triple-media"
                          ) {
                            onChangeContent(
                              updateBlock(content, target.blockIndex, {
                                middleMedia: { ...block.data.middleMedia, url: asset.url },
                              })
                            );
                          } else if (
                            target.scope === "rightMedia" &&
                            block.type === "triple-media"
                          ) {
                            onChangeContent(
                              updateBlock(content, target.blockIndex, {
                                rightMedia: { ...block.data.rightMedia, url: asset.url },
                              })
                            );
                          } else if (
                            target.scope === "landscapeMedia" &&
                            block.type === "landscape"
                          ) {
                            onChangeContent(
                              updateBlock(content, target.blockIndex, {
                                media: { ...block.data.media, url: asset.url },
                              })
                            );
                          } else if (
                            target.scope === "brandTopImage" &&
                            block.type === "brand-message"
                          ) {
                            onChangeContent(
                              updateBlock(content, target.blockIndex, {
                                topImageUrl: asset.url,
                              })
                            );
                          } else if (
                            target.scope === "brandBgVideo" &&
                            block.type === "brand-message"
                          ) {
                            onChangeContent(
                              updateBlock(content, target.blockIndex, {
                                bgVideoUrl: asset.url,
                              })
                            );
                          }
                          setLibraryExpanded(false);
                        }}
                      >
                        {isActive ? (
                          <span className="absolute right-2 top-2 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-900">
                            Current
                          </span>
                        ) : null}
                        <div className="h-20 w-full overflow-hidden rounded-lg">
                          {isVideo ? (
                            <video className="h-full w-full object-cover" src={asset.url} muted />
                          ) : (
                            <img className="h-full w-full object-cover" src={asset.url} alt="" />
                          )}
                        </div>
                        <p className="mt-2 text-[10px] text-stone-500">
                          {formatAssetDate(asset)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;
  const withModal = (node: ReactNode) => (
    <>
      {libraryModal}
      {node}
    </>
  );

  if (!target) {
    return withModal(
      <div className={cardClass}>
        <p className={labelClass}>Inline editor</p>
        <p className="mt-2 text-[11px] text-stone-500">
          Click a chip in the preview to edit that element here.
        </p>
      </div>
    );
  }

  if (target.kind === "animation") {
    if (target.scope.startsWith("about")) {
      const about = { ...defaultAboutContent, ...(content.about ?? {}) };
      const updateAbout = (next: typeof about) =>
        onChangeContent({ ...content, about: next });
      const sectionIndex = target.blockIndex ?? 0;
      const section = about.sections[sectionIndex];

      const currentAnimation =
        target.scope === "aboutHeroLogoAnimation"
          ? about.heroLogoAnimation
          : target.scope === "aboutHeroTitleAnimation"
            ? about.heroTitleAnimation
            : target.scope === "aboutHeroBodyAnimation"
              ? about.heroBodyAnimation
              : target.scope === "aboutSectionMediaAnimation"
                ? section?.mediaAnimation
                : section?.textAnimation;

      if (
        (target.scope === "aboutSectionMediaAnimation" ||
          target.scope === "aboutSectionTextAnimation") &&
        !section
      ) {
        return null;
      }

      const applyAnimation = (next: typeof currentAnimation) => {
        if (target.scope === "aboutHeroLogoAnimation") {
          updateAbout({ ...about, heroLogoAnimation: next });
          return;
        }
        if (target.scope === "aboutHeroTitleAnimation") {
          updateAbout({ ...about, heroTitleAnimation: next });
          return;
        }
        if (target.scope === "aboutHeroBodyAnimation") {
          updateAbout({ ...about, heroBodyAnimation: next });
          return;
        }
        if (!section) return;
        const nextSections = about.sections.map((item, index) => {
          if (index !== sectionIndex) return item;
          if (target.scope === "aboutSectionMediaAnimation") {
            return { ...item, mediaAnimation: next };
          }
          return { ...item, textAnimation: next };
        });
        updateAbout({ ...about, sections: nextSections });
      };

      const anim = currentAnimation ?? { type: "none", trigger: "once", playId: 0 };

      return withModal(
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <p className={labelClass}>About animation</p>
          </div>
          <label className="mt-3 text-[10px] text-stone-500">
            Style
            <select
              className={inputClass}
              value={anim.type}
              onChange={(event) =>
                applyAnimation({
                  ...anim,
                  type: event.target.value as typeof anim.type,
                  playId: (anim.playId ?? 0) + 1,
                })
              }
            >
              {aboutAnimationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 text-[10px] text-stone-500">
            Trigger
            <select
              className={inputClass}
              value={anim.trigger ?? "once"}
              onChange={(event) =>
                applyAnimation({
                  ...anim,
                  trigger: event.target.value as "once" | "always",
                  playId: (anim.playId ?? 0) + 1,
                })
              }
            >
              {["once", "always"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <button
            className="mt-3 w-full rounded-full border border-stone-200 px-3 py-1 text-[10px] font-semibold text-stone-700"
            onClick={() =>
              applyAnimation({
                ...anim,
                playId: (anim.playId ?? 0) + 1,
              })
            }
          >
            Play animation
          </button>
        </div>
      );
    }
    const block = content.blocks[target.blockIndex];
    if (!block || block.type !== "brand-message") {
      return null;
    }
    return withModal(
      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <p className={labelClass}>Brand animation</p>
        </div>
        <label className="mt-3 text-[10px] text-stone-500">
          Style
          <select
            className={inputClass}
            value={block.data.animationType ?? "none"}
            onChange={(event) =>
              onChangeContent(
                updateBlock(content, target.blockIndex, {
                  animationType: event.target.value as "none" | "reveal" | "roll",
                })
              )
            }
          >
            {["none", "reveal", "roll"].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 text-[10px] text-stone-500">
          Trigger
          <select
            className={inputClass}
            value={block.data.animationTrigger ?? "once"}
            onChange={(event) =>
              onChangeContent(
                updateBlock(content, target.blockIndex, {
                  animationTrigger: event.target.value as "once" | "always",
                })
              )
            }
          >
            {["once", "always"].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <button
          className="mt-3 w-full rounded-full border border-stone-200 px-3 py-1 text-[10px] font-semibold text-stone-700"
          onClick={() =>
            onChangeContent(
              updateBlock(content, target.blockIndex, {
                animationPlayId: (block.data.animationPlayId ?? 0) + 1,
              })
            )
          }
        >
          Play animation
        </button>
      </div>
    );
  }

  if (target.kind === "logo") {
    const block = content.blocks[target.blockIndex];
    if (!block) {
      return null;
    }

    const renderLinkControls = (
      enabled: boolean,
      url: string,
      onToggle: (next: boolean) => void,
      onUrl: (next: string) => void
    ) => (
      <div className="mt-4 space-y-2">
        <label className="flex items-center gap-2 text-[10px] text-stone-500">
          <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
          Enable link
        </label>
        {enabled ? (
          <label className="text-[10px] text-stone-500">
            Link URL
            <input
              className={inputClass}
              value={url}
              onChange={(e) => onUrl(e.target.value)}
              placeholder="https://..."
            />
          </label>
        ) : null}
      </div>
    );

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
        <label className="mt-3 flex items-center gap-2 text-[10px] text-stone-500">
          <input
            type="checkbox"
            checked={globals.showLogoBox ?? true}
            onChange={(event) =>
              onChangeGlobals({ ...globals, showLogoBox: event.target.checked })
            }
          />
          Show logo ring
        </label>
        {children}
      </div>
    );

    if (target.scope === "left" && block.type === "triple-media") {
      const scale = block.data.leftLogoScale ?? 1;
      const boxScale = block.data.leftLogoBoxScale ?? 1;
      const x = block.data.leftLogoX ?? 0;
      const y = block.data.leftLogoY ?? 0;

      return withModal(
        baseCard(
          <div className="mt-3 space-y-3">
          <label className="text-[10px] text-stone-500">
            Logo size ({scale.toFixed(2)})
            <input
              className={rangeClass}
              type="range"
              min={0.3}
              max={8}
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
              max={8}
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
              min={-100}
              max={100}
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
              min={-100}
              max={100}
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
          {renderLinkControls(
            block.data.leftLogoLinkEnabled ?? false,
            block.data.leftLogoLinkUrl ?? "",
            (next) =>
              onChangeContent(
                updateBlock(content, target.blockIndex, {
                  leftLogoLinkEnabled: next,
                })
              ),
            (next) =>
              onChangeContent(
                updateBlock(content, target.blockIndex, {
                  leftLogoLinkUrl: next,
                })
              )
          )}
        </div>
        )
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

      return withModal(
        baseCard(
          <div className="mt-3 space-y-3">
          <label className="text-[10px] text-stone-500">
            Logo size ({scale.toFixed(2)})
            <input
              className={rangeClass}
              type="range"
              min={0.3}
              max={8}
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
              max={8}
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
              min={-100}
              max={100}
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
              min={-100}
              max={100}
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
          {renderLinkControls(
            block.data.logoLinkEnabled ?? false,
            block.data.logoLinkUrl ?? "",
            (next) =>
              onChangeContent(
                updateBlock(content, target.blockIndex, {
                  logoLinkEnabled: next,
                })
              ),
            (next) =>
              onChangeContent(
                updateBlock(content, target.blockIndex, {
                  logoLinkUrl: next,
                })
              )
          )}
        </div>
        )
      );
    }

    return null;
  }

  if (target.kind === "media") {
    if (
      target.scope === "aboutHeroImage" ||
      target.scope === "aboutHeroLogo" ||
      target.scope === "aboutSectionMedia"
    ) {
      const about = { ...defaultAboutContent, ...(content.about ?? {}) };
      const updateAbout = (next: typeof about) =>
        onChangeContent({ ...content, about: next });
      const isSection = target.scope === "aboutSectionMedia";
      const section =
        isSection && typeof target.blockIndex === "number"
          ? about.sections[target.blockIndex]
          : null;
      if (isSection && !section) return null;

      const label =
        target.scope === "aboutHeroImage"
          ? "About hero image"
          : target.scope === "aboutHeroLogo"
            ? "About hero logo"
            : "About section media";
      const mediaUrl = isSection
        ? section?.mediaUrl ?? ""
        : target.scope === "aboutHeroLogo"
          ? about.heroLogoUrl
          : about.heroImageUrl;
      const mediaType = isSection ? section?.mediaType ?? "image" : "image";
      const accept =
        target.scope === "aboutHeroLogo"
          ? "image/*"
          : mediaType === "video"
            ? "video/*"
            : "image/*";

      return withModal(
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <p className={labelClass}>{label}</p>
            {onClear ? (
              <button
                className="text-[10px] uppercase tracking-[0.2em] text-stone-400"
                onClick={onClear}
              >
                Clear
              </button>
            ) : null}
          </div>
          <label className="mt-3 text-[10px] text-stone-500">
            Media URL
            <input
              className={inputClass}
              value={mediaUrl}
              onChange={(event) => {
                const nextUrl = event.target.value;
                if (isSection && section) {
                  const nextSections = about.sections.map((item, index) =>
                    index === target.blockIndex ? { ...item, mediaUrl: nextUrl } : item
                  );
                  updateAbout({ ...about, sections: nextSections });
                  return;
                }
                if (target.scope === "aboutHeroLogo") {
                  updateAbout({ ...about, heroLogoUrl: nextUrl });
                  return;
                }
                updateAbout({ ...about, heroImageUrl: nextUrl });
              }}
            />
          </label>
          {isSection ? (
            <label className="mt-3 text-[10px] text-stone-500">
              Media type
              <select
                className={inputClass}
                value={mediaType}
                onChange={(event) => {
                  if (!section) return;
                  const nextSections = about.sections.map((item, index) =>
                    index === target.blockIndex
                      ? { ...item, mediaType: event.target.value as "image" | "video" }
                      : item
                  );
                  updateAbout({ ...about, sections: nextSections });
                }}
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </label>
          ) : null}
          <div className="mt-3">
            <p className="text-[10px] text-stone-500">Upload media</p>
            <input
              ref={mediaUploadInputRef}
              className="hidden"
              type="file"
              accept={accept}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  handleUpload(file, (url) => {
                    if (isSection && section) {
                      const nextSections = about.sections.map((item, index) =>
                        index === target.blockIndex ? { ...item, mediaUrl: url } : item
                      );
                      updateAbout({ ...about, sections: nextSections });
                      return;
                    }
                    if (target.scope === "aboutHeroLogo") {
                      updateAbout({ ...about, heroLogoUrl: url });
                      return;
                    }
                    updateAbout({ ...about, heroImageUrl: url });
                  });
                }
                if (mediaUploadInputRef.current) {
                  mediaUploadInputRef.current.value = "";
                }
              }}
            />
            <button
              type="button"
              className="mt-2 inline-flex items-center rounded-full border border-stone-200 bg-stone-900 px-4 py-2 text-[11px] font-semibold text-white shadow-sm"
              onClick={() => mediaUploadInputRef.current?.click()}
            >
              Upload media
            </button>
          </div>
          {uploading ? (
            <div className="mt-2 space-y-1">
              <p className="text-[10px] text-stone-400">Uploading...</p>
              <div className="h-1 w-full overflow-hidden rounded-full bg-stone-200">
                <div
                  className={`h-full ${
                    uploadProgress === 100 ? "bg-amber-500" : "bg-stone-400 animate-pulse"
                  }`}
                  style={{ width: `${uploadProgress ?? 35}%` }}
                />
              </div>
            </div>
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
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-stone-200 bg-white p-2">
                <div className="grid grid-cols-4 gap-2">
                  {assets
                    .filter((asset) =>
                      target.scope === "aboutHeroLogo"
                        ? isImageUrl(asset.url)
                        : mediaType === "video"
                          ? isVideoUrl(asset.url)
                          : isImageUrl(asset.url)
                    )
                    .map((asset) => (
                      <button
                        key={asset.url}
                        className="group relative h-16 w-full overflow-hidden rounded-lg border border-stone-200 bg-white"
                        onClick={() => {
                          if (isSection && section) {
                            const nextSections = about.sections.map((item, index) =>
                              index === target.blockIndex ? { ...item, mediaUrl: asset.url } : item
                            );
                            updateAbout({ ...about, sections: nextSections });
                            return;
                          }
                          if (target.scope === "aboutHeroLogo") {
                            updateAbout({ ...about, heroLogoUrl: asset.url });
                            return;
                          }
                          updateAbout({ ...about, heroImageUrl: asset.url });
                        }}
                        onMouseEnter={(event) =>
                          handlePreviewEnter(event, asset, isVideoUrl(asset.url) ? "video" : "image")
                        }
                        onMouseMove={handlePreviewMove}
                        onMouseLeave={handlePreviewLeave}
                      >
                        {isVideoUrl(asset.url) ? (
                          <video className="h-full w-full object-cover" src={asset.url} />
                        ) : (
                          <img className="h-full w-full object-cover" src={asset.url} alt="" />
                        )}
                      </button>
                    ))}
                </div>
              </div>
            )}
            <button
              className="mt-3 w-full rounded-full border border-stone-200 px-3 py-1 text-[10px] font-semibold text-stone-700"
              onClick={() => setLibraryExpanded(true)}
              type="button"
            >
              Open full media library
            </button>
          </div>
          {target.scope === "aboutHeroLogo" ? (
            <div className="mt-4 space-y-3">
              <label className="text-[10px] text-stone-500">
                Scale ({(about.heroLogoScale ?? 1).toFixed(2)})
                <input
                  className={rangeClass}
                  type="range"
                  min={0.4}
                  max={8}
                  step={0.05}
                  value={about.heroLogoScale ?? 1}
                  onChange={(event) =>
                    updateAbout({
                      ...about,
                      heroLogoScale: Number(event.target.value),
                    })
                  }
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-[10px] text-stone-500">
                  X ({Math.round(about.heroLogoX ?? 0)}px)
                  <input
                    className={rangeClass}
                    type="range"
                    min={-200}
                    max={200}
                    step={1}
                    value={about.heroLogoX ?? 0}
                    onChange={(event) =>
                      updateAbout({
                        ...about,
                        heroLogoX: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label className="text-[10px] text-stone-500">
                  Y ({Math.round(about.heroLogoY ?? 0)}px)
                  <input
                    className={rangeClass}
                    type="range"
                    min={-200}
                    max={200}
                    step={1}
                    value={about.heroLogoY ?? 0}
                    onChange={(event) =>
                      updateAbout({
                        ...about,
                        heroLogoY: Number(event.target.value),
                      })
                    }
                  />
                </label>
              </div>
            </div>
          ) : null}
        </div>
      );
    }
    if (target.scope === "careerHeroImage") {
      const career = content.career ?? defaultCareerContent;
      return withModal(
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <p className={labelClass}>Career hero image</p>
            {onClear ? (
              <button
                className="text-[10px] uppercase tracking-[0.2em] text-stone-400"
                onClick={onClear}
              >
                Clear
              </button>
            ) : null}
          </div>
          <label className="mt-3 text-[10px] text-stone-500">
            Image URL
            <input
              className={inputClass}
              value={career.heroImageUrl}
              onChange={(event) =>
                onChangeContent({
                  ...content,
                  career: { ...career, heroImageUrl: event.target.value },
                })
              }
            />
          </label>
          <div className="mt-3">
            <p className="text-[10px] text-stone-500">Upload image</p>
            <input
              ref={careerImageUploadInputRef}
              className="hidden"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  handleUpload(file, (url) =>
                    onChangeContent({
                      ...content,
                      career: { ...career, heroImageUrl: url },
                    })
                  );
                }
                if (careerImageUploadInputRef.current) {
                  careerImageUploadInputRef.current.value = "";
                }
              }}
            />
            <button
              type="button"
              className="mt-2 inline-flex items-center rounded-full border border-stone-200 bg-stone-900 px-4 py-2 text-[11px] font-semibold text-white shadow-sm"
              onClick={() => careerImageUploadInputRef.current?.click()}
            >
              Upload image
            </button>
          </div>
          <div className="mt-4">
            <p className="text-[10px] text-stone-500">
              Desaturate ({Math.round((career.heroImageDesaturate ?? 0) * 100)}%)
            </p>
            <input
              className={rangeClass}
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={career.heroImageDesaturate ?? 0}
              onChange={(event) =>
                onChangeContent({
                  ...content,
                  career: {
                    ...career,
                    heroImageDesaturate: Number(event.target.value),
                  },
                })
              }
            />
          </div>
          {uploading ? (
            <div className="mt-2 space-y-1">
              <p className="text-[10px] text-stone-400">Uploading...</p>
              <div className="h-1 w-full overflow-hidden rounded-full bg-stone-200">
                <div
                  className={`h-full ${
                    uploadProgress === 100 ? "bg-amber-500" : "bg-stone-400 animate-pulse"
                  }`}
                  style={{ width: `${uploadProgress ?? 35}%` }}
                />
              </div>
            </div>
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
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-stone-200 bg-white p-2">
                <div className="grid grid-cols-4 gap-2">
                  {assets.filter((asset) => isImageUrl(asset.url)).map((asset) => (
                    <button
                      key={asset.url}
                      className="group relative h-16 w-full overflow-hidden rounded-lg border border-stone-200 bg-white"
                      onClick={() =>
                        onChangeContent({
                          ...content,
                          career: { ...career, heroImageUrl: asset.url },
                        })
                      }
                      onMouseEnter={(event) => handlePreviewEnter(event, asset, "image")}
                      onMouseMove={handlePreviewMove}
                      onMouseLeave={handlePreviewLeave}
                    >
                      <img className="h-full w-full object-cover" src={asset.url} alt="" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              className="mt-3 w-full rounded-full border border-stone-200 px-3 py-1 text-[10px] font-semibold text-stone-700"
              onClick={() => setLibraryExpanded(true)}
              type="button"
            >
              View library
            </button>
          </div>
        </div>
      );
    }

    const block = content.blocks[target.blockIndex];
    if (!block) {
      return null;
    }

    if (target.scope === "heroVideo" && block.type === "hero") {
      const videoX = block.data.videoX ?? 50;
      const videoY = block.data.videoY ?? 50;
      const videoScale = block.data.videoScale ?? 1;
      const desaturate = block.data.videoDesaturate ?? 0.6;
      return withModal(
        <>
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
          <div className="mt-3">
            <p className="text-[10px] text-stone-500">Upload video</p>
            <input
              ref={heroUploadInputRef}
              className="hidden"
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
                if (heroUploadInputRef.current) heroUploadInputRef.current.value = "";
              }}
            />
            <button
              type="button"
              className="mt-2 inline-flex items-center rounded-full border border-stone-200 bg-stone-900 px-4 py-2 text-[11px] font-semibold text-white shadow-sm"
              onClick={() => heroUploadInputRef.current?.click()}
            >
              Upload video
            </button>
          </div>
          {uploading ? (
            <div className="mt-2 space-y-1">
              <p className="text-[10px] text-stone-400">Uploading...</p>
              <div className="h-1 w-full overflow-hidden rounded-full bg-stone-200">
                <div
                  className={`h-full ${
                    uploadProgress === 100 ? "bg-amber-500" : "bg-stone-400 animate-pulse"
                  }`}
                  style={{ width: `${uploadProgress ?? 35}%` }}
                />
              </div>
            </div>
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
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-stone-200 bg-white p-2">
                <div className="grid grid-cols-4 gap-2">
                {assets.filter((asset) => isVideoUrl(asset.url)).map((asset) => (
                  <button
                    key={asset.url}
                    className="group relative h-16 w-full rounded-lg border border-stone-200 bg-white"
                    onClick={() =>
                      onChangeContent(
                        updateBlock(content, target.blockIndex, { videoUrl: asset.url })
                      )
                    }
                    onMouseEnter={(event) => handlePreviewEnter(event, asset, "video")}
                    onMouseMove={handlePreviewMove}
                    onMouseLeave={handlePreviewLeave}
                  >
                    <div className="h-full w-full overflow-hidden rounded-lg">
                      <video className="h-full w-full object-cover" src={asset.url} muted />
                    </div>
                  </button>
                ))}
                </div>
              </div>
            )}
            <button
              className="mt-3 w-full rounded-full border border-stone-200 px-3 py-1 text-[10px] font-semibold text-stone-700"
              onClick={() => setLibraryExpanded(true)}
              type="button"
            >
              View library
            </button>
          </div>
          <div className="mt-4 border-t border-stone-200 pt-4">
            <p className={labelClass}>Hero image (used if no video)</p>
            <label className="mt-3 text-[10px] text-stone-500">
              Image URL
              <input
                className={inputClass}
                value={block.data.imageUrl ?? ""}
                onChange={(event) =>
                  onChangeContent(
                    updateBlock(content, target.blockIndex, { imageUrl: event.target.value })
                  )
                }
              />
            </label>
            <div className="mt-3">
              <p className="text-[10px] text-stone-500">Upload image</p>
              <input
                ref={heroImageUploadInputRef}
                className="hidden"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    handleUpload(file, (url) =>
                      onChangeContent(
                        updateBlock(content, target.blockIndex, { imageUrl: url })
                      )
                    );
                  }
                  if (heroImageUploadInputRef.current) {
                    heroImageUploadInputRef.current.value = "";
                  }
                }}
              />
              <button
                type="button"
                className="mt-2 inline-flex items-center rounded-full border border-stone-200 bg-white px-4 py-2 text-[11px] font-semibold text-stone-700 shadow-sm"
                onClick={() => heroImageUploadInputRef.current?.click()}
              >
                Upload image
              </button>
            </div>
            <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-stone-200 bg-white p-2">
              <div className="grid grid-cols-4 gap-2">
                {assets
                  .filter((asset) => !isVideoUrl(asset.url))
                  .map((asset) => (
                    <button
                      key={asset.url}
                      className="group relative h-16 w-full rounded-lg border border-stone-200 bg-white"
                      onClick={() =>
                        onChangeContent(
                          updateBlock(content, target.blockIndex, { imageUrl: asset.url })
                        )
                      }
                      onMouseEnter={(event) => handlePreviewEnter(event, asset, "image")}
                      onMouseMove={handlePreviewMove}
                      onMouseLeave={handlePreviewLeave}
                    >
                      <div className="h-full w-full overflow-hidden rounded-lg">
                        <img className="h-full w-full object-cover" src={asset.url} alt="" />
                      </div>
                    </button>
                  ))}
              </div>
            </div>
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
              max={8}
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
          <div className="mt-3 space-y-2">
            <label className="flex items-center gap-2 text-[10px] text-stone-500">
              <input
                type="checkbox"
                checked={block.data.videoLinkEnabled ?? false}
                onChange={(event) =>
                  onChangeContent(
                    updateBlock(content, target.blockIndex, {
                      videoLinkEnabled: event.target.checked,
                    })
                  )
                }
              />
              Enable link
            </label>
            {block.data.videoLinkEnabled ? (
              <label className="text-[10px] text-stone-500">
                Link URL
                <input
                  className={inputClass}
                  value={block.data.videoLinkUrl ?? ""}
                  onChange={(event) =>
                    onChangeContent(
                      updateBlock(content, target.blockIndex, {
                        videoLinkUrl: event.target.value,
                      })
                    )
                  }
                  placeholder="https://..."
                />
              </label>
            ) : null}
          </div>
          </div>
          {previewTooltip}
        </>
      );
    }

    if (target.scope === "heroImage" && block.type === "hero") {
      const imageX = block.data.imageX ?? block.data.videoX ?? 50;
      const imageY = block.data.imageY ?? block.data.videoY ?? 50;
      const imageScale = block.data.imageScale ?? block.data.videoScale ?? 1;
      return withModal(
        <>
          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <p className={labelClass}>Hero image</p>
              {onClear ? (
                <button
                  className="text-[10px] uppercase tracking-[0.2em] text-stone-400"
                  onClick={onClear}
                >
                  Clear
                </button>
              ) : null}
            </div>
            <label className="mt-3 text-[10px] text-stone-500">
              Image URL
              <input
                className={inputClass}
                value={block.data.imageUrl ?? ""}
                onChange={(event) =>
                  onChangeContent(
                    updateBlock(content, target.blockIndex, { imageUrl: event.target.value })
                  )
                }
              />
            </label>
            <div className="mt-3">
              <p className="text-[10px] text-stone-500">Upload image</p>
              <input
                ref={heroImageUploadInputRef}
                className="hidden"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    handleUpload(file, (url) =>
                      onChangeContent(
                        updateBlock(content, target.blockIndex, { imageUrl: url })
                      )
                    );
                  }
                  if (heroImageUploadInputRef.current) {
                    heroImageUploadInputRef.current.value = "";
                  }
                }}
              />
              <button
                type="button"
                className="mt-2 inline-flex items-center rounded-full border border-stone-200 bg-stone-900 px-4 py-2 text-[11px] font-semibold text-white shadow-sm"
                onClick={() => heroImageUploadInputRef.current?.click()}
              >
                Upload image
              </button>
            </div>
            {uploading ? (
              <div className="mt-2 space-y-1">
                <p className="text-[10px] text-stone-400">Uploading...</p>
                <div className="h-1 w-full overflow-hidden rounded-full bg-stone-200">
                  <div
                    className={`h-full ${
                      uploadProgress === 100
                        ? "bg-amber-500"
                        : "bg-stone-400 animate-pulse"
                    }`}
                    style={{ width: `${uploadProgress ?? 35}%` }}
                  />
                </div>
              </div>
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
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-stone-200 bg-white p-2">
                  <div className="grid grid-cols-4 gap-2">
                    {assets
                      .filter((asset) => !isVideoUrl(asset.url))
                      .map((asset) => (
                        <button
                          key={asset.url}
                          className="group relative h-16 w-full rounded-lg border border-stone-200 bg-white"
                          onClick={() =>
                            onChangeContent(
                              updateBlock(content, target.blockIndex, { imageUrl: asset.url })
                            )
                          }
                          onMouseEnter={(event) => handlePreviewEnter(event, asset, "image")}
                          onMouseMove={handlePreviewMove}
                          onMouseLeave={handlePreviewLeave}
                        >
                          <div className="h-full w-full overflow-hidden rounded-lg">
                            <img className="h-full w-full object-cover" src={asset.url} alt="" />
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
              <button
                className="mt-3 w-full rounded-full border border-stone-200 px-3 py-1 text-[10px] font-semibold text-stone-700"
                onClick={() => setLibraryExpanded(true)}
                type="button"
              >
                View library
              </button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-[10px] text-stone-500">
                X ({imageX}%)
                <input
                  className={rangeClass}
                  type="range"
                  min={0}
                  max={100}
                  value={imageX}
                  onChange={(event) =>
                    onChangeContent(
                      updateBlock(content, target.blockIndex, {
                        imageX: Number(event.target.value),
                      })
                    )
                  }
                />
              </label>
              <label className="text-[10px] text-stone-500">
                Y ({imageY}%)
                <input
                  className={rangeClass}
                  type="range"
                  min={0}
                  max={100}
                  value={imageY}
                  onChange={(event) =>
                    onChangeContent(
                      updateBlock(content, target.blockIndex, {
                        imageY: Number(event.target.value),
                      })
                    )
                  }
                />
              </label>
            </div>
            <label className="mt-3 text-[10px] text-stone-500">
              Scale ({imageScale.toFixed(2)})
              <input
                className={rangeClass}
                type="range"
                min={0.6}
                max={8}
                step={0.02}
                value={imageScale}
                onChange={(event) =>
                  onChangeContent(
                    updateBlock(content, target.blockIndex, {
                      imageScale: Number(event.target.value),
                    })
                  )
                }
              />
            </label>
          </div>
        </>
      );
    }

    const media: MediaAsset | null =
      target.scope === "middleMedia" && block.type === "triple-media"
        ? block.data.middleMedia
        : target.scope === "rightMedia" && block.type === "triple-media"
          ? block.data.rightMedia
          : target.scope === "landscapeMedia" && block.type === "landscape"
            ? block.data.media
            : target.scope === "brandTopImage" && block.type === "brand-message"
              ? {
                  url: block.data.topImageUrl ?? "",
                  alt: block.data.topImageAlt ?? "",
                  type: "image",
                  x: 50,
                  y: 50,
                  scale: 1,
                  linkEnabled: block.data.topImageLinkEnabled,
                  linkUrl: block.data.topImageLinkUrl,
                }
              : target.scope === "brandBgVideo" && block.type === "brand-message"
                ? {
                    url: block.data.bgVideoUrl ?? "",
                    alt: "Background video",
                    type: "video",
                    x: block.data.bgVideoX ?? 50,
                    y: block.data.bgVideoY ?? 50,
                    scale: block.data.bgVideoScale ?? 1,
                    linkEnabled: false,
                    linkUrl: "",
                  }
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
      } else if (target.scope === "brandTopImage" && block.type === "brand-message") {
        onChangeContent(
          updateBlock(content, target.blockIndex, {
            topImageUrl: next.url,
            topImageAlt: next.alt,
            topImageLinkEnabled: next.linkEnabled,
            topImageLinkUrl: next.linkUrl,
          })
        );
      } else if (target.scope === "brandBgVideo" && block.type === "brand-message") {
        onChangeContent(
          updateBlock(content, target.blockIndex, {
            bgVideoUrl: next.url,
            bgVideoX: next.x,
            bgVideoY: next.y,
            bgVideoScale: next.scale,
          })
        );
      }
    };

    return withModal(
      <>
        <div className={cardClass}>
        <div className="flex items-center justify-between">
          <p className={labelClass}>
            {target.scope === "middleMedia"
              ? "Media photo"
              : target.scope === "rightMedia"
                ? "Media video"
                : target.scope === "landscapeMedia"
                  ? "Landscape image"
                  : target.scope === "brandTopImage"
                    ? "Brand image"
                    : "Brand background video"}
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
        <div className="mt-3">
          <p className="text-[10px] text-stone-500">Upload {media.type}</p>
          <input
            ref={mediaUploadInputRef}
            className="hidden"
            type="file"
            accept={media.type === "video" ? "video/*" : "image/*"}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                handleUpload(file, (url) => updateMedia({ ...media, url }));
              }
              if (mediaUploadInputRef.current) mediaUploadInputRef.current.value = "";
            }}
          />
          <button
            type="button"
            className="mt-2 inline-flex items-center rounded-full border border-stone-200 bg-stone-900 px-4 py-2 text-[11px] font-semibold text-white shadow-sm"
            onClick={() => mediaUploadInputRef.current?.click()}
          >
            Upload {media.type}
          </button>
        </div>
        {uploading ? (
          <div className="mt-2 space-y-1">
            <p className="text-[10px] text-stone-400">Uploading...</p>
            <div className="h-1 w-full overflow-hidden rounded-full bg-stone-200">
              <div
                className={`h-full ${
                  uploadProgress === 100 ? "bg-amber-500" : "bg-stone-400 animate-pulse"
                }`}
                style={{ width: `${uploadProgress ?? 35}%` }}
              />
            </div>
          </div>
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
          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
            <input
              className={inputClass}
              placeholder="Search media..."
              value={librarySearch}
              onChange={(event) => setLibrarySearch(event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {[
                ["all", "All"],
                ["15m", "15m"],
                ["1h", "1h"],
                ["1d", "1d"],
                ["1w", "1w"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                    libraryFilter === value
                      ? "border-amber-300 bg-amber-200 text-stone-900"
                      : "border-stone-200 text-stone-500"
                  }`}
                  onClick={() => setLibraryFilter(value as typeof libraryFilter)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
            {loadingAssets ? (
              <p className="mt-2 text-[10px] text-stone-400">Loading...</p>
            ) : assetError ? (
              <p className="mt-2 text-[10px] text-red-500">{assetError}</p>
            ) : (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-stone-200 bg-white p-2">
                <div className="grid grid-cols-4 gap-2">
                {(target.scope === "brandBgVideo"
                  ? scopedAssets
                  : scopedAssets.filter((asset) =>
                      media.type === "video" ? isVideoUrl(asset.url) : !isVideoUrl(asset.url)
                    )
                ).map((asset) => {
                  const isActive = currentMediaUrl === asset.url;
                  return (
                    <button
                      key={asset.url}
                      className={`group relative h-16 w-full rounded-lg border bg-white ${
                        isActive ? "border-amber-400 ring-2 ring-amber-200" : "border-stone-200"
                      }`}
                      onClick={() => updateMedia({ ...media, url: asset.url })}
                      onMouseEnter={(event) =>
                        handlePreviewEnter(
                          event,
                          asset,
                          isVideoUrl(asset.url) ? "video" : "image"
                        )
                      }
                      onMouseMove={handlePreviewMove}
                      onMouseLeave={handlePreviewLeave}
                    >
                      {isActive ? (
                        <span className="absolute right-1 top-1 rounded-full bg-amber-200 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-900">
                          Current
                        </span>
                      ) : null}
                      <div className="h-full w-full overflow-hidden rounded-lg">
                        {isVideoUrl(asset.url) ? (
                          <video className="h-full w-full object-cover" src={asset.url} muted />
                        ) : (
                          <img className="h-full w-full object-cover" src={asset.url} alt="" />
                        )}
                      </div>
                    </button>
                  );
                })}
                </div>
              </div>
            )}
          </div>
          <button
            className="mt-3 w-full rounded-full border border-stone-200 px-3 py-1 text-[10px] font-semibold text-stone-700"
            onClick={() => setLibraryExpanded(true)}
            type="button"
          >
            View library
          </button>
        {target.scope !== "brandBgVideo" ? (
          <label className="mt-3 text-[10px] text-stone-500">
            Alt text
            <input
              className={inputClass}
              value={media.alt}
              onChange={(event) => updateMedia({ ...media, alt: event.target.value })}
            />
          </label>
        ) : null}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-[10px] text-stone-500">
            X ({media.x}%)
            <input
              className={rangeClass}
              type="range"
              min={-50}
              max={150}
              value={media.x}
              onChange={(event) => updateMedia({ ...media, x: Number(event.target.value) })}
            />
          </label>
          <label className="text-[10px] text-stone-500">
            Y ({media.y}%)
            <input
              className={rangeClass}
              type="range"
              min={-50}
              max={150}
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
            max={8}
            step={0.02}
            value={media.scale}
            onChange={(event) => updateMedia({ ...media, scale: Number(event.target.value) })}
          />
        </label>
        {target.scope === "brandBgVideo" && block.type === "brand-message" ? (
          <div className="mt-3 space-y-3">
            <label className="flex items-center gap-2 text-[10px] text-stone-500">
              <input
                type="checkbox"
                checked={block.data.showBgVideo ?? false}
                onChange={(event) =>
                  onChangeContent(
                    updateBlock(content, target.blockIndex, {
                      showBgVideo: event.target.checked,
                    })
                  )
                }
              />
              Show background video
            </label>
            <label className="text-[10px] text-stone-500">
              Opacity ({(block.data.bgVideoOpacity ?? 0.4).toFixed(2)})
              <input
                className={rangeClass}
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={block.data.bgVideoOpacity ?? 0.4}
                onChange={(event) =>
                  onChangeContent(
                    updateBlock(content, target.blockIndex, {
                      bgVideoOpacity: Number(event.target.value),
                    })
                  )
                }
              />
            </label>
            <label className="text-[10px] text-stone-500">
              Feather ({(block.data.bgVideoFeather ?? 0.12).toFixed(2)})
              <input
                className={rangeClass}
                type="range"
                min={0}
                max={0.4}
                step={0.01}
                value={block.data.bgVideoFeather ?? 0.12}
                onChange={(event) =>
                  onChangeContent(
                    updateBlock(content, target.blockIndex, {
                      bgVideoFeather: Number(event.target.value),
                    })
                  )
                }
              />
            </label>
            <label className="text-[10px] text-stone-500">
              Desaturate ({(block.data.bgVideoDesaturate ?? 0.4).toFixed(2)})
              <input
                className={rangeClass}
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={block.data.bgVideoDesaturate ?? 0.4}
                onChange={(event) =>
                  onChangeContent(
                    updateBlock(content, target.blockIndex, {
                      bgVideoDesaturate: Number(event.target.value),
                    })
                  )
                }
              />
            </label>
          </div>
        ) : null}
        {target.scope !== "brandBgVideo" ? (
          <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2 text-[10px] text-stone-500">
            <input
              type="checkbox"
              checked={media.linkEnabled ?? false}
              onChange={(event) =>
                updateMedia({ ...media, linkEnabled: event.target.checked })
              }
            />
            Enable link
          </label>
          {media.linkEnabled ? (
            <label className="text-[10px] text-stone-500">
              Link URL
              <input
                className={inputClass}
                value={media.linkUrl ?? ""}
                onChange={(event) => updateMedia({ ...media, linkUrl: event.target.value })}
                placeholder="https://..."
              />
            </label>
          ) : null}
        </div>
        ) : null}
        </div>
        {previewTooltip}
      </>
    );
  }

  if (target.kind === "container") {
    const career = { ...defaultCareerContent, ...(content.career ?? {}) };
    const isApply = target.scope === "careerApplyCard";
    const bgColor = isApply ? career.applyCardBgColor : career.formCardBgColor;
    const bgOpacity = isApply ? career.applyCardBgOpacity : career.formCardBgOpacity;
    const textColor = isApply ? career.applyCardTextColor : career.formCardTextColor;
    const onUpdate = (patch: Partial<typeof career>) =>
      onChangeContent({ ...content, career: { ...career, ...patch } });
    return (
      <div className={cardClass}>
        <p className={labelClass}>{isApply ? "Apply card" : "Form card"} styles</p>
        <label className="mt-3 text-[10px] text-stone-500">
          Background color
          <input
            className={inputClass}
            type="color"
            value={bgColor}
            onChange={(event) =>
              onUpdate({
                [isApply ? "applyCardBgColor" : "formCardBgColor"]: event.target.value,
              })
            }
          />
        </label>
        <label className="mt-3 text-[10px] text-stone-500">
          Background opacity ({Math.round(bgOpacity * 100)}%)
          <input
            className={rangeClass}
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={bgOpacity}
            onChange={(event) =>
              onUpdate({
                [isApply ? "applyCardBgOpacity" : "formCardBgOpacity"]: Number(
                  event.target.value
                ),
              })
            }
          />
        </label>
        <label className="mt-3 text-[10px] text-stone-500">
          Text color
          <input
            className={inputClass}
            type="color"
            value={textColor}
            onChange={(event) =>
              onUpdate({
                [isApply ? "applyCardTextColor" : "formCardTextColor"]: event.target.value,
              })
            }
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
          : target.scope === "careerHeroEyebrow"
            ? "Career eyebrow"
            : target.scope === "careerHeroHeadline"
              ? "Career headline"
              : target.scope === "careerHeroBody"
                ? "Career body"
                : target.scope === "careerRolesHeading"
                  ? "Roles heading"
                  : target.scope === "careerRolesEmpty"
                    ? "Roles empty text"
                    : target.scope === "careerApplyHeading"
                      ? "Apply heading"
        : target.scope === "careerApplyBody"
          ? "Apply body"
          : target.scope === "careerApplyButton"
            ? "Apply button"
            : target.scope === "aboutHeroTitle"
              ? "About hero title"
              : target.scope === "aboutHeroBody"
                ? "About hero body"
                : target.scope === "aboutSectionTitle"
                  ? "About section title"
                  : target.scope === "aboutSectionHeading"
                    ? "Section heading"
                    : target.scope === "aboutSectionBody"
                      ? "Section body"
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
                    : target.scope === "footerLead"
                      ? "Footer lead"
                      : "Footer text";

    const multiline =
      target.scope === "brandMessage" ||
      target.scope === "leftBody" ||
      target.scope === "caption" ||
      target.scope === "careerHeroBody" ||
      target.scope === "careerApplyBody" ||
      target.scope === "careerRolesEmpty" ||
      target.scope === "aboutHeroBody" ||
      target.scope === "aboutSectionBody";

    const visibilityControl = (() => {
      if (target.scope === "logoText") {
        const visible = globals.showLogoText ?? true;
        return (
          <label className="flex items-center gap-2 text-[10px] text-stone-500">
            <input
              type="checkbox"
              checked={visible}
              onChange={(event) =>
                onChangeGlobals({ ...globals, showLogoText: event.target.checked })
              }
            />
            Show logo text
          </label>
        );
      }
      if (target.scope === "tagline" && block?.type === "hero") {
        const visible = block.data.showTagline ?? true;
        return (
          <label className="flex items-center gap-2 text-[10px] text-stone-500">
            <input
              type="checkbox"
              checked={visible}
              onChange={(event) =>
                onChangeContent(
                  updateBlock(content, target.blockIndex!, {
                    showTagline: event.target.checked,
                  })
                )
              }
            />
            Show hero text
          </label>
        );
      }
      if (target.scope === "brandHeading" && block?.type === "brand-message") {
        const visible = block.data.showHeading ?? true;
        return (
          <label className="flex items-center gap-2 text-[10px] text-stone-500">
            <input
              type="checkbox"
              checked={visible}
              onChange={(event) =>
                onChangeContent(
                  updateBlock(content, target.blockIndex!, {
                    showHeading: event.target.checked,
                  })
                )
              }
            />
            Show heading
          </label>
        );
      }
      if (target.scope === "brandMessage" && block?.type === "brand-message") {
        const visible = block.data.showMessage ?? true;
        return (
          <label className="flex items-center gap-2 text-[10px] text-stone-500">
            <input
              type="checkbox"
              checked={visible}
              onChange={(event) =>
                onChangeContent(
                  updateBlock(content, target.blockIndex!, {
                    showMessage: event.target.checked,
                  })
                )
              }
            />
            Show message
          </label>
        );
      }
      if (target.scope === "footerTagline" && block?.type === "footer") {
        const visible = block.data.showTagline ?? true;
        return (
          <label className="flex items-center gap-2 text-[10px] text-stone-500">
            <input
              type="checkbox"
              checked={visible}
              onChange={(event) =>
                onChangeContent(
                  updateBlock(content, target.blockIndex!, {
                    showTagline: event.target.checked,
                  })
                )
              }
            />
            Show footer text
          </label>
        );
      }
      return null;
    })();

    let value = "";
    let style: TextStyle | undefined;
    let placeholder = "";
    let onValueChange: (next: string) => void = () => {};
    let onStyleChange: (next: TextStyle) => void = () => {};
    let linkEnabled = false;
    let linkUrl = "";
    let onLinkEnabledChange: (next: boolean) => void = () => {};
    let onLinkUrlChange: (next: string) => void = () => {};

    if (target.scope === "logoText") {
      value = globals.logoText;
      style = globals.logoTextStyle;
      onValueChange = (next) => onChangeGlobals({ ...globals, logoText: next });
      onStyleChange = (next) => onChangeGlobals({ ...globals, logoTextStyle: next });
      linkEnabled = globals.logoTextLinkEnabled ?? false;
      linkUrl = globals.logoTextLinkUrl ?? "";
      onLinkEnabledChange = (next) =>
        onChangeGlobals({ ...globals, logoTextLinkEnabled: next });
      onLinkUrlChange = (next) => onChangeGlobals({ ...globals, logoTextLinkUrl: next });
    } else if (target.scope === "tagline" && block?.type === "hero") {
      value = block.data.tagline;
      style = block.data.taglineStyle;
      onValueChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { tagline: next }));
      onStyleChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { taglineStyle: next }));
      linkEnabled = block.data.taglineLinkEnabled ?? false;
      linkUrl = block.data.taglineLinkUrl ?? "";
      onLinkEnabledChange = (next) =>
        onChangeContent(
          updateBlock(content, target.blockIndex!, { taglineLinkEnabled: next })
        );
      onLinkUrlChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { taglineLinkUrl: next }));
    } else if (target.scope === "brandHeading" && block?.type === "brand-message") {
      value = block.data.heading;
      style = block.data.headingStyle;
      onValueChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { heading: next }));
      onStyleChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { headingStyle: next }));
      linkEnabled = block.data.headingLinkEnabled ?? false;
      linkUrl = block.data.headingLinkUrl ?? "";
      onLinkEnabledChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { headingLinkEnabled: next }));
      onLinkUrlChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { headingLinkUrl: next }));
    } else if (target.scope === "brandMessage" && block?.type === "brand-message") {
      value = globals.brandMessage ?? block.data.message;
      style = globals.brandMessageStyle ?? block.data.messageStyle;
      onValueChange = (next) => {
        onChangeGlobals({ ...globals, brandMessage: next });
        onChangeContent(updateBlock(content, target.blockIndex!, { message: next }));
      };
      onStyleChange = (next) => onChangeGlobals({ ...globals, brandMessageStyle: next });
      linkEnabled = block.data.messageLinkEnabled ?? false;
      linkUrl = block.data.messageLinkUrl ?? "";
      onLinkEnabledChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { messageLinkEnabled: next }));
      onLinkUrlChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { messageLinkUrl: next }));
    } else if (target.scope === "leftTitle" && block?.type === "triple-media") {
      value = block.data.leftTitle;
      style = block.data.leftTitleStyle;
      onValueChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { leftTitle: next }));
      onStyleChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { leftTitleStyle: next }));
      linkEnabled = block.data.leftTitleLinkEnabled ?? false;
      linkUrl = block.data.leftTitleLinkUrl ?? "";
      onLinkEnabledChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { leftTitleLinkEnabled: next }));
      onLinkUrlChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { leftTitleLinkUrl: next }));
    } else if (target.scope === "leftBody" && block?.type === "triple-media") {
      value = block.data.leftBody;
      style = block.data.leftBodyStyle;
      onValueChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { leftBody: next }));
      onStyleChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { leftBodyStyle: next }));
      linkEnabled = block.data.leftBodyLinkEnabled ?? false;
      linkUrl = block.data.leftBodyLinkUrl ?? "";
      onLinkEnabledChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { leftBodyLinkEnabled: next }));
      onLinkUrlChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { leftBodyLinkUrl: next }));
    } else if (target.scope === "caption" && block?.type === "landscape") {
      value = block.data.caption;
      style = block.data.captionStyle;
      onValueChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { caption: next }));
      onStyleChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { captionStyle: next }));
      linkEnabled = block.data.captionLinkEnabled ?? false;
      linkUrl = block.data.captionLinkUrl ?? "";
      onLinkEnabledChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { captionLinkEnabled: next }));
      onLinkUrlChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { captionLinkUrl: next }));
    } else if (target.scope === "footerTagline" && block?.type === "footer") {
      value = block.data.tagline;
      style = block.data.taglineStyle;
      onValueChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { tagline: next }));
      onStyleChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { taglineStyle: next }));
      linkEnabled = block.data.taglineLinkEnabled ?? false;
      linkUrl = block.data.taglineLinkUrl ?? "";
      onLinkEnabledChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { taglineLinkEnabled: next }));
      onLinkUrlChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { taglineLinkUrl: next }));
    } else if (target.scope === "footerLead" && block?.type === "footer") {
      value = block.data.leadText ?? "";
      style = block.data.leadStyle;
      placeholder = block.data.leadPlaceholder ?? "";
      onValueChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { leadText: next }));
      onStyleChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { leadStyle: next }));
    } else if (target.scope === "footerButton" && block?.type === "footer") {
      value = block.data.leadButtonText ?? "";
      style = block.data.leadButtonStyle;
      placeholder = "Join";
      onValueChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { leadButtonText: next }));
      onStyleChange = (next) =>
        onChangeContent(updateBlock(content, target.blockIndex!, { leadButtonStyle: next }));
    } else if (target.scope.startsWith("about")) {
      const about = { ...defaultAboutContent, ...(content.about ?? {}) };
      const updateAbout = (next: typeof about) =>
        onChangeContent({ ...content, about: next });
      const sectionIndex = target.blockIndex ?? 0;
      const section = about.sections[sectionIndex];
      if (target.scope === "aboutHeroTitle") {
        value = about.heroTitle;
        onValueChange = (next) => updateAbout({ ...about, heroTitle: next });
        style = about.heroTitleStyle;
        onStyleChange = (next) => updateAbout({ ...about, heroTitleStyle: next });
      } else if (target.scope === "aboutHeroBody") {
        value = about.heroBody;
        onValueChange = (next) => updateAbout({ ...about, heroBody: next });
        style = about.heroBodyStyle;
        onStyleChange = (next) => updateAbout({ ...about, heroBodyStyle: next });
      } else if (target.scope === "aboutSectionTitle") {
        value = about.sectionTitle;
        onValueChange = (next) => updateAbout({ ...about, sectionTitle: next });
        style = about.sectionTitleStyle;
        onStyleChange = (next) => updateAbout({ ...about, sectionTitleStyle: next });
      } else if (target.scope === "aboutSectionHeading" && section) {
        value = section.heading;
        onValueChange = (next) => {
          const nextSections = about.sections.map((item, index) =>
            index === sectionIndex ? { ...item, heading: next } : item
          );
          updateAbout({ ...about, sections: nextSections });
        };
        style = section.headingStyle;
        onStyleChange = (next) => {
          const nextSections = about.sections.map((item, index) =>
            index === sectionIndex ? { ...item, headingStyle: next } : item
          );
          updateAbout({ ...about, sections: nextSections });
        };
      } else if (target.scope === "aboutSectionBody" && section) {
        value = section.body;
        onValueChange = (next) => {
          const nextSections = about.sections.map((item, index) =>
            index === sectionIndex ? { ...item, body: next } : item
          );
          updateAbout({ ...about, sections: nextSections });
        };
        style = section.bodyStyle;
        onStyleChange = (next) => {
          const nextSections = about.sections.map((item, index) =>
            index === sectionIndex ? { ...item, bodyStyle: next } : item
          );
          updateAbout({ ...about, sections: nextSections });
        };
      }
    } else if (target.scope.startsWith("career")) {
      const career = content.career ?? defaultCareerContent;
      if (target.scope === "careerHeroEyebrow") {
        value = career.heroEyebrow;
        onValueChange = (next) =>
          onChangeContent({ ...content, career: { ...career, heroEyebrow: next } });
        style = career.heroEyebrowStyle;
        onStyleChange = (next) =>
          onChangeContent({ ...content, career: { ...career, heroEyebrowStyle: next } });
      } else if (target.scope === "careerHeroHeadline") {
        value = career.heroHeadline;
        onValueChange = (next) =>
          onChangeContent({ ...content, career: { ...career, heroHeadline: next } });
        style = career.heroHeadlineStyle;
        onStyleChange = (next) =>
          onChangeContent({ ...content, career: { ...career, heroHeadlineStyle: next } });
      } else if (target.scope === "careerHeroBody") {
        value = career.heroBody;
        onValueChange = (next) =>
          onChangeContent({ ...content, career: { ...career, heroBody: next } });
        style = career.heroBodyStyle;
        onStyleChange = (next) =>
          onChangeContent({ ...content, career: { ...career, heroBodyStyle: next } });
      } else if (target.scope === "careerRolesHeading") {
        value = career.rolesHeading;
        onValueChange = (next) =>
          onChangeContent({ ...content, career: { ...career, rolesHeading: next } });
        style = career.rolesHeadingStyle;
        onStyleChange = (next) =>
          onChangeContent({ ...content, career: { ...career, rolesHeadingStyle: next } });
      } else if (target.scope === "careerRolesEmpty") {
        value = career.rolesEmptyText;
        onValueChange = (next) =>
          onChangeContent({ ...content, career: { ...career, rolesEmptyText: next } });
        style = career.rolesEmptyStyle;
        onStyleChange = (next) =>
          onChangeContent({ ...content, career: { ...career, rolesEmptyStyle: next } });
      } else if (target.scope === "careerApplyHeading") {
        value = career.applyHeading;
        onValueChange = (next) =>
          onChangeContent({ ...content, career: { ...career, applyHeading: next } });
        style = career.applyHeadingStyle;
        onStyleChange = (next) =>
          onChangeContent({ ...content, career: { ...career, applyHeadingStyle: next } });
      } else if (target.scope === "careerApplyBody") {
        value = career.applyBody;
        onValueChange = (next) =>
          onChangeContent({ ...content, career: { ...career, applyBody: next } });
        style = career.applyBodyStyle;
        onStyleChange = (next) =>
          onChangeContent({ ...content, career: { ...career, applyBodyStyle: next } });
      } else if (target.scope === "careerApplyButton") {
        value = career.applyButtonText;
        onValueChange = (next) =>
          onChangeContent({ ...content, career: { ...career, applyButtonText: next } });
        style = career.applyButtonStyle;
        onStyleChange = (next) =>
          onChangeContent({ ...content, career: { ...career, applyButtonStyle: next } });
      }
    }

    const resolvedStyle = ensureTextStyle(style);
    const previewSnippet =
      (value || placeholder || label || "Preview").slice(0, 15) || "Preview";
    const inputFontKey =
      hoverFont && hasSelection
        ? hoverFont
        : resolvedStyle.font ?? globals.bodyFont ?? "sans";
    const sortedFonts = sortFontOptions(fontOptions, usedFonts);
    const fontList = [
      { value: "", label: "Use global" },
      ...sortedFonts.map((option) => ({ value: option.value, label: option.label })),
    ];

    return withModal(
      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <p className={labelClass}>{label}</p>
          {onClear ? (
            <button className="text-[10px] uppercase tracking-[0.2em] text-stone-400" onClick={onClear}>
              Clear
            </button>
          ) : null}
        </div>
        {visibilityControl ? <div className="mt-3">{visibilityControl}</div> : null}
        <div className="mt-3 grid gap-3 sm:grid-cols-[1.2fr_1fr]">
          <label className="text-[10px] text-stone-500">
            Text
            {multiline ? (
              <textarea
                ref={(node) => {
                  textInputRef.current = node;
                }}
                className={`${inputClass} min-h-[90px]`}
                style={{ fontFamily: fontFamilyForKey(inputFontKey) }}
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                onSelect={() => {
                  const node = textInputRef.current;
                  if (!node) return;
                  setHasSelection(
                    node.selectionStart !== null &&
                      node.selectionEnd !== null &&
                      node.selectionStart !== node.selectionEnd
                  );
                }}
                onBlur={() => {
                  setHasSelection(false);
                  setHoverFont(null);
                }}
              />
            ) : (
              <input
                ref={(node) => {
                  textInputRef.current = node;
                }}
                className={inputClass}
                style={{ fontFamily: fontFamilyForKey(inputFontKey) }}
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                onSelect={() => {
                  const node = textInputRef.current;
                  if (!node) return;
                  setHasSelection(
                    node.selectionStart !== null &&
                      node.selectionEnd !== null &&
                      node.selectionStart !== node.selectionEnd
                  );
                }}
                onBlur={() => {
                  setHasSelection(false);
                  setHoverFont(null);
                }}
              />
            )}
          </label>
          <div className="text-[10px] text-stone-500">
            Font
            <button
              ref={(node) => {
                fontButtonRef.current = node;
              }}
              type="button"
              className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-xs text-stone-700"
              onClick={() => {
                const rect = fontButtonRef.current?.getBoundingClientRect();
                if (rect) {
                  setFontPickerPos({
                    top: rect.top,
                    left: rect.right + 16,
                  });
                }
                setFontPickerOpen((prev) => !prev);
              }}
            >
              {resolvedStyle.font
                ? fontOptions.find((option) => option.value === resolvedStyle.font)?.label
                : "Use global"}
            </button>
            <p className="mt-2 text-[10px] text-stone-400">
              Font picker opens as an overlay.
            </p>
          </div>
        </div>
        {fontPickerOpen && typeof document !== "undefined"
          ? createPortal(
              <div
                ref={(node) => {
                  fontPanelRef.current = node;
                }}
                className="fixed z-[60] w-[320px] rounded-2xl border border-stone-200 bg-white p-3 shadow-2xl"
                style={{ top: fontPickerPos.top, left: fontPickerPos.left }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                    Fonts
                  </p>
                  <button
                    type="button"
                    className="text-[10px] uppercase tracking-[0.2em] text-stone-400"
                    onClick={() => setFontPickerOpen(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto pr-1">
                  {fontList.map((option) => {
                    const isSelected = option.value
                      ? resolvedStyle.font === option.value
                      : !resolvedStyle.font;
                    const previewFont = option.value
                      ? fontFamilyForKey(option.value as TextStyle["font"])
                      : fontFamilyForKey(globals.bodyFont ?? "sans");
                    return (
                      <button
                        key={option.value || "global"}
                        type="button"
                        className={`mb-2 flex w-full items-center justify-between rounded-md border px-2 py-2 text-left ${
                          isSelected
                            ? "border-amber-300 bg-amber-50 text-stone-900"
                            : "border-transparent text-stone-600 hover:border-stone-200 hover:bg-stone-50"
                        }`}
                        onMouseEnter={() =>
                          setHoverFont(
                            option.value ? (option.value as TextStyle["font"]) : null
                          )
                        }
                        onMouseLeave={() => setHoverFont(null)}
                        onClick={() => {
                          onStyleChange({
                            ...resolvedStyle,
                            font: option.value ? (option.value as TextStyle["font"]) : undefined,
                          });
                          setFontPickerOpen(false);
                        }}
                      >
                        <span className="mr-2 text-[9px] uppercase tracking-[0.2em] text-stone-400">
                          {option.label}
                        </span>
                        <span
                          className="text-sm text-stone-700"
                          style={{ fontFamily: previewFont }}
                        >
                          {previewSnippet}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[10px] text-stone-400">
                  Hover to preview (select text first).
                </p>
              </div>,
              document.body
            )
          : null}
        <div className="mt-4">
          <ColorPicker
            label="Text color"
            value={resolvedStyle.color ?? "#1c1917"}
            onChange={(next) => onStyleChange({ ...resolvedStyle, color: next })}
          />
        </div>
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2 text-[10px] text-stone-500">
            <input
              type="checkbox"
              checked={linkEnabled}
              onChange={(event) => onLinkEnabledChange(event.target.checked)}
            />
            Enable link
          </label>
          {linkEnabled ? (
            <label className="text-[10px] text-stone-500">
              Link URL
              <input
                className={inputClass}
                value={linkUrl}
                onChange={(event) => onLinkUrlChange(event.target.value)}
                placeholder="https://..."
              />
            </label>
          ) : null}
        </div>
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
              min={-400}
              max={400}
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
              min={-400}
              max={400}
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
        {target.scope === "footerLead" && block?.type === "footer" ? (
          <div className="mt-4 space-y-2">
            <label className="text-[10px] text-stone-500">
              Placeholder
              <input
                className={inputClass}
                value={block.data.leadPlaceholder ?? ""}
                onChange={(event) =>
                  onChangeContent(
                    updateBlock(content, target.blockIndex!, {
                      leadPlaceholder: event.target.value,
                    })
                  )
                }
              />
            </label>
            <label className="flex items-center gap-2 text-[10px] text-stone-500">
              <input
                type="checkbox"
                checked={block.data.showLeadLogo ?? true}
                onChange={(event) =>
                  onChangeContent(
                    updateBlock(content, target.blockIndex!, {
                      showLeadLogo: event.target.checked,
                    })
                  )
                }
              />
              Show logo above lead
            </label>
          </div>
        ) : null}
        {target.scope === "footerTagline" && block?.type === "footer" ? (
          <div className="mt-5 space-y-3">
            <p className={labelClass}>Footer links</p>
            {block.data.links.map((link, linkIndex) => (
              <div key={`${link.label}-${linkIndex}`} className="grid gap-2 sm:grid-cols-2">
                <input
                  className={inputClass}
                  value={link.label}
                  onChange={(event) => {
                    const next = [...block.data.links];
                    next[linkIndex] = { ...next[linkIndex], label: event.target.value };
                    onChangeContent(updateBlock(content, target.blockIndex!, { links: next }));
                  }}
                  placeholder="Label"
                />
                <input
                  className={inputClass}
                  value={link.href}
                  onChange={(event) => {
                    const next = [...block.data.links];
                    next[linkIndex] = { ...next[linkIndex], href: event.target.value };
                    onChangeContent(updateBlock(content, target.blockIndex!, { links: next }));
                  }}
                  placeholder="https://"
                />
                <button
                  className="rounded-full border border-stone-200 px-3 py-1 text-[10px] font-semibold text-stone-700"
                  onClick={() => {
                    const next = block.data.links.filter((_, i) => i !== linkIndex);
                    onChangeContent(updateBlock(content, target.blockIndex!, { links: next }));
                  }}
                >
                  Remove link
                </button>
              </div>
            ))}
            <button
              className="rounded-full border border-stone-200 px-3 py-1 text-[10px] font-semibold text-stone-700"
              onClick={() =>
                onChangeContent(
                  updateBlock(content, target.blockIndex!, {
                    links: [...block.data.links, { label: "New link", href: "#" }],
                  })
                )
              }
            >
              Add link
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return null;
}
