"use client";
import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FREE_SHIPPING, PIECES, img, pad2 } from "@/lib/data";
import type { FromRect } from "./Rail";

type Side = "front" | "back";

export default function Viewer({
  index,
  from,
  back,
  onNav,
  onClosed,
  onAdd,
}: {
  index: number;
  from: FromRect;
  back: (i: number) => FromRect;
  onNav: (i: number) => void;
  onClosed: () => void;
  onAdd: (i: number, size: string, rect: DOMRect) => void;
}) {
  const piece = PIECES[index];
  const flyRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const turnRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const sizesRef = useRef<HTMLDivElement>(null);
  const rotRef = useRef(0);
  const busyRef = useRef(true);
  const firstRef = useRef(true);
  const dirRef = useRef(1);
  const [side, setSide] = useState<Side>("front");
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [warn, setWarn] = useState(false);

  // Open: fly from the clicked thumbnail (or fade up), then reveal chrome.
  useLayoutEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tl = gsap.timeline({ onComplete: () => void (busyRef.current = false) });
    tl.fromTo(".pv-bg", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: "power2.out" }, 0);
    if (from && !reduced) {
      const r = flyRef.current!.getBoundingClientRect();
      tl.fromTo(
        flyRef.current,
        { x: from.rect.left - r.left, y: from.rect.top - r.top, scale: from.rect.width / r.width },
        { x: 0, y: 0, scale: 1, duration: 1.05, ease: "power4.inOut" },
        0,
      );
      tl.fromTo(tiltRef.current, { rotation: from.angle, y: 0 }, { rotation: 0, duration: 0.5, ease: "power2.out" }, 0);
    } else {
      tl.fromTo(flyRef.current, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0);
    }
    tl.fromTo(".pv-line", { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power3.inOut" }, 0.35);
    tl.fromTo(".pv-shadow", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 0.7);
    tl.fromTo(
      infoRef.current!.querySelectorAll(".pv-in"),
      { y: 26, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out", stagger: 0.05 },
      0.45,
    );
    tl.fromTo(".pv-chrome", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0.6);
    document.documentElement.classList.add("is-locked");
    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => document.documentElement.classList.remove("is-locked"), []);

  // Next / previous piece: slide in from the side with an elastic swing.
  useLayoutEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    rotRef.current = 0;
    gsap.set(turnRef.current, { rotationY: 0 });
    const tl = gsap.timeline({ onComplete: () => void (busyRef.current = false) });
    tl.fromTo(
      flyRef.current,
      { xPercent: 60 * dirRef.current, autoAlpha: 0 },
      { xPercent: 0, autoAlpha: 1, duration: 0.75, ease: "power3.out" },
      0,
    );
    tl.fromTo(tiltRef.current, { rotation: -9 * dirRef.current }, { rotation: 0, duration: 1.6, ease: "elastic.out(1, 0.35)" }, 0);
    tl.fromTo(
      infoRef.current!.querySelectorAll(".pv-in"),
      { y: 18, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.6, ease: "power3.out", stagger: 0.04 },
      0.1,
    );
    return () => {
      tl.kill();
    };
  }, [index]);

  const nav = (dir: number) => {
    if (busyRef.current) return;
    busyRef.current = true;
    dirRef.current = dir;
    const next = (index + dir + PIECES.length) % PIECES.length;
    gsap
      .timeline({
        onComplete: () => {
          setSide("front");
          setSize(null);
          setAdded(false);
          onNav(next);
        },
      })
      .to(flyRef.current, { xPercent: -(60 * dir), autoAlpha: 0, duration: 0.4, ease: "power2.in" }, 0)
      .to(
        infoRef.current!.querySelectorAll(".pv-in"),
        { y: -12, autoAlpha: 0, duration: 0.3, ease: "power2.in", stagger: 0.02 },
        0,
      );
  };

  const close = () => {
    if (busyRef.current) return;
    busyRef.current = true;
    const target = back(index);
    const tl = gsap.timeline({ onComplete: onClosed });
    tl.to(infoRef.current!.querySelectorAll(".pv-in"), { y: 16, autoAlpha: 0, duration: 0.35, ease: "power2.in", stagger: 0.02 }, 0);
    tl.to(".pv-chrome, .pv-shadow", { autoAlpha: 0, duration: 0.3 }, 0);
    tl.to(".pv-line", { scaleX: 0, duration: 0.5, ease: "power3.in" }, 0);
    tl.to(turnRef.current, { rotationY: 360 * Math.round(rotRef.current / 360), duration: 0.5, ease: "power2.inOut" }, 0);
    if (target) {
      const cur = flyRef.current!.getBoundingClientRect();
      gsap.set(flyRef.current, { x: 0, y: 0, scale: 1 });
      const rest = flyRef.current!.getBoundingClientRect();
      gsap.set(flyRef.current, { x: cur.left - rest.left, y: cur.top - rest.top, scale: cur.width / rest.width });
      tl.to(
        flyRef.current,
        {
          x: target.rect.left - rest.left,
          y: target.rect.top - rest.top,
          scale: target.rect.width / rest.width,
          duration: 0.95,
          ease: "power4.inOut",
        },
        0.1,
      );
    } else {
      tl.to(flyRef.current, { autoAlpha: 0, y: 40, duration: 0.5, ease: "power2.in" }, 0.1);
    }
    tl.to(".pv-bg", { autoAlpha: 0, duration: 0.55, ease: "power2.inOut" }, 0.45);
  };

  // Re-bound every render, like the original, so handlers see current state.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") nav(1);
      if (e.key === "ArrowLeft") nav(-1);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });

  const sideOf = (deg: number): Side => (Math.round(deg / 180) % 2 === 0 ? "front" : "back");

  const turnTo = (deg: number) => {
    rotRef.current = deg;
    gsap.to(turnRef.current, { rotationY: deg, duration: 1, ease: "power3.inOut" });
    gsap.fromTo(tiltRef.current, { rotation: 0 }, { keyframes: { rotation: [0, -2.4, 1.6, -0.6, 0] }, duration: 1.4, ease: "none" });
    setSide(sideOf(deg));
  };
  const pick = (s: Side) => {
    if (s !== side) turnTo(rotRef.current + 180);
  };

  // Drag to turn; a plain click turns half a revolution.
  useEffect(() => {
    const el = turnRef.current!;
    let start: { x: number; r: number } | null = null;
    let moved = false;
    const down = (e: PointerEvent) => {
      start = { x: e.clientX, r: rotRef.current };
      moved = false;
      el.setPointerCapture(e.pointerId);
      gsap.killTweensOf(el);
    };
    const move = (e: PointerEvent) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      if (Math.abs(dx) > 4) moved = true;
      rotRef.current = start.r + 0.5 * dx;
      gsap.set(el, { rotationY: rotRef.current });
      setSide(sideOf(rotRef.current));
    };
    const up = () => {
      if (!start) return;
      start = null;
      const snap = 180 * Math.round(rotRef.current / 180);
      if (moved) {
        rotRef.current = snap;
        gsap.to(el, { rotationY: snap, duration: 0.8, ease: "elastic.out(1, 0.6)" });
        setSide(sideOf(snap));
      } else {
        turnTo(rotRef.current + 180);
      }
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const num = pad2(index + 1);

  return (
    <div className="pv" role="dialog" aria-modal="true" aria-label={`${piece.name} in ${piece.colour}`}>
      <div className="pv-bg" style={{ background: piece.tint }} onClick={close} />
      <div className="pv-stage">
        <div className="pv-line" aria-hidden />
        <div ref={flyRef} className="pv-fly">
          <div ref={tiltRef} className="pv-tilt" style={{ transformOrigin: "49.3% 3.5000000000000004%" }}>
            <div ref={turnRef} className="pv-turn" title="Drag to turn it around">
              {/* eslint-disable @next/next/no-img-element */}
              <img className="pv-face" src={img(`${piece.id}-front.webp`)} alt={`${piece.name}, front`} draggable={false} />
              <img className="pv-face pv-back" src={img(`${piece.id}-back.webp`)} alt={`${piece.name}, back`} draggable={false} />
              {/* eslint-enable @next/next/no-img-element */}
            </div>
          </div>
          <div className="pv-shadow" aria-hidden />
        </div>
        <div className="pv-chrome pv-turnbar">
          <div className="pv-seg" role="group" aria-label="View">
            <button type="button" aria-pressed={side === "front"} onClick={() => pick("front")}>
              Front
            </button>
            <button type="button" aria-pressed={side === "back"} onClick={() => pick("back")}>
              Back
            </button>
            <i style={{ transform: `translateX(${100 * Number(side !== "front")}%)` }} aria-hidden />
          </div>
          <span className="pv-tip">or drag to turn</span>
        </div>
      </div>
      <div ref={infoRef} className="pv-info">
        <div className="pv-scroll">
          <p className="pv-in pv-eyebrow">
            {num} / {pad2(PIECES.length)} — {piece.kind}
          </p>
          <h2 className="pv-in pv-name">
            {piece.name} <em>in {piece.colour}</em>
          </h2>
          <p className="pv-in pv-price">${piece.price}</p>
          <p className="pv-in pv-blurb">{piece.blurb}</p>
          <div className="pv-in pv-sizehead">
            <span>Size</span>
            <span className={warn && !size ? "is-warn" : ""}>
              {size ? `${size} selected` : warn ? "Pick a size first" : "Fits true to size"}
            </span>
          </div>
          <div ref={sizesRef} className="pv-in pv-sizes">
            {piece.sizes.map((s) => {
              const out = piece.soldOut?.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={out}
                  aria-pressed={size === s}
                  onClick={() => {
                    setSize(s);
                    setWarn(false);
                  }}
                  className={out ? "is-out" : ""}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className={`pv-in pv-add${added ? " is-added" : ""}`}
            onClick={() => {
              if (!size) {
                setWarn(true);
                gsap.fromTo(sizesRef.current, { x: 0 }, { keyframes: { x: [0, -8, 7, -5, 3, 0] }, duration: 0.45, ease: "none" });
                return;
              }
              onAdd(index, size, turnRef.current!.getBoundingClientRect());
              setAdded(true);
              setTimeout(() => setAdded(false), 1800);
            }}
          >
            <span>{added ? "Added to bag" : "Add to bag"}</span>
            <span>${piece.price}</span>
          </button>
          <p className="pv-in pv-small">
            Free shipping over ${FREE_SHIPPING} · Returns in 30 days
          </p>
          <dl className="pv-in pv-specs">
            <div>
              <dt>Fabric</dt>
              <dd>{piece.fabric}</dd>
            </div>
            <div>
              <dt>Fit</dt>
              <dd>{piece.fit}</dd>
            </div>
            <div>
              <dt>Made in</dt>
              <dd>{piece.made}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="pv-chrome pv-top">
        <button type="button" className="pv-close" onClick={close}>
          Back to the rail <i aria-hidden>✕</i>
        </button>
      </div>
      <div className="pv-chrome pv-nav">
        <button type="button" onClick={() => nav(-1)} aria-label="Previous piece">
          ←
        </button>
        <button type="button" onClick={() => nav(1)} aria-label="Next piece">
          →
        </button>
      </div>
    </div>
  );
}
