import OpenAI from 'openai';
import { db } from '../db/index';
import { trackedItems, priceHistory } from '../db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { sendPriceAlert } from './mailer';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PRICE_LOOKUP_PROMPT = `You are a price lookup assistant. Given a product name, find its current lowest retail price in USD.

Respond ONLY with a JSON object in this exact shape:
{
  "price": <number or null>,
  "source": "<retailer name or null>",
  "confidence": "high" | "medium" | "low"
}

Rules:
- price must be a number (e.g. 348.00) or null if you cannot find it
- source should be the retailer name (e.g. "Amazon", "Best Buy")
- confidence reflects how certain you are about the price
- Never fabricate a price — return null if uncertain`;

async function lookupCurrentPrice(productName: string, productUrl?: string): Promise<{
  price: number | null;
  source: string | null;
  confidence: string;
}> {
  try {
    // Prefer URL scraping if we have one (faster, more accurate)
    if (productUrl) {
      try {
        const res = await fetch(productUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) {
          const html = await res.text();
          const priceMatch = html.match(/<meta[^>]+(?:property|name)=["'](?:og:price:amount|product:price:amount)["'][^>]+content=["']([0-9.]+)["']/i)
            || html.match(/<meta[^>]+content=["']([0-9.]+)["'][^>]+(?:property|name)=["'](?:og:price:amount|product:price:amount)["']/i);
          if (priceMatch?.[1]) {
            return { price: parseFloat(priceMatch[1]), source: new URL(productUrl).hostname, confidence: 'high' };
          }
        }
      } catch { /* fallthrough to AI */ }
    }

    // Fall back to GPT-4o web search
    let rawOutput = '';
    try {
      const response = await (openai as any).responses.create({
        model: 'gpt-4o',
        tools: [{ type: 'web_search_preview' }],
        instructions: PRICE_LOOKUP_PROMPT,
        input: `Find the current lowest retail price for: ${productName}`,
        text: { format: { type: 'json_object' } },
      });
      rawOutput = response.output_text ?? '';
    } catch {
      const fallback = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: PRICE_LOOKUP_PROMPT },
          { role: 'user', content: `Find the current lowest retail price for: ${productName}` },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 100,
        temperature: 0,
      });
      rawOutput = fallback.choices[0].message.content ?? '{}';
    }

    const parsed = JSON.parse(rawOutput);
    return {
      price: typeof parsed.price === 'number' ? parsed.price : null,
      source: parsed.source ?? null,
      confidence: parsed.confidence ?? 'low',
    };
  } catch (err: any) {
    console.error(`[priceChecker] Failed to lookup price for "${productName}":`, err?.message);
    return { price: null, source: null, confidence: 'low' };
  }
}

export async function runPriceCheck() {
  console.log('[priceChecker] Starting price check run...');

  const items = await db.select().from(trackedItems);
  console.log(`[priceChecker] Checking ${items.length} item(s)`);

  for (const item of items) {
    console.log(`[priceChecker] Checking: ${item.name}`);

    const { price: newPrice, source, confidence } = await lookupCurrentPrice(item.name, item.url ?? undefined);

    if (newPrice === null || confidence === 'low') {
      console.log(`[priceChecker] Low confidence or no price for "${item.name}", skipping`);
      continue;
    }

    const oldPrice = item.bestPrice;
    const priceChanged = Math.abs(newPrice - oldPrice) >= 0.01;

    if (!priceChanged) {
      console.log(`[priceChecker] No change for "${item.name}" ($${newPrice})`);
      continue;
    }

    console.log(`[priceChecker] Price changed for "${item.name}": $${oldPrice} → $${newPrice} (via ${source})`);

    // Determine new status
    const hitTarget = newPrice <= item.targetPrice;
    const newStatus = hitTarget ? 'Price Drop!' : newPrice < oldPrice ? 'Price Drop!' : 'Stable';
    const now = new Date();

    // Update tracked item
    await db.update(trackedItems)
      .set({
        bestPrice: newPrice,
        status: newStatus,
        updatedAt: `Updated just now`,
      })
      .where(eq(trackedItems.id, item.id));

    // Record price history
    await db.insert(priceHistory).values({
      itemId: item.id,
      price: newPrice,
      source: source ?? 'web_search',
      recordedAt: now,
    });

    // Send email alert if price dropped
    const alertEmail = item.alertEmail || process.env.ALERT_EMAIL;
    if (alertEmail && newPrice < oldPrice) {
      try {
        await sendPriceAlert({
          productName: item.name,
          oldPrice,
          newPrice,
          targetPrice: item.targetPrice,
          hitTarget,
          image: item.image ?? undefined,
          url: item.url ?? undefined,
          toEmail: alertEmail,
        });
      } catch (err: any) {
        console.error(`[priceChecker] Failed to send alert for "${item.name}":`, err?.message);
      }
    }
  }

  console.log('[priceChecker] Price check run complete');
}
