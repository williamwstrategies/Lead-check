import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleHelp,
  Droplets,
  Hammer,
  Home,
  Images,
  MapPin,
  Paintbrush,
  PhoneCall,
  Search,
  ShieldCheck,
  Shovel,
  Smartphone,
  Star,
  ThermometerSun,
  Zap,
} from 'lucide-react';
import type { ScanRequest } from '../../shared/leadcheck';
import { UrlScanForm } from '../components/UrlScanForm';
import { brand } from '../config/brand';

interface LandingPageProps {
  onStartScan: (input: ScanRequest) => void;
  onNavigate: (path: string) => void;
}

interface LandingPhoto {
  alt: string;
  src: string;
  srcSet: string;
  source: string;
}

const photos = {
  hero: pexelsPhoto('6285155', 'Contractors reviewing plans for a project', 'gustavo-fring-6285155'),
  renovation: pexelsPhoto('30924413', 'Bright kitchen renovation in progress', 'brettjordan-30924413'),
  landscape: pexelsPhoto('19271862', 'Finished backyard landscaping project', 'd-ng-thanh-tu-2922122-19271862'),
  roofing: pexelsPhoto('31771166', 'Roofer installing shingles on a residential roof', 'clement-proust-363898785-31771166'),
  electrician: pexelsPhoto('21812143', 'Electrician checking wiring in a panel', 'shameer-vayalakkad-hydrose-2602409-21812143'),
};

const industries = [
  { label: 'Roofing', icon: Home },
  { label: 'Renovations', icon: Hammer },
  { label: 'Landscaping', icon: Images },
  { label: 'HVAC', icon: ThermometerSun },
  { label: 'Plumbing', icon: Droplets },
  { label: 'Electrical', icon: Zap },
  { label: 'Excavation', icon: Shovel },
  { label: 'Painting', icon: Paintbrush },
];

const contractorChecks = [
  {
    icon: PhoneCall,
    title: 'Requesting a quote',
    copy: 'Can someone immediately see how to call, book, or request an estimate?',
  },
  {
    icon: ShieldCheck,
    title: 'Reviews & trust',
    copy: 'Are you giving homeowners enough reason to trust you before they reach out?',
  },
  {
    icon: Images,
    title: 'Projects',
    copy: 'Can visitors easily see examples of completed work and proof of quality?',
  },
  {
    icon: Hammer,
    title: 'Services',
    copy: 'Is it obvious what work you actually do and which jobs are a good fit?',
  },
  {
    icon: MapPin,
    title: 'Service areas',
    copy: 'Can customers and Google understand where your company works?',
  },
  {
    icon: Smartphone,
    title: 'Mobile experience',
    copy: 'Can someone use your website easily from the phone in their hand?',
  },
  {
    icon: Search,
    title: 'Google visibility setup',
    copy: 'Does your website clearly explain your services, locations, and pages?',
  },
  {
    icon: PhoneCall,
    title: 'Contact options',
    copy: 'Is calling, emailing, or requesting an estimate simple across key pages?',
  },
];

const processSteps = [
  {
    label: '01',
    title: 'Enter your website',
    copy: 'Paste your contractor or home-service website. No setup, no credit card, no account required to start.',
  },
  {
    label: '02',
    title: 'LeadCheck analyzes it',
    copy: 'We look for the website signals that can affect calls, quote requests, trust, and local visibility.',
  },
  {
    label: '03',
    title: 'See what to fix first',
    copy: 'Get your Website Lead Score and a prioritized report written in plain business language.',
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
      'No. LeadCheck translates website issues into plain language about calls, quote requests, homeowner trust, Google, and local customers.',
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

function pexelsPhoto(id: string, alt: string, slug: string): LandingPhoto {
  const base = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`;
  return {
    alt,
    src: `${base}?auto=compress&cs=tinysrgb&w=900`,
    srcSet: [
      `${base}?auto=compress&cs=tinysrgb&w=640 640w`,
      `${base}?auto=compress&cs=tinysrgb&w=900 900w`,
      `${base}?auto=compress&cs=tinysrgb&w=1400 1400w`,
    ].join(', '),
    source: `https://www.pexels.com/photo/${slug}/`,
  };
}

function LandingImage({
  photo,
  className,
  loading = 'lazy',
  sizes = '(min-width: 900px) 50vw, 100vw',
}: {
  photo: LandingPhoto;
  className: string;
  loading?: 'eager' | 'lazy';
  sizes?: string;
}) {
  return (
    <img
      className={className}
      src={photo.src}
      srcSet={photo.srcSet}
      sizes={sizes}
      alt={photo.alt}
      loading={loading}
      decoding="async"
    />
  );
}

function HeroScoreCard() {
  return (
    <aside className="hero-score-card" aria-label="Example LeadCheck score preview">
      <div className="hero-score-topline">
        <span>Website Lead Score</span>
        <strong>Example Report</strong>
      </div>
      <div className="hero-score-body">
        <div className="hero-score-ring" aria-hidden="true">
          <span>58</span>
          <small>/100</small>
        </div>
        <div>
          <p>Needs Attention</p>
          <strong>4 issues could be costing you leads</strong>
          <button type="button" onClick={() => document.getElementById('example-report')?.scrollIntoView({ behavior: 'smooth' })}>
            View LeadCheck
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="hero-score-findings">
        <span className="high">Quote request is not obvious</span>
        <span className="medium">Trust could be stronger</span>
        <span className="good">Phone number is easy to find</span>
      </div>
    </aside>
  );
}

function HomeownerWebsiteMock() {
  return (
    <div className="homeowner-mockup" aria-label="Annotated example contractor website">
      <div className="mock-browser">
        <div className="mock-browser-bar" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="mock-website">
          <div className="mock-hero">
            <p>Oakridge Renovations</p>
            <h3>Quality Home Renovations</h3>
            <span>Serving local homeowners</span>
          </div>
          <div className="mock-content">
            <span />
            <span />
            <span />
          </div>
          <div className="mock-gallery">
            <i />
            <i />
            <i />
          </div>
        </div>
      </div>
      <div className="mock-callouts">
        <span className="mock-callout high quote">No obvious way to request a quote</span>
        <span className="mock-callout high area">Service area is not clear</span>
        <span className="mock-callout medium proof">Not enough recent project proof</span>
        <span className="mock-callout medium reviews">Reviews are difficult to find</span>
        <span className="mock-callout good phone">Phone number is easy to find</span>
      </div>
    </div>
  );
}

function ExampleReportPreview({ onStartScan }: { onStartScan: (input: ScanRequest) => void }) {
  return (
    <section className="content-band report-showcase" id="example-report">
      <div className="section-heading centered">
        <p className="eyebrow">Example Report</p>
        <h2>See the report a contractor can understand in seconds</h2>
        <p>
          LeadCheck turns website issues into clear priorities, so owners can see what may be costing calls and quote
          requests.
        </p>
      </div>
      <article className="lead-report-demo" aria-label="Example LeadCheck report for Oakridge Renovations">
        <div className="report-demo-header">
          <div>
            <p className="eyebrow">Oakridge Renovations</p>
            <h3>Website Lead Score</h3>
            <p>Your website has several issues that could make it harder to turn visitors into calls and quote requests.</p>
          </div>
          <div className="report-demo-score">
            <span>58</span>
            <small>/100</small>
            <strong>Needs Attention</strong>
          </div>
        </div>
        <div className="report-demo-body">
          <div className="report-demo-list">
            <p className="eyebrow">What could be costing you leads</p>
            <div className="demo-finding high">
              <strong>Getting a quote is not obvious</strong>
              <p>Visitors are not immediately shown how to request an estimate.</p>
            </div>
            <div className="demo-finding high">
              <strong>Your service areas are not clear</strong>
              <p>Google and homeowners may have difficulty understanding exactly where you work.</p>
            </div>
            <div className="demo-finding medium">
              <strong>Your project work is difficult to find</strong>
              <p>Potential customers may not be seeing enough proof of the quality of your work.</p>
            </div>
            <div className="demo-finding good">
              <strong>Your phone number is easy to find</strong>
              <p>Customers have a clear way to call your business.</p>
            </div>
          </div>
          <div className="report-demo-side">
            <div>
              <strong>Lead Generation</strong>
              <span>51</span>
            </div>
            <div>
              <strong>Homeowner Trust</strong>
              <span>62</span>
            </div>
            <div>
              <strong>Google Visibility</strong>
              <span>59</span>
            </div>
          </div>
        </div>
        <div className="report-demo-cta">
          <UrlScanForm onSubmit={onStartScan} compact source="landing_report_preview" ctaLabel="Find Out Free" />
        </div>
      </article>
    </section>
  );
}

export function LandingPage({ onStartScan, onNavigate }: LandingPageProps) {
  return (
    <div className="landing-page contractor-landing landing-v2">
      <section className="contractor-hero-v2" id="leadcheck-start">
        <div className="hero-blueprint" aria-hidden="true" />
        <div className="hero-copy hero-v2-copy">
          <p className="eyebrow">Built for contractors & home services</p>
          <h1>Find Out Why You&apos;re Still Relying on Referrals</h1>
          <p className="hero-lede">
            Your reputation is bringing you business. Your website should be too. LeadCheck identifies issues that could
            be stopping homeowners from calling, requesting a quote, or choosing your company.
          </p>
          <UrlScanForm onSubmit={onStartScan} source="landing_hero" ctaLabel="Find Out Free" />
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
        <div className="hero-visual" aria-label="Contractor project with LeadCheck report preview">
          <LandingImage photo={photos.hero} className="hero-photo" loading="eager" sizes="(min-width: 900px) 45vw, 100vw" />
          <HeroScoreCard />
        </div>
      </section>

      <section className="industry-strip" aria-label="Industries LeadCheck supports">
        <div>
          <p className="eyebrow">Built for businesses like yours</p>
          <div className="industry-strip-scroll">
            {industries.map(industry => {
              const Icon = industry.icon;
              return (
                <span key={industry.label}>
                  <Icon size={16} aria-hidden="true" />
                  {industry.label}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      <section className="content-band split-band referral-story">
        <div className="photo-panel photo-panel-renovation">
          <LandingImage photo={photos.renovation} className="section-photo" />
          <span>Real projects should create real confidence online.</span>
        </div>
        <div>
          <p className="eyebrow">The Referral Gap</p>
          <h2>Your referrals are working. But is your website?</h2>
          <p>
            You have spent years building your reputation. Past customers recommend you. People know your work.
          </p>
          <p>
            But homeowners who do not already know you are often judging your business through your website before they
            ever call. LeadCheck shows what could be stopping those visitors from becoming leads.
          </p>
          <div className="reputation-contrast" aria-label="Referral versus website comparison">
            <div>
              <Home size={20} aria-hidden="true" />
              <strong>Offline reputation</strong>
              <span>People already trust your name.</span>
            </div>
            <div>
              <Search size={20} aria-hidden="true" />
              <strong>Online first impression</strong>
              <span>Your website needs to earn the call.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="content-band homeowner-section">
        <div className="section-heading centered">
          <p className="eyebrow">What Homeowners See</p>
          <h2>Homeowners are judging your business before they ever call.</h2>
          <p>
            LeadCheck reviews your website like a homeowner who wants a clear reason to trust you and a clear next step.
          </p>
        </div>
        <HomeownerWebsiteMock />
      </section>

      <ExampleReportPreview onStartScan={onStartScan} />

      <section className="photo-break">
        <LandingImage photo={photos.landscape} className="photo-break-image" />
        <div className="photo-break-copy">
          <p className="eyebrow">Built Around Better Leads</p>
          <h2>You built a business people recommend. Now make sure your website does the same.</h2>
          <button className="primary-action" type="button" onClick={() => document.getElementById('leadcheck-start')?.scrollIntoView({ behavior: 'smooth' })}>
            Check My Website Free
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="content-band contractor-checks" id="what-it-checks">
        <div className="section-heading centered">
          <p className="eyebrow">What We Check</p>
          <h2>We check the things homeowners care about</h2>
          <p>These are business questions, not technical website jargon.</p>
        </div>
        <div className="check-grid contractor-question-grid">
          {contractorChecks.map(item => {
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

      <section className="content-band trade-proof-band">
        <div>
          <p className="eyebrow">More Than Remodeling</p>
          <h2>Designed for the way home-service companies win trust</h2>
          <p>
            Roofing, landscaping, HVAC, electrical, plumbing, painting, excavation, flooring, and renovation businesses
            all need the same thing online: proof, clarity, and an easy way for good customers to reach out.
          </p>
        </div>
        <div className="trade-photo-grid" aria-label="Examples of home-service work LeadCheck supports">
          <LandingImage photo={photos.roofing} className="trade-photo tall" />
          <LandingImage photo={photos.electrician} className="trade-photo" />
        </div>
      </section>

      <section className="content-band how-it-works-v2" id="how-it-works">
        <div className="section-heading centered">
          <p className="eyebrow">How LeadCheck Works</p>
          <h2>From website to lead priorities in minutes</h2>
        </div>
        <div className="process-steps-v2">
          {processSteps.map(step => (
            <article className="process-card-v2" key={step.title}>
              <span>{step.label}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
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

      <section className="final-cta final-cta-v2">
        <div className="final-cta-photo" aria-hidden="true">
          <LandingImage photo={photos.roofing} className="final-photo" />
        </div>
        <div className="final-cta-inner">
          <Star size={30} aria-hidden="true" />
          <p className="eyebrow">Free Website Lead Check</p>
          <h2>Your referrals shouldn&apos;t have to do all the work.</h2>
          <p>Find out whether your website is helping bring you new customers too.</p>
          <UrlScanForm onSubmit={onStartScan} compact source="landing_bottom" ctaLabel="Check My Website Free" />
          <p className="final-cta-note">Free. About 60 seconds. No credit card.</p>
        </div>
      </section>
    </div>
  );
}
