import type { ApiErrorBody, LeadCheckReport, ScanRequest } from '../../shared/leadcheck.js';
import { mockScannerAllowed } from '../config/env.js';
import { normalizeWebsiteUrl } from '../lib/url.js';
import { trackServerEvent } from './analytics.js';
import { mockScanner } from './mockScanner.js';
import { persistScanReport } from './persistence.js';
import { realScanner, RealScanError } from './realScanner.js';

const runningScanKeys = new Set<string>();

export class ApiRouteError extends Error {
  statusCode: number;
  body: ApiErrorBody;

  constructor(statusCode: number, body: ApiErrorBody) {
    super(body.error);
    this.name = 'ApiRouteError';
    this.statusCode = statusCode;
    this.body = body;
  }
}

export async function runMockScanForRequest(
  input: ScanRequest,
  anonymousId = ''
): Promise<LeadCheckReport> {
  const website = normalizeWebsiteUrl(String(input?.url || ''));
  await trackServerEvent({
    event: 'scan_started',
    anonymousId,
    properties: {
      domain: website.normalizedDomain,
    },
  });

  const report = await mockScanner.runWebsiteScan({ ...input, url: website.url });
  if (report.scan.status === 'failed') {
    await trackServerEvent({
      event: 'scan_failed',
      anonymousId,
      properties: { domain: website.normalizedDomain, reason: report.scan.failureReason || '' },
    });
    throw new ApiRouteError(500, {
      error: report.scan.failureReason || 'The scan failed.',
      code: 'mock_scan_failed',
    });
  }

  await trackServerEvent({
    event: 'scan_completed',
    anonymousId,
    properties: {
      domain: website.normalizedDomain,
      score: report.score.score,
      mock: true,
    },
  });
  return report;
}

export async function runScanForRequest(input: ScanRequest, anonymousId = ''): Promise<LeadCheckReport> {
  const website = normalizeWebsiteUrl(String(input?.url || ''));
  const useMock = Boolean(input.mockScenario && mockScannerAllowed());
  const runningKey = `${anonymousId || 'anonymous'}:${website.normalizedDomain}`;

  if (!useMock && runningScanKeys.has(runningKey)) {
    throw new ApiRouteError(409, {
      error: 'A scan for this website is already running. Please wait for it to finish.',
      code: 'scan_already_running',
    });
  }

  await trackServerEvent({
    event: 'scan_started',
    anonymousId,
    properties: {
      domain: website.normalizedDomain,
      mock: useMock,
    },
  });

  try {
    if (!useMock) runningScanKeys.add(runningKey);
    const report = useMock
      ? await mockScanner.runWebsiteScan({ ...input, url: website.url })
      : await realScanner.runWebsiteScan({ ...input, url: website.url });

    if (report.scan.status === 'failed') {
      throw new ApiRouteError(500, {
        error: report.scan.failureReason || 'The scan failed.',
        code: report.isMock ? 'mock_scan_failed' : 'scan_failed',
      });
    }

    await persistScanReport(report);

    await trackServerEvent({
      event: 'scan_completed',
      anonymousId,
      properties: {
        domain: website.normalizedDomain,
        score: report.score.score,
        mock: report.isMock,
        scannerVersion: report.scannerVersion || '',
        pageCount: report.scan.pagesAnalyzed || 0,
      },
    });

    return report;
  } catch (error) {
    const code = error instanceof RealScanError ? error.code : error instanceof ApiRouteError ? error.body.code : 'scan_failed';
    await trackServerEvent({
      event: 'scan_failed',
      anonymousId,
      properties: {
        domain: website.normalizedDomain,
        reason: code,
        mock: useMock,
      },
    });

    if (error instanceof ApiRouteError) throw error;
    if (error instanceof RealScanError) {
      throw new ApiRouteError(502, {
        error: error.message,
        code: error.code,
      });
    }
    throw error;
  } finally {
    if (!useMock) runningScanKeys.delete(runningKey);
  }
}
