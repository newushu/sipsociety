import BlockRenderer from "@/components/blocks/BlockRenderer";
import IntroOverlay from "@/components/IntroOverlay";
import SiteHeader from "@/components/SiteHeader";
import { getPublishedContent, getPublishedGlobals } from "@/lib/content/store";

export const revalidate = 0;

export default async function Home() {
  const content = await getPublishedContent();
  const globals = await getPublishedGlobals();
  const styleFrom = (style?: { size: number; weight: number; italic?: boolean; x?: number; y?: number }) =>
    style
      ? {
          fontSize: `${style.size}px`,
          fontWeight: style.weight,
          fontStyle: style.italic ? "italic" : "normal",
          transform: `translate(${style.x ?? 0}px, ${style.y ?? 0}px)`,
        }
      : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-100 text-stone-900">
      <IntroOverlay
        logoText={globals.logoText}
        motto={globals.motto}
        logoTextStyle={styleFrom(globals.logoTextStyle)}
        mottoStyle={styleFrom(globals.mottoStyle)}
      />
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-amber-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 top-24 h-72 w-72 rounded-full bg-stone-200/70 blur-3xl" />
        <SiteHeader
          logoMark={globals.logoMark}
          logoText={globals.logoText}
          logoTextStyle={styleFrom(globals.logoTextStyle)}
          links={[
            { href: "#brand", label: "Brand" },
            { href: "#media", label: "Media" },
            { href: "#landscape", label: "Atmosphere" },
            { href: "/menu", label: "Menu" },
          ]}
        />
        <main className="relative mx-auto max-w-6xl px-6 py-16">
          <BlockRenderer blocks={content.blocks} globals={globals} />
        </main>
      </div>
    </div>
  );
}
