import type { ScanRequest } from '../../shared/leadcheck';
import { UrlScanForm } from '../components/UrlScanForm';

interface ScanPageProps {
  onStartScan: (input: ScanRequest) => void;
}

export function ScanPage({ onStartScan }: ScanPageProps) {
  return (
    <section className="page-panel scan-page">
      <div className="section-heading">
        <p className="eyebrow">Free Website Lead Check</p>
        <h1>Find out why your website may not be bringing in more jobs.</h1>
        <p>
          Enter your website. LeadCheck will check whether your site makes it easy for local homeowners to understand,
          trust, and contact your business.
        </p>
      </div>
      <UrlScanForm onSubmit={onStartScan} compact source="scan_page" ctaLabel="Check My Website Free" />
    </section>
  );
}
