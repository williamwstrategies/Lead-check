import type { ReactNode } from 'react';
import { BarChart3, FileText, Gauge } from 'lucide-react';
import { brand } from '../config/brand';

interface AppShellProps {
  children: ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}

const navItems = [
  { label: 'Scan Website', path: '/scan', icon: Gauge },
  { label: 'My Reports', path: '/reports', icon: FileText },
];

export function BrandMark() {
  return (
    <span className="brand-lockup">
      <span className="brand-symbol" aria-hidden="true">
        <span className="brand-symbol-window">
          <span />
        </span>
      </span>
      <span>
        <strong>{brand.name}</strong>
        <small>{brand.shortTagline}</small>
      </span>
    </span>
  );
}

export function AppShell({ children, currentPath, onNavigate }: AppShellProps) {
  const isPublic = currentPath === '/';

  function scrollToLandingSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="app-frame">
      <header className={isPublic ? 'topbar topbar-public' : 'topbar'}>
        <button className="brand-button" type="button" onClick={() => onNavigate('/')} aria-label="LeadCheck home">
          <BrandMark />
        </button>
        {isPublic ? (
          <>
            <nav className="topnav public-nav" aria-label="Landing page navigation">
              <button className="nav-item" type="button" onClick={() => scrollToLandingSection('how-it-works')}>
                How It Works
              </button>
              <button className="nav-item" type="button" onClick={() => scrollToLandingSection('what-it-checks')}>
                What It Checks
              </button>
              <button className="nav-item" type="button" onClick={() => scrollToLandingSection('faq')}>
                FAQ
              </button>
            </nav>
            <button className="primary-action header-action" type="button" onClick={() => scrollToLandingSection('leadcheck-start')}>
              <BarChart3 size={17} aria-hidden="true" />
              Scan My Website
            </button>
          </>
        ) : (
          <>
            <nav className="topnav" aria-label="Primary navigation">
              {navItems.map(item => {
                const Icon = item.icon;
                const active = currentPath === item.path || currentPath.startsWith(`${item.path}/`);
                return (
                  <button
                    key={item.path}
                    className={active ? 'nav-item active' : 'nav-item'}
                    type="button"
                    onClick={() => onNavigate(item.path)}
                  >
                    <Icon size={17} aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <button className="secondary-action desktop-only" type="button" onClick={() => onNavigate('/scan')}>
              <BarChart3 size={17} aria-hidden="true" />
              Scan Free
            </button>
          </>
        )}
      </header>
      <main className={isPublic ? 'main main-public' : 'main'}>{children}</main>
      <footer className="site-footer">
        <div className="footer-brand">
          <BrandMark />
          <p>Free website analysis for small businesses that want clearer, more useful websites.</p>
        </div>
        <div className="footer-links" aria-label="Footer links">
          <button type="button" onClick={() => onNavigate('/privacy')}>Privacy Policy</button>
          <button type="button" onClick={() => onNavigate('/terms')}>Terms</button>
          <button type="button" onClick={() => onNavigate('/support')}>Support</button>
        </div>
        <span className="footer-note">© {new Date().getFullYear()} {brand.name}</span>
      </footer>
    </div>
  );
}
