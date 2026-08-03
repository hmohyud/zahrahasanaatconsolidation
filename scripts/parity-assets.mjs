// Image + internal-link parity between original article and exported page.
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const SKIP = new Set(['index.html', 'stories.html', 'sitemap.html', 'gate.html']);
const files = fs.readdirSync('preview').filter((f) => f.endsWith('.html') && !SKIP.has(f));

const norm = (u) =>
  (u || '')
    .replace(/^\/zahrahasanaatconsolidation\//, '')
    .replace(/^\.?\//, '')
    .split('#')[0];
let ok = 0;
const problems = [];
for (const f of files) {
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
console.log(`${ok}/${files.length} pages have complete image+link parity`);
problems.forEach((p) => console.log(JSON.stringify(p)));
process.exit(problems.length ? 1 : 0);
