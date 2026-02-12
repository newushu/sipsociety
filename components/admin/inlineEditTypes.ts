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
        | "heroImage"
        | "middleMedia"
        | "rightMedia"
        | "landscapeMedia"
        | "brandTopImage"
        | "brandBgVideo"
        | "careerHeroImage"
        | "aboutHeroImage"
        | "aboutHeroLogo"
        | "aboutSectionMedia"
        | "contactBackground";
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
        | "footerButton"
        | "careerHeroEyebrow"
        | "careerHeroHeadline"
        | "careerHeroBody"
        | "careerRolesHeading"
        | "careerRolesEmpty"
        | "careerApplyHeading"
        | "careerApplyBody"
        | "careerApplyButton"
        | "aboutHeroTitle"
        | "aboutHeroBody"
        | "aboutSectionTitle"
        | "aboutSectionHeading"
        | "aboutSectionBody"
        | "contactHeading"
        | "contactBody"
        | "contactLabel"
        | "contactPlaceholder"
        | "contactMessageLabel"
        | "contactMessagePlaceholder"
        | "contactButton";
      blockIndex?: number;
    }
  | {
      kind: "container";
      scope: "careerApplyCard" | "careerFormCard" | "contactFormCard" | "contactButton";
      blockIndex?: number;
    }
  | {
      kind: "animation";
      scope:
        | "brandAnimation"
        | "aboutHeroLogoAnimation"
        | "aboutHeroTitleAnimation"
        | "aboutHeroBodyAnimation"
        | "aboutSectionTextAnimation"
        | "aboutSectionMediaAnimation";
      blockIndex: number;
    };
