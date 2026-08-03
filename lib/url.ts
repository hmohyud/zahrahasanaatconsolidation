/**
 * Resolves a content image path to a ROOT-ABSOLUTE URL (with the GitHub
 * Pages basePath). Absolute URLs are immune to two production-only traps:
 *  - Next's client router strips the homepage's trailing slash
 *    (history.replaceState), shifting the document base URL so relative
 *    srcs on lazy-loaded images resolve to the domain root and 404;
 *  - relative url() values consumed through CSS custom properties resolve
 *    against the compiled stylesheet's /_next/static/css/ URL, not the page.
 * Handles every stored form: "assets/uploads/x.jpg" (converter),
 * "/assets/uploads/x.jpg" (Tina media manager), and full https:// URLs.
 */
export function asset(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (/^(https?:)?\/\//.test(src) || src.startsWith('data:')) return src;
  const bp = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return src.startsWith('/') ? `${bp}${src}` : `${bp}/${src}`;
}
