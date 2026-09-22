export type FollowupEmailType = 'followup_day_1' | 'followup_day_3' | 'followup_day_6';

export interface FollowupLeadProfile {
  first_name?: string | null;
  business_name?: string | null;
  website_url?: string | null;
}

export interface FollowupSubscriptionState {
  marketingConsent: boolean;
  subscribed: boolean;
  unsubscribedAt?: string | null;
  bouncedAt?: string | null;
  complainedAt?: string | null;
}

export interface ScheduledFollowup {
  emailType: FollowupEmailType;
  scheduledFor: string;
}

export const FOLLOWUP_SEQUENCE: Array<{ emailType: FollowupEmailType; delayDays: number }> = [
  { emailType: 'followup_day_1', delayDays: 1 },
  { emailType: 'followup_day_3', delayDays: 3 },
  { emailType: 'followup_day_6', delayDays: 6 },
];

const BRAND = {
  teal: '#0f766e',
  background: '#f7faf8',
  ink: '#111827',
  muted: '#5f6b66',
  border: '#dbe5df',
};

function clean(value: string | null | undefined, fallback: string): string {
  const cleaned = String(value || '').trim();
  return cleaned || fallback;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function paragraphHtml(text: string): string {
  return `<p style="margin:0 0 16px;color:${BRAND.ink};line-height:1.6;">${escapeHtml(text)}</p>`;
}

export function canSendPromotionalFollowup(state: FollowupSubscriptionState): boolean {
  return (
    state.marketingConsent === true &&
    state.subscribed === true &&
    !state.unsubscribedAt &&
    !state.bouncedAt &&
    !state.complainedAt
  );
}

export function schedulePromotionalFollowups(createdAt: string | Date, marketingConsent: boolean): ScheduledFollowup[] {
  if (!marketingConsent) return [];
  const base = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(base.getTime())) return [];

  return FOLLOWUP_SEQUENCE.map(item => {
    const scheduledFor = new Date(base);
    scheduledFor.setUTCDate(scheduledFor.getUTCDate() + item.delayDays);
    return {
      emailType: item.emailType,
      scheduledFor: scheduledFor.toISOString(),
    };
  });
}

export function renderFollowupEmail(
  emailType: FollowupEmailType,
  profile: FollowupLeadProfile,
  unsubscribeUrl: string
): { subject: string; html: string; text: string } {
  const firstName = clean(profile.first_name, 'there');
  const businessName = clean(profile.business_name, 'your business');
  const websiteUrl = clean(profile.website_url, 'your website');

  const templates: Record<FollowupEmailType, { subject: string; paragraphs: string[] }> = {
    followup_day_1: {
      subject: `One thing I'd check on ${businessName}'s website`,
      paragraphs: [
        `Hey ${firstName},`,
        `You ran ${websiteUrl} through LeadCheck yesterday.`,
        "One thing I'd recommend is going back to the highest-priority opportunities in your report and looking at the issues that directly affect whether a visitor knows what to do next.",
        "A website can look great and still lose potential customers if the next step isn't obvious.",
        "If you have any questions about something LeadCheck found, reply to this email. I actually read the replies.",
        '— Will',
        'LeadCheck',
      ],
    },
    followup_day_3: {
      subject: "More traffic isn't always the answer",
      paragraphs: [
        `Hey ${firstName},`,
        'A lot of businesses assume they need more website traffic.',
        'Sometimes they do.',
        "But if the website isn't converting the people already visiting it, sending more traffic just sends more people into the same problem.",
        "That's why LeadCheck looks at things like calls-to-action, trust signals, contact options, mobile experience and service clarity.",
        'Take another look at the Lead Generation section of your report when you get a chance.',
        'If you want a second opinion on something it found, just reply.',
        '— Will',
        'LeadCheck',
      ],
    },
    followup_day_6: {
      subject: `Want help with ${websiteUrl}?`,
      paragraphs: [
        `Hey ${firstName},`,
        'I wanted to follow up one last time about your LeadCheck.',
        'If you looked through the report and thought:',
        '"I know this needs work, but I don\'t really want to fix all of this myself"',
        "that's something I may be able to help with.",
        'I run the company behind LeadCheck, and we help businesses improve their websites and lead-generation setup.',
        `If you'd like me to personally look through ${websiteUrl} and tell you what I'd tackle first, just reply to this email.`,
        'No pressure either way.',
        '— Will',
        'LeadCheck',
      ],
    },
  };

  const template = templates[emailType];
  const safeUnsubscribeUrl = escapeHtml(unsubscribeUrl);
  const html = `<!doctype html>
<html>
  <body style="margin:0;background:${BRAND.background};font-family:Arial,Helvetica,sans-serif;color:${BRAND.ink};">
    <div style="max-width:620px;margin:0 auto;padding:28px 18px;">
      <div style="background:#ffffff;border:1px solid ${BRAND.border};border-radius:10px;padding:26px;">
        <div style="margin:0 0 22px;color:${BRAND.teal};font-weight:800;font-size:18px;">LeadCheck</div>
        ${template.paragraphs.map(paragraphHtml).join('')}
        <div style="border-top:1px solid ${BRAND.border};margin-top:24px;padding-top:16px;">
          <p style="margin:0 0 8px;color:${BRAND.muted};font-size:13px;line-height:1.5;">You're receiving this because you asked for LeadCheck updates.</p>
          <a style="color:${BRAND.teal};font-size:13px;font-weight:700;" href="${safeUnsubscribeUrl}">Unsubscribe</a>
        </div>
      </div>
    </div>
  </body>
</html>`;

  const text = `${template.paragraphs.join('\n\n')}\n\nYou're receiving this because you asked for LeadCheck updates.\nUnsubscribe: ${unsubscribeUrl}`;

  return {
    subject: template.subject,
    html,
    text,
  };
}
