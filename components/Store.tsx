"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BRAND,
  FREE_SHIPPING,
  LOOKBOOK_DOT,
  LOOKBOOK_WORD,
  NAV,
  PIECES,
  PROMISES,
  img,
  indexOf,
  moneyLocale,
} from "@/lib/data";
import FooterRail from "./FooterRail";
import Rail, { type FromRect, type RailApi } from "./Rail";
import Strip from "./Strip";
import Timeline from "./Timeline";
import TryOn from "./TryOn";
import Viewer from "./Viewer";
import Zoom from "./Zoom";

type Open = { i: number; from: FromRect; origin: "rail" | HTMLElement | null };
type Line = { id: string; size: string; qty: number };

export default function Store() {
  const railApi = useRef<RailApi | null>(null);
  const bagBtn = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState<Open | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [bagOpen, setBagOpen] = useState(false);

  const count = lines.reduce((t, l) => t + l.qty, 0);
  const subtotal = lines.reduce((t, l) => t + l.qty * PIECES[indexOf(l.id)].price, 0);

  const openFromRail = useCallback(
    (i: number) => setOpen({ i, from: railApi.current?.measure(i) ?? null, origin: "rail" }),
    [],
  );
  const openFrom = (i: number, el: HTMLElement | null) =>
    setOpen({ i, from: el ? { rect: el.getBoundingClientRect(), angle: 0 } : null, origin: el });

  const changeQty = (line: Line, d: number) =>
    setLines((ls) => ls.flatMap((l) => (l === line ? (l.qty + d > 0 ? [{ ...l, qty: l.qty + d }] : []) : [l])));

  // Lookbook parallax + scroll reveals (GSAP ScrollTrigger, as in the original).
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".lb-word",
        { xPercent: 6 },
        { xPercent: -22, ease: "none", scrollTrigger: { trigger: ".lb", start: "top bottom", end: "bottom top", scrub: true } },
      );
      gsap.fromTo(
        ".lb-model",
        { y: 90, scale: 0.94 },
        { y: 0, scale: 1, ease: "none", scrollTrigger: { trigger: ".lb", start: "top bottom", end: "top 15%", scrub: true } },
      );
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) =>
        gsap.fromTo(
          el.children,
          { y: 30, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out", stagger: 0.07, scrollTrigger: { trigger: el, start: "top 82%" } },
        ),
      );
    });
    let timer = 0;
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    });
    ro.observe(document.body);
    return () => {
      ro.disconnect();
      clearTimeout(timer);
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    if (!bagOpen) return;
    document.documentElement.classList.add("is-locked");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setBagOpen(false);
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      if (!open) document.documentElement.classList.remove("is-locked");
    };
  }, [bagOpen, open]);

  const dot = LOOKBOOK_DOT;
  const look = PIECES[indexOf(dot.id)];
  const toFree = Math.max(0, FREE_SHIPPING - subtotal);

  const addToBag = (i: number, size: string, rect: DOMRect) => {
    const p = PIECES[i];
    setLines((ls) => {
      const hit = ls.find((l) => l.id === p.id && l.size === size);
      return hit ? ls.map((l) => (l === hit ? { ...l, qty: l.qty + 1 } : l)) : [...ls, { id: p.id, size, qty: 1 }];
    });
    // Ghost image flies from the viewer into the Bag button.
    const bag = bagBtn.current!.getBoundingClientRect();
    const ghost = document.createElement("img");
    ghost.src = img(`${p.id}-front.webp`);
    ghost.className = "fly-ghost";
    Object.assign(ghost.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    document.body.appendChild(ghost);
    const dx = bag.left + bag.width / 2 - (rect.left + rect.width / 2);
    const dy = bag.top + bag.height / 2 - (rect.top + rect.height / 2);
    gsap
      .timeline({ onComplete: () => ghost.remove() })
      .to(ghost, { x: dx, duration: 0.85, ease: "power2.inOut" }, 0)
      .to(ghost, { y: dy, duration: 0.85, ease: "back.in(1.1)" }, 0)
      .to(ghost, { scale: 0.06, duration: 0.85, ease: "power2.in" }, 0)
      .to(ghost, { autoAlpha: 0, duration: 0.15 }, 0.72)
      .fromTo(bagBtn.current, { scale: 1 }, { keyframes: { scale: [1, 1.22, 0.94, 1] }, duration: 0.5 }, 0.78);
  };

  return (
    <>
      <header className="hd">
        <a className="hd-mark" href="#rail">
          {BRAND}
        </a>
        <nav className="hd-nav" aria-label="Main">
          {NAV.map((n) => (
            <a key={n} href={`#${n.toLowerCase()}`}>
              {n}
            </a>
          ))}
        </nav>
        <button ref={bagBtn} type="button" className="hd-bag" onClick={() => setBagOpen(true)}>
          Bag <span className={count ? "is-full" : ""}>{count}</span>
        </button>
      </header>

      <main>
        <Rail onOpen={openFromRail} hidden={open?.origin === "rail" ? open.i : null} apiRef={railApi} />
        <TryOn onView={openFrom} />
        <Timeline onView={openFrom} />

        <section id="lookbook" className="lb" aria-label="Lookbook">
          <div className="lb-word" aria-hidden>
            {LOOKBOOK_WORD.join(" ")}
          </div>
          <div className="lb-grid">
            <div className="lb-copy" data-reveal>
              <p className="eyebrow">Lookbook — 01</p>
              <h2>
                {LOOKBOOK_WORD[0]}
                <br />
                <em>{LOOKBOOK_WORD[1]}</em>
              </h2>
              <p>
                The chore jacket over a plain tee and pleated wool trousers. It is the outfit we keep reaching for, so it is the
                one we photographed.
              </p>
            </div>
            <figure className="lb-figure">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="lb-model"
                src={img("model.webp")}
                alt="A model wearing the olive chore jacket over a white tee and charcoal pleated trousers"
              />
              <i className="lb-floor" aria-hidden />
              <button
                type="button"
                className="lb-dot"
                style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
                onClick={(e) => openFrom(indexOf(dot.id), e.currentTarget)}
                aria-label={`View the ${look.name}`}
              >
                <i />
                <span>
                  {look.name} — {moneyLocale(look.price)}
                </span>
              </button>
            </figure>
            <div className="lb-shop" data-reveal>
              <p className="eyebrow">Shop the look</p>
              <button
                type="button"
                className="lb-card"
                onClick={(e) => openFrom(indexOf(dot.id), e.currentTarget.querySelector("img"))}
              >
                <span className="lb-thumb" style={{ background: look.tint }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(`${look.id}-front.webp`)} alt="" />
                </span>
                <span className="lb-meta">
                  <b>{look.name}</b>
                  <em>
                    {look.colour} · {look.fabric}
                  </em>
                  <span>
                    {moneyLocale(look.price)} <u>View</u>
                  </span>
                </span>
              </button>
            </div>
          </div>
        </section>

        <Zoom onView={openFrom} />
        <Strip onView={openFrom} />

        <section id="studio" className="pr" aria-label="Our promises">
          <div className="pr-grid" data-reveal>
            {PROMISES.map((p) => (
              <div key={p.n} className="pr-item">
                <span>{p.n}</span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <FooterRail onView={openFrom} />

      {open && (
        <Viewer
          key={open.from ? "o" : "f"}
          index={open.i}
          from={open.from}
          back={(i) => {
            if (!open) return null;
            if (open.origin === "rail" || i !== open.i) return railApi.current?.measure(i) ?? null;
            if (!open.origin) return null;
            const r = open.origin.getBoundingClientRect();
            return r.bottom > 0 && r.top < innerHeight ? { rect: r, angle: 0 } : null;
          }}
          onNav={(i) => {
            setOpen((o) => (o ? { ...o, i } : o));
            railApi.current?.focus(i);
          }}
          onClosed={() => setOpen(null)}
          onAdd={addToBag}
        />
      )}

      <div className={`bag${bagOpen ? " is-open" : ""}`} aria-hidden={!bagOpen}>
        <div className="bag-dim" onClick={() => setBagOpen(false)} />
        <aside className="bag-panel" role="dialog" aria-label="Your bag">
          <div className="bag-head">
            <h2>
              Your bag <span>{count}</span>
            </h2>
            <button type="button" onClick={() => setBagOpen(false)} aria-label="Close bag">
              ✕
            </button>
          </div>
          <div className="bag-ship">
            <p>{toFree > 0 ? <>You are {moneyLocale(toFree)} away from free shipping</> : <>Shipping is on us</>}</p>
            <i>
              <span style={{ transform: `scaleX(${Math.min(1, subtotal / FREE_SHIPPING)})` }} />
            </i>
          </div>
          <ul className="bag-list">
            {lines.length === 0 && <li className="bag-empty">Nothing here yet. Take something off the rail.</li>}
            {lines.map((l) => {
              const p = PIECES[indexOf(l.id)];
              return (
                <li key={l.id + l.size}>
                  <span className="bag-thumb" style={{ background: p.tint }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img(`${p.id}-front.webp`)} alt="" />
                  </span>
                  <div className="bag-meta">
                    <b>{p.name}</b>
                    <em>
                      {p.colour} · Size {l.size}
                    </em>
                    <div className="bag-qty">
                      <button type="button" onClick={() => changeQty(l, -1)} aria-label="One less">
                        −
                      </button>
                      <span>{l.qty}</span>
                      <button type="button" onClick={() => changeQty(l, 1)} aria-label="One more">
                        +
                      </button>
                    </div>
                  </div>
                  <span className="bag-price">{moneyLocale(p.price * l.qty)}</span>
                </li>
              );
            })}
          </ul>
          <div className="bag-foot">
            <p>
              <span>Subtotal</span>
              <b>{moneyLocale(subtotal)}</b>
            </p>
            <button type="button" disabled={!lines.length}>
              Checkout
            </button>
            <small>Taxes and shipping worked out at checkout</small>
          </div>
        </aside>
      </div>
    </>
  );
}
