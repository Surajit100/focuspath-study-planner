# FocusPath Study Planner

A responsive installable PWA for your 90-day learning and job-search plan.

## Included
- Daily checklist with editable tasks, categories, durations and notes
- Recurring daily tasks and task completion dates
- Reminder times and browser notifications while the app is running
- 90-day roadmap: Pandas/revision, analytics, LangChain, ML, LangGraph, English and job search
- Progress by category, daily completion, streaks and weekly activity
- JSON export/import backups
- Optional cross-device sync using your own Supabase project
- Offline shell via service worker after first load

## Run locally
The app uses a service worker, so serve it over localhost rather than opening `index.html` directly.

Python:
```bash
python -m http.server 8000
```
Open http://localhost:8000

Or use VS Code Live Server. For phone installation, deploy to an HTTPS host such as GitHub Pages, Netlify or Vercel, then open the URL in Chrome on Android and choose **Install app** / **Add to Home screen**.

## Notifications: important limitation
Browser notifications work only when permission is granted and the app's page/tab is running. The app checks reminder times every 15 seconds. A browser may suspend background tabs, and this version does **not** guarantee notifications when Chrome is fully closed or the device is offline. Reliable push notifications require a push backend/service (for example, Web Push with VAPID and a scheduled server) or a native Android app with scheduled notifications. The service worker here supports notification clicks, not server-scheduled push.

## Optional cross-device sync (Supabase)
1. Create a Supabase project.
2. In SQL Editor, run `supabase.sql`.
3. In Authentication settings, enable email/password. For simplest setup, configure email confirmation according to your preference.
4. Copy the project URL and **anon/public key** (never the service-role key).
5. Deploy FocusPath to HTTPS and open Settings & sync on each device.
6. Enter the same Supabase URL/key and account email/password, create the account on one device, then sign in on the other.
7. Use **Sync now** after making changes. Current sync is a manual snapshot/upsert, not live realtime sync.

For stronger security, do not share accounts. Use a unique strong password. The app stores the access token in local browser storage, so use it only on devices you control.

## Deploy
Upload the files to a static HTTPS host. No build step is required. Configure the host to serve `index.html` at the root.
