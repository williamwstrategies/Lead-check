import { brand } from '../config/brand';

type LegalPageKind = 'privacy' | 'terms' | 'support';

interface LegalPageProps {
  kind: LegalPageKind;
  onNavigate: (path: string) => void;
}

const content = {
  privacy: {
    eyebrow: 'Privacy',
    title: 'Privacy Policy',
    body: [
      'LeadCheck collects the public website URL you submit so we can scan the site and create a Website Lead Report.',
      'If you request your results, we collect the first name, phone number, email address, and business name you provide. We associate that information with the submitted website URL, normalized domain, scan ID, and report information.',
      'LeadCheck may store scan status, pages analyzed, findings, scores, recommendations, timestamps, and technical error details needed to operate and improve the product.',
      'We use basic analytics events to understand whether visitors can complete the funnel, including landing views, website submissions, scan starts and completions, lead submissions, report views, opened opportunities, and help requests.',
      'If you arrive with campaign attribution such as UTM parameters, click IDs like fbclid or gclid, or an external referrer, LeadCheck stores those values so we can understand which traffic sources led to scans and lead submissions.',
      'If you choose to receive website tips and LeadCheck updates, we store your marketing consent and unsubscribe or suppression status so we can respect that preference.',
      'LeadCheck uses browser storage for anonymous analytics IDs, saved reports on this device, and short-lived attribution values. We do not ask for passwords or payment information in this beta flow.',
      'Do not submit private, internal, or password-protected websites. LeadCheck is designed for public business websites.',
      `For privacy questions or data requests, contact ${brand.supportEmail}.`,
    ],
  },
  terms: {
    eyebrow: 'Terms',
    title: 'Terms of Use',
    body: [
      'LeadCheck provides automated website lead analysis for informational purposes. The report is not a guarantee of search rankings, leads, revenue, or business results.',
      'LeadCheck may not detect every website issue, and not every recommendation will improve business performance. Use the report as a practical starting point for review and improvement.',
      'You may scan public websites you own, manage, or are otherwise authorized to review. Do not use LeadCheck to probe private systems, password-protected websites, internal networks, or websites you are not permitted to evaluate.',
      'The beta may change, be unavailable, fail, or produce incomplete results. We may limit or block scans that appear abusive, unsafe, or outside normal product use.',
      `For support, contact ${brand.supportEmail}.`,
    ],
  },
  support: {
    eyebrow: 'Support',
    title: 'Contact LeadCheck',
    body: [
      'Need help with a scan or report? Send us the website URL, what happened, and the report link if you have one.',
      'For privacy, do not send passwords, private website credentials, payment details, or sensitive customer information.',
      `Email: ${brand.supportEmail}`,
    ],
  },
} satisfies Record<LegalPageKind, { eyebrow: string; title: string; body: string[] }>;

export function LegalPage({ kind, onNavigate }: LegalPageProps) {
  const page = content[kind];

  return (
    <section className="page-panel legal-page">
      <p className="eyebrow">{page.eyebrow}</p>
      <h1>{page.title}</h1>
      {page.body.map(paragraph => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {kind === 'support' ? (
        <a className="primary-action link-action" href={`mailto:${brand.supportEmail}`}>
          Email Support
        </a>
      ) : (
        <button className="primary-action" type="button" onClick={() => onNavigate('/scan')}>
          Check My Website
        </button>
      )}
    </section>
  );
}
