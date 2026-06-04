# Zahra Hasanaat — Consolidated Site

A single static website consolidating the content of four organisations —
Zahra Hasanaat, the Qutbi Jubilee Scholarship Program (QJSP), Taqreeb, and
Mazaar‑e‑Qutbi — into one mobile‑first site.

## Live site

Published with **GitHub Pages** from the [`preview/`](preview/) folder:

**https://hmohyud.github.io/zahrahasanaatconsolidation/**

## How it's hosted

`preview/` is a fully self‑contained static site (HTML, CSS, JS, and images —
no build step or server needed). The workflow in
[`.github/workflows/pages.yml`](.github/workflows/pages.yml) publishes that
folder to GitHub Pages on every push to `main`.

To run it locally, serve the `preview/` folder with any static file server, e.g.:

```bash
npx serve preview
```

## Notes

- The site uses only relative links, so it works under the GitHub Pages project
  subpath.
- An optional two‑password access gate (`preview/gate.html`) is included but
  disabled for the public deployment.
