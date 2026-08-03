# Connecting the CMS (one-time, ~10 minutes)

The site is fully built for **TinaCMS visual editing** — the editor where the
real site loads in the browser, you click a section, and watch it update live
as you type. Everything is wired up except one step only you can do: creating
the (free) Tina Cloud account that handles editor logins.

## Why this step exists

Tina Cloud is the small hosted service that signs editors in and writes their
changes to this GitHub repo. The **free plan includes 2 editor accounts**
(site visitors and direct GitHub edits don't count). Two people can share one
login if needed — the limit is on how many accounts exist, not who uses them.

## Steps

1. **Create the account** — go to https://app.tina.io and sign up (free plan),
   signing in with the GitHub account that owns this repo.
2. **Create a project** — choose your repo
   (`hmohyud/zahrahasanaatconsolidation`), branch `main`.
3. **Copy the two credentials** from the project's *Overview* page:
   - **Client ID**
   - **Read-only token** (under *Tokens*)
4. **Add them as GitHub secrets** — in the repo go to
   *Settings → Secrets and variables → Actions → New repository secret* and add:
   - `TINA_CLIENT_ID` = the Client ID
   - `TINA_TOKEN` = the token
5. **Re-run the deploy** — push any commit, or *Actions → Deploy site to
   GitHub Pages → Run workflow*. The build detects the secrets and now also
   builds the editor.

## After that

- The editor lives at
  **https://hmohyud.github.io/zahrahasanaatconsolidation/admin/index.html** —
  log in with GitHub, pick a page, edit with a live preview, hit Save.
  Every save commits to this repo and redeploys automatically (~2 min).
- **New pages/stories:** each collection (Pages, Stories) has a "Create New"
  button. New stories appear on the Stories index and Site Index automatically;
  to add a page to the menus, edit *Site settings (nav & footer)* in the CMS.
- **Adding a second editor:** invite them from app.tina.io (Project →
  Collaborators). They also need read access to nothing else — Tina handles
  the repo writes.

## Editing locally (no cloud account needed)

Developers can run the full visual editor against the local files:

```bash
npm install
npm run dev
```

Then open http://localhost:3001/admin/index.html — same editor, no login,
saves write straight to the working directory.
