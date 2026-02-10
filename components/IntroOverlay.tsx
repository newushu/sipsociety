"use client";

import { useEffect, useId, useState } from "react";

type Props = {
  mode?: "fullscreen" | "preview";
  logoText: string;
  motto: string;
  logoTextStyle?: React.CSSProperties;
  mottoStyle?: React.CSSProperties;
  logoMark?: string;
  logoImageUrl?: string;
  showLogoMark?: boolean;
  logoScale?: number;
  logoX?: number;
  logoY?: number;
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
  animationType?:
    | "wipe"
    | "fade"
    | "slide"
    | "radial"
    | "pour"
    | "iris"
    | "diagonal"
    | "shutter"
    | "steam"
    | "dissolve";
  staticPreview?: boolean;
  previewRevealMs?: number;
  playId?: number;
  onDone?: () => void;
};

export default function IntroOverlay({
  mode = "fullscreen",
  logoText,
  motto,
  logoTextStyle,
  mottoStyle,
  logoMark = "SS",
  logoImageUrl,
  showLogoMark = true,
  logoScale = 1,
  logoX = 0,
  logoY = 0,
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
  animationType = "wipe",
  staticPreview = false,
  previewRevealMs = 2000,
  playId,
  onDone,
}: Props) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [playing, setPlaying] = useState(false);
  const irisMaskId = useId();

  useEffect(() => {
    if (mode === "preview") return;
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
    if (mode === "preview") return;
    const timers: number[] = [];
    if (!enabled) {
      timers.push(
        window.setTimeout(() => {
          setVisible(false);
          setExiting(false);
          setPlaying(false);
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
          setPlaying(false);
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
        setPlaying(true);
      }, 0)
    );
    const start = window.setTimeout(() => setExiting(true), holdMs);
    const end = window.setTimeout(() => {
      setVisible(false);
      setPlaying(false);
      onDone?.();
    }, holdMs + wipeMs + fadeMs);
    timers.push(start, end);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [enabled, holdMs, wipeMs, fadeMs, playId, onDone, mode]);

  useEffect(() => {
    if (mode !== "preview") return;
    const timers: number[] = [];
    if (staticPreview && !playing) {
      setVisible(true);
      setExiting(false);
      return () => {
        timers.forEach((id) => window.clearTimeout(id));
      };
    }
    timers.push(
      window.setTimeout(() => {
        setVisible(true);
        setExiting(false);
        setPlaying(true);
      }, 0)
    );
    const start = window.setTimeout(() => setExiting(true), holdMs);
    const end = window.setTimeout(() => {
      setExiting(false);
      setPlaying(false);
      setVisible(false);
      onDone?.();
      if (staticPreview) {
        const revealTimer = window.setTimeout(() => {
          setVisible(true);
          setExiting(false);
        }, previewRevealMs);
        timers.push(revealTimer);
      }
    }, holdMs + wipeMs + fadeMs);
    timers.push(start, end);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [mode, playId, staticPreview, holdMs, wipeMs, fadeMs, onDone, playing, previewRevealMs]);

  if (!visible) return null;

  const overlayNode = (() => {
    const overlayGradient = `linear-gradient(135deg, ${bgFrom}, ${bgVia}, ${bgTo})`;
    const overlayColorStyle = { backgroundImage: overlayGradient };
    const overlayWipeStyle = { backgroundColor: wipeColor };
    if (animationType === "fade") {
      return (
        <div
          className={`absolute inset-0 transition-opacity ${
            exiting ? "opacity-0" : "opacity-100"
          }`}
          style={{ ...overlayColorStyle, transitionDuration: `${fadeMs}ms` }}
        />
      );
    }
    if (animationType === "slide") {
      return (
        <div
          className={`absolute inset-0 transition-transform ${
            exiting ? "-translate-y-full" : "translate-y-0"
          }`}
          style={{ ...overlayColorStyle, transitionDuration: `${wipeMs}ms` }}
        />
      );
    }
    if (animationType === "radial") {
      return (
        <div
          className="absolute inset-0"
          style={{
            ...overlayColorStyle,
            transition: `clip-path ${wipeMs}ms ease-in-out`,
            clipPath: exiting ? "circle(0% at 50% 50%)" : "circle(75% at 50% 50%)",
          }}
        />
      );
    }
    if (animationType === "pour") {
      const pourDuration = 2000;
      return (
        <div
          className={`intro-pour absolute inset-0 ${
            exiting ? "intro-pour-exit" : ""
          }`}
          style={{
            ...overlayColorStyle,
            animationDuration: `${pourDuration}ms`,
          }}
        />
      );
    }
    if (animationType === "iris") {
      const irisRadius = exiting ? 75 : 0;
      return (
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${irisMaskId}-grad`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={bgFrom} />
              <stop offset="55%" stopColor={bgVia} />
              <stop offset="100%" stopColor={bgTo} />
            </linearGradient>
            <mask id={`${irisMaskId}-mask`} maskUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="white" />
              <circle
                cx="50"
                cy="50"
                r={irisRadius}
                fill="black"
                style={{ transition: `r ${wipeMs}ms ease-in-out` }}
              />
            </mask>
          </defs>
          <rect
            width="100"
            height="100"
            fill={`url(#${irisMaskId}-grad)`}
            mask={`url(#${irisMaskId}-mask)`}
          />
        </svg>
      );
    }
    if (animationType === "diagonal") {
      return (
        <div
          className="absolute inset-0"
          style={{
            ...overlayColorStyle,
            transition: `clip-path ${wipeMs}ms ease-in-out`,
            clipPath: exiting
              ? "polygon(0 0, 0 0, 0 0, 0 0)"
              : "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
          }}
        />
      );
    }
    if (animationType === "shutter") {
      return (
        <div className="absolute inset-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`intro-shutter absolute left-0 right-0 ${
                exiting ? "intro-shutter-exit" : "intro-shutter-enter"
              }`}
              style={{
                top: `${i * 12.5}%`,
                height: "12.5%",
                ...overlayColorStyle,
                transitionDuration: `${wipeMs}ms`,
                transitionDelay: `${i * 40}ms`,
              }}
            />
          ))}
        </div>
      );
    }
    if (animationType === "steam") {
      return (
        <div className="absolute inset-0">
          <div
            className={`absolute inset-0 intro-steam-reveal ${
              exiting ? "intro-steam-reveal-exit" : "intro-steam-reveal-enter"
            }`}
            style={{ ...overlayColorStyle, animationDuration: `${fadeMs}ms` }}
          />
          <div className="intro-steam absolute inset-0" />
        </div>
      );
    }
    if (animationType === "dissolve") {
      return (
        <div
          className={`intro-dissolve absolute inset-0 ${
            exiting ? "intro-dissolve-exit" : "intro-dissolve-enter"
          }`}
          style={{
            ...overlayColorStyle,
            transitionDuration: `${fadeMs}ms`,
          }}
        />
      );
    }
    return (
      <div className="absolute inset-0">
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
    );
  })();

  const containerStyle: React.CSSProperties = {
    color: textColor,
    backgroundColor: "transparent",
  };

  return (
    <div
      className={`${
        mode === "preview" ? "absolute" : "fixed"
      } inset-0 z-50 flex items-center justify-center text-white`}
      style={containerStyle}
    >
      <div className="absolute inset-0 overflow-hidden">{overlayNode}</div>
      <div
        className={`relative mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 text-center transition-all ${
          exiting ? "opacity-0 translate-y-16" : "opacity-100 translate-y-0"
        }`}
        style={{ transitionDuration: `${fadeMs}ms` }}
      >
        {showLogoMark ? (
          <div
            className="flex h-16 w-16 items-center justify-center text-sm font-semibold"
            style={{
              transform: `translate(${logoX}px, ${logoY}px) scale(${logoScale})`,
            }}
          >
            {logoImageUrl ? (
              <img
                src={logoImageUrl}
                alt={`${logoText} logo`}
                className="h-16 w-16 object-contain"
              />
            ) : (
              <span className="text-2xl">{logoMark}</span>
            )}
          </div>
        ) : null}
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
