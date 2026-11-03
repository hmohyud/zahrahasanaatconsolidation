// Image + internal-link parity between original article and exported page.
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const SKIP = new Set(['index.html', 'stories.html', 'sitemap.html', 'gate.html']);

/* Pages deliberately removed or rewritten after the migration (audited as
   obsolete WordPress demo content or rebuilt as structured contact pages).
   Parity is not expected for these — every OTHER page must still match. */
const INTENTIONAL = new Map([
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

/* Links whose target moved to a verified new home. Parity is about the reader
   still reaching the same thing, so an old URL counts as present when its
   replacement is. Add an entry only after the new URL has been checked. */
const MOVED = new Map([
  // dead links repointed to their verified new homes (checked live 3 Nov 2026)
  ['http://www.fatemidawat.com/news/events/conference-on-taqreeb-organized-by-qjsp.html',
   'https://www.fatemidawat.com/news/events/conference-on-taqreeb-organized-by-qjsp'],
  ['http://www.fatemidawat.com/news/events/shz.-dr.-aziz-bs-meets-dr.-abdul-kalam-%E2%80%93-11th-president-of-india.html',
   'https://www.fatemidawat.com/news/events/shz-dr-aziz-bs-meets-dr-abdul-kalam-11th-president-of-india'],
  ['http://www.fatemidawat.com/reference-materials/sijill-articles/138-taqreeb-bridging-divides-by-finding-the-common-denominator.html',
   'https://www.fatemidawat.com/teachings/respect-all-faiths/taqreeb-bridging-divides-by-finding-the-common-denominator'],
  ['http://www.fatemidawat.com/resources/bayaans/video-excerpts-syedna-fakhruddin-tus-first-press-meet.html',
   'https://www.fatemidawat.com/videos/interviews-and-press-conference/video-excerpts-syedna-fakhruddin-tus-first-press-meet'],
  ['http://www.jnu.ac.in/Conference/',
   'https://www.jnu.ac.in/'],
  ['https://newshindindia.com/news/5157/',
   'https://web.archive.org/web/20240424093436/https://newshindindia.com/news/5157/'],
  ['https://script.google.com/macros/s/AKfycbwwdnSDHzeVe2EfYDUGM879TZJ1s-dHUMeXOgsjEcbMqWqn4rc/exec',
   'https://docs.google.com/forms/d/e/1FAIpQLSfUVWbJqyJdKGRbkAxl0GkFVkGc9CeVPiXra_EIHms6A_FA2Q/viewform'],
  ['https://script.google.com/macros/s/AKfycbxJDcjVqHusfR5QZ9MHAqMBclPiT8RC0aKcwUJ-0vMefrtHWQU/exec',
   'https://docs.google.com/forms/d/e/1FAIpQLSfUVWbJqyJdKGRbkAxl0GkFVkGc9CeVPiXra_EIHms6A_FA2Q/viewform'],
  ['https://script.google.com/macros/s/AKfycbySu6pI0uof-6UBmu-KudWYn6AjSpBFDKLIQngGnvg-Cl3VCKM/exec',
   'https://docs.google.com/forms/d/e/1FAIpQLScd9cHqi1cj8PukBoLS0nRxDwCkVJMNHVF1YMiygoPoTNQXqQ/viewform'],
  ['https://script.google.com/macros/s/AKfycbylgHH5g7wYlXw4vp-2YLADZ8CaUEhK2N222Mcr5QZC8mCpoAY/exec',
   'https://docs.google.com/forms/d/e/1FAIpQLScd9cHqi1cj8PukBoLS0nRxDwCkVJMNHVF1YMiygoPoTNQXqQ/viewform'],
  ['https://www.fatemidawat.com/news/announcements-overview/covid-19-vaccination-message',
   'https://www.fatemidawat.com/news/announcements/covid-19-vaccination-message'],
  ['https://www.fatemidawat.com/news/events/qutbi-jubilee-scholarship-program-%E2%80%9Csyedna-taher-fakhruddin-tus-excellence-in-teaching-awards%E2%80%9D-%E2%80%93-vidyaniketan-school-january-2019.html',
   'https://www.fatemidawat.com/news/events/qutbi-jubilee-scholarship-program-syedna-taher-fakhruddin-tus-excellence-in-teaching-awards-vidyaniketan-school-january-2019'],
  ['https://www.fatemidawat.com/news/media/community/',
   'https://www.thehindu.com/news/cities/Delhi/india-is-a-wonderful-example-of-harmony-and-coexistence/article22321394.ece'],
  ['https://www.fatemidawat.com/watch/bayaans/syedna-taher-fakhruddin-tus-address-world-peace-through-non-violence.html',
   'https://www.fatemidawat.com/videos/interfaith-addresses/syedna-taher-fakhruddin-tus-address-world-peace-through-non-violence'],
  // Issuu account closed (Sept 2026); the book now lives on fatemidawat.com
  ['http://issuu.com/fatemidawat/docs/golden_panorama_final?e=0',
   'https://www.fatemidawat.com/teachings/books/golden-panorama-a-pictorial-commemoration-of-the-life-and-service-of-syedna-mohammed-burhanuddins-esteemed-mazoon-syedna-khuzaima-qutbuddin'],
]);

/* Dead links removed outright: the target is gone and no copy exists anywhere
   (checked 3 Nov 2026). The surrounding words stay; only the link goes. */
const RETIRED = new Set([
  'https://www.fatemidawat.com/connect/covid-19-help',
  'http://www.fatemidawat.com/resources/bayaans/the-journey-of-obtaining-knowledge.html',
]);

/* Internal links repointed on one page only, where the old target was the
   wrong page for that sentence (copy-edit pass, 3 Nov 2026). */
const PAGE_MOVED = new Map(Object.entries({
  // "please visit mazaar-e-qutbi.org" -> the Welfare Center page it meant
  'story-opening-of-zahra-hasanaat-center.html': { 'mazaar.html': 'mazaar-welfare.html' },
  // the QJSP link went to the Education programme page, not QJSP
  'story-syedna-qutbuddin-emphasises-community-service.html': { 'education.html': 'qjsp-about.html' },
}));

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
  const pageMoved = PAGE_MOVED.get(f) || {};
  const missingLinks = [...oldLinks].filter((l) => l && !newLinks.has(l) && !newLinks.has(MOVED.get(l))
    && !newLinks.has(pageMoved[l]) && !RETIRED.has(l));

  if (!missingImgs.length && !missingLinks.length) ok++;
  else problems.push({ file: f, missingImgs: missingImgs.slice(0, 5), missingLinks: missingLinks.slice(0, 5) });
}
console.log(`${ok}/${files.length - intentional} pages have complete image+link parity `
  + `(${intentional} intentionally removed/rewritten)`);
problems.forEach((p) => console.log(JSON.stringify(p)));
process.exit(problems.length ? 1 : 0);
