import { describe, expect, it } from 'vitest';
import { assertPublicWebsiteUrl, normalizeWebsiteUrl } from '../server/lib/url';

describe('normalizeWebsiteUrl', () => {
  it('normalizes a bare domain to https', () => {
    const result = normalizeWebsiteUrl('Example.com/services#section');
    expect(result.url).toBe('https://example.com/services');
    expect(result.normalizedDomain).toBe('example.com');
  });

  it('rejects malformed URLs', () => {
    expect(() => normalizeWebsiteUrl('https://')).toThrow('Enter a valid website URL.');
  });

  it('rejects unsupported schemes', () => {
    expect(() => normalizeWebsiteUrl('file:///etc/passwd')).toThrow('regular website URLs');
  });

  it('blocks localhost and private IP foundations for future SSRF protection', () => {
    expect(() => normalizeWebsiteUrl('http://localhost:3000')).toThrow('public business website');
    expect(() => normalizeWebsiteUrl('http://192.168.1.10')).toThrow('private or internal');
    expect(() => normalizeWebsiteUrl('http://10.0.0.4')).toThrow('private or internal');
    expect(() => normalizeWebsiteUrl('http://169.254.169.254/latest/meta-data')).toThrow('private or internal');
    expect(() => normalizeWebsiteUrl('http://metadata.google.internal')).toThrow('private or internal');
  });

  it('blocks unsafe URLs before DNS resolution in the async validator', async () => {
    await expect(assertPublicWebsiteUrl('http://127.0.0.1/redirect-target')).rejects.toMatchObject({
      code: 'private_network_blocked',
    });
  });
});
