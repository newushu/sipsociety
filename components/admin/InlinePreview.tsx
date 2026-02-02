"use client";

import { ContentBlock, GlobalSettings, PageContent, TextStyle } from "@/lib/content/types";
import BrandMessageSection from "@/components/blocks/BrandMessageSection";
import { InlineEditTarget } from "@/components/admin/inlineEditTypes";

const overlayButton =
  "rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-900 shadow-lg";

const labelTag =
  "absolute left-4 top-4 z-10 rounded-full bg-white/80 px-3 py-1 text-[10px] italic text-stone-600 shadow-sm";

const chipBase =
  "rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600 shadow-sm";

const chipActive =
  "border-stone-900 bg-stone-900 text-white shadow-md";

type Props = {
  content: PageContent;
  globals: GlobalSettings;
  onChangeContent: (content: PageContent) => void;
  onChangeGlobals: (globals: GlobalSettings) => void;
  activeEdit: InlineEditTarget | null;
  onSelectEdit: (target: InlineEditTarget) => void;
};

const updateBlock = (blocks: ContentBlock[], index: number, block: ContentBlock) =>
  blocks.map((item, i) => (i === index ? block : item));

const EditableText = ({
  value,
  onChange,
  className,
  placeholder,
  style,
}: {
  value: string;
  onChange: (next: string) => void;
  className: string;
  placeholder?: string;
  style?: React.CSSProperties;
}) => (
  <span
    className={className}
    style={style}
    contentEditable
    suppressContentEditableWarning
    onBlur={(event) => onChange(event.currentTarget.textContent || "")}
    onKeyDown={(event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        (event.target as HTMLElement).blur();
      }
    }}
  >
    {value || placeholder || ""}
  </span>
);

const styleFrom = (style?: TextStyle) =>
  style
    ? {
        fontSize: `${style.size}px`,
        fontWeight: style.weight,
        fontStyle: style.italic ? "italic" : "normal",
        transform: `translate(${style.x ?? 0}px, ${style.y ?? 0}px)`,
      }
    : undefined;

const isSameTarget = (a: InlineEditTarget, b: InlineEditTarget) =>
  a.kind === b.kind &&
  a.scope === b.scope &&
  (a.blockIndex === undefined || b.blockIndex === undefined || a.blockIndex === b.blockIndex);

const EditChip = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button className={`${chipBase} ${active ? chipActive : ""}`} onClick={onClick}>
    {label}
  </button>
);

export default function InlinePreview({
  content,
  globals,
  onChangeContent,
  onChangeGlobals,
  activeEdit,
  onSelectEdit,
}: Props) {
  const logoMark = globals.logoMark ?? "SS";
  const logoText = globals.logoText ?? "Sip Society";
  const logoImage = globals.logoImageUrl ?? "";
  const showLogoImage = Boolean(logoImage);
  const borderEnabled = globals.borderEnabled ?? true;
  const borderColor = globals.borderColor ?? "#e7e2d9";
  const borderWidth = globals.borderWidth ?? 1;
  const isActive = (target: InlineEditTarget) =>
    activeEdit ? isSameTarget(activeEdit, target) : false;

  return (
    <div className="space-y-28">
      {content.blocks.map((block, index) => {
        if (block.type === "hero") {
          return (
            <section
              key={block.id}
              className="relative overflow-hidden rounded-[48px] border border-stone-200 bg-stone-900 text-white shadow-2xl shadow-stone-900/30"
              style={{
                borderColor: borderEnabled ? borderColor : "transparent",
                borderWidth: borderEnabled ? borderWidth : 0,
              }}
            >
              <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
                <EditChip
                  label="Edit logo"
                  active={isActive({ kind: "logo", scope: "hero", blockIndex: index })}
                  onClick={() =>
                    onSelectEdit({ kind: "logo", scope: "hero", blockIndex: index })
                  }
                />
                <EditChip
                  label="Edit video"
                  active={isActive({ kind: "media", scope: "heroVideo", blockIndex: index })}
                  onClick={() =>
                    onSelectEdit({ kind: "media", scope: "heroVideo", blockIndex: index })
                  }
                />
              </div>
              <span className={labelTag}>Hero (video)</span>
              <div className="absolute inset-0">
                <video
                  className="h-full w-full object-cover video-fade-loop"
                  autoPlay
                  muted
                  loop
                  playsInline
                  src={block.data.videoUrl}
                  style={{
                    objectPosition: `${block.data.videoX ?? 50}% ${block.data.videoY ?? 50}%`,
                    transform: `scale(${block.data.videoScale ?? 1})`,
                    filter: `grayscale(${block.data.videoDesaturate ?? 0.6})`,
                  }}
                />
                <div
                  className="absolute inset-0 bg-black"
                  style={{ opacity: block.data.overlayOpacity }}
                />
              </div>
              <div className="relative z-10 flex min-h-[120vh] flex-col items-center justify-center gap-6 px-8 py-20 text-center sm:min-h-[140vh] sm:px-16 lg:min-h-[160vh]">
                <div className="relative inline-flex flex-col items-center">
                  <div className="absolute right-0 -top-10 z-20">
                    <EditChip
                      label="Edit logo text"
                      active={isActive({ kind: "text", scope: "logoText", blockIndex: index })}
                      onClick={() =>
                        onSelectEdit({ kind: "text", scope: "logoText", blockIndex: index })
                      }
                    />
                  </div>
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.5em] text-amber-200/80"
                    style={styleFrom(globals.logoTextStyle)}
                  >
                    {logoText}
                  </p>
                </div>
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full border border-amber-100/40 bg-white/10 text-2xl font-semibold"
                  style={{ transform: `scale(${block.data.logoBoxScale ?? 1})` }}
                >
                  {showLogoImage ? (
                    <img
                      src={logoImage}
                      alt={`${logoText} logo`}
                      className="h-20 w-20 rounded-full object-cover"
                      style={{
                        transform: `translate(${block.data.logoX ?? 0}%, ${block.data.logoY ?? 0}%) scale(${block.data.logoScale ?? 1})`,
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        transform: `translate(${block.data.logoX ?? 0}%, ${block.data.logoY ?? 0}%) scale(${block.data.logoScale ?? 1})`,
                      }}
                    >
                      {logoMark}
                    </span>
                  )}
                </div>
                <div className="relative inline-flex flex-col items-center">
                  <div className="absolute right-0 -top-10 z-20">
                    <EditChip
                      label="Edit hero text"
                      active={isActive({ kind: "text", scope: "tagline", blockIndex: index })}
                      onClick={() =>
                        onSelectEdit({ kind: "text", scope: "tagline", blockIndex: index })
                      }
                    />
                  </div>
                  <EditableText
                    className="max-w-2xl text-3xl font-semibold sm:text-5xl"
                    value={block.data.tagline}
                    placeholder="Hero tagline"
                    style={styleFrom(block.data.taglineStyle)}
                    onChange={(next) =>
                      onChangeContent({
                        ...content,
                        blocks: updateBlock(content.blocks, index, {
                          ...block,
                          data: { ...block.data, tagline: next },
                        }),
                      })
                    }
                  />
                </div>
              </div>
            </section>
          );
        }

        if (block.type === "brand-message") {
          return (
            <section key={block.id} className="relative">
              <span className={labelTag}>Brand message</span>
              <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
                <EditChip
                  label="Edit logo"
                  active={isActive({ kind: "logo", scope: "brand", blockIndex: index })}
                  onClick={() =>
                    onSelectEdit({ kind: "logo", scope: "brand", blockIndex: index })
                  }
                />
              </div>
              <BrandMessageSection
                block={block}
                id="brand"
                logo={{
                  mark: logoMark,
                  text: logoText,
                  imageUrl: logoImage,
                  scale: block.data.logoScale ?? 1,
                  boxScale: block.data.logoBoxScale ?? 1,
                  x: block.data.logoX ?? 0,
                  y: block.data.logoY ?? 0,
                }}
                border={{ enabled: borderEnabled, color: borderColor, width: borderWidth }}
                messageOverride={globals.brandMessage ?? block.data.message}
                headingStyle={styleFrom(block.data.headingStyle)}
                messageStyle={styleFrom(globals.brandMessageStyle ?? block.data.messageStyle)}
                headingControls={
                  <EditChip
                    label="Edit heading"
                    active={isActive({ kind: "text", scope: "brandHeading", blockIndex: index })}
                    onClick={() =>
                      onSelectEdit({ kind: "text", scope: "brandHeading", blockIndex: index })
                    }
                  />
                }
                messageControls={
                  <EditChip
                    label="Edit message"
                    active={isActive({ kind: "text", scope: "brandMessage", blockIndex: index })}
                    onClick={() =>
                      onSelectEdit({ kind: "text", scope: "brandMessage", blockIndex: index })
                    }
                  />
                }
                onHeadingChange={(next) =>
                  onChangeContent({
                    ...content,
                    blocks: updateBlock(content.blocks, index, {
                      ...block,
                      data: { ...block.data, heading: next },
                    }),
                  })
                }
                onMessageChange={(next) => {
                  onChangeGlobals({ ...globals, brandMessage: next });
                  onChangeContent({
                    ...content,
                    blocks: updateBlock(content.blocks, index, {
                      ...block,
                      data: { ...block.data, message: next },
                    }),
                  });
                }}
              />
            </section>
          );
        }

        if (block.type === "triple-media") {
          return (
            <section key={block.id} id="media" className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
              <div
                className="relative flex h-[60vh] flex-col items-center justify-center rounded-[36px] border border-stone-200 p-10 text-center text-white shadow-xl sm:h-[70vh] lg:h-[80vh]"
                style={{
                  backgroundColor: block.data.leftAccent,
                  borderColor: borderEnabled ? borderColor : "transparent",
                  borderWidth: borderEnabled ? borderWidth : 0,
                }}
              >
                <span className={labelTag}>Media left (color box)</span>
                <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
                  <EditChip
                    label="Edit logo"
                    active={isActive({ kind: "logo", scope: "left", blockIndex: index })}
                    onClick={() =>
                      onSelectEdit({ kind: "logo", scope: "left", blockIndex: index })
                    }
                  />
                  <label className={`${overlayButton} flex items-center gap-2`}>
                    Color
                    <input
                      type="color"
                      value={block.data.leftAccent}
                      onChange={(event) =>
                        onChangeContent({
                          ...content,
                          blocks: updateBlock(content.blocks, index, {
                            ...block,
                            data: { ...block.data, leftAccent: event.target.value },
                          }),
                        })
                      }
                      className="h-5 w-5 cursor-pointer rounded-full border-0 bg-transparent"
                    />
                  </label>
                </div>
                <div
                  className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-white/10 text-sm font-semibold"
                  style={{ transform: `scale(${block.data.leftLogoBoxScale ?? 1})` }}
                >
                  {showLogoImage ? (
                    <img
                      src={logoImage}
                      alt={`${logoText} logo`}
                      className="h-12 w-12 rounded-full object-cover"
                      style={{
                        transform: `translate(${block.data.leftLogoX ?? 0}%, ${block.data.leftLogoY ?? 0}%) scale(${block.data.leftLogoScale ?? 1})`,
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        transform: `translate(${block.data.leftLogoX ?? 0}%, ${block.data.leftLogoY ?? 0}%) scale(${block.data.leftLogoScale ?? 1})`,
                      }}
                    >
                      {logoMark}
                    </span>
                  )}
                </div>
                <div className="relative inline-flex flex-col items-center">
                  <div className="absolute right-0 -top-10 z-20">
                    <EditChip
                      label="Edit left title"
                      active={isActive({ kind: "text", scope: "leftTitle", blockIndex: index })}
                      onClick={() =>
                        onSelectEdit({ kind: "text", scope: "leftTitle", blockIndex: index })
                      }
                    />
                  </div>
                  <EditableText
                    className="text-3xl font-semibold"
                    value={block.data.leftTitle}
                    placeholder="Left title"
                    style={styleFrom(block.data.leftTitleStyle)}
                    onChange={(next) =>
                      onChangeContent({
                        ...content,
                        blocks: updateBlock(content.blocks, index, {
                          ...block,
                          data: { ...block.data, leftTitle: next },
                        }),
                      })
                    }
                  />
                </div>
                <div className="relative mt-4 inline-flex flex-col items-center">
                  <div className="absolute right-0 -top-10 z-20">
                    <EditChip
                      label="Edit left body"
                      active={isActive({ kind: "text", scope: "leftBody", blockIndex: index })}
                      onClick={() =>
                        onSelectEdit({ kind: "text", scope: "leftBody", blockIndex: index })
                      }
                    />
                  </div>
                  <EditableText
                    className="text-base text-white/80"
                    value={block.data.leftBody}
                    placeholder="Left body"
                    style={styleFrom(block.data.leftBodyStyle)}
                    onChange={(next) =>
                      onChangeContent({
                        ...content,
                        blocks: updateBlock(content.blocks, index, {
                          ...block,
                          data: { ...block.data, leftBody: next },
                        }),
                      })
                    }
                  />
                </div>
              </div>
              <div
                className="relative h-[60vh] overflow-hidden rounded-[36px] border border-stone-200 bg-stone-100 sm:h-[70vh] lg:h-[80vh]"
                style={{
                  borderColor: borderEnabled ? borderColor : "transparent",
                  borderWidth: borderEnabled ? borderWidth : 0,
                }}
              >
                <span className={labelTag}>Media middle (image)</span>
                <img
                  src={block.data.middleMedia.url}
                  alt={block.data.middleMedia.alt}
                  className="h-full w-full object-cover"
                  style={{
                    objectPosition: `${block.data.middleMedia.x}% ${block.data.middleMedia.y}%`,
                    transform: `scale(${block.data.middleMedia.scale})`,
                  }}
                />
                <div className="absolute right-4 top-4 z-20">
                  <EditChip
                    label="Edit photo"
                    active={isActive({ kind: "media", scope: "middleMedia", blockIndex: index })}
                    onClick={() =>
                      onSelectEdit({ kind: "media", scope: "middleMedia", blockIndex: index })
                    }
                  />
                </div>
              </div>
              <div
                className="relative h-[60vh] overflow-hidden rounded-[36px] border border-stone-200 bg-stone-900 sm:h-[70vh] lg:h-[80vh]"
                style={{
                  borderColor: borderEnabled ? borderColor : "transparent",
                  borderWidth: borderEnabled ? borderWidth : 0,
                }}
              >
                <span className={labelTag}>Media right (video)</span>
                <video
                  className="h-full w-full object-cover video-fade-loop"
                  autoPlay
                  muted
                  loop
                  playsInline
                  src={block.data.rightMedia.url}
                  style={{
                    objectPosition: `${block.data.rightMedia.x}% ${block.data.rightMedia.y}%`,
                    transform: `scale(${block.data.rightMedia.scale})`,
                  }}
                />
                <div className="absolute right-4 top-4 z-20">
                  <EditChip
                    label="Edit video"
                    active={isActive({ kind: "media", scope: "rightMedia", blockIndex: index })}
                    onClick={() =>
                      onSelectEdit({ kind: "media", scope: "rightMedia", blockIndex: index })
                    }
                  />
                </div>
              </div>
            </section>
          );
        }

        if (block.type === "landscape") {
          return (
            <section
              key={block.id}
              id="landscape"
              className="relative overflow-hidden rounded-[48px] border border-stone-200 bg-stone-100"
              style={{
                borderColor: borderEnabled ? borderColor : "transparent",
                borderWidth: borderEnabled ? borderWidth : 0,
              }}
            >
              <span className={labelTag}>Landscape image</span>
              <div className="relative h-[48vh] w-full overflow-hidden">
                <img
                  src={block.data.media.url}
                  alt={block.data.media.alt}
                  className="h-full w-full object-cover"
                  style={{
                    objectPosition: `${block.data.media.x}% ${block.data.media.y}%`,
                    transform: `scale(${block.data.media.scale})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 text-lg font-semibold text-white">
                  <div className="relative inline-flex flex-col items-start">
                    <div className="absolute right-0 -top-10 z-20">
                      <EditChip
                        label="Edit caption"
                        active={isActive({ kind: "text", scope: "caption", blockIndex: index })}
                        onClick={() =>
                          onSelectEdit({ kind: "text", scope: "caption", blockIndex: index })
                        }
                      />
                    </div>
                    <EditableText
                      className="text-lg font-semibold text-white"
                      value={block.data.caption}
                      placeholder="Landscape caption"
                      style={styleFrom(block.data.captionStyle)}
                      onChange={(next) =>
                        onChangeContent({
                          ...content,
                          blocks: updateBlock(content.blocks, index, {
                            ...block,
                            data: { ...block.data, caption: next },
                          }),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="absolute right-4 top-4 z-20">
                  <EditChip
                    label="Edit image"
                    active={isActive({ kind: "media", scope: "landscapeMedia", blockIndex: index })}
                    onClick={() =>
                      onSelectEdit({ kind: "media", scope: "landscapeMedia", blockIndex: index })
                    }
                  />
                </div>
              </div>
            </section>
          );
        }

        if (block.type === "footer") {
          return (
            <footer key={block.id} className="border-t border-stone-200 pt-6 text-sm text-stone-500">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold text-stone-900">Sip Society</p>
              </div>
              <div className="relative mt-2 inline-flex flex-col items-start">
                <div className="absolute right-0 -top-10 z-20">
                  <EditChip
                    label="Edit footer text"
                    active={isActive({ kind: "text", scope: "footerTagline", blockIndex: index })}
                    onClick={() =>
                      onSelectEdit({ kind: "text", scope: "footerTagline", blockIndex: index })
                    }
                  />
                </div>
                <EditableText
                  className="text-sm text-stone-500"
                  value={block.data.tagline}
                  placeholder="Footer tagline"
                  style={styleFrom(block.data.taglineStyle)}
                  onChange={(next) =>
                    onChangeContent({
                      ...content,
                      blocks: updateBlock(content.blocks, index, {
                        ...block,
                        data: { ...block.data, tagline: next },
                      }),
                    })
                  }
                />
              </div>
            </footer>
          );
        }

        return null;
      })}
    </div>
  );
}
