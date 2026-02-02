"use client";

import { useEffect, useState } from "react";

type Props = {
  logoText: string;
  motto: string;
  logoTextStyle?: React.CSSProperties;
  mottoStyle?: React.CSSProperties;
};

export default function IntroOverlay({ logoText, motto, logoTextStyle, mottoStyle }: Props) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  const handleEnter = () => {
    setExiting(true);
    window.setTimeout(() => {
      setVisible(false);
    }, 520);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-stone-950 via-stone-900 to-amber-900 text-white">
      <div
        className={`absolute inset-0 transition-all duration-500 ${
          exiting ? "opacity-0 translate-y-24" : "opacity-100 translate-y-0"
        }`}
      />
      <div
        className={`relative mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 text-center transition-all duration-500 ${
          exiting ? "opacity-0 translate-y-24" : "opacity-100 translate-y-0"
        }`}
      >
        <p
          className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-200/80"
          style={logoTextStyle}
        >
          {logoText}
        </p>
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl" style={mottoStyle}>
          {motto}
        </h1>
        <p className="max-w-xl text-base text-amber-100/80 sm:text-lg">
          A modern coffee and tea collective for makers, listeners, and late-night sketches.
        </p>
        <button
          className="rounded-full bg-amber-200 px-8 py-3 text-sm font-semibold text-stone-900 shadow-lg shadow-amber-200/30 transition hover:-translate-y-0.5"
          onClick={handleEnter}
        >
          Enter Sip Society
        </button>
      </div>
    </div>
  );
}
