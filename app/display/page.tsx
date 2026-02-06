import { getPublishedGlobals } from "@/lib/content/store";
import { fontFamilyForKey } from "@/lib/content/fonts";

export default async function DisplayPage() {
  const globals = await getPublishedGlobals();

  return (
    <div
      className="min-h-screen bg-stone-950 text-amber-50"
      style={{ fontFamily: fontFamilyForKey(globals.bodyFont) }}
    >
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-8 py-12">
        <header className="flex items-center justify-between border-b border-amber-200/20 pb-6">
          <div>
            {globals.showLogoText ? (
              <p className="text-xs uppercase tracking-[0.4em] text-amber-200/60">
                {globals.logoText}
              </p>
            ) : null}
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Menu Display</h1>
          </div>
          <div className="text-right">
            <p
              className="text-sm text-amber-200/70"
              style={{ fontFamily: fontFamilyForKey(globals.mottoFont) }}
            >
              {globals.motto}
            </p>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-200/50">
              Live menu
            </p>
          </div>
        </header>

        <main className="mt-10 flex-1">
          <div className="rounded-3xl border border-amber-200/20 bg-stone-900/60 p-8 text-amber-100">
            Menu board template will be built later. Use the admin workspace to keep
            content updated.
          </div>
        </main>

        <footer className="border-t border-amber-200/20 pt-6 text-xs uppercase tracking-[0.3em] text-amber-200/50">
          Updates from published content. Refresh to sync.
        </footer>
      </div>
    </div>
  );
}
