import puppeteer from 'puppeteer-core';
const SCRATCH = 'C:/Users/hyder/AppData/Local/Temp/claude/C--Users-hyder-Desktop-zahra-hasanaat-unified/f8c4f72e-ad3d-42e9-9e73-020669d7ab89/scratchpad';
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox'],
});
for (const [w, h] of [[1440, 900], [1280, 720], [1024, 768], [900, 680], [375, 812]]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0', timeout: 90000 });
  const m = await page.evaluate(() => {
    const cue = document.querySelector('.hero-scroll');
    if (!cue || getComputedStyle(cue).display === 'none') return { cue: 'hidden' };
    const cr = cue.getBoundingClientRect();
    const btns = document.querySelector('.hero .btn-group');
    const br = btns.getBoundingClientRect();
    const hero = document.querySelector('.hero').getBoundingClientRect();
    const inset = parseFloat(getComputedStyle(document.querySelector('.hero'), '::after').top);
    return {
      btnToCueGap: Math.round(cr.top - br.bottom),
      cueToFrameGap: Math.round(hero.bottom - inset - cr.bottom),
    };
  });
  console.log(w + 'x' + h, JSON.stringify(m));
  await page.close();
}
await browser.close();
