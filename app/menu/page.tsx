import SiteHeader from "@/components/SiteHeader";
import { getPublishedGlobals } from "@/lib/content/store";

export const revalidate = 0;

const menuSections = [
  {
    title: "Coffee",
    items: [
      { name: "Vietnamese Phin", detail: "Condensed milk, slow drip", price: "$6" },
      { name: "Cold Brew", detail: "Cacao nibs, orange zest", price: "$5" },
      { name: "Latte", detail: "Oat or whole milk", price: "$5.5" },
    ],
  },
  {
    title: "Espresso",
    items: [
      { name: "Espresso", detail: "Single origin", price: "$3.5" },
      { name: "Cortado", detail: "Equal parts espresso and milk", price: "$4.5" },
      { name: "Affogato", detail: "Espresso over vanilla gelato", price: "$6.5" },
    ],
  },
  {
    title: "Tea",
    items: [
      { name: "Jasmine Green", detail: "Floral, bright", price: "$4" },
      { name: "Oolong", detail: "Roasted, nutty", price: "$4.5" },
      { name: "Chai", detail: "Spiced, creamy", price: "$5" },
    ],
  },
  {
    title: "Bakery",
    items: [
      { name: "Butter Croissant", detail: "Flaky, warm", price: "$4" },
      { name: "Almond Kouign Amann", detail: "Caramelized, rich", price: "$5" },
      { name: "Cinnamon Bun", detail: "Brown sugar glaze", price: "$4.5" },
    ],
  },
];

export default async function MenuPage() {
  const globals = await getPublishedGlobals();
  const styleFrom = (style?: {
    size: number;
    weight: number;
    italic?: boolean;
    x?: number;
    y?: number;
  }) =>
    style
      ? {
          fontSize: `${style.size}px`,
          fontWeight: style.weight,
          fontStyle: style.italic ? "italic" : "normal",
          transform: `translate(${style.x ?? 0}px, ${style.y ?? 0}px)`,
        }
      : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-100 text-stone-900">
      <SiteHeader
        logoMark={globals.logoMark}
        logoText={globals.logoText}
        logoTextStyle={styleFrom(globals.logoTextStyle)}
        links={[
          { href: "/", label: "Home" },
          { href: "/menu", label: "Menu" },
        ]}
      />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-[36px] border border-stone-200 bg-white/90 p-10 shadow-xl shadow-amber-900/10">
          <p
            className="text-xs font-semibold uppercase tracking-[0.5em] text-amber-500/80"
            style={styleFrom(globals.logoTextStyle)}
          >
            Sip Society Menu
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-stone-900 sm:text-5xl">
            Slow sips, bright ideas.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-stone-600">
            Seasonal rotations and small-lot offerings. Ask the bar for today’s
            featured beans and rare pours.
          </p>
          <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-5 py-4 text-sm text-stone-600">
            Menu items below are placeholders. Swap in your real offerings any time.
          </div>
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            {menuSections.map((section) => (
              <section
                key={section.title}
                className="rounded-3xl border border-stone-200 bg-stone-50/80 p-6"
              >
                <h2 className="text-lg font-semibold text-stone-800">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.items.map((item) => (
                    <div key={item.name} className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-stone-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-stone-500">{item.detail}</p>
                      </div>
                      <span className="text-sm font-semibold text-stone-700">
                        {item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
