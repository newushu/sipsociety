import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { defaultMenuContent } from "@/lib/content/defaults";
import { normalizeMenuBlock } from "@/lib/content/menu";
import { getPublishedContent, getPublishedGlobals } from "@/lib/content/store";
import { fontFamilyForKey } from "@/lib/content/fonts";
import { MenuBlock, TextStyle } from "@/lib/content/types";
import ZoomableMenuImage from "@/components/menu/ZoomableMenuImage";

export const revalidate = 60;

export default async function MenuPage() {
  const content = await getPublishedContent("menu");
  const globals = await getPublishedGlobals();
  const rawMenuBlock =
    (content.blocks.find((block) => block.type === "menu") as MenuBlock) ??
    (defaultMenuContent.blocks[0] as MenuBlock);
  const { block: menuBlock } = normalizeMenuBlock(rawMenuBlock);
  const styleFrom = (style?: TextStyle) =>
    style
      ? {
          fontSize: `${style.size}px`,
          fontWeight: style.weight,
          fontStyle: style.italic ? "italic" : "normal",
          transform: `translate(${style.x ?? 0}px, ${style.y ?? 0}px)`,
          fontFamily: fontFamilyForKey(style.font),
          color: style.color,
        }
      : undefined;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-100 text-stone-900"
      style={{ fontFamily: fontFamilyForKey(globals.bodyFont) }}
    >
      <SiteHeader
        logoMark={globals.logoMark}
        logoText={globals.logoText}
        logoTextStyle={{
          ...(styleFrom(globals.logoTextStyle) ?? {}),
          fontFamily: fontFamilyForKey(globals.logoTextStyle?.font ?? globals.bodyFont),
        }}
        showLogoMark={globals.showLogoMark}
        showLogoText={globals.showLogoText}
        showLogoBox={globals.showLogoBox}
        links={
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
              ]
        }
      />
      <main className="px-4 py-16 sm:px-6">
        <div className="mx-auto mb-8 max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">
            Menu
          </p>
          <h1
            className="mt-3 text-3xl font-semibold text-stone-900 sm:text-5xl"
            style={styleFrom(menuBlock.data.headingStyle)}
          >
            {menuBlock.data.heading}
          </h1>
          {menuBlock.data.subheading ? (
            <p
              className="mt-3 max-w-3xl text-sm text-stone-600 sm:text-base"
              style={styleFrom(menuBlock.data.subheadingStyle)}
            >
              {menuBlock.data.subheading}
            </p>
          ) : null}
        </div>
        <div
          className="mx-auto flex max-w-6xl flex-col"
          style={{ gap: `${menuBlock.data.menuImageGapPx ?? 20}px` }}
        >
          {menuBlock.data.menuImageOneUrl ? (
            <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
              <ZoomableMenuImage
                src={menuBlock.data.menuImageOneUrl}
                alt={menuBlock.data.menuImageOneAlt || "Menu image one"}
                widthPx={menuBlock.data.menuImageOneWidthPx ?? 760}
                heightPx={menuBlock.data.menuImageHeightPx ?? 430}
              />
            </div>
          ) : null}
          {menuBlock.data.menuImageTwoUrl ? (
            <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
              <ZoomableMenuImage
                src={menuBlock.data.menuImageTwoUrl}
                alt={menuBlock.data.menuImageTwoAlt || "Menu image two"}
                widthPx={menuBlock.data.menuImageTwoWidthPx ?? 760}
                heightPx={menuBlock.data.menuImageHeightPx ?? 430}
              />
            </div>
          ) : null}
        </div>
      </main>
      <SiteFooter
        globals={globals}
        links={
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
              ]
        }
      />
    </div>
  );
}
