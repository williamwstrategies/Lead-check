import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import type { ApiErrorBody, LeadCaptureRequest, ScanRequest } from '../shared/leadcheck.js';
import { defaultFeatureFlags } from '../shared/leadcheck.js';
import { clientOrigins, featureFlagsFromEnv, host, port } from './config/env.js';
import { UrlValidationError, normalizeWebsiteUrl } from './lib/url.js';
import { trackServerEvent } from './services/analytics.js';
import { captureLead, LeadCaptureError } from './services/leads.js';
import { ApiRouteError, runScanForRequest } from './services/scanController.js';
import { scanRateLimit } from './services/rateLimit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();
  type AsyncRequestHandler = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => Promise<unknown>;
  const asyncHandler =
    (handler: AsyncRequestHandler): express.RequestHandler =>
    (req, res, next) => {
      Promise.resolve(handler(req, res, next)).catch(next);
    };

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }

        const allowedOrigins = clientOrigins();
        callback(null, allowedOrigins.includes(origin));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'leadcheck',
    });
  });

  app.get('/api/config', (_req, res) => {
    res.json({
      appName: 'LeadCheck',
      features: {
        ...defaultFeatureFlags,
        ...featureFlagsFromEnv(),
      },
      supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
  });

  app.post('/api/validate-url', (req, res) => {
    const normalized = normalizeWebsiteUrl(String(req.body?.url || ''));
    res.json({ website: normalized });
  });

  app.post('/api/scans', scanRateLimit(), asyncHandler(async (req, res) => {
    const input = req.body as ScanRequest;
    const report = await runScanForRequest(input, String(req.get('x-leadcheck-anonymous-id') || ''));
    res.status(201).json({ report });
  }));

  app.post('/api/leads', asyncHandler(async (req, res) => {
    const input = {
      ...(req.body as LeadCaptureRequest),
      idempotencyKey: String(req.body?.idempotencyKey || req.get('x-leadcheck-idempotency-key') || ''),
    } satisfies LeadCaptureRequest;
    const anonymousId = String(req.get('x-leadcheck-anonymous-id') || '');
    const result = await captureLead(input, anonymousId);
    await trackServerEvent({
      event: 'lead_info_submitted',
      anonymousId,
      properties: {
        scanId: result.lead.scan_id,
        domain: result.lead.normalized_domain,
        deduplicated: result.deduplicated,
      },
    });
    res.status(result.deduplicated ? 200 : 201).json(result);
  }));

  app.post('/api/analytics/events', asyncHandler(async (req, res) => {
    await trackServerEvent({
      event: String(req.body?.event || ''),
      anonymousId: String(req.body?.anonymousId || req.get('x-leadcheck-anonymous-id') || ''),
      userId: String(req.body?.userId || ''),
      properties: req.body?.properties && typeof req.body.properties === 'object' ? req.body.properties : {},
    });
    res.status(202).json({ ok: true });
  }));

  app.post('/api/service-help', asyncHandler(async (req, res) => {
    if (!featureFlagsFromEnv().enableServiceHelpCta) {
      return res.status(404).json({ error: 'Service help is not enabled.', code: 'service_help_disabled' });
    }
    await trackServerEvent({
      event: 'help_cta_clicked',
      anonymousId: String(req.get('x-leadcheck-anonymous-id') || ''),
      properties: {
        reportId: String(req.body?.reportId || ''),
        website: String(req.body?.website || ''),
      },
    });
    res.status(202).json({
      ok: true,
      message: "Thanks. We've recorded that you're interested in help improving this website.",
    });
  }));

  const publicDir = path.resolve(__dirname, '../../client');
  app.use(express.static(publicDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof UrlValidationError) {
      return res.status(422).json({
        error: error.message,
        code: error.code,
      } satisfies ApiErrorBody);
    }
    if (error instanceof ApiRouteError) {
      return res.status(error.statusCode).json(error.body);
    }
    if (error instanceof LeadCaptureError) {
      return res.status(error.statusCode).json(error.body);
    }
    console.error('[LeadCheck] API error:', error);
    res.status(500).json({
      error: 'Something went wrong. Please try again.',
      code: 'internal_error',
    } satisfies ApiErrorBody);
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  createApp().listen(port(), host(), () => {
    console.info(`LeadCheck running on ${host()}:${port()}`);
  });
}
