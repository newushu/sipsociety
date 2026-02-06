import BlockRenderer from "@/components/blocks/BlockRenderer";
import IntroOverlay from "@/components/IntroOverlay";
import HomePageShell from "@/components/HomePageShell";
import { getPublishedContent, getPublishedGlobals } from "@/lib/content/store";
import { fontFamilyForKey } from "@/lib/content/fonts";
import type { FontKey } from "@/lib/content/types";

export const revalidate = 0;

export default async function Home() {
  const content = await getPublishedContent();
  const globals = await getPublishedGlobals();
  const styleFrom = (style?: {
    size: number;
    weight: number;
    italic?: boolean;
    x?: number;
    y?: number;
    font?: FontKey;
  }) =>
    style
      ? {
          fontSize: `${style.size}px`,
          fontWeight: style.weight,
          fontStyle: style.italic ? "italic" : "normal",
          transform: `translate(${style.x ?? 0}px, ${style.y ?? 0}px)`,
          fontFamily: fontFamilyForKey(style.font),
        }
      : undefined;

  return (
    <>
      <IntroOverlay
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
      />
      <HomePageShell
          globals={globals}
          links={
            globals.menuItems?.length
              ? globals.menuItems.map((item) => ({ href: item.href, label: item.label }))
              : [
                  { href: "#brand", label: "Brand" },
                  { href: "#media", label: "Media" },
                  { href: "#landscape", label: "Atmosphere" },
                  { href: "/menu", label: "Menu" },
                ]
          }
        >
        <BlockRenderer blocks={content.blocks} globals={globals} />
      </HomePageShell>
    </>
  );
}
