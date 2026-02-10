import HomePageShell from "@/components/HomePageShell";
import AnimatedReveal from "@/components/about/AnimatedReveal";
import { defaultAboutContent } from "@/lib/content/defaults";
import { getPublishedContentOrNull, getPublishedGlobals } from "@/lib/content/store";
import { fontFamilyForKey } from "@/lib/content/fonts";
import type { TextStyle } from "@/lib/content/types";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const globals = await getPublishedGlobals();
  const content =
    (await getPublishedContentOrNull("about-us")) ??
    (await getPublishedContentOrNull("aboutus"));
  const about = { ...defaultAboutContent, ...(content?.about ?? {}) };
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
            src={about.heroImageUrl}
            alt="About us"
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: about.heroOverlayOpacity }}
          />
        </div>
        <div className="relative z-10 flex min-h-[90vh] items-center justify-center px-6 py-16">
          <div className="w-full max-w-3xl space-y-6 text-center text-white">
            <AnimatedReveal animation={about.heroLogoAnimation}>
              <img
                src={about.heroLogoUrl || globals.logoImageUrl}
                alt="Sip Society"
                className="mx-auto h-20 w-20 rounded-full object-cover"
                style={{
                  transform: `translate(${about.heroLogoX ?? 0}px, ${
                    about.heroLogoY ?? 0
                  }px) scale(${about.heroLogoScale ?? 1})`,
                }}
              />
            </AnimatedReveal>
            <AnimatedReveal animation={about.heroTitleAnimation}>
              <h1
                className="text-5xl font-semibold md:text-6xl"
                style={styleFrom(about.heroTitleStyle)}
              >
                {about.heroTitle}
              </h1>
            </AnimatedReveal>
            <AnimatedReveal animation={about.heroBodyAnimation}>
              <p
                className="mx-auto max-w-2xl text-base text-white/90"
                style={styleFrom(about.heroBodyStyle)}
              >
                {about.heroBody}
              </p>
            </AnimatedReveal>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <h2
          className="text-3xl font-semibold text-stone-900"
          style={styleFrom(about.sectionTitleStyle)}
        >
          {about.sectionTitle}
        </h2>
        <div className="mt-10 space-y-16">
          {about.sections.map((section) => {
            const isLeft = section.mediaSide === "left";
            return (
              <div
                key={section.id}
                className={`grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] ${
                  isLeft ? "" : "lg:[&>div:first-child]:order-2"
                }`}
              >
                <AnimatedReveal animation={section.mediaAnimation}>
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-stone-200 bg-stone-100 shadow-lg">
                    {section.mediaType === "video" ? (
                      <video
                        className="h-full w-full object-cover"
                        src={section.mediaUrl}
                        autoPlay
                        muted
                        loop
                      />
                    ) : (
                      <img
                        className="h-full w-full object-cover"
                        src={section.mediaUrl}
                        alt={section.mediaAlt ?? ""}
                      />
                    )}
                  </div>
                </AnimatedReveal>
                <AnimatedReveal animation={section.textAnimation}>
                  <div className="space-y-4">
                    <h3
                      className="text-2xl font-semibold text-stone-900"
                      style={styleFrom(section.headingStyle)}
                    >
                      {section.heading}
                    </h3>
                    <p
                      className="text-base text-stone-600"
                      style={styleFrom(section.bodyStyle)}
                    >
                      {section.body}
                    </p>
                  </div>
                </AnimatedReveal>
              </div>
            );
          })}
        </div>
      </section>
    </HomePageShell>
  );
}
