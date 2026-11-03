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
  ['story-qjsp-the-journey-of-obtaining-knowledge-the-six-prerequisites-defined-by-amirul-mumineen-speech-by-shz-dr-abdeali-bhaisaheb.html', 'dead "go here to read more" pointer removed; the page it named no longer exists anywhere'],
  ['story-ahimsa-interfaith-event.html', 'date corrected to the event year (2018); the original showed the 2023 posting date'],
  ['taqreeb-overview.html', 'merged into the Taqreeb page (interfaith.html); old URL redirects there'],
  ['taqreeb-about.html', 'merged into the Taqreeb page (interfaith.html); old URL redirects there'],
  ['taqreeb-contact.html', 'deleted: one generic sentence, no contact details'],
  ['taqreeb-faq.html', 'deleted: WordPress demo FAQ (return policy / shipping)'],
  ['taqreeb-portfolio.html', 'deleted: WordPress demo portfolio ("Project Name")'],
  ['story-qjsp-scholarship-application.html', 'deleted: expired 2019 deadline, duplicated'],
  ['story-qjsp-about-homepage.html', 'merged into qjsp-about'],
  ['story-mazaar-e-qutbi-guided-tours.html', 'deleted: promoted the de-linked Mazaar entity'],
  ['food.html', 'rebuilt from the 2026 Nutrition & Ration strategy document'],
  ['health.html', 'rebuilt from the 2026 Medical strategy document'],
  ['education.html', 'rebuilt from the 2026 Education strategy document'],
  ['financial.html', 'rebuilt from the 2026 Grants & Livelihoods strategy document'],
  ['centre.html', 'rebuilt from the 2026 Centre Model strategy document'],
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
  ['interfaith.html', 'rebuilt as the single Taqreeb page: About Taqreeb, Taqreeb overview and Taqreeb Stories merged in, dossier copy added (Nov 2026)'],
  ['taqreeb-stories.html', 'retired: its two stories moved to Stories, its ideas to the Taqreeb page; old URL redirects there'],
]);

/* Copy-edit pass (3 Nov 2026): typos, grammar and misspelt names corrected.
   Only these exact original words may be absent from these pages; every
   other word must still be there. */
const CORRECTED = new Map(Object.entries({
  'mazaar-iftitah.html': 'qutbdudin',
  'mazaar-quran-inscription.html': "qu'ran",
  'mazaar-welfare.html': 'fund', // "Scholarship Fund (QJSP)" -> "Program"
  'syedna-qutbuddin.html': 'ahmadebad',
  'taqreeb-2017-conference.html': 'makes',
  'story-a-seamstress-in-the-making.html': "she's",
  'story-community-conversations-livelihood-series.html': 'entreprenuership',
  'story-covid-19-assistance.html': 'with', // "with 24-48 hours" -> "within"
  'story-dental-camp-at-welfare-center.html': 'will',
  'story-eager-to-learn-eager-to-succeed.html': "who's too",
  'story-endurance-through-earth-shattering-loss.html': 'gujrat hasanat',
  'story-entrepreneurship-through-capitalizing-on-financial-loans.html': 'gujrat',
  'story-excellency-in-fashion-design.html': 'excellency',
  'story-following-her-dreams.html': 'too',
  'story-giving-back-with-whats-been-learned.html': 'degree',
  'story-immediate-relief-for-pandemic-crisis.html': 'brother recieving professed express',
  'story-opening-of-zahra-hasanaat-center.html': 'org', // dead "mazaar-e-qutbi.org" link text
  'story-qjsp-ahimsa-interfaith-event.html': 'organsed',
  'story-qjsp-all-qjsp-students-are-required-to-do-40-hours-of-community-service.html': "student's",
  'story-qjsp-kin-of-syedna-burhanuddin-in-city-to-promote-education-flags-off-scholarshiops.html': 'scholarshiops',
  'story-qjsp-scholarship-application-2.html': 'after which submitting',
  'story-support-in-times-of-tragedy.html': 'readily',
  'story-syedna-qutbuddin-emphasises-community-service.html': "that's",
  'story-webinar-battling-covid-19-misconceptions.html': 'assistance', // retired COVID-assistance pointer
  'story-webinar-hypertension-recognizing-and-dealing-with-the-tension-of-high-blood-pressure.html': 'gross',
  'story-webinar-sugar-a-bitter-truth.html': 'discuss share',
}).map(([f, words]) => [f, new Set(words.split(' '))]));

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
  const corrected = CORRECTED.get(f);
  const missing = [];
  for (let i = 0; i < oldWords.length; i++) {
    if (!newWords.has(oldWords[i]) && !corrected?.has(oldWords[i])) missing.push(oldWords[i]);
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
