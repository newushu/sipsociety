"use client";

import { useEffect, useState } from "react";

type Props = {
  logoText: string;
  motto: string;
  logoTextStyle?: React.CSSProperties;
  mottoStyle?: React.CSSProperties;
  showLogoText?: boolean;
  enabled?: boolean;
  bgFrom?: string;
  bgVia?: string;
  bgTo?: string;
  textColor?: string;
  wipeColor?: string;
  holdMs?: number;
  wipeMs?: number;
  fadeMs?: number;
  playId?: number;
  onDone?: () => void;
};

export default function IntroOverlay({
  logoText,
  motto,
  logoTextStyle,
  mottoStyle,
  showLogoText = true,
  enabled = true,
  bgFrom = "#0c0a09",
  bgVia = "#1c1917",
  bgTo = "#78350f",
  textColor = "#fde68a",
  wipeColor = "#0c0a09",
  holdMs = 1400,
  wipeMs = 700,
  fadeMs = 700,
  playId,
  onDone,
}: Props) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
      document.documentElement.dataset.intro = "true";
    } else {
      document.body.style.overflow = "";
      delete document.documentElement.dataset.intro;
    }
    return () => {
      document.body.style.overflow = "";
      delete document.documentElement.dataset.intro;
    };
  }, [visible]);

  useEffect(() => {
    const timers: number[] = [];
    if (!enabled) {
      timers.push(
        window.setTimeout(() => {
          setVisible(false);
          setExiting(false);
        }, 0)
      );
      return () => {
        timers.forEach((id) => window.clearTimeout(id));
      };
    }
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      timers.push(
        window.setTimeout(() => {
          setVisible(false);
          setExiting(false);
        }, 0)
      );
      return () => {
        timers.forEach((id) => window.clearTimeout(id));
      };
    }
    timers.push(
      window.setTimeout(() => {
        setVisible(true);
        setExiting(false);
      }, 0)
    );
    const start = window.setTimeout(() => setExiting(true), holdMs);
    const end = window.setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, holdMs + wipeMs + fadeMs);
    timers.push(start, end);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [enabled, holdMs, wipeMs, fadeMs, playId, onDone]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center text-white"
      style={{
        backgroundImage: `linear-gradient(135deg, ${bgFrom}, ${bgVia}, ${bgTo})`,
        color: textColor,
      }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 w-1/2 transition-transform ease-in-out ${
            exiting ? "-translate-x-full" : "translate-x-0"
          }`}
          style={{ backgroundColor: wipeColor, transitionDuration: `${wipeMs}ms` }}
        />
        <div
          className={`absolute inset-y-0 right-0 w-1/2 transition-transform ease-in-out ${
            exiting ? "translate-x-full" : "translate-x-0"
          }`}
          style={{ backgroundColor: wipeColor, transitionDuration: `${wipeMs}ms` }}
        />
        <div
          className={`absolute inset-0 transition-all ${
            exiting ? "opacity-0" : "opacity-100"
          }`}
          style={{ transitionDuration: `${fadeMs}ms` }}
        />
      </div>
      <div
        className={`relative mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 text-center transition-all ${
          exiting ? "opacity-0 translate-y-16" : "opacity-100 translate-y-0"
        }`}
        style={{ transitionDuration: `${fadeMs}ms` }}
      >
        {showLogoText ? (
          <p
            className="text-xs font-semibold uppercase tracking-[0.4em]"
            style={logoTextStyle}
          >
            {logoText}
          </p>
        ) : null}
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl" style={mottoStyle}>
          {motto}
        </h1>
        <p className="max-w-xl text-base sm:text-lg">
          A modern coffee and tea collective for makers, listeners, and late-night sketches.
        </p>
      </div>
    </div>
  );
}
