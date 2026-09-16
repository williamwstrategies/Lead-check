import crypto from 'node:crypto';
import { createRequire } from 'node:module';
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
} from '../../shared/leadcheck.js';
import { assertPublicWebsiteUrl } from '../lib/url.js';
import type { WebsiteScanProvider } from './mockScanner.js';

export const SCANNER_VERSION = 'leadcheck-1.0-pitchproof-port';

type PitchproofCategoryKey = 'seoVisibility' | 'leadConversion' | 'localTrust' | 'technical' | 'visualTrust';
type PitchproofSeverity = 'fail' | 'partial';

interface PitchproofCategory {
  label: string;
  score: number;
  max: number;
  factorType?: string;
}

interface PitchproofIssue {
  key: string;
  label: string;
  severity: PitchproofSeverity;
  issue: string;
  fix: string;
  category: PitchproofCategoryKey | string;
  maxPoints: number;
  evidence?: unknown;
  confidence?: string;
}

interface PitchproofRecommendation {
  key: string;
  label: string;
  fix: string;
  impact: string;
  category: PitchproofCategoryKey | string;
  maxPoints: number;
}

interface PitchproofResult {
  url: string;
  total: number;
  rawTotal?: number;
  capApplied?: string | null;
  missingCritical?: number;
  isSinglePage?: boolean;
  pagesAnalyzed: number;
  pagesCrawled?: Array<{ url: string; type?: string; source?: string }>;
  scanMethod?: string;
  industry?: Record<string, unknown>;
  positives?: string[];
  scores?: Record<string, number>;
  categories?: Partial<Record<PitchproofCategoryKey, PitchproofCategory>>;
  issues?: PitchproofIssue[];
  recommendations?: PitchproofRecommendation[];
  criticalFlags?: Array<Record<string, unknown>>;
  evidenceFound?: Record<string, unknown>;
  brokenLinks?: Record<string, unknown>;
  visualTrust?: Record<string, unknown>;
  detectionSummary?: Record<string, unknown>;
  reviewEvidence?: Array<Record<string, unknown>>;
  reviewFound?: boolean;
}

interface PitchproofAnalyzer {
  analyzeWebsite(rawUrl: string, opts?: { debug?: boolean }): Promise<PitchproofResult>;
  calculateScore?: (checks: Record<string, unknown>) => unknown;
  extractInternalLinks?: (html: string, baseUrl: string) => string[];
}

interface LeadCheckFindingCopy {
  title: string;
  whatFound: string;
  why: string;
  action: string;
}

const require = createRequire(import.meta.url);
let cachedAnalyzer: PitchproofAnalyzer | null = null;

function loadPitchproofAnalyzer(): PitchproofAnalyzer {
  if (!cachedAnalyzer) {
    cachedAnalyzer = require('./pitchproofAnalyzer.cjs') as PitchproofAnalyzer;
  }
  return cachedAnalyzer;
}

const CATEGORY_LABELS: Record<ReportCategoryKey, string> = {
  googleVisibility: 'Google Visibility',
  leadGeneration: 'Lead Generation',
  trust: 'Trust',
  performance: 'Website Performance',
  experience: 'Website Experience',
};

const CATEGORY_SUMMARIES: Record<ReportCategoryKey, string> = {
  googleVisibility: 'Can customers and search engines clearly understand what you offer and where you work?',
  leadGeneration: 'Does the website make it easy for ready-to-buy visitors to contact you?',
  trust: 'Does the website give potential customers enough confidence to choose your business?',
  performance: 'Are technical, mobile, or crawl issues getting in the way?',
  experience: 'Does the website feel clear, credible, and easy to use?',
};

const CATEGORY_MAP: Record<string, ReportCategoryKey> = {
  seoVisibility: 'googleVisibility',
  leadConversion: 'leadGeneration',
  localTrust: 'trust',
  technical: 'performance',
  visualTrust: 'experience',
};

const CHECK_COPY: Record<string, LeadCheckFindingCopy> = {
  titleTag: {
    title: 'Make the page title clearer for local searches',
    whatFound: 'The website title does not clearly connect the main service with the area served.',
    why: 'Search results use this title to understand and describe the business. A vague title can make the site less relevant for local searches.',
    action: 'Use a concise title that combines the primary service, location, and business name.',
  },
  headingKeywords: {
    title: 'Clarify the main service in page headings',
    whatFound: 'Important headings do not clearly describe the service or location.',
    why: 'Headings help visitors and search engines quickly understand what the page is about.',
    action: 'Add one clear main heading and supporting headings that name the service and service area.',
  },
  metaDescription: {
    title: 'Improve the search result description',
    whatFound: 'The website description shown to search engines is missing, short, or too generic.',
    why: 'A useful description can help more searchers understand why they should click through to the site.',
    action: 'Write a short description that states the service, location, and best next step.',
  },
  servicesListed: {
    title: 'Make the services easier to understand',
    whatFound: 'The site does not clearly list enough specific services.',
    why: 'Customers need to confirm quickly that the business handles the job they need.',
    action: 'Add a clear services section with the main offerings named in plain language.',
  },
  servicePageDepth: {
    title: 'Create stronger pages for important services',
    whatFound: 'The scan did not find clearly dedicated pages for core services.',
    why: 'Separate service pages give customers more detail and create more opportunities to appear for specific searches.',
    action: 'Create or strengthen one page for each important service, with useful detail and a clear contact action.',
  },
  locationContent: {
    title: 'Make the service area clearer',
    whatFound: 'The website does not clearly show the city, region, or areas served.',
    why: 'Local customers and Google both need location context to understand when the business is relevant.',
    action: 'Add service area language near the top of key pages and in the footer or contact area.',
  },
  internalLinks: {
    title: 'Link key pages together more clearly',
    whatFound: 'The website has limited internal links to important pages like services, contact, reviews, or project work.',
    why: 'Clear links help visitors find what they need and help search engines discover important pages.',
    action: 'Add navigation and body links from the homepage to service, contact, trust, and project pages.',
  },
  reviewsVisible: {
    title: 'Add stronger customer proof',
    whatFound: 'The scan could not verify strong reviews, testimonials, star ratings, or customer feedback.',
    why: 'Potential customers often compare several businesses before reaching out. Proof from real customers lowers hesitation.',
    action: 'Add visible reviews or testimonials and link to public review profiles where available.',
  },
  googleSignals: {
    title: 'Strengthen local business signals',
    whatFound: 'The site has limited address, map, Google profile, or local business signals.',
    why: 'Local signals help customers confirm the business serves their area and can support local search visibility.',
    action: 'Add a clear address or service-area details, map/contact information, and relevant local business markup where appropriate.',
  },
  proofOfWork: {
    title: 'Show more proof of completed work',
    whatFound: 'The scan found limited project photos, gallery content, portfolio proof, or examples of work.',
    why: 'Seeing real work helps customers judge quality before they decide to contact a business.',
    action: 'Add project photos, before-and-after examples, case studies, or a small gallery of completed work.',
  },
  professionalSignals: {
    title: 'Make credentials easier to see',
    whatFound: 'Credentials such as licensing, insurance, certifications, or years of experience were not clearly visible.',
    why: 'Clear credentials help customers feel safer choosing a business they have not worked with before.',
    action: 'Display the most important credentials near the top of key pages and close to contact actions.',
  },
  riskReversal: {
    title: 'Reduce hesitation before customers contact you',
    whatFound: 'The website does not clearly mention helpful reassurance such as free estimates, warranties, or guarantees.',
    why: 'Reassurance can make it easier for visitors to take the next step instead of continuing to compare options.',
    action: 'Add honest reassurance language near calls to action, such as free estimates, warranty details, or response-time expectations.',
  },
  cta: {
    title: 'Make the next step obvious',
    whatFound: 'Customers may not have a clear next step when they land on the website.',
    why: 'Someone ready to request help should not have to search for a way to contact the business.',
    action: 'Add one prominent primary action, such as Request a Quote, Call Now, or Book Service, near the top and repeat it on key pages.',
  },
  phone: {
    title: 'Make phone contact easier',
    whatFound: 'The scan could not verify a clearly visible and clickable phone number.',
    why: 'Many local-service customers prefer to call, especially on mobile devices.',
    action: 'Place a visible click-to-call phone number in the header or another persistent location.',
  },
  contactForm: {
    title: 'Add a simple way to request help online',
    whatFound: 'The scan did not find a clear contact form, booking widget, or lead capture option.',
    why: 'Not every visitor wants to call. Without another option, ready customers may leave.',
    action: 'Add a short form or booking option that asks only for the information needed to respond.',
  },
  contactMethods: {
    title: 'Offer more than one contact option',
    whatFound: 'The website appears to have too few contact methods.',
    why: 'Different customers prefer phone, forms, email, chat, or booking tools. More legitimate options reduce friction.',
    action: 'Offer at least a clickable phone number plus one or two other clear contact options.',
  },
  aboveFold: {
    title: 'Clarify the first screen of the homepage',
    whatFound: 'The top of the homepage does not clearly combine what the business does, where it works, and what to do next.',
    why: 'Visitors decide quickly whether they are in the right place. The first screen needs to answer their main questions.',
    action: 'Rewrite the first section so the service, location, and primary contact action are visible together.',
  },
  conversionPath: {
    title: 'Reduce friction in the contact path',
    whatFound: 'The path from visitor to lead may be longer or more difficult than necessary.',
    why: 'Extra steps and long forms can reduce the number of people who finish contacting the business.',
    action: 'Keep forms short, keep phone contact visible, and make the primary action easy to complete.',
  },
  https: {
    title: 'Secure the website connection',
    whatFound: 'The website did not load securely over HTTPS.',
    why: 'Browsers may warn visitors when a website is not secure, which can reduce trust.',
    action: 'Enable HTTPS with an SSL certificate through the website host.',
  },
  mobileSpeed: {
    title: 'Review mobile speed',
    whatFound: 'Mobile performance could be improved or could not be fully verified automatically.',
    why: 'Slow pages can cause visitors to leave before they call or submit a form.',
    action: 'Start with image optimization, unnecessary scripts, and other items identified by a PageSpeed review.',
  },
  mobileUsability: {
    title: 'Improve mobile usability signals',
    whatFound: 'The scan found limited evidence that the site is fully mobile-friendly.',
    why: 'Most local customers browse on phones. A difficult mobile experience can cost leads.',
    action: 'Confirm the site uses a responsive layout, readable text, and a proper mobile viewport.',
  },
  crawlHealth: {
    title: 'Make important content easier to crawl',
    whatFound: 'The scanner had limited ability to crawl or render the site.',
    why: 'If automated systems cannot access important content, customers and search engines may also miss it.',
    action: 'Make sure important service, trust, and contact content is available in crawlable page content.',
  },
  visualTrust: {
    title: 'Improve visual trust and clarity',
    whatFound: 'The website presentation may not feel as clear or trustworthy as it could.',
    why: 'A professional, easy-to-scan layout can make visitors more comfortable contacting the business.',
    action: 'Improve spacing, hierarchy, image quality, readability, and primary contact visibility.',
  },
  limitedSiteStructure: {
    title: 'Expand beyond a single-page site',
    whatFound: 'The site appears to have very limited page structure.',
    why: 'A very small site has fewer chances to explain services, show proof, and appear for specific searches.',
    action: 'Add dedicated pages for core services, service areas, customer proof, and contact details.',
  },
};

export class RealScanError extends Error {
  code: string;
  cause?: unknown;

  constructor(message: string, code = 'scan_failed', cause?: unknown) {
    super(message);
    this.name = 'RealScanError';
    this.code = code;
    this.cause = cause;
  }
}

function id(prefix: string, value: string): string {
  return `${prefix}_${crypto.createHash('sha1').update(value).digest('hex').slice(0, 16)}`;
}

function scanIdForInput(input: ScanRequest, website: NormalizedWebsite, startedAt: Date): string {
  const requested = String(input.clientScanId || '').trim();
  if (/^scan_[a-zA-Z0-9_-]{12,80}$/.test(requested)) return requested;
  return id('scan', `${website.normalizedDomain}:${startedAt.toISOString()}:${SCANNER_VERSION}`);
}

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreStatus(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs Improvement';
  return 'Needs Attention';
}

function categoryScore(key: ReportCategoryKey, score: number, summary = CATEGORY_SUMMARIES[key]): CategoryScore {
  return {
    key,
    label: CATEGORY_LABELS[key],
    score: clampScore(score),
    maxScore: 100,
    status: scoreStatus(score),
    summary,
  };
}

function scaledCategoryScore(category?: PitchproofCategory): number {
  if (!category || !Number.isFinite(category.score) || !Number.isFinite(category.max) || category.max <= 0) return 0;
  return (category.score / category.max) * 100;
}

function buildCategoryScores(result: PitchproofResult): Record<ReportCategoryKey, CategoryScore> {
  return {
    googleVisibility: categoryScore('googleVisibility', scaledCategoryScore(result.categories?.seoVisibility)),
    leadGeneration: categoryScore('leadGeneration', scaledCategoryScore(result.categories?.leadConversion)),
    trust: categoryScore('trust', scaledCategoryScore(result.categories?.localTrust)),
    performance: categoryScore('performance', scaledCategoryScore(result.categories?.technical)),
    experience: categoryScore('experience', scaledCategoryScore(result.categories?.visualTrust)),
  };
}

function mapCategory(category: string): ReportCategoryKey {
  return CATEGORY_MAP[category] || 'leadGeneration';
}

function safeString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function fallbackCopy(issue: PitchproofIssue, recommendation?: PitchproofRecommendation): LeadCheckFindingCopy {
  return {
    title: issue.label || 'Review this website opportunity',
    whatFound: issue.issue || 'LeadCheck found an opportunity to improve this part of the website.',
    why: recommendation?.impact || 'Improving this can make the website clearer, more trustworthy, or easier to act on.',
    action: recommendation?.fix || issue.fix || 'Review this area and improve the clearest customer next step.',
  };
}

function severityFor(issue: PitchproofIssue): ScanFinding['severity'] {
  if (issue.severity === 'partial') return issue.maxPoints >= 6 ? 'medium' : 'low';
  return issue.maxPoints >= 6 || ['cta', 'phone', 'contactForm', 'reviewsVisible'].includes(issue.key) ? 'high' : 'medium';
}

function statusFor(issue: PitchproofIssue): ScanFinding['status'] {
  return issue.severity === 'fail' ? 'failed' : 'warning';
}

function normalizeFindings(result: PitchproofResult): ScanFinding[] {
  const issues = [...(result.issues || [])];
  const recsByKey = new Map((result.recommendations || []).map(item => [item.key, item]));

  return issues
    .sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === 'fail' ? -1 : 1;
      return (b.maxPoints || 0) - (a.maxPoints || 0);
    })
    .map((issue, index) => {
      const copy = CHECK_COPY[issue.key] || fallbackCopy(issue, recsByKey.get(issue.key));
      const category = mapCategory(issue.category);
      const priority = index + 1;
      return {
        id: id('finding', `${issue.key}:${priority}:${safeString(issue.evidence)}`),
        findingKey: issue.key,
        category,
        severity: severityFor(issue),
        priority,
        status: statusFor(issue),
        title: copy.title,
        summary: copy.whatFound,
        whyItMatters: copy.why,
        recommendedAction: copy.action,
        technicalDetails: {
          scannerVersion: SCANNER_VERSION,
          checkId: issue.key,
          pitchproofCategory: issue.category,
          pitchproofLabel: issue.label,
          pitchproofSeverity: issue.severity,
          maxPoints: issue.maxPoints,
          confidence: issue.confidence || null,
        },
        sourceData: {
          pitchproofIssue: issue.issue,
          pitchproofFix: issue.fix,
          pitchproofEvidence: issue.evidence ?? null,
          recommendation: recsByKey.get(issue.key) || null,
        },
      };
    });
}

function inferPositiveCategory(text: string): ReportCategoryKey {
  const value = text.toLowerCase();
  if (/phone|call|form|booking|action|lead|contact/.test(value)) return 'leadGeneration';
  if (/review|testimonial|trust|project|gallery|credential|proof/.test(value)) return 'trust';
  if (/https|secure|speed|crawl|mobile/.test(value)) return 'performance';
  if (/service|google|search|title|heading|location/.test(value)) return 'googleVisibility';
  if (/visual|professional|presentation|readability/.test(value)) return 'experience';
  return 'leadGeneration';
}

function positiveTitle(text: string): string {
  if (/https|secure/i.test(text)) return 'Your website uses a secure connection';
  if (/phone|call/i.test(text)) return 'Customers have a phone contact option';
  if (/review|testimonial/i.test(text)) return 'The site shows some trust signals';
  if (/service/i.test(text)) return 'The site mentions core services';
  if (/form|booking|chat/i.test(text)) return 'Visitors have a way to take action';
  if (/visual|professional/i.test(text)) return 'The site has useful visual trust signals';
  if (/project|gallery/i.test(text)) return 'The site includes proof of work';
  return 'LeadCheck found a positive signal';
}

function normalizePositives(result: PitchproofResult): PositiveFinding[] {
  return (result.positives || []).slice(0, 7).map(text => ({
    id: id('positive', text),
    category: inferPositiveCategory(text),
    title: positiveTitle(text),
    summary: text,
  }));
}

function reportSummary(score: number, findingCount: number): string {
  if (score >= 85) return 'Your website has a strong foundation for turning visitors into customers. The remaining opportunities are mostly refinements.';
  if (score >= 70) return 'Your website is doing several important things well, with a few improvements that could make it easier for customers to find and contact you.';
  if (score >= 50) return `LeadCheck found ${findingCount} practical opportunities that could help customers understand, trust, and contact your business more easily.`;
  return 'Your website may be making it harder than necessary for customers to understand your services, trust the business, or take the next step.';
}

export function normalizePitchproofResult(
  result: PitchproofResult,
  website: NormalizedWebsite,
  input: ScanRequest,
  startedAt: Date,
  completedAt: Date
): LeadCheckReport {
  const scores = buildCategoryScores(result);
  const findings = normalizeFindings(result);
  const score = clampScore(result.total);
  const context: BusinessContext = {
    businessName: input.businessName,
    businessCategory: input.businessCategory,
    businessSubcategory: input.businessSubcategory,
    primaryCity: input.primaryCity,
  };
  const started = startedAt.toISOString();
  const completed = completedAt.toISOString();
  const scanId = scanIdForInput(input, website, startedAt);
  const scan: ScanRecord = {
    id: scanId,
    websiteId: id('website', website.normalizedDomain),
    websiteUrl: result.url || website.url,
    normalizedDomain: website.normalizedDomain,
    status: 'completed',
    startedAt: started,
    completedAt: completed,
    scannerVersion: SCANNER_VERSION,
    scanMethod: result.scanMethod || 'unknown',
    pagesAnalyzed: result.pagesAnalyzed || 0,
    failedPages: 0,
    durationMs: completedAt.getTime() - startedAt.getTime(),
    metadata: {
      rawTotal: result.rawTotal ?? null,
      capApplied: result.capApplied ?? null,
      missingCritical: result.missingCritical ?? null,
      isSinglePage: Boolean(result.isSinglePage),
    },
  };

  return {
    id: id('report', scanId),
    scan,
    requestedWebsite: {
      ...website,
      url: result.url || website.url,
    },
    businessContext: context,
    createdAt: completed,
    updatedAt: completed,
    score: {
      key: 'leadGeneration',
      label: 'LeadCheck Score',
      score,
      maxScore: 100,
      status: scoreStatus(score),
      summary: reportSummary(score, findings.length),
    },
    categoryScores: scores,
    opportunities: findings.slice(0, 5),
    positiveFindings: normalizePositives(result),
    findings,
    summary: reportSummary(score, findings.length),
    isMock: false,
    scannerVersion: SCANNER_VERSION,
    scanMetadata: {
      scannerVersion: SCANNER_VERSION,
      scanMethod: result.scanMethod || 'unknown',
      pagesCrawled: result.pagesCrawled || [],
      pagesAnalyzed: result.pagesAnalyzed || 0,
      rawTotal: result.rawTotal ?? null,
      capApplied: result.capApplied ?? null,
      missingCritical: result.missingCritical ?? null,
      isSinglePage: Boolean(result.isSinglePage),
      criticalFlags: result.criticalFlags || [],
      evidenceFound: result.evidenceFound || {},
      brokenLinks: result.brokenLinks || {},
      visualTrust: result.visualTrust || {},
      detectionSummary: result.detectionSummary || {},
      reviewEvidence: result.reviewEvidence || [],
      reviewFound: Boolean(result.reviewFound),
    },
  };
}

function classifyScanError(error: unknown): string {
  const message = error instanceof Error ? error.message : safeString(error);
  if (/timeout/i.test(message)) return 'scan_timeout';
  if (/dns|enotfound|getaddrinfo/i.test(message)) return 'dns_lookup_failed';
  if (/ssl|certificate|tls/i.test(message)) return 'ssl_error';
  if (/blocked|private|internal|scheme/i.test(message)) return 'unsafe_url_blocked';
  if (/too many redirects|redirect/i.test(message)) return 'redirect_error';
  return 'scan_failed';
}

export class RealWebsiteScanProvider implements WebsiteScanProvider {
  private analyzer?: PitchproofAnalyzer;

  constructor(analyzer?: PitchproofAnalyzer) {
    this.analyzer = analyzer;
  }

  async runWebsiteScan(input: ScanRequest): Promise<LeadCheckReport> {
    const website = await assertPublicWebsiteUrl(String(input?.url || ''));
    const startedAt = new Date();
    const scanId = scanIdForInput(input, website, startedAt);

    console.info('[LeadCheck] real scan started', {
      scanId,
      domain: website.normalizedDomain,
      scannerVersion: SCANNER_VERSION,
      startedAt: startedAt.toISOString(),
    });

    try {
      const result = await (this.analyzer || loadPitchproofAnalyzer()).analyzeWebsite(website.url, { debug: false });
      const completedAt = new Date();
      const report = normalizePitchproofResult(result, website, input, startedAt, completedAt);

      console.info('[LeadCheck] real scan completed', {
        scanId: report.scan.id,
        domain: website.normalizedDomain,
        scannerVersion: SCANNER_VERSION,
        durationMs: report.scan.durationMs,
        pageCount: report.scan.pagesAnalyzed,
        failedPageCount: report.scan.failedPages,
        score: report.score.score,
      });

      return report;
    } catch (error) {
      const completedAt = new Date();
      const code = classifyScanError(error);
      console.error('[LeadCheck] real scan failed', {
        scanId,
        domain: website.normalizedDomain,
        scannerVersion: SCANNER_VERSION,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        errorCategory: code,
        error: error instanceof Error ? error.message : safeString(error),
      });

      throw new RealScanError(
        "We couldn't complete the scan for this website. Please check the URL and try again.",
        code,
        error
      );
    }
  }
}

export const realScanner = new RealWebsiteScanProvider();
