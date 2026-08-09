import { SITE } from '../consts';

/** Normalize request paths to a single canonical form (trailing slash, no index.html). */
export function normalizeCanonicalPath(pathname: string): string {
  let path = pathname || '/';

  if (path === '/index.html' || path === '/index.html/') {
    return '/';
  }

  if (path.endsWith('/index.html')) {
    path = path.slice(0, -'index.html'.length);
  }

  if (path !== '/' && !path.endsWith('/') && !path.split('/').pop()?.includes('.')) {
    path = `${path}/`;
  }

  return path;
}

/** Absolute apex HTTPS canonical — never www, never index.html, never query params. */
export function getCanonicalUrl(pathname: string): string {
  return new URL(normalizeCanonicalPath(pathname), SITE.url).href;
}
