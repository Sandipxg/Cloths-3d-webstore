"use client";
import gsap from "gsap";
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { N, PIECES, RAIL_TITLE, clamp, easeQuad, img, pad2, smooth } from "@/lib/data";

export type FromRect = { rect: DOMRect; angle: number } | null;
export type RailApi = { measure: (i: number) => FromRect; focus: (i: number) => void };

type Geo = {
  phone: boolean;
  gh: number;
  gw: number;
  ax: number;
  ay: number;
  step: { x: number; y: number; z: number };
  vw: number;
  vh: number;
  persp: number;
};

function geometry(vw: number, vh: number): Geo {
  const phone = vw < 760;
  const gh = phone ? Math.min(0.5 * vh, 1.02 * vw) : Math.min(0.68 * vh, 760);
  const gw = (760 * gh) / 917;
  return {
    phone,
    gh,
    gw,
    ax: phone ? 0.4 * vw : 0.27 * vw,
    ay: phone ? 0.15 * vh : 0.16 * vh,
    step: { x: gw * (phone ? 0.15 : 0.16), y: -(0.016 * gh), z: -(0.34 * gw) },
    vw,
    vh,
    persp: phone ? 900 : 1500,
  };
}

export default function Rail({
  onOpen,
  hidden,
  apiRef,
}: {
  onOpen: (i: number) => void;
  hidden: number | null;
  apiRef: RefObject<RailApi | null>;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const infoRef = useRef<HTMLDivElement>(null);
  const navNumRef = useRef<HTMLSpanElement>(null);
  const sideBarRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let g = geometry(innerWidth, innerHeight);
    let top = 0;
    const measureTop = () => {
      top = sectionRef.current!.getBoundingClientRect().top + scrollY;
    };
    const onResize = () => {
      const next = geometry(innerWidth, innerHeight);
      if (next.vw === g.vw && Math.abs(next.vh - g.vh) < 120) return;
      g = next;
      setGeo(next);
      requestAnimationFrame(measureTop);
    };
    setGeo(g);
    requestAnimationFrame(measureTop);
    addEventListener("resize", onResize);

    let raf = 0;
    let smoothPos = 0;
    let last = performance.now();
    let vel = 0;
    let swing = 0;
    let swingV = 0;
    let shown = -1;
    const intro = { t: reduced ? 1 : 0 };
    let hover = -1;
    const lift = new Float32Array(N);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = clamp((now - last) / 16.67, 0, 3);
      last = now;
      const target =
        clamp((scrollY - top) / Math.max(1, sectionRef.current!.offsetHeight - innerHeight)) * (N - 1);
      const prev = smoothPos;
      smoothPos = reduced ? target : smoothPos + (target - smoothPos) * (1 - Math.pow(0.9, dt));
      vel = smoothPos - prev;
      const base = Math.min(N - 2, Math.floor(smoothPos));
      const pos = base + smooth((smoothPos - base - 0.18) / 0.64);
      posRef.current = pos;
      swingV += -(0.02 * swing) - 6 * vel - 0.08 * swingV;
      swing = clamp(swing + swingV, -6, 6);
      const introE = easeQuad(intro.t);
      const k = 1 - Math.pow(0.86, dt);
      let lifted = 0;

      itemsRef.current.forEach((el, i) => {
        if (!el) return;
        lift[i] += (Number(i === hover) - lift[i]) * k;
        const d = i - pos + (1 - introE) * (N + 2);
        let s: number;
        let ry: number;
        let op = 1;
        let ox = 0;
        let oz = 0;
        let oy = 0;
        if (d >= 1) {
          s = 2.4 + (d - 1) + 0.6 * lifted;
          ry = -64 * (1 - 0.18 * lift[i]);
        } else if (d >= 0) {
          const e = easeQuad(d);
          s = 2.4 * e;
          ry = -64 * e;
        } else {
          const t = clamp(-d, 0, 1.4);
          s = 0;
          ry = 38 * smooth(t);
          ox = -(1.25 * g.gw) * easeQuad(t);
          oz = 260 * t;
          oy = 20 * t;
          op = clamp(1 - 1.1 * t);
        }
        const p = { x: g.step.x * s, y: g.step.y * s, z: g.step.z * s };
        if (d > N - 2) op *= clamp(N - d);
        if (d >= 0.5) lifted += lift[i];
        const rz = (Math.abs(d) < 0.5 ? swing * (1 - 2 * Math.abs(d)) : 0) + (d >= 0.5 ? -16 * lift[i] : 0);
        el.style.transform = `translate3d(${p.x + ox}px, ${p.y + oy}px, ${p.z + oz}px) rotateY(${ry}deg) rotateZ(${rz}deg)`;
        el.style.opacity = String(op);
        el.style.visibility = op <= 0.01 ? "hidden" : "visible";
        el.tabIndex = Math.round(pos) === i ? 0 : -1;
      });

      const idx = Math.round(pos);
      if (idx !== shown) {
        shown = idx;
        setActive(idx);
        navNumRef.current!.textContent = pad2(idx + 1);
      }
      sideBarRef.current!.style.transform = `translateY(${(pos / (N - 1)) * 100}%)`;
    };
    raf = requestAnimationFrame(frame);

    const stage = stageRef.current!;
    const tag = tagRef.current!;
    const onMove = (e: PointerEvent) => {
      const item = (e.target as HTMLElement).closest<HTMLElement>(".rk-item");
      const i = item ? Number(item.dataset.i) : -1;
      if (i !== hover) {
        if (i >= 0 && Math.abs(posRef.current - i) < 0.3) swingV += 1.1;
        hover = i;
        if (i >= 0) {
          const piece = PIECES[i];
          const current = Math.abs(posRef.current - i) < 0.3;
          tag.innerHTML = "";
          tag.append(piece.name + " ");
          const el = document.createElement(current ? "b" : "span");
          el.textContent = current ? "View ↗" : `$${piece.price}`;
          tag.append(el);
        }
        tag.classList.toggle("on", i >= 0);
      }
      const r = stage.getBoundingClientRect();
      tag.style.transform = `translate(${e.clientX - r.left + 16}px, ${e.clientY - r.top + 18}px)`;
    };
    const onLeave = () => {
      hover = -1;
      tag.classList.remove("on");
    };
    if (!reduced && matchMedia("(hover: hover) and (pointer: fine)").matches) {
      stage.addEventListener("pointermove", onMove);
      stage.addEventListener("pointerleave", onLeave);
    }
    const introTween = reduced ? null : gsap.to(intro, { t: 1, duration: 2.2, ease: "power3.out", delay: 0.2 });

    apiRef.current = {
      measure: (i) => {
        const el = itemsRef.current[i];
        if (!el || Math.abs(posRef.current - i) > 0.05) return null;
        const tf = el.style.transform;
        el.style.transform = tf.replace(/rotateZ\([^)]*\)/, "rotateZ(0deg)");
        const rect = el.getBoundingClientRect();
        el.style.transform = tf;
        return { rect, angle: 0 };
      },
      focus: (i) => {
        scrollTo({
          top: top + (i / (N - 1)) * (sectionRef.current!.offsetHeight - innerHeight),
          behavior: "instant",
        });
      },
    };

    return () => {
      cancelAnimationFrame(raf);
      introTween?.kill();
      removeEventListener("resize", onResize);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, [apiRef]);

  useEffect(() => {
    const el = infoRef.current;
    if (!el) return;
    gsap.fromTo(
      el.querySelectorAll("[data-rise]"),
      { y: 14, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.6, ease: "power3.out", stagger: 0.035, overwrite: true },
    );
  }, [active]);

  const go = (delta: number) => {
    const i = clamp(Math.round(posRef.current) + delta, 0, N - 1);
    const s = sectionRef.current!;
    scrollTo({
      top: s.getBoundingClientRect().top + scrollY + (i / (N - 1)) * (s.offsetHeight - innerHeight),
      behavior: "smooth",
    });
  };

  const piece = PIECES[active];
  const height = `${100 + (N - 1) * 55}svh`;
  const sectionStyle = (geo
    ? { "--gh": `${geo.gh}px`, "--gw": `${geo.gw}px`, height }
    : { height }) as CSSProperties;

  let railStyle: CSSProperties | null = null;
  if (geo) {
    const s = geo.step;
    const len = Math.hypot(s.x, s.y, s.z);
    const ry = (180 * Math.atan2(-s.z, s.x)) / Math.PI;
    const rz = (180 * Math.atan2(s.y, Math.hypot(s.x, s.z))) / Math.PI;
    railStyle = {
      width: len * (2.4 + N - 0.6 - -1.2),
      transform: `translate3d(${-1.2 * s.x}px, ${-1.2 * s.y}px, ${-1.2 * s.z}px) rotateY(${ry}deg) rotateZ(${rz}deg)`,
    };
  }

  return (
    <section ref={sectionRef} id="rail" className="rk" style={sectionStyle} aria-label="The rack">
      <div
        ref={stageRef}
        className="rk-stage"
        style={geo ? { perspective: `${geo.persp}px`, perspectiveOrigin: `${geo.ax}px ${geo.ay + 0.3 * geo.gh}px` } : undefined}
      >
        <div className="rk-world" style={geo ? { left: geo.ax, top: geo.ay } : undefined}>
          {railStyle && <div className="rk-rail" style={railStyle} aria-hidden />}
          {PIECES.map((p, i) => (
            <button
              key={p.id}
              ref={(el) => {
                itemsRef.current[i] = el;
              }}
              type="button"
              data-i={i}
              className={`rk-item${hidden === i ? " is-gone" : ""}`}
              onClick={() => (Math.abs(posRef.current - i) < 0.3 ? onOpen(i) : go(i - Math.round(posRef.current)))}
              aria-label={`${p.name} in ${p.colour}, $${p.price}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img(`${p.id}-front.webp`)} alt="" draggable={false} />
            </button>
          ))}
        </div>
        <div ref={tagRef} className="rk-tag" aria-hidden />
        <div className="rk-side" aria-hidden>
          <span>01</span>
          <i>
            <span ref={sideBarRef} />
          </i>
          <span>{pad2(N)}</span>
        </div>
        <div ref={infoRef} className="rk-info">
          <p data-rise className="rk-n">
            {pad2(active + 1)} / {pad2(N)}
          </p>
          <h1 data-rise className="rk-name">
            {piece.name} <em>in {piece.colour}</em>
          </h1>
          <p data-rise className="rk-blurb">
            {piece.blurb}
          </p>
          <dl data-rise className="rk-specs">
            <div>
              <dt>Material</dt>
              <dd>{piece.fabric}</dd>
            </div>
            <div>
              <dt>Fit</dt>
              <dd>{piece.fit}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{piece.sizes.filter((s) => !piece.soldOut?.includes(s)).join(" / ")}</dd>
            </div>
          </dl>
          <div data-rise className="rk-buy">
            <span>${piece.price}</span>
            <button type="button" onClick={() => onOpen(active)}>
              View details <i aria-hidden>↗</i>
            </button>
          </div>
        </div>
        <div className="rk-nav">
          <button type="button" onClick={() => go(-1)} aria-label="Previous piece">
            ←
          </button>
          <span>
            <span ref={navNumRef}>01</span> / {pad2(N)}
          </span>
          <button type="button" onClick={() => go(1)} aria-label="Next piece">
            →
          </button>
        </div>
        <div className="rk-foot">
          <span>Autumn 26</span>
          <span>{RAIL_TITLE.join(" ")}</span>
          <span className="rk-hint">Scroll · select · explore</span>
        </div>
      </div>
    </section>
  );
}
