import 'dotenv/config';
import express from 'express';
import cron from 'node-cron';
import { runMigrations } from './db/index';
import itemsRouter from './routes/items';
import chatRouter from './routes/chat';
import scrapeRouter from './routes/scrape';
import { runPriceCheck } from './jobs/priceChecker';
import { sendPriceAlert } from './jobs/mailer';
import { mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure data directory exists
mkdirSync(path.join(__dirname, '../data'), { recursive: true });

// Run DB migrations on startup
runMigrations();

const app = express();
app.use(express.json());

app.use('/api/items', itemsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/scrape', scrapeRouter);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Manual trigger for price check — waits and returns results
app.post('/api/jobs/price-check', async (_req, res) => {
  try {
    const results = await runPriceCheck();
    res.json({ results });
  } catch (err: any) {
    console.error('[jobs] Price check error:', err?.message);
    res.status(500).json({ error: err?.message ?? 'Price check failed' });
  }
});

// Send a test email to verify Mailgun config
app.post('/api/jobs/test-email', async (req, res) => {
  const toEmail = req.body?.email || process.env.ALERT_EMAIL;
  if (!toEmail) {
    res.status(400).json({ error: 'No email address. Set ALERT_EMAIL in .env or pass { email } in the request body.' });
    return;
  }
  try {
    await sendPriceAlert({
      productName: 'Test Product (Nike Air Max 90)',
      oldPrice: 130.00,
      newPrice: 89.99,
      targetPrice: 100.00,
      hitTarget: true,
      toEmail,
    });
    res.json({ message: `Test email sent to ${toEmail}` });
  } catch (err: any) {
    console.error('[jobs] Test email error:', err?.message);
    res.status(500).json({ error: err?.message ?? 'Failed to send test email' });
  }
});

// Serve frontend static files
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));

const PORT = process.env.API_PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Schedule price check every 6 hours
  // Cron syntax: minute hour * * *
  const schedule = process.env.PRICE_CHECK_CRON ?? '0 */6 * * *';
  cron.schedule(schedule, async () => {
    console.log('[cron] Triggering scheduled price check...');
    try {
      await runPriceCheck();
    } catch (err: any) {
      console.error('[cron] Price check failed:', err?.message);
    }
  });

  console.log(`[cron] Price check scheduled: "${schedule}" (every 6 hours by default)`);
});
