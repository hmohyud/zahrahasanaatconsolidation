# Zahra Hasanaat — Consolidated Site

A single website consolidating the content of four organisations — Zahra
Hasanaat, the Qutbi Jubilee Scholarship Program (QJSP), Taqreeb, and
Mazaar-e-Qutbi — with a museum-style editorial design, fully editable through
a CMS.

## Live site

**https://hmohyud.github.io/zahrahasanaatconsolidation/**

Published with GitHub Pages by [.github/workflows/pages.yml](.github/workflows/pages.yml)
on every push to `main`.

## How it works

| Piece | Where |
| --- | --- |
| Content (what editors change) | `content/pages/*.mdx`, `content/stories/*.mdx`, `content/settings/*.json` |
| Design & templates | `styles/globals.css`, `components/`, `pages/` (Next.js) |
| CMS schema | `tina/` (TinaCMS) |
| Media | `public/assets/uploads/` |
| Deploy | GitHub Actions → static export (`out/`) → GitHub Pages |

The site is a **Next.js static export** — no server anywhere. Every page keeps
its original `page-name.html` URL. All pages carry a `noindex` robots meta.

## Editing content

- **CMS (recommended):** see [TINA-SETUP.md](TINA-SETUP.md) for the one-time
  Tina Cloud connection, then edit at `/admin/index.html` on the live site —
  visual editing with a live preview; new pages and stories from the UI.
- **Locally:** `npm install && npm run dev` → http://localhost:3001
  (site) and http://localhost:3001/admin/index.html (editor, no login needed
  locally). Content saves land in `content/` as plain files.

## Developing

```bash
npm install
npm run dev        # dev server + local CMS at :3001
npm run build      # static export to out/
```

Useful scripts:

- `node scripts/parity.mjs` / `parity-assets.mjs` — verify the exported site
  still contains every word/image/link of the original static site (kept
  locally in `preview/`, not tracked in the repo).
- `node scripts/validate-mdx.mjs` — parse-check all content files.
- `node scripts/convert.mjs` — the one-time WordPress→MDX migration
  (regenerates `content/` from `preview/`; do not run after editors have
  made CMS changes or they will be overwritten).

## Notes

- The optional two-password gate (`public/gate.html`) remains disabled.
- Original WordPress placeholder text (e.g. the Taqreeb FAQ/portfolio demo
  copy) is preserved verbatim by explicit decision — edit it via the CMS
  whenever real copy is ready.
