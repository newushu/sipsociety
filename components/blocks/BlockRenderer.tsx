import { ContentBlock, GlobalSettings, TextStyle } from "@/lib/content/types";
import BrandMessageSection from "@/components/blocks/BrandMessageSection";

const sectionIds: Record<ContentBlock["type"], string> = {
  hero: "top",
  "brand-message": "brand",
  "triple-media": "media",
  landscape: "landscape",
  footer: "footer",
};

type Props = {
  blocks: ContentBlock[];
  globals?: GlobalSettings;
};

export default function BlockRenderer({ blocks, globals }: Props) {
  const logoMark = globals?.logoMark ?? "SS";
  const logoText = globals?.logoText ?? "Sip Society";
  const logoImageUrl = globals?.logoImageUrl ?? "";
  const borderEnabled = globals?.borderEnabled ?? true;
  const borderColor = globals?.borderColor ?? "#e7e2d9";
  const borderWidth = globals?.borderWidth ?? 1;
  const brandMessage = globals?.brandMessage;
  const styleFrom = (style?: TextStyle) =>
    style
      ? {
          fontSize: `${style.size}px`,
          fontWeight: style.weight,
          fontStyle: style.italic ? "italic" : "normal",
          transform: `translate(${style.x ?? 0}px, ${style.y ?? 0}px)`,
        }
      : undefined;
  return (
    <div className="space-y-28">
      {blocks.map((block) => {
        switch (block.type) {
          case "hero":
            return (
              <section
                key={block.id}
                id={sectionIds.hero}
                className="relative overflow-hidden rounded-[48px] border border-stone-200 bg-stone-900 text-white shadow-2xl shadow-stone-900/30"
                style={{
                  borderColor: borderEnabled ? borderColor : "transparent",
                  borderWidth: borderEnabled ? borderWidth : 0,
                }}
              >
                <div className="absolute inset-0">
                  <video
                    className="h-full w-full object-cover video-fade-loop"
                    autoPlay
                    muted
                    loop
                    playsInline
                    src={block.data.videoUrl}
                    style={{
                      objectPosition: `${block.data.videoX ?? 50}% ${block.data.videoY ?? 50}%`,
                      transform: `scale(${block.data.videoScale ?? 1})`,
                      filter: `grayscale(${block.data.videoDesaturate ?? 0.6})`,
                    }}
                  />
                  <div
                    className="absolute inset-0 bg-black"
                    style={{ opacity: block.data.overlayOpacity }}
                  />
                </div>
                <div className="relative z-10 flex min-h-[120vh] flex-col items-center justify-center gap-6 px-8 py-20 text-center sm:min-h-[140vh] sm:px-16 lg:min-h-[160vh]">
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.5em] text-amber-200/80"
                    style={styleFrom(globals?.logoTextStyle)}
                  >
                    {logoText}
                  </p>
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-100/40 bg-white/10 text-2xl font-semibold"
                    style={{ transform: `scale(${block.data.logoBoxScale ?? 1})` }}
                  >
                    {logoImageUrl ? (
                      <img
                        src={logoImageUrl}
                        alt={`${logoText} logo`}
                        className="h-16 w-16 rounded-full object-cover"
                        style={{
                          transform: `translate(${block.data.logoX ?? 0}%, ${block.data.logoY ?? 0}%) scale(${block.data.logoScale ?? 1})`,
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          transform: `translate(${block.data.logoX ?? 0}%, ${block.data.logoY ?? 0}%) scale(${block.data.logoScale ?? 1})`,
                        }}
                      >
                        {logoMark}
                      </span>
                    )}
                  </div>
                  <h1
                    className="max-w-2xl text-3xl font-semibold sm:text-5xl"
                    style={styleFrom(block.data.taglineStyle)}
                  >
                    {block.data.tagline}
                  </h1>
                </div>
              </section>
            );
          case "brand-message":
            return (
              <BrandMessageSection
                key={block.id}
                block={block}
                id={sectionIds["brand-message"]}
                logo={{
                  mark: logoMark,
                  text: logoText,
                  imageUrl: logoImageUrl,
                  scale: block.data.logoScale ?? 1,
                  boxScale: block.data.logoBoxScale ?? 1,
                  x: block.data.logoX ?? 0,
                  y: block.data.logoY ?? 0,
                }}
                border={{ enabled: borderEnabled, color: borderColor, width: borderWidth }}
                messageOverride={brandMessage}
                headingStyle={styleFrom(block.data.headingStyle)}
                messageStyle={styleFrom(globals?.brandMessageStyle ?? block.data.messageStyle)}
              />
            );
          case "triple-media":
            return (
              <section
                key={block.id}
                id={sectionIds["triple-media"]}
                className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr]"
              >
                <div
                  className="relative flex h-[60vh] flex-col items-center justify-center rounded-[36px] border border-stone-200 p-10 text-center text-white shadow-xl sm:h-[70vh] lg:h-[80vh]"
                  style={{
                    backgroundColor: block.data.leftAccent,
                    borderColor: borderEnabled ? borderColor : "transparent",
                    borderWidth: borderEnabled ? borderWidth : 0,
                  }}
                >
                  <div
                    className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-white/10 text-sm font-semibold"
                    style={{ transform: `scale(${block.data.leftLogoBoxScale ?? 1})` }}
                  >
                    {logoImageUrl ? (
                      <img
                        src={logoImageUrl}
                        alt={`${logoText} logo`}
                        className="h-12 w-12 rounded-full object-cover"
                        style={{
                          transform: `translate(${block.data.leftLogoX ?? 0}%, ${block.data.leftLogoY ?? 0}%) scale(${block.data.leftLogoScale ?? 1})`,
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          transform: `translate(${block.data.leftLogoX ?? 0}%, ${block.data.leftLogoY ?? 0}%) scale(${block.data.leftLogoScale ?? 1})`,
                        }}
                      >
                        {logoMark}
                      </span>
                    )}
                  </div>
                  <h3 className="text-3xl font-semibold" style={styleFrom(block.data.leftTitleStyle)}>
                    {block.data.leftTitle}
                  </h3>
                  <p className="mt-4 text-base text-white/80" style={styleFrom(block.data.leftBodyStyle)}>
                    {block.data.leftBody}
                  </p>
                </div>
                <div
                  className="relative h-[60vh] overflow-hidden rounded-[36px] border border-stone-200 bg-stone-100 sm:h-[70vh] lg:h-[80vh]"
                  style={{
                    borderColor: borderEnabled ? borderColor : "transparent",
                    borderWidth: borderEnabled ? borderWidth : 0,
                  }}
                >
                  <img
                    src={block.data.middleMedia.url}
                    alt={block.data.middleMedia.alt}
                    className="h-full w-full object-cover"
                    style={{
                      objectPosition: `${block.data.middleMedia.x}% ${block.data.middleMedia.y}%`,
                      transform: `scale(${block.data.middleMedia.scale})`,
                    }}
                  />
                </div>
                <div
                  className="relative h-[60vh] overflow-hidden rounded-[36px] border border-stone-200 bg-stone-900 sm:h-[70vh] lg:h-[80vh]"
                  style={{
                    borderColor: borderEnabled ? borderColor : "transparent",
                    borderWidth: borderEnabled ? borderWidth : 0,
                  }}
                >
                  <video
                    className="h-full w-full object-cover video-fade-loop"
                    autoPlay
                    muted
                    loop
                    playsInline
                    src={block.data.rightMedia.url}
                    style={{
                      objectPosition: `${block.data.rightMedia.x}% ${block.data.rightMedia.y}%`,
                      transform: `scale(${block.data.rightMedia.scale})`,
                    }}
                  />
                </div>
              </section>
            );
          case "landscape":
            return (
              <section
                key={block.id}
                id={sectionIds.landscape}
                className="overflow-hidden rounded-[48px] border border-stone-200 bg-stone-100"
                style={{
                  borderColor: borderEnabled ? borderColor : "transparent",
                  borderWidth: borderEnabled ? borderWidth : 0,
                }}
              >
                <div className="relative h-[48vh] w-full overflow-hidden">
                  <img
                    src={block.data.media.url}
                    alt={block.data.media.alt}
                    className="h-full w-full object-cover"
                    style={{
                      objectPosition: `${block.data.media.x}% ${block.data.media.y}%`,
                      transform: `scale(${block.data.media.scale})`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <p
                    className="absolute bottom-8 left-8 text-lg font-semibold text-white"
                    style={styleFrom(block.data.captionStyle)}
                  >
                    {block.data.caption}
                  </p>
                </div>
              </section>
            );
          case "footer":
            return (
              <footer
                key={block.id}
                id={sectionIds.footer}
                className="flex flex-wrap items-center justify-between gap-4 border-t border-stone-200 pt-6 text-sm text-stone-500"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-stone-900">Sip Society</p>
                  <p style={styleFrom(block.data.taglineStyle)}>{block.data.tagline}</p>
                </div>
                <div className="flex flex-wrap gap-4">
                  {block.data.links.map((link) => (
                    <a key={link.label} href={link.href} className="hover:text-stone-900">
                      {link.label}
                    </a>
                  ))}
                </div>
              </footer>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
