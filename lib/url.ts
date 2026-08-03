/**
 * Prefixes root-absolute asset paths (the form Tina's media manager writes,
 * e.g. "/assets/uploads/x.jpg") with the GitHub Pages basePath so they work
 * on the project subpath. Relative paths ("assets/uploads/x.jpg") and full
 * URLs pass through untouched.
 */
export function asset(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (src.startsWith('/') && !src.startsWith('//')) {
    return `${process.env.NEXT_PUBLIC_BASE_PATH || ''}${src}`;
  }
  return src;
}
