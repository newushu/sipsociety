"use client";

"use client";

import { useEffect, useRef, useState } from "react";
import ColorPalette from "@/components/admin/ColorPalette";

type Props = {
  value: string;
  onChange: (next: string) => void;
  label?: string;
};

type SelectionDetail = { color?: string | null; active?: boolean };

export default function TextColorPicker({ value, onChange, label = "Text color" }: Props) {
  const [highlightColor, setHighlightColor] = useState<string | null>(null);
  const [richActive, setRichActive] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRichRef = useRef(false);

  const isRichSelectionActive = () => {
    if (typeof window === "undefined") return false;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    const range = selection.getRangeAt(0);
    const node = range.commonAncestorContainer;
    const el =
      node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
    return !!el?.closest('[contenteditable="true"]');
  };

  useEffect(() => {
    const handleSelection = (event: Event) => {
      const detail = (event as CustomEvent<SelectionDetail>).detail;
      if (!detail) return;
      if (typeof detail.active === "boolean") {
        if (!detail.active && dragging) {
          return;
        }
        setRichActive(detail.active);
        if (!detail.active) setHighlightColor(null);
      }
      if (typeof detail.color !== "undefined") {
        setHighlightColor(detail.color ?? null);
      }
    };
    window.addEventListener("admin-richtext-selection", handleSelection as EventListener);
    return () => {
      window.removeEventListener("admin-richtext-selection", handleSelection as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const handleUp = () => {
      setDragging(false);
      dragRichRef.current = false;
    };
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dragging]);

  const activeColor = richActive ? highlightColor ?? value : value;
  const activeLabel = richActive ? "Highlight color" : label;

  return (
    <div
      onPointerDown={() => {
        const richNow = isRichSelectionActive() || richActive;
        dragRichRef.current = richNow;
        if (richNow) setRichActive(true);
        setDragging(true);
      }}
    >
      <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-stone-500">
        {activeLabel}
      </p>
      <ColorPalette
        value={activeColor}
        onChange={(next) => {
          const richMode = dragRichRef.current || richActive || isRichSelectionActive();
          if (richMode) {
            if (!richActive) setRichActive(true);
            setHighlightColor(next);
            window.dispatchEvent(
              new CustomEvent("admin-richtext-command", {
                detail: { command: "foreColor", value: next },
              })
            );
            return;
          }
          onChange(next);
        }}
      />
    </div>
  );
}
