/**
 * Checks every external link and embed in the built site (out/) with a real
 * browser user agent, so hosts that block bots don't produce false alarms.
 *   node scripts/check-links.mjs
 */
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const dir = 'out';
const urls = new Map(); // url -> Set(pages)

for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.html'))) {
  const $ = cheerio.load(fs.readFileSync(path.join(dir, f), 'utf8'));
  $('a[href], iframe[src], video[src], source[src]').each((_, el) => {
    const raw = $(el).attr('href') || $(el).attr('src') || '';
    if (!/^https?:\/\//i.test(raw)) return;
    if (/googletagmanager|gstatic|googleapis/.test(raw)) return; // fonts/analytics
    if (!urls.has(raw)) urls.set(raw, new Set());
    urls.get(raw).add(f);
  });
}

console.log(`checking ${urls.size} external URLs...\n`);
const bad = [];
for (const [url, pages] of urls) {
  let status = 0;
  let note = '';
  try {
    const ctrl = AbortSignal.timeout(20000);
    let r = await fetch(url, { method: 'GET', redirect: 'follow', headers: { 'User-Agent': UA }, signal: ctrl });
    status = r.status;
    if (r.ok) {
      const body = (await r.text()).slice(0, 200000);
      if (/Could not find the requested document|Not Found<\/h2>/i.test(body)) {
        note = 'renders a not-found message';
      }
    }
  } catch (e) {
    note = e.name === 'TimeoutError' ? 'timeout' : e.message.slice(0, 50);
  }
  const ok = status >= 200 && status < 400 && !note;
  if (!ok) bad.push({ url, status: status || '-', note, pages: [...pages].slice(0, 3).join(', ') });
}

if (!bad.length) console.log('all external links OK');
else {
  console.log('PROBLEMS:');
  for (const b of bad) console.log(`  [${b.status}] ${b.note ? b.note + ' — ' : ''}${b.url}\n        on: ${b.pages}`);
}
