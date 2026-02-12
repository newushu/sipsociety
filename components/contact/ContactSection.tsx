"use client";

import { ContactContent, GlobalSettings, TextStyle } from "@/lib/content/types";
import { fontFamilyForKey } from "@/lib/content/fonts";

type Props = {
  contact: ContactContent;
  globals: GlobalSettings;
};

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

export default function ContactSection({ contact, globals }: Props) {
  const backgroundStyle: React.CSSProperties = {
    objectPosition: `${contact.backgroundX ?? 50}% ${contact.backgroundY ?? 50}%`,
    transform: `scale(${contact.backgroundScale ?? 1})`,
  };

  const boxStyle: React.CSSProperties = {
    backgroundColor: colorWithOpacity(contact.boxColor, contact.boxOpacity),
    color: contact.boxTextColor,
  };

  const showLogo = Boolean(globals.logoImageUrl);

  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden">
      <div className="absolute inset-0">
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
          <div
            className="rounded-[32px] border border-white/40 bg-white/90 p-8 text-center shadow-2xl backdrop-blur"
            style={boxStyle}
          >
            <div className="flex flex-col items-center gap-4">
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
              <h1
                className="text-3xl font-semibold text-stone-900"
                style={styleFrom(contact.headingStyle)}
              >
                {contact.heading}
              </h1>
              <p className="text-sm text-stone-600" style={styleFrom(contact.bodyStyle)}>
                {contact.body}
              </p>
            </div>
            <form className="mt-6 space-y-3 text-left">
              <label
                className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500"
                style={styleFrom(contact.labelStyle)}
              >
                {contact.label}
              </label>
              <input
                className="w-full rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-sm text-stone-800 shadow-sm"
                placeholder={contact.placeholder}
                readOnly
                style={{
                  fontFamily: fontFamilyForKey(contact.labelStyle?.font),
                  color: contact.boxTextColor,
                }}
              />
              <label
                className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500"
                style={styleFrom(contact.labelStyle)}
              >
                {contact.messageLabel}
              </label>
              <textarea
                className="min-h-[120px] w-full rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-sm text-stone-800 shadow-sm"
                placeholder={contact.messagePlaceholder}
                readOnly
                style={{
                  fontFamily: fontFamilyForKey(contact.labelStyle?.font),
                  color: contact.boxTextColor,
                }}
              />
              <button
                className="w-full rounded-2xl px-4 py-3 text-sm font-semibold shadow"
                style={{
                  backgroundColor: contact.buttonColor,
                  color: contact.buttonTextColor,
                  ...styleFrom(contact.buttonStyle),
                }}
                type="button"
              >
                {contact.buttonText}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
