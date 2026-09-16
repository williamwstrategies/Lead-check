import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ScanFinding } from '../../shared/leadcheck';
import { trackEvent } from '../lib/analytics';

interface FindingCardProps {
  finding: ScanFinding;
  priority?: boolean;
}

const categoryLabels = {
  googleVisibility: 'Google Visibility',
  leadGeneration: 'Lead Generation',
  trust: 'Trust',
  performance: 'Website Performance',
  experience: 'Website Experience',
};

export function FindingCard({ finding, priority = false }: FindingCardProps) {
  const [open, setOpen] = useState(false);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      void trackEvent('opportunity_opened', {
        findingKey: finding.findingKey,
        category: finding.category,
        priority: finding.priority,
      });
    }
  }

  return (
    <article className={priority ? 'finding-card priority' : 'finding-card'}>
      <div className="finding-topline">
        {priority ? <span className="priority-badge">#{finding.priority}</span> : null}
        <span className={`status-pill ${finding.status}`}>{categoryLabels[finding.category]}</span>
      </div>
      <h3>{finding.title}</h3>
      <p>{finding.summary}</p>
      <button className="text-button" type="button" onClick={toggle} aria-expanded={open}>
        {open ? <ChevronUp size={17} aria-hidden="true" /> : <ChevronDown size={17} aria-hidden="true" />}
        {open ? 'Hide recommendation' : 'View recommendation'}
      </button>
      {open ? (
        <div className="finding-details">
          <strong>Why this matters</strong>
          <p>{finding.whyItMatters}</p>
          <strong>What to do</strong>
          <p>{finding.recommendedAction}</p>
        </div>
      ) : null}
    </article>
  );
}
