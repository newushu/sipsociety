"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  facebookUrl?: string;
  instagramUrl?: string;
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
  facebookUrl = "",
  instagramUrl = "",
  menuItemFont,
  menuItemSize = 18,
  menuItemColor = "#1c1917",
  menuPanelBg = "#ffffff",
  menuPanelTextColor = "#1c1917",
  menuPanelWidthPct = 25,
  links,
}: Props) {
  const menuDisplaySize = Math.max(menuItemSize * 2.4, 36);
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
    <header className="site-header pointer-events-auto absolute inset-x-0 top-0 z-[80]">
      <div className="flex w-full items-start justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <a
            className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/60 shadow-sm backdrop-blur transition hover:-translate-y-0.5"
            href={facebookUrl || "#"}
            target={facebookUrl ? "_blank" : undefined}
            rel={facebookUrl ? "noreferrer" : undefined}
            aria-label="Facebook"
          >
            <svg
              className="h-4 w-4 text-stone-700/80 transition group-hover:text-stone-900"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M13.5 9.5V8.1c0-.7.5-1.1 1.1-1.1h1.4V4.2h-2.2c-2.3 0-3.6 1.4-3.6 3.7v1.6H8v2.7h2.2V20h3.3v-7.8h2.4l.5-2.7h-2.9z" />
            </svg>
          </a>
          <a
            className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/60 shadow-sm backdrop-blur transition hover:-translate-y-0.5"
            href={instagramUrl || "#"}
            target={instagramUrl ? "_blank" : undefined}
            rel={instagramUrl ? "noreferrer" : undefined}
            aria-label="Instagram"
          >
            <svg
              className="h-4 w-4 text-stone-700/80 transition group-hover:text-stone-900"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9A4.5 4.5 0 0 1 16.5 21h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3zm0 1.8A2.7 2.7 0 0 0 4.8 7.5v9a2.7 2.7 0 0 0 2.7 2.7h9a2.7 2.7 0 0 0 2.7-2.7v-9a2.7 2.7 0 0 0-2.7-2.7h-9zm4.5 3.3a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8zm0 1.8a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2zm5.3-.9a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
            </svg>
          </a>
        </div>
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
      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[200] pointer-events-auto">
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
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-stone-200 px-6 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
                      Menu
                    </p>
                    <button
                      className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold"
                      onClick={(event) => {
                        event.stopPropagation();
                        closeMenu();
                      }}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex flex-1 items-center justify-center p-6">
                    <div className="flex flex-col gap-6 text-center">
                      {links.map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          className="text-lg font-semibold"
                          onClick={closeMenu}
                          style={{
                            color: menuItemColor,
                            fontFamily: menuItemFont,
                            fontSize: `${menuDisplaySize}px`,
                            lineHeight: 1.1,
                          }}
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </aside>
            </div>,
            document.body
          )
        : null}
    </header>
  );
}
