import 'dotenv/config';
import express from 'express';
import cron from 'node-cron';
import { runMigrations } from './db/index';
import itemsRouter from './routes/items';
import chatRouter from './routes/chat';
import scrapeRouter from './routes/scrape';
import { runPriceCheck } from './jobs/priceChecker';
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

// Manual trigger for price check (useful for testing)
app.post('/api/jobs/price-check', async (_req, res) => {
  try {
    res.json({ message: 'Price check started' });
    await runPriceCheck(); // Run after responding so request doesn't hang
  } catch (err: any) {
    console.error('[jobs] Price check error:', err?.message);
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
