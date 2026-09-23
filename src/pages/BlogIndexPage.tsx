import { useEffect } from 'react';
import type { MouseEvent } from 'react';
import { ArrowRight, BookOpenText, Search } from 'lucide-react';
import { blogCategories, blogPosts } from '../../shared/blogPosts';
import type { ScanRequest } from '../../shared/leadcheck';
import { UrlScanForm } from '../components/UrlScanForm';
import { setSeoMeta } from '../lib/seo';

interface BlogIndexPageProps {
  onNavigate: (path: string) => void;
  onStartScan: (input: ScanRequest) => void;
}

export function BlogIndexPage({ onNavigate, onStartScan }: BlogIndexPageProps) {
  useEffect(() => {
    setSeoMeta({
      title: 'Small Business Website and SEO Blog | LeadCheck',
      description:
        'Practical website, SEO, trust, and lead generation advice for contractors, home-service companies, and local small businesses.',
      canonicalPath: '/blog',
    });
  }, []);

  function openPost(path: string) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      onNavigate(path);
    };
  }

  return (
    <div className="blog-page">
      <section className="blog-hero">
        <div>
          <p className="eyebrow">LeadCheck Blog</p>
          <h1>Practical website advice for small businesses</h1>
          <p className="hero-lede">
            Guides for improving website leads, Google visibility, trust, page structure, and technical basics without
            needing to become an SEO expert.
          </p>
        </div>
        <div className="blog-scan-card">
          <Search size={24} aria-hidden="true" />
          <h2>Start with your own website</h2>
          <p>Run a free LeadCheck to see what may be holding your site back.</p>
          <UrlScanForm onSubmit={onStartScan} compact source="blog_index" />
        </div>
      </section>

      <section className="blog-directory" aria-label="Blog articles">
        {blogCategories.map(category => {
          const posts = blogPosts.filter(post => post.category === category);
          return (
            <section className="blog-category-section" key={category}>
              <div className="section-heading split">
                <div>
                  <p className="eyebrow">{posts.length} articles</p>
                  <h2>{category}</h2>
                </div>
              </div>
              <div className="blog-card-grid">
                {posts.map(post => (
                  <article className="blog-card" key={post.slug}>
                    <BookOpenText size={20} aria-hidden="true" />
                    <p className="blog-card-meta">
                      {post.format} · {post.readingMinutes} min read
                    </p>
                    <h3>
                      <a href={`/blog/${post.slug}`} onClick={openPost(`/blog/${post.slug}`)}>
                        {post.title}
                      </a>
                    </h3>
                    <p>{post.excerpt}</p>
                    <a className="text-link" href={`/blog/${post.slug}`} onClick={openPost(`/blog/${post.slug}`)}>
                      Read article
                      <ArrowRight size={15} aria-hidden="true" />
                    </a>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </section>
    </div>
  );
}
