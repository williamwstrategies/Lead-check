import { useEffect } from 'react';
import type { MouseEvent } from 'react';
import { ArrowLeft, ArrowRight, ClipboardCheck, Search } from 'lucide-react';
import { blogPosts, getBlogPostBySlug } from '../../shared/blogPosts';
import type { BlogBlock, BlogPost } from '../../shared/blogPosts';
import type { ScanRequest } from '../../shared/leadcheck';
import { UrlScanForm } from '../components/UrlScanForm';
import { setSeoMeta } from '../lib/seo';

interface BlogPostPageProps {
  slug?: string;
  onNavigate: (path: string) => void;
  onStartScan: (input: ScanRequest) => void;
}

function renderBlock(block: BlogBlock, index: number) {
  if (block.type === 'heading') {
    return block.level === 3 ? <h3 key={index}>{block.text}</h3> : <h2 key={index}>{block.text}</h2>;
  }

  if (block.type === 'list') {
    return (
      <ul key={index}>
        {block.items.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  return <p key={index}>{block.text}</p>;
}

function relatedPostsFor(post: BlogPost): BlogPost[] {
  return blogPosts.filter(candidate => candidate.category === post.category && candidate.slug !== post.slug).slice(0, 3);
}

export function BlogPostPage({ slug = '', onNavigate, onStartScan }: BlogPostPageProps) {
  const post = getBlogPostBySlug(slug);

  useEffect(() => {
    if (!post) {
      setSeoMeta({
        title: 'Article Not Found | LeadCheck',
        description: 'This LeadCheck blog article could not be found.',
        canonicalPath: '/blog',
      });
      return;
    }

    setSeoMeta({
      title: `${post.title} | LeadCheck`,
      description: post.metaDescription || post.excerpt,
      canonicalPath: `/blog/${post.slug}`,
    });
  }, [post]);

  if (!post) {
    return (
      <div className="page-panel blog-not-found">
        <p className="eyebrow">LeadCheck Blog</p>
        <h1>Article not found</h1>
        <p>The article you were looking for is not available.</p>
        <button className="primary-action" type="button" onClick={() => onNavigate('/blog')}>
          Back to the blog
        </button>
      </div>
    );
  }

  const relatedPosts = relatedPostsFor(post);

  function openPath(path: string) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      onNavigate(path);
    };
  }

  return (
    <article className="blog-post-page">
      <header className="blog-post-header">
        <a className="text-link blog-back-link" href="/blog" onClick={openPath('/blog')}>
          <ArrowLeft size={16} aria-hidden="true" />
          Blog
        </a>
        <p className="eyebrow">{post.category}</p>
        <h1>{post.title}</h1>
        <p className="hero-lede">{post.excerpt}</p>
        <div className="blog-post-meta">
          <span>{post.format}</span>
          <span>{post.readingMinutes} min read</span>
          <span>Primary topic: {post.primaryKeyword}</span>
        </div>
      </header>

      <div className="blog-post-layout">
        <div className="blog-article-body">{post.blocks.map(renderBlock)}</div>
        <aside className="blog-sidebar" aria-label="LeadCheck next steps">
          <div className="blog-sidebar-card">
            <Search size={22} aria-hidden="true" />
            <h2>Check your own website</h2>
            <p>Get a free LeadCheck report and see what to improve first.</p>
            <UrlScanForm onSubmit={onStartScan} compact source="blog_article" />
          </div>
          <div className="blog-sidebar-card">
            <ClipboardCheck size={22} aria-hidden="true" />
            <h2>Related articles</h2>
            <div className="related-post-list">
              {relatedPosts.map(related => (
                <a key={related.slug} href={`/blog/${related.slug}`} onClick={openPath(`/blog/${related.slug}`)}>
                  {related.title}
                  <ArrowRight size={14} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
