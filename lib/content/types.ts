export type CtaLink = {
  label: string;
  href: string;
};

export type TextStyle = {
  size: number;
  weight: number;
  italic?: boolean;
  x?: number;
  y?: number;
};

export type MediaAsset = {
  url: string;
  alt: string;
  type: "image" | "video";
  x: number;
  y: number;
  scale: number;
};

export type HeroBlock = {
  id: string;
  type: "hero";
  data: {
    videoUrl: string;
    videoX: number;
    videoY: number;
    videoScale: number;
    overlayOpacity: number;
    videoDesaturate?: number;
    tagline: string;
    taglineStyle?: TextStyle;
    logoScale?: number;
    logoBoxScale?: number;
    logoX?: number;
    logoY?: number;
  };
};

export type BrandMessageBlock = {
  id: string;
  type: "brand-message";
  data: {
    heading: string;
    headingStyle?: TextStyle;
    message: string;
    messageStyle?: TextStyle;
    icon: "coffee";
    logoScale?: number;
    logoBoxScale?: number;
    logoX?: number;
    logoY?: number;
  };
};

export type TripleMediaBlock = {
  id: string;
  type: "triple-media";
  data: {
    leftTitle: string;
    leftTitleStyle?: TextStyle;
    leftBody: string;
    leftBodyStyle?: TextStyle;
    leftAccent: string;
    leftLogoScale?: number;
    leftLogoBoxScale?: number;
    leftLogoX?: number;
    leftLogoY?: number;
    middleMedia: MediaAsset;
    rightMedia: MediaAsset;
  };
};

export type LandscapeBlock = {
  id: string;
  type: "landscape";
  data: {
    media: MediaAsset;
    caption: string;
    captionStyle?: TextStyle;
  };
};

export type FooterBlock = {
  id: string;
  type: "footer";
  data: {
    tagline: string;
    taglineStyle?: TextStyle;
    links: { label: string; href: string }[];
  };
};

export type ContentBlock =
  | HeroBlock
  | BrandMessageBlock
  | TripleMediaBlock
  | LandscapeBlock
  | FooterBlock;

export type BlockType = ContentBlock["type"];

export type PageContent = {
  title: string;
  blocks: ContentBlock[];
};

export type GlobalSettings = {
  logoText: string;
  logoMark: string;
  logoImageUrl?: string;
  motto: string;
  brandMessage?: string;
  logoTextStyle?: TextStyle;
  mottoStyle?: TextStyle;
  brandMessageStyle?: TextStyle;
  borderEnabled?: boolean;
  borderColor?: string;
  borderWidth?: number;
};
