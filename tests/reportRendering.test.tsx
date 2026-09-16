import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { LeadCheckReport } from '../shared/leadcheck';
import { ReportSections } from '../src/components/ReportSections';
import { ScoreCard } from '../src/components/ScoreCard';

const report: LeadCheckReport = {
  id: 'report_test',
  scan: {
    id: 'scan_test',
    websiteId: 'website_test',
    websiteUrl: 'https://example.com/',
    normalizedDomain: 'example.com',
    status: 'completed',
    startedAt: '2026-09-14T00:00:00.000Z',
    completedAt: '2026-09-14T00:00:01.000Z',
  },
  requestedWebsite: {
    inputUrl: 'example.com',
    url: 'https://example.com/',
    normalizedDomain: 'example.com',
  },
  businessContext: {},
  createdAt: '2026-09-14T00:00:00.000Z',
  updatedAt: '2026-09-14T00:00:01.000Z',
  score: {
    key: 'leadGeneration',
    label: 'LeadCheck Score',
    score: 64,
    maxScore: 100,
    status: 'Needs Improvement',
    summary: 'Your website has a solid foundation.',
  },
  categoryScores: {
    googleVisibility: {
      key: 'googleVisibility',
      label: 'Google Visibility',
      score: 58,
      maxScore: 100,
      status: 'Needs Improvement',
      summary: 'Can customers find you?',
    },
    leadGeneration: {
      key: 'leadGeneration',
      label: 'Lead Generation',
      score: 61,
      maxScore: 100,
      status: 'Needs Improvement',
      summary: 'Can customers contact you?',
    },
    trust: {
      key: 'trust',
      label: 'Trust',
      score: 82,
      maxScore: 100,
      status: 'Looking Good',
      summary: 'Trust signals are present.',
    },
    performance: {
      key: 'performance',
      label: 'Website Performance',
      score: 72,
      maxScore: 100,
      status: 'Good, with room for improvement',
      summary: 'Performance has room to improve.',
    },
    experience: {
      key: 'experience',
      label: 'Website Experience',
      score: 76,
      maxScore: 100,
      status: 'Good, with room for improvement',
      summary: 'The website is understandable.',
    },
  },
  opportunities: [
    {
      id: 'finding_1',
      findingKey: 'contact_action_consistency',
      category: 'leadGeneration',
      severity: 'high',
      priority: 1,
      status: 'warning',
      title: 'Make it easier for customers to contact you',
      summary: "Your main contact action isn't consistently prominent.",
      whyItMatters: 'Customers should never have to search for the next step.',
      recommendedAction: 'Use one clear contact action consistently.',
      technicalDetails: { mock: true },
    },
  ],
  positiveFindings: [
    {
      id: 'positive_1',
      category: 'performance',
      title: 'Your website is secure',
      summary: 'Visitors can browse with a secure connection.',
    },
  ],
  findings: [],
  summary: 'Your website has a solid foundation.',
  isMock: true,
};

describe('report rendering', () => {
  it('renders score cards accessibly', () => {
    render(<ScoreCard score={report.score} />);
    expect(screen.getByLabelText('LeadCheck Score score 64 out of 100')).toBeInTheDocument();
  });

  it('renders the required report hierarchy', () => {
    render(
      <ReportSections
        report={report}
        features={{
          enableServiceHelpCta: true,
          enableAiVisibility: false,
          enableCompetitorAnalysis: false,
        }}
        onServiceHelp={() => undefined}
      />
    );

    expect(screen.getByText('Your LeadCheck Score')).toBeInTheDocument();
    expect(screen.getByText('What You Should Fix First')).toBeInTheDocument();
    expect(screen.getByText("What's Working")).toBeInTheDocument();
    expect(screen.getAllByText('Google Visibility').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Lead Generation').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Trust').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Website Performance').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Website Experience').length).toBeGreaterThan(0);
    expect(screen.getByText('Full Website Analysis')).toBeInTheDocument();
  });
});
