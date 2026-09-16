import type { LeadCheckReport } from '../../shared/leadcheck';

const STORAGE_KEY = 'leadcheck.savedReports.v1';

export function loadSavedReports(): LeadCheckReport[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReportLocally(report: LeadCheckReport): LeadCheckReport[] {
  const reports = loadSavedReports().filter(item => item.id !== report.id);
  const next = [report, ...reports].slice(0, 25);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function findSavedReport(reportId: string): LeadCheckReport | null {
  return loadSavedReports().find(report => report.id === reportId) || null;
}
