import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { compareCrawlCandidates } = require('../server/services/pitchproofAnalyzer.cjs') as {
  compareCrawlCandidates: (a: CrawlCandidate, b: CrawlCandidate) => number;
};

interface CrawlCandidate {
  url: string;
  source: 'homepage-link' | 'slug-guess';
  priority?: number;
}

function sortedPaths(candidates: CrawlCandidate[]) {
  return [...candidates]
    .sort(compareCrawlCandidates)
    .map(candidate => new URL(candidate.url).pathname);
}

describe('crawl candidate ordering', () => {
  it('uses stable URL ordering when homepage links have the same priority', () => {
    const firstOrder: CrawlCandidate[] = [
      { url: 'https://example.com/service/roofing', source: 'homepage-link' },
      { url: 'https://example.com/service/plumbing', source: 'homepage-link' },
      { url: 'https://example.com/service/electrical', source: 'homepage-link' },
    ];
    const secondOrder = [...firstOrder].reverse();

    expect(sortedPaths(firstOrder)).toEqual(sortedPaths(secondOrder));
    expect(sortedPaths(firstOrder)).toEqual([
      '/service/electrical',
      '/service/plumbing',
      '/service/roofing',
    ]);
  });

  it('preserves the intended page priority before applying tie-breaks', () => {
    const candidates: CrawlCandidate[] = [
      { url: 'https://example.com/about', source: 'homepage-link' },
      { url: 'https://example.com/service/plumbing', source: 'homepage-link' },
      { url: 'https://example.com/reviews', source: 'homepage-link' },
      { url: 'https://example.com/testimonials', source: 'slug-guess', priority: 1 },
    ];

    expect(sortedPaths(candidates)).toEqual([
      '/reviews',
      '/service/plumbing',
      '/about',
      '/testimonials',
    ]);
  });

  it('keeps configured slug priority for guessed pages', () => {
    const candidates: CrawlCandidate[] = [
      { url: 'https://example.com/about', source: 'slug-guess', priority: 10 },
      { url: 'https://example.com/contact', source: 'slug-guess', priority: 9 },
    ];

    expect(sortedPaths(candidates)).toEqual(['/contact', '/about']);
  });

  it('preserves homepage discovery order inside the same page bucket', () => {
    const candidates: CrawlCandidate[] = [
      { url: 'https://example.com/service/main-service', source: 'homepage-link', priority: 1 },
      { url: 'https://example.com/service/secondary-service', source: 'homepage-link', priority: 2 },
      { url: 'https://example.com/service/alpha-service', source: 'homepage-link', priority: 3 },
    ];

    expect(sortedPaths(candidates)).toEqual([
      '/service/main-service',
      '/service/secondary-service',
      '/service/alpha-service',
    ]);
  });

  it('prioritizes true service pages before blog or brand pages with service terms', () => {
    const candidates: CrawlCandidate[] = [
      { url: 'https://example.com/blog/buying-vs-renting-a-water-heater', source: 'homepage-link' },
      { url: 'https://example.com/brand/water-heaters', source: 'homepage-link' },
      { url: 'https://example.com/service/plumbing', source: 'homepage-link' },
      { url: 'https://example.com/service-area/beaches-plumber', source: 'homepage-link' },
      { url: 'https://example.com/service-areas', source: 'homepage-link' },
    ];

    expect(sortedPaths(candidates)).toEqual([
      '/service-areas',
      '/service/plumbing',
      '/service-area/beaches-plumber',
      '/blog/buying-vs-renting-a-water-heater',
      '/brand/water-heaters',
    ]);
  });
});
