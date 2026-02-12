"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ColorPalette from "@/components/admin/ColorPalette";

type Props = {
  value: string;
  onChange: (next: string) => void;
  label?: string;
};

const isContentEditableNode = (node: Node | null) => {
  if (!node) return false;
  const element =
    node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  return !!element?.closest('[contenteditable="true"]');
};

export default function SingleColorPicker({ value, onChange, label = "Text color" }: Props) {
  const [selectionActive, setSelectionActive] = useState(false);
  const [displayColor, setDisplayColor] = useState(value);
  const selectionRangeRef = useRef<Range | null>(null);
  const selectionRootRef = useRef<HTMLElement | null>(null);
  const hasSelection = () => !!selectionRangeRef.current;
  const [, setDragActive] = useState(false);

  const captureSelection = useCallback(() => {
    if (typeof window === "undefined") return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!isContentEditableNode(range.commonAncestorContainer)) return;
    selectionRangeRef.current = range.cloneRange();
    const root =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as Element)
        : range.commonAncestorContainer.parentElement;
    selectionRootRef.current = root?.closest('[contenteditable="true"]') as HTMLElement | null;
  }, []);

  useEffect(() => {
    if (selectionActive) return;
    const timer = window.setTimeout(() => setDisplayColor(value), 0);
    return () => window.clearTimeout(timer);
  }, [selectionActive, value]);

  const readSelectionColor = () => {
    if (typeof window === "undefined") return null;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    const node =
      range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentElement
        : (range.commonAncestorContainer as HTMLElement);
    if (!node) return null;
    const computed = window.getComputedStyle(node).color;
    return computed || null;
  };

  useEffect(() => {
    const handleSelection = () => {
      captureSelection();
      const active = isContentEditableNode(
        selectionRangeRef.current?.commonAncestorContainer ?? null
      );
      setSelectionActive(active);
      if (active) {
        const color = readSelectionColor();
        if (color) setDisplayColor(color);
      }
    };
    document.addEventListener("selectionchange", handleSelection);
    return () => {
      document.removeEventListener("selectionchange", handleSelection);
    };
  }, [captureSelection]);

  const restoreSelection = () => {
    if (typeof window === "undefined") return;
    const selection = window.getSelection();
    const range = selectionRangeRef.current;
    if (!selection || !range) return;
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const applyHighlight = (next: string) => {
    if (typeof document === "undefined") return false;
    const range = selectionRangeRef.current;
    if (!range) return false;
    const selection = window.getSelection();
    if (!selection) return false;
    const root = selectionRootRef.current;
    try {
      root?.focus();
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("foreColor", false, next);
      if (root) {
        root.dispatchEvent(new Event("input", { bubbles: true }));
      }
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div onPointerDown={() => captureSelection()}>
      {selectionActive ? (
        <>
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-stone-500">
            <span>Highlight color</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400">
              Selection
            </span>
          </div>
          <ColorPalette
            value={displayColor}
            logRecent
            onDragStart={() => {
              setDragging(true);
              captureSelection();
            }}
            onDragMove={() => restoreSelection()}
            onDragEnd={() => {
              setDragging(false);
              restoreSelection();
            }}
            onChange={(next) => {
              setDisplayColor(next);
              if (hasSelection()) {
                applyHighlight(next);
                requestAnimationFrame(() => restoreSelection());
              }
            }}
          />
        </>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-stone-500">
            <span>{label}</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400">
              Global
            </span>
          </div>
          <ColorPalette
            value={displayColor}
            logRecent={false}
            onDragStart={() => setDragging(true)}
            onDragEnd={() => setDragging(false)}
            onChange={(next) => {
              setDisplayColor(next);
              onChange(next);
            }}
          />
        </>
      )}
    </div>
  );
}
