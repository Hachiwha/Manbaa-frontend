import { redirect } from "@tanstack/react-router";
import { getAccessToken } from "@/lib/api";

/**
 * Redirects to /login when there's no access token.
 *
 * getAccessToken() reads localStorage, which doesn't exist during SSR - so
 * this only enforces on the client (beforeLoad also re-runs after
 * hydration and on every client-side navigation). Checking on the server
 * would see "no token" on every render and redirect logged-in users in a
 * loop. This is a direct consequence of the token living in localStorage
 * instead of an httpOnly cookie (see lib/api/config.ts) - fixing that
 * belongs to the auth phase, not this guard.
 */
export function requireAuth() {
  if (typeof window === "undefined") return;
  if (!getAccessToken()) {
    throw redirect({ to: "/login" });
  }
}

/** Inverse of requireAuth - bounce already-authenticated users off /, /login and /register. */
export function requireGuest() {
  if (typeof window === "undefined") return;
  if (getAccessToken()) {
    throw redirect({ to: "/dashboard" });
  }
}
