"use client";

import HomePageShell from "@/components/HomePageShell";
import { InlineEditTarget } from "@/components/admin/inlineEditTypes";
import { defaultContactContent } from "@/lib/content/defaults";
import { fontFamilyForKey } from "@/lib/content/fonts";
import { ContactContent, GlobalSettings, PageContent, TextStyle } from "@/lib/content/types";

type Props = {
  content: PageContent;
  globals: GlobalSettings;
  onSelectEdit: (target: InlineEditTarget) => void;
};

const editBadge =
  "left-1/2 top-4 -translate-x-1/2 rounded-full border border-white/70 bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-700 shadow-sm opacity-0 transition group-hover:opacity-100";
const editBadgeCentered =
  "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-700 shadow-sm opacity-0 transition group-hover:opacity-100";

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

const colorWithOpacity = (hex: string, opacity: number) => {
  const cleaned = hex.replace("#", "").trim();
  const value =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : cleaned;
  if (value.length !== 6) return hex;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const Editable = ({
  label,
  target,
  onSelectEdit,
  children,
  className,
  badgeClassName,
}: {
  label: string;
  target: InlineEditTarget;
  onSelectEdit: (target: InlineEditTarget) => void;
  children: React.ReactNode;
  className?: string;
  badgeClassName?: string;
}) => (
  <div
    className={`group relative cursor-pointer ${className ?? ""}`}
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
      className={`absolute ${badgeClassName ?? editBadge}`}
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

const resolveContact = (content: PageContent): ContactContent => {
  const fallback = defaultContactContent.contact!;
  return { ...fallback, ...(content.contact ?? {}) };
};

export default function ContactInlinePreview({
  content,
  globals,
  onSelectEdit,
}: Props) {
  const contact = resolveContact(content);
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

  const boxStyle = {
    backgroundColor: colorWithOpacity(contact.boxColor, contact.boxOpacity),
    color: contact.boxTextColor,
  } as React.CSSProperties;

  const backgroundStyle: React.CSSProperties = {
    objectPosition: `${contact.backgroundX ?? 50}% ${contact.backgroundY ?? 50}%`,
    transform: `scale(${contact.backgroundScale ?? 1})`,
  };

  const showLogo = Boolean(globals.logoImageUrl);

  return (
    <HomePageShell globals={globals} links={links} allowOverflow>
      <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden">
        <div
          className="absolute inset-0 z-20 cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            onSelectEdit({ kind: "media", scope: "contactBackground", blockIndex: 0 });
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              onSelectEdit({ kind: "media", scope: "contactBackground", blockIndex: 0 });
            }
          }}
        >
          <button className={`absolute ${editBadgeCentered} opacity-100`} type="button">
            Edit background
          </button>
        </div>
        <div className="absolute inset-0 pointer-events-none">
            {contact.backgroundType === "video" ? (
              <video
                className="h-full w-full object-cover"
                src={contact.backgroundUrl}
                autoPlay
                muted
                loop
                playsInline
                style={backgroundStyle}
              />
            ) : (
              <img
                src={contact.backgroundUrl}
                alt="Contact background"
                className="h-full w-full object-cover"
                style={backgroundStyle}
              />
            )}
            <div className="absolute inset-0 bg-black/40" />
          </div>
        <div className="relative z-10 flex min-h-[85vh] items-center justify-center px-6 py-16">
          <div className="w-full max-w-lg">
            <Editable
              label="Edit form box"
              target={{ kind: "container", scope: "contactFormCard" }}
              onSelectEdit={onSelectEdit}
            >
              <div
                className="rounded-[32px] border border-white/40 bg-white/90 p-8 shadow-2xl backdrop-blur"
                style={boxStyle}
              >
                <div className="flex flex-col items-center gap-4 text-center">
                  {showLogo ? (
                    <img
                      src={globals.logoImageUrl}
                      alt={globals.logoText || "Logo"}
                      className="h-16 w-16 rounded-full object-cover shadow"
                    />
                  ) : (
                    <div className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-600">
                      {globals.logoText || globals.logoMark || "Sip Society"}
                    </div>
                  )}
                  <Editable
                    label="Edit heading"
                    target={{ kind: "text", scope: "contactHeading" }}
                    onSelectEdit={onSelectEdit}
                  >
                    <h1
                      className="text-3xl font-semibold text-stone-900"
                      style={styleFrom(contact.headingStyle)}
                    >
                      {contact.heading}
                    </h1>
                  </Editable>
                  <Editable
                    label="Edit body"
                    target={{ kind: "text", scope: "contactBody" }}
                    onSelectEdit={onSelectEdit}
                  >
                    <p
                      className="text-sm text-stone-600"
                      style={styleFrom(contact.bodyStyle)}
                    >
                      {contact.body}
                    </p>
                  </Editable>
                </div>
                <div className="mt-6 space-y-2">
                  <Editable
                    label="Edit label"
                    target={{ kind: "text", scope: "contactLabel" }}
                    onSelectEdit={onSelectEdit}
                  >
                    <label
                      className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500"
                      style={styleFrom(contact.labelStyle)}
                    >
                      {contact.label}
                    </label>
                  </Editable>
                  <Editable
                    label="Edit placeholder"
                    target={{ kind: "text", scope: "contactPlaceholder" }}
                    onSelectEdit={onSelectEdit}
                  >
                    <input
                      className="w-full rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-sm text-stone-800 shadow-sm"
                      placeholder={contact.placeholder}
                      readOnly
                      style={{
                        fontFamily: fontFamilyForKey(contact.labelStyle?.font),
                        color: contact.boxTextColor,
                      }}
                    />
                  </Editable>
                  <Editable
                    label="Edit message label"
                    target={{ kind: "text", scope: "contactMessageLabel" }}
                    onSelectEdit={onSelectEdit}
                  >
                    <label
                      className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500"
                      style={styleFrom(contact.labelStyle)}
                    >
                      {contact.messageLabel}
                    </label>
                  </Editable>
                  <Editable
                    label="Edit message placeholder"
                    target={{ kind: "text", scope: "contactMessagePlaceholder" }}
                    onSelectEdit={onSelectEdit}
                  >
                    <textarea
                      className="min-h-[120px] w-full rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-sm text-stone-800 shadow-sm"
                      placeholder={contact.messagePlaceholder}
                      readOnly
                      style={{
                        fontFamily: fontFamilyForKey(contact.labelStyle?.font),
                        color: contact.boxTextColor,
                      }}
                    />
                  </Editable>
                </div>
                <div className="mt-4">
                  <div className="group relative">
                    <button
                      className="absolute left-4 top-4 rounded-full border border-white/70 bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-700 shadow-sm opacity-0 transition group-hover:opacity-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectEdit({ kind: "text", scope: "contactButton" });
                      }}
                      type="button"
                    >
                      Edit button
                    </button>
                    <button
                      className="absolute right-4 top-4 rounded-full border border-white/70 bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-700 shadow-sm opacity-0 transition group-hover:opacity-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectEdit({ kind: "container", scope: "contactButton" });
                      }}
                      type="button"
                    >
                      Button color
                    </button>
                    <button
                      className="w-full rounded-2xl px-4 py-3 text-sm font-semibold shadow"
                      style={{
                        backgroundColor: contact.buttonColor,
                        color: contact.buttonTextColor,
                        ...styleFrom(contact.buttonStyle),
                      }}
                      type="button"
                      onClick={(event) => event.preventDefault()}
                    >
                      {contact.buttonText}
                    </button>
                  </div>
                </div>
              </div>
            </Editable>
          </div>
        </div>
      </section>
    </HomePageShell>
  );
}
