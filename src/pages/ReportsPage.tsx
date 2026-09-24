import { FileText } from 'lucide-react';
import type { LeadCheckReport } from '../../shared/leadcheck';

interface ReportsPageProps {
  reports: LeadCheckReport[];
  onNavigate: (path: string) => void;
}

export function ReportsPage({ reports, onNavigate }: ReportsPageProps) {
  if (!reports.length) {
    return (
      <section className="page-panel empty-state">
        <FileText size={38} aria-hidden="true" />
        <h1>No reports yet</h1>
        <p>Run a free LeadCheck scan to create your first Website Lead Report.</p>
        <button className="primary-action" type="button" onClick={() => onNavigate('/scan')}>
          Check My Website
        </button>
      </section>
    );
  }

  return (
    <section className="page-panel reports-page">
      <div className="section-heading">
        <p className="eyebrow">My Reports</p>
        <h1>Saved Website Lead Reports</h1>
        <p>Saved reports from this device appear here.</p>
      </div>
      <div className="report-list">
        {reports.map(report => (
          <button className="report-row" key={report.id} type="button" onClick={() => onNavigate(`/reports/${report.id}`)}>
            <span>
              <strong>{report.requestedWebsite.normalizedDomain}</strong>
              <small>{new Date(report.createdAt).toLocaleString()}</small>
            </span>
            <b>{Math.round(report.score.score)}/100</b>
          </button>
        ))}
      </div>
    </section>
  );
}
