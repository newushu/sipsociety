"use client";

import { memo, useEffect } from "react";
import { ContentBlock, FontKey, GlobalSettings, TextStyle } from "@/lib/content/types";
import { fontFamilyForKey } from "@/lib/content/fonts";
import BrandMessageSection from "@/components/blocks/BrandMessageSection";
import { sanitizeRichHtml } from "@/lib/content/rich";

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

function BlockRenderer({ blocks, globals }: Props) {
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
  const brandMessageHtml = globals?.brandMessageHtml;
  const brandMessageRich = globals?.brandMessageRich;
  const styleFrom = (style?: TextStyle, fontKey?: FontKey) => {
    const next: React.CSSProperties = {};
    if (style) {
      next.fontSize = `${style.size}px`;
      next.fontWeight = style.weight;
      next.fontStyle = style.italic ? "italic" : "normal";
      next.transform = `translate(${style.x ?? 0}px, ${style.y ?? 0}px)`;
      if (style.color) next.color = style.color;
    }
    const resolvedFont = style?.font ?? fontKey;
    if (resolvedFont) {
      next.fontFamily = fontFamilyForKey(resolvedFont);
    }
    return Object.keys(next).length ? next : undefined;
  };
  const renderRichText = (text: string | undefined, html: string | undefined, rich?: boolean) => {
    if (rich && html) {
      const safe = sanitizeRichHtml(html);
      return <span dangerouslySetInnerHTML={{ __html: safe }} />;
    }
    return text ?? "";
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

  useEffect(() => {
    const videos = Array.from(
      document.querySelectorAll<HTMLVideoElement>("video[data-autoplay]")
    );
    if (!videos.length) return;
    const tryPlay = () => {
      videos.forEach((video) => {
        if (!video.paused) return;
        const promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(() => {});
        }
      });
    };
    tryPlay();
    const handleInteract = () => tryPlay();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        tryPlay();
      }
    };
    const handlePageShow = () => {
      tryPlay();
    };
    window.addEventListener("touchstart", handleInteract, { passive: true });
    window.addEventListener("click", handleInteract);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("touchstart", handleInteract);
      window.removeEventListener("click", handleInteract);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handlePageShow);
    };
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
                          data-autoplay="true"
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="auto"
                          controls={false}
                          src={block.data.videoUrl}
                          onClick={(event) => {
                            const video = event.currentTarget;
                            video.muted = true;
                            video.play().catch(() => {});
                          }}
                          onLoadedData={(event) => {
                            const video = event.currentTarget;
                            video.muted = true;
                            const playPromise = video.play();
                            if (playPromise && typeof playPromise.catch === "function") {
                              playPromise.catch(() => {});
                            }
                          }}
                          style={{
                            objectPosition: `${block.data.videoX ?? 50}% ${block.data.videoY ?? 50}%`,
                            transform: `scale(${block.data.videoScale ?? 1})`,
                            filter: `grayscale(${block.data.videoDesaturate ?? 0.6})`,
                          }}
                        />
                      )
                    : block.data.imageUrl
                      ? wrapLink(
                          block.data.videoLinkEnabled,
                          block.data.videoLinkUrl,
                          <img
                            className="h-full w-full object-cover"
                            data-edit="heroImage"
                            data-block-index={index}
                            src={block.data.imageUrl}
                            alt=""
                            style={{
                              objectPosition: `${block.data.imageX ?? block.data.videoX ?? 50}% ${
                                block.data.imageY ?? block.data.videoY ?? 50
                              }%`,
                              transform: `scale(${block.data.imageScale ?? block.data.videoScale ?? 1})`,
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
                    <div className="flex w-full justify-center sm:w-auto sm:justify-center sm:mt-0 mt-2">
                      {wrapLink(
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
                              className="logo-transform h-16 w-16 rounded-full object-cover"
                              style={
                                {
                                  "--logo-x": `${block.data.logoX ?? 0}%`,
                                  "--logo-y": `${block.data.logoY ?? 0}%`,
                                  "--logo-scale": String(block.data.logoScale ?? 1),
                                } as React.CSSProperties
                              }
                            />
                          ) : (
                            <span
                              className="logo-transform"
                              style={
                                {
                                  "--logo-x": `${block.data.logoX ?? 0}%`,
                                  "--logo-y": `${block.data.logoY ?? 0}%`,
                                  "--logo-scale": String(block.data.logoScale ?? 1),
                                } as React.CSSProperties
                              }
                            >
                              {logoMark}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
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
                        {renderRichText(
                          block.data.tagline,
                          block.data.taglineHtml,
                          block.data.taglineRich
                        )}
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
                  messageOverride={block.data.message}
                  messageOverrideHtml={block.data.messageHtml}
                  messageOverrideRich={true}
                  headingStyle={
                    block.data.showHeading ?? true
                      ? styleFrom(block.data.headingStyle, globals?.brandHeadingFont)
                      : { display: "none" }
                  }
                  messageStyle={
                    block.data.showMessage ?? true
                      ? styleFrom(block.data.messageStyle)
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
                className="relative grid grid-cols-3 items-stretch gap-4 px-0 sm:gap-6"
                style={{
                  width: "100vw",
                  paddingLeft: "24px",
                  paddingRight: "24px",
                  marginLeft: "calc(50% - 50vw)",
                }}
              >
                <div
                  data-block-index={index}
                  data-border-effect={leftBorderEffect}
                  className="relative flex h-full min-h-[48vh] flex-col items-center justify-center overflow-hidden rounded-[32px] border border-stone-200 p-8 text-center text-white shadow-xl sm:min-h-[60vh] sm:p-10 lg:min-h-[80vh]"
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
                        className={`mb-5 flex flex-shrink-0 items-center justify-center text-xs font-semibold sm:text-sm ${
                          showLogoBox
                            ? "rounded-full border border-white/40 bg-white/10"
                            : ""
                        }`}
                        style={{
                          width: `${Math.min(
                            block.data.leftLogoMaxPx ?? 180,
                            Math.max(
                              24,
                              56 *
                                (block.data.leftLogoBoxScale ?? 1) *
                                (block.data.leftLogoScale ?? 1)
                            )
                          )}px`,
                          height: `${Math.min(
                            block.data.leftLogoMaxPx ?? 180,
                            Math.max(
                              24,
                              56 *
                                (block.data.leftLogoBoxScale ?? 1) *
                                (block.data.leftLogoScale ?? 1)
                            )
                          )}px`,
                          minWidth: "24px",
                          minHeight: "24px",
                          maxWidth: "18vw",
                          maxHeight: "18vw",
                        }}
                      >
                        {logoImageUrl ? (
                          <img
                            src={logoImageUrl}
                            alt={`${logoText} logo`}
                            className="logo-transform-left h-full w-full rounded-full object-cover"
                            style={
                              {
                                "--logo-x": `${block.data.leftLogoX ?? 0}%`,
                                "--logo-y": `${block.data.leftLogoY ?? 0}%`,
                                "--logo-scale": "1",
                                "--logo-scale-mobile": "1",
                              } as React.CSSProperties
                            }
                          />
                        ) : (
                          <span
                            className="logo-transform-left"
                            style={
                              {
                                "--logo-x": `${block.data.leftLogoX ?? 0}%`,
                                "--logo-y": `${block.data.leftLogoY ?? 0}%`,
                                "--logo-scale": "1",
                                "--logo-scale-mobile": "1",
                              } as React.CSSProperties
                            }
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
                      className="mobile-no-transform break-words text-2xl font-semibold sm:text-3xl"
                      style={styleFrom(block.data.leftTitleStyle, globals?.bodyFont)}
                    >
                      {renderRichText(
                        block.data.leftTitle,
                        block.data.leftTitleHtml,
                        true
                      )}
                    </h3>
                  )}
                  {wrapLink(
                    block.data.leftBodyLinkEnabled,
                    block.data.leftBodyLinkUrl,
                    <p
                      data-edit="leftBody"
                      data-block-index={index}
                      className="mobile-no-transform mt-4 break-words text-sm text-white/80 sm:text-base"
                      style={styleFrom(block.data.leftBodyStyle, globals?.bodyFont)}
                    >
                      {renderRichText(
                        block.data.leftBody,
                        block.data.leftBodyHtml,
                        true
                      )}
                    </p>
                  )}
                </div>
                {wrapLink(
                  block.data.middleMedia.linkEnabled,
                  block.data.middleMedia.linkUrl,
                  <div
                    data-edit="middleMedia"
                    data-block-index={index}
                    className="relative h-full min-h-[48vh] overflow-hidden rounded-[32px] border border-stone-200 bg-stone-100 sm:min-h-[60vh] lg:min-h-[80vh]"
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
                    className="relative h-full min-h-[48vh] overflow-hidden rounded-[32px] border border-stone-200 bg-stone-900 sm:min-h-[60vh] lg:min-h-[80vh]"
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
                        data-autoplay="true"
                        preload="auto"
                        controls={false}
                        src={block.data.rightMedia.url}
                        onClick={(event) => {
                          const video = event.currentTarget;
                          video.muted = true;
                          video.play().catch(() => {});
                        }}
                        onLoadedData={(event) => {
                          const video = event.currentTarget;
                          video.muted = true;
                          const playPromise = video.play();
                          if (playPromise && typeof playPromise.catch === "function") {
                            playPromise.catch(() => {});
                          }
                        }}
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
                      {renderRichText(
                        block.data.caption,
                        block.data.captionHtml,
                        block.data.captionRich
                      )}
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
                  <span style={styleFrom(block.data.headingStyle, globals?.bodyFont)}>
                    {block.data.heading}
                  </span>
                </h2>
                <p
                  className="mt-3 max-w-2xl text-sm text-stone-600"
                  style={styleFrom(block.data.subheadingStyle, globals?.bodyFont)}
                >
                  {block.data.subheading}
                </p>
                {block.data.note ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-5 py-4 text-sm text-stone-600">
                    <span style={styleFrom(block.data.noteStyle, globals?.bodyFont)}>
                      {block.data.note}
                    </span>
                  </div>
                ) : null}
                <div className="mt-10 grid gap-8 lg:grid-cols-2">
                  {block.data.sections.map((section, sectionIndex) => (
                    <section
                      key={`${section.title}-${sectionIndex}`}
                      className="rounded-3xl border border-stone-200 bg-stone-50/80 p-6"
                    >
                      <h3
                        className="text-lg font-semibold text-stone-800"
                        style={styleFrom(block.data.sectionTitleStyle, globals?.bodyFont)}
                      >
                        {section.title}
                      </h3>
                      <div className="mt-4 space-y-4">
                        {section.items.map((item, itemIndex) => (
                          <div
                            key={`${item.id ?? item.name}-${itemIndex}`}
                            className="flex items-start justify-between gap-4"
                          >
                            <div>
                              <p
                                className="text-sm font-semibold text-stone-900"
                                style={styleFrom(block.data.itemNameStyle, globals?.bodyFont)}
                              >
                                {item.name}
                              </p>
                              <p
                                className="text-xs text-stone-500"
                                style={styleFrom(block.data.itemDetailStyle, globals?.bodyFont)}
                              >
                                {item.detail}
                              </p>
                            </div>
                            {block.data.showPrices !== false && item.showPrice !== false ? (
                              <span
                                className="text-sm font-semibold text-stone-700"
                                style={styleFrom(block.data.itemPriceStyle, globals?.bodyFont)}
                              >
                                {item.price}
                              </span>
                            ) : null}
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
                      {renderRichText(
                        block.data.leadText,
                        block.data.leadTextHtml,
                        block.data.leadTextRich
                      )}
                    </p>
                  ) : null}
                  <div className="flex w-full flex-col items-center gap-3">
                    <p
                      data-edit="footerJoinLabel"
                      data-block-index={index}
                      className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500"
                    >
                      {block.data.joinLabel ?? "Join us"}
                    </p>
                    <input
                      className="w-full max-w-sm rounded-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm"
                      placeholder={block.data.leadPlaceholder ?? "Enter your email"}
                    />
                    <button
                      data-edit="footerButton"
                      data-block-index={index}
                      className="rounded-full border border-stone-200 bg-stone-900 px-5 py-2 text-sm font-semibold text-white"
                      style={styleFrom(block.data.leadButtonStyle, globals?.bodyFont)}
                    >
                      {renderRichText(
                        block.data.leadButtonText ?? "Join",
                        block.data.leadButtonTextHtml,
                        block.data.leadButtonTextRich
                      )}
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
                          {renderRichText(
                            block.data.tagline,
                            block.data.taglineHtml,
                            block.data.taglineRich
                          )}
                        </p>
                      )
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {block.data.links
                      .filter((link) => link.label.trim().toLowerCase() !== "spotify")
                      .map((link) => (
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

export default memo(BlockRenderer);
