"use client";
import { useRef } from "react";
import { PIECES, STRIP, img, indexOf, money, pad2, reducedMotion, smooth } from "@/lib/data";
import { useScrollProgress } from "./useScrollProgress";

/** "Clothes for ordinary days." — vertical scroll drives a horizontal photo track. */
export default function Strip({ onView }: { onView: (i: number, el: HTMLElement | null) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const picsRef = useRef<(HTMLDivElement | null)[]>([]);
  const distRef = useRef(0);
  const posRef = useRef(0);

  useScrollProgress(
    sectionRef,
    (t) => {
      posRef.current = reducedMotion() ? t : posRef.current + (t - posRef.current) * 0.14;
      const x = -smooth((posRef.current - 0.06) / 0.88) * distRef.current;
      trackRef.current!.style.transform = `translate3d(${x}px,0,0)`;
      const mid = innerWidth / 2;
      picsRef.current.forEach((pic) => {
        if (!pic) return;
        const r = pic.getBoundingClientRect();
        const n = (r.left + r.width / 2 - mid) / innerWidth;
        (pic.firstElementChild as HTMLElement).style.transform = `translateX(${-(12 * n)}%) scale(1.18)`;
      });
    },
    () => {
      distRef.current = Math.max(0, trackRef.current!.scrollWidth - innerWidth);
      sectionRef.current!.style.height = `${innerHeight + distRef.current}px`;
    },
  );

  return (
    <section ref={sectionRef} className="st" aria-label="Out in it">
      <div className="st-stage">
        <div ref={trackRef} className="st-track">
          <div className="st-intro">
            <p className="eyebrow">Out in it</p>
            <h2>
              Clothes for
              <br />
              <em>ordinary days.</em>
            </h2>
          </div>
          {STRIP.map((s, n) => {
            const piece = s.piece ? PIECES[indexOf(s.piece)] : null;
            return (
              <figure key={s.image} className="st-card">
                <div
                  className="st-pic"
                  ref={(el) => {
                    picsRef.current[n] = el;
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(s.image)} alt={s.caption} loading="lazy" draggable={false} />
                </div>
                <figcaption>
                  <span>{pad2(n + 1)}</span>
                  <em>{s.caption}</em>
                  {piece && (
                    <button
                      type="button"
                      onClick={(e) =>
                        onView(indexOf(piece.id), e.currentTarget.closest("figure")!.querySelector<HTMLElement>(".st-pic"))
                      }
                    >
                      {piece.name}, {piece.colour} · {money(piece.price)}
                    </button>
                  )}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
