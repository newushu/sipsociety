import type { Metadata } from "next";
import {
  Fraunces,
  Space_Grotesk,
  Manrope,
  Playfair_Display,
  Inter,
  DM_Sans,
  Plus_Jakarta_Sans,
  Work_Sans,
  Nunito_Sans,
  Raleway,
  Source_Sans_3,
  Urbanist,
  Cormorant_Garamond,
  DM_Serif_Display,
  Libre_Baskerville,
  Merriweather,
  Bodoni_Moda,
  Prata,
  Sacramento,
  Dancing_Script,
  Great_Vibes,
  Pacifico,
  Allura,
  Parisienne,
  Satisfy,
  Lobster,
  Yellowtail,
  Alex_Brush,
  Playball,
  Abril_Fatface,
  Cinzel,
} from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-sans-alt",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display-alt",
  subsets: ["latin"],
});

const inter = Inter({ variable: "--font-sans-inter", subsets: ["latin"] });
const dmSans = DM_Sans({ variable: "--font-sans-dm", subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans-jakarta",
  subsets: ["latin"],
});
const workSans = Work_Sans({ variable: "--font-sans-work", subsets: ["latin"] });
const nunitoSans = Nunito_Sans({ variable: "--font-sans-nunito", subsets: ["latin"] });
const raleway = Raleway({ variable: "--font-sans-raleway", subsets: ["latin"] });
const sourceSans = Source_Sans_3({ variable: "--font-sans-source", subsets: ["latin"] });
const urbanist = Urbanist({ variable: "--font-sans-urbanist", subsets: ["latin"] });

const cormorant = Cormorant_Garamond({
  variable: "--font-display-cormorant",
  subsets: ["latin"],
});
const dmSerif = DM_Serif_Display({
  variable: "--font-display-dmserif",
  subsets: ["latin"],
  weight: ["400"],
});
const baskerville = Libre_Baskerville({
  variable: "--font-display-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
});
const merriweather = Merriweather({
  variable: "--font-display-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});
const bodoni = Bodoni_Moda({
  variable: "--font-display-bodoni",
  subsets: ["latin"],
});
const prata = Prata({ variable: "--font-display-prata", subsets: ["latin"], weight: ["400"] });
const sacramento = Sacramento({
  variable: "--font-display-sacramento",
  subsets: ["latin"],
  weight: ["400"],
});
const dancingScript = Dancing_Script({
  variable: "--font-script-dancing",
  subsets: ["latin"],
});
const greatVibes = Great_Vibes({
  variable: "--font-script-greatvibes",
  subsets: ["latin"],
  weight: ["400"],
});
const pacifico = Pacifico({
  variable: "--font-script-pacifico",
  subsets: ["latin"],
  weight: ["400"],
});
const allura = Allura({
  variable: "--font-script-allura",
  subsets: ["latin"],
  weight: ["400"],
});
const parisienne = Parisienne({
  variable: "--font-script-parisienne",
  subsets: ["latin"],
  weight: ["400"],
});
const satisfy = Satisfy({
  variable: "--font-script-satisfy",
  subsets: ["latin"],
  weight: ["400"],
});
const lobster = Lobster({
  variable: "--font-script-lobster",
  subsets: ["latin"],
  weight: ["400"],
});
const yellowtail = Yellowtail({
  variable: "--font-script-yellowtail",
  subsets: ["latin"],
  weight: ["400"],
});
const alexBrush = Alex_Brush({
  variable: "--font-script-alexbrush",
  subsets: ["latin"],
  weight: ["400"],
});
const playball = Playball({
  variable: "--font-script-playball",
  subsets: ["latin"],
  weight: ["400"],
});
const abril = Abril_Fatface({ variable: "--font-display-abril", subsets: ["latin"], weight: ["400"] });
const cinzel = Cinzel({ variable: "--font-display-cinzel", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sip Society",
  description: "Sip Society - a coffee and tea collective.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${spaceGrotesk.variable} ${manrope.variable} ${playfair.variable} ${inter.variable} ${dmSans.variable} ${jakarta.variable} ${workSans.variable} ${nunitoSans.variable} ${raleway.variable} ${sourceSans.variable} ${urbanist.variable} ${cormorant.variable} ${dmSerif.variable} ${baskerville.variable} ${merriweather.variable} ${bodoni.variable} ${prata.variable} ${sacramento.variable} ${dancingScript.variable} ${greatVibes.variable} ${pacifico.variable} ${allura.variable} ${parisienne.variable} ${satisfy.variable} ${lobster.variable} ${yellowtail.variable} ${alexBrush.variable} ${playball.variable} ${abril.variable} ${cinzel.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
