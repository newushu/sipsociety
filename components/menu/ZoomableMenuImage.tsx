"use client";

import { useRef, useState } from "react";

type Props = {
  src: string;
  alt: string;
  heightPx?: number;
  widthPx?: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

export default function ZoomableMenuImage({
  src,
  alt,
  heightPx = 430,
  widthPx = 760,
}: Props) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const panStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null
  );
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size === 1) {
      panStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        ox: offset.x,
        oy: offset.y,
      };
    }

    if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      pinchStartRef.current = { distance: distance(a, b), scale };
      panStartRef.current = null;
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size === 2 && pinchStartRef.current) {
      const [a, b] = Array.from(pointersRef.current.values());
      const nextScale = clamp(
        (distance(a, b) / pinchStartRef.current.distance) * pinchStartRef.current.scale,
        1,
        5
      );
      setScale(nextScale);
      if (nextScale === 1) setOffset({ x: 0, y: 0 });
      return;
    }

    if (pointersRef.current.size === 1 && panStartRef.current && scale > 1) {
      setOffset({
        x: panStartRef.current.ox + (event.clientX - panStartRef.current.x),
        y: panStartRef.current.oy + (event.clientY - panStartRef.current.y),
      });
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchStartRef.current = null;

    if (pointersRef.current.size === 1) {
      const [only] = Array.from(pointersRef.current.values());
      panStartRef.current = { x: only.x, y: only.y, ox: offset.x, oy: offset.y };
    } else {
      panStartRef.current = null;
    }
  };

  return (
    <div
      className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-sm"
      style={{ width: `${widthPx}px` }}
    >
      <div
        className="relative flex w-full items-center justify-center overflow-hidden"
        style={{ height: `${heightPx}px`, touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          src={src}
          alt={alt}
          className="pointer-events-none max-h-full max-w-full select-none"
          draggable={false}
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
        />
      </div>
    </div>
  );
}
