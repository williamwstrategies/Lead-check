import { beforeEach, describe, expect, it } from 'vitest';
import { captureLead, clearInMemoryLeadsForTests } from '../server/services/leads';

describe('lead capture', () => {
  beforeEach(() => {
    clearInMemoryLeadsForTests();
  });

  it('saves the lead fields with website, scan, attribution, industry, and consent data', async () => {
    const result = await captureLead({
      firstName: ' Maya ',
      phone: '(519) 555-1212',
      email: 'MAYA@EXAMPLE.COM',
      businessName: 'Maya Plumbing',
      industry: 'Plumbing',
      websiteUrl: 'maya-plumbing.example',
      scanId: 'scan_testlead12345',
      idempotencyKey: 'lead-test-1',
      marketingConsent: true,
      attribution: {
        utm_source: 'meta',
        utm_medium: 'paid_social',
        utm_campaign: 'beta',
        utm_content: 'score_ad',
        utm_term: 'website audit',
        fbclid: 'fb-click-123',
        gclid: 'google-click-456',
        referrer: 'https://l.facebook.com/l.php?u=https%3A%2F%2Fleadcheck.ca%2F',
      },
    });

    expect(result.deduplicated).toBe(false);
    expect(result.lead).toMatchObject({
      first_name: 'Maya',
      phone: '+15195551212',
      email: 'maya@example.com',
      business_name: 'Maya Plumbing',
      industry: 'Plumbing',
      website_url: 'https://maya-plumbing.example/',
      normalized_domain: 'maya-plumbing.example',
      scan_id: 'scan_testlead12345',
      marketing_consent: true,
      utm_source: 'meta',
      utm_medium: 'paid_social',
      utm_campaign: 'beta',
      utm_content: 'score_ad',
      utm_term: 'website audit',
      fbclid: 'fb-click-123',
      gclid: 'google-click-456',
      referrer: 'https://l.facebook.com/l.php?u=https%3A%2F%2Fleadcheck.ca%2F',
    });
    expect(result.lead.marketing_consent_at).toBeTruthy();
    expect(result.lead.created_at).toBeTruthy();
    expect(result.lead.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('deduplicates repeated lead submissions with the same idempotency key', async () => {
    const input = {
      firstName: 'Maya',
      phone: '5195551212',
      email: 'maya@example.com',
      businessName: 'Maya Plumbing',
      industry: 'Home Services / Contractor' as const,
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
    expect(first.lead.marketing_consent).toBe(false);
    expect(first.lead.marketing_consent_at).toBeNull();
  });

  it('rejects invalid email and phone values', async () => {
    await expect(
      captureLead({
        firstName: 'Maya',
        phone: '123',
        email: 'not-an-email',
        businessName: 'Maya Plumbing',
        industry: 'Plumbing',
        websiteUrl: 'https://maya-plumbing.example',
        scanId: 'scan_testlead12345',
      })
    ).rejects.toMatchObject({
      body: { code: 'invalid_email' },
    });
  });

  it('requires a valid industry option', async () => {
    await expect(
      captureLead({
        firstName: 'Maya',
        phone: '(519) 555-1212',
        email: 'maya@example.com',
        businessName: 'Maya Plumbing',
        industry: '',
        websiteUrl: 'https://maya-plumbing.example',
        scanId: 'scan_testlead12345',
      })
    ).rejects.toMatchObject({
      body: { code: 'invalid_industry' },
    });
  });

  it('accepts the agency industry option', async () => {
    const result = await captureLead({
      firstName: 'Maya',
      phone: '(519) 555-1212',
      email: 'maya@example.com',
      businessName: 'Maya Marketing',
      industry: 'Marketing / Web Agency',
      websiteUrl: 'https://maya-marketing.example',
      scanId: 'scan_testlead12345',
      idempotencyKey: 'lead-test-agency',
    });

    expect(result.lead.industry).toBe('Marketing / Web Agency');
  });
});
