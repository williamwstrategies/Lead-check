# LeadCheck

LeadCheck is a standalone SaaS for free Website Growth Reports.

Positioning: **Find out what's stopping your website from generating more customers.**

Milestone 2 replaces the normal mock scan path with a real PitchProof-inspired website scanner while keeping LeadCheck's standalone product, branding, schema, and UI.

## Stack

- Frontend: React, Vite, TypeScript
- Backend: Node.js, Express, TypeScript
- Auth/database target: Supabase
- Hosting target: Render
- Analytics: provider-agnostic event helper with a lightweight server endpoint
- Website crawling: Playwright with HTTP fallback

## What Works

- Polished LeadCheck landing page
- Free website URL submission
- URL normalization, DNS validation, and private/internal network blocking
- Real Playwright website crawling with capped priority-page discovery
- PitchProof-derived deterministic checks, scoring, caps, and prioritization
- Real Website Growth Report normalized into LeadCheck language
- Report sections for LeadCheck Score, priorities, positives, Google Visibility, Lead Generation, Trust, Website Performance, Website Experience, and Full Website Analysis
- Google Visibility based only on on-site website signals such as titles, headings, services, location relevance, internal links, crawlability, and site structure
- Local saved reports and revisits
- Optional Supabase scan snapshot persistence when service-role config is present
- Optional Supabase Auth scaffold
- Business category support
- Service-help CTA behind a feature flag
- Mock scanner retained only for explicit test/dev usage

## What Is Not Included

Milestone 2 does not include DataForSEO, keyword rankings, Google positions, search volume, estimated organic traffic, keyword opportunity tables, AI Visibility, Google Business Profile scanning, Stripe, payments, subscriptions, credits, pricing tiers, rank tracking, competitor analysis, agency workflows, or white-label features.

## Local Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env
npm run dev
```

Frontend dev server: `http://localhost:5173`

Backend API: `http://localhost:3000`

## Environment Variables

```bash
PORT=3000
HOST=0.0.0.0
APP_ORIGIN=http://localhost:5173
CLIENT_ORIGIN=http://localhost:5173

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

ENABLE_SERVICE_HELP_CTA=true
ENABLE_AI_VISIBILITY=false
ENABLE_COMPETITOR_ANALYSIS=false
ENABLE_MOCK_SCANNER=false
PLAYWRIGHT_BROWSERS_PATH=0
ANALYTICS_LOG_TO_CONSOLE=true
```

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are public/client-safe values used by the optional Supabase Auth scaffold.
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are server-only values used for scan snapshot and lead persistence. Do not expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code.

## Supabase Configuration

1. Create a new Supabase project for LeadCheck.
2. Copy the project URL and anon key into `.env`.
3. Run migrations in `supabase/migrations/` in timestamp order.
4. Enable email/password auth in Supabase if using the account page.

LeadCheck still supports local saved reports for the beta flow. When `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured, completed scan snapshots are also saved to `scan_report_snapshots` for replay/debugging.

## Scanner

The real scanner adapter lives in:

```text
server/services/realScanner.ts
```

The PitchProof-derived deterministic scanner module lives in:

```text
server/services/pitchproofAnalyzer.cjs
```

The mock scanner remains available for tests and explicit dev use:

```text
server/services/mockScanner.ts
```

It implements this interface:

```ts
export interface WebsiteScanProvider {
  runWebsiteScan(input: ScanRequest): Promise<LeadCheckReport>;
}
```

Normal `/api/scans` requests use the real scanner. Mock scenarios are ignored unless `ENABLE_MOCK_SCANNER=true` or `NODE_ENV=test`.

## URL Safety Foundation

URL normalization and validation live in:

```text
server/lib/url.ts
```

The validation layer rejects malformed URLs, unsupported schemes, URL credentials, localhost-style hostnames, `.local`, `.internal`, `.lan`, direct private IP ranges, metadata hostnames, and DNS results that resolve to private/internal addresses. The copied analyzer also blocks unsafe Playwright/HTTP request and redirect targets.

## Crawl Limits

- Max pages per scan: 10
- Playwright page timeout: 20 seconds
- HTTP fallback page timeout: 8 seconds
- Total crawl budget: 120 seconds
- Broken-link checks: 50 internal, 25 external, 5 redirects
- Heavy browser resources blocked: image, media, font
- Render/browser flags: headless Chromium with no-sandbox flags

## Tests

```bash
npm test
```

Tests cover URL validation, private-address blocking, feature flags, mock gating, mock scan completion/failure, real scanner normalization, priority ordering, API scan behavior, and report rendering.

## Build

```bash
npm run build
npm start
```

The production server serves the Vite build from `dist/client` and exposes `/api/health`.

## Render Deployment

Use the included `render.yaml`. LeadCheck should deploy as a single Render Web Service: Express serves the built Vite frontend from `dist/client` and handles `/api/*` routes from the same origin.

Build command:

```bash
npm ci && npx playwright install --with-deps chromium && npm run build
```

Start command:

```bash
npm start
```

Health check path:

```text
/api/health
```

Recommended Render settings:

- Service type: Web Service
- Runtime: Node
- Root directory: repository root, or `leadcheck` if this app lives in a subdirectory of a larger repository
- Build command: `npm ci && npx playwright install --with-deps chromium && npm run build`
- Start command: `npm start`
- Health check path: `/api/health`

Required production environment variables:

```bash
NODE_ENV=production
HOST=0.0.0.0
ENABLE_SERVICE_HELP_CTA=true
ENABLE_AI_VISIBILITY=false
ENABLE_COMPETITOR_ANALYSIS=false
ENABLE_MOCK_SCANNER=false
PLAYWRIGHT_BROWSERS_PATH=0
ANALYTICS_LOG_TO_CONSOLE=false
```

Render provides `PORT`, `RENDER_EXTERNAL_URL`, and the public `onrender.com` URL automatically. The blueprint maps `APP_ORIGIN` from `RENDER_EXTERNAL_URL` so the app works on the first Render-provided URL. When custom domains are connected later, set `APP_ORIGIN` or `CLIENT_ORIGIN` to a comma-separated list such as:

```bash
APP_ORIGIN=https://leadcheck.ca,https://www.leadcheck.ca
```

Supabase variables:

Public/client-safe:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Server-only secrets:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

If Supabase server variables are omitted, scans and leads still work in memory/local app behavior, but production persistence to Supabase tables is skipped.

Playwright requirements:

- The scanner uses Playwright Chromium.
- Render must install both the Chromium browser and Linux browser dependencies.
- The build command uses `npx playwright install --with-deps chromium` for this.
- `PLAYWRIGHT_BROWSERS_PATH=0` keeps the browser install with the deployment artifact.
- The scanner already launches Chromium headlessly with Render-compatible no-sandbox flags.

## Architecture Notes

LeadCheck separates UI, API routes, URL validation, scan orchestration, normalized report data, analytics, feature flags, and Supabase Auth setup. The V1 report UI consumes on-site scanner findings only; keyword ranking providers are intentionally outside the current product scope.
