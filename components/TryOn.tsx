"use client";
import { useRef } from "react";
import { N, PIECES, clamp, img, lerp, money, pad2, reducedMotion, smooth } from "@/lib/data";
import { useScrollProgress } from "./useScrollProgress";

type Layout = {
  w: number;
  h: number;
  H: number;
  top: number;
  cx: number;
  R: number;
  Hg: number;
  gTop: number;
  body: { y: number; s: number };
};

export default function TryOn({ onView }: { onView: (i: number, el: HTMLElement | null) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const figRef = useRef<HTMLDivElement>(null);
  const wearRef = useRef<(HTMLImageElement | null)[]>([]);
  const hangRef = useRef<(HTMLImageElement | null)[]>([]);
  const infoRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<(HTMLLIElement | null)[]>([]);
  const currentRef = useRef(0);
  const layoutRef = useRef<Layout>({ w: 0, h: 0, H: 0, top: 0, cx: 0, R: 0, Hg: 0, gTop: 0, body: { y: 0, s: 0.46 } });
  const posRef = useRef(0);

  const show = (i: number) => {
    if (i === currentRef.current) return;
    currentRef.current = i;
    const p = PIECES[i];
    const el = infoRef.current!;
    el.classList.remove("is-in");
    void el.offsetWidth;
    el.querySelector("[data-n]")!.textContent = `${pad2(i + 1)} / ${pad2(N)}`;
    el.querySelector("[data-name]")!.textContent = p.name;
    el.querySelector("[data-colour]")!.textContent = `in ${p.colour}`;
    el.querySelector("[data-price]")!.textContent = money(p.price);
    el.classList.add("is-in");
    indexRef.current.forEach((li, j) => li?.classList.toggle("is-on", j === i));
  };

  useScrollProgress(
    sectionRef,
    (t) => {
      const L = layoutRef.current;
      const target = t * (N - 1);
      posRef.current = reducedMotion() ? target : posRef.current + (target - posRef.current) * 0.12;
      const raw = posRef.current;
      const base = Math.min(N - 2, Math.floor(raw));
      const f = smooth((raw - base - 0.25) / 0.6);
      const pos = base + f;

      wearRef.current.forEach((el, i) => {
        if (!el) return;
        if (i === base) {
          el.style.opacity = "1";
          el.style.zIndex = "1";
          el.style.maskImage = el.style.webkitMaskImage = "none";
        } else if (i === base + 1) {
          const e = smooth((f - 0.4) / 0.6);
          const m = `linear-gradient(180deg, #000 ${125 * e - 25}%, transparent ${125 * e}%)`;
          el.style.opacity = e > 0 ? "1" : "0";
          el.style.zIndex = "2";
          el.style.maskImage = el.style.webkitMaskImage = m;
        } else el.style.opacity = "0";
      });

      hangRef.current.forEach((el, i) => {
        if (!el) return;
        const d = i - pos;
        const a = Math.abs(d);
        const sign = Math.sign(d) || 1;
        const near = Math.min(1, a);
        const op =
          a >= 1
            ? 0.2 * clamp(2 - a)
            : d > 0
              ? d > 0.5
                ? lerp(0.2, 1, (1 - d) / 0.5)
                : clamp((d - 0.02) / 0.3)
              : 0.2 * clamp((a - 0.25) / 0.75);
        const x = sign * (a <= 1 ? L.R * a : L.R + (a - 1) * L.R * 0.5);
        const y = lerp(L.body.y, 0, near);
        const s = lerp(L.body.s, 1, near);
        const rot = d > 0 && d < 1 ? -7 * Math.sin(d * Math.PI) : 0;
        el.style.opacity = String(op);
        el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s}) rotate(${rot}deg)`;
      });

      show(f > 0.6 ? base + 1 : base);
    },
    () => {
      const w = stageRef.current!.clientWidth;
      const h = stageRef.current!.clientHeight;
      const phone = w < 760;
      const H = phone ? Math.min(0.6 * h, 560) : Math.min(0.84 * h, 920);
      const top = phone ? 0.27 * h : h - 0.05 * h - H;
      const Hg = H * (phone ? 0.42 : 0.5);
      const gTop = top + 0.08 * H;
      layoutRef.current = {
        w,
        h,
        H,
        top,
        cx: w / 2,
        R: phone ? 0.4 * w : Math.min(0.27 * w, 0.78 * H),
        Hg,
        gTop,
        body: { y: top + 0.054 * H - (gTop + 0.04 * Hg), s: (0.23 * H) / Hg },
      };
      Object.assign(figRef.current!.style, { height: `${H}px`, width: `${(500 * H) / 1402}px`, top: `${top}px` });
      const gw = (760 / 917) * Hg;
      hangRef.current.forEach(
        (el) =>
          el &&
          Object.assign(el.style, { width: `${gw}px`, height: `${Hg}px`, left: `${w / 2 - 0.493 * gw}px`, top: `${gTop}px` }),
      );
    },
  );

  return (
    <section ref={sectionRef} className="to" style={{ height: `${100 + (N - 1) * 75}svh` }} aria-label="Try it on">
      <div ref={stageRef} className="to-stage">
        <div className="to-copy">
          <p className="eyebrow">Try it on</p>
          <h2>
            One man, <em>eight pieces.</em>
          </h2>
          <p>Scroll, and the next piece comes off the rail and onto him. Same trousers, same trainers; only the top layer changes.</p>
        </div>
        {/* eslint-disable @next/next/no-img-element */}
        {PIECES.map((p, i) => (
          <img
            key={p.id}
            ref={(el) => {
              hangRef.current[i] = el;
            }}
            className="to-hang"
            src={img(`${p.id}-flat.webp`)}
            alt=""
            aria-hidden
          />
        ))}
        <div ref={figRef} className="to-fig">
          {PIECES.map((p, i) => (
            <img
              key={p.id}
              ref={(el) => {
                wearRef.current[i] = el;
              }}
              className="to-wear"
              src={img(`wear-${p.id}.webp`)}
              alt={`The model wearing the ${p.name} in ${p.colour}`}
              loading={i < 2 ? "eager" : "lazy"}
              style={{ opacity: Number(i === 0) }}
            />
          ))}
          <i className="to-floor" aria-hidden />
        </div>
        {/* eslint-enable @next/next/no-img-element */}
        <div ref={infoRef} className="to-info is-in">
          <span data-n>01 / {pad2(N)}</span>
          <b data-name>{PIECES[0].name}</b>
          <em data-colour>in {PIECES[0].colour}</em>
          <span className="to-buy">
            <span data-price>{money(PIECES[0].price)}</span>
            <button type="button" onClick={() => onView(currentRef.current, null)}>
              View piece
            </button>
          </span>
        </div>
        <ol className="to-index" aria-hidden>
          {PIECES.map((p, i) => (
            <li
              key={p.id}
              ref={(el) => {
                indexRef.current[i] = el;
              }}
              className={i === 0 ? "is-on" : ""}
            >
              <span>{pad2(i + 1)}</span>
              {p.name}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
