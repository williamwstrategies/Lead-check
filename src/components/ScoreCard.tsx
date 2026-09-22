import type { CSSProperties } from 'react';
import type { CategoryScore } from '../../shared/leadcheck';
import { CheckCircle2, CircleAlert, TriangleAlert } from 'lucide-react';
import { getScoreStatusView } from '../lib/reportStatus';

interface ScoreCardProps {
  score: CategoryScore;
  large?: boolean;
}

export function ScoreCard({ score, large = false }: ScoreCardProps) {
  const value = Math.max(0, Math.min(100, Math.round(score.score)));
  const status = getScoreStatusView(value);
  const StatusIcon = status.tone === 'strong' ? CheckCircle2 : status.tone === 'needs-improvement' ? CircleAlert : TriangleAlert;

  return (
    <article
      className={large ? `score-card large ${status.tone}` : `score-card ${status.tone}`}
      aria-label={`${score.label} score ${value} out of 100, ${status.shortLabel}`}
      data-status={status.tone}
    >
      <div className="score-ring" style={{ '--score': value } as CSSProperties}>
        <span>{value}</span>
        <small>/100</small>
      </div>
      <div>
        <p className="eyebrow">{score.label}</p>
        <h3>
          <StatusIcon size={19} aria-hidden="true" />
          {status.shortLabel}
        </h3>
        <p>{score.summary}</p>
      </div>
    </article>
  );
}
