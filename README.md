Project Name
───────────
WebTimeWise – a cross-platform screen-time coach consisting of a Chrome extension, an Expo/React-Native companion app, and a Supabase back-end.

High-level flow
───────────────
1. Chrome extension tracks browser activity, writes daily aggregates to `chrome.storage.local`, blocks distracting sites, shows interactive dashboards, and fetches mobile data from Supabase.
2. Expo mobile app lets the user edit / sync their phone-usage data to the same Supabase table.
3. Supabase (PostgreSQL + PostgREST) acts as the single source of truth for non-browser devices and for public-share links.
4. A public “Weekly Summary” webpage reads the cached data from the extension and offers one-click share to LinkedIn, Facebook, Twitter, WhatsApp, etc.

────────────────────────────────────────
Chrome Extension (WebTimeWise)
────────────────────────────────────────
Language & tooling
• Manifest v3, pure JavaScript (ES modules)
• HTML/CSS (dark-mode variables)
• Chart.js 4 for pie / doughnut / line charts
• Google Favicon service for site logos
• Flags for i18n; translations managed in `popup.js`
• Bundling: none – shipped as source files

Core background logic (`background.js`)
• Tab tracking (onActivated, onUpdated, onFocusChanged)
• 1 s interval to add time-deltas into `timeData[date].sites|categories`
• Dynamic blocking via `chrome.declarativeNetRequest` for manual blocks
• Focus-Mode blocking via live redirect inside `startTracking()`
• Midnight reset scheduler (setTimeout → schedule next midnight)
• Goals notifications (basic & social-media alert)
• Alarms:
– `blockCleanup` (remove expired manual blocks)
– `focusModeOff` (auto-disable Focus Mode timer)

Popup UI (`popup.html / popup.js / popup.css`)
• Today / This-week toggles, category/website switcher
• Top-sites list, category colour dots, session insights, goals modal, settings modal
• Language flag picker (English, 中文, हिन्दी, 日本語, Français, Español)
• Focus-Mode section (collapsible `<details>` with favicon list, add-site input, toggle switch, optional timer & live countdown)
• Removed legacy “Block Website” section and merged timer into Focus panel
• Footer button opens full-screen dashboard; bolt badge for attribution

Dashboard pages
• dashboard.html – injects popup markup, full-screen layout
• device-select.html – card grid (Browser, Mobile, Laptop, Overall)
• mobile-view.html + mobile-view.js – reads Supabase `device_usage` row, draws doughnut & list
• laptop-view.html – dummy desktop numbers (for demo)
• overall-view.html – combines browser + mobile + laptop for total pie charts
• public-stats.html – standalone share page (served by extension); copy-link & share buttons

Blocked page (`blocked.html / blocked.js`)
• Shows remaining minutes; suggestions list; “Go Back” button
• When query-string contains `focus=1` it polls `chrome.storage` and redirects back as soon as `focusActive` flips to false or receives a `FOCUS_ENDED` message.

YouTube AI classification (`youtube-classifier.js`)
• Content-script injected only on `youtube.com/watch*`
• URL watcher (setInterval) + DOMContentLoaded gate
• Collects title, channel, description, sends prompt to OpenRouter GPT-3.5-Turbo
• Caches result in `chrome.storage.local` (key `youtubeClassification`)
• Normalises replies to {Productive | Entertainment | News | Other}

Content page visit logger (`content.js`)
• Retries message to background with exponential back-off
• Extracts page text; very light keyword classification
• Stores last 1 000 visits locally for weekly summary

────────────────────────────────────────
Mobile App (Expo + React Native)
────────────────────────────────────────
Tooling & libraries
• Expo SDK 50 (Web + iOS + Android)
• React-Native hooks (`useMobileData`, `useFrameworkReady`)
• AsyncStorage for local-draft usage entries
• Fetch API to Supabase REST endpoints (no native SDK – keeps size tiny)

Key files
• `components/ScreenTimeCard.tsx` – circular progress components
• `hooks/useScreenTimeData.ts` – gathers dummy or real data, exposes `syncData()`
• `SyncButton.tsx` – onClick → calls `syncMobileData(payload)`; alerts on success/fail

Supabase sync (`syncMobileData`)
```ts
POST https://<project>.supabase.co/rest/v1/device_usage
Headers:
apikey, Authorization (anon_key)
Prefer: resolution=merge-duplicates
Body:
{ device:'mobile', date:'YYYY-MM-DD', data:[{app,time,domain,category}] }
```

On web (localhost:8081) CORS works automatically because Supabase
sends `Access-Control-Allow-Origin:*`.

────────────────────────────────────────
Supabase (back-end)
────────────────────────────────────────
• PostgreSQL 15, region – us-east-1
• Table `device_usage`
Columns: id (uuid default), device (text), date (date), data (jsonb)
Composite UNIQUE(device,date)
• Row-Level Security
```sql
create policy anon_upsert
on device_usage
for insert with check (true)
using ((device = 'mobile' OR device = 'browser' OR device = 'laptop'));
create policy anon_update
on device_usage
for update using ( device = 'mobile' OR device = 'browser' OR device = 'laptop');
```

────────────────────────────────────────
Public weekly-summary page
────────────────────────────────────────
• Fetches last 7 days from `chrome.storage.local` for the active user
• Pie chart of categories, text summary, “badge” (🏆 / 💪 / ⏳)
• Share sheet: Web Share API fallback → manual links
– LinkedIn, Facebook, Twitter (X), WhatsApp; Instagram shows alert to copy link.

────────────────────────────────────────
Browser-extension APIs used
────────────────────────────────────────
• storage.local
• tabs (query, get, update)
• windows (focus change)
• alarms
• declarativeNetRequest (dynamic rules)
• notifications
• i18n (flag UI handled manually)
• runtime messaging (content ⇄ background ⇄ popup)

────────────────────────────────────────
3rd-party services
────────────────────────────────────────
• OpenRouter.ai (GPT-3.5-Turbo) – YouTube category AI
• Supabase – Postgres hosting, REST, RLS, Dashboard
• Google Favicon – quick site icons

────────────────────────────────────────
Build / run
────────────────────────────────────────
Extension: load `project/` as an unpacked extension in Chrome → click toolbar icon.
Mobile app: `npm start` inside `MobileApp/`, choose “Run in browser” or scan QR in Expo-Go.
No bundler/server required; all assets served from extension package or Expo dev-server.

────────────────────────────────────────
Features checklist
────────────────────────────────────────
✓ Real-time browser tracking (per-site & per-category)
✓ Goal setting & notifications
✓ Focus Mode with per-mode block-list, optional timer, automatic unblock
✓ Manual temporary block (merged into Focus UI)
✓ Weekly & full-dashboard views (browser, mobile, laptop, overall)
✓ AI-based YouTube category override
✓ Multi-language UI (EN, ZH, HI, JA, FR, ES)
✓ Public share page + social share sheet
✓ Expo app to edit/sync mobile usage
✓ Supabase back-end with row-level security
✓ Dark/light themes & accent colour support

The result is an entirely client-side, privacy-friendly productivity suite that correlates
desktop and mobile screen-time, blocks distractions on demand, and lets users brag about
their weekly stats with a single click.
