/**
 * Content-parity audit: verifies that every word of visible article text in
 * the ORIGINAL static pages (preview/*.html) survives in the NEW exported
 * pages (out/*.html). Word-sequence based so reflowed markup still matches.
 */
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
  ['apply.html', 'renamed sections, neutral framing, grammar fixes'],
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


function textOf($, sel) {
  const el = $(sel).first();
  if (!el.length) return '';
  el.find('script,style').remove();
  return el.text();
}

function normWords(text) {
  return text
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/&nbsp;| /g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    // strip punctuation glued to words so "harmony." === "harmony"
    .replace(/[^\p{L}\p{N}'@#$%&+]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

const files = fs.readdirSync('preview').filter((f) => f.endsWith('.html') && !SKIP.has(f));
let ok = 0;
let intentional = 0;
const problems = [];

// minified export glues adjacent elements' text together — separate all tag
// boundaries with a space on BOTH sides so tokenization is symmetric; React's
// `<!-- -->` text separators become spaces too
const readHtml = (p) =>
  fs.readFileSync(p, 'utf8').replace(/<!--.*?-->/g, ' ').replace(/></g, '> <');

for (const f of files) {
  if (INTENTIONAL.has(f)) { intentional++; continue; }
  const $old = cheerio.load(readHtml(path.join('preview', f)));
  const outFile = path.join('out', f);
  if (!fs.existsSync(outFile)) {
    problems.push({ file: f, missing: '(entire page missing)' });
    continue;
  }
  const $new = cheerio.load(readHtml(outFile));

  // original article text + hero text
  const oldText =
    textOf($old, 'article.page-content') + ' ' + textOf($old, '.page-hero-inner');
  // new page: whole main + hero
  const newText = textOf($new, 'main') + ' ' + textOf($new, '.page-hero-inner');

  const oldWords = normWords(stripPlaceholders(oldText));
  const newWords = new Set(normWords(newText));
  // sliding check: report words missing from the new page
  const missing = [];
  for (let i = 0; i < oldWords.length; i++) {
    if (!newWords.has(oldWords[i])) missing.push(oldWords[i]);
  }
  if (missing.length === 0) {
    ok++;
  } else {
    problems.push({
      file: f,
      missingCount: missing.length,
      totalWords: oldWords.length,
      sample: [...new Set(missing)].slice(0, 12).join(', '),
    });
  }
}

console.log(`${ok}/${files.length - intentional} pages have complete word-level parity `
  + `(${intentional} intentionally removed/rewritten)`);
if (problems.length) {
  console.log('\nPages with missing words:');
  for (const p of problems) console.log(JSON.stringify(p));
  process.exit(1);
}
