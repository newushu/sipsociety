"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ColorPalette from "@/components/admin/ColorPalette";

export type RichFontOption = {
  value: string;
  label: string;
  family: string;
};

type Props = {
  value: string;
  onChange: (next: string) => void;
  fonts: RichFontOption[];
  placeholder?: string;
  showColor?: boolean;
  usedColors?: string[];
};

export default function RichTextEditor({
  value,
  onChange,
  fonts,
  placeholder,
  showColor = true,
  usedColors = [],
}: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [focused, setFocused] = useState(false);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const selectionRef = useRef<Range | null>(null);
  const [color, setColor] = useState("#ff0000");
  const [selectionActive, setSelectionActive] = useState(false);

  const captureSelection = () => {
    if (typeof document === "undefined") return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!editorRef.current || !editorRef.current.contains(range.commonAncestorContainer)) {
      return;
    }
    selectionRef.current = range.cloneRange();
    setSelectionActive(!range.collapsed);
  };

  useEffect(() => {
    if (!editorRef.current || focused) return;
    editorRef.current.innerHTML = value || "";
  }, [value, focused]);

  const applyColor = (nextColor: string) => {
    if (typeof document === "undefined") return;
    const selection = window.getSelection();
    if (!selection) return;
    const range = selectionRef.current ?? (selection.rangeCount ? selection.getRangeAt(0) : null);
    if (!range) return;
    if (!editorRef.current || !editorRef.current.contains(range.commonAncestorContainer)) {
      return;
    }
    selection.removeAllRanges();
    selection.addRange(range);
    try {
      const span = document.createElement("span");
      span.style.color = nextColor;
      span.style.webkitTextFillColor = nextColor;
      span.appendChild(range.extractContents());
      range.insertNode(span);
      selection.removeAllRanges();
      const nextRange = document.createRange();
      nextRange.selectNodeContents(span);
      selection.addRange(nextRange);
      selectionRef.current = nextRange.cloneRange();
    } catch {
      // Ignore range errors.
    }
  };

  const rgbToHex = (value: string) => {
    const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) return null;
    const [r, g, b] = match.slice(1, 4).map((num) => parseInt(num, 10));
    if ([r, g, b].some((num) => Number.isNaN(num))) return null;
    return `#${[r, g, b]
      .map((num) => num.toString(16).padStart(2, "0"))
      .join("")}`;
  };

  const exec = (command: string, commandValue?: string) => {
    if (typeof document === "undefined") return;
    const selection = window.getSelection();
    const selectionNode =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0).commonAncestorContainer : null;
    const selectionInsideEditor =
      !!selectionNode && !!editorRef.current && editorRef.current.contains(selectionNode);
    if (!selectionInsideEditor) {
      window.dispatchEvent(
        new CustomEvent("admin-richtext-command", {
          detail: { command, value: commandValue },
        })
      );
      return;
    }
    editorRef.current?.focus();
    if (selectionRef.current && selection) {
      selection.removeAllRanges();
      selection.addRange(selectionRef.current);
    }
    try {
      if (command === "foreColor" && commandValue) {
        document.execCommand("styleWithCSS", false, "true");
        document.execCommand(command, false, commandValue);
        applyColor(commandValue);
        setColor(commandValue);
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
        return;
      }
      if (command === "fontName") {
        document.execCommand("styleWithCSS", false, "true");
      }
      document.execCommand(command, false, commandValue);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    } catch {
      // Ignore unsupported commands.
    }
  };

  const applyFontFamily = (family: string) => {
    if (typeof document === "undefined") return;
    const selection = window.getSelection();
    const range =
      selectionRef.current ?? (selection?.rangeCount ? selection.getRangeAt(0) : null);
    if (!editorRef.current) return;
    if (selection && range) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    try {
      document.execCommand("styleWithCSS", false, "true");
      const ok = document.execCommand("fontName", false, family);
      if (ok && editorRef.current) {
        onChange(editorRef.current.innerHTML);
        return;
      }
    } catch {
      // Fall through to span-based apply.
    }
    if (!range || !editorRef.current.contains(range.commonAncestorContainer)) {
      const wrapper = document.createElement("span");
      wrapper.style.setProperty("font-family", family, "important");
      wrapper.innerHTML = editorRef.current.innerHTML;
      editorRef.current.innerHTML = "";
      editorRef.current.appendChild(wrapper);
      onChange(editorRef.current.innerHTML);
      return;
    }
    if (range.collapsed) {
      const wrapper = document.createElement("span");
      wrapper.style.setProperty("font-family", family, "important");
      wrapper.innerHTML = editorRef.current.innerHTML;
      editorRef.current.innerHTML = "";
      editorRef.current.appendChild(wrapper);
      onChange(editorRef.current.innerHTML);
      return;
    }
    try {
      selection?.removeAllRanges();
      selection?.addRange(range);
      const span = document.createElement("span");
      span.style.setProperty("font-family", family, "important");
      span.appendChild(range.extractContents());
      range.insertNode(span);
      const nextRange = document.createRange();
      nextRange.selectNodeContents(span);
      selection?.removeAllRanges();
      selection?.addRange(nextRange);
      selectionRef.current = nextRange.cloneRange();
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    } catch {
      // Ignore range errors.
    }
  };

  const rememberSelection = () => {
    if (!editorRef.current || typeof document === "undefined") return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      window.dispatchEvent(
        new CustomEvent("admin-richtext-selection", { detail: { active: false } })
      );
      return;
    }
    selectionRef.current = range.cloneRange();
    const colorNode =
      range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentElement
        : (range.commonAncestorContainer as HTMLElement);
    if (colorNode) {
      const computed = window.getComputedStyle(colorNode).color;
      const hex = rgbToHex(computed);
      if (hex) setColor(hex);
      setSelectionActive(!range.collapsed);
      window.dispatchEvent(
        new CustomEvent("admin-richtext-selection", {
          detail: { active: true, color: hex ?? null },
        })
      );
    }
  };

  useEffect(() => {
    const handleSelection = () => {
      rememberSelection();
    };
    document.addEventListener("selectionchange", handleSelection);
    return () => {
      document.removeEventListener("selectionchange", handleSelection);
    };
  }, [rememberSelection]);

  useEffect(() => {
    const handleExternalSelection = (
      event: Event & { detail?: { color?: string } }
    ) => {
      if (!event.detail?.color) return;
      const active = document.activeElement;
      if (editorRef.current && active && editorRef.current.contains(active)) return;
      setColor(event.detail.color);
    };
    window.addEventListener(
      "admin-richtext-selection",
      handleExternalSelection as EventListener
    );
    return () => {
      window.removeEventListener(
        "admin-richtext-selection",
        handleExternalSelection as EventListener
      );
    };
  }, []);


  const fontOptions = useMemo(() => fonts, [fonts]);

  useEffect(() => {
    if (!fontMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      setFontMenuOpen(false);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [fontMenuOpen]);

  return (
    <div className="space-y-2">
      <div
        className="flex flex-wrap items-center gap-2"
        onMouseDown={(event) => {
          const target = event.target as HTMLElement | null;
          if (target?.tagName !== "SELECT" && target?.tagName !== "INPUT") {
            event.preventDefault();
          }
        }}
      >
        <button
          type="button"
          className="rounded-full border border-stone-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => exec("bold")}
        >
          Bold
        </button>
        <button
          type="button"
          className="rounded-full border border-stone-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => exec("italic")}
        >
          Italic
        </button>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600"
            onMouseDown={(event) => {
              event.preventDefault();
              captureSelection();
            }}
            onClick={(event) => {
              const next = !fontMenuOpen;
              setFontMenuOpen(next);
              if (next) {
                const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
                setMenuPos({ top: rect.bottom + 8, left: rect.left, width: rect.width });
              }
            }}
          >
            Font
          </button>
          {fontMenuOpen && menuPos
            ? createPortal(
                <div
                  className="fixed z-[2147483647] max-h-[320px] w-96 overflow-y-auto rounded-lg border border-stone-200 bg-white p-2 shadow-2xl"
                  style={{ top: menuPos.top, left: menuPos.left }}
                >
                  {fontOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-xs text-stone-700 hover:bg-stone-50"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        if (!selectionRef.current) captureSelection();
                        applyFontFamily(option.family);
                        setFontMenuOpen(false);
                      }}
                    >
                      <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400">
                        {option.label}
                      </span>
                      <span className="text-sm" style={{ fontFamily: option.family }}>
                        Aa
                      </span>
                    </button>
                  ))}
                </div>,
                document.body
              )
            : null}
        </div>
        {showColor ? (
          <div className="max-h-[320px] w-96 overflow-y-auto rounded-lg border border-stone-200 bg-white p-3 shadow-lg">
            <ColorPalette
              value={color}
              onChange={(next) => exec("foreColor", next)}
              label="Highlight color"
              logRecent={selectionActive}
              usedColors={usedColors}
            />
          </div>
        ) : null}
        <button
          type="button"
          className="rounded-full border border-stone-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            const url = window.prompt("Link URL");
            if (!url) return;
            exec("createLink", url);
            exec("underline");
            exec("foreColor", "#2563eb");
          }}
        >
          Link
        </button>
      </div>
      <div
        ref={editorRef}
        className="min-h-[110px] rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onFocus={() => {
          setFocused(true);
          window.dispatchEvent(
            new CustomEvent("admin-richtext-selection", { detail: { active: true } })
          );
        }}
        onBlur={() => {
          setFocused(false);
          if (!editorRef.current) return;
          onChange(editorRef.current.innerHTML);
          selectionRef.current = null;
          window.dispatchEvent(
            new CustomEvent("admin-richtext-selection", { detail: { active: false } })
          );
        }}
        onInput={() => {
          if (!editorRef.current) return;
          onChange(editorRef.current.innerHTML);
          rememberSelection();
        }}
        onMouseUp={() => {
          rememberSelection();
        }}
        onKeyUp={() => {
          rememberSelection();
        }}
        style={{ whiteSpace: "pre-wrap" }}
      />
    </div>
  );
}
