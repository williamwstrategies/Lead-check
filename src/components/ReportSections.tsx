import { CheckCircle2, ExternalLink, HelpCircle } from 'lucide-react';
import type { FeatureFlags, LeadCheckReport, ReportCategoryKey } from '../../shared/leadcheck';
import { FindingCard } from './FindingCard';
import { ScoreCard } from './ScoreCard';
import { reportCategoryLabels, scoreWithDisplayLabel } from '../lib/reportLabels';
import { getScoreStatusView } from '../lib/reportStatus';

interface ReportSectionsProps {
  report: LeadCheckReport;
  features: FeatureFlags;
  onServiceHelp: () => void;
  serviceHelpUrl: string;
}

const categoryOrder: ReportCategoryKey[] = [
  'googleVisibility',
  'leadGeneration',
  'trust',
  'performance',
  'experience',
];

export function ReportSections({ report, features, onServiceHelp, serviceHelpUrl }: ReportSectionsProps) {
  const scoreStatus = getScoreStatusView(Math.round(report.score.score));
  const priorityFindings = report.opportunities.slice(0, 3);
  const recommendationHeading =
    scoreStatus.tone === 'strong' ? 'Remaining Lead Opportunities' : "What's Most Likely Costing You Leads";
  const recommendationCopy =
    scoreStatus.tone === 'strong'
      ? 'Your website is already doing a lot well. These are the clearest remaining improvements LeadCheck found.'
      : 'Start with the issues most likely to affect calls, quote requests, trust, or local visibility.';

  return (
    <div className="report-stack">
      <section className="report-section">
        <div className="section-heading">
          <p className="eyebrow">Website Lead Score</p>
          <h2>Your Website Lead Score</h2>
        </div>
        <ScoreCard score={scoreWithDisplayLabel(report.score, 'Website Lead Score')} large />
      </section>

      <section className="report-section" id="recommendations">
        <div className="section-heading">
          <p className="eyebrow">Highest Impact</p>
          <h2>{recommendationHeading}</h2>
          <p>{recommendationCopy}</p>
        </div>
        <div className="finding-grid">
          {priorityFindings.map(finding => (
            <FindingCard key={finding.id} finding={finding} priority />
          ))}
        </div>
      </section>

      <section className="report-section">
        <div className="section-heading">
          <p className="eyebrow">Good Signals</p>
          <h2>What's Already Working</h2>
        </div>
        <div className="positive-grid">
          {report.positiveFindings.map(item => (
            <article className="positive-card" key={item.id}>
              <CheckCircle2 size={20} aria-hidden="true" />
              <div>
                <span>Working Well</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="report-section">
        <div className="section-heading">
          <p className="eyebrow">On-Site Search Signals</p>
          <h2>Google Visibility</h2>
        </div>
        <ScoreCard score={scoreWithDisplayLabel(report.categoryScores.googleVisibility)} />
        <div className="mini-finding-list">
          {report.findings
            .filter(finding => finding.category === 'googleVisibility')
            .slice(0, 3)
            .map(finding => (
              <div className="mini-finding" key={finding.id}>
                <span className={`dot ${finding.status}`} aria-hidden="true" />
                <p>{finding.title}</p>
              </div>
            ))}
        </div>
      </section>

      {categoryOrder.slice(1).map(key => (
        <section className="report-section" key={key}>
          <div className="section-heading">
            <p className="eyebrow">{report.categoryScores[key].label}</p>
            <h2>{reportCategoryLabels[key]}</h2>
          </div>
          <ScoreCard score={scoreWithDisplayLabel(report.categoryScores[key])} />
          <div className="mini-finding-list">
            {report.findings
              .filter(finding => finding.category === key)
              .slice(0, 3)
              .map(finding => (
                <div className="mini-finding" key={finding.id}>
                  <span className={`dot ${finding.status}`} aria-hidden="true" />
                  <p>{finding.title}</p>
                </div>
              ))}
          </div>
        </section>
      ))}

      <section className="report-section">
        <details className="analysis-details">
          <summary>Full Website Lead Analysis</summary>
          <div className="analysis-groups">
            {categoryOrder.map(category => (
              <div key={category}>
                <h3>{reportCategoryLabels[category]}</h3>
                {report.findings.filter(finding => finding.category === category).length ? (
                  report.findings
                    .filter(finding => finding.category === category)
                    .map(finding => <FindingCard key={finding.id} finding={finding} />)
                ) : (
                  <p className="muted">No priority findings in this category.</p>
                )}
              </div>
            ))}
          </div>
        </details>
      </section>

      {features.enableServiceHelpCta ? (
        <section className="report-section service-help">
          <div>
            <HelpCircle size={22} aria-hidden="true" />
            <h2>Want Help Fixing What LeadCheck Found?</h2>
            <p>We can help you fix the issues that may be stopping your website from generating more leads.</p>
          </div>
          <a
            className="secondary-action"
            href={serviceHelpUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onServiceHelp}
          >
            Book a Free Website Strategy Call
            <ExternalLink size={17} aria-hidden="true" />
          </a>
        </section>
      ) : null}
    </div>
  );
}
