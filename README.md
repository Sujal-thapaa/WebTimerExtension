# 📊 WebTimeWise

A cross-platform screen-time coach consisting of a **Chrome Extension**, an **Expo/React-Native mobile app**, and a **Supabase back-end**.

---

## 🔁 High-Level Flow

1. 🧩 **Chrome Extension** – Tracks browser activity, blocks distractions, stores usage data, and fetches synced mobile usage from Supabase.
2. 📱 **Expo Mobile App** – Allows users to sync/edit mobile app usage data to Supabase.
3. 🛢️ **Supabase** – Central database for syncing mobile and browser usage.
4. 🌐 **Public Share Page** – A “Weekly Summary” webpage to visualize and share time usage via social platforms.

---

## 🧩 Chrome Extension

### ⚙️ Tech Stack
- Manifest V3
- JavaScript (ES modules)
- HTML/CSS (Dark Mode support)
- [Chart.js 4](https://www.chartjs.org/)
- Google Favicon API
- Multi-language support via flag picker
- No bundler – all files shipped as source

### 🧠 Background Logic
- Tab activity tracking using Chrome APIs
- 1s interval delta-tracking into per-site/category store
- Manual block + Focus Mode blocking via `declarativeNetRequest`
- Scheduled midnight reset
- Goal notifications
- Alarm events for block expiry & Focus timer

### 📺 Popup UI
- Today / This Week view toggle
- Top sites, category/session insights
- Goal & settings modals
- Focus Mode UI: timer, live favicon list, block list
- Language flags: English, 中文, हिन्दी, 日本語, Français, Español
- Dashboard button + Built with Bolt badge

### 📊 Dashboard Pages
- `dashboard.html` – Full-screen injected popup UI
- `device-select.html` – Cards: Browser, Mobile, Laptop, Overall
- `mobile-view.html` – Reads mobile usage data from Supabase
- `laptop-view.html` – Demo-only view
- `overall-view.html` – Combines all devices
- `public-stats.html` – Standalone shareable summary

### 🚫 Blocked Page
- Displays remaining time
- Shows suggestions + Go Back button
- Automatically unblocks when Focus ends

### 🎥 YouTube Classification
- Classifies watched videos via OpenRouter GPT-3.5-Turbo
- Injected only on `youtube.com/watch*`
- Cached locally in `chrome.storage.local`

### 🧾 Content Script Logger
- Captures visit details + light classification
- Stores last 1000 visits for summaries

---

## 📱 Mobile App (Expo + React Native)

### ⚙️ Libraries
- Expo SDK 50
- React Hooks
- AsyncStorage
- Supabase REST (no native SDK)

### 🧩 Key Components
- `ScreenTimeCard.tsx` – Circular progress component
- `useScreenTimeData.ts` – Data collection + syncing
- `SyncButton.tsx` – One-click upload to Supabase

### 🔄 Supabase Sync (Example)
```ts
POST https://<project>.supabase.co/rest/v1/device_usage
Headers:
  apikey, Authorization
  Prefer: resolution=merge-duplicates

Body:
{
  device: "mobile",
  date: "YYYY-MM-DD",
  data: [{ app, time, domain, category }]
}
🗄️ Supabase Back-End
PostgreSQL 15, us-east-1 region

Table: device_usage

Columns: id, device, date, data (jsonb)

Unique Composite Key: (device, date)

🔐 Row-Level Security
sql
Copy
Edit
create policy anon_upsert
on device_usage
for insert with check (true)
using ((device = 'mobile' OR device = 'browser' OR device = 'laptop'));

create policy anon_update
on device_usage
for update using (device = 'mobile' OR device = 'browser' OR device = 'laptop');
🌐 Public Share Page
Shows 7-day summary from chrome.storage.local

Includes badge (🏆 / 💪 / ⏳)

Web Share API + manual share links (LinkedIn, X, WhatsApp)

🌐 Chrome APIs Used
storage.local

tabs, windows

alarms

declarativeNetRequest

notifications

i18n

runtime messaging

🧩 3rd-Party Services
🧠 OpenRouter.ai (GPT-3.5-Turbo) – YouTube AI classification

🛢️ Supabase – Database & REST sync

🔎 Google Favicon API – Site logos

🛠️ Build & Run
Chrome Extension

Load /project/ folder as an unpacked extension in chrome://extensions

Mobile App

bash
Copy
Edit
cd MobileApp/
npm install
npm start
Run in browser or scan Expo QR code on your phone

✅ Features Checklist
✅ Real-time browser activity tracker

✅ Daily/weekly views per site/category

✅ Goal setting + productivity alerts

✅ Focus Mode with smart blocking

✅ AI-powered YouTube categorization

✅ Multi-language support (EN, ZH, HI, JA, FR, ES)

✅ Mobile data sync via Supabase

✅ Public stats share page with social sharing

✅ Bolt-built dashboard interface

✅ Privacy-first (all client-side)

🧩 Built With
🧱 Bolt.new – UI builder & project base

🛢️ Supabase – Backend as a service

🧠 OpenRouter – AI classification

🧪 Chart.js – Data visualization


