"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from "react";
import { AboutAnimation } from "@/lib/content/types";

const defaultAnimation: AboutAnimation = {
  type: "none",
  trigger: "once",
  playId: 0,
};

type Props = {
  animation?: AboutAnimation;
  className?: string;
  children: React.ReactNode;
};

export default function AnimatedReveal({ animation, className, children }: Props) {
  const anim = animation ?? defaultAnimation;
  const [isActive, setIsActive] = useState(anim.type === "none");
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  const style = useMemo<React.CSSProperties>(() => {
    return {
      ...(anim.delayMs ? { "--about-anim-delay": `${anim.delayMs}ms` } : null),
      ...(anim.durationMs ? { "--about-anim-duration": `${anim.durationMs}ms` } : null),
    } as React.CSSProperties;
  }, [anim.delayMs, anim.durationMs]);

  useEffect(() => {
    if (anim.type === "none") {
      if (!isActive) {
        resetTimerRef.current = window.setTimeout(() => setIsActive(true), 0);
      }
      return () => {
        if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      };
    }
    const element = elementRef.current;
    if (!element) return;

    const scrollRoot =
      document.querySelector<HTMLElement>("[data-inline-scroll]") ?? null;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setIsActive(true);
            if (anim.trigger === "once") {
              observer.unobserve(entry.target);
            }
          } else if (anim.trigger === "always") {
            setIsActive(false);
            setIsVisible(false);
          }
        });
      },
      { threshold: 0.3, root: scrollRoot }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [anim.playId, anim.trigger, anim.type]);

  useEffect(() => {
    if (anim.type === "none") return;
    if (!isVisible) return;
    setIsActive(false);
    const timer = window.setTimeout(() => setIsActive(true), 30);
    return () => window.clearTimeout(timer);
  }, [anim.playId, anim.type, isVisible]);

  return (
    <div
      ref={elementRef}
      className={`about-anim about-anim-${anim.type} ${
        isActive ? "about-anim-active" : ""
      } ${className ?? ""}`}
      style={style}
    >
      {children}
    </div>
  );
}
