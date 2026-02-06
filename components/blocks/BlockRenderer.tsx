"use client";

import { useEffect } from "react";
import { ContentBlock, FontKey, GlobalSettings, TextStyle } from "@/lib/content/types";
import { fontFamilyForKey } from "@/lib/content/fonts";
import BrandMessageSection from "@/components/blocks/BrandMessageSection";

const sectionIds: Record<ContentBlock["type"], string> = {
  hero: "top",
  "brand-message": "brand",
  "triple-media": "media",
  landscape: "landscape",
  footer: "footer",
  menu: "menu",
};

type Props = {
  blocks: ContentBlock[];
  globals?: GlobalSettings;
};

export default function BlockRenderer({ blocks, globals }: Props) {
  const logoMark = globals?.logoMark ?? "SS";
  const logoText = globals?.logoText ?? "Sip Society";
  const logoImageUrl = globals?.logoImageUrl ?? "";
  const showLogoMark = globals?.showLogoMark ?? true;
  const showLogoText = globals?.showLogoText ?? true;
  const showLogoBox = globals?.showLogoBox ?? true;
  const borderEnabled = globals?.borderEnabled ?? true;
  const borderColor = globals?.borderColor ?? "#e7e2d9";
  const borderWidth = globals?.borderWidth ?? 1;
  const brandMessage = globals?.brandMessage;
  const styleFrom = (style?: TextStyle, fontKey?: FontKey) => {
    const next: React.CSSProperties = {};
    if (style) {
      next.fontSize = `${style.size}px`;
      next.fontWeight = style.weight;
      next.fontStyle = style.italic ? "italic" : "normal";
      next.transform = `translate(${style.x ?? 0}px, ${style.y ?? 0}px)`;
    }
    const resolvedFont = style?.font ?? fontKey;
    if (resolvedFont) {
      next.fontFamily = fontFamilyForKey(resolvedFont);
    }
    return Object.keys(next).length ? next : undefined;
  };
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

  useEffect(() => {
    const curtainTargets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-curtain]")
    );
    const borderTargets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-border-effect]")
    );
    if (!curtainTargets.length && !borderTargets.length) return;
    const scrollRoot =
      document.querySelector<HTMLElement>("[data-inline-scroll]") ?? null;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.3, root: scrollRoot }
    );
    curtainTargets.forEach((node) => observer.observe(node));
    borderTargets.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [blocks]);
  return (
    <div className="space-y-28">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "hero":
            return (
              <section
                key={block.id}
                id={sectionIds.hero}
                data-block-index={index}
                className="relative left-1/2 right-1/2 -translate-x-1/2 overflow-hidden bg-stone-900 text-white shadow-2xl shadow-stone-900/30"
                style={{ width: "var(--inline-viewport-width, 100vw)" }}
              >
                <div className="absolute inset-0">
                  {block.data.videoUrl
                    ? wrapLink(
                        block.data.videoLinkEnabled,
                        block.data.videoLinkUrl,
                        <video
                          className="h-full w-full object-cover video-fade-loop"
                          data-edit="heroVideo"
                          data-block-index={index}
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
                      )
                    : null}
                  <div
                    className="absolute inset-0 bg-black"
                    style={{ opacity: block.data.overlayOpacity }}
                  />
                </div>
                <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center gap-6 px-6 py-20 text-center sm:min-h-[140vh] sm:px-16 lg:min-h-[160vh]">
                  {showLogoText ? (
                    wrapLink(
                      globals?.logoTextLinkEnabled,
                      globals?.logoTextLinkUrl,
                      <p
                        data-edit="logoText"
                        data-block-index={index}
                        className="text-xs font-semibold uppercase tracking-[0.5em] text-amber-200/80"
                        style={styleFrom(globals?.logoTextStyle, globals?.bodyFont)}
                      >
                        {logoText}
                      </p>
                    )
                  ) : null}
                  {showLogoMark ? (
                    wrapLink(
                      block.data.logoLinkEnabled,
                      block.data.logoLinkUrl,
                      <div
                        data-edit="heroLogo"
                        data-block-index={index}
                        className={`flex h-20 w-20 items-center justify-center text-2xl font-semibold ${
                          showLogoBox
                            ? "rounded-3xl border border-amber-100/40 bg-white/10"
                            : ""
                        }`}
                        style={{ transform: `scale(${block.data.logoBoxScale ?? 1})` }}
                      >
                        {logoImageUrl ? (
                          <img
                            src={logoImageUrl}
                            alt={`${logoText} logo`}
                            className="h-16 w-16 rounded-full object-cover"
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
                    )
                  ) : null}
                  {block.data.showTagline ?? true ? (
                    wrapLink(
                      block.data.taglineLinkEnabled,
                      block.data.taglineLinkUrl,
                      <h1
                        data-edit="heroTagline"
                        data-block-index={index}
                        className="max-w-2xl text-3xl font-semibold sm:text-5xl"
                        style={styleFrom(block.data.taglineStyle, globals?.bodyFont)}
                      >
                        {block.data.tagline}
                      </h1>
                    )
                  ) : null}
                </div>
              </section>
            );
          case "brand-message":
            return (
              <div
                key={block.id}
                className="relative left-1/2 right-1/2 -translate-x-1/2"
                style={{ width: "var(--inline-viewport-width, 100vw)" }}
              >
                <BrandMessageSection
                  block={block}
                  id={sectionIds["brand-message"]}
                  dataBlockIndex={index}
                  className="w-full"
                  topImage={
                    block.data.showTopImage
                      ? {
                          url: block.data.topImageUrl,
                          alt: block.data.topImageAlt,
                          linkEnabled: block.data.topImageLinkEnabled,
                          linkUrl: block.data.topImageLinkUrl,
                        }
                      : undefined
                  }
                  backgroundVideo={{
                    url: block.data.bgVideoUrl,
                    opacity: block.data.bgVideoOpacity,
                    feather: block.data.bgVideoFeather,
                    desaturate: block.data.bgVideoDesaturate,
                    x: block.data.bgVideoX,
                    y: block.data.bgVideoY,
                    scale: block.data.bgVideoScale,
                  }}
                  showBackgroundVideo={block.data.showBgVideo ?? false}
                  logoLink={{
                    enabled: block.data.logoLinkEnabled,
                    url: block.data.logoLinkUrl,
                  }}
                  headingLink={{
                    enabled: block.data.headingLinkEnabled,
                    url: block.data.headingLinkUrl,
                  }}
                  messageLink={{
                    enabled: block.data.messageLinkEnabled,
                    url: block.data.messageLinkUrl,
                  }}
                  logo={{
                    mark: logoMark,
                    text: logoText,
                    imageUrl: logoImageUrl,
                    scale: block.data.logoScale ?? 1,
                    boxScale: block.data.logoBoxScale ?? 1,
                    x: block.data.logoX ?? 0,
                    y: block.data.logoY ?? 0,
                  }}
                  animationType={block.data.animationType ?? "none"}
                  animationTrigger={block.data.animationTrigger ?? "once"}
                  animationPlayId={block.data.animationPlayId ?? 0}
                  showLogoMark={showLogoMark}
                  showLogoBox={showLogoBox}
                  border={{ enabled: borderEnabled, color: borderColor, width: borderWidth }}
                  messageOverride={brandMessage}
                  headingStyle={
                    block.data.showHeading ?? true
                      ? styleFrom(block.data.headingStyle, globals?.brandHeadingFont)
                      : { display: "none" }
                  }
                  messageStyle={
                    block.data.showMessage ?? true
                      ? styleFrom(
                          globals?.brandMessageStyle ?? block.data.messageStyle,
                          globals?.brandMessageFont
                        )
                      : { display: "none" }
                  }
                />
              </div>
            );
          case "triple-media":
            const leftBorderEffect = block.data.leftBorderEffect ?? "tracer";
            const showCurtain = block.data.rightMediaCurtainEnabled ?? true;
            return (
              <section
                key={block.id}
                id={sectionIds["triple-media"]}
                className="relative left-1/2 right-1/2 -translate-x-1/2 grid gap-4 px-6 sm:gap-6 lg:grid-cols-[1fr_1fr_1fr]"
                style={{ width: "var(--inline-viewport-width, 100vw)" }}
              >
                <div
                  data-block-index={index}
                  data-border-effect={leftBorderEffect}
                  className="relative flex h-[48vh] flex-col items-center justify-center rounded-[32px] border border-stone-200 p-8 text-center text-white shadow-xl sm:h-[60vh] sm:p-10 lg:h-[80vh]"
                  style={{
                    backgroundColor: block.data.leftAccent,
                    borderColor: borderEnabled ? borderColor : "transparent",
                    borderWidth: borderEnabled ? borderWidth : 0,
                  }}
                >
                  {leftBorderEffect !== "none" ? (
                    <span className="pointer-events-none absolute inset-0 rounded-[32px] border-effect" />
                  ) : null}
                  {leftBorderEffect === "both" || leftBorderEffect === "sweep" ? (
                    <span className="pointer-events-none absolute inset-0 rounded-[32px] border-sweep" />
                  ) : null}
                  {leftBorderEffect === "both" || leftBorderEffect === "tracer" ? (
                    <span className="pointer-events-none absolute inset-0 rounded-[32px] border-tracer" />
                  ) : null}
                  {showLogoMark ? (
                    wrapLink(
                      block.data.leftLogoLinkEnabled,
                      block.data.leftLogoLinkUrl,
                      <div
                        data-edit="leftLogo"
                        data-block-index={index}
                        className={`mb-5 flex h-12 w-12 items-center justify-center text-xs font-semibold sm:h-16 sm:w-16 sm:text-sm ${
                          showLogoBox
                            ? "rounded-full border border-white/40 bg-white/10"
                            : ""
                        }`}
                        style={{ transform: `scale(${block.data.leftLogoBoxScale ?? 1})` }}
                      >
                        {logoImageUrl ? (
                          <img
                            src={logoImageUrl}
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
                    )
                  ) : null}
                  {wrapLink(
                    block.data.leftTitleLinkEnabled,
                    block.data.leftTitleLinkUrl,
                    <h3
                      data-edit="leftTitle"
                      data-block-index={index}
                      className="text-2xl font-semibold sm:text-3xl"
                      style={styleFrom(block.data.leftTitleStyle, globals?.bodyFont)}
                    >
                      {block.data.leftTitle}
                    </h3>
                  )}
                  {wrapLink(
                    block.data.leftBodyLinkEnabled,
                    block.data.leftBodyLinkUrl,
                    <p
                      data-edit="leftBody"
                      data-block-index={index}
                      className="mt-4 text-sm text-white/80 sm:text-base"
                      style={styleFrom(block.data.leftBodyStyle, globals?.bodyFont)}
                    >
                      {block.data.leftBody}
                    </p>
                  )}
                </div>
                {wrapLink(
                  block.data.middleMedia.linkEnabled,
                  block.data.middleMedia.linkUrl,
                  <div
                    data-edit="middleMedia"
                    data-block-index={index}
                    className="relative h-[48vh] overflow-hidden rounded-[32px] border border-stone-200 bg-stone-100 sm:h-[60vh] lg:h-[80vh]"
                    style={{
                      borderColor: borderEnabled ? borderColor : "transparent",
                      borderWidth: borderEnabled ? borderWidth : 0,
                    }}
                  >
                    <img
                      src={block.data.middleMedia.url}
                      alt={block.data.middleMedia.alt}
                      className="h-full w-full object-cover"
                      style={{
                        objectPosition: `${block.data.middleMedia.x}% ${block.data.middleMedia.y}%`,
                        transform: `scale(${block.data.middleMedia.scale})`,
                      }}
                    />
                  </div>
                )}
                {wrapLink(
                  block.data.rightMedia.linkEnabled,
                  block.data.rightMedia.linkUrl,
                  <div
                    data-edit="rightMedia"
                    data-block-index={index}
                    data-curtain={showCurtain ? "true" : undefined}
                    className="relative h-[48vh] overflow-hidden rounded-[32px] border border-stone-200 bg-stone-900 sm:h-[60vh] lg:h-[80vh]"
                    style={{
                      borderColor: borderEnabled ? borderColor : "transparent",
                      borderWidth: borderEnabled ? borderWidth : 0,
                    }}
                  >
                    {block.data.rightMedia.url ? (
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
                    ) : null}
                    {showCurtain ? (
                      <span className="curtain-wipe" />
                    ) : null}
                  </div>
                )}
              </section>
            );
          case "landscape":
            return (
              <section
                key={block.id}
                id={sectionIds.landscape}
                className="relative left-1/2 right-1/2 -translate-x-1/2 overflow-hidden rounded-[48px] border border-stone-200 bg-stone-100"
                style={{
                  borderColor: borderEnabled ? borderColor : "transparent",
                  borderWidth: borderEnabled ? borderWidth : 0,
                  width: "var(--inline-viewport-width, 100vw)",
                }}
              >
                <div className="relative h-[48vh] w-full overflow-hidden">
                  {wrapLink(
                    block.data.media.linkEnabled,
                    block.data.media.linkUrl,
                    <img
                      data-edit="landscapeMedia"
                      data-block-index={index}
                      src={block.data.media.url}
                      alt={block.data.media.alt}
                      className="h-full w-full object-cover"
                      style={{
                        objectPosition: `${block.data.media.x}% ${block.data.media.y}%`,
                        transform: `scale(${block.data.media.scale})`,
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  {wrapLink(
                    block.data.captionLinkEnabled,
                    block.data.captionLinkUrl,
                    <p
                      data-edit="caption"
                      data-block-index={index}
                      className="absolute bottom-8 left-8 text-lg font-semibold text-white"
                      style={styleFrom(block.data.captionStyle, globals?.bodyFont)}
                    >
                      {block.data.caption}
                    </p>
                  )}
                </div>
              </section>
            );
          case "menu":
            return (
              <section
                key={block.id}
                id={sectionIds.menu}
                className="rounded-[36px] border border-stone-200 bg-white/90 p-10 shadow-xl shadow-amber-900/10"
              >
                <p
                  className="text-xs font-semibold uppercase tracking-[0.5em] text-amber-500/80"
                  style={styleFrom(globals?.logoTextStyle, globals?.bodyFont)}
                >
                  Sip Society Menu
                </p>
                <h2 className="mt-4 text-4xl font-semibold text-stone-900 sm:text-5xl">
                  {block.data.heading}
                </h2>
                <p className="mt-3 max-w-2xl text-sm text-stone-600">
                  {block.data.subheading}
                </p>
                {block.data.note ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-5 py-4 text-sm text-stone-600">
                    {block.data.note}
                  </div>
                ) : null}
                <div className="mt-10 grid gap-8 lg:grid-cols-2">
                  {block.data.sections.map((section, sectionIndex) => (
                    <section
                      key={`${section.title}-${sectionIndex}`}
                      className="rounded-3xl border border-stone-200 bg-stone-50/80 p-6"
                    >
                      <h3 className="text-lg font-semibold text-stone-800">
                        {section.title}
                      </h3>
                      <div className="mt-4 space-y-4">
                        {section.items.map((item, itemIndex) => (
                          <div
                            key={`${item.name}-${itemIndex}`}
                            className="flex items-start justify-between gap-4"
                          >
                            <div>
                              <p className="text-sm font-semibold text-stone-900">
                                {item.name}
                              </p>
                              <p className="text-xs text-stone-500">{item.detail}</p>
                            </div>
                            <span className="text-sm font-semibold text-stone-700">
                              {item.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </section>
            );
          case "footer":
            return (
              <footer
                key={block.id}
                id={sectionIds.footer}
                className="mt-12 border-t border-stone-200 pt-10 text-sm text-stone-500"
              >
                <div className="flex flex-col items-center gap-4 text-center">
                  {block.data.showLeadLogo ?? true ? (
                    showLogoMark ? (
                      logoImageUrl ? (
                        <img
                          src={logoImageUrl}
                          alt={`${logoText} logo`}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-stone-200 text-xs font-semibold">
                          {logoMark}
                        </div>
                      )
                    ) : null
                  ) : null}
                  {block.data.leadText ? (
                    <p
                      data-edit="footerLead"
                      data-block-index={index}
                      className="max-w-2xl text-base font-semibold text-stone-800"
                      style={styleFrom(block.data.leadStyle, globals?.bodyFont)}
                    >
                      {block.data.leadText}
                    </p>
                  ) : null}
                  <div className="flex w-full flex-col items-center gap-3">
                    <input
                      className="w-full max-w-sm rounded-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm"
                      placeholder={block.data.leadPlaceholder ?? "Enter your email"}
                    />
                    <button className="rounded-full border border-stone-200 bg-stone-900 px-5 py-2 text-sm font-semibold text-white">
                      Join
                    </button>
                  </div>
                </div>
                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-sm text-stone-500">
                  <div className="space-y-1">
                    <p className="font-semibold text-stone-900">Sip Society</p>
                    {block.data.showTagline ?? true ? (
                      wrapLink(
                        block.data.taglineLinkEnabled,
                        block.data.taglineLinkUrl,
                        <p
                          data-edit="footerTagline"
                          data-block-index={index}
                          style={styleFrom(block.data.taglineStyle, globals?.bodyFont)}
                        >
                          {block.data.tagline}
                        </p>
                      )
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {block.data.links.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        className="hover:text-stone-900"
                        style={styleFrom(block.data.linkStyle, globals?.bodyFont)}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              </footer>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
