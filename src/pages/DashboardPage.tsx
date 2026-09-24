import { ArrowRight, Gauge } from 'lucide-react';
import type { LeadCheckReport } from '../../shared/leadcheck';
import { ScoreCard } from '../components/ScoreCard';
import { scoreWithDisplayLabel } from '../lib/reportLabels';

interface DashboardPageProps {
  reports: LeadCheckReport[];
  onNavigate: (path: string) => void;
}

export function DashboardPage({ reports, onNavigate }: DashboardPageProps) {
  const latest = reports[0] || null;

  if (!latest) {
    return (
      <section className="page-panel empty-state">
        <Gauge size={40} aria-hidden="true" />
        <p className="eyebrow">Dashboard</p>
        <h1>See whether your website is helping you win more jobs.</h1>
        <p>Run your first LeadCheck to create a simple Website Lead Report.</p>
        <button className="primary-action" type="button" onClick={() => onNavigate('/scan')}>
          Check My Website Free
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>{latest.requestedWebsite.normalizedDomain}</h1>
          <p>Your latest Website Lead Report is saved on this device.</p>
        </div>
        <button className="primary-action" type="button" onClick={() => onNavigate('/scan')}>
          Check My Website
        </button>
      </div>
      <div className="dashboard-grid">
        <ScoreCard score={scoreWithDisplayLabel(latest.score, 'Website Lead Score')} large />
        {Object.values(latest.categoryScores).map(score => (
          <ScoreCard key={score.key} score={scoreWithDisplayLabel(score)} />
        ))}
      </div>
      <section className="page-panel">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Recent Scan</p>
            <h2>{latest.requestedWebsite.url}</h2>
          </div>
          <button className="secondary-action" type="button" onClick={() => onNavigate(`/reports/${latest.id}`)}>
            Open Report
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
      </section>
    </section>
  );
}
