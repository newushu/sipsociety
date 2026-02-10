"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  value?: string;
  onChange: (next: string) => void;
  label?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const int = Number.parseInt(value, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0"))
    .join("")}`;

const rgbToHsv = (r: number, g: number, b: number) => {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;
  const max = Math.max(nr, ng, nb);
  const min = Math.min(nr, ng, nb);
  const delta = max - min;
  let hue = 0;
  if (delta !== 0) {
    if (max === nr) hue = ((ng - nb) / delta) % 6;
    if (max === ng) hue = (nb - nr) / delta + 2;
    if (max === nb) hue = (nr - ng) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  const saturation = max === 0 ? 0 : delta / max;
  return { h: hue, s: saturation, v: max };
};

const hsvToRgb = (h: number, s: number, v: number) => {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (h >= 0 && h < 60) [r1, g1, b1] = [c, x, 0];
  else if (h >= 60 && h < 120) [r1, g1, b1] = [x, c, 0];
  else if (h >= 120 && h < 180) [r1, g1, b1] = [0, c, x];
  else if (h >= 180 && h < 240) [r1, g1, b1] = [0, x, c];
  else if (h >= 240 && h < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  return {
    r: (r1 + m) * 255,
    g: (g1 + m) * 255,
    b: (b1 + m) * 255,
  };
};

export default function ColorPicker({ value = "#1c1917", onChange, label }: Props) {
  const [open, setOpen] = useState(false);
  const [hue, setHue] = useState(20);
  const [sat, setSat] = useState(0.3);
  const [val, setVal] = useState(0.9);
  const paletteRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!value) return;
    const { r, g, b } = hexToRgb(value);
    const hsv = rgbToHsv(r, g, b);
    setHue(hsv.h);
    setSat(hsv.s);
    setVal(hsv.v);
  }, [value]);

  const paletteColor = useMemo(() => `hsl(${hue}, 100%, 50%)`, [hue]);
  const colorHex = useMemo(() => {
    const { r, g, b } = hsvToRgb(hue, sat, val);
    return rgbToHex(r, g, b);
  }, [hue, sat, val]);

  const emitChange = (nextHex: string) => {
    if (nextHex.toLowerCase() === (value ?? "").toLowerCase()) return;
    onChange(nextHex);
  };

  const updateFromPointer = (event: PointerEvent | React.PointerEvent) => {
    const rect = paletteRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clamp(event.clientX - rect.left, 0, rect.width);
    const y = clamp(event.clientY - rect.top, 0, rect.height);
    const nextSat = x / rect.width;
    const nextVal = 1 - y / rect.height;
    setSat(nextSat);
    setVal(nextVal);
    const { r, g, b } = hsvToRgb(hue, nextSat, nextVal);
    emitChange(rgbToHex(r, g, b));
  };

  return (
    <div className="text-[10px] text-stone-500">
      {label ? <p className="mb-2 uppercase tracking-[0.2em]">{label}</p> : null}
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="flex items-center gap-2">
          <span
            className="h-4 w-4 rounded-full border border-stone-200"
            style={{ backgroundColor: colorHex }}
          />
          {colorHex.toUpperCase()}
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400">
          Palette
        </span>
      </button>
      {open ? (
        <div className="mt-3 rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
          <div
            ref={paletteRef}
            className="relative h-32 w-full cursor-crosshair rounded-lg"
            style={{
              background: `linear-gradient(to right, #fff, ${paletteColor})`,
            }}
            onPointerDown={(event) => {
              draggingRef.current = true;
              updateFromPointer(event);
            }}
            onPointerMove={(event) => {
              if (!draggingRef.current) return;
              updateFromPointer(event);
            }}
            onPointerUp={() => {
              draggingRef.current = false;
            }}
            onPointerLeave={() => {
              draggingRef.current = false;
            }}
          >
            <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black to-transparent" />
            <div
              className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow"
              style={{
                left: `${sat * 100}%`,
                top: `${(1 - val) * 100}%`,
                backgroundColor: colorHex,
              }}
            />
          </div>
          <label className="mt-3 block text-[10px] uppercase tracking-[0.2em] text-stone-500">
            Hue
            <input
              className="mt-2 h-2 w-full appearance-none rounded-full bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-cyan-500 via-blue-500 via-purple-500 to-red-500 accent-amber-500"
              type="range"
              min={0}
              max={360}
              value={hue}
              onChange={(event) => {
                const nextHue = Number(event.target.value);
                setHue(nextHue);
                const { r, g, b } = hsvToRgb(nextHue, sat, val);
                emitChange(rgbToHex(r, g, b));
              }}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
