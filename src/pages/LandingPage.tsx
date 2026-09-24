import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  FileText,
  Gauge,
  Hammer,
  Home,
  Images,
  MapPin,
  MousePointerClick,
  PhoneCall,
  Search,
  ShieldCheck,
  Smartphone,
  Star,
  Wrench,
} from 'lucide-react';
import type { ScanRequest } from '../../shared/leadcheck';
import { UrlScanForm } from '../components/UrlScanForm';
import { brand } from '../config/brand';

interface LandingPageProps {
  onStartScan: (input: ScanRequest) => void;
  onNavigate: (path: string) => void;
}

const industries = [
  'Roofing',
  'Landscaping',
  'Renovations',
  'HVAC',
  'Plumbing',
  'Electrical',
  'Painting',
  'Excavation',
  'Flooring',
  'General Contractors',
];

const contractorQuestions = [
  {
    icon: PhoneCall,
    title: 'Can homeowners easily request a quote?',
    copy: 'People should know exactly how to call, book, or ask for an estimate without hunting around your site.',
  },
  {
    icon: ShieldCheck,
    title: 'Does your website give people enough reason to trust you?',
    copy: 'Reviews, project photos, warranties, and clear business details can reduce hesitation before someone reaches out.',
  },
  {
    icon: MapPin,
    title: 'Can Google understand where you provide services?',
    copy: 'Your services and service areas need to be clear enough for local homeowners and Google to connect the dots.',
  },
  {
    icon: Images,
    title: "Does your site clearly show the work you've completed?",
    copy: 'Real projects and before-and-after proof can make a contractor feel safer to choose.',
  },
  {
    icon: Smartphone,
    title: 'Does the site work properly on a phone?',
    copy: 'Many homeowners check contractors from a phone. Slow, cramped, or confusing pages can cost calls.',
  },
  {
    icon: Hammer,
    title: 'Are your services clearly explained?',
    copy: 'Visitors should quickly understand what you do, who you help, and why they should contact you.',
  },
];

const valueCards = [
  {
    icon: Gauge,
    title: 'Your Website Lead Score',
    copy: 'See how well your website is set up to turn visitors into calls, quote requests, and potential jobs.',
  },
  {
    icon: Search,
    title: 'What could be costing you leads',
    copy: 'See the highest-priority problems first, explained in plain business language.',
  },
  {
    icon: CheckCircle2,
    title: "What's already working",
    copy: 'Know what your website is already doing well so you do not waste time fixing the wrong things.',
  },
  {
    icon: ClipboardCheck,
    title: 'What to fix first',
    copy: 'Get clear recommendations without needing to learn SEO, web design, or website jargon.',
  },
];

const processSteps = [
  {
    icon: MousePointerClick,
    title: 'Enter your website',
    copy: 'Paste your contractor or home-service business website URL.',
  },
  {
    icon: BarChart3,
    title: 'LeadCheck analyzes it',
    copy: 'We check the website signals that can affect calls, quote requests, trust, and local visibility.',
  },
  {
    icon: Gauge,
    title: 'Get your Website Lead Score',
    copy: 'See how ready your website is to turn visitors into leads.',
  },
  {
    icon: FileText,
    title: 'See what could be costing you leads',
    copy: 'Review the biggest opportunities and the things already working.',
  },
  {
    icon: Wrench,
    title: 'Fix the biggest opportunities',
    copy: 'Use the report to decide what deserves attention first.',
  },
];

const faqs = [
  {
    question: 'Is LeadCheck really free?',
    answer: 'Yes. LeadCheck is currently free to use and does not require a credit card.',
  },
  {
    question: 'Is this only for contractors?',
    answer:
      'LeadCheck is built for contractors and home-service businesses, but other local businesses can still run a scan.',
  },
  {
    question: 'Do I need to understand SEO?',
    answer:
      'No. LeadCheck translates website issues into plain language about calls, quotes, trust, Google, and local customers.',
  },
  {
    question: 'How long does a scan take?',
    answer: 'Most scans finish in about a minute. Larger or slower websites can take a little longer.',
  },
  {
    question: 'Will LeadCheck change my website?',
    answer:
      'No. LeadCheck reviews publicly available website information and gives recommendations. It does not modify your website.',
  },
  {
    question: 'Does a high Website Lead Score guarantee more jobs?',
    answer:
      'No. The score reflects website signals LeadCheck can observe. It does not guarantee leads, rankings, revenue, or business results.',
  },
];

export function LandingPage({ onStartScan, onNavigate }: LandingPageProps) {
  return (
    <div className="landing-page contractor-landing">
      <section className="hero-section contractor-hero" id="leadcheck-start">
        <div className="hero-copy">
          <p className="eyebrow">Built for contractors & home-service businesses</p>
          <h1>Find Out Why You&apos;re Still Relying on Referrals</h1>
          <p className="hero-lede">
            Your reputation is bringing you business. Your website should be too. LeadCheck finds the issues that could
            be stopping local homeowners from calling, requesting a quote, or choosing your business.
          </p>
          <UrlScanForm onSubmit={onStartScan} source="landing_hero" ctaLabel="Check My Website Free" />
          <div className="hero-expectations" aria-label="LeadCheck scan expectations">
            <span>
              <CheckCircle2 size={16} aria-hidden="true" />
              Free
            </span>
            <span>
              <CheckCircle2 size={16} aria-hidden="true" />
              Takes about 60 seconds
            </span>
            <span>
              <CheckCircle2 size={16} aria-hidden="true" />
              No credit card
            </span>
          </div>
        </div>

        <div className="contractor-report-preview" aria-label="Example Website Lead Score report preview">
          <div className="preview-window">
            <div className="preview-bar">
              <strong>{brand.name}</strong>
              <span>Website Lead Report</span>
            </div>
            <div className="preview-score-row">
              <div className="preview-score">58</div>
              <div>
                <p className="eyebrow">Website Lead Score</p>
                <h2>Important lead opportunities</h2>
                <p>Your website has several issues that could make it harder to turn visitors into calls and quote requests.</p>
              </div>
            </div>
            <div className="preview-priorities contractor-preview-list">
              <span className="preview-alert high">Visitors do not have an obvious way to request a quote</span>
              <span className="preview-alert high">Your service areas are not clearly connected to your services</span>
              <span className="preview-alert medium">Homeowners are not being shown enough proof of your work</span>
              <span className="preview-alert good">Your phone number is easy to find</span>
            </div>
          </div>
        </div>
      </section>

      <section className="content-band industry-band">
        <div className="section-heading centered">
          <p className="eyebrow">Who LeadCheck Is For</p>
          <h2>Built for local companies that win work in people&apos;s homes</h2>
          <p>
            LeadCheck is made for business owners who want more calls, quote requests, estimates, and jobs from their
            website.
          </p>
        </div>
        <div className="industry-grid">
          {industries.map(industry => (
            <span key={industry}>
              <BriefcaseBusiness size={16} aria-hidden="true" />
              {industry}
            </span>
          ))}
        </div>
      </section>

      <section className="content-band split-band referral-band">
        <div>
          <p className="eyebrow">The Problem</p>
          <h2>Your referrals are working. But is your website?</h2>
          <p>
            Referrals are valuable. LeadCheck is not here to replace them. The problem is when referrals are the only
            predictable source of new business while your website quietly sits there doing very little.
          </p>
          <p>
            Local homeowners may already be checking your website and leaving without calling because the next step,
            service area, proof, or reason to choose you is not clear enough.
          </p>
        </div>
        <div className="referral-proof-panel" aria-label="Referral and website lead comparison">
          <div>
            <Home size={22} aria-hidden="true" />
            <strong>Referrals</strong>
            <p>People already trust your name.</p>
          </div>
          <div>
            <Search size={22} aria-hidden="true" />
            <strong>Your Website</strong>
            <p>Should help turn local searches and visitors into calls too.</p>
          </div>
        </div>
      </section>

      <section className="content-band" id="what-it-checks">
        <div className="section-heading centered">
          <p className="eyebrow">What LeadCheck Looks For</p>
          <h2>Questions contractors actually care about</h2>
          <p>LeadCheck checks whether your website helps homeowners understand, trust, and contact your business.</p>
        </div>
        <div className="check-grid contractor-question-grid">
          {contractorQuestions.map(item => {
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

      <section className="content-band report-preview-band">
        <div className="section-heading centered">
          <p className="eyebrow">Report Preview</p>
          <h2>See what could be costing you calls and quote requests</h2>
        </div>
        <article className="example-finding-card contractor-report-card" aria-label="Example LeadCheck report preview">
          <div className="finding-topline">
            <span className="priority-badge">Example</span>
            <span className="status-pill">Turning Visitors Into Leads</span>
          </div>
          <h3>Visitors are not given an obvious next step</h3>
          <div className="example-finding-grid">
            <div>
              <strong>What we found</strong>
              <p>Important pages do not make it immediately clear how to request a quote or estimate.</p>
            </div>
            <div>
              <strong>Why this matters</strong>
              <p>Someone looking for a contractor may leave if they cannot quickly see how to contact you.</p>
            </div>
            <div>
              <strong>What to do next</strong>
              <p>Add a prominent Request a Quote or Get an Estimate button near the top of key pages.</p>
            </div>
          </div>
          <button className="primary-action report-preview-cta" type="button" onClick={() => onNavigate('/scan')}>
            Check My Website Free
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </article>
      </section>

      <section className="content-band split-band value-band">
        <div>
          <p className="eyebrow">What You Get</p>
          <h2>A plain-language view of why your website may not be bringing in jobs</h2>
          <p>LeadCheck turns website problems into clear priorities a contractor can understand and act on.</p>
        </div>
        <div className="value-card-grid">
          {valueCards.map(item => {
            const Icon = item.icon;
            return (
              <div className="value-card" key={item.title}>
                <Icon size={18} aria-hidden="true" />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.copy}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="content-band" id="how-it-works">
        <div className="section-heading centered">
          <p className="eyebrow">How It Works</p>
          <h2>From website to lead priorities in minutes</h2>
          <p>No account required to start. Enter your website and see what LeadCheck finds.</p>
        </div>
        <div className="steps-list process-steps contractor-process">
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

      <section className="content-band faq-band" id="faq">
        <div className="section-heading centered">
          <p className="eyebrow">FAQ</p>
          <h2>Questions before you check your site</h2>
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
              <BriefcaseBusiness size={18} aria-hidden="true" />
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
          <Star size={30} aria-hidden="true" />
          <p className="eyebrow">Free Website Lead Check</p>
          <h2>Your referrals shouldn&apos;t have to do all the work.</h2>
          <p>Find out whether your website is helping bring you new calls, quote requests, and jobs too.</p>
          <UrlScanForm onSubmit={onStartScan} compact source="landing_bottom" ctaLabel="Check My Website Free" />
          <p className="final-cta-note">Free. Takes about 60 seconds. No credit card required.</p>
        </div>
      </section>
    </div>
  );
}
