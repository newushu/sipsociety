"use client";

import { useEffect, useRef, useState } from "react";

type NavLink = {
  href: string;
  label: string;
};

type Props = {
  logoMark: string;
  logoText: string;
  logoTextStyle?: React.CSSProperties;
  logoImageUrl?: string;
  showLogoMark?: boolean;
  showLogoText?: boolean;
  showLogoBox?: boolean;
  links: NavLink[];
  menuButtonText?: string;
  menuButtonTextColor?: string;
  menuButtonBorderColor?: string;
  menuButtonBg?: string;
  menuButtonFont?: string;
  menuButtonTextSize?: number;
  menuItemFont?: string;
  menuItemSize?: number;
  menuItemColor?: string;
  menuPanelBg?: string;
  menuPanelTextColor?: string;
  menuPanelWidthPct?: number;
};

export default function SiteHeader({
  menuButtonText = "MENU",
  menuButtonTextColor = "#1c1917",
  menuButtonBorderColor = "#d6d3d1",
  menuButtonBg = "rgba(255,255,255,0.25)",
  menuButtonFont,
  menuButtonTextSize = 11,
  menuItemFont,
  menuItemSize = 18,
  menuItemColor = "#1c1917",
  menuPanelBg = "#ffffff",
  menuPanelTextColor = "#1c1917",
  menuPanelWidthPct = 25,
  links,
}: Props) {
  const [open, setOpen] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  const openMenu = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
    requestAnimationFrame(() => setPanelVisible(true));
  };

  const closeMenu = () => {
    setPanelVisible(false);
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 300);
  };

  return (
    <header className="site-header pointer-events-none absolute inset-x-0 top-0 z-50">
      <div className="flex w-full items-start justify-end px-6 py-5">
        <button
          className="pointer-events-auto inline-flex h-11 min-w-[88px] items-center justify-between rounded-md border px-3 shadow-[inset_0_2px_6px_rgba(255,255,255,0.65),_0_10px_18px_rgba(120,113,108,0.2)] transition hover:-translate-y-0.5 hover:shadow-[inset_0_2px_8px_rgba(255,255,255,0.8),_0_14px_22px_rgba(120,113,108,0.24)]"
          onClick={openMenu}
          aria-label="Open menu"
          style={{
            borderColor: menuButtonBorderColor,
            backgroundColor: menuButtonBg,
            color: menuButtonTextColor,
            fontFamily: menuButtonFont,
          }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.35em]"
            style={{ fontSize: `${menuButtonTextSize}px` }}
          >
            {menuButtonText}
          </span>
          <span className="flex flex-col items-end gap-1">
            <span className="h-0.5 w-4 rounded-full bg-current" />
            <span className="h-0.5 w-3 rounded-full bg-current" />
            <span className="h-0.5 w-4 rounded-full bg-current" />
          </span>
        </button>
      </div>
      {open ? (
        <div className="fixed inset-0 z-40">
          <button
            className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${
              panelVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeMenu}
            aria-label="Close menu"
          />
          <aside
            className={`absolute right-0 top-0 h-full min-w-[240px] max-w-sm overflow-hidden shadow-2xl transition-all duration-300 ease-out ${
              panelVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
            }`}
            style={{
              width: `${menuPanelWidthPct}vw`,
              backgroundColor: menuPanelBg,
              color: menuPanelTextColor,
            }}
          >
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
                Menu
              </p>
              <button
                className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold"
                onClick={closeMenu}
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-4">
                {links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-lg font-semibold"
                    onClick={closeMenu}
                    style={{
                      color: menuItemColor,
                      fontFamily: menuItemFont,
                      fontSize: `${menuItemSize}px`,
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </header>
  );
}
