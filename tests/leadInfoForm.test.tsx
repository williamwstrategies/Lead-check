import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LeadCaptureResponse } from '../shared/leadcheck';
import { LeadInfoForm } from '../src/components/LeadInfoForm';
import { trackEvent, trackMetaPixelEvent } from '../src/lib/analytics';
import { submitLeadInfo } from '../src/lib/api';

vi.mock('../src/lib/api', () => ({
  submitLeadInfo: vi.fn(),
}));

vi.mock('../src/lib/analytics', () => ({
  trackEvent: vi.fn(() => Promise.resolve()),
  trackMetaPixelEvent: vi.fn(),
}));

const scanId = 'scan_testlead12345';
const websiteUrl = 'https://maya-plumbing.example/';

function mockResponse(industry = 'General Contractor'): LeadCaptureResponse {
  return {
    deduplicated: false,
    lead: {
      id: 'lead_test',
      first_name: 'Maya',
      phone: '+15195551212',
      email: 'maya@example.com',
      business_name: 'Maya Contracting',
      industry: industry as LeadCaptureResponse['lead']['industry'],
      website_url: websiteUrl,
      normalized_domain: 'maya-plumbing.example',
      scan_id: scanId,
      marketing_consent: true,
      marketing_consent_at: '2026-09-23T12:00:00.000Z',
      created_at: '2026-09-23T12:00:00.000Z',
    },
  };
}

function renderForm(onSubmitted = vi.fn()) {
  return {
    onSubmitted,
    ...render(
      <LeadInfoForm
        scanId={scanId}
        websiteUrl={websiteUrl}
        attribution={{ utm_source: 'meta', utm_campaign: 'fall-test' }}
        onSubmitted={onSubmitted}
      />
    ),
  };
}

function fillContactFields() {
  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Maya' } });
  fireEvent.change(screen.getByLabelText(/business name/i), { target: { value: 'Maya Contracting' } });
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'maya@example.com' } });
  fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '(519) 555-1212' } });
}

describe('LeadInfoForm', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('submits the required industry with attribution and marketing consent', async () => {
    const onSubmitted = vi.fn();
    vi.mocked(submitLeadInfo).mockResolvedValue(mockResponse());
    renderForm(onSubmitted);

    fillContactFields();
    fireEvent.change(screen.getByLabelText(/what type of business/i), {
      target: { value: 'General Contractor' },
    });
    fireEvent.click(screen.getByLabelText(/send me free tips to improve my website/i));
    fireEvent.click(screen.getByRole('button', { name: /get my website lead report/i }));

    await waitFor(() => expect(submitLeadInfo).toHaveBeenCalledTimes(1));
    expect(submitLeadInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Maya',
        businessName: 'Maya Contracting',
        industry: 'General Contractor',
        email: 'maya@example.com',
        phone: '(519) 555-1212',
        websiteUrl,
        scanId,
        marketingConsent: true,
        idempotencyKey: `lead_${scanId}`,
        attribution: expect.objectContaining({
          utm_source: 'meta',
          utm_campaign: 'fall-test',
        }),
      })
    );
    expect(onSubmitted).toHaveBeenCalledWith(mockResponse());
    expect(trackEvent).toHaveBeenCalledWith('lead_form_viewed', { scanId });
    expect(trackMetaPixelEvent).toHaveBeenCalledWith('CompleteRegistration');
  });

  it('does not submit when industry is missing', () => {
    const { container } = renderForm();

    fillContactFields();
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(screen.getByRole('alert')).toHaveTextContent('Select your industry.');
    expect(submitLeadInfo).not.toHaveBeenCalled();
  });
});
