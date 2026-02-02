"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { BrandMessageBlock } from "@/lib/content/types";

type Props = {
  block: BrandMessageBlock;
  id?: string;
  logo?: {
    mark: string;
    text: string;
    imageUrl?: string;
    scale?: number;
    boxScale?: number;
    x?: number;
    y?: number;
  };
  border?: { enabled: boolean; color: string; width: number };
  messageOverride?: string;
  onMessageChange?: (next: string) => void;
  headingStyle?: CSSProperties;
  messageStyle?: CSSProperties;
  onHeadingChange?: (next: string) => void;
  headingControls?: React.ReactNode;
  messageControls?: React.ReactNode;
};

export default function BrandMessageSection({
  block,
  id,
  logo,
  border,
  messageOverride,
  onMessageChange,
  headingStyle,
  messageStyle,
  onHeadingChange,
  headingControls,
  messageControls,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(true);
          }
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      className="flex min-h-[50vh] flex-col items-center justify-center gap-6 rounded-[48px] border border-stone-200 bg-white/70 px-6 py-16 text-center shadow-xl shadow-amber-900/5"
      style={{
        borderColor: border?.enabled ? border.color : "transparent",
        borderWidth: border?.enabled ? border.width : 0,
      }}
    >
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full border border-amber-200/60 text-[10px] font-semibold tracking-[0.3em] transition-all duration-700 ${
          active ? "scale-110 text-amber-700" : "scale-90 text-stone-400"
        }`}
        style={{
          transform: `scale(${logo?.boxScale ?? 1})`,
        }}
      >
        {logo?.imageUrl ? (
          <img
            src={logo.imageUrl}
            alt={`${logo.text} logo`}
            className="h-12 w-12 rounded-full object-cover"
            style={{
              transform: `translate(${logo?.x ?? 0}%, ${logo?.y ?? 0}%) scale(${logo?.scale ?? 1})`,
            }}
          />
        ) : logo?.mark ? (
          <span
            style={{
              transform: `translate(${logo?.x ?? 0}%, ${logo?.y ?? 0}%) scale(${logo?.scale ?? 1})`,
            }}
          >
            {logo.mark}
          </span>
        ) : block.data.icon === "coffee" ? (
          "COFFEE"
        ) : (
          ""
        )}
      </div>
      <div className="relative inline-flex flex-col items-center">
        {headingControls ? <div className="absolute right-0 -top-10">{headingControls}</div> : null}
        {onHeadingChange ? (
          <p
            className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500"
            style={headingStyle}
            contentEditable
            suppressContentEditableWarning
            onBlur={(event) => onHeadingChange(event.currentTarget.textContent || "")}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                (event.target as HTMLElement).blur();
              }
            }}
          >
            {block.data.heading}
          </p>
        ) : (
          <p
            className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500"
            style={headingStyle}
          >
            {block.data.heading}
          </p>
        )}
      </div>
      <div className="relative inline-flex flex-col items-center">
        {messageControls ? <div className="absolute right-0 -top-10">{messageControls}</div> : null}
        {onMessageChange ? (
          <h2
            className="max-w-2xl text-2xl font-semibold text-stone-900 sm:text-3xl"
            style={messageStyle}
            contentEditable
            suppressContentEditableWarning
            onBlur={(event) => onMessageChange(event.currentTarget.textContent || "")}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                (event.target as HTMLElement).blur();
              }
            }}
          >
            {messageOverride ?? block.data.message}
          </h2>
        ) : (
          <h2
            className="max-w-2xl text-2xl font-semibold text-stone-900 sm:text-3xl"
            style={messageStyle}
          >
            {messageOverride ?? block.data.message}
          </h2>
        )}
      </div>
    </section>
  );
}
