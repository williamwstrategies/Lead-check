import { beforeEach, describe, expect, it } from 'vitest';
import { captureAttributionFromUrl, loadAttribution } from '../src/lib/attribution';

function visit(path: string, referrer = ''): void {
  window.history.replaceState({}, '', path);
  Object.defineProperty(document, 'referrer', {
    configurable: true,
    value: referrer,
  });
}

describe('marketing attribution capture', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    visit('/');
  });

  it('captures Instagram organic UTM parameters', () => {
    visit('/?utm_source=instagram&utm_medium=organic&utm_campaign=leadcheck_content&utm_content=video_1');

    expect(captureAttributionFromUrl()).toMatchObject({
      utm_source: 'instagram',
      utm_medium: 'organic',
      utm_campaign: 'leadcheck_content',
      utm_content: 'video_1',
    });
  });

  it('captures Facebook campaign parameters and fbclid', () => {
    visit('/?utm_source=facebook&utm_medium=paid&utm_campaign=leadcheck_meta&utm_content=score_ad&fbclid=test123');

    expect(captureAttributionFromUrl()).toMatchObject({
      utm_source: 'facebook',
      utm_medium: 'paid',
      utm_campaign: 'leadcheck_meta',
      utm_content: 'score_ad',
      fbclid: 'test123',
    });
  });

  it('classifies no-parameter visits without external referrer as direct', () => {
    visit('/');

    expect(captureAttributionFromUrl()).toMatchObject({
      utm_source: 'direct',
      utm_medium: 'none',
    });
  });

  it('preserves original attribution after query parameters are gone', () => {
    visit('/?utm_source=instagram&utm_medium=organic&utm_campaign=leadcheck_content&utm_content=video_6');
    const original = captureAttributionFromUrl();

    visit('/scan/progress');

    expect(captureAttributionFromUrl()).toEqual(original);
    expect(loadAttribution()).toEqual(original);
  });

  it('preserves external referrer and derives obvious source when UTMs are absent', () => {
    visit('/', 'https://l.facebook.com/l.php?u=https%3A%2F%2Fleadcheck.ca%2F');

    expect(captureAttributionFromUrl()).toMatchObject({
      utm_source: 'facebook',
      utm_medium: 'referral',
      referrer: 'https://l.facebook.com/l.php?u=https%3A%2F%2Fleadcheck.ca%2F',
    });
  });
});
