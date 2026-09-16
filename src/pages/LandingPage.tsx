import {
  BarChart3,
  CheckCircle2,
  FileText,
  Gauge,
  LayoutDashboard,
  MousePointerClick,
  Search,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import type { ScanRequest } from '../../shared/leadcheck';
import { UrlScanForm } from '../components/UrlScanForm';
import { brand } from '../config/brand';

interface LandingPageProps {
  onStartScan: (input: ScanRequest) => void;
  onNavigate: (path: string) => void;
}

const checkCards = [
  {
    icon: Search,
    title: 'Google Visibility',
    copy: 'See whether your website gives search engines clear information about your services and business.',
  },
  {
    icon: TrendingUp,
    title: 'Lead Generation',
    copy: 'See how easy your website makes it for potential customers to take the next step.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust',
    copy: 'See whether your website provides the proof customers look for before contacting a business.',
  },
  {
    icon: Gauge,
    title: 'Website Performance',
    copy: 'Find technical problems that could get in the way of your website experience.',
  },
  {
    icon: LayoutDashboard,
    title: 'Website Experience',
    copy: 'See how clearly visitors can navigate and understand your website.',
  },
];

const valueCards = [
  'Overall LeadCheck Score',
  'What you should fix first',
  "What's already working",
  'Plain-English explanations',
  'Actionable recommendations',
];

export function LandingPage({ onStartScan, onNavigate }: LandingPageProps) {
  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Free website analysis</p>
          <h1>Is your website actually helping you get customers?</h1>
          <p className="hero-lede">
            Get a free LeadCheck and see what's working, what could be holding your website back, and what you should
            improve first.
          </p>
          <div className="hero-trust-line">
            <span>Google Visibility</span>
            <span>Lead Generation</span>
            <span>Trust</span>
            <span>Performance</span>
            <span>Website Experience</span>
          </div>
          <UrlScanForm onSubmit={onStartScan} source="landing_hero" />
        </div>
        <div className="hero-preview" aria-label="Example LeadCheck report preview">
          <p className="preview-label">Example report preview</p>
          <div className="preview-window">
            <div className="preview-bar">
              <strong>{brand.name}</strong>
              <span>Website Growth Report</span>
            </div>
            <div className="preview-score-row">
              <div className="preview-score">64</div>
              <div>
                <p className="eyebrow">LeadCheck Score</p>
                <h2>Needs Improvement</h2>
                <p>We found 4 important opportunities to improve how this example website supports customer acquisition.</p>
              </div>
            </div>
            <div className="preview-priorities">
              <span>#1 Make it easier for customers to request a quote</span>
              <span>#2 Clarify services and locations on key pages</span>
              <span>#3 Add stronger proof of completed work</span>
            </div>
            <div className="preview-category-row">
              <span>Google Visibility</span>
              <span>Lead Generation</span>
              <span>Trust</span>
            </div>
          </div>
        </div>
      </section>

      <section className="content-band">
        <div className="section-heading centered">
          <p className="eyebrow">What LeadCheck Checks</p>
          <h2>See how your website is set up to turn visitors into customers.</h2>
        </div>
        <div className="check-grid">
          {checkCards.map(item => {
            const Icon = item.icon;
            return (
              <article className="check-card" key={item.title}>
                <Icon size={24} aria-hidden="true" />
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="content-band split-band value-band">
        <div>
          <p className="eyebrow">What You Get</p>
          <h2>Not another 50-page technical audit.</h2>
          <p>
            LeadCheck prioritizes what matters and explains it in plain language, so you can focus on what may help
            more customers find, trust, and contact your business.
          </p>
        </div>
        <div className="value-card-grid">
          {valueCards.map(item => (
            <div className="value-card" key={item}>
              <CheckCircle2 size={18} aria-hidden="true" />
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="content-band">
        <div className="section-heading centered">
          <p className="eyebrow">How It Works</p>
          <h2>Get a clear report in three simple steps.</h2>
        </div>
        <div className="steps-list three-steps">
          {[
            {
              icon: MousePointerClick,
              title: 'Enter your website',
              copy: 'Paste your business website URL.',
            },
            {
              icon: BarChart3,
              title: 'LeadCheck analyzes it',
              copy: 'We check your website across visibility, lead generation, trust, performance, and experience.',
            },
            {
              icon: FileText,
              title: 'Get your report',
              copy: "See what's working, what needs attention, and what you should improve first.",
            },
          ].map((step, index) => {
            const Icon = step.icon;
            return (
              <article className="step-card" key={step.title}>
                <span>{index + 1}</span>
                <Icon size={22} aria-hidden="true" />
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="final-cta">
        <div className="final-cta-inner">
          <p className="eyebrow">Free Website Growth Report</p>
          <h2>How well is your website actually working for your business?</h2>
          <p>Get your LeadCheck in about a minute. Free website analysis. No credit card required.</p>
          <UrlScanForm onSubmit={onStartScan} compact source="landing_bottom" />
          <button className="text-button cta-fallback" type="button" onClick={() => onNavigate('/scan')}>
            Open the scan page instead
          </button>
        </div>
      </section>
    </div>
  );
}
