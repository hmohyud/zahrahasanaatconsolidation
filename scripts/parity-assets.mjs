// Image + internal-link parity between original article and exported page.
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const SKIP = new Set(['index.html', 'stories.html', 'sitemap.html', 'gate.html']);

/* Pages deliberately removed or rewritten after the migration (audited as
   obsolete WordPress demo content or rebuilt as structured contact pages).
   Parity is not expected for these — every OTHER page must still match. */
const INTENTIONAL = new Map([
  ['taqreeb-contact.html', 'deleted: one generic sentence, no contact details'],
  ['taqreeb-faq.html', 'deleted: WordPress demo FAQ (return policy / shipping)'],
  ['taqreeb-portfolio.html', 'deleted: WordPress demo portfolio ("Project Name")'],
  ['story-qjsp-scholarship-application.html', 'deleted: expired 2019 deadline, duplicated'],
  ['story-qjsp-about-homepage.html', 'merged into qjsp-about'],
  ['food.html', 'rebuilt from the 2026 Nutrition & Ration strategy document'],
  ['health.html', 'rebuilt from the 2026 Medical strategy document'],
  ['education.html', 'rebuilt from the 2026 Education strategy document'],
  ['financial.html', 'rebuilt from the 2026 Grants & Livelihoods strategy document'],
  ['centre.html', 'rebuilt from the 2026 Centre Model strategy document'],
  ['about.html', 'rewritten for neutral NGO presentation (Aug 2026 directive)'],
  ['art-wellness-workshop.html', 'copy edits: email fix, Led by, duplicate title removed'],
  ['contribute.html', 'copy edits: literal asterisks removed'],
  ['get-involved.html', 'neutral venue phrasing per Aug 2026 directive'],
  ['qjsp-conferences.html', 'typo fixes + stale line removed'],
  ['qjsp-donate.html', 'spelling and statute-name corrections'],
  ['qjsp-application.html', 'step renumbering and wording fixes'],
  ['qjsp-community-service.html', 'grammar fixes'],
  ['qjsp-higher-education.html', 'grammar fixes, stale placeholder removed'],
  ['qjsp-primary-education.html', 'grammar fixes, stale placeholder removed'],
  ['qjsp-harmony-prize.html', 'nominations section added, honorific framing reduced'],
  ['qjsp-about.html', 'grammar fix'],
  ['apply.html', 'replaced by the centralised application portal (apply.zahrahasanaat.org embed)'],
  ['taqreeb-2016-conference.html', 'stale promise removed'],
  ['qjsp-contact.html', 'rebuilt as a structured contact card'],
  ['connect.html', 'rebuilt: contact card + consolidated buttons'],
  ['interfaith.html', 'related links to the three deleted Taqreeb pages removed'],
  ['taqreeb-stories.html', '"Tell us your story" repointed to connect'],
]);

/* Editorial placeholders removed from the prose ("link link", "PAYPAL CTA",
   the dummy sponsorship row…). Stripped from the ORIGINAL text too so the
   comparison stays word-exact on everything that is real content. */
const PLACEHOLDERS = [
  /(?:Read (?:more )?(?:stories|and see photos)?[^.\r\n]*?)?\blink link\.?/gi,
  /Webinars include link, link\.\s*Camps include\s*link, link\./gi,
  /Read more etc etc\.?/gi,
  /Read more\.\.\./g,
  /Link to camp/gi,
  /PAYPAL CTA/gi,
  /Sponsor\.\.\.\.|\u20b9xxxxx/gi,
];
const stripPlaceholders = (t) => PLACEHOLDERS.reduce((acc, re) => acc.replace(re, ' '), t);

const files = fs.readdirSync('preview').filter((f) => f.endsWith('.html') && !SKIP.has(f));

const norm = (u) =>
  (u || '')
    .replace(/^\/zahrahasanaatconsolidation\//, '')
    .replace(/^\.?\//, '')
    .split('#')[0];
let ok = 0;
let intentional = 0;
const problems = [];
for (const f of files) {
  if (INTENTIONAL.has(f)) { intentional++; continue; }
  const $old = cheerio.load(fs.readFileSync(path.join('preview', f), 'utf8'));
  const $new = cheerio.load(fs.readFileSync(path.join('out', f), 'utf8'));
  const scope = (s, $) => { const el = $(s).first(); el.find('script,style').remove(); return el; };
  const oldArt = scope('article.page-content', $old);
  const newMain = scope('main', $new);

  // cover-block background images were hidden by the old site's own CSS
  // (.wp-block-cover__image-background { display: none !important }) — they
  // were never visible, so they aren't part of the content contract
  oldArt.find('img.wp-block-cover__image-background').remove();
  const oldImgs = new Set(oldArt.find('img').toArray().map((i) => norm($old(i).attr('src'))));
  const newImgs = new Set(newMain.find('img').toArray().map((i) => norm($new(i).attr('src'))));
  const missingImgs = [...oldImgs].filter((s) => s && !newImgs.has(s));

  const oldLinks = new Set(oldArt.find('a[href]').toArray().map((a) => norm($old(a).attr('href'))).filter((h) => h && !h.startsWith('javascript')));
  const newLinks = new Set(newMain.find('a[href]').toArray().map((a) => norm($new(a).attr('href'))));
  const missingLinks = [...oldLinks].filter((l) => l && !newLinks.has(l));

  if (!missingImgs.length && !missingLinks.length) ok++;
  else problems.push({ file: f, missingImgs: missingImgs.slice(0, 5), missingLinks: missingLinks.slice(0, 5) });
}
console.log(`${ok}/${files.length - intentional} pages have complete image+link parity `
  + `(${intentional} intentionally removed/rewritten)`);
problems.forEach((p) => console.log(JSON.stringify(p)));
process.exit(problems.length ? 1 : 0);
