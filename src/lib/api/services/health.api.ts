import { apiClient } from "../apiClient";
import { apiUrl } from "../url";

export interface HealthStatusResponse {
  status?: string;
  [key: string]: unknown;
}

/** `GET /health` */
export function getHealth(signal?: AbortSignal) {
  return apiClient<HealthStatusResponse>(
    apiUrl("/health"),
    { method: "GET" },
    { signal, withAuth: false },
  );
}

/** `GET /health/details` */
export function getHealthDetails(signal?: AbortSignal) {
  return apiClient<HealthStatusResponse>(
    apiUrl("/health/details"),
    { method: "GET" },
    { signal, withAuth: false },
  );
}

/** `GET /health/ai-service` */
export function getHealthAiService(signal?: AbortSignal) {
  return apiClient<HealthStatusResponse>(
    apiUrl("/health/ai-service"),
    { method: "GET" },
    { signal, withAuth: false },
  );
}

/** `GET /health/ollama` */
export function getHealthOllama(signal?: AbortSignal) {
  return apiClient<HealthStatusResponse>(
    apiUrl("/health/ollama"),
    { method: "GET" },
    { signal, withAuth: false },
  );
}

/** `GET /health/pgvector` */
export function getHealthPgvector(signal?: AbortSignal) {
  return apiClient<HealthStatusResponse>(
    apiUrl("/health/pgvector"),
    { method: "GET" },
    { signal, withAuth: false },
  );
}

/** `GET /health/nats` */
export function getHealthNats(signal?: AbortSignal) {
  return apiClient<HealthStatusResponse>(
    apiUrl("/health/nats"),
    { method: "GET" },
    { signal, withAuth: false },
  );
}

/** `GET /health/ping` */
export function getHealthPing(signal?: AbortSignal) {
  return apiClient<HealthStatusResponse>(
    apiUrl("/health/ping"),
    { method: "GET" },
    { signal, withAuth: false },
  );
}
