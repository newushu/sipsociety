import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import GalleryClient from "@/components/gallery/GalleryClient";
import { defaultGalleryContent } from "@/lib/content/defaults";
import { fontFamilyForKey } from "@/lib/content/fonts";
import { getPublishedContent, getPublishedGlobals } from "@/lib/content/store";
import { createServerClient } from "@/lib/supabase/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const content = await getPublishedContent("gallery");
  const globals = await getPublishedGlobals();
  const gallery = content.gallery ?? defaultGalleryContent.gallery!;

  const itemIds = gallery.rows.flatMap((row) => row.items.map((item) => item.id));
  let initialLikes: Record<string, number> = {};

  try {
    if (itemIds.length) {
      const supabase = createServerClient();
      const { data } = await supabase
        .from("gallery_likes")
        .select("item_id")
        .in("item_id", itemIds);
      initialLikes = (data ?? []).reduce<Record<string, number>>((acc, row) => {
        acc[row.item_id] = (acc[row.item_id] ?? 0) + 1;
        return acc;
      }, {});
    }
  } catch (error) {
    initialLikes = {};
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-100 text-stone-900"
      style={{ fontFamily: fontFamilyForKey(globals.bodyFont) }}
    >
      <SiteHeader
        logoMark={globals.logoMark}
        logoText={globals.logoText}
        logoTextStyle={{
          ...(globals.logoTextStyle ?? {}),
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
      <GalleryClient gallery={gallery} initialLikes={initialLikes} />
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
