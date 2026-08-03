/**
 * One-time migration: preview/*.html → content/pages/*.mdx + content/stories/*.mdx
 *
 * Extracts each page's hero fields into frontmatter and converts the
 * page-content article into Tina-flavoured MDX. WordPress-remnant junk that
 * caused broken layouts (dead spacers, empty wrappers, half-empty media-text
 * grids, inline black/white styling) is normalised structurally — but ALL
 * human-readable text is preserved verbatim, including original placeholder
 * text (explicit user decision).
 */
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import matter from 'gray-matter';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'preview');
const OUT_PAGES = path.join(ROOT, 'content', 'pages');
const OUT_STORIES = path.join(ROOT, 'content', 'stories');
const SKIP = new Set(['index.html', 'stories.html', 'sitemap.html', 'gate.html']);

fs.mkdirSync(OUT_PAGES, { recursive: true });
fs.mkdirSync(OUT_STORIES, { recursive: true });

/* ---------------- turndown setup ---------------- */
const TOKENS = new Map();
let tokenId = 0;
/**
 * Registers an MDX snippet and returns a plain-text placeholder paragraph.
 * Emitted as TEXT (not an empty element) because turndown silently drops
 * blank elements before custom rules get a chance to run.
 */
function token(mdx) {
  const id = `MDXTOKEN${tokenId++}X`;
  TOKENS.set(id, mdx);
  return `\n\n<p>${id}</p>\n\n`;
}
/** Substitute token ids with their MDX, handling tokens nested in tokens. */
function resolveTokens(md) {
  let guard = 0;
  while (/MDXTOKEN\d+X/.test(md) && guard++ < 20) {
    md = md.replace(/MDXTOKEN\d+X/g, (id) => TOKENS.get(id) || '');
  }
  return md;
}

function makeTurndown() {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    bulletListMarker: '-',
  });
  td.use(gfm);
  td.addRule('mdxToken', {
    filter: (node) => node.nodeName === 'DIV' && node.getAttribute('data-mdx-token'),
    replacement: (_c, node) => `\n\n${node.getAttribute('data-mdx-token')}\n\n`,
  });
  // keep line breaks inside paragraphs meaningful
  td.addRule('lineBreak', { filter: 'br', replacement: () => '  \n' });
  // images: drop filename-style alt text
  td.addRule('image', {
    filter: 'img',
    replacement: (_c, node) => {
      const src = node.getAttribute('src') || '';
      if (!src) return '';
      return `![${cleanAlt(node.getAttribute('alt'), src)}](${src})`;
    },
  });
  return td;
}
const td = makeTurndown();

/* ---------------- helpers ---------------- */
const BLANK = /^\s*(?:&nbsp;| |\s)*$/;

function unwrap($, el) {
  const $el = $(el);
  $el.replaceWith($el.contents());
}

/**
 * Wrap bare text nodes (classic-editor output without <p>) into paragraphs.
 * Consecutive inline siblings (text, links, emphasis, inline images) are
 * grouped into ONE paragraph so sentences don't shatter; paragraph breaks
 * happen only at blank lines in the source text or at block elements.
 */
const INLINE_TAGS = new Set(['a', 'strong', 'em', 'b', 'i', 'span', 'sup', 'sub', 'img', 'br', 'u', 'small', 'code']);
function wrapBareText($, container) {
  const out = [];
  let run = '';
  const flush = () => {
    // a run counts if it has visible text OR embedded media (an image-only
    // run has no text once tags are stripped — don't throw the image away)
    const hasMedia = /<(img|iframe|video)\b/i.test(run);
    if (hasMedia || !BLANK.test(run.replace(/<[^>]+>/g, ' '))) out.push(`<p>${run.trim()}</p>`);
    run = '';
  };
  for (const node of $(container).contents().toArray()) {
    if (node.type === 'text') {
      const parts = (node.data || '').split(/\n\s*\n/);
      parts.forEach((part, i) => {
        if (i > 0) flush();
        run += part;
      });
    } else if (node.type === 'tag' && INLINE_TAGS.has(node.name)) {
      run += $.html(node);
    } else {
      flush();
      out.push($.html(node));
    }
  }
  flush();
  $(container).html(out.join('\n'));
}

/** Convert an element's inner content to markdown/MDX (recursive pipeline). */
function innerToMdx($, el) {
  const html = $(el).html() || '';
  const $inner = cheerio.load(`<div id="__root">${html}</div>`, null, false);
  transform($inner, $inner('#__root'));
  const md = td.turndown($inner('#__root').html() || '');
  return md.trim();
}

function esc(v) {
  return String(v ?? '').replace(/"/g, '&quot;');
}

/**
 * Drop alt text that is just the image's filename (WordPress default) —
 * "Asset 3 5", "IMG_0841", etc. It reads as junk under lightboxed images
 * and is worthless for accessibility. Real descriptive alts are kept.
 */
function cleanAlt(alt, src) {
  if (!alt) return '';
  const base = String(src || '').split('/').pop().replace(/\.\w+$/, '');
  const norm = (s) =>
    String(s)
      .toLowerCase()
      .replace(/e\d{8,}/g, '')
      .replace(/\d+x\d+/g, '')
      .replace(/scaled|edited|copy/g, '')
      .replace(/[^a-z]/g, '');
  const a = norm(alt);
  const b = norm(base);
  if (!a) return '';
  if (a === b) return '';
  if (b.length >= 4 && (b.includes(a) || a.includes(b))) return '';
  if (/^(asset|img|image|dsc|mg|photo|screenshot|untitled|banner|logo)$/.test(a)) return '';
  return alt;
}

/* ---------------- the main structural transform ---------------- */
function transform($, root) {
  const R = (sel) => root.find(sel).toArray();

  // 0. junk removal
  R('.wp-block-spacer').forEach((el) => $(el).remove());
  R('script, style').forEach((el) => $(el).remove());

  // 1. leftover embedded WordPress theme footer (qjsp-conferences) — keep its text
  R('footer.site-footer').forEach((el) => {
    const text = $(el).text().trim();
    $(el).replaceWith(text ? `<p><em>${text}</em></p>` : '');
  });

  // 2. page-builder & theme wrappers: unwrap until none remain
  const WRAPPERS =
    'div[class^="fl-"], div[class*=" fl-"], div.site-content, div.content-area, ' +
    'article.post, article[id^="post-"], div.entry-content, div.page-content, main.site-main';
  let guard = 0;
  while (root.find(WRAPPERS).length && guard++ < 60) {
    root.find(WRAPPERS).each((_, el) => unwrap($, el));
  }

  // 2b. figure captions → italic paragraphs after the outermost figure
  // (turndown and the Gallery emission both lose <figcaption> otherwise —
  // captions are visible text and must survive)
  {
    const perFigure = new Map(); // outermost figure element -> [captions in order]
    R('figcaption').forEach((el) => {
      const cap = $(el).text().trim();
      let top = $(el).closest('figure');
      let parentFig = top.parent().closest('figure');
      let hops = 0;
      while (parentFig.length && hops++ < 5) {
        top = parentFig;
        parentFig = top.parent().closest('figure');
      }
      if (cap && top.length) {
        const key = top.get(0);
        if (!perFigure.has(key)) perFigure.set(key, []);
        perFigure.get(key).push(cap);
      }
      $(el).remove();
    });
    for (const [fig, caps] of perFigure) {
      $(fig).after(caps.map((c) => `<p><em>${c}</em></p>`).join('\n'));
    }
  }

  // 2c. blockquote <cite> → line-broken "— attribution" INSIDE the quote's
  // last paragraph (TinaMarkdown flattens paragraphs inside blockquotes, so a
  // separate paragraph would glue onto the quote text; an explicit <br> keeps
  // the attribution on its own line)
  R('blockquote cite').forEach((el) => {
    const t = $(el).text().trim().replace(/^[—–-]\s*/, '');
    const bq = $(el).closest('blockquote');
    $(el).remove();
    const lastP = bq.find('p').last();
    if (lastP.length) lastP.append(`<br>— ${t}`);
    else bq.append(`<p>— ${t}</p>`);
  });

  // 3. verse blocks misused for prose → paragraphs (preserve line groups)
  R('pre.wp-block-verse').forEach((el) => {
    const text = $(el).text().trim();
    const parts = text.split(/\n\s*\n/).map((p) => `<p>${p.trim()}</p>`);
    $(el).replaceWith(parts.join('\n'));
  });

  // 4. media-text: with media → MediaText token; without media → unwrap content
  R('.wp-block-media-text').forEach((el) => {
    const $el = $(el);
    const img = $el.find('img').first();
    const content = $el.find('.wp-block-media-text__content').first();
    const inner = content.length ? content : $el;
    if (img.length) {
      const right = ($el.attr('class') || '').includes('has-media-on-the-right');
      const childMd = innerToMdx($, inner);
      const mdx = `<MediaText image="${esc(img.attr('src'))}" alt="${esc(cleanAlt(img.attr('alt'), img.attr('src')))}"${right ? ' mediaRight={true}' : ''}>\n${childMd}\n</MediaText>`;
      $el.replaceWith(token(mdx));
    } else {
      $el.replaceWith(inner.html() || '');
    }
  });

  // 5. cover blocks → CoverCard token (empty covers dropped)
  R('.wp-block-cover').forEach((el) => {
    const $el = $(el);
    const inner = $el.find('.wp-block-cover__inner-container').first();
    if (!inner.length || BLANK.test(inner.text())) {
      $el.remove();
      return;
    }
    const childMd = innerToMdx($, inner);
    const mdx = `<CoverCard>\n${childMd}\n</CoverCard>`;
    $el.replaceWith(token(mdx));
  });

  // 6. columns: colored columns → CoverCards; empty → drop; else unwrap
  R('.wp-block-columns').forEach((el) => {
    const $el = $(el);
    if (BLANK.test($el.text()) && !$el.find('img, iframe, video').length) {
      $el.remove();
      return;
    }
    const cols = $el.find('> .wp-block-column').toArray();
    const colored = cols.filter((c) => ($(c).attr('class') || '').includes('has-background'));
    if (cols.length && colored.length === cols.length) {
      const cards = cols
        .filter((c) => !BLANK.test($(c).text()))
        .map((c) => `<CoverCard>\n${innerToMdx($, c)}\n</CoverCard>`)
        .join('\n\n');
      $el.replaceWith(token(cards));
    }
  });
  // remaining (mixed/plain) columns: unwrap
  guard = 0;
  while (root.find('.wp-block-columns, .wp-block-column').length && guard++ < 40) {
    root.find('.wp-block-columns, .wp-block-column').each((_, el) => {
      if (BLANK.test($(el).text()) && !$(el).find('img, iframe, video').length) $(el).remove();
      else unwrap($, el);
    });
  }

  // 7. groups → unwrap (drops inline white-slab backgrounds, keeps content)
  guard = 0;
  while (root.find('.wp-block-group').length && guard++ < 40) {
    root.find('.wp-block-group').each((_, el) => unwrap($, el));
  }

  // 8. buttons → ButtonRow token
  R('.wp-block-buttons').forEach((el) => {
    const $el = $(el);
    const links = $el
      .find('a')
      .toArray()
      .map((a) => `[${$(a).text().trim()}](${$(a).attr('href') || '#'})`)
      .filter((s) => s !== '[](#)');
    if (!links.length) {
      $el.remove();
      return;
    }
    const mdx = `<ButtonRow>\n${links.join(' ')}\n</ButtonRow>`;
    $el.replaceWith(token(mdx));
  });

  // 9. galleries → Gallery token
  R('.img-gallery, .wp-block-gallery').forEach((el) => {
    const $el = $(el);
    const imgs = $el
      .find('img')
      .toArray()
      .map((im) => `![${esc(cleanAlt($(im).attr('alt'), $(im).attr('src')))}](${$(im).attr('src')})`);
    if (!imgs.length) {
      $el.remove();
      return;
    }
    const mdx = `<Gallery>\n${imgs.join('\n\n')}\n</Gallery>`;
    $el.replaceWith(token(mdx));
  });

  // 10. videos & iframes → VideoFile / Embed tokens
  R('video').forEach((el) => {
    const $el = $(el);
    const src = $el.attr('src') || $el.find('source').attr('src') || '';
    const poster = $el.attr('poster');
    const mdx = `<VideoFile src="${esc(src)}"${poster ? ` poster="${esc(poster)}"` : ''} />`;
    const fig = $el.closest('figure');
    (fig.length ? fig : $el).replaceWith(token(mdx));
  });
  R('iframe').forEach((el) => {
    const $el = $(el);
    const src = $el.attr('src') || '';
    const url = src.startsWith('//') ? `https:${src}` : src;
    const w = parseFloat($el.attr('width')) || 0;
    const h = parseFloat($el.attr('height')) || 0;
    const style = $el.attr('style') || '';
    const sw = /width:\s*([\d.]+)px/.exec(style)?.[1];
    const sh = /height:\s*([\d.]+)px/.exec(style)?.[1];
    const W = parseFloat(sw) || w;
    const H = parseFloat(sh) || h;
    const aspect = W && H ? Math.round((H / W) * 10000) / 100 : null;
    const title = $el.attr('title') || 'Embedded content';
    const mdx = `<Embed url="${esc(url)}" title="${esc(title)}"${aspect && Math.abs(aspect - 56.25) > 2 ? ` aspect={${aspect}}` : ''} />`;
    const wrapper = $el.closest('.video-embed, .video-figure, figure');
    (wrapper.length ? wrapper : $el).replaceWith(token(mdx));
  });

  // 10a2. collage grouping: runs of 2+ consecutive standalone images
  // (bare <img>, image-only <p>, or caption-less <figure>) become one
  // <Gallery> block instead of a clumsy stack of full-width photos
  {
    const isImageOnly = (node) => {
      if (node.type !== 'tag') return false;
      const $n = $(node);
      if (node.name === 'img') return true;
      if ((node.name === 'p' || node.name === 'figure') && $n.find('img').length >= 1) {
        return BLANK.test($n.text()) && !$n.find('iframe, video, a').length;
      }
      return false;
    };
    const isBlankText = (node) => node.type === 'text' && BLANK.test(node.data || '');
    const kids = root.contents().toArray();
    let run = [];
    const flushRun = () => {
      if (run.length >= 2) {
        const imgs = run.flatMap((n) => {
          const el = $(n);
          const list = n.name === 'img' ? [n] : el.find('img').toArray();
          return list.map((im) => `![${esc(cleanAlt($(im).attr('alt'), $(im).attr('src')))}](${$(im).attr('src')})`);
        });
        const mdx = `<Gallery>\n${imgs.join('\n\n')}\n</Gallery>`;
        $(run[0]).before(token(mdx));
        run.forEach((n) => $(n).remove());
      }
      run = [];
    };
    for (const node of kids) {
      if (isImageOnly(node)) run.push(node);
      else if (isBlankText(node) && run.length) continue; // whitespace between images
      else flushRun();
    }
    flushRun();
  }

  // 10b. collapse nested emphasis (WP exports nest <strong><strong>…) — nested
  // tags turn into broken ****text**** markdown otherwise
  guard = 0;
  while (root.find('strong strong, b strong, strong b, em em, i em, em i').length && guard++ < 10) {
    root.find('strong strong, b strong, strong b, em em, i em, em i').each((_, el) => unwrap($, el));
  }
  // …unwrap punctuation-only emphasis (<strong>.</strong> etc. — meaningless
  // styling that produces broken ****/****** runs in markdown)
  R('strong, em, b, i').forEach((el) => {
    if (/^[\s.,:;!?()–—-]{0,3}$/.test($(el).text())) unwrap($, el);
  });
  // …and merge ADJACENT sibling emphasis (<strong>A</strong><strong>B</strong>
  // renders as one continuous bold run; as markdown it becomes broken ****)
  guard = 0;
  let merged = true;
  while (merged && guard++ < 20) {
    merged = false;
    for (const el of root.find('strong, em').toArray()) {
      const next = el.nextSibling;
      if (next && next.type === 'tag' && next.name === el.name) {
        // inline emphasis holds no blocks — collapse whitespace so the merged
        // run can't break across markdown lines
        $(el).append($(next).html() || '');
        $(el).html(($(el).html() || '').replace(/\s+/g, ' '));
        $(next).remove();
        merged = true;
        break;
      }
    }
  }

  // 10c. headerless tables → GFM pipe tables (raw <table> HTML would break MDX)
  R('table').forEach((el) => {
    const $el = $(el);
    if ($el.find('th').length) return; // gfm plugin handles these
    const rows = $el
      .find('tr')
      .toArray()
      .map((tr) =>
        $(tr)
          .find('td')
          .toArray()
          .map((c) => $(c).text().trim().replace(/\|/g, '\\|').replace(/\s+/g, ' ')),
      )
      .filter((r) => r.length);
    if (!rows.length) {
      $el.remove();
      return;
    }
    const width = Math.max(...rows.map((r) => r.length));
    const line = (cells) => `| ${Array.from({ length: width }, (_, i) => cells[i] || '').join(' | ')} |`;
    const md = [line(rows[0]), `|${' --- |'.repeat(width)}`, ...rows.slice(1).map(line)].join('\n');
    $el.replaceWith(token(md));
  });

  // 11. content h5/h6 (theme styles h5 as a tiny eyebrow — was never a real heading)
  R('h5, h6').forEach((el) => {
    const $el = $(el);
    $el.replaceWith(`<h4>${$el.html()}</h4>`);
  });

  // 12. unwrap sup/sub (keep text), drop empty paragraphs
  R('sup, sub').forEach((el) => unwrap($, el));
  R('p').forEach((el) => {
    if (BLANK.test($(el).text()) && !$(el).find('img, iframe, video, a').length) $(el).remove();
  });

  // 13. classic-editor bare text → paragraphs
  wrapBareText($, root);
}

/* ---------------- per-file conversion ---------------- */
function convertFile(file) {
  const html = fs.readFileSync(path.join(SRC, file), 'utf8');
  const $ = cheerio.load(html);
  const slug = file.replace(/\.html$/, '');
  const isStory = slug.startsWith('story-');

  // hero fields
  const hero = $('.page-hero').first();
  const eyebrow = hero.find('h5').first().text().trim() || null;
  const title = hero.find('h1').first().text().trim() || slug;
  const heroP = hero.find('.page-hero-inner p').first().text().trim() || null;
  const heroStyle = hero.attr('style') || '';
  const heroImage = /--hero-img:\s*url\(['"]?([^'")]+)['"]?\)/.exec(heroStyle)?.[1] || null;

  // article
  const article = $('article.page-content').first();
  if (!article.length) {
    console.warn(`SKIP (no article): ${file}`);
    return null;
  }

  // story extras + related links (captured, then removed from body)
  const tags = article
    .find('.story-tags .story-tag')
    .toArray()
    .map((el) => $(el).text().trim());
  article.find('.story-back, .story-tags').remove();

  // related sections keep their own headings (e.g. "Media Articles About QJSP")
  const related = $('.related')
    .toArray()
    .map((sec) => ({
      title: $(sec).find('.related-title').first().text().trim() || 'Explore further',
      links: $(sec)
        .find('.related-links a')
        .toArray()
        .map((el) => ({ label: $(el).text().trim(), href: $(el).attr('href') || '#' })),
    }))
    .filter((s) => s.links.length);
  $('.related').remove();

  // transform + turndown
  transform($, article);
  let md = td.turndown(article.html() || '');

  // resolve tokens (they survive turndown as bare text lines)
  md = resolveTokens(md);

  // canonical image paths: leading slash (what Tina's media manager writes)
  md = md
    .replace(/\]\(assets\/uploads\//g, '](/assets/uploads/')
    .replace(/image="assets\/uploads\//g, 'image="/assets/uploads/')
    .replace(/poster="assets\/uploads\//g, 'poster="/assets/uploads/');

  // tidy: collapse extra blank lines & repeated rules; collapse residual
  // 4+ asterisk runs from exotic em/strong nesting (adjacent cases were
  // already merged in the DOM, so any leftover is an em+strong boundary)
  md = md
    .replace(/\*{4,}/g, '***')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/(\n\s*\*\s*\*\s*\*\s*\n)(\s*\*\s*\*\s*\*\s*\n)+/g, '$1')
    .replace(/(\n---\n)(\s*---\n)+/g, '$1')
    .trim();

  // escape stray `<` in prose (e.g. "<Rs 10,000") — MDX would read it as JSX.
  // Component tags and <https://…>/<mailto:…> autolinks are left intact.
  md = md.replace(
    /<(?!\/?(?:MediaText|CoverCard|Gallery|Embed|VideoFile|ButtonRow)[\s>/])(?!https?:)(?!mailto:)/g,
    '\\<',
  );

  // escape stray MDX-breaking braces outside component tags
  md = md
    .split('\n')
    .map((line) =>
      line.startsWith('<') || line.includes('mediaRight={') || line.includes('aspect={')
        ? line
        : line.replace(/([{}])/g, '\\$1'),
    )
    .join('\n');

  const data = { title };
  if (eyebrow) data.eyebrow = eyebrow;
  if (isStory) {
    if (heroP) data.date = heroP;
    if (tags.length) data.tags = tags;
  } else if (heroP) {
    data.subtitle = heroP;
  }
  if (heroImage) data.heroImage = heroImage.startsWith('assets/') ? `/${heroImage}` : heroImage;
  if (!isStory && related.length) data.related = related;

  const out = matter.stringify(`\n${md}\n`, data);
  const dest = path.join(isStory ? OUT_STORIES : OUT_PAGES, `${slug}.mdx`);
  fs.writeFileSync(dest, out, 'utf8');
  return { slug, isStory, mdLength: md.length };
}

/* ---------------- run ---------------- */
const files = fs
  .readdirSync(SRC)
  .filter((f) => f.endsWith('.html') && !SKIP.has(f));

let pages = 0;
let stories = 0;
const failures = [];
for (const f of files) {
  try {
    const r = convertFile(f);
    if (r) r.isStory ? stories++ : pages++;
  } catch (e) {
    failures.push({ file: f, error: e.message });
  }
}
console.log(`Converted: ${pages} pages, ${stories} stories (${files.length} inputs)`);
if (failures.length) {
  console.error('FAILURES:', JSON.stringify(failures, null, 2));
  process.exit(1);
}
