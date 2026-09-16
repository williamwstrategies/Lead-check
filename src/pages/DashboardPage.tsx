import { ArrowRight, Gauge } from 'lucide-react';
import type { LeadCheckReport } from '../../shared/leadcheck';
import { ScoreCard } from '../components/ScoreCard';

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
        <h1>See how well your website is helping your business get customers.</h1>
        <p>Run your first LeadCheck to create a simple Website Growth Report.</p>
        <button className="primary-action" type="button" onClick={() => onNavigate('/scan')}>
          Run My First LeadCheck
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
          <p>Your latest website scan is saved on this device.</p>
        </div>
        <button className="primary-action" type="button" onClick={() => onNavigate('/scan')}>
          Scan My Website
        </button>
      </div>
      <div className="dashboard-grid">
        <ScoreCard score={latest.score} large />
        {Object.values(latest.categoryScores).map(score => (
          <ScoreCard key={score.key} score={score} />
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
