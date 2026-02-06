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
  font?: FontKey;
};

export type FontKey =
  | "sans"
  | "system-apple"
  | "sans-alt"
  | "sans-inter"
  | "sans-dm"
  | "sans-jakarta"
  | "sans-work"
  | "sans-nunito"
  | "sans-raleway"
  | "sans-source"
  | "sans-urbanist"
  | "display"
  | "display-alt"
  | "display-cormorant"
  | "display-dmserif"
  | "display-baskerville"
  | "display-merriweather"
  | "display-bodoni"
  | "display-prata"
  | "display-sacramento"
  | "display-abril"
  | "display-cinzel"
  | "script-dancing"
  | "script-greatvibes"
  | "script-pacifico"
  | "script-allura"
  | "script-parisienne"
  | "script-satisfy"
  | "script-lobster"
  | "script-yellowtail"
  | "script-alexbrush"
  | "script-playball";

export type MediaAsset = {
  url: string;
  alt: string;
  type: "image" | "video";
  x: number;
  y: number;
  scale: number;
  linkEnabled?: boolean;
  linkUrl?: string;
};

export type MenuItem = {
  name: string;
  detail: string;
  price: string;
};

export type MenuSection = {
  title: string;
  items: MenuItem[];
};

export type MenuBlock = {
  id: string;
  type: "menu";
  data: {
    heading: string;
    subheading: string;
    note: string;
    sections: MenuSection[];
  };
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
    videoLinkEnabled?: boolean;
    videoLinkUrl?: string;
    tagline: string;
    showTagline?: boolean;
    taglineStyle?: TextStyle;
    taglineLinkEnabled?: boolean;
    taglineLinkUrl?: string;
    logoScale?: number;
    logoBoxScale?: number;
    logoX?: number;
    logoY?: number;
    logoLinkEnabled?: boolean;
    logoLinkUrl?: string;
  };
};

export type BrandMessageBlock = {
  id: string;
  type: "brand-message";
  data: {
    showTopImage?: boolean;
    topImageUrl?: string;
    topImageAlt?: string;
    topImageLinkEnabled?: boolean;
    topImageLinkUrl?: string;
    showBgVideo?: boolean;
    bgVideoUrl?: string;
    bgVideoX?: number;
    bgVideoY?: number;
    bgVideoScale?: number;
    bgVideoOpacity?: number;
    bgVideoFeather?: number;
    bgVideoDesaturate?: number;
    heading: string;
    showHeading?: boolean;
    headingStyle?: TextStyle;
    headingLinkEnabled?: boolean;
    headingLinkUrl?: string;
    message: string;
    showMessage?: boolean;
    messageStyle?: TextStyle;
    messageLinkEnabled?: boolean;
    messageLinkUrl?: string;
    icon: "coffee";
    logoScale?: number;
    logoBoxScale?: number;
    logoX?: number;
    logoY?: number;
    logoLinkEnabled?: boolean;
    logoLinkUrl?: string;
    animationType?: "none" | "reveal" | "roll";
    animationTrigger?: "once" | "always";
    animationPlayId?: number;
  };
};

export type TripleMediaBlock = {
  id: string;
  type: "triple-media";
  data: {
    leftTitle: string;
    leftTitleStyle?: TextStyle;
    leftTitleLinkEnabled?: boolean;
    leftTitleLinkUrl?: string;
    leftBody: string;
    leftBodyStyle?: TextStyle;
    leftBodyLinkEnabled?: boolean;
    leftBodyLinkUrl?: string;
    leftAccent: string;
    leftLogoScale?: number;
    leftLogoBoxScale?: number;
    leftLogoX?: number;
    leftLogoY?: number;
    leftLogoLinkEnabled?: boolean;
    leftLogoLinkUrl?: string;
    middleMedia: MediaAsset;
    rightMedia: MediaAsset;
    rightMediaCurtainEnabled?: boolean;
    leftBorderEffect?: "none" | "tracer" | "sweep" | "both";
  };
};

export type LandscapeBlock = {
  id: string;
  type: "landscape";
  data: {
    media: MediaAsset;
    caption: string;
    captionStyle?: TextStyle;
    captionLinkEnabled?: boolean;
    captionLinkUrl?: string;
  };
};

export type FooterBlock = {
  id: string;
  type: "footer";
  data: {
    tagline: string;
    showTagline?: boolean;
    taglineStyle?: TextStyle;
    taglineLinkEnabled?: boolean;
    taglineLinkUrl?: string;
    linkStyle?: TextStyle;
    links: { label: string; href: string }[];
    leadText?: string;
    leadStyle?: TextStyle;
    leadPlaceholder?: string;
    leadButtonText?: string;
    leadButtonStyle?: TextStyle;
    showLeadLogo?: boolean;
  };
};

export type ContentBlock =
  | HeroBlock
  | BrandMessageBlock
  | TripleMediaBlock
  | LandscapeBlock
  | FooterBlock
  | MenuBlock;

export type BlockType = ContentBlock["type"];

export type PageContent = {
  title: string;
  blocks: ContentBlock[];
};

export type GlobalSettings = {
  logoText: string;
  logoMark: string;
  logoImageUrl?: string;
  showLogoMark?: boolean;
  showLogoText?: boolean;
  showLogoBox?: boolean;
  logoTextLinkEnabled?: boolean;
  logoTextLinkUrl?: string;
  bodyFont?: FontKey;
  mottoFont?: FontKey;
  brandHeadingFont?: FontKey;
  brandMessageFont?: FontKey;
  motto: string;
  brandMessage?: string;
  logoTextStyle?: TextStyle;
  mottoStyle?: TextStyle;
  brandMessageStyle?: TextStyle;
  borderEnabled?: boolean;
  borderColor?: string;
  borderWidth?: number;
  introEnabled?: boolean;
  introBgFrom?: string;
  introBgVia?: string;
  introBgTo?: string;
  introTextColor?: string;
  introWipeColor?: string;
  introHoldMs?: number;
  introWipeMs?: number;
  introFadeMs?: number;
  menuButtonText?: string;
  menuButtonTextColor?: string;
  menuButtonBorderColor?: string;
  menuButtonBg?: string;
  menuButtonFont?: FontKey;
  menuButtonTextSize?: number;
  menuItemFont?: FontKey;
  menuItemSize?: number;
  menuItemColor?: string;
  menuPanelBg?: string;
  menuPanelTextColor?: string;
  menuPanelWidthPct?: number;
  menuItems?: { id: string; label: string; href: string }[];
};
