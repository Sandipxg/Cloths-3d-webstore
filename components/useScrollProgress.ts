"use client";
import { useEffect, useRef, type RefObject } from "react";
import { clamp } from "@/lib/data";

/**
 * Runs `onFrame(progress, time)` every animation frame while the section is
 * near the viewport. Progress is 0→1 across the section's sticky scroll
 * (or across its pass through the viewport when it is not taller than it).
 * `onResize` runs once on mount and on every window resize.
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  onFrame: (p: number, t: number) => void,
  onResize?: () => void,
) {
  const frameRef = useRef(onFrame);
  const resizeRef = useRef(onResize);
  useEffect(() => {
    frameRef.current = onFrame;
    resizeRef.current = onResize;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let running = false;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      const r = el.getBoundingClientRect();
      const span = r.height - innerHeight;
      frameRef.current(span > 0 ? clamp(-r.top / span) : clamp(1 - r.bottom / (innerHeight + r.height)), t);
    };
    const resize = () => resizeRef.current?.();
    resizeRef.current?.();
    addEventListener("resize", resize);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !running) {
          running = true;
          raf = requestAnimationFrame(tick);
        } else if (!e.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
  }, [ref]);
}
