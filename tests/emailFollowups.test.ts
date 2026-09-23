import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  canSendPromotionalFollowup,
  renderFollowupEmail,
  schedulePromotionalFollowups,
} from '../shared/emailFollowups';

const migrationPath = path.resolve('supabase/migrations/202609220003_email_followups.sql');
const industryMigrationPath = path.resolve('supabase/migrations/202609230001_add_lead_industry.sql');

describe('email follow-up consent and suppression', () => {
  it('schedules three promotional follow-ups only when consent is checked', () => {
    const scheduled = schedulePromotionalFollowups('2026-09-22T12:00:00.000Z', true);

    expect(scheduled).toEqual([
      { emailType: 'followup_day_1', scheduledFor: '2026-09-23T12:00:00.000Z' },
      { emailType: 'followup_day_3', scheduledFor: '2026-09-25T12:00:00.000Z' },
      { emailType: 'followup_day_6', scheduledFor: '2026-09-28T12:00:00.000Z' },
    ]);
    expect(schedulePromotionalFollowups('2026-09-22T12:00:00.000Z', false)).toEqual([]);
  });

  it('blocks promotional sends for unsubscribed, complained, or bounced recipients', () => {
    expect(
      canSendPromotionalFollowup({
        marketingConsent: true,
        subscribed: true,
      })
    ).toBe(true);
    expect(
      canSendPromotionalFollowup({
        marketingConsent: false,
        subscribed: true,
      })
    ).toBe(false);
    expect(
      canSendPromotionalFollowup({
        marketingConsent: true,
        subscribed: false,
        unsubscribedAt: '2026-09-22T12:00:00.000Z',
      })
    ).toBe(false);
    expect(
      canSendPromotionalFollowup({
        marketingConsent: true,
        subscribed: true,
        complainedAt: '2026-09-22T12:00:00.000Z',
      })
    ).toBe(false);
    expect(
      canSendPromotionalFollowup({
        marketingConsent: true,
        subscribed: true,
        bouncedAt: '2026-09-22T12:00:00.000Z',
      })
    ).toBe(false);
  });

  it('renders an unsubscribe link and escapes database content', () => {
    const email = renderFollowupEmail(
      'followup_day_1',
      {
        first_name: '<Maya>',
        business_name: 'Maya & Sons',
        website_url: 'https://maya.example/?x=<script>',
      },
      'https://example.supabase.co/functions/v1/leadcheck-unsubscribe?token=opaque'
    );

    expect(email.subject).toContain('Maya & Sons');
    expect(email.html).toContain('Unsubscribe');
    expect(email.html).toContain('token=opaque');
    expect(email.html).toContain('&lt;Maya&gt;');
    expect(email.html).not.toContain('<Maya>');
    expect(email.text).toContain('Unsubscribe: https://example.supabase.co/functions/v1/leadcheck-unsubscribe?token=opaque');
  });

  it('uses database constraints and row locking to prevent duplicate cron sends', () => {
    const migration = fs.readFileSync(migrationPath, 'utf8');

    expect(migration).toContain('constraint lead_email_deliveries_unique_email unique (lead_id, email_type)');
    expect(migration).toContain('for update of d skip locked');
    expect(migration).toContain("d.status in ('scheduled', 'failed')");
    expect(migration).toContain("set status = 'sending'");
  });

  it('does not backfill historical leads when the migration is run', () => {
    const migration = fs.readFileSync(migrationPath, 'utf8').toLowerCase();

    expect(migration).not.toContain('insert into public.lead_email_deliveries select');
    expect(migration).not.toContain('update public.leads set marketing_consent');
    expect(migration).toContain('after insert on public.leads');
  });

  it('creates an unsubscribe RPC that suppresses future promotional emails', () => {
    const migration = fs.readFileSync(migrationPath, 'utf8');

    expect(migration).toContain('create or replace function public.unsubscribe_leadcheck_token');
    expect(migration).toContain('subscribed = false');
    expect(migration).toContain("suppression_reason = 'unsubscribed'");
  });

  it('keeps industry nullable so historical leads continue to work', () => {
    const migration = fs.readFileSync(industryMigrationPath, 'utf8').toLowerCase();

    expect(migration).toContain('alter table public.leads add column if not exists industry text;');
    expect(migration).not.toContain('industry text not null');
    expect(migration).toContain('l.industry');
  });
});
