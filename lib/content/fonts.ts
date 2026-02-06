import type { FontKey } from "@/lib/content/types";

export const fontOptions: { value: FontKey; label: string; family: string }[] = [
  { value: "sans", label: "Sans (Space Grotesk)", family: "var(--font-sans)" },
  {
    value: "system-apple",
    label: "System (Apple)",
    family:
      "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif",
  },
  { value: "sans-alt", label: "Sans (Manrope)", family: "var(--font-sans-alt)" },
  { value: "sans-inter", label: "Sans (Inter)", family: "var(--font-sans-inter)" },
  { value: "sans-dm", label: "Sans (DM Sans)", family: "var(--font-sans-dm)" },
  {
    value: "sans-jakarta",
    label: "Sans (Plus Jakarta Sans)",
    family: "var(--font-sans-jakarta)",
  },
  { value: "sans-work", label: "Sans (Work Sans)", family: "var(--font-sans-work)" },
  {
    value: "sans-nunito",
    label: "Sans (Nunito Sans)",
    family: "var(--font-sans-nunito)",
  },
  { value: "sans-raleway", label: "Sans (Raleway)", family: "var(--font-sans-raleway)" },
  { value: "sans-source", label: "Sans (Source Sans 3)", family: "var(--font-sans-source)" },
  { value: "sans-urbanist", label: "Sans (Urbanist)", family: "var(--font-sans-urbanist)" },
  { value: "display", label: "Display (Fraunces)", family: "var(--font-display)" },
  {
    value: "display-alt",
    label: "Display (Playfair)",
    family: "var(--font-display-alt)",
  },
  {
    value: "display-cormorant",
    label: "Display (Cormorant Garamond)",
    family: "var(--font-display-cormorant)",
  },
  {
    value: "display-dmserif",
    label: "Display (DM Serif Display)",
    family: "var(--font-display-dmserif)",
  },
  {
    value: "display-baskerville",
    label: "Display (Libre Baskerville)",
    family: "var(--font-display-baskerville)",
  },
  {
    value: "display-merriweather",
    label: "Display (Merriweather)",
    family: "var(--font-display-merriweather)",
  },
  {
    value: "display-bodoni",
    label: "Display (Bodoni Moda)",
    family: "var(--font-display-bodoni)",
  },
  {
    value: "display-prata",
    label: "Display (Prata)",
    family: "var(--font-display-prata)",
  },
  {
    value: "display-sacramento",
    label: "Script (Sacramento)",
    family: "var(--font-display-sacramento)",
  },
  {
    value: "script-dancing",
    label: "Script (Dancing Script)",
    family: "var(--font-script-dancing)",
  },
  {
    value: "script-greatvibes",
    label: "Script (Great Vibes)",
    family: "var(--font-script-greatvibes)",
  },
  {
    value: "script-pacifico",
    label: "Script (Pacifico)",
    family: "var(--font-script-pacifico)",
  },
  {
    value: "script-allura",
    label: "Script (Allura)",
    family: "var(--font-script-allura)",
  },
  {
    value: "script-parisienne",
    label: "Script (Parisienne)",
    family: "var(--font-script-parisienne)",
  },
  {
    value: "script-satisfy",
    label: "Script (Satisfy)",
    family: "var(--font-script-satisfy)",
  },
  {
    value: "script-lobster",
    label: "Script (Lobster)",
    family: "var(--font-script-lobster)",
  },
  {
    value: "script-yellowtail",
    label: "Script (Yellowtail)",
    family: "var(--font-script-yellowtail)",
  },
  {
    value: "script-alexbrush",
    label: "Script (Alex Brush)",
    family: "var(--font-script-alexbrush)",
  },
  {
    value: "script-playball",
    label: "Script (Playball)",
    family: "var(--font-script-playball)",
  },
  {
    value: "display-abril",
    label: "Display (Abril Fatface)",
    family: "var(--font-display-abril)",
  },
  {
    value: "display-cinzel",
    label: "Display (Cinzel)",
    family: "var(--font-display-cinzel)",
  },
];

export const fontFamilyForKey = (key?: FontKey) => {
  switch (key) {
    case "system-apple":
      return "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif";
    case "display":
      return "var(--font-display)";
    case "display-alt":
      return "var(--font-display-alt)";
    case "display-cormorant":
      return "var(--font-display-cormorant)";
    case "display-dmserif":
      return "var(--font-display-dmserif)";
    case "display-baskerville":
      return "var(--font-display-baskerville)";
    case "display-merriweather":
      return "var(--font-display-merriweather)";
    case "display-bodoni":
      return "var(--font-display-bodoni)";
    case "display-prata":
      return "var(--font-display-prata)";
    case "display-sacramento":
      return "var(--font-display-sacramento)";
    case "script-dancing":
      return "var(--font-script-dancing)";
    case "script-greatvibes":
      return "var(--font-script-greatvibes)";
    case "script-pacifico":
      return "var(--font-script-pacifico)";
    case "script-allura":
      return "var(--font-script-allura)";
    case "script-parisienne":
      return "var(--font-script-parisienne)";
    case "script-satisfy":
      return "var(--font-script-satisfy)";
    case "script-lobster":
      return "var(--font-script-lobster)";
    case "script-yellowtail":
      return "var(--font-script-yellowtail)";
    case "script-alexbrush":
      return "var(--font-script-alexbrush)";
    case "script-playball":
      return "var(--font-script-playball)";
    case "display-abril":
      return "var(--font-display-abril)";
    case "display-cinzel":
      return "var(--font-display-cinzel)";
    case "sans-alt":
      return "var(--font-sans-alt)";
    case "sans-inter":
      return "var(--font-sans-inter)";
    case "sans-dm":
      return "var(--font-sans-dm)";
    case "sans-jakarta":
      return "var(--font-sans-jakarta)";
    case "sans-work":
      return "var(--font-sans-work)";
    case "sans-nunito":
      return "var(--font-sans-nunito)";
    case "sans-raleway":
      return "var(--font-sans-raleway)";
    case "sans-source":
      return "var(--font-sans-source)";
    case "sans-urbanist":
      return "var(--font-sans-urbanist)";
    case "sans":
    default:
      return "var(--font-sans)";
  }
};

export const sortFontOptions = (
  options: { value: FontKey; label: string; family: string }[],
  usedKeys: Set<FontKey>
) =>
  [...options].sort((a, b) => {
    const aUsed = usedKeys.has(a.value);
    const bUsed = usedKeys.has(b.value);
    if (aUsed !== bUsed) return aUsed ? -1 : 1;
    return a.label.localeCompare(b.label);
  });
