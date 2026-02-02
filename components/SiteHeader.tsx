"use client";

import { useState } from "react";

type NavLink = {
  href: string;
  label: string;
};

type Props = {
  logoMark: string;
  logoText: string;
  logoTextStyle?: React.CSSProperties;
  links: NavLink[];
};

const linkClass =
  "text-sm font-semibold text-stone-600 transition-colors hover:text-stone-900";

export default function SiteHeader({ logoMark, logoText, logoTextStyle, links }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-sm font-semibold text-white">
            {logoMark}
          </div>
          <span
            className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-600"
            style={logoTextStyle}
          >
            {logoText}
          </span>
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </a>
          ))}
        </nav>
        <button
          className="inline-flex items-center justify-center rounded-full border border-stone-200 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-stone-700 shadow-sm md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          Menu
        </button>
      </div>
      <div
        id="mobile-nav"
        className={`md:hidden ${open ? "block" : "hidden"}`}
      >
        <div className="mx-6 mb-4 rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-lg">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-stone-700"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
