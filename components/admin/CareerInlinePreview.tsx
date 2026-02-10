"use client";

import { InlineEditTarget } from "@/components/admin/inlineEditTypes";
import CareerForm from "@/components/careers/CareerForm";
import HomePageShell from "@/components/HomePageShell";
import { defaultCareerContent } from "@/lib/content/defaults";
import { fontFamilyForKey } from "@/lib/content/fonts";
import { GlobalSettings, PageContent, TextStyle } from "@/lib/content/types";

type Props = {
  content: PageContent;
  globals: GlobalSettings;
  positions: { id: string; title: string; description?: string | null }[];
  onSelectEdit: (target: InlineEditTarget) => void;
};

const editBadge =
  "rounded-full border border-white/70 bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-700 shadow-sm opacity-0 transition group-hover:opacity-100";

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
}: {
  label: string;
  target: InlineEditTarget;
  onSelectEdit: (target: InlineEditTarget) => void;
  children: React.ReactNode;
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
  </div>
);

export default function CareerInlinePreview({
  content,
  globals,
  positions,
  onSelectEdit,
}: Props) {
  const career = { ...defaultCareerContent, ...(content.career ?? {}) };
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
      <Editable
        label="Edit hero image"
        target={{ kind: "media", scope: "careerHeroImage", blockIndex: 0 }}
        onSelectEdit={onSelectEdit}
      >
        <section className="relative left-1/2 w-screen -translate-x-1/2 min-h-[90vh] overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={career.heroImageUrl}
              alt="Sip Society careers"
              className="h-full w-full object-cover"
              style={{
                filter: `saturate(${Math.max(0, 1 - career.heroImageDesaturate)})`,
              }}
            />
            <div className="absolute inset-0 bg-black/45" />
          </div>
          <div className="relative z-10 flex min-h-[90vh] items-center justify-center px-6 py-16">
            <div className="w-full max-w-2xl space-y-6 text-center text-white">
              <Editable
                label="Edit eyebrow"
                target={{ kind: "text", scope: "careerHeroEyebrow" }}
                onSelectEdit={onSelectEdit}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-200"
                  style={styleFrom(career.heroEyebrowStyle)}
                >
                  {career.heroEyebrow}
                </p>
              </Editable>
              <Editable
                label="Edit headline"
                target={{ kind: "text", scope: "careerHeroHeadline" }}
                onSelectEdit={onSelectEdit}
              >
                <h1
                  className="text-4xl font-semibold md:text-5xl"
                  style={styleFrom(career.heroHeadlineStyle)}
                >
                  {career.heroHeadline}
                </h1>
              </Editable>
              <Editable
                label="Edit body"
                target={{ kind: "text", scope: "careerHeroBody" }}
                onSelectEdit={onSelectEdit}
              >
                <p
                  className="mx-auto max-w-xl text-sm text-amber-100/90"
                  style={styleFrom(career.heroBodyStyle)}
                >
                  {career.heroBody}
                </p>
              </Editable>
              <Editable
                label="Edit apply card"
                target={{ kind: "container", scope: "careerApplyCard" }}
                onSelectEdit={onSelectEdit}
              >
                <div
                  className="rounded-3xl border border-white/20 p-6 shadow-lg backdrop-blur"
                  style={{
                    backgroundColor: `rgba(${hexToRgb(career.applyCardBgColor).join(",")}, ${career.applyCardBgOpacity})`,
                    color: career.applyCardTextColor,
                  }}
                >
                  <Editable
                    label="Edit apply heading"
                    target={{ kind: "text", scope: "careerApplyHeading" }}
                    onSelectEdit={onSelectEdit}
                  >
                    <h2 className="text-2xl font-semibold" style={styleFrom(career.applyHeadingStyle)}>
                      {career.applyHeading}
                    </h2>
                  </Editable>
                  <Editable
                    label="Edit apply body"
                    target={{ kind: "text", scope: "careerApplyBody" }}
                    onSelectEdit={onSelectEdit}
                  >
                    <p className="mt-2 text-sm" style={styleFrom(career.applyBodyStyle)}>
                      {career.applyBody}
                    </p>
                  </Editable>
                  <Editable
                    label="Edit apply button"
                    target={{ kind: "text", scope: "careerApplyButton" }}
                    onSelectEdit={onSelectEdit}
                  >
                    <p
                      className="mt-3 text-xs uppercase tracking-[0.3em] text-white/70"
                      style={styleFrom(career.applyButtonStyle)}
                    >
                      {career.applyButtonText}
                    </p>
                  </Editable>
                </div>
              </Editable>
              <div className="mx-auto w-full max-w-2xl">
                <Editable
                  label="Edit form card"
                  target={{ kind: "container", scope: "careerFormCard" }}
                  onSelectEdit={onSelectEdit}
                >
                  <CareerForm
                    positions={positions ?? []}
                    preview
                    containerStyle={{
                      backgroundColor: `rgba(${hexToRgb(career.formCardBgColor).join(",")}, ${career.formCardBgOpacity})`,
                      color: career.formCardTextColor,
                    }}
                    containerClassName="border-white/20"
                    submitText={career.applyButtonText}
                  />
                </Editable>
              </div>
            </div>
          </div>
        </section>
      </Editable>
    </HomePageShell>
  );
}

const hexToRgb = (hex?: string) => {
  if (!hex) return [255, 255, 255];
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const int = Number.parseInt(value, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
};
