import HomePageShell from "@/components/HomePageShell";
import SiteFooter from "@/components/SiteFooter";
import CareerForm from "@/components/careers/CareerForm";
import { defaultCareerContent } from "@/lib/content/defaults";
import { fontFamilyForKey } from "@/lib/content/fonts";
import { getPublishedContentOrNull, getPublishedGlobals } from "@/lib/content/store";
import { TextStyle } from "@/lib/content/types";
import { createServerClient } from "@/lib/supabase/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function CareerPage() {
  const globals = await getPublishedGlobals();
  const content = await getPublishedContentOrNull("career");
  const career = { ...defaultCareerContent, ...(content?.career ?? {}) };
  const styleFrom = (style?: TextStyle) =>
    style
      ? {
          fontFamily: fontFamilyForKey(style.font),
          fontSize: style.size ? `${style.size}px` : undefined,
          fontWeight: style.weight,
          letterSpacing: style.tracking ? `${style.tracking}em` : undefined,
          textTransform: style.transform,
          color: style.color,
        }
      : undefined;
  const supabase = createServerClient();
  const { data: positions } = await supabase
    .from("job_positions")
    .select("id,title,description")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const links =
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
        ];

  return (
    <HomePageShell globals={globals} links={links} allowOverflow>
      <section className="relative left-1/2 w-screen -translate-x-1/2 min-h-[90vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={career.heroImageUrl}
            alt="Sip Society careers"
            className="h-full w-full object-cover"
            style={{ filter: `saturate(${Math.max(0, 1 - career.heroImageDesaturate)})` }}
          />
          <div className="absolute inset-0 bg-black/45" />
        </div>
        <div className="relative z-10 flex min-h-[90vh] items-center justify-center px-6 py-16">
            <div className="w-full max-w-2xl space-y-6 text-center text-white">
            <p
              className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-200"
              style={styleFrom(career.heroEyebrowStyle)}
            >
              {career.heroEyebrow}
            </p>
            <h1
              className="text-4xl font-semibold md:text-5xl"
              style={styleFrom(career.heroHeadlineStyle)}
            >
              {career.heroHeadline}
            </h1>
            <p
              className="mx-auto max-w-xl text-sm text-amber-100/90"
              style={styleFrom(career.heroBodyStyle)}
            >
              {career.heroBody}
            </p>
            <div
              className="rounded-3xl border border-white/20 p-6 shadow-lg backdrop-blur"
              style={{
                backgroundColor: `rgba(${hexToRgb(career.applyCardBgColor).join(",")}, ${
                  career.applyCardBgOpacity
                })`,
                color: career.applyCardTextColor,
              }}
            >
              <h2 className="text-2xl font-semibold" style={styleFrom(career.applyHeadingStyle)}>
                {career.applyHeading}
              </h2>
              <p className="mt-2 text-sm" style={styleFrom(career.applyBodyStyle)}>
                {career.applyBody}
              </p>
              <p
                className="mt-3 text-xs uppercase tracking-[0.3em] text-white/70"
                style={styleFrom(career.applyButtonStyle)}
              >
                {career.applyButtonText}
              </p>
            </div>
            <div className="mx-auto w-full max-w-2xl">
              <CareerForm
                positions={positions ?? []}
                containerStyle={{
                  backgroundColor: `rgba(${hexToRgb(career.formCardBgColor).join(",")}, ${
                    career.formCardBgOpacity
                  })`,
                  color: career.formCardTextColor,
                }}
                submitText={career.applyButtonText}
              />
            </div>
          </div>
        </div>
      </section>
      <SiteFooter globals={globals} links={links} />
    </HomePageShell>
  );
}

const hexToRgb = (hex?: string) => {
  if (!hex) return [255, 255, 255];
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const int = Number.parseInt(value, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
};
