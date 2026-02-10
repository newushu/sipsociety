"use client";

import HomePageShell from "@/components/HomePageShell";
import AnimatedReveal from "@/components/about/AnimatedReveal";
import { InlineEditTarget } from "@/components/admin/inlineEditTypes";
import { defaultAboutContent } from "@/lib/content/defaults";
import { fontFamilyForKey } from "@/lib/content/fonts";
import { GlobalSettings, PageContent, TextStyle } from "@/lib/content/types";

type Props = {
  content: PageContent;
  globals: GlobalSettings;
  onSelectEdit: (target: InlineEditTarget) => void;
  onChangeContent?: (content: PageContent) => void;
};

const editBadge =
  "rounded-full border border-white/70 bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-700 shadow-sm opacity-0 transition group-hover:opacity-100";

const animBadge =
  "rounded-full border border-white/70 bg-white/90 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-stone-700 shadow-sm opacity-0 transition group-hover:opacity-100";

const styleFrom = (style?: TextStyle) =>
  style
    ? {
        fontFamily: fontFamilyForKey(style.font),
        fontSize: style.size ? `${style.size}px` : undefined,
        fontWeight: style.weight,
        letterSpacing: style.tracking ? `${style.tracking}em` : undefined,
        textTransform: style.transform,
        color: style.color,
      }
    : undefined;

const Editable = ({
  label,
  target,
  onSelectEdit,
  children,
  animTarget,
  animLabel,
}: {
  label: string;
  target: InlineEditTarget;
  onSelectEdit: (target: InlineEditTarget) => void;
  children: React.ReactNode;
  animTarget?: InlineEditTarget;
  animLabel?: string;
}) => (
  <div
    className="group relative cursor-pointer"
    onClick={(event) => {
      event.stopPropagation();
      onSelectEdit(target);
    }}
    role="button"
    tabIndex={0}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        onSelectEdit(target);
      }
    }}
  >
    {children}
    <button
      className={`absolute left-4 top-4 ${editBadge}`}
      onClick={(event) => {
        event.stopPropagation();
        onSelectEdit(target);
      }}
      type="button"
    >
      {label}
    </button>
    {animTarget ? (
      <button
        className={`absolute right-4 top-4 ${animBadge}`}
        onClick={(event) => {
          event.stopPropagation();
          onSelectEdit(animTarget);
        }}
        type="button"
      >
        {animLabel ?? "Anim"}
      </button>
    ) : null}
  </div>
);

export default function AboutInlinePreview({
  content,
  globals,
  onSelectEdit,
  onChangeContent,
}: Props) {
  const about = { ...defaultAboutContent, ...(content.about ?? {}) };
  const links =
    globals.menuItems?.length
      ? globals.menuItems.map((item) => ({
          href: item.href.startsWith("#") ? `/${item.href}` : item.href,
          label: item.label,
        }))
      : [
          { href: "/about-us", label: "About us" },
          { href: "/menu", label: "Menu" },
          { href: "/gallery", label: "Gallery" },
          { href: "/career", label: "Career" },
          { href: "/contact-us", label: "Contact us" },
        ];

  return (
    <HomePageShell globals={globals} links={links} allowOverflow>
      <section className="relative left-1/2 w-screen -translate-x-1/2 min-h-[90vh] overflow-hidden">
        <Editable
          label="Edit hero image"
          target={{ kind: "media", scope: "aboutHeroImage", blockIndex: 0 }}
          onSelectEdit={onSelectEdit}
        >
          <div className="absolute inset-0">
            <img
              src={about.heroImageUrl}
              alt="About us"
              className="h-full w-full object-cover"
            />
            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: about.heroOverlayOpacity }}
            />
          </div>
        </Editable>
        <div className="relative z-10 flex min-h-[90vh] items-center justify-center px-6 py-16">
          <div className="w-full max-w-3xl space-y-6 text-center text-white">
            <Editable
              label="Edit logo"
              target={{ kind: "media", scope: "aboutHeroLogo", blockIndex: 0 }}
              animTarget={{ kind: "animation", scope: "aboutHeroLogoAnimation", blockIndex: 0 }}
              animLabel="Logo anim"
              onSelectEdit={onSelectEdit}
            >
              <AnimatedReveal animation={about.heroLogoAnimation}>
                <div
                  className="mx-auto inline-flex cursor-grab items-center justify-center active:cursor-grabbing"
                  onPointerDown={(event) => {
                    if (!onChangeContent) return;
                    const startY = event.clientY;
                    const startValue = about.heroLogoY ?? 0;
                    const handleMove = (moveEvent: PointerEvent) => {
                      const delta = (moveEvent.clientY - startY) / 2;
                      const nextY = Math.max(-200, Math.min(200, startValue + delta));
                      onChangeContent({
                        ...content,
                        about: { ...about, heroLogoY: nextY },
                      });
                    };
                    const handleUp = () => {
                      window.removeEventListener("pointermove", handleMove);
                      window.removeEventListener("pointerup", handleUp);
                    };
                    window.addEventListener("pointermove", handleMove);
                    window.addEventListener("pointerup", handleUp);
                  }}
                >
                  <img
                    src={about.heroLogoUrl || globals.logoImageUrl}
                    alt="Sip Society"
                    className="h-20 w-20 rounded-full object-cover"
                    style={{
                      transform: `translate(${about.heroLogoX ?? 0}px, ${
                        about.heroLogoY ?? 0
                      }px) scale(${about.heroLogoScale ?? 1})`,
                    }}
                  />
                </div>
              </AnimatedReveal>
            </Editable>
            <Editable
              label="Edit title"
              target={{ kind: "text", scope: "aboutHeroTitle" }}
              animTarget={{ kind: "animation", scope: "aboutHeroTitleAnimation", blockIndex: 0 }}
              animLabel="Title anim"
              onSelectEdit={onSelectEdit}
            >
              <AnimatedReveal animation={about.heroTitleAnimation}>
                <h1
                  className="text-5xl font-semibold md:text-6xl"
                  style={styleFrom(about.heroTitleStyle)}
                >
                  {about.heroTitle}
                </h1>
              </AnimatedReveal>
            </Editable>
            <Editable
              label="Edit body"
              target={{ kind: "text", scope: "aboutHeroBody" }}
              animTarget={{ kind: "animation", scope: "aboutHeroBodyAnimation", blockIndex: 0 }}
              animLabel="Body anim"
              onSelectEdit={onSelectEdit}
            >
              <AnimatedReveal animation={about.heroBodyAnimation}>
                <p
                  className="mx-auto max-w-2xl text-base text-white/90"
                  style={styleFrom(about.heroBodyStyle)}
                >
                  {about.heroBody}
                </p>
              </AnimatedReveal>
            </Editable>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <Editable
          label="Edit section title"
          target={{ kind: "text", scope: "aboutSectionTitle" }}
          onSelectEdit={onSelectEdit}
        >
          <h2
            className="text-3xl font-semibold text-stone-900"
            style={styleFrom(about.sectionTitleStyle)}
          >
            {about.sectionTitle}
          </h2>
        </Editable>
        <div className="mt-10 space-y-16">
          {about.sections.map((section, index) => {
            const isLeft = section.mediaSide === "left";
            return (
              <div
                key={section.id}
                className={`grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] ${
                  isLeft ? "" : "lg:[&>div:first-child]:order-2"
                }`}
              >
                <Editable
                  label="Edit media"
                  target={{ kind: "media", scope: "aboutSectionMedia", blockIndex: index }}
                  animTarget={{
                    kind: "animation",
                    scope: "aboutSectionMediaAnimation",
                    blockIndex: index,
                  }}
                  animLabel="Media anim"
                  onSelectEdit={onSelectEdit}
                >
                  <AnimatedReveal animation={section.mediaAnimation}>
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-stone-200 bg-stone-100 shadow-lg">
                      {section.mediaType === "video" ? (
                        <video
                          className="h-full w-full object-cover"
                          src={section.mediaUrl}
                          autoPlay
                          muted
                          loop
                        />
                      ) : (
                        <img
                          className="h-full w-full object-cover"
                          src={section.mediaUrl}
                          alt={section.mediaAlt ?? ""}
                        />
                      )}
                    </div>
                  </AnimatedReveal>
                </Editable>
                <div className="group relative">
                  <button
                    className={`absolute right-0 top-0 ${animBadge}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectEdit({
                        kind: "animation",
                        scope: "aboutSectionTextAnimation",
                        blockIndex: index,
                      });
                    }}
                    type="button"
                  >
                    Text anim
                  </button>
                  <AnimatedReveal animation={section.textAnimation}>
                    <div className="space-y-4">
                      <Editable
                        label="Edit heading"
                        target={{
                          kind: "text",
                        scope: "aboutSectionHeading",
                        blockIndex: index,
                      }}
                      onSelectEdit={onSelectEdit}
                    >
                      <h3
                        className="text-2xl font-semibold text-stone-900"
                        style={styleFrom(section.headingStyle)}
                      >
                        {section.heading}
                      </h3>
                    </Editable>
                    <Editable
                      label="Edit body"
                      target={{ kind: "text", scope: "aboutSectionBody", blockIndex: index }}
                      onSelectEdit={onSelectEdit}
                    >
                      <p
                        className="text-base text-stone-600"
                        style={styleFrom(section.bodyStyle)}
                      >
                        {section.body}
                      </p>
                    </Editable>
                  </div>
                </AnimatedReveal>
              </div>
              </div>
            );
          })}
        </div>
      </section>
    </HomePageShell>
  );
}
