import BlockRenderer from "@/components/blocks/BlockRenderer";
import IntroOverlay from "@/components/IntroOverlay";
import HomePageShell from "@/components/HomePageShell";
import { getPublishedContent, getPublishedGlobals } from "@/lib/content/store";
import { fontFamilyForKey } from "@/lib/content/fonts";
import type { TextStyle } from "@/lib/content/types";

export const revalidate = 0;

export default async function Home() {
  const content = await getPublishedContent();
  const globals = await getPublishedGlobals();
  const styleFrom = (style?: TextStyle) =>
    style
      ? {
          fontSize: style.size ? `${style.size}px` : undefined,
          fontWeight: style.weight,
          fontStyle: style.italic ? "italic" : "normal",
          transform: `translate(${style.x ?? 0}px, ${style.y ?? 0}px)`,
          fontFamily: fontFamilyForKey(style.font),
          color: style.color,
        }
      : undefined;

  return (
    <>
      <IntroOverlay
        mode="fullscreen"
        logoText={globals.logoText}
        motto={globals.motto}
        logoTextStyle={{
          ...(styleFrom(globals.logoTextStyle) ?? {}),
          fontFamily: fontFamilyForKey(globals.logoTextStyle?.font ?? globals.bodyFont),
        }}
        mottoStyle={{
          ...(styleFrom(globals.mottoStyle) ?? {}),
          fontFamily: fontFamilyForKey(globals.mottoStyle?.font ?? globals.mottoFont),
        }}
        logoMark={globals.logoMark}
        logoImageUrl={globals.logoImageUrl}
        showLogoMark={globals.showLogoMark}
        logoScale={globals.introLogoScale ?? 1}
        logoX={globals.introLogoX ?? 0}
        logoY={globals.introLogoY ?? 0}
        showLogoText={globals.showLogoText}
        enabled={globals.introEnabled}
        bgFrom={globals.introBgFrom}
        bgVia={globals.introBgVia}
        bgTo={globals.introBgTo}
        textColor={globals.introTextColor}
        wipeColor={globals.introWipeColor}
        holdMs={globals.introHoldMs}
        wipeMs={globals.introWipeMs}
        fadeMs={globals.introFadeMs}
        animationType={globals.introAnimationType}
      />
      <HomePageShell
          globals={globals}
          links={
            globals.menuItems?.length
              ? globals.menuItems.map((item) => ({ href: item.href, label: item.label }))
              : [
                  { href: "/about-us", label: "About us" },
                  { href: "/menu", label: "Menu" },
                  { href: "/gallery", label: "Gallery" },
                  { href: "/career", label: "Career" },
                  { href: "/contact-us", label: "Contact us" },
                ]
          }
        >
        <BlockRenderer blocks={content.blocks} globals={globals} />
      </HomePageShell>
    </>
  );
}
