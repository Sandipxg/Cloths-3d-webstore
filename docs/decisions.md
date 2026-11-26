# Decisions
1. **Reuse the original compiled CSS verbatim** instead of re-authoring it in Tailwind — guarantees identical cascade-layer order, tokens, fallback font metrics and media queries.
2. **Port the original component logic 1:1** (same constants, easing, rAF loops, GSAP timelines) from the de-minified bundle, renamed for readability.
3. **Self-host fonts** with the original woff2 files and @font-face rules (no next/font) so metrics and `size-adjust` match exactly.
4. Served at `/` instead of `/demo/hale`; image paths become `/img/*`.
5. No tests, no extras (client-prototype preference).
6. `suppressHydrationWarning` on the newsletter email input — browser extensions (e.g. Temp Mail) inject attributes into email fields before hydration; scoped to that one element only.
