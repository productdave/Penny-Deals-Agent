# Penny — AI Shopping Intelligence

Penny is a personal shopping concierge that researches products, compares prices, and gives you a precise **Buy, Wait, or Track** directive. Powered by GPT-4o with live web search.

## Features

- **AI Research** — GPT-4o searches the web for real-time pricing, reviews, and market timing
- **Buy / Wait / Track verdicts** — structured recommendations with confidence ratings
- **Tracked Portfolio** — save items and monitor prices over time
- **Automated Price Checks** — cron job checks prices every 6 hours and emails you when they drop
- **Email Alerts** — Mailgun-powered notifications when a tracked item hits your target price

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS 4
- **Backend**: Express + TypeScript (`tsx watch`)
- **Database**: SQLite via `better-sqlite3` + Drizzle ORM
- **AI**: OpenAI GPT-4o (Responses API with `web_search_preview`)
- **Email**: Mailgun

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env` and fill in your keys:
   ```bash
   cp .env.example .env
   ```
   ```
   OPENAI_API_KEY=sk-...
   MAILGUN_API_KEY=key-...
   MAILGUN_DOMAIN=mg.yourdomain.com
   MAILGUN_FROM=Penny Intelligence <penny@mg.yourdomain.com>
   MAILGUN_API_URL=https://api.mailgun.net
   ALERT_EMAIL=you@youremail.com
   ```

3. Run the backend:
   ```bash
   npm run server
   ```

4. In a separate terminal, run the frontend:
   ```bash
   npm run dev
   ```

5. Open `http://localhost:5173`

## Price Tracking

Prices are checked automatically on a cron schedule (default: every 6 hours). You can change this in `.env`:

```
PRICE_CHECK_CRON=0 */6 * * *   # every 6 hours (default)
PRICE_CHECK_CRON=0 9 * * *     # every day at 9am
```

To trigger a manual check or test your email setup, go to the **Settings** tab in the app.
