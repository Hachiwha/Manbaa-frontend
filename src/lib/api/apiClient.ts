import type { ZodSchema } from "zod";
import { http, type HttpRequestOptions } from "./http";

export type { HttpRequestOptions } from "./http";

export interface ApiClientOptions<T> {
  schema?: ZodSchema<T>;
  mapResponse?: (data: unknown) => T;
  /** Forwarded to `http` (blob exports, 204, etc.) */
  parseAs?: HttpRequestOptions["parseAs"];
  timeoutMs?: number;
  withAuth?: boolean;
  signal?: AbortSignal;
}

/**
 * JSON-oriented layer on top of `http`: optional Zod parse + `mapResponse`.
 * For non-JSON responses use `http` with `parseAs: 'blob' | 'void'` instead.
 */
export async function apiClient<T>(
  url: string,
  options: RequestInit,
  config: ApiClientOptions<T> = {}
): Promise<T> {
  const { parseAs = "json", timeoutMs, withAuth, signal, schema, mapResponse } = config;

  if (parseAs !== "json") {
    return http<T>(url, {
      ...options,
      parseAs,
      timeoutMs,
      withAuth,
      signal: options.signal ?? signal,
    } as HttpRequestOptions);
  }

  const raw = await http<unknown>(url, {
    ...options,
    parseAs: "json",
    timeoutMs,
    withAuth,
    signal: options.signal ?? signal,
  } as HttpRequestOptions);

  let extracted: unknown = mapResponse ? mapResponse(raw) : raw;

  if (schema) {
    extracted = schema.parse(extracted);
  }

  return extracted as T;
}
