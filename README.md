# timglas.app

Site for **[Timglas](https://github.com/nicocantarelli/timglas)** — a local-first, menu-bar time tracker for macOS. Live at [timglas.app](https://timglas.app).

Designed and built by Nicolas Cantarelli.

## What it is

One static HTML file. A full-height dark hero — the two-triangle hourglass mark, the wordmark in Switzer, a live clock ticking local time in Commit Mono — then a full-bleed hourglass photograph and five sections: the premise, what the app does, where the data lives, how it sits in macOS, and status.

- **Zero external requests** — both typefaces are self-hosted woff2 (Switzer Medium/Semibold, Commit Mono Regular converted from OTF); no analytics, no third-party scripts
- **No build step, no framework** — the page is the deployable artifact
- **Adaptive favicon** — the hourglass mark as SVG (dark glyph on light tabs, light on dark) with PNG fallback and a dark-tile `apple-touch-icon`
- **Reduced-motion aware** — the entrance animation respects `prefers-reduced-motion`

## Structure

```
timglas-site/
├── index.html               # The entire site
├── images/hourglass.webp    # Full-bleed brand image
├── favicon.svg / .png       # Hourglass mark
├── apple-touch-icon.png
├── fonts/                   # Self-hosted woff2
├── SWITZER-LICENSE.txt      # ITF Free Font License
└── COMMITMONO-LICENSE.txt   # SIL OFL
```

## Local development

```bash
python3 -m http.server 8080   # font paths are absolute — serve, don't open file://
```

## Deployment

Deployed on Vercel (project `timglas-site`) as a plain static site — no framework preset, no build command.

```bash
vercel deploy --prod
```

`timglas.app` and `www.timglas.app` point at the project from Hostinger DNS (`A @ 76.76.21.21`, `CNAME www cname.vercel-dns.com`); www 308-redirects to the apex. The `.app` TLD is HSTS-preloaded, so the site is HTTPS-only by design.

## Typefaces

- [Switzer](https://www.fontshare.com/fonts/switzer) — Indian Type Foundry, via Fontshare (ITF Free Font License)
- [Commit Mono](https://commitmono.com/) — Eigil Nikolajsen (SIL Open Font License)

Both licenses permit self-hosted web embedding; the license texts ship in this repo.
