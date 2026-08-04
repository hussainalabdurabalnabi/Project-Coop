# Excel Graph Site

A web application (also available as an Android app) that lets QA engineers upload Excel-based test/regression reports and instantly view them as visual dashboards — no manual charting required.

## What it does

- **Upload** an Excel report (`.xlsx`/`.xls`) via drag-and-drop or file picker, with a live progress bar
- **Automatically extracts** structured mini-tables from messy, multi-section report layouts (e.g. QA regression status reports, defect summaries)
- **Visualizes** the data as bar charts, pie charts, and trend lines
- **View the raw sheet** in a collapsible table, alongside the generated charts
- **Chat with an AI assistant** (powered by Google Gemini) that can answer questions about the currently loaded report
- **Sign in** with Google or email/password — each user only sees their own uploaded reports
- **Revisit past uploads** anytime via a dropdown, without re-uploading
- Packaged as a native **Android app** (via Capacitor) in addition to running as a website

## Tech stack

- **Frontend & backend:** Next.js (React) — a single app handles both the UI and the API routes
- **Database:** Turso (hosted SQLite) — stores uploaded report data and user accounts
- **Auth:** Auth.js (NextAuth) — Google OAuth + email/password login
- **Charts:** Recharts
- **AI assistant:** Google Gemini API
- **Mobile:** Capacitor (wraps the live website in a native Android app)
- **Hosting:** Vercel

## Running it locally

1. Clone the repo and install dependencies:
    npm install
2. Create a `.env.local` file in the project root with the following variables:
    TURSO_DATABASE_URL=
    TURSO_AUTH_TOKEN=
    AUTH_SECRET=
    AUTH_GOOGLE_ID=
    AUTH_GOOGLE_SECRET=
    GEMINI_API_KEY=

3. Start the dev server:
    npm run dev

4. Visit `http://localhost:3000`

## Deployment

The site is deployed on Vercel. Environment variables above must also be added in the Vercel project's settings for the live site to function, and the Google OAuth client's authorized origins/redirect URIs must include the live domain.

## Android app

The Android app (via Capacitor) loads the live deployed website inside a native shell rather than bundling files locally. To build/run it:
    npx cap sync android
    npx cap open android

Then run it from Android Studio.

Save it, and if you want, push it:
    git add .
    git commit -m "Add README"
    git push

