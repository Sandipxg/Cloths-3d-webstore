"use client";
import gsap from "gsap";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BRAND, FOOTER_COLS, PIECES, SOCIAL, VISIT, VISIT_TITLE, img, pad2 } from "@/lib/data";

const clampN = (t: number, a: number, b: number) => Math.max(a, Math.min(b, t));

export default function FooterRail({ onView }: { onView: (i: number, el: HTMLElement | null) => void }) {
  const railRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const swingRef = useRef<(HTMLSpanElement | null)[]>([]);
  const markRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);
  const [joined, setJoined] = useState(false);

  // Hangers: damped springs pushed by the pointer brushing past, plus a drop-in on first view.
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = railRef.current!;
    const springs = PIECES.map((_, i) => ({ a: 0, w: 0, k: 0.02 + (i % 3) * 0.003, ph: 1.7 * i }));
    let raf = 0;
    let running = false;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = clampN((now - last) / 16.67, 0.5, 3);
      last = now;
      springs.forEach((s, i) => {
        if (!reduced)
          for (let k = 0; k < Math.round(dt); k++) {
            s.w += -s.k * s.a - 0.03 * s.w;
            s.a = clampN(s.a + s.w, -24, 24);
          }
        const sw = swingRef.current[i];
        if (sw) sw.style.transform = `rotate(${reduced ? 0 : s.a + 0.4 * Math.sin(0.0012 * now + s.ph)}deg)`;
      });
    };
    let lastX = -1;
    const move = (e: PointerEvent) => {
      const dx = lastX < 0 ? 0 : e.clientX - lastX;
      lastX = e.clientX;
      if (!dx) return;
      itemsRef.current.forEach((item, i) => {
        if (!item) return;
        const r = item.getBoundingClientRect();
        if (e.clientY < r.top || e.clientY > r.bottom) return;
        const lo = Math.min(e.clientX, e.clientX - dx);
        const hi = Math.max(e.clientX, e.clientX - dx);
        const cx = r.left + r.width / 2;
        if (cx >= lo - 0.3 * r.width && cx <= hi + 0.3 * r.width) springs[i].w += 0.035 * clampN(dx, -40, 40);
      });
    };
    const leave = () => {
      lastX = -1;
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    let dropped = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !running) {
          running = true;
          raf = requestAnimationFrame(tick);
        } else if (!e.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
        if (e.isIntersecting && !dropped && !reduced) {
          dropped = true;
          itemsRef.current.forEach(
            (item, i) =>
              item &&
              gsap.fromTo(
                item,
                { yPercent: -130, autoAlpha: 0 },
                {
                  yPercent: 0,
                  autoAlpha: 1,
                  duration: 0.9,
                  ease: "power3.in",
                  delay: 0.1 + 0.07 * i,
                  onComplete: () => {
                    springs[i].w += (i % 2 ? 1 : -1) * 1.6;
                  },
                },
              ),
          );
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  // Big HALE mark: photo-filled letters that follow the pointer, revealed by a clip wipe.
  useEffect(() => {
    const mark = markRef.current!;
    const foot = footRef.current!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cur = { x: 50, y: 45 };
    const tgt = { x: 50, y: 45 };
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      cur.x += (tgt.x - cur.x) * 0.06;
      cur.y += (tgt.y - cur.y) * 0.06;
      mark.style.backgroundPosition = `${cur.x}% ${cur.y}%`;
    };
    const move = (e: PointerEvent) => {
      const r = foot.getBoundingClientRect();
      tgt.x = 20 + ((e.clientX - r.left) / r.width) * 60;
      tgt.y = 25 + ((e.clientY - r.top) / r.height) * 50;
    };
    if (!reduced) {
      raf = requestAnimationFrame(tick);
      foot.addEventListener("pointermove", move);
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        if (!reduced)
          gsap.fromTo(
            mark,
            { clipPath: "inset(100% 0 0 0)", y: 60 },
            { clipPath: "inset(0% 0 0 0)", y: 0, duration: 1.4, ease: "power4.out" },
          );
      },
      { threshold: 0.2 },
    );
    io.observe(mark);
    return () => {
      cancelAnimationFrame(raf);
      foot.removeEventListener("pointermove", move);
      io.disconnect();
    };
  }, []);

  const n = PIECES.length;

  return (
    <footer className="ft">
      <div ref={railRef} className="fr">
        <div className="fr-head">
          <span>
            That&apos;s the whole rail — {pad2(n)} pieces
          </span>
          <span className="fr-hint">Brush past them · tap one to open it</span>
        </div>
        <div className="fr-rail" style={{ "--n": n } as CSSProperties}>
          <i className="fr-bar" aria-hidden />
          {PIECES.map((p, i) => (
            <button
              key={p.id}
              ref={(el) => {
                itemsRef.current[i] = el;
              }}
              type="button"
              className="fr-item"
              onClick={(e) => onView(i, e.currentTarget.querySelector("img"))}
              aria-label={`${p.name} in ${p.colour}, $${p.price}`}
            >
              <span
                ref={(el) => {
                  swingRef.current[i] = el;
                }}
                className="fr-swing"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img(`${p.id}-front.webp`)} alt="" draggable={false} loading="lazy" />
              </span>
              <span className="fr-tag">
                <b>{p.name}</b> ${p.price}
              </span>
            </button>
          ))}
        </div>
        <form
          className="fr-news"
          onSubmit={(e) => {
            e.preventDefault();
            setJoined(true);
          }}
        >
          <h2>
            Hear when the <em>rail changes.</em>
          </h2>
          <p>One letter a season. New pieces, the workshops behind them, nothing else.</p>
          <label>
            <span className="sr">Email address</span>
            <input type="email" required placeholder="Your email" disabled={joined} suppressHydrationWarning />
            <button type="submit" disabled={joined}>
              {joined ? "You're on the list ✓" : "Sign up →"}
            </button>
          </label>
        </form>
      </div>
      <div ref={footRef} className="fd">
        <div className="fd-grid">
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <p>{col.title}</p>
              <ul>
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#rail">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p>{VISIT_TITLE}</p>
            <ul>
              {VISIT.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
            <ul className="fd-social">
              {SOCIAL.map((s) => (
                <li key={s}>
                  <a href="#rail">{s} ↗</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div ref={markRef} className="fd-mark" style={{ backgroundImage: `url(${img("strip-5.webp")})` }} aria-hidden>
          {BRAND}
        </div>
        <div className="fd-base">
          <span>© 2026 {BRAND} Studio</span>
          <span>HALE is a demo brand. Clothing, names and prices are placeholders.</span>
          <button type="button" onClick={() => scrollTo({ top: 0, behavior: "smooth" })}>
            Back to the rail ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
