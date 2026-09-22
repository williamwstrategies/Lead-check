import { beforeEach, describe, expect, it } from 'vitest';
import { captureLead, clearInMemoryLeadsForTests } from '../server/services/leads';

describe('lead capture', () => {
  beforeEach(() => {
    clearInMemoryLeadsForTests();
  });

  it('saves the four lead fields with website, scan, and attribution data', async () => {
    const result = await captureLead({
      firstName: ' Maya ',
      phone: '(519) 555-1212',
      email: 'MAYA@EXAMPLE.COM',
      businessName: 'Maya Plumbing',
      websiteUrl: 'maya-plumbing.example',
      scanId: 'scan_testlead12345',
      idempotencyKey: 'lead-test-1',
      attribution: {
        utm_source: 'meta',
        utm_medium: 'paid_social',
        utm_campaign: 'beta',
      },
    });

    expect(result.deduplicated).toBe(false);
    expect(result.lead).toMatchObject({
      first_name: 'Maya',
      phone: '+15195551212',
      email: 'maya@example.com',
      business_name: 'Maya Plumbing',
      website_url: 'https://maya-plumbing.example/',
      normalized_domain: 'maya-plumbing.example',
      scan_id: 'scan_testlead12345',
      utm_source: 'meta',
      utm_medium: 'paid_social',
      utm_campaign: 'beta',
    });
    expect(result.lead.created_at).toBeTruthy();
    expect(result.lead.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('deduplicates repeated lead submissions with the same idempotency key', async () => {
    const input = {
      firstName: 'Maya',
      phone: '5195551212',
      email: 'maya@example.com',
      businessName: 'Maya Plumbing',
      websiteUrl: 'https://maya-plumbing.example',
      scanId: 'scan_testlead12345',
      idempotencyKey: 'lead-test-2',
    };

    const first = await captureLead(input);
    const second = await captureLead(input);

    expect(first.deduplicated).toBe(false);
    expect(second.deduplicated).toBe(true);
    expect(second.lead.id).toBe(first.lead.id);
    expect(second.lead.created_at).toBe(first.lead.created_at);
  });

  it('rejects invalid email and phone values', async () => {
    await expect(
      captureLead({
        firstName: 'Maya',
        phone: '123',
        email: 'not-an-email',
        businessName: 'Maya Plumbing',
        websiteUrl: 'https://maya-plumbing.example',
        scanId: 'scan_testlead12345',
      })
    ).rejects.toMatchObject({
      body: { code: 'invalid_email' },
    });
  });
});
