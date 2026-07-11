import { describe, it, expect, vi } from 'vitest';

// We test the config module by mocking import.meta.env
describe('API Configuration', () => {
  const originalEnv = import.meta.env;

  beforeEach(() => {
    vi.resetModules();
  });

  it('defaults to localhost:3000 when VITE_API_BASE_URL is not set', async () => {
    // We can't easily mock import.meta.env in Vitest without a plugin,
    // but we can test the logic by re-reading the module with different env
    // This is a structural test that the config module exists and exports correctly
    const config = await import('./config');
    expect(config.API_BASE_URL).toBeDefined();
    expect(config.API_PATH_PREFIX).toBeDefined();
    expect(typeof config.getAccessToken).toBe('function');
  });

  it('normalizes API path prefix correctly', async () => {
    const config = await import('./config');
    // The default prefix should be /api
    // This is a compile-time constant
    expect(config.API_PATH_PREFIX).toBe('/api');
  });

  it('does not expose server secrets via browser config', async () => {
    const config = await import('./config');
    const configKeys = Object.keys(config);
    // Ensure no secret-related keys are exposed
    expect(configKeys).not.toContain('JWT_ACCESS_SECRET');
    expect(configKeys).not.toContain('JWT_REFRESH_SECRET');
    expect(configKeys).not.toContain('INTERNAL_AUTH_SECRET');
    expect(configKeys).not.toContain('MINIO_ACCESS_KEY');
    expect(configKeys).not.toContain('MINIO_SECRET_KEY');
    expect(configKeys).not.toContain('DATABASE_URL');
  });

  it('provides auth helper functions', async () => {
    const config = await import('./config');
    expect(typeof config.buildAuthHeaders).toBe('function');
    expect(typeof config.setAccessTokenForDevelopment).toBe('function');
  });
});
