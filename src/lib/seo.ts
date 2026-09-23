interface SeoMeta {
  title: string;
  description: string;
  canonicalPath?: string;
}

function upsertMeta(selector: string, create: () => HTMLMetaElement | HTMLLinkElement): HTMLMetaElement | HTMLLinkElement {
  const existing = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (existing) return existing;
  const element = create();
  document.head.appendChild(element);
  return element;
}

export function setSeoMeta({ title, description, canonicalPath }: SeoMeta): void {
  document.title = title;

  const descriptionMeta = upsertMeta('meta[name="description"]', () => {
    const element = document.createElement('meta');
    element.setAttribute('name', 'description');
    return element;
  });
  descriptionMeta.setAttribute('content', description);

  if (canonicalPath) {
    const canonical = upsertMeta('link[rel="canonical"]', () => {
      const element = document.createElement('link');
      element.setAttribute('rel', 'canonical');
      return element;
    });
    canonical.setAttribute('href', `${window.location.origin}${canonicalPath}`);
  }
}
