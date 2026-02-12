"use client";

import { useState } from "react";
import ColorPalette from "@/components/admin/ColorPalette";

type Props = {
  value?: string;
  onChange: (next: string) => void;
  label?: string;
};

export default function ColorPicker({ value = "#1c1917", onChange, label }: Props) {
  const [open, setOpen] = useState(false);

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
            style={{ backgroundColor: value }}
          />
          {value.toUpperCase()}
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400">
          Palette
        </span>
      </button>
      {open ? (
        <div className="mt-3 rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
          <ColorPalette value={value} onChange={onChange} />
        </div>
      ) : null}
    </div>
  );
}
