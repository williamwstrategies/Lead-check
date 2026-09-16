import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FeatureFlags, LeadCheckReport, ScanRequest } from '../shared/leadcheck';
import { defaultFeatureFlags } from '../shared/leadcheck';
import { AppShell } from './components/AppShell';
import { loadRuntimeFeatureFlags } from './config/features';
import { AccountPage } from './pages/AccountPage';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './pages/LandingPage';
import { LegalPage } from './pages/LegalPage';
import { ReportPage } from './pages/ReportPage';
import { ReportsPage } from './pages/ReportsPage';
import { ScanPage } from './pages/ScanPage';
import { ScanProgressPage } from './pages/ScanProgressPage';
import { captureAttributionFromUrl } from './lib/attribution';
import { findSavedReport, loadSavedReports, saveReportLocally } from './lib/reportStorage';
import { trackEvent } from './lib/analytics';

type RouteName =
  | 'landing'
  | 'dashboard'
  | 'scan'
  | 'progress'
  | 'reports'
  | 'report'
  | 'account'
  | 'privacy'
  | 'terms'
  | 'support';

interface RouteState {
  name: RouteName;
  path: string;
  reportId?: string;
}

function parseRoute(pathname: string): RouteState {
  if (pathname === '/dashboard') return { name: 'dashboard', path: pathname };
  if (pathname === '/scan/progress') return { name: 'progress', path: pathname };
  if (pathname === '/scan') return { name: 'scan', path: pathname };
  if (pathname === '/reports') return { name: 'reports', path: pathname };
  if (pathname.startsWith('/reports/')) {
    return { name: 'report', path: pathname, reportId: decodeURIComponent(pathname.replace('/reports/', '')) };
  }
  if (pathname === '/account') return { name: 'account', path: pathname };
  if (pathname === '/privacy') return { name: 'privacy', path: pathname };
  if (pathname === '/terms') return { name: 'terms', path: pathname };
  if (pathname === '/support') return { name: 'support', path: pathname };
  return { name: 'landing', path: '/' };
}

function createClientScanId(): string {
  const random = crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '')
    : `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  return `scan_${random.slice(0, 32)}`;
}

export function App() {
  const [route, setRoute] = useState<RouteState>(() => parseRoute(window.location.pathname));
  const [features, setFeatures] = useState<FeatureFlags>(defaultFeatureFlags);
  const [reports, setReports] = useState<LeadCheckReport[]>(() => loadSavedReports());
  const [activeReport, setActiveReport] = useState<LeadCheckReport | null>(() => {
    const initial = parseRoute(window.location.pathname);
    return initial.reportId ? findSavedReport(initial.reportId) : null;
  });
  const [pendingScan, setPendingScan] = useState<ScanRequest | null>(null);
  const [scanError, setScanError] = useState('');

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    const next = parseRoute(path);
    setRoute(next);
    if (next.reportId) {
      const saved = findSavedReport(next.reportId);
      setActiveReport(saved);
      if (saved) void trackEvent('report_revisited', { reportId: saved.id, domain: saved.requestedWebsite.normalizedDomain });
    }
  }, []);

  useEffect(() => {
    const listener = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener('popstate', listener);
    captureAttributionFromUrl();
    void loadRuntimeFeatureFlags().then(setFeatures);
    void trackEvent('landing_view');
    return () => window.removeEventListener('popstate', listener);
  }, []);

  const startScan = useCallback(
    (input: ScanRequest) => {
      setScanError('');
      setPendingScan({
        ...input,
        clientScanId: input.clientScanId || createClientScanId(),
      });
      navigate('/scan/progress');
    },
    [navigate]
  );

  const completeScan = useCallback(
    (report: LeadCheckReport) => {
      const saved = saveReportLocally(report);
      setReports(saved);
      setActiveReport(report);
      void trackEvent('report_saved', { reportId: report.id, domain: report.requestedWebsite.normalizedDomain, storage: 'local' });
      navigate(`/reports/${encodeURIComponent(report.id)}`);
    },
    [navigate]
  );

  const failScan = useCallback(
    (message: string) => {
      setScanError(message);
      navigate('/scan');
    },
    [navigate]
  );

  const routeContent = useMemo(() => {
    if (route.name === 'dashboard') return <DashboardPage reports={reports} onNavigate={navigate} />;
    if (route.name === 'scan') {
      return (
        <>
          {scanError ? <p className="inline-message error">{scanError}</p> : null}
          <ScanPage onStartScan={startScan} />
        </>
      );
    }
    if (route.name === 'progress') {
      return <ScanProgressPage input={pendingScan} onComplete={completeScan} onFail={failScan} onNavigate={navigate} />;
    }
    if (route.name === 'reports') return <ReportsPage reports={reports} onNavigate={navigate} />;
    if (route.name === 'report') return <ReportPage report={activeReport} features={features} onStartScan={startScan} onNavigate={navigate} />;
    if (route.name === 'account') return <AccountPage />;
    if (route.name === 'privacy') return <LegalPage kind="privacy" onNavigate={navigate} />;
    if (route.name === 'terms') return <LegalPage kind="terms" onNavigate={navigate} />;
    if (route.name === 'support') return <LegalPage kind="support" onNavigate={navigate} />;
    return <LandingPage onStartScan={startScan} onNavigate={navigate} />;
  }, [activeReport, completeScan, failScan, features, navigate, pendingScan, reports, route.name, scanError, startScan]);

  return (
    <AppShell currentPath={route.path} onNavigate={navigate}>
      {routeContent}
    </AppShell>
  );
}
