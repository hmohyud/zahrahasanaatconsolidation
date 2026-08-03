/**
 * Static export for GitHub Pages.
 * - `output: 'export'` + `trailingSlash: false` emits `<route>.html` files,
 *   preserving the site's existing `page-name.html` URLs exactly.
 * - `basePath` is set in CI (GitHub Pages project subpath); empty locally.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: false,
  basePath,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  // Dev-only: let the exported-style `page.html` links resolve in `next dev`
  // (static export ignores rewrites; GitHub Pages serves the real .html files).
  async rewrites() {
    return [{ source: '/:slug*.html', destination: '/:slug*' }];
  },
};

export default nextConfig;
