import { GlobalSettings, PageContent } from "./types";

export const defaultContent: PageContent = {
  title: "Sip Society",
  blocks: [
    {
      id: "hero-1",
      type: "hero",
      data: {
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        videoX: 50,
        videoY: 50,
        videoScale: 1,
        overlayOpacity: 0.55,
        videoDesaturate: 0.6,
        tagline: "Slow sips. Bright ideas.",
        taglineStyle: { size: 48, weight: 600, italic: false, x: 0, y: 0 },
        logoScale: 1,
        logoBoxScale: 1,
        logoX: 0,
        logoY: 0,
      },
    },
    {
      id: "brand-1",
      type: "brand-message",
      data: {
        heading: "Our brand message",
        headingStyle: { size: 12, weight: 600, italic: false, x: 0, y: 0 },
        message:
          "Sip Society is a third place for creatives. Thoughtful drinks, slow moments, and bright ideas.",
        messageStyle: { size: 30, weight: 600, italic: false, x: 0, y: 0 },
        icon: "coffee",
        logoScale: 1,
        logoBoxScale: 1,
        logoX: 0,
        logoY: 0,
      },
    },
    {
      id: "triple-1",
      type: "triple-media",
      data: {
        leftTitle: "Seasonal ritual",
        leftTitleStyle: { size: 30, weight: 600, italic: false, x: 0, y: 0 },
        leftBody:
          "Small-lot roasts and curated teas. The bar rotates weekly with new notes.",
        leftBodyStyle: { size: 16, weight: 500, italic: false, x: 0, y: 0 },
        leftAccent: "#c07a4a",
        leftLogoScale: 1,
        leftLogoBoxScale: 1,
        leftLogoX: 0,
        leftLogoY: 0,
        middleMedia: {
          url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1600&auto=format&fit=crop",
          alt: "Coffee pour",
          type: "image",
          x: 50,
          y: 50,
          scale: 1,
        },
        rightMedia: {
          url: "https://www.w3schools.com/html/mov_bbb.mp4",
          alt: "Barista motion",
          type: "video",
          x: 50,
          y: 50,
          scale: 1,
        },
      },
    },
    {
      id: "landscape-1",
      type: "landscape",
      data: {
        media: {
          url: "https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1800&auto=format&fit=crop",
          alt: "Cafe interior",
          type: "image",
          x: 50,
          y: 50,
          scale: 1,
        },
        caption: "An atmosphere built for slow sips and bright ideas.",
        captionStyle: { size: 18, weight: 600, italic: false, x: 0, y: 0 },
      },
    },
    {
      id: "footer-1",
      type: "footer",
      data: {
        tagline: "Sip Society. Slow sips, bright ideas.",
        taglineStyle: { size: 14, weight: 500, italic: false, x: 0, y: 0 },
        links: [
          { label: "Instagram", href: "#" },
          { label: "Spotify", href: "#" },
          { label: "Newsletter", href: "#" },
        ],
      },
    },
  ],
};

export const defaultGlobals: GlobalSettings = {
  logoText: "Sip Society",
  logoMark: "SS",
  logoImageUrl: "",
  motto: "Slow sips. Bright ideas.",
  brandMessage:
    "Sip Society is a third place for creatives. Thoughtful drinks, slow moments, and bright ideas.",
  logoTextStyle: { size: 12, weight: 600, italic: false, x: 0, y: 0 },
  mottoStyle: { size: 40, weight: 600, italic: false, x: 0, y: 0 },
  brandMessageStyle: { size: 30, weight: 600, italic: false, x: 0, y: 0 },
  borderEnabled: true,
  borderColor: "#e7e2d9",
  borderWidth: 1,
};
