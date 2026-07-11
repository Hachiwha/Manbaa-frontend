import { buildAuthHeaders } from "./config";

export class HttpError extends Error {
  constructor(
    public status: number,
    public data: unknown,
    message?: string,
  ) {
    super(message ?? "HTTP Error");
    this.name = "HttpError";
  }
}

const DEFAULT_TIMEOUT_MS = 10_000;

function extractErrorMessage(data: unknown): string | undefined {
  if (data && typeof data === "object" && "message" in data) {
    const m = (data as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return undefined;
}

export type HttpParseAs = "json" | "blob" | "text" | "void";

export type HttpRequestOptions = RequestInit & {
  /** How to read a successful response body. Default: `json`. */
  parseAs?: HttpParseAs;
  /** Override default 10s timeout. */
  timeoutMs?: number;
  /** When false, do not add `Authorization` from `getAccessToken()`. Default: true. */
  withAuth?: boolean;
};

/**
 * Low-level transport: fetch with timeout, credentials, JSON or multipart bodies, typed response parsing.
 * Use `apiClient` for JSON + optional Zod on top of this.
 */
export async function http<T = unknown>(
  url: string,
  options: HttpRequestOptions = {},
): Promise<T> {
  const {
    parseAs = "json",
    timeoutMs = DEFAULT_TIMEOUT_MS,
    withAuth = true,
    ...init
  } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const isFormData =
    init.body != null &&
    typeof FormData !== "undefined" &&
    init.body instanceof FormData;

  const headers = new Headers(init.headers);
  if (withAuth) {
    const auth = new Headers(buildAuthHeaders());
    const a = auth.get("Authorization");
    if (a) headers.set("Authorization", a);
  }
  if (!isFormData && !headers.has("Content-Type") && init.body != null) {
    headers.set("Content-Type", "application/json");
  }
  if (isFormData) {
    headers.delete("Content-Type");
  }

  try {
    const res = await fetch(url, {
      ...init,
      headers,
      credentials: "include",
      signal: init.signal ?? controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      let error: unknown = text;
      if (text) {
        try {
          error = JSON.parse(text) as unknown;
        } catch {
          /* non-JSON error body */
        }
      } else {
        error = null;
      }
      throw new HttpError(
        res.status,
        error,
        extractErrorMessage(error) ??
          (typeof text === "string" && text ? text : undefined),
      );
    }

    if (parseAs === "void" || res.status === 204) {
      return undefined as T;
    }
    if (parseAs === "blob") {
      return (await res.blob()) as T;
    }
    if (parseAs === "text") {
      return (await res.text()) as T;
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}
