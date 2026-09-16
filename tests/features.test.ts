import { afterEach, describe, expect, it } from 'vitest';
import { clientOrigins, featureFlagsFromEnv, host, mockScannerAllowed } from '../server/config/env';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('featureFlagsFromEnv', () => {
  it('keeps paid/provider features off by default and service help on', () => {
    delete process.env.ENABLE_AI_VISIBILITY;
    delete process.env.ENABLE_COMPETITOR_ANALYSIS;
    delete process.env.ENABLE_SERVICE_HELP_CTA;

    expect(featureFlagsFromEnv()).toEqual({
      enableServiceHelpCta: true,
      enableAiVisibility: false,
      enableCompetitorAnalysis: false,
    });
  });

  it('reads boolean feature flags from environment variables', () => {
    process.env.ENABLE_SERVICE_HELP_CTA = 'false';

    expect(featureFlagsFromEnv().enableServiceHelpCta).toBe(false);
  });

  it('does not allow mock scans in production unless explicitly enabled', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_MOCK_SCANNER;
    expect(mockScannerAllowed()).toBe(false);

    process.env.ENABLE_MOCK_SCANNER = 'true';
    expect(mockScannerAllowed()).toBe(true);
  });
});

describe('production environment helpers', () => {
  it('uses Render/custom origins and defaults to a Render-compatible host', () => {
    process.env.NODE_ENV = 'production';
    process.env.APP_ORIGIN = 'https://leadcheck.ca, https://www.leadcheck.ca';
    process.env.RENDER_EXTERNAL_URL = 'https://leadcheck.onrender.com';
    delete process.env.HOST;

    expect(clientOrigins()).toEqual([
      'https://leadcheck.ca',
      'https://www.leadcheck.ca',
      'https://leadcheck.onrender.com',
    ]);
    expect(host()).toBe('0.0.0.0');
  });

  it('keeps the Vite dev origin available outside production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.APP_ORIGIN;
    delete process.env.CLIENT_ORIGIN;
    delete process.env.RENDER_EXTERNAL_URL;

    expect(clientOrigins()).toContain('http://localhost:5173');
  });
});
