"use client";

import { GlobalSettings } from "@/lib/content/types";
import { fontFamilyForKey } from "@/lib/content/fonts";

type Props = {
  globals: GlobalSettings;
  links: { href: string; label: string }[];
};

export default function SiteFooter({ globals, links }: Props) {
  const logoTextStyle = globals.logoTextStyle
    ? {
        fontSize: `${globals.logoTextStyle.size}px`,
        fontWeight: globals.logoTextStyle.weight,
        fontStyle: globals.logoTextStyle.italic ? "italic" : "normal",
        transform: `translate(${globals.logoTextStyle.x ?? 0}px, ${globals.logoTextStyle.y ?? 0}px)`,
        fontFamily: fontFamilyForKey(globals.bodyFont),
      }
    : undefined;

  return (
    <footer className="mt-16 border-t border-stone-200/80 bg-white/80 px-6 py-12 text-stone-700 shadow-[0_-12px_30px_rgba(120,113,108,0.08)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-3">
          {globals.logoImageUrl ? (
            <img
              src={globals.logoImageUrl}
              alt={globals.logoText || globals.logoMark || "Logo"}
              className="h-12 w-12 rounded-full object-cover shadow"
            />
          ) : null}
          {globals.showLogoMark ? (
            <span className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-stone-600">
              {globals.logoMark || "SS"}
            </span>
          ) : null}
          {globals.showLogoText ? (
            <span className="text-sm font-semibold text-stone-800" style={logoTextStyle}>
              {globals.logoText || "Sip Society"}
            </span>
          ) : null}
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-stone-800">
              {link.label}
            </a>
          ))}
        </nav>
        <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400">
          © {new Date().getFullYear()} {globals.logoText || "Sip Society"}
        </p>
      </div>
    </footer>
  );
}
