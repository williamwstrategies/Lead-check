import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../server/index';
import { blogCategories, blogPosts, getBlogPostBySlug } from '../shared/blogPosts';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('blog content', () => {
  it('loads the full LeadCheck article library with unique slugs', () => {
    const slugs = new Set(blogPosts.map(post => post.slug));

    expect(blogPosts).toHaveLength(70);
    expect(slugs.size).toBe(blogPosts.length);
    expect(blogCategories.length).toBeGreaterThan(1);
    expect(getBlogPostBySlug('why-is-my-website-getting-traffic-but-no-leads')?.title).toBe(
      'Why Is My Website Getting Traffic but No Leads?'
    );
  });

  it('includes blog posts in the XML sitemap', async () => {
    process.env.APP_ORIGIN = 'https://leadcheck.onrender.com';
    process.env.PUBLIC_SITE_URL = 'https://leadcheck.ca';
    const app = createApp();
    const server = app.listen(0);

    try {
      const { port } = server.address() as AddressInfo;
      const response = await fetch(`http://127.0.0.1:${port}/sitemap.xml`);
      const sitemap = await response.text();

      expect(response.headers.get('content-type')).toContain('application/xml');
      expect(sitemap).toContain('<loc>https://leadcheck.ca/blog</loc>');
      expect(sitemap).toContain(
        '<loc>https://leadcheck.ca/blog/why-is-my-website-getting-traffic-but-no-leads</loc>'
      );
      expect(sitemap.match(/<url>/g)).toHaveLength(76);
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
