import HomePageShell from "@/components/HomePageShell";
import ContactSection from "@/components/contact/ContactSection";
import SiteFooter from "@/components/SiteFooter";
import { defaultContactContent } from "@/lib/content/defaults";
import { getPublishedContent, getPublishedGlobals } from "@/lib/content/store";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const globals = await getPublishedGlobals();
  const content = await getPublishedContent("contact-us");
  const contact = content.contact ?? defaultContactContent.contact!;

  return (
    <HomePageShell
      globals={globals}
      links={
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
            ]
      }
      allowOverflow
    >
      <ContactSection contact={contact} globals={globals} />
      <SiteFooter
        globals={globals}
        links={
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
              ]
        }
      />
    </HomePageShell>
  );
}
