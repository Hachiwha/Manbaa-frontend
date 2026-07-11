import { API_BASE_URL, API_PATH_PREFIX } from "./config";

export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.set(key, String(value));
  }
  const q = search.toString();
  return q ? `?${q}` : "";
}

/**
 * Absolute URL for a path (must start with `/`) with optional query object.
 */
export function apiUrl(
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>,
) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const prefixedPath =
    API_PATH_PREFIX &&
    p !== API_PATH_PREFIX &&
    !p.startsWith(`${API_PATH_PREFIX}/`)
      ? `${API_PATH_PREFIX}${p}`
      : p;
  const q = query ? buildQueryString(query) : "";
  return `${API_BASE_URL}${prefixedPath}${q}`;
}
