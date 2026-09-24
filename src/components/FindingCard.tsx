import { useState } from 'react';
import { ChevronDown, ChevronUp, CircleAlert, Info, TriangleAlert } from 'lucide-react';
import type { ScanFinding } from '../../shared/leadcheck';
import { trackEvent } from '../lib/analytics';
import { reportCategoryLabels } from '../lib/reportLabels';
import { getFindingPriorityLabel, getFindingTone } from '../lib/reportStatus';

interface FindingCardProps {
  finding: ScanFinding;
  priority?: boolean;
}

export function FindingCard({ finding, priority = false }: FindingCardProps) {
  const [open, setOpen] = useState(false);
  const findingTone = getFindingTone(finding.severity);
  const priorityLabel = getFindingPriorityLabel(finding.severity);
  const PriorityIcon = findingTone === 'high' ? TriangleAlert : findingTone === 'medium' ? CircleAlert : Info;

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
    <article className={priority ? `finding-card priority ${findingTone}` : `finding-card ${findingTone}`}>
      <div className="finding-topline">
        {priority ? <span className="priority-badge">#{finding.priority}</span> : null}
        <span className={`severity-badge ${findingTone}`}>
          <PriorityIcon size={14} aria-hidden="true" />
          {priorityLabel}
        </span>
        <span className={`status-pill ${finding.status}`}>{reportCategoryLabels[finding.category]}</span>
      </div>
      <h3>{finding.title}</h3>
      <p>{finding.summary}</p>
      <button className="text-button" type="button" onClick={toggle} aria-expanded={open}>
        {open ? <ChevronUp size={17} aria-hidden="true" /> : <ChevronDown size={17} aria-hidden="true" />}
        {open ? 'Hide recommendation' : 'View recommendation'}
      </button>
      {open ? (
        <div className="finding-details">
          <strong>What we found</strong>
          <p>{finding.summary}</p>
          <strong>Why this matters</strong>
          <p>{finding.whyItMatters}</p>
          <strong>What to do next</strong>
          <p>{finding.recommendedAction}</p>
        </div>
      ) : null}
    </article>
  );
}
