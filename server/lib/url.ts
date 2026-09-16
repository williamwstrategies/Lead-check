import net from 'node:net';
import dns from 'node:dns/promises';
import type { NormalizedWebsite } from '../../shared/leadcheck.js';

export class UrlValidationError extends Error {
  code: string;

  constructor(message: string, code = 'invalid_url') {
    super(message);
    this.name = 'UrlValidationError';
    this.code = code;
  }
}

function cleanInput(value: string): string {
  return String(value || '').trim().replace(/\s+/g, '');
}

function hasSupportedProtocol(url: URL): boolean {
  return url.protocol === 'http:' || url.protocol === 'https:';
}

export function isPrivateIpv4(address: string): boolean {
  const parts = address.split('.').map(part => Number(part));
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b, c] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a === 255
  );
}

export function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, '');
  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized === '0:0:0:0:0:0:0:1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('::ffff:127.') ||
    normalized.startsWith('::ffff:10.') ||
    normalized.startsWith('::ffff:192.168.')
  );
}

export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!host) return true;
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.lan')) return true;
  if (host === 'metadata.google.internal') return true;

  const ipVersion = net.isIP(host);
  if (ipVersion === 4) return isPrivateIpv4(host);
  if (ipVersion === 6) return isPrivateIpv6(host);

  return false;
}

function isBlockedAddress(address: string): boolean {
  const ipVersion = net.isIP(address);
  if (ipVersion === 4) return isPrivateIpv4(address);
  if (ipVersion === 6) return isPrivateIpv6(address);
  return true;
}

export function normalizeWebsiteUrl(input: string): NormalizedWebsite {
  const raw = cleanInput(input);
  if (!raw) {
    throw new UrlValidationError('Enter a website URL to scan.', 'url_required');
  }
  if (/^[a-z][a-z\d+\-.]*:/i.test(raw) && !/^https?:\/\//i.test(raw)) {
    throw new UrlValidationError('LeadCheck can only scan regular website URLs.', 'unsupported_scheme');
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new UrlValidationError('Enter a valid website URL.', 'malformed_url');
  }

  if (!hasSupportedProtocol(parsed)) {
    throw new UrlValidationError('LeadCheck can only scan regular website URLs.', 'unsupported_scheme');
  }
  if (parsed.username || parsed.password) {
    throw new UrlValidationError('Website URLs with usernames or passwords are not supported.', 'url_credentials_not_allowed');
  }
  if (!parsed.hostname || !parsed.hostname.includes('.')) {
    throw new UrlValidationError('Enter a public business website URL.', 'hostname_required');
  }
  if (isBlockedHostname(parsed.hostname)) {
    throw new UrlValidationError('LeadCheck cannot scan private or internal network addresses.', 'private_network_blocked');
  }

  parsed.hash = '';
  parsed.hostname = parsed.hostname.toLowerCase();
  const normalizedDomain = parsed.hostname.replace(/^www\./i, '');
  const path = parsed.pathname === '/' ? '/' : parsed.pathname.replace(/\/+$/, '');
  parsed.pathname = path || '/';

  return {
    inputUrl: input,
    url: parsed.toString(),
    normalizedDomain,
  };
}

export async function assertPublicWebsiteUrl(input: string): Promise<NormalizedWebsite> {
  const website = normalizeWebsiteUrl(input);
  const hostname = new URL(website.url).hostname;
  if (net.isIP(hostname)) return website;

  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new UrlValidationError('We could not find that website. Please check the URL and try again.', 'dns_lookup_failed');
  }

  if (!addresses.length || addresses.some(item => isBlockedAddress(item.address))) {
    throw new UrlValidationError('LeadCheck cannot scan private or internal network addresses.', 'private_network_blocked');
  }

  return website;
}
