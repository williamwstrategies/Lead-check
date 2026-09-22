export const BUSINESS_CATEGORIES = [
  'Home Services',
  'Professional Services',
  'Real Estate',
  'Financial Services',
  'Automotive',
  'Health & Wellness',
  'Retail',
  'Hospitality',
  'Other',
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

export type ScanStatus = 'queued' | 'running' | 'completed' | 'failed';

export type ReportCategoryKey =
  | 'googleVisibility'
  | 'leadGeneration'
  | 'trust'
  | 'performance'
  | 'experience';

export type FindingSeverity = 'low' | 'medium' | 'high';
export type FindingStatus = 'passed' | 'warning' | 'failed' | 'informational';

export interface FeatureFlags {
  enableServiceHelpCta: boolean;
  enableAiVisibility: boolean;
  enableCompetitorAnalysis: boolean;
}

export interface BusinessContext {
  businessName?: string;
  businessCategory?: BusinessCategory | '';
  businessSubcategory?: string;
  primaryCity?: string;
}

export interface WebsiteInput extends BusinessContext {
  url: string;
}

export interface AttributionFields {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  gclid?: string;
  referrer?: string;
}

export interface NormalizedWebsite {
  inputUrl: string;
  url: string;
  normalizedDomain: string;
}

export interface ScanRecord {
  id: string;
  websiteId: string;
  websiteUrl: string;
  normalizedDomain: string;
  status: ScanStatus;
  startedAt: string;
  completedAt?: string;
  failureReason?: string;
  scannerVersion?: string;
  scanMethod?: string;
  pagesAnalyzed?: number;
  failedPages?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export interface CategoryScore {
  key: ReportCategoryKey;
  label: string;
  score: number;
  maxScore: number;
  status: string;
  summary: string;
}

export interface ScanScores {
  overallScore: number;
  googleVisibilityScore: number;
  leadGenerationScore: number;
  trustScore: number;
  performanceScore: number;
  experienceScore: number;
}

export interface ScanFinding {
  id: string;
  findingKey: string;
  category: ReportCategoryKey;
  severity: FindingSeverity;
  priority: number;
  status: FindingStatus;
  title: string;
  summary: string;
  whyItMatters: string;
  recommendedAction: string;
  technicalDetails?: Record<string, unknown>;
  sourceData?: Record<string, unknown>;
}

export interface PositiveFinding {
  id: string;
  category: ReportCategoryKey;
  title: string;
  summary: string;
}

export interface LeadCheckReport {
  id: string;
  scan: ScanRecord;
  requestedWebsite: NormalizedWebsite;
  businessContext: BusinessContext;
  createdAt: string;
  updatedAt: string;
  score: CategoryScore;
  categoryScores: Record<ReportCategoryKey, CategoryScore>;
  opportunities: ScanFinding[];
  positiveFindings: PositiveFinding[];
  findings: ScanFinding[];
  summary: string;
  isMock: boolean;
  scannerVersion?: string;
  scanMetadata?: Record<string, unknown>;
}

export interface ScanRequest extends WebsiteInput {
  clientScanId?: string;
  mockScenario?: 'default' | 'strong' | 'needs-work' | 'failed';
}

export interface ScanResponse {
  report: LeadCheckReport;
}

export interface LeadCaptureRequest {
  firstName: string;
  phone: string;
  email: string;
  businessName: string;
  websiteUrl: string;
  scanId: string;
  attribution?: AttributionFields;
  idempotencyKey?: string;
}

export interface LeadRecord extends AttributionFields {
  id: string;
  first_name: string;
  phone: string;
  email: string;
  business_name: string;
  website_url: string;
  normalized_domain: string;
  scan_id: string;
  created_at: string;
}

export interface LeadCaptureResponse {
  lead: LeadRecord;
  deduplicated: boolean;
}

export interface ApiErrorBody {
  error: string;
  code: string;
  details?: unknown;
}

export const defaultFeatureFlags: FeatureFlags = {
  enableServiceHelpCta: true,
  enableAiVisibility: false,
  enableCompetitorAnalysis: false,
};
