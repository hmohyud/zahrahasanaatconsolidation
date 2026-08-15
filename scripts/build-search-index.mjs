/**
 * Generates public/search-index.json — the data behind the site's search box.
 * Runs automatically before `next build` (npm "prebuild" hook), so the index
 * can never drift from the content.
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public', 'search-index.json');

/** MDX/markdown -> plain readable text. */
function plain(md) {
  return md
    .replace(/<\/?[A-Z][\w]*[^>]*>/g, ' ') // component tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> label
    .replace(/^\s*\|.*\|\s*$/gm, ' ') // tables
    .replace(/[#>*_`~-]+/g, ' ') // markdown punctuation
    .replace(/\\([<>{}])/g, '$1') // unescape
    .replace(/\s+/g, ' ')
    .trim();
}

const docs = [];

for (const [dir, type] of [
  [path.join(ROOT, 'content', 'pages'), 'Page'],
  [path.join(ROOT, 'content', 'stories'), 'Story'],
]) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const slug = f.replace(/\.mdx$/, '');
    // De-linked entities (kept live at their URLs but no longer part of the
    // Zahra Hasanaat presentation) stay out of search.
    if (/^(mazaar|syedna-)/.test(slug)) continue;
    const { data, content } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
    const text = plain(content);
    docs.push({
      t: data.title || slug, // title
      u: `${slug}.html`, // url
      k: type, // kind
      s: data.subtitle || data.date || '', // sub-line
      x: text.slice(0, 260), // excerpt shown in results
      b: text.slice(0, 4000).toLowerCase(), // body used for matching
    });
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(docs));
console.log(`search index: ${docs.length} documents -> public/search-index.json`);
