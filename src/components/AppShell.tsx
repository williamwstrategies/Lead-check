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
  return (
    <div className="app-frame">
      <header className="topbar">
        <button className="brand-button" type="button" onClick={() => onNavigate('/')} aria-label="LeadCheck home">
          <BrandMark />
        </button>
        {!isPublic ? (
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
        ) : null}
      </header>
      <main className={isPublic ? 'main main-public' : 'main'}>{children}</main>
      <footer className="site-footer">
        <span>© {new Date().getFullYear()} {brand.name}</span>
        <span className="footer-note">Free website analysis for small businesses.</span>
        <button type="button" onClick={() => onNavigate('/privacy')}>Privacy</button>
        <button type="button" onClick={() => onNavigate('/terms')}>Terms</button>
        <button type="button" onClick={() => onNavigate('/support')}>Support</button>
      </footer>
    </div>
  );
}
