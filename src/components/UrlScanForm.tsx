import { FormEvent, useId, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { ScanRequest } from '../../shared/leadcheck';
import { trackEvent } from '../lib/analytics';

interface UrlScanFormProps {
  onSubmit: (input: ScanRequest) => void;
  compact?: boolean;
  initialUrl?: string;
  source?: string;
}

function clean(value: string): string {
  return value.trim();
}

export function UrlScanForm({ onSubmit, compact = false, initialUrl = '', source }: UrlScanFormProps) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState('');
  const errorId = useId();

  function submit(event: FormEvent) {
    event.preventDefault();
    const websiteUrl = clean(url);
    if (!websiteUrl || !websiteUrl.includes('.')) {
      setError('Enter your business website URL.');
      return;
    }
    setError('');
    void trackEvent('website_submitted', {
      source: source || (compact ? 'scan_page' : 'landing_page'),
    });
    onSubmit({ url: websiteUrl });
  }

  return (
    <form className={compact ? 'scan-form compact' : 'scan-form'} onSubmit={submit}>
      <label className="field full">
        <span>Website URL</span>
        <input
          value={url}
          onChange={event => setUrl(event.target.value)}
          placeholder="example.com"
          inputMode="url"
          autoComplete="url"
          aria-describedby={error ? errorId : undefined}
        />
      </label>
      {error ? (
        <p className="form-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
      <button className="primary-action" type="submit">
        Scan My Website — Free
        <ArrowRight size={18} aria-hidden="true" />
      </button>
      <p className="free-note">Free website analysis. No credit card required.</p>
    </form>
  );
}
