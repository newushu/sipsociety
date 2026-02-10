export type CtaLink = {
  label: string;
  href: string;
};

export type TextStyle = {
  size?: number;
  weight?: number;
  italic?: boolean;
  x?: number;
  y?: number;
  font?: FontKey;
  color?: string;
  tracking?: number;
  transform?: "uppercase" | "lowercase" | "capitalize" | "none";
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
  id: string;
  name: string;
  detail: string;
  price: string;
  showPrice?: boolean;
  namePos?: { x: number; y: number };
  detailPos?: { x: number; y: number };
  pricePos?: { x: number; y: number };
};

export type AdminNoteCategory =
  | "style format"
  | "feature add"
  | "page addition"
  | "not working";

export type AdminNote = {
  id: string;
  category: AdminNoteCategory;
  subject: string;
  body: string;
  createdAt: string;
  completed?: boolean;
  completedAt?: string;
};

export type MenuSection = {
  id: string;
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
    headingStyle?: TextStyle;
    subheadingStyle?: TextStyle;
    noteStyle?: TextStyle;
    sectionTitleStyle?: TextStyle;
    itemNameStyle?: TextStyle;
    itemDetailStyle?: TextStyle;
    itemPriceStyle?: TextStyle;
    showPrices?: boolean;
    sections: MenuSection[];
  };
};

export type HeroBlock = {
  id: string;
  type: "hero";
  data: {
    videoUrl: string;
    imageUrl?: string;
    videoX: number;
    videoY: number;
    videoScale: number;
    imageX?: number;
    imageY?: number;
    imageScale?: number;
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
    joinLabel?: string;
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
  career?: CareerContent;
  about?: AboutContent;
  gallery?: GalleryContent;
};

export type GalleryItem = {
  id: string;
  url?: string;
  alt?: string;
  comment?: string;
  commentDisplay?: "hover" | "always";
};

export type GalleryRow = {
  id: string;
  items: GalleryItem[];
};

export type GalleryContent = {
  heading: string;
  subheading: string;
  headingStyle?: TextStyle;
  subheadingStyle?: TextStyle;
  rows: GalleryRow[];
  commentX: number;
  commentY: number;
  commentSize: number;
  commentColor: string;
  commentFont?: FontKey;
  commentOpacity?: number;
  tileGap?: number;
  favoriteThreshold?: number;
};

export type CareerContent = {
  heroImageUrl: string;
  heroImageDesaturate: number;
  heroEyebrow: string;
  heroHeadline: string;
  heroBody: string;
  heroEyebrowStyle?: TextStyle;
  heroHeadlineStyle?: TextStyle;
  heroBodyStyle?: TextStyle;
  rolesHeading: string;
  rolesEmptyText: string;
  rolesHeadingStyle?: TextStyle;
  rolesEmptyStyle?: TextStyle;
  applyHeading: string;
  applyBody: string;
  applyButtonText: string;
  applyHeadingStyle?: TextStyle;
  applyBodyStyle?: TextStyle;
  applyButtonStyle?: TextStyle;
  applyCardBgColor: string;
  applyCardBgOpacity: number;
  applyCardTextColor: string;
  formCardBgColor: string;
  formCardBgOpacity: number;
  formCardTextColor: string;
};

export type AboutAnimationType =
  | "none"
  | "move-up"
  | "move-down"
  | "move-left"
  | "move-right"
  | "zoom-in"
  | "zoom-out"
  | "fade"
  | "blur"
  | "rotate"
  | "flip"
  | "slide-up";

export type AboutAnimation = {
  type: AboutAnimationType;
  trigger?: "once" | "always";
  playId?: number;
  delayMs?: number;
  durationMs?: number;
};

export type AboutSection = {
  id: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  mediaAlt?: string;
  mediaSide: "left" | "right";
  heading: string;
  body: string;
  headingStyle?: TextStyle;
  bodyStyle?: TextStyle;
  mediaAnimation?: AboutAnimation;
  textAnimation?: AboutAnimation;
};

export type AboutContent = {
  heroImageUrl: string;
  heroOverlayOpacity: number;
  heroLogoUrl: string;
  heroLogoScale: number;
  heroLogoX: number;
  heroLogoY: number;
  heroTitle: string;
  heroBody: string;
  heroTitleStyle?: TextStyle;
  heroBodyStyle?: TextStyle;
  heroTitleAnimation?: AboutAnimation;
  heroBodyAnimation?: AboutAnimation;
  heroLogoAnimation?: AboutAnimation;
  sectionTitle: string;
  sectionTitleStyle?: TextStyle;
  sections: AboutSection[];
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
  introAnimationType?:
    | "wipe"
    | "fade"
    | "slide"
    | "radial"
    | "pour"
    | "iris"
    | "diagonal"
    | "shutter"
    | "steam"
    | "dissolve";
  introLogoScale?: number;
  introLogoX?: number;
  introLogoY?: number;
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
  facebookUrl?: string;
  instagramUrl?: string;
  menuItems?: { id: string; label: string; href: string }[];
  adminNotes?: AdminNote[];
};
