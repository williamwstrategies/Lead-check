import crypto from 'node:crypto';
import type {
  BusinessContext,
  CategoryScore,
  LeadCheckReport,
  NormalizedWebsite,
  PositiveFinding,
  ReportCategoryKey,
  ScanFinding,
  ScanRequest,
  ScanRecord,
  ScanScores,
} from '../../shared/leadcheck.js';
import { normalizeWebsiteUrl } from '../lib/url.js';

export interface WebsiteScanProvider {
  runWebsiteScan(input: ScanRequest): Promise<LeadCheckReport>;
}

interface MockScenario {
  scores: ScanScores;
  summary: string;
  status: string;
}

const CATEGORY_LABELS: Record<ReportCategoryKey, string> = {
  googleVisibility: 'Google Visibility',
  leadGeneration: 'Lead Generation',
  trust: 'Trust',
  performance: 'Website Performance',
  experience: 'Website Experience',
};

const SCENARIOS: Record<'default' | 'strong' | 'needs-work', MockScenario> = {
  default: {
    scores: {
      overallScore: 64,
      googleVisibilityScore: 58,
      leadGenerationScore: 61,
      trustScore: 82,
      performanceScore: 72,
      experienceScore: 76,
    },
    status: 'Needs Improvement',
    summary:
      'Your website has a solid foundation, but we found several opportunities that could help more potential customers find and contact your business.',
  },
  strong: {
    scores: {
      overallScore: 84,
      googleVisibilityScore: 78,
      leadGenerationScore: 86,
      trustScore: 91,
      performanceScore: 80,
      experienceScore: 85,
    },
    status: 'Looking Good',
    summary:
      'Your website is doing several important things well. The biggest gains are likely to come from sharpening search visibility and making the next step clearer on every key page.',
  },
  'needs-work': {
    scores: {
      overallScore: 42,
      googleVisibilityScore: 38,
      leadGenerationScore: 45,
      trustScore: 52,
      performanceScore: 49,
      experienceScore: 41,
    },
    status: 'Needs Attention',
    summary:
      'Your website may be making it harder than necessary for customers to understand your business, trust you, and take the next step.',
  },
};

function id(prefix: string, value: string): string {
  return `${prefix}_${crypto.createHash('sha1').update(value).digest('hex').slice(0, 16)}`;
}

function scanIdForInput(input: ScanRequest, website: NormalizedWebsite, timestamp: string): string {
  const requested = String(input.clientScanId || '').trim();
  if (/^scan_[a-zA-Z0-9_-]{12,80}$/.test(requested)) return requested;
  return id('scan', `${website.normalizedDomain}:${timestamp}`);
}

function scenarioForInput(input: ScanRequest, website: NormalizedWebsite): 'default' | 'strong' | 'needs-work' {
  if (input.mockScenario === 'default' || input.mockScenario === 'strong' || input.mockScenario === 'needs-work') {
    return input.mockScenario;
  }
  const firstByte = crypto.createHash('sha1').update(website.normalizedDomain).digest()[0] ?? 100;
  if (firstByte > 210) return 'strong';
  if (firstByte < 42) return 'needs-work';
  return 'default';
}

function scoreStatus(score: number): string {
  if (score >= 80) return 'Looking Good';
  if (score >= 65) return 'Good, with room for improvement';
  if (score >= 50) return 'Needs Improvement';
  return 'Needs Attention';
}

function categoryScore(key: ReportCategoryKey, score: number, summary: string): CategoryScore {
  return {
    key,
    label: CATEGORY_LABELS[key],
    score,
    maxScore: 100,
    status: scoreStatus(score),
    summary,
  };
}

function buildCategoryScores(scores: ScanScores): Record<ReportCategoryKey, CategoryScore> {
  return {
    googleVisibility: categoryScore(
      'googleVisibility',
      scores.googleVisibilityScore,
      'Can customers find you when they search for the services you offer?'
    ),
    leadGeneration: categoryScore(
      'leadGeneration',
      scores.leadGenerationScore,
      'Does your website make it easy for visitors to contact your business?'
    ),
    trust: categoryScore(
      'trust',
      scores.trustScore,
      'Does your website give customers enough reason to trust you?'
    ),
    performance: categoryScore(
      'performance',
      scores.performanceScore,
      'Are technical or usability issues getting in the way?'
    ),
    experience: categoryScore(
      'experience',
      scores.experienceScore,
      'Is the website easy to understand, navigate, and act on?'
    ),
  };
}

function finding(input: Omit<ScanFinding, 'id'>): ScanFinding {
  return {
    ...input,
    id: id('finding', `${input.findingKey}:${input.priority}:${input.title}`),
  };
}

function positive(input: Omit<PositiveFinding, 'id'>): PositiveFinding {
  return {
    ...input,
    id: id('positive', `${input.category}:${input.title}`),
  };
}

function mockFindings(): ScanFinding[] {
  return [
    finding({
      findingKey: 'contact_action_consistency',
      category: 'leadGeneration',
      severity: 'high',
      priority: 1,
      status: 'warning',
      title: 'Make it easier for customers to contact you',
      summary: "Your main contact action isn't consistently prominent across important pages.",
      whyItMatters: 'Customers who are ready to get in touch should never have to search for the next step.',
      recommendedAction: 'Use one clear contact action consistently across high-intent pages.',
      technicalDetails: { mock: true, futureDetector: 'primary_cta_visibility' },
    }),
    finding({
      findingKey: 'service_clarity',
      category: 'googleVisibility',
      severity: 'medium',
      priority: 2,
      status: 'warning',
      title: 'Strengthen how clearly your services are explained',
      summary: 'Some important service pages may not make the main service obvious enough.',
      whyItMatters:
        'Clear service pages help both potential customers and search engines understand what your business offers.',
      recommendedAction: 'Use clear page headings and thorough service descriptions.',
      technicalDetails: { mock: true, futureDetector: 'service_page_depth' },
    }),
    finding({
      findingKey: 'trust_depth',
      category: 'trust',
      severity: 'medium',
      priority: 3,
      status: 'warning',
      title: 'Add more proof that customers can trust your business',
      summary: 'Important pages could use stronger credibility signals.',
      whyItMatters: 'Visitors often compare multiple businesses before deciding who to contact.',
      recommendedAction:
        'Add relevant reviews, testimonials, proof of experience, completed work, or other trust signals.',
      technicalDetails: { mock: true, futureDetector: 'trust_signal_depth' },
    }),
    finding({
      findingKey: 'mobile_speed_review',
      category: 'performance',
      severity: 'medium',
      priority: 4,
      status: 'warning',
      title: 'Review pages that may feel slow on mobile',
      summary: 'Some pages may need performance improvements before real scanning confirms the details.',
      whyItMatters: 'A slow website can cause visitors to leave before they contact your business.',
      recommendedAction: 'Start with image size, unnecessary scripts, and anything that delays the first screen.',
      technicalDetails: { mock: true, futureDetector: 'mobile_performance' },
    }),
  ];
}

function mockPositiveFindings(): PositiveFinding[] {
  return [
    positive({
      category: 'performance',
      title: 'Your website is secure',
      summary: 'Visitors can browse with a secure connection.',
    }),
    positive({
      category: 'leadGeneration',
      title: 'Your phone number is easy to find',
      summary: 'Customers have at least one clear way to contact your business.',
    }),
    positive({
      category: 'trust',
      title: 'Business information is clear',
      summary: 'Basic business details are present and easy to understand.',
    }),
  ];
}

export function mockFailedScan(input: ScanRequest, reason = 'Mock scan failure requested.'): LeadCheckReport {
  const website = normalizeWebsiteUrl(input.url);
  const now = new Date().toISOString();
  const scan: ScanRecord = {
    id: scanIdForInput(input, website, now),
    websiteId: id('website', website.normalizedDomain),
    websiteUrl: website.url,
    normalizedDomain: website.normalizedDomain,
    status: 'failed',
    startedAt: now,
    completedAt: now,
    failureReason: reason,
  };

  return {
    id: id('report', `${scan.id}:failed`),
    scan,
    requestedWebsite: website,
    businessContext: {
      businessName: input.businessName,
      businessCategory: input.businessCategory,
      businessSubcategory: input.businessSubcategory,
      primaryCity: input.primaryCity,
    },
    createdAt: now,
    updatedAt: now,
    score: categoryScore('leadGeneration', 0, reason),
    categoryScores: buildCategoryScores({
      overallScore: 0,
      googleVisibilityScore: 0,
      leadGenerationScore: 0,
      trustScore: 0,
      performanceScore: 0,
      experienceScore: 0,
    }),
    opportunities: [],
    positiveFindings: [],
    findings: [],
    summary: reason,
    isMock: true,
  };
}

export class MockWebsiteScanProvider implements WebsiteScanProvider {
  async runWebsiteScan(input: ScanRequest): Promise<LeadCheckReport> {
    if (input.mockScenario === 'failed') {
      return mockFailedScan(input);
    }

    const website = normalizeWebsiteUrl(input.url);
    const scenario = SCENARIOS[scenarioForInput(input, website)];
    const now = new Date().toISOString();
    const scan: ScanRecord = {
      id: scanIdForInput(input, website, now),
      websiteId: id('website', website.normalizedDomain),
      websiteUrl: website.url,
      normalizedDomain: website.normalizedDomain,
      status: 'completed',
      startedAt: now,
      completedAt: now,
    };
    const context: BusinessContext = {
      businessName: input.businessName,
      businessCategory: input.businessCategory,
      businessSubcategory: input.businessSubcategory,
      primaryCity: input.primaryCity,
    };

    return {
      id: id('report', scan.id),
      scan,
      requestedWebsite: website,
      businessContext: context,
      createdAt: now,
      updatedAt: now,
      score: {
        ...categoryScore('leadGeneration', scenario.scores.overallScore, scenario.summary),
        label: 'LeadCheck Score',
        status: scenario.status,
      },
      categoryScores: buildCategoryScores(scenario.scores),
      opportunities: mockFindings().slice(0, 4),
      positiveFindings: mockPositiveFindings(),
      findings: mockFindings(),
      summary: scenario.summary,
      isMock: true,
    };
  }
}

export const mockScanner = new MockWebsiteScanProvider();
