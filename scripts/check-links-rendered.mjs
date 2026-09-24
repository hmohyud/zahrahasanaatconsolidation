/**
 * Browser-rendered link check.   node scripts/check-links-rendered.mjs <outDir>
 *
 * check-links.mjs fetches each URL, which cannot see failures that only exist
 * after JavaScript runs. It passed a dead Issuu document (HTTP 200, the book's
 * cached title in the HTML, a viewer that spins forever), six removed Facebook
 * videos, and a Google Apps Script form whose runtime Google has shut down.
 * This renders every external link in Chrome and reads what a visitor sees.
 *
 * Embeds are checked through what they embed: a YouTube /embed/ URL loaded on
 * its own always shows "Error 153" (there is no host page), so it is resolved
 * to its watch URL; a Facebook plugin URL is resolved to the video it wraps.
 * Facebook's optional-cookie wall is declined so the page beneath renders.
 *
 * Still needs a human for: login-walled links (LinkedIn, Facebook events),
 * which render a sign-in page whether or not the target exists.
 */
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-core';

const OUT = process.argv[2] || '.';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';

const BAD = /page not found|not be found|could not find|couldn.t find|doesn.t exist|does not exist|no longer (available|exists)|has been (removed|deleted)|content isn.t available|this page isn.t available|execution failed|error occurred|something went wrong|video unavailable/i;

// what a visitor would really land on for this href
function resolveTarget(url) {
  const yt = url.match(/youtube\.com\/embed\/([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/watch?v=${yt[1]}`;
  const fb = url.match(/facebook\.com\/plugins\/video\.php\?[^#]*?href=([^&]+)/);
  if (fb) return decodeURIComponent(fb[1]);
  return url;
}

const urls = new Map();
for (const f of fs.readdirSync('out').filter((f) => f.endsWith('.html'))) {
  const $ = cheerio.load(fs.readFileSync(path.join('out', f), 'utf8'));
  $('main a[href], main iframe[src]').each((_, el) => {
    const u = $(el).attr('href') || $(el).attr('src') || '';
    if (!/^https?:\/\//i.test(u) || /googletagmanager|gstatic|googleapis/.test(u)) return;
    if (!urls.has(u)) urls.set(u, new Set());
    urls.get(u).add(f.replace('.html', ''));
  });
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const rows = [];
for (const [url, pages] of urls) {
  const target = resolveTarget(url);
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setViewport({ width: 1280, height: 800 });
  let status = 0, final = '', title = '', text = '', err = '';
  try {
    const r = await page.goto(target, { waitUntil: 'networkidle2', timeout: 30000 });
    status = r ? r.status() : 0;
    await new Promise((res) => setTimeout(res, 2500));
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('div[role=button],button,span')]
        .find((e) => /decline optional cookies/i.test(e.textContent || ''));
      if (b) b.click();
    });
    await new Promise((res) => setTimeout(res, 2500));
    final = page.url();
    title = (await page.title()).slice(0, 90);
    text = await page.evaluate(() => (document.body?.innerText || '').replace(/\s+/g, ' ').trim());
  } catch (e) {
    err = e.message.slice(0, 80);
  }
  const redirectedHome = !!final && new URL(final).pathname.replace(/\/$/, '') === ''
    && new URL(target).pathname.replace(/\/$/, '') !== '';
  const hit = (title + ' ' + text.slice(0, 4000)).match(BAD);
  rows.push({ url, checkedVia: target === url ? '' : target, pages: [...pages].join(', '),
    status, final, title, badPhrase: hit ? hit[0] : '', redirectedHome, err });
  await page.close();
  process.stdout.write('.');
}
await browser.close();

fs.writeFileSync(path.join(OUT, 'links-rendered.json'), JSON.stringify(rows, null, 1));
const broken = rows.filter((r) => r.err || r.status >= 400 || r.badPhrase || r.redirectedHome);
console.log(`\nrendered ${rows.length} external links; ${broken.length} look broken to a visitor:`);
for (const r of broken) {
  const why = r.err ? 'failed to load' : r.status >= 400 ? `HTTP ${r.status}`
    : r.badPhrase ? `says "${r.badPhrase}"` : 'bounced to homepage';
  console.log(`  [${why}] ${r.url}\n        on: ${r.pages}`);
}
