# QA report — desktop (1440×900, Chromium headless), 2026-11-26

## Geometry (original vs clone)
- scrollHeight: 20090 / 20090. No horizontal overflow on either.
- All 11 section boxes (header, rk, to, tl, lb, zm, st, pr, footer, fr, fd) and 23 child boxes match within 0 px.

## Visual (pixel diff, threshold 0.1, 16 scroll stops)
- 13/16 frames: 0.00 %.
- 15 % (rail), 42 % (try-on), 96 % (footer rail): 0.23–0.50 %, all on garments that are mid-motion (scroll easing / clock-driven sway) at capture time. Not a layout difference.

## Behaviour (same script on both)
Open from rail → "Pick a size first" warning → pick M → add (bag = 1) → Back view → ArrowRight to Overshirt → Escape → rail follows to 02 → bag shows "Hoodie Oat · Size M · $120", "$130 away from free shipping". Identical output; no console errors.

## Head
Title, description, theme-color, icon, apple-touch-icon identical. Only difference: original has an empty `next-size-adjust` meta (next/font artefact, no effect).

## Not checked
- Mobile (390×844 / touch) — out of scope this pass; mobile CSS and phone-mode JS are carried over but unverified.
- Reduced-motion mode, hover tag on rail, footer brush interaction (code ported 1:1, not measured).

## Code health
`pnpm build` and `pnpm lint` clean.
