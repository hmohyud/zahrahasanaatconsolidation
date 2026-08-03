/**
 * Filesystem content loaders.
 *
 * These read the same content/ files Tina edits, shaped exactly like the
 * corresponding GraphQL responses, so pages can pass the result straight to
 * `useTina` — visitors get build-time data, editors get live data in /admin.
 * Building this way keeps `next build` working with zero Tina credentials
 * (required: the site must deploy before the Tina Cloud account exists).
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { parseMDX } from '@tinacms/mdx';
import { bodyField } from '../tina/templates';

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, 'content', 'pages');
const STORIES_DIR = path.join(ROOT, 'content', 'stories');
const SETTINGS_DIR = path.join(ROOT, 'content', 'settings');

const imageCallback = (url: string) => url;

function readMdx(dir: string, slug: string) {
  const file = path.join(dir, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8');
  const { data, content } = matter(raw);
  const body = parseMDX(content, bodyField as any, imageCallback);
  // JSON round-trip drops `undefined` leaves (Next refuses to serialize them)
  return JSON.parse(JSON.stringify({ ...data, body, _sys: { filename: slug } }));
}

function listSlugs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''));
}

export function listPageSlugs() {
  return listSlugs(PAGES_DIR);
}
export function listStorySlugs() {
  return listSlugs(STORIES_DIR);
}
export function getPage(slug: string) {
  return readMdx(PAGES_DIR, slug);
}
export function getStory(slug: string) {
  return readMdx(STORIES_DIR, slug);
}

export function getSite() {
  return JSON.parse(fs.readFileSync(path.join(SETTINGS_DIR, 'site.json'), 'utf8'));
}
export function getHome() {
  return JSON.parse(fs.readFileSync(path.join(SETTINGS_DIR, 'home.json'), 'utf8'));
}

/** Story card metadata for index/preview grids (no body parse). */
export function listStoriesMeta() {
  return listStorySlugs()
    .map((slug) => {
      const raw = fs.readFileSync(path.join(STORIES_DIR, `${slug}.mdx`), 'utf8');
      const { data } = matter(raw);
      return {
        slug,
        title: (data.title as string) || slug,
        date: (data.date as string) || '',
        tags: (data.tags as string[]) || [],
        heroImage: (data.heroImage as string) || null,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

/* ---- GraphQL query strings for Tina visual editing (client-side only) ---- */

export const PAGE_QUERY = `
  query Page($relativePath: String!) {
    page(relativePath: $relativePath) {
      title
      eyebrow
      subtitle
      heroImage
      body
      related { title links { label href } }
    }
  }
`;

export const STORY_QUERY = `
  query Story($relativePath: String!) {
    story(relativePath: $relativePath) {
      title
      date
      tags
      heroImage
      body
    }
  }
`;

export const HOME_QUERY = `
  query Home($relativePath: String!) {
    home(relativePath: $relativePath) {
      hero { eyebrow title text image buttons { label href outline } }
      welcome { arabic quote cite body }
      programs { title text href icon }
      impact { number label }
      feature { eyebrow title text image buttonLabel buttonHref }
      cta { title text buttons { label href outline } }
    }
  }
`;
