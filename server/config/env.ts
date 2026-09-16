import type { FeatureFlags } from '../../shared/leadcheck.js';
import { defaultFeatureFlags } from '../../shared/leadcheck.js';

export function envFlag(name: string, fallback = false): boolean {
  const value = process.env[name];
  if (value == null || value === '') return fallback;
  return /^(1|true|yes|on)$/i.test(String(value).trim());
}

export function featureFlagsFromEnv(): FeatureFlags {
  return {
    ...defaultFeatureFlags,
    enableServiceHelpCta: envFlag('ENABLE_SERVICE_HELP_CTA', true),
    enableAiVisibility: envFlag('ENABLE_AI_VISIBILITY', false),
    enableCompetitorAnalysis: envFlag('ENABLE_COMPETITOR_ANALYSIS', false),
  };
}

export function mockScannerAllowed(): boolean {
  if (process.env.NODE_ENV === 'test') return true;
  return envFlag('ENABLE_MOCK_SCANNER', false);
}

function splitOrigins(value: string | undefined): string[] {
  return String(value || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

export function clientOrigins(): string[] {
  const configuredOrigins = [
    ...splitOrigins(process.env.APP_ORIGIN),
    ...splitOrigins(process.env.CLIENT_ORIGIN),
    ...splitOrigins(process.env.RENDER_EXTERNAL_URL),
  ];

  if (process.env.NODE_ENV !== 'production') {
    configuredOrigins.push('http://localhost:5173');
  }

  return [...new Set(configuredOrigins)];
}

export function port(): number {
  const parsed = Number(process.env.PORT);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3000;
}

export function host(): string {
  return process.env.HOST || '0.0.0.0';
}
