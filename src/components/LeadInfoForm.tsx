import { FormEvent, useEffect, useRef, useState } from 'react';
import { Mail, Phone, UserRound, Building2, BriefcaseBusiness } from 'lucide-react';
import type { AttributionFields, LeadCaptureResponse, LeadIndustry } from '../../shared/leadcheck';
import { LEAD_INDUSTRIES } from '../../shared/leadcheck';
import { submitLeadInfo } from '../lib/api';
import { trackEvent, trackMetaPixelEvent } from '../lib/analytics';

interface LeadInfoFormProps {
  scanId: string;
  websiteUrl: string;
  attribution: AttributionFields;
  onSubmitted: (response: LeadCaptureResponse) => void;
}

function idempotencyKey(scanId: string): string {
  return `lead_${scanId}`;
}

export function LeadInfoForm({ scanId, websiteUrl, attribution, onSubmitted }: LeadInfoFormProps) {
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState<LeadIndustry | ''>('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submitted = useRef(false);
  const viewTracked = useRef(false);

  useEffect(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;
    void trackEvent('lead_form_viewed', { scanId });
  }, [scanId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting || submitted.current) return;

    if (!firstName.trim()) {
      setError('Enter your first name.');
      return;
    }
    if (!businessName.trim()) {
      setError('Enter your business name.');
      return;
    }
    if (!industry) {
      setError('Select your industry.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (!phone.trim()) {
      setError('Enter your phone number.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await submitLeadInfo({
        firstName: firstName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        businessName: businessName.trim(),
        industry,
        websiteUrl,
        scanId,
        attribution,
        marketingConsent,
        idempotencyKey: idempotencyKey(scanId),
      });
      submitted.current = true;
      trackMetaPixelEvent('CompleteRegistration');
      onSubmitted(response);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'We could not save your information. Please try again.';
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <form className="lead-info-form" onSubmit={submit}>
      <div className="section-heading">
        <p className="eyebrow">Your LeadCheck Is Being Created</p>
        <h2>Tell us where to save your results.</h2>
      </div>

      <label className="field">
        <span>
          <UserRound size={16} aria-hidden="true" />
          First Name
        </span>
        <input
          value={firstName}
          onChange={event => setFirstName(event.target.value)}
          autoComplete="given-name"
          name="firstName"
          required
        />
      </label>

      <label className="field">
        <span>
          <Building2 size={16} aria-hidden="true" />
          Business Name
        </span>
        <input
          value={businessName}
          onChange={event => setBusinessName(event.target.value)}
          autoComplete="organization"
          name="businessName"
          required
        />
      </label>

      <label className="field">
        <span>
          <BriefcaseBusiness size={16} aria-hidden="true" />
          What type of business do you run?
        </span>
        <select value={industry} onChange={event => setIndustry(event.target.value as LeadIndustry | '')} name="industry" required>
          <option value="">Select your industry</option>
          {LEAD_INDUSTRIES.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>
          <Mail size={16} aria-hidden="true" />
          Email Address
        </span>
        <input
          value={email}
          onChange={event => setEmail(event.target.value)}
          type="email"
          autoComplete="email"
          name="email"
          required
        />
      </label>

      <label className="field">
        <span>
          <Phone size={16} aria-hidden="true" />
          Phone Number
        </span>
        <input
          value={phone}
          onChange={event => setPhone(event.target.value)}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          name="phone"
          required
        />
      </label>

      <label className="consent-option">
        <input
          checked={marketingConsent}
          onChange={event => setMarketingConsent(event.target.checked)}
          type="checkbox"
          name="marketingConsent"
        />
        <span className="consent-copy">
          <span className="consent-headline">Send me free tips to improve my website</span>
          <span className="consent-support">
            Get occasional practical tips from LeadCheck to help turn more website visitors into customers. Unsubscribe
            anytime.
          </span>
        </span>
      </label>

      <p className="privacy-note">
        We use this information to send and associate your LeadCheck results. Read our{' '}
        <a href="/privacy">Privacy Policy</a>.
      </p>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <button className="primary-action" type="submit" disabled={submitting || submitted.current}>
        {submitting ? 'Saving...' : 'Get My LeadCheck'}
      </button>
    </form>
  );
}
