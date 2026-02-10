import BlockRenderer from "@/components/blocks/BlockRenderer";
import HomePageShell from "@/components/HomePageShell";
import { getPublishedContentOrNull, getPublishedGlobals } from "@/lib/content/store";
import { redirect } from "next/navigation";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams?: Promise<{ debug?: string }>;
};

export default async function DynamicPage({ params, searchParams }: Props) {
  const globals = await getPublishedGlobals();
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const slug = (resolvedParams.slug ?? []).join("/");
  const content = await getPublishedContentOrNull(slug);
  if (!content) {
    if (resolvedSearch?.debug === "1") {
      return (
        <HomePageShell
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
        >
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
            <p className="text-xs font-semibold uppercase tracking-[0.3em]">
              Debug: page not found
            </p>
            <p className="mt-3 text-sm">
              No published content found for slug: <span className="font-semibold">/{slug}</span>
            </p>
            <p className="mt-2 text-sm">
              Check Supabase `published_pages` for this slug or publish again.
            </p>
          </div>
        </HomePageShell>
      );
    }
    redirect("/");
  }
  const fallbackLinks = [
    { href: "/about-us", label: "About us" },
    { href: "/menu", label: "Menu" },
    { href: "/gallery", label: "Gallery" },
    { href: "/career", label: "Career" },
    { href: "/contact-us", label: "Contact us" },
  ];

  return (
    <HomePageShell
      globals={globals}
      links={
        globals.menuItems?.length
          ? globals.menuItems.map((item) => ({
              href: item.href.startsWith("#") ? `/${item.href}` : item.href,
              label: item.label,
            }))
          : fallbackLinks
      }
    >
      <BlockRenderer blocks={content.blocks} globals={globals} />
    </HomePageShell>
  );
}
