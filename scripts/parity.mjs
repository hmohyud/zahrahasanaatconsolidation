/**
 * Content-parity audit: verifies that every word of visible article text in
 * the ORIGINAL static pages (preview/*.html) survives in the NEW exported
 * pages (out/*.html). Word-sequence based so reflowed markup still matches.
 */
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const SKIP = new Set(['index.html', 'stories.html', 'sitemap.html', 'gate.html']);

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
const problems = [];

// minified export glues adjacent elements' text together — separate all tag
// boundaries with a space on BOTH sides so tokenization is symmetric; React's
// `<!-- -->` text separators become spaces too
const readHtml = (p) =>
  fs.readFileSync(p, 'utf8').replace(/<!--.*?-->/g, ' ').replace(/></g, '> <');

for (const f of files) {
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

  const oldWords = normWords(oldText);
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

console.log(`${ok}/${files.length} pages have complete word-level parity`);
if (problems.length) {
  console.log('\nPages with missing words:');
  for (const p of problems) console.log(JSON.stringify(p));
  process.exit(1);
}
