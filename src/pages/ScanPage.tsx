import type { ScanRequest } from '../../shared/leadcheck';
import { UrlScanForm } from '../components/UrlScanForm';

interface ScanPageProps {
  onStartScan: (input: ScanRequest) => void;
}

export function ScanPage({ onStartScan }: ScanPageProps) {
  return (
    <section className="page-panel scan-page">
      <div className="section-heading">
        <p className="eyebrow">Scan Website</p>
        <h1>See how well your website is helping your business get customers.</h1>
        <p>
          Enter your website. LeadCheck will crawl the site, score the biggest growth opportunities, and translate the
          findings into plain language.
        </p>
      </div>
      <UrlScanForm onSubmit={onStartScan} compact source="scan_page" />
    </section>
  );
}
