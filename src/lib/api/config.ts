/**
 * Base URL for API requests. Set `VITE_API_BASE_URL` in `.env` (see docs).
 * Doc default: `https://api.yourbackend.com`
 */
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:3000";

function normalizeApiPrefix(prefix: string): string {
  const trimmed = prefix.trim();
  if (!trimmed || trimmed === "/") return "";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/$/, "");
}

/**
 * Prefix automatically prepended by `apiUrl`.
 * Set `VITE_API_PREFIX` to "" when your backend is mounted at root.
 */
export const API_PATH_PREFIX = normalizeApiPrefix(
  (import.meta.env.VITE_API_PREFIX as string | undefined) ?? "/api"
);

const TOKEN_STORAGE_KEY = "flou2flow_api_token";

/**
 * Pluggable auth: returns Bearer token for `Authorization` or `null` if unauthenticated.
 * Replace `getAccessToken` when you wire a real auth layer (in-memory, cookie-only, etc.).
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

/** Dev / bridge helper until real auth: persist token in `localStorage`. */
export function setAccessTokenForDevelopment(token: string | null) {
  if (typeof window === "undefined" || !window.localStorage) return;
  if (token == null) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } else {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
}

export function buildAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
