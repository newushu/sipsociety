"use client";

import SiteHeader from "@/components/SiteHeader";
import { GlobalSettings } from "@/lib/content/types";
import { fontFamilyForKey } from "@/lib/content/fonts";

type Props = {
  globals: GlobalSettings;
  links: { href: string; label: string }[];
  children: React.ReactNode;
  allowOverflow?: boolean;
};

export default function HomePageShell({
  globals,
  links,
  children,
  allowOverflow = false,
}: Props) {
  const resolvedLinks = (() => {
    const hasHome = links.some((link) => {
      const href = (link.href || "").trim().replace(/\/+$/, "");
      return href === "" || href === "/";
    });
    if (hasHome) return links;
    return [{ href: "/", label: "Home" }, ...links];
  })();
  const logoTextStyle = globals.logoTextStyle
    ? {
        fontSize: `${globals.logoTextStyle.size}px`,
        fontWeight: globals.logoTextStyle.weight,
        fontStyle: globals.logoTextStyle.italic ? "italic" : "normal",
        transform: `translate(${globals.logoTextStyle.x ?? 0}px, ${globals.logoTextStyle.y ?? 0}px)`,
        fontFamily: fontFamilyForKey(globals.bodyFont),
      }
    : undefined;
  const menuButtonFont = globals.menuButtonFont
    ? fontFamilyForKey(globals.menuButtonFont)
    : undefined;
  const menuItemFont = globals.menuItemFont
    ? fontFamilyForKey(globals.menuItemFont)
    : undefined;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-100 text-stone-900"
      style={{ fontFamily: fontFamilyForKey(globals.bodyFont) }}
    >
      <div className={allowOverflow ? "relative overflow-visible" : "relative overflow-hidden"}>
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-amber-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 top-24 h-72 w-72 rounded-full bg-stone-200/70 blur-3xl" />
        <SiteHeader
          logoMark={globals.logoMark}
          logoText={globals.logoText}
          logoTextStyle={logoTextStyle}
          logoImageUrl={globals.logoImageUrl}
          showLogoMark={globals.showLogoMark}
          showLogoText={globals.showLogoText}
          showLogoBox={globals.showLogoBox}
          menuButtonText={globals.menuButtonText}
          menuButtonTextColor={globals.menuButtonTextColor}
          menuButtonBorderColor={globals.menuButtonBorderColor}
          menuButtonBg={globals.menuButtonBg}
          menuButtonFont={menuButtonFont}
          menuButtonTextSize={globals.menuButtonTextSize}
          menuItemFont={menuItemFont}
          menuItemSize={globals.menuItemSize}
          menuItemColor={globals.menuItemColor}
          menuPanelBg={globals.menuPanelBg}
          menuPanelTextColor={globals.menuPanelTextColor}
          menuPanelWidthPct={globals.menuPanelWidthPct}
          facebookUrl={globals.facebookUrl}
          instagramUrl={globals.instagramUrl}
          links={resolvedLinks}
        />
        <main className="relative mx-auto max-w-6xl px-6 pb-16 pt-0">{children}</main>
      </div>
    </div>
  );
}
