"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { BrandMessageBlock } from "@/lib/content/types";
import { sanitizeRichHtml } from "@/lib/content/rich";

type Props = {
  block: BrandMessageBlock;
  id?: string;
  dataBlockIndex?: number;
  className?: string;
  topImage?: {
    url?: string;
    alt?: string;
    linkEnabled?: boolean;
    linkUrl?: string;
  };
  backgroundVideo?: {
    url?: string;
    opacity?: number;
    feather?: number;
    desaturate?: number;
    x?: number;
    y?: number;
    scale?: number;
  };
  showBackgroundVideo?: boolean;
  logoLink?: { enabled?: boolean; url?: string };
  headingLink?: { enabled?: boolean; url?: string };
  messageLink?: { enabled?: boolean; url?: string };
  logo?: {
    mark: string;
    text: string;
    imageUrl?: string;
    scale?: number;
    boxScale?: number;
    x?: number;
    y?: number;
  };
  showLogoMark?: boolean;
  showLogoBox?: boolean;
  onLogoSelect?: () => void;
  onLogoDragStart?: (event: React.PointerEvent) => void;
  logoControls?: React.ReactNode;
  border?: { enabled: boolean; color: string; width: number };
  messageOverride?: string;
  messageOverrideHtml?: string;
  messageOverrideRich?: boolean;
  onMessageChange?: (next: string) => void;
  headingStyle?: CSSProperties;
  messageStyle?: CSSProperties;
  onHeadingChange?: (next: string) => void;
  headingControls?: React.ReactNode;
  messageControls?: React.ReactNode;
  onHeadingSelect?: () => void;
  onMessageSelect?: () => void;
  animationType?: "none" | "reveal" | "roll";
  animationTrigger?: "once" | "always";
  animationPlayId?: number;
};

export default function BrandMessageSection({
  block,
  id,
  dataBlockIndex,
  className,
  topImage,
  backgroundVideo,
  showBackgroundVideo = false,
  logoLink,
  headingLink,
  messageLink,
  logo,
  showLogoMark = true,
  showLogoBox = true,
  onLogoSelect,
  onLogoDragStart,
  logoControls,
  border,
  messageOverride,
  messageOverrideHtml,
  messageOverrideRich,
  onMessageChange,
  headingStyle,
  messageStyle,
  onHeadingChange,
  headingControls,
  messageControls,
  onHeadingSelect,
  onMessageSelect,
  animationType = "none",
  animationTrigger = "once",
  animationPlayId,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  const [animActive, setAnimActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(true);
          }
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (animationType === "none") return;
    const node = ref.current;
    if (!node) return;
    const scrollRoot =
      document.querySelector<HTMLElement>("[data-inline-scroll]") ?? null;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            if (animationTrigger === "always") setAnimActive(false);
            return;
          }
          setAnimActive(true);
          if (animationTrigger === "once") observer.unobserve(entry.target);
        });
      },
      { threshold: 0.4, root: scrollRoot }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [animationType, animationTrigger, animationPlayId]);

  const wrapLink = (
    enabled?: boolean,
    url?: string,
    child?: React.ReactNode
  ) =>
    enabled && url ? (
      <a href={url} className="contents">
        {child}
      </a>
    ) : (
      child
    );

  const feather = Math.max(0, Math.min(0.4, backgroundVideo?.feather ?? 0));
  const mask = feather
    ? `radial-gradient(circle at center, black 0%, black ${100 - feather * 100}%, transparent 100%)`
    : undefined;

  return (
    <section
      id={id}
      ref={ref}
      data-edit="brandAnimation"
      data-block-index={dataBlockIndex}
      className={`relative flex min-h-[50vh] flex-col items-center justify-center gap-6 rounded-[48px] border border-stone-200 bg-white/70 px-6 py-16 text-center shadow-xl shadow-amber-900/5 brand-anim brand-anim-${animationType} ${
        animActive ? "is-revealed" : ""
      } ${className ?? ""}`}
      style={{
        borderColor: border?.enabled ? border.color : "transparent",
        borderWidth: border?.enabled ? border.width : 0,
      }}
    >
      <div
        data-edit="brandBgVideo"
        data-block-index={dataBlockIndex}
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[48px]"
      >
        {backgroundVideo && backgroundVideo.url ? (
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            src={backgroundVideo.url}
            style={{
              opacity: showBackgroundVideo ? backgroundVideo.opacity ?? 0.4 : 0,
              filter: `grayscale(${backgroundVideo.desaturate ?? 0})`,
              maskImage: mask,
              WebkitMaskImage: mask,
              objectPosition: `${backgroundVideo.x ?? 50}% ${backgroundVideo.y ?? 50}%`,
              transform: `scale(${backgroundVideo.scale ?? 1})`,
              visibility: showBackgroundVideo ? "visible" : "hidden",
            }}
          />
        ) : null}
      </div>
      {topImage?.url ? (
        <div
          data-edit="brandTopImage"
          data-block-index={dataBlockIndex}
          className="relative z-10 w-full max-w-5xl"
        >
          {wrapLink(
            topImage.linkEnabled,
            topImage.linkUrl,
            <img
              src={topImage.url}
              alt={topImage.alt ?? "Brand image"}
              className="h-56 w-full rounded-[32px] object-cover shadow-lg"
            />
          )}
        </div>
      ) : null}
      {showLogoMark ? (
        <div className="relative z-20 inline-flex items-center justify-center">
          {wrapLink(
            logoLink?.enabled,
            logoLink?.url,
            <div
              data-edit="brandLogo"
              data-block-index={dataBlockIndex}
              className={`flex h-16 w-16 items-center justify-center text-[10px] font-semibold tracking-[0.3em] transition-all duration-700 ${
                active ? "scale-110 text-amber-700" : "scale-90 text-stone-400"
              } ${
                showLogoBox ? "rounded-full border border-amber-200/60" : ""
              } outline outline-1 outline-transparent transition hover:outline-amber-300/70`}
              style={{
                transform: `scale(${logo?.boxScale ?? 1})`,
              }}
              onClick={onLogoSelect}
              onPointerDown={onLogoDragStart}
            >
              {logo?.imageUrl ? (
                <img
                  src={logo.imageUrl}
                  alt={`${logo.text} logo`}
                  className="h-12 w-12 rounded-full object-cover"
                  style={{
                    transform: `translate(${logo?.x ?? 0}%, ${logo?.y ?? 0}%) scale(${logo?.scale ?? 1})`,
                  }}
                />
              ) : logo?.mark ? (
                <span
                  style={{
                    transform: `translate(${logo?.x ?? 0}%, ${logo?.y ?? 0}%) scale(${logo?.scale ?? 1})`,
                  }}
                >
                  {logo.mark}
                </span>
              ) : block.data.icon === "coffee" ? (
                "COFFEE"
              ) : (
                ""
              )}
            </div>
          )}
          {logoControls ? (
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full">
              {logoControls}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="relative z-20 inline-flex flex-col items-center">
        {headingControls ? (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
            {headingControls}
          </div>
        ) : null}
        {wrapLink(
          headingLink?.enabled,
          headingLink?.url,
          (() => {
            const headingContent =
              block.data.headingRich && block.data.headingHtml
                ? { __html: sanitizeRichHtml(block.data.headingHtml) }
                : null;
            const className = onHeadingChange
              ? "text-xs font-semibold uppercase tracking-[0.35em] text-stone-500 outline outline-1 outline-transparent transition hover:outline-amber-300/70"
              : "text-xs font-semibold uppercase tracking-[0.35em] text-stone-500";
            return (
              <p
                data-edit="brandHeading"
                data-block-index={dataBlockIndex}
                className={className}
                style={headingStyle}
                onClick={onHeadingChange ? onHeadingSelect : undefined}
                {...(headingContent ? { dangerouslySetInnerHTML: headingContent } : {})}
              >
                {headingContent ? null : block.data.heading}
              </p>
            );
          })()
        )}
      </div>
      <div className="relative z-20 inline-flex flex-col items-center">
        {messageControls ? (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
            {messageControls}
          </div>
        ) : null}
        {wrapLink(
          messageLink?.enabled,
          messageLink?.url,
          (() => {
            const richEnabled =
              messageOverrideRich ?? block.data.messageRich ?? false;
            const html =
              messageOverrideHtml ?? block.data.messageHtml ?? undefined;
            const messageBoxStyle: CSSProperties = {
              ...messageStyle,
              width: block.data.messageBoxWidthPx
                ? `${block.data.messageBoxWidthPx}px`
                : undefined,
              minHeight: block.data.messageBoxHeightPx
                ? `${block.data.messageBoxHeightPx}px`
                : undefined,
              maxWidth: block.data.messageBoxWidthPx ? undefined : "42rem",
            };
            const className = onMessageChange
              ? "text-2xl font-semibold text-stone-900 outline outline-1 outline-transparent transition hover:outline-amber-300/70 sm:text-3xl"
              : "text-2xl font-semibold text-stone-900 sm:text-3xl";
            return (
              <h2
                data-edit="brandMessage"
                data-block-index={dataBlockIndex}
                className={className}
                style={messageBoxStyle}
                onClick={onMessageChange ? onMessageSelect : undefined}
                {...(richEnabled && html
                  ? { dangerouslySetInnerHTML: { __html: sanitizeRichHtml(html) } }
                  : {})}
              >
                {richEnabled && html ? null : messageOverride ?? block.data.message}
              </h2>
            );
          })()
        )}
      </div>
    </section>
  );
}
