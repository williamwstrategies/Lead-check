import type { FeatureFlags } from '../../shared/leadcheck';
import { defaultFeatureFlags } from '../../shared/leadcheck';

function viteFlag(name: string, fallback: boolean): boolean {
  const value = import.meta.env[name];
  if (value == null || value === '') return fallback;
  return /^(1|true|yes|on)$/i.test(String(value).trim());
}

export const clientFeatureFlags: FeatureFlags = {
  ...defaultFeatureFlags,
  enableServiceHelpCta: viteFlag('VITE_ENABLE_SERVICE_HELP_CTA', defaultFeatureFlags.enableServiceHelpCta),
  enableAiVisibility: viteFlag('VITE_ENABLE_AI_VISIBILITY', defaultFeatureFlags.enableAiVisibility),
  enableCompetitorAnalysis: viteFlag(
    'VITE_ENABLE_COMPETITOR_ANALYSIS',
    defaultFeatureFlags.enableCompetitorAnalysis
  ),
};

export async function loadRuntimeFeatureFlags(): Promise<FeatureFlags> {
  try {
    const response = await fetch('/api/config', { headers: { Accept: 'application/json' } });
    if (!response.ok) return clientFeatureFlags;
    const data = await response.json();
    return {
      ...clientFeatureFlags,
      ...(data.features || {}),
    };
  } catch {
    return clientFeatureFlags;
  }
}
