# Architecture
- `app/layout.tsx` — head metadata, original next/font module class names on `<html>` so the copied CSS variables resolve; font preloads.
- `app/hale.css` — the original compiled stylesheet, verbatim (Tailwind v4 layers + unlayered component CSS), font URLs rewritten to `/fonts/`.
- `app/page.tsx` → `components/Store.tsx` (client): header, sections, lookbook, promises, product viewer state, bag drawer.
- `components/` — one file per original component: `Rail` (3D scroll rack), `Viewer` (product dialog with turn/size/add), `TryOn`, `Timeline` (tile-grid street reveal), `Zoom` (HALE mask zoom), `Strip` (horizontal scroll), `FooterRail` (swinging hangers, newsletter, footer), `useScrollProgress` (rAF + IntersectionObserver driver).
- `lib/data.ts` — typed content and math helpers copied from the original bundle.
