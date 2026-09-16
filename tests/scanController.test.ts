import { describe, expect, it } from 'vitest';
import { ApiRouteError, runMockScanForRequest } from '../server/services/scanController';

describe('runMockScanForRequest', () => {
  it('creates a completed mock scan report for API routes', async () => {
    const report = await runMockScanForRequest({
      url: 'example.com',
      businessCategory: 'Retail',
      mockScenario: 'default',
    });

    expect(report.scan.status).toBe('completed');
    expect(report.requestedWebsite.normalizedDomain).toBe('example.com');
  });

  it('rejects unsafe scan URLs before scan creation', async () => {
    await expect(runMockScanForRequest({ url: 'http://127.0.0.1/admin' })).rejects.toMatchObject({
      code: 'private_network_blocked',
    });
  });

  it('surfaces failed mock scans as route errors', async () => {
    await expect(runMockScanForRequest({ url: 'example.com', mockScenario: 'failed' })).rejects.toBeInstanceOf(
      ApiRouteError
    );
  });
});
