import BlockRenderer from "@/components/blocks/BlockRenderer";
import IntroOverlay from "@/components/IntroOverlay";
import { getPublishedContent, getPublishedGlobals } from "@/lib/content/store";

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
        <header className="sticky top-0 z-10 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-sm font-semibold text-white">
                {globals.logoMark}
              </div>
              <span
                className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-600"
                style={styleFrom(globals.logoTextStyle)}
              >
                {globals.logoText}
              </span>
            </div>
            <nav className="hidden items-center gap-6 text-sm font-semibold text-stone-600 md:flex">
              <a href="#brand" className="hover:text-stone-900">
                Brand
              </a>
              <a href="#media" className="hover:text-stone-900">
                Media
              </a>
              <a href="#landscape" className="hover:text-stone-900">
                Atmosphere
              </a>
            </nav>
          </div>
        </header>
        <main className="relative mx-auto max-w-6xl px-6 py-16">
          <BlockRenderer blocks={content.blocks} globals={globals} />
        </main>
      </div>
    </div>
  );
}
