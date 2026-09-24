import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { LeadCheckReport, ScanRequest } from '../../shared/leadcheck';
import { LeadInfoForm } from '../components/LeadInfoForm';
import { scanStages } from '../data/scanStages';
import { loadAttribution } from '../lib/attribution';
import { createScan } from '../lib/api';
import { trackEvent } from '../lib/analytics';

const STAGE_ADVANCE_MS = 1300;
const PROGRESS_TICK_MS = 180;
const COMPLETION_DELAY_MS = 650;
const MAX_PENDING_PROGRESS = 99;

interface ScanProgressPageProps {
  input: ScanRequest | null;
  onComplete: (report: LeadCheckReport) => void;
  onFail: (message: string) => void;
  onNavigate: (path: string) => void;
}

export function ScanProgressPage({ input, onComplete, onNavigate }: ScanProgressPageProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [scanReady, setScanReady] = useState(false);
  const [progressCompleted, setProgressCompleted] = useState(false);
  const [scanFailedMessage, setScanFailedMessage] = useState<string | null>(null);
  const scanRequest = useRef<{ key: string; promise: ReturnType<typeof createScan> } | null>(null);
  const completedReport = useRef<LeadCheckReport | null>(null);
  const reportDelivered = useRef(false);

  function completeOnce(report: LeadCheckReport) {
    if (reportDelivered.current) return;
    reportDelivered.current = true;
    onComplete(report);
  }

  useEffect(() => {
    if (!input) {
      onNavigate('/scan');
      return;
    }

    const scanKey = JSON.stringify(input);
    if (!scanRequest.current || scanRequest.current.key !== scanKey) {
      void trackEvent('scan_started', { scanId: input.clientScanId, website: input.url });
      scanRequest.current = {
        key: scanKey,
        promise: createScan(input),
      };
      completedReport.current = null;
      reportDelivered.current = false;
      setStageIndex(0);
      setProgressPercent(0);
      setElapsedSeconds(0);
      setLeadSubmitted(false);
      setScanReady(false);
      setProgressCompleted(false);
      setScanFailedMessage(null);
    }

    let cancelled = false;
    const stageTimer = window.setInterval(() => {
      setStageIndex(index => Math.min(index + 1, scanStages.length - 1));
    }, STAGE_ADVANCE_MS);
    const elapsedTimer = window.setInterval(() => {
      setElapsedSeconds(seconds => seconds + 1);
    }, 1000);

    scanRequest.current.promise
      .then(response => {
        if (cancelled) return;
        void trackEvent('scan_completed', {
          scanId: response.report.scan.id,
          domain: response.report.requestedWebsite.normalizedDomain,
          mock: response.report.isMock,
        });
        completedReport.current = response.report;
        setScanReady(true);
      })
      .catch(error => {
        if (cancelled) return;
        const message = error?.message || 'We could not complete the scan. Please check the URL and try again.';
        void trackEvent('scan_failed', { scanId: input.clientScanId, website: input.url, message });
        setScanFailedMessage(message);
      })
      .finally(() => {
        window.clearInterval(stageTimer);
        window.clearInterval(elapsedTimer);
      });

    return () => {
      cancelled = true;
      window.clearInterval(stageTimer);
      window.clearInterval(elapsedTimer);
    };
  }, [input, onComplete, onNavigate]);

  useEffect(() => {
    if (scanFailedMessage) return;

    const progressTimer = window.setInterval(() => {
      setProgressPercent(current => {
        if (scanReady) {
          const remaining = 100 - current;
          if (remaining <= 0.2) return 100;
          return Math.min(100, current + Math.max(1, remaining * 0.18));
        }

        const activeStage = scanStages[stageIndex];
        if (activeStage && current < activeStage.target) {
          const remaining = activeStage.target - current;
          return Math.min(activeStage.target, current + Math.max(0.45, remaining * 0.14));
        }

        if (stageIndex >= scanStages.length - 1 && current < MAX_PENDING_PROGRESS) {
          const remaining = MAX_PENDING_PROGRESS - current;
          if (remaining <= 0.08) return MAX_PENDING_PROGRESS;
          return Math.min(MAX_PENDING_PROGRESS, current + Math.max(0.05, remaining * 0.025));
        }

        return current;
      });
    }, PROGRESS_TICK_MS);

    return () => {
      window.clearInterval(progressTimer);
    };
  }, [scanFailedMessage, scanReady, stageIndex]);

  useEffect(() => {
    if (!scanReady || progressPercent < 100) return;
    setProgressCompleted(true);
  }, [progressPercent, scanReady]);

  useEffect(() => {
    if (!progressCompleted || !leadSubmitted) return;
    const report = completedReport.current;
    if (!report) return;

    const openReportTimer = window.setTimeout(() => {
      completeOnce(report);
    }, COMPLETION_DELAY_MS);

    return () => {
      window.clearTimeout(openReportTimer);
    };
  }, [leadSubmitted, progressCompleted]);

  function handleLeadSubmitted() {
    setLeadSubmitted(true);
  }

  const scanId = input?.clientScanId || '';
  const activeStage = scanStages[stageIndex];
  const roundedProgress = Math.round(progressPercent);
  const progressMessage = progressCompleted
    ? 'Your Website Lead Report is ready'
    : scanReady
      ? 'Finishing your Website Lead Report'
      : activeStage.label;

  return (
    <section className="progress-page progress-with-lead" aria-live="polite">
      <div className={`progress-card${scanFailedMessage ? ' scan-failed-state' : ''}`}>
        {scanFailedMessage ? (
          <>
            <p className="eyebrow">Scan Stopped</p>
            <h1>We could not finish this scan</h1>
            <p>{scanFailedMessage}</p>
            <div
              className="progress-track failed"
              role="progressbar"
              aria-label="Scan progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={roundedProgress}
            >
              <span style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="progress-actions">
              <button className="primary-action" type="button" onClick={() => onNavigate('/scan')}>
                Retry Scan
              </button>
            </div>
          </>
        ) : (
          <>
            <Loader2 className="spinner" size={32} aria-hidden="true" />
            <p className="eyebrow">{progressCompleted ? 'Scan Complete' : 'Checking Your Website'}</p>
            <h1>{progressMessage}</h1>
            <p>
              {leadSubmitted
                ? 'Thanks. We are finishing your scan and preparing your report.'
                : "We're checking whether your website makes it easy for homeowners to understand, trust, and contact your business."}
            </p>
            {elapsedSeconds >= 12 && !scanReady ? (
              <p className="muted">This usually takes about a minute. Larger websites can take a little longer.</p>
            ) : null}
            <div
              className={`progress-track${progressCompleted ? ' complete' : ''}`}
              role="progressbar"
              aria-label="Scan progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={roundedProgress}
            >
              <span style={{ width: `${progressPercent}%` }} />
            </div>
          </>
        )}
      </div>
      <div className="lead-capture-card">
        {scanFailedMessage ? (
          <div className="lead-submitted-state">
            <p className="eyebrow">Try Again</p>
            <h2>The scan did not complete.</h2>
            <p>Start a new check when you are ready. We will keep the next report tied to the website you submit.</p>
          </div>
        ) : leadSubmitted ? (
          <div className="lead-submitted-state">
            <p className="eyebrow">Information Saved</p>
            <h2>
              {progressCompleted
                ? 'Opening your Website Lead Report...'
                : scanReady
                  ? 'Finalizing your report.'
                  : 'Your scan is still running.'}
            </h2>
            <p>Keep this page open. Your Website Lead Report will appear here as soon as the scan is complete.</p>
          </div>
        ) : input && scanId ? (
          <LeadInfoForm
            scanId={scanId}
            websiteUrl={input.url}
            attribution={loadAttribution()}
            onSubmitted={handleLeadSubmitted}
          />
        ) : null}
      </div>
    </section>
  );
}
