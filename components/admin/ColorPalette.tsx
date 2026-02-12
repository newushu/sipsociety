"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  label?: string;
  onDragStart?: () => void;
  onDragMove?: () => void;
  onDragEnd?: () => void;
  logRecent?: boolean;
  usedColors?: string[];
  showRecentRow?: boolean;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const hslToHex = (h: number, s: number, l: number) => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
  else if (hp >= 1 && hp < 2) [r, g, b] = [x, c, 0];
  else if (hp >= 2 && hp < 3) [r, g, b] = [0, c, x];
  else if (hp >= 3 && hp < 4) [r, g, b] = [0, x, c];
  else if (hp >= 4 && hp < 5) [r, g, b] = [x, 0, c];
  else if (hp >= 5 && hp < 6) [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  const toHex = (v: number) => {
    const hex = Math.round((v + m) * 255).toString(16);
    return hex.padStart(2, "0");
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToHsl = (hex: string) => {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return { h: 0, s: 0.9, l: 0.5 };
  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
};

export default function ColorPalette({
  value,
  onChange,
  label = "Color",
  onDragStart,
  onDragMove,
  onDragEnd,
  logRecent = true,
  usedColors = [],
  showRecentRow = true,
}: Props) {
  const { h, l } = useMemo(() => hexToHsl(value || "#ff0000"), [value]);
  const [lightness, setLightness] = useState(l);
  const maxL = 0.92;
  const minL = 0.28;
  const rangeL = maxL - minL;
  const categories = [
    { key: "red", label: "Red", hue: 0 },
    { key: "orange", label: "Orange", hue: 24 },
    { key: "yellow", label: "Yellow", hue: 50 },
    { key: "green", label: "Green", hue: 130 },
    { key: "blue", label: "Blue", hue: 210 },
    { key: "purple", label: "Purple", hue: 275 },
    { key: "neutral", label: "Neutral", hue: 0 },
  ];
  const [activeCategory, setActiveCategory] = useState(categories[0].key);
  const [recent, setRecent] = useState<string[]>([]);
  const storageKey = "admin-color-recent";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRecent(parsed.filter((item) => typeof item === "string").slice(0, 12));
      }
    } catch {
      // Ignore parse errors.
    }
  }, []);

  const swatches = useMemo(() => {
    const category = categories.find((item) => item.key === activeCategory) ?? categories[0];
    const count = 50;
    const shades: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const t = i / (count - 1);
      const lightness = 0.15 + t * 0.75;
      const saturation = category.key === "neutral" ? 0 : 0.9 - t * 0.25;
      shades.push(hslToHex(category.hue, saturation, lightness));
    }
    return shades;
  }, [activeCategory]);

  const pushRecent = (next: string) => {
    if (!logRecent) return;
    const normalized = next.toLowerCase();
    const updated = [normalized, ...recent.filter((item) => item !== normalized)].slice(0, 12);
    setRecent(updated);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, JSON.stringify(updated));
    }
  };

  useEffect(() => {
    setLightness(l);
  }, [l]);

  return (
    <div className="flex flex-col gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600">
      <span>{label}</span>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.key}
            type="button"
            className={`rounded-full border px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] ${
              activeCategory === category.key
                ? "border-amber-300 bg-amber-50 text-stone-900"
                : "border-stone-200 bg-white text-stone-600"
            }`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setActiveCategory(category.key)}
          >
            {category.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-10 gap-1 rounded-lg border border-stone-200 bg-white p-2">
        {swatches.map((swatch) => (
          <button
            key={swatch}
            type="button"
            className="h-5 w-5 rounded border border-stone-200"
            style={{ backgroundColor: swatch }}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              pushRecent(swatch);
              onChange(swatch);
            }}
          />
        ))}
      </div>
      {showRecentRow ? (
        <div className="mt-2 space-y-2">
          {usedColors.length ? (
            <div className="grid grid-cols-10 gap-1 rounded-lg border border-stone-200 bg-white p-2">
              {usedColors.slice(0, 20).map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  className="h-5 w-5 rounded border border-stone-200"
                  style={{ backgroundColor: swatch }}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onChange(swatch)}
                  title="Used"
                />
              ))}
            </div>
          ) : null}
          <div className="grid grid-cols-10 gap-1 rounded-lg border border-stone-200 bg-white p-2">
            <button
              type="button"
              className="h-5 w-5 rounded border border-stone-200"
              style={{ backgroundColor: value }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onChange(value)}
              title="Current"
            />
            {recent.map((swatch) => (
              <button
                key={swatch}
                type="button"
                className="h-5 w-5 rounded border border-stone-200"
                style={{ backgroundColor: swatch }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onChange(swatch)}
              />
            ))}
          </div>
        </div>
      ) : null}
      <label className="mt-2 block text-[9px] uppercase tracking-[0.2em] text-stone-500">
        Lightness
        <input
          className="mt-2 h-2 w-full appearance-none rounded-full bg-gradient-to-r from-black via-stone-400 to-white accent-amber-500"
          type="range"
          min={0}
          max={100}
          value={Math.round(lightness * 100)}
          onChange={(event) => {
            const next = Number(event.target.value) / 100;
            setLightness(next);
            const nextColor = hslToHex(h, 0.95, next);
            onChange(nextColor);
          }}
        />
      </label>
    </div>
  );
}
