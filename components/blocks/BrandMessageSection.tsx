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
  const [animActive, setAnimActive] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobileViewport(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
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
  const boxHue = block.data.messageBoxHue ?? 42;
  const boxSaturation = block.data.messageBoxSaturation ?? 18;
  const boxLightness = block.data.messageBoxLightness ?? 98;
  const logoX = Math.max(-18, Math.min(18, (logo?.x ?? 0) * 0.35));
  const logoY = Math.max(-14, Math.min(14, (logo?.y ?? 0) * 0.35));
  const logoScale = Math.max(0.6, Math.min(1.8, logo?.scale ?? 1));
  const logoBoxScale = Math.max(0.7, Math.min(2.1, logo?.boxScale ?? 1));
  const showTopImage = topImage?.url && topImage.url !== logo?.imageUrl;

  return (
    <section
      id={id}
      ref={ref}
      data-edit="brandAnimation"
      data-block-index={dataBlockIndex}
      className={`relative flex min-h-[44vh] flex-col items-center justify-start gap-5 overflow-hidden rounded-[48px] border border-stone-200 px-6 pb-12 pt-3 text-center shadow-xl shadow-amber-900/5 brand-anim brand-anim-${animationType} sm:pt-6 ${
        animActive ? "is-revealed" : ""
      } ${className ?? ""}`}
      style={{
        backgroundColor: `hsl(${boxHue}, ${boxSaturation}%, ${boxLightness}%)`,
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
      {showTopImage ? (
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
              className="h-28 w-full rounded-[20px] object-contain sm:h-36"
            />
          )}
        </div>
      ) : null}
      {showLogoMark ? (
        <div className="relative z-20 mt-0 inline-flex flex-col items-center justify-center gap-2 sm:mt-1">
          {wrapLink(
            logoLink?.enabled,
            logoLink?.url,
            <div
              data-edit="brandLogo"
              data-block-index={dataBlockIndex}
              data-reveal
              data-reveal-delay="1"
              className={`scroll-reveal flex h-28 w-28 items-center justify-center overflow-hidden p-2 text-[10px] font-semibold tracking-[0.3em] text-stone-400 ${
                showLogoBox ? "rounded-full border border-amber-200/60" : ""
              }`}
              style={{
                transform: `scale(${logoBoxScale})`,
              }}
              onClick={onLogoSelect}
              onPointerDown={onLogoDragStart}
            >
              {logo?.imageUrl ? (
                <img
                  src={logo.imageUrl}
                  alt={`${logo.text} logo`}
                  className="logo-reveal h-full w-full object-contain"
                  style={{
                    transform: `translate(${logoX}%, ${logoY}%) scale(${logoScale})`,
                  }}
                />
              ) : logo?.mark ? (
                <span
                  className="logo-reveal"
                  style={{
                    transform: `translate(${logoX}%, ${logoY}%) scale(${logoScale})`,
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
            <div className="relative z-30 mt-2 flex justify-center">
              {logoControls}
            </div>
          ) : null}
        </div>
      ) : null}
      <div data-reveal data-reveal-delay="2" className="scroll-reveal relative z-20 mt-4 inline-flex flex-col items-center sm:mt-5">
        {wrapLink(
          headingLink?.enabled,
          headingLink?.url,
          (() => {
            const headingContent =
              block.data.headingRich && block.data.headingHtml
                ? { __html: sanitizeRichHtml(block.data.headingHtml) }
                : null;
            const className = "text-xs font-semibold uppercase tracking-[0.35em] text-stone-500";
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
        {headingControls ? (
          <div className="relative z-30 mt-2 flex justify-center">
            {headingControls}
          </div>
        ) : null}
      </div>
      <div data-reveal data-reveal-delay="3" className="scroll-reveal relative z-20 mt-2 inline-flex flex-col items-center sm:mt-3">
        {wrapLink(
          messageLink?.enabled,
          messageLink?.url,
          (() => {
            const richEnabled =
              messageOverrideRich ?? block.data.messageRich ?? false;
            const html =
              messageOverrideHtml ?? block.data.messageHtml ?? undefined;
            const baseMessageStyle = { ...(messageStyle ?? {}) };
            if (isMobileViewport) {
              delete baseMessageStyle.transform;
            }
            const messageBoxStyle: CSSProperties = {
              ...baseMessageStyle,
              width: block.data.messageBoxWidthPx
                ? `min(100%, ${block.data.messageBoxWidthPx}px)`
                : undefined,
              minHeight: block.data.messageBoxHeightPx
                ? `${block.data.messageBoxHeightPx}px`
                : undefined,
              maxWidth: block.data.messageBoxWidthPx
                ? `min(100%, ${block.data.messageBoxWidthPx}px)`
                : "min(42rem, calc(100vw - 3rem))",
              marginLeft: "auto",
              marginRight: "auto",
              textAlign: "center",
            };
            if (isMobileViewport) {
              messageBoxStyle.width = "auto";
              messageBoxStyle.maxWidth = "calc(100vw - 4.5rem)";
            }
            const className =
              "mx-auto max-w-full break-words px-2 text-center text-2xl font-semibold text-stone-900 sm:text-3xl";
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
        {messageControls ? (
          <div className="relative z-30 mt-2 flex justify-center">
            {messageControls}
          </div>
        ) : null}
      </div>
    </section>
  );
}
