import type { ApiErrorBody, LeadCaptureRequest, LeadCaptureResponse, ScanRequest, ScanResponse } from '../../shared/leadcheck';
import { getAnonymousId } from './analytics';

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorBody = payload as ApiErrorBody;
    const error = new Error(errorBody.error || 'Request failed. Please try again.');
    Object.assign(error, { code: errorBody.code || 'request_failed', details: errorBody.details });
    throw error;
  }
  return payload as T;
}

export async function createScan(input: ScanRequest): Promise<ScanResponse> {
  const response = await fetch('/api/scans', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-LeadCheck-Anonymous-Id': getAnonymousId(),
    },
    body: JSON.stringify(input),
  });
  return readJson<ScanResponse>(response);
}

export async function submitLeadInfo(input: LeadCaptureRequest): Promise<LeadCaptureResponse> {
  const response = await fetch('/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-LeadCheck-Anonymous-Id': getAnonymousId(),
      'X-LeadCheck-Idempotency-Key': input.idempotencyKey || '',
    },
    body: JSON.stringify(input),
  });
  return readJson<LeadCaptureResponse>(response);
}

export async function requestServiceHelp(reportId: string, website: string): Promise<void> {
  const response = await fetch('/api/service-help', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-LeadCheck-Anonymous-Id': getAnonymousId(),
    },
    body: JSON.stringify({ reportId, website }),
  });
  await readJson(response);
}
