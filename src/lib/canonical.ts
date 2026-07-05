import { SITE } from '../consts';

/** Normalize request paths to a single canonical form (trailing slash, no index.html). */
export function normalizeCanonicalPath(pathname: string): string {
  let path = pathname || '/';

  if (path === '/index.html' || path === '/index.html/') {
    return '/';
  }

  if (path !== '/' && !path.endsWith('/')) {
    path = `${path}/`;
  }

  return path;
}

export function getCanonicalUrl(pathname: string): string {
  return new URL(normalizeCanonicalPath(pathname), SITE.url).href;
}
