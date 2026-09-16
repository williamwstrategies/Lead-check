import { type CSSProperties, useEffect, useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import type { FeatureFlags, LeadCheckReport, ScanRequest } from '../../shared/leadcheck';
import { ReportSections } from '../components/ReportSections';
import { brand } from '../config/brand';
import { requestServiceHelp } from '../lib/api';
import { saveReportLocally } from '../lib/reportStorage';
import { trackEvent } from '../lib/analytics';

interface ReportPageProps {
  report: LeadCheckReport | null;
  features: FeatureFlags;
  onStartScan: (input: ScanRequest) => void;
  onNavigate: (path: string) => void;
}

export function ReportPage({ report, features, onStartScan, onNavigate }: ReportPageProps) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!report) return;
    void trackEvent('report_viewed', {
      reportId: report.id,
      scanId: report.scan.id,
      domain: report.requestedWebsite.normalizedDomain,
      mock: report.isMock,
    });
  }, [report]);

  if (!report) {
    return (
      <section className="page-panel empty-state">
        <h1>Report not found</h1>
        <p>Run a new LeadCheck scan to create a fresh report.</p>
        <button className="primary-action" type="button" onClick={() => onNavigate('/scan')}>
          Scan My Website
        </button>
      </section>
    );
  }

  function save() {
    if (!report) return;
    saveReportLocally(report);
    setMessage('Report saved on this device.');
    void trackEvent('report_saved', { reportId: report.id, domain: report.requestedWebsite.normalizedDomain });
  }

  async function serviceHelp() {
    if (!report) return;
    setMessage("Thanks. We've recorded that you're interested in help improving this website.");
    await requestServiceHelp(report.id, report.requestedWebsite.url).catch(() => undefined);
  }

  const topOpportunity = report.opportunities[0] || null;
  const opportunityCount = report.opportunities.length;
  const businessLabel = report.businessContext.businessName || report.requestedWebsite.normalizedDomain;
  const scoreValue = Math.round(report.score.score);

  return (
    <article className="report-page">
      <header className="report-header">
        <div className="report-header-main">
          <div className="report-kicker">
            <span>{brand.name}</span>
            <span>Website Growth Report</span>
          </div>
          <p className="eyebrow">Analyzed Website</p>
          <h1>{businessLabel}</h1>
          <p className="report-domain">{report.requestedWebsite.normalizedDomain}</p>
          <div className="report-hero-score">
            <div className="score-ring report-score-ring" style={{ '--score': scoreValue } as CSSProperties}>
              <span>{scoreValue}</span>
              <small>/100</small>
            </div>
            <div>
              <p className="eyebrow">LeadCheck Score</p>
              <h2>{report.score.status}</h2>
              <p>
                We found {opportunityCount} important {opportunityCount === 1 ? 'opportunity' : 'opportunities'} to
                improve how your website supports customer acquisition.
              </p>
              <p>{report.summary}</p>
            </div>
          </div>
          <div className="report-summary-strip">
            <span>
              <strong>{scoreValue}/100</strong>
              LeadCheck Score
            </span>
            <span>
              <strong>{opportunityCount}</strong>
              important {opportunityCount === 1 ? 'opportunity' : 'opportunities'}
            </span>
            <span>
              <strong>{topOpportunity ? `#1 ${topOpportunity.title}` : 'No critical issue'}</strong>
              strongest priority
            </span>
          </div>
        </div>
        <div className="report-actions">
          <button
            className="primary-action"
            type="button"
            onClick={() => document.getElementById('recommendations')?.scrollIntoView({ behavior: 'smooth' })}
          >
            See Recommendations
          </button>
          <button className="secondary-action" type="button" onClick={save}>
            <Save size={17} aria-hidden="true" />
            Save Report
          </button>
          <button
            className="secondary-action"
            type="button"
            onClick={() => {
              void trackEvent('rescan_clicked', { domain: report.requestedWebsite.normalizedDomain });
              onStartScan({
                url: report.requestedWebsite.url,
              });
            }}
          >
            <RotateCcw size={17} aria-hidden="true" />
            Scan Again
          </button>
        </div>
      </header>
      {message ? <p className="inline-message">{message}</p> : null}
      <ReportSections report={report} features={features} onServiceHelp={serviceHelp} />
    </article>
  );
}
