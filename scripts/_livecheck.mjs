import puppeteer from 'puppeteer-core';
const SCRATCH = 'C:/Users/hyder/AppData/Local/Temp/claude/C--Users-hyder-Desktop-zahra-hasanaat-unified/f8c4f72e-ad3d-42e9-9e73-020669d7ab89/scratchpad';
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox'],
  defaultViewport: { width: 1280, height: 900 },
});
const BASE = 'https://hmohyud.github.io/zahrahasanaatconsolidation';
for (const path of ['/', '/education.html', '/stories.html']) {
  const page = await browser.newPage();
  const failed = [];
  page.on('requestfailed', (r) => { if (r.resourceType() === 'image') failed.push(r.url() + ' :: ' + r.failure()?.errorText); });
  page.on('response', (r) => { if (r.status() >= 400 && /\.(jpg|jpeg|png|webp|gif)/i.test(r.url())) failed.push(r.url() + ' :: HTTP ' + r.status()); });
  await page.goto(BASE + path, { waitUntil: 'networkidle0', timeout: 90000 });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
  });
  await new Promise((r) => setTimeout(r, 1500));
  const info = await page.evaluate(() => {
    const heroBg = document.querySelector('.hero-bg, .page-hero-bg');
    const cs = heroBg ? getComputedStyle(heroBg).backgroundImage : 'none';
    const brokenImgs = [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0 && i.src).map((i) => i.src);
    return { heroBgCss: cs.slice(0, 160), brokenImgs: brokenImgs.slice(0, 6) };
  });
  console.log('PAGE', path, JSON.stringify({ failedRequests: failed.slice(0, 6), ...info }, null, 1));
  if (path === '/') await page.screenshot({ path: SCRATCH + '/live-home.png' });
  await page.close();
}
await browser.close();
