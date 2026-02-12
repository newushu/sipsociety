import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { defaultMenuContent } from "@/lib/content/defaults";
import { normalizeMenuBlock } from "@/lib/content/menu";
import { getPublishedContent, getPublishedGlobals } from "@/lib/content/store";
import { fontFamilyForKey } from "@/lib/content/fonts";
import { MenuBlock, TextStyle } from "@/lib/content/types";

export const revalidate = 0;

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
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-[36px] border border-stone-200 bg-white/90 p-10 shadow-xl shadow-amber-900/10">
          <p
            className="text-xs font-semibold uppercase tracking-[0.5em] text-amber-500/80"
            style={styleFrom(globals.logoTextStyle)}
          >
            Sip Society Menu
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-stone-900 sm:text-5xl">
            <span style={styleFrom(menuBlock.data.headingStyle)}>
              {menuBlock.data.heading}
            </span>
          </h1>
          <p
            className="mt-3 max-w-2xl text-sm text-stone-600"
            style={styleFrom(menuBlock.data.subheadingStyle)}
          >
            {menuBlock.data.subheading}
          </p>
          {menuBlock.data.note ? (
            <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-5 py-4 text-sm text-stone-600">
              <span style={styleFrom(menuBlock.data.noteStyle)}>
                {menuBlock.data.note}
              </span>
            </div>
          ) : null}
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            {menuBlock.data.sections.map((section) => {
              const coords = section.items.flatMap((item) => [
                item.namePos?.y ?? 0,
                item.detailPos?.y ?? 0,
                item.pricePos?.y ?? 0,
              ]);
              const maxY = coords.length ? Math.max(...coords) : 0;
              const minHeight = Math.max(220, maxY + 80);
              return (
              <section
                key={section.id}
                className="relative rounded-3xl border border-stone-200 bg-stone-50/80 p-6"
                style={{ minHeight }}
              >
                <h2
                  className="text-lg font-semibold text-stone-800"
                  style={styleFrom(menuBlock.data.sectionTitleStyle)}
                >
                  {section.title}
                </h2>
                <div className="relative mt-4">
                  {section.items.map((item) => (
                    <div key={item.id} className="relative">
                      <div
                        className="absolute left-0 top-0 text-sm font-semibold text-stone-900"
                        style={{
                          transform: `translate(${item.namePos?.x ?? 0}px, ${
                            item.namePos?.y ?? 0
                          }px)`,
                          ...(styleFrom(menuBlock.data.itemNameStyle) ?? {}),
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        className="absolute left-0 top-0 text-xs text-stone-500"
                        style={{
                          transform: `translate(${item.detailPos?.x ?? 0}px, ${
                            item.detailPos?.y ?? 0
                          }px)`,
                          ...(styleFrom(menuBlock.data.itemDetailStyle) ?? {}),
                        }}
                      >
                        {item.detail}
                      </div>
                      {menuBlock.data.showPrices !== false && item.showPrice !== false ? (
                        <div
                        className="absolute left-0 top-0 text-sm font-semibold text-stone-700"
                        style={{
                          transform: `translate(${item.pricePos?.x ?? 0}px, ${
                            item.pricePos?.y ?? 0
                          }px)`,
                          ...(styleFrom(menuBlock.data.itemPriceStyle) ?? {}),
                        }}
                      >
                          {item.price}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
              );
            })}
          </div>
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
