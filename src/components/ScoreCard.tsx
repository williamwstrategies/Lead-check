import type { CSSProperties } from 'react';
import type { CategoryScore } from '../../shared/leadcheck';

interface ScoreCardProps {
  score: CategoryScore;
  large?: boolean;
}

export function ScoreCard({ score, large = false }: ScoreCardProps) {
  const value = Math.max(0, Math.min(100, Math.round(score.score)));
  return (
    <article className={large ? 'score-card large' : 'score-card'} aria-label={`${score.label} score ${value} out of 100`}>
      <div className="score-ring" style={{ '--score': value } as CSSProperties}>
        <span>{value}</span>
        <small>/100</small>
      </div>
      <div>
        <p className="eyebrow">{score.label}</p>
        <h3>{score.status}</h3>
        <p>{score.summary}</p>
      </div>
    </article>
  );
}
