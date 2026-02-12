"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  label?: string;
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

const hexToHue = (hex: string) => {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return 0;
  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;
  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue *= 60;
  if (hue < 0) hue += 360;
  return hue;
};

export default function ColorRamp({ value, onChange, label = "Color" }: Props) {
  const barRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const hue = useMemo(() => hexToHue(value || "#ff0000"), [value]);

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const bar = barRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const nextHue = ratio * 360;
      const nextColor = hslToHex(nextHue, 0.9, 0.5);
      onChange(nextColor);
    },
    [onChange]
  );

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (event: PointerEvent) => updateFromClientX(event.clientX);
    const handleUp = () => setDragging(false);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dragging, updateFromClientX]);

  return (
    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600">
      <span>{label}</span>
      <div
        ref={barRef}
        className="relative h-6 w-28 cursor-pointer rounded-full border border-stone-200"
        style={{
          background:
            "linear-gradient(90deg, #ff0000 0%, #ff9900 12%, #ffee00 22%, #33cc33 36%, #00c7ff 52%, #2d5bff 68%, #7a1fff 84%, #ff00aa 100%)",
        }}
        onPointerDown={(event) => {
          event.preventDefault();
          setDragging(true);
          updateFromClientX(event.clientX);
        }}
      >
        <span
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-white shadow"
          style={{
            left: `calc(${(hue / 360) * 100}% - 8px)`,
            backgroundColor: value || "#ff0000",
          }}
        />
      </div>
    </div>
  );
}
