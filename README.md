<div align="center">

<img src="assets/readme-cover.png" width="100%" alt="Penny researches products and recommends whether to buy, wait, or track the price" />

# Penny — AI Shopping Intelligence

**Research a product, understand the price, and know whether to Buy, Wait, or Track.**

A personal AI shopping concierge that brings product research, purchase timing, and price tracking into one conversation.

</div>

## What it does

Send Penny a product name or URL. It researches available product and pricing information, returns a structured recommendation, and can continue checking the product against a fixed or percentage-based price target.

The result is a clear **Buy, Wait, or Track** decision with the evidence, confidence, and next steps behind it.

## Key features

- **AI product research** — investigates products by name or URL using web search and available retailer metadata
- **Buy, Wait, or Track recommendations** — returns a clear verdict with confidence, reasoning, and suggested next steps
- **Flexible price targets** — supports a fixed dollar target or a percentage below a reference price
- **Tracked portfolio** — stores products, targets, recorded prices, and status in one place
- **Portfolio-aware chat** — answers questions about individual products or your complete tracked collection
- **Price history** — records successful price checks and displays their reported sources
- **Alternative products** — searches for comparable options and lets you open or track suitable results
- **Scheduled monitoring** — checks tracked products on a configurable cron schedule
- **Email alerts** — uses Mailgun to notify you when Penny detects a price decrease and identifies when your target has been reached
- **Manual controls** — run a price check or test email delivery from the Settings screen

## How to use

1. Open Penny and select **Get Started**.
2. Enter a product name or paste a product-page URL.
3. Review Penny's recommendation, confidence, reasoning, and next steps.
4. Choose **Add to Tracked Portfolio**.
5. Set either a fixed target, such as `$99`, or a relative target, such as `20% below the current price`.
6. Open **Tracked Products** to review the target, latest recorded price, price history, purchase link, and alternatives.
7. Use **Settings** to run a manual price check or test Mailgun delivery.

You can also ask questions such as:

- `Is now a good time to buy the Sony WH-1000XM5?`
- `Research this product for me: [URL]`
- `Show me everything I am tracking`
- `Which tracked items are closest to their target?`
- `Find alternatives to this product`

## Run locally

### Requirements

- Node.js 20+
- npm
- An OpenAI API key
- Mailgun credentials if you want email alerts

Clone the repository, install dependencies, and create your environment file:

```bash
git clone https://github.com/productdave/Penny-Deals-Agent.git
cd Penny-Deals-Agent
npm install
cp .env.example .env
```

Add your configuration to `.env`:

```dotenv
OPENAI_API_KEY=sk-...

# Optional email alerts
MAILGUN_API_KEY=key-...
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM=Penny Intelligence <penny@mg.yourdomain.com>
MAILGUN_API_URL=https://api.mailgun.net
ALERT_EMAIL=you@example.com

# Optional; defaults to every six hours
PRICE_CHECK_CRON=0 */6 * * *
```

Start the backend:

```bash
npm run server
```

In a second terminal, start the frontend:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The backend runs on port `3001` by default, and database migrations run automatically when it starts.

### Production build

```bash
npm run build
npm start
```

The production Express server serves both the API and compiled frontend from `PORT`, or port `3001` by default.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| Backend | Express 4, Node.js, TypeScript |
| AI research | OpenAI GPT-4o, Responses API, web search |
| Data | SQLite, `better-sqlite3`, Drizzle ORM |
| Scheduling | `node-cron` |
| Email | Mailgun |
| Deployment | Docker, Railway configuration |

## Status and limitations

Penny is a personal, single-user prototype rather than a production commerce platform.

- It currently accepts text and product URLs. Image upload is not implemented.
- Product prices are handled in USD.
- Web results and retailer metadata can be missing, delayed, or inaccurate.
- For a fixed-price target, the initial displayed portfolio price is a placeholder until the first successful price check.
- Always confirm the retailer, final price, availability, shipping, and return policy before purchasing.
- Scheduled checks run only while the server is running.
- Alerts require valid Mailgun credentials.
- Authentication and multi-user data isolation are not implemented.
- SQLite data is stored locally. Hosted deployments should mount persistent storage at `/app/data`.
- OpenAI API usage may incur charges.
- The repository does not currently include an automated test suite.
