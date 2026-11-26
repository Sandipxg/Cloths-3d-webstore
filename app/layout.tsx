import type { Metadata, Viewport } from "next";
import "./hale.css";

// The original's next/font module classes are kept so the copied stylesheet's
// font variables (--font-sans / --font-serif / --font-mono) apply 1:1.
const fontClasses = [
  "inter_tight_fb049bb-module__7WklCq__variable",
  "instrument_serif_8c4ab588-module__AuOkkq__variable",
  "dm_mono_1a268523-module__YdnL8W__variable",
].join(" ");

const preloadFonts = [
  "36363bfb06833f56-s.p.38hmww4cj4vme.woff2",
  "7ebf22b5a21034f8-s.p.3j3877k49yy0l.woff2",
  "a73419dd2ba2d841-s.p.2yee423r7ahpo.woff2",
  "ab57efd000576a30-s.p.3fofz6dws3mg0.woff2",
  "e41d5df559864f9e-s.p.1g73gv09-xcb6.woff2",
];

export const metadata: Metadata = {
  title: "HALE — The Autumn Rail",
  description:
    "A clothing store on a hanging rail: drag the rail, take a piece off, turn it around, pick a size and add it to the bag. A SmartDuke Studio template.",
  icons: { icon: { url: "/fav-sd.png", type: "image/png" }, apple: "/fav-sd.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ebe7e0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontClasses}>
      <head>
        {preloadFonts.map((f) => (
          <link key={f} rel="preload" href={`/fonts/${f}`} as="font" type="font/woff2" crossOrigin="" />
        ))}
      </head>
      <body>{children}</body>
    </html>
  );
}
