import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  FileText,
  Gauge,
  LayoutDashboard,
  MousePointerClick,
  Search,
  ShieldCheck,
  TrendingUp,
  UsersRound,
  Wrench,
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
    copy: 'Can Google clearly understand what your business does and where you operate?',
  },
  {
    icon: TrendingUp,
    title: 'Lead Generation',
    copy: 'Does your website make it easy for potential customers to contact you and take the next step?',
  },
  {
    icon: ShieldCheck,
    title: 'Trust',
    copy: 'Does your website give visitors enough proof to feel confident choosing your business?',
  },
  {
    icon: Gauge,
    title: 'Website Performance',
    copy: 'Are technical problems creating a slower or less reliable experience?',
  },
  {
    icon: LayoutDashboard,
    title: 'Website Experience',
    copy: 'Can visitors quickly understand your business, services, and where to go next?',
  },
];

const reportCategories = [
  'Google Visibility',
  'Lead Generation',
  'Trust',
  'Website Performance',
  'Website Experience',
];

const valueCards = [
  {
    title: 'One clear score',
    copy: 'Understand the overall health of your website at a glance.',
  },
  {
    title: 'Your biggest opportunities',
    copy: 'See what deserves your attention first.',
  },
  {
    title: "What's already working",
    copy: "Know what you don't need to fix.",
  },
  {
    title: 'Plain-English explanations',
    copy: 'Understand why each issue matters without needing to know SEO or web development.',
  },
  {
    title: 'Actionable recommendations',
    copy: 'See what you can actually do about each problem.',
  },
];

const processSteps = [
  {
    icon: MousePointerClick,
    title: 'Enter your website',
    copy: 'Paste your business website URL.',
  },
  {
    icon: BarChart3,
    title: 'We scan your website',
    copy: 'LeadCheck reviews multiple pages across visibility, lead generation, trust, performance, and experience.',
  },
  {
    icon: FileText,
    title: 'Get your LeadCheck',
    copy: "Receive your score, biggest opportunities, and the things your website is already doing well.",
  },
  {
    icon: ClipboardCheck,
    title: 'Make the improvements',
    copy: 'Use the prioritized recommendations to decide what to fix first.',
  },
];

const businessTypes = [
  'Home Services',
  'Professional Services',
  'Real Estate',
  'Financial Services',
  'Automotive',
  'Health & Wellness',
  'Local Businesses',
];

const faqs = [
  {
    question: 'Is LeadCheck really free?',
    answer: 'Yes. LeadCheck is currently free to use and does not require a credit card.',
  },
  {
    question: 'What does LeadCheck analyze?',
    answer:
      'LeadCheck reviews observable website signals across Google visibility, lead generation, trust, website performance, and website experience.',
  },
  {
    question: 'How long does a scan take?',
    answer: 'Most scans finish in about a minute. Larger websites or slower sites can take a minute or two.',
  },
  {
    question: 'Will LeadCheck make changes to my website?',
    answer:
      'No. LeadCheck analyzes publicly accessible website information and provides recommendations. It does not modify your website.',
  },
  {
    question: 'Do I need to know anything about SEO or web design?',
    answer: 'No. Findings are explained in plain business language so you can understand what matters and why.',
  },
  {
    question: 'Does a high LeadCheck Score guarantee more customers?',
    answer:
      'No. The score evaluates website signals LeadCheck can observe. It does not guarantee leads, rankings, revenue, or business results.',
  },
];

export function LandingPage({ onStartScan, onNavigate }: LandingPageProps) {
  return (
    <div className="landing-page">
      <section className="hero-section" id="leadcheck-start">
        <div className="hero-copy">
          <p className="eyebrow">Free website analysis</p>
          <h1>Is your website actually helping you get customers?</h1>
          <p className="hero-lede">
            Get a free LeadCheck and see what's working, what could be holding your website back, and what you should
            improve first.
          </p>
          <UrlScanForm onSubmit={onStartScan} source="landing_hero" />
          <div className="hero-expectations" aria-label="LeadCheck scan expectations">
            <span>
              <CheckCircle2 size={16} aria-hidden="true" />
              Free website analysis
            </span>
            <span>
              <CheckCircle2 size={16} aria-hidden="true" />
              No credit card required
            </span>
            <span>
              <CheckCircle2 size={16} aria-hidden="true" />
              Most reports are ready in about a minute
            </span>
          </div>
        </div>

        <div className="hero-preview" aria-label="Example LeadCheck report preview">
          <p className="preview-label">Example LeadCheck Report</p>
          <div className="preview-window">
            <div className="preview-bar">
              <strong>{brand.name}</strong>
              <span>Website Growth Report</span>
            </div>
            <div className="preview-score-row">
              <div className="preview-score">74</div>
              <div>
                <p className="eyebrow">LeadCheck Score</p>
                <h2>Good foundation</h2>
                <p>
                  This example report shows the kind of plain-language website priorities LeadCheck creates after a
                  scan.
                </p>
              </div>
            </div>
            <div className="preview-priorities">
              <span>#1 Make the next step easier to find</span>
              <span>#2 Connect key pages more clearly to your services and location</span>
              <span>#3 Add stronger customer proof where visitors are deciding</span>
            </div>
            <div className="preview-working">
              <CheckCircle2 size={18} aria-hidden="true" />
              <div>
                <strong>What's working</strong>
                <p>Secure site, visible phone contact, and clear service language.</p>
              </div>
            </div>
            <div className="preview-category-row">
              {reportCategories.map(category => (
                <span key={category}>{category}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="content-band" id="what-it-checks">
        <div className="section-heading centered">
          <p className="eyebrow">What LeadCheck Checks</p>
          <h2>See what's helping — and hurting — your website</h2>
          <p>LeadCheck focuses on the website signals that can affect whether visitors understand, trust, and contact you.</p>
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

      <section className="content-band" id="how-it-works">
        <div className="section-heading centered">
          <p className="eyebrow">How It Works</p>
          <h2>From website to action plan in minutes</h2>
          <p>While we analyze your website, tell us where to save your results.</p>
        </div>
        <div className="steps-list process-steps">
          {processSteps.map((step, index) => {
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

      <section className="content-band split-band value-band">
        <div>
          <p className="eyebrow">What You Actually Get</p>
          <h2>Not another 50-page technical audit</h2>
          <p>LeadCheck turns website problems into a prioritized action plan you can actually understand.</p>
        </div>
        <div className="value-card-grid">
          {valueCards.map(item => (
            <div className="value-card" key={item.title}>
              <CheckCircle2 size={18} aria-hidden="true" />
              <div>
                <strong>{item.title}</strong>
                <p>{item.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="content-band example-finding-band">
        <div className="section-heading centered">
          <p className="eyebrow">Example Recommendation</p>
          <h2>See what a LeadCheck finding looks like</h2>
        </div>
        <article className="example-finding-card" aria-label="Example LeadCheck recommendation">
          <div className="finding-topline">
            <span className="priority-badge">Example</span>
            <span className="status-pill">Lead Generation</span>
          </div>
          <h3>Potential customers may have trouble finding the next step</h3>
          <div className="example-finding-grid">
            <div>
              <strong>What we found</strong>
              <p>Some important pages don't make the primary contact action immediately obvious.</p>
            </div>
            <div>
              <strong>Why it matters</strong>
              <p>Visitors who are ready to contact your business shouldn't have to search for the next step.</p>
            </div>
            <div>
              <strong>What to do</strong>
              <p>Use a clear primary call-to-action consistently across important service pages.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="content-band audience-band">
        <div className="section-heading centered">
          <p className="eyebrow">Who It's For</p>
          <h2>Built for small businesses that depend on their website</h2>
          <p>
            Whether customers call, book, request a quote, or visit your business, LeadCheck helps you understand
            whether your website is making that journey easier.
          </p>
        </div>
        <div className="business-type-grid">
          {businessTypes.map(type => (
            <span key={type}>
              <BriefcaseBusiness size={16} aria-hidden="true" />
              {type}
            </span>
          ))}
        </div>
      </section>

      <section className="content-band faq-band" id="faq">
        <div className="section-heading centered">
          <p className="eyebrow">FAQ</p>
          <h2>Questions before you scan</h2>
        </div>
        <div className="faq-list">
          {faqs.map(item => (
            <details className="faq-item" key={item.question}>
              <summary>
                <CircleHelp size={18} aria-hidden="true" />
                {item.question}
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
          <details className="faq-item">
            <summary>
              <UsersRound size={18} aria-hidden="true" />
              What happens to my information?
            </summary>
            <p>
              We use your information to associate your LeadCheck with the website you submitted and to follow up about
              your results. Read the{' '}
              <button className="inline-link" type="button" onClick={() => onNavigate('/privacy')}>
                Privacy Policy
              </button>
              .
            </p>
          </details>
        </div>
      </section>

      <section className="final-cta">
        <div className="final-cta-inner">
          <Wrench size={30} aria-hidden="true" />
          <p className="eyebrow">Free LeadCheck Report</p>
          <h2>Find out how well your website is working for your business</h2>
          <p>Get your free LeadCheck and see what to improve first.</p>
          <UrlScanForm onSubmit={onStartScan} compact source="landing_bottom" />
          <p className="final-cta-note">Free. No credit card required.</p>
          <button className="text-button cta-fallback" type="button" onClick={() => onNavigate('/scan')}>
            Open the scan page instead
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}
