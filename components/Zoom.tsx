"use client";
import { useEffect, useId, useRef } from "react";
import { BRAND, PIECES, ZOOM_ORIGIN, easeCubic, img, indexOf, lerp, money, reducedMotion, smooth } from "@/lib/data";
import { useScrollProgress } from "./useScrollProgress";

/** Find a point well inside a glyph of the word, so the zoom dives through solid letter. */
function findInkCentre(text: SVGTextElement, w: number, h: number) {
  const fallback = { x: w / 2, y: h / 2 };
  try {
    const cw = Math.round(0.5 * w);
    const ch = Math.round(0.5 * h);
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return fallback;
    const cs = getComputedStyle(text);
    const fs = 0.5 * parseFloat(text.getAttribute("font-size") || "100");
    ctx.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    ctx.letterSpacing = `${-0.04 * fs}px`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text.textContent || "", cw / 2, ch / 2);
    const data = ctx.getImageData(0, 0, cw, ch).data;
    const ink = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < cw && y < ch && data[(Math.round(y) * cw + Math.round(x)) * 4 + 3] > 200;
    const rad = Math.max(4, 0.05 * fs);
    const solid = (x: number, y: number) =>
      ink(x, y) && [0, 1, 2, 3, 4, 5, 6, 7].every((k) => ink(x + Math.cos(0.785 * k) * rad, y + Math.sin(0.785 * k) * rad));
    for (let r = 0; r < Math.max(cw, ch) / 2; r += 2) {
      const steps = Math.max(8, Math.round(0.8 * r));
      for (let k = 0; k < steps; k++) {
        const x = cw / 2 + Math.cos((k / steps) * Math.PI * 2) * r;
        const y = ch / 2 + Math.sin((k / steps) * Math.PI * 2) * r;
        if (solid(x, y)) return { x: x / 0.5, y: y / 0.5 };
      }
    }
  } catch {}
  return fallback;
}

export default function Zoom({ onView }: { onView: (i: number, el: HTMLElement | null) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const wordRef = useRef<SVGTextElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const aRef = useRef<HTMLHeadingElement>(null);
  const bRef = useRef<HTMLHeadingElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const jacket = PIECES[indexOf("07")];
  const maskId = `zm-${useId().replace(/[^\w-]/g, "")}`;
  const boxRef = useRef({ w: 1, h: 1, x: 0.5, y: 0.5 });

  const layout = () => {
    const stage = stageRef.current!;
    const svg = svgRef.current!;
    const word = wordRef.current!;
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const phone = w < 760;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.querySelectorAll("rect").forEach((r) => {
      r.setAttribute("width", String(w));
      r.setAttribute("height", String(h));
    });
    const mask = svg.querySelector("mask")!;
    mask.setAttribute("x", "0");
    mask.setAttribute("y", "0");
    mask.setAttribute("width", String(w));
    mask.setAttribute("height", String(h));
    word.setAttribute("x", String(w / 2));
    word.setAttribute("y", String(h / 2));
    word.setAttribute("font-size", String(phone ? 0.34 * w : Math.min(0.3 * w, 0.6 * h)));
    boxRef.current = { w, h, ...findInkCentre(word, w, h) };
  };

  // Re-measure once web fonts are ready (runs after every render, like the original).
  useEffect(() => {
    document.fonts?.ready.then(() => layout());
  });

  useScrollProgress(
    sectionRef,
    (t) => {
      const e = reducedMotion() ? 1 : easeCubic(t / 0.7);
      const svg = svgRef.current!;
      const b = boxRef.current;
      const z = Math.pow(120, e);
      svg.setAttribute("viewBox", `${b.x - b.x / z} ${b.y - b.y / z} ${b.w / z} ${b.h / z}`);
      const fade = smooth((e - 0.82) / 0.14);
      svg.style.opacity = String(1 - fade);
      svg.style.visibility = fade > 0.995 ? "hidden" : "visible";
      imgRef.current!.style.transform = `scale(${lerp(1.3, 1, e)})`;
      const out = smooth(e / 0.22);
      aRef.current!.style.opacity = bRef.current!.style.opacity = String(1 - out);
      aRef.current!.style.transform = `translateY(${-(40 * out)}px)`;
      bRef.current!.style.transform = `translateY(${40 * out}px)`;
      const end = smooth((t - 0.72) / 0.16);
      endRef.current!.style.opacity = String(end);
      endRef.current!.style.transform = `translateY(${(1 - end) * 30}px)`;
      endRef.current!.style.pointerEvents = end > 0.5 ? "auto" : "none";
    },
    layout,
  );

  return (
    <section ref={sectionRef} className="zm" aria-label="The workshop">
      <div ref={stageRef} className="zm-stage">
        <div className="zm-win">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={img("studio.webp")}
            alt="The workshop: a long cutting table with folded cloth, and a man in the rust corduroy jacket"
            style={{ transformOrigin: `${100 * ZOOM_ORIGIN.x}% ${100 * ZOOM_ORIGIN.y}%` }}
          />
          <i className="zm-shade" aria-hidden />
        </div>
        <svg ref={svgRef} className="zm-veil" aria-hidden>
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse">
              <rect fill="#fff" />
              <text ref={wordRef} fill="#000" textAnchor="middle" dominantBaseline="central" className="zm-word">
                {BRAND}
              </text>
            </mask>
          </defs>
          <rect style={{ fill: "var(--bg)" }} mask={`url(#${maskId})`} />
        </svg>
        <h2 ref={aRef} className="zm-a">
          Cut once.
        </h2>
        <h2 ref={bRef} className="zm-b">
          <em>Worn for years.</em>
        </h2>
        <div ref={endRef} className="zm-end">
          <h3>
            Cut once. <em>Worn for years.</em>
          </h3>
          <p>
            Every piece starts on this table: a paper pattern, a bolt of cloth and a pair of shears. We make a few hundred at a
            time and mend them for as long as you wear them.
          </p>
          <button type="button" onClick={(e) => onView(indexOf("07"), e.currentTarget)}>
            {jacket.name} in {jacket.colour} · {money(jacket.price)} <u>View</u>
          </button>
        </div>
      </div>
    </section>
  );
}
