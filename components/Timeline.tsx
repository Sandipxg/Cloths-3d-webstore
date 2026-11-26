"use client";
import { useRef } from "react";
import { PIECES, clamp, easeCubic, img, indexOf, lerp, money, reducedMotion, smooth } from "@/lib/data";
import { useScrollProgress } from "./useScrollProgress";

/** "Out the door by eight." — a tile grid melts away to reveal the street photo. */
export default function Timeline({ onView }: { onView: (i: number, el: HTMLElement | null) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const tagRef = useRef<HTMLButtonElement>(null);
  const shadeRef = useRef<HTMLElement>(null);
  const tilesRef = useRef<{ el: HTMLElement; delay: number }[]>([]);
  const coat = PIECES[indexOf("05")];

  useScrollProgress(
    sectionRef,
    (t) => {
      const e = reducedMotion() ? 1 : clamp((t + 0.22) / 0.66);
      for (const tile of tilesRef.current) {
        const r = 1 - Math.pow(1 - clamp((e - 0.62 * tile.delay) / 0.38), 3);
        tile.el.style.transform = `scale(${(1 - r) * 1.04})`;
        tile.el.style.borderRadius = `${40 * r}%`;
      }
      imgRef.current!.style.transform = `scale(${lerp(1.16, 1, easeCubic(e))})`;
      shadeRef.current!.style.opacity = String(smooth((e - 0.5) / 0.4));
      const a = smooth((t - 0.55) / 0.2);
      titleRef.current!.style.opacity = String(a);
      titleRef.current!.style.transform = `translateY(${(1 - a) * 40}px)`;
      const b = smooth((t - 0.66) / 0.18);
      tagRef.current!.style.opacity = String(b);
      tagRef.current!.style.transform = `translateY(${(1 - b) * 20}px)`;
    },
    () => {
      const grid = gridRef.current!;
      const phone = innerWidth < 760;
      const cols = phone ? 5 : 12;
      const rows = phone ? 9 : 7;
      grid.innerHTML = "";
      grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
      const tiles: { el: HTMLElement; delay: number }[] = [];
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const el = document.createElement("i");
          grid.appendChild(el);
          const dx = (c + 0.5) / cols - 0.68;
          const dy = (r + 0.5) / rows - 0.5;
          const noise = Math.abs(43758.5453 * Math.sin(12.9898 * r + 78.233 * c)) % 1;
          tiles.push({ el, delay: 0.72 * clamp(Math.hypot(1.2 * dx, dy) / 0.8) + 0.28 * noise });
        }
      tilesRef.current = tiles;
    },
  );

  return (
    <section ref={sectionRef} className="tl" aria-label="Out the door">
      <div className="tl-stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          className="tl-img"
          src={img("street.webp")}
          alt={`A man walking down an old stone street in the ${coat.name.toLowerCase()}`}
        />
        <div ref={gridRef} className="tl-grid" aria-hidden />
        <i ref={shadeRef} className="tl-shade" aria-hidden />
        <h2 ref={titleRef} className="tl-title">
          Out the door
          <br />
          <em>by eight.</em>
        </h2>
        <button ref={tagRef} type="button" className="tl-tag" onClick={(e) => onView(indexOf("05"), e.currentTarget)}>
          <span>
            {coat.name} in {coat.colour}
          </span>
          <b>{money(coat.price)}</b>
          <u>View</u>
        </button>
      </div>
    </section>
  );
}
