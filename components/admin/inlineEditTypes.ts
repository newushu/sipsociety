export type InlineEditTarget =
  | {
      kind: "logo";
      scope: "hero" | "brand" | "left";
      blockIndex: number;
    }
  | {
      kind: "media";
      scope:
        | "heroVideo"
        | "middleMedia"
        | "rightMedia"
        | "landscapeMedia"
        | "brandTopImage"
        | "brandBgVideo";
      blockIndex: number;
    }
  | {
      kind: "text";
      scope:
        | "logoText"
        | "tagline"
        | "brandHeading"
        | "brandMessage"
        | "leftTitle"
        | "leftBody"
        | "caption"
        | "footerTagline"
        | "footerLead"
        | "footerButton";
      blockIndex?: number;
    }
  | {
      kind: "animation";
      scope: "brandAnimation";
      blockIndex: number;
    };
