import { Router } from 'express';

const router = Router();

function extractMeta(html: string, property: string): string {
  // Matches both property="..." and name="..." meta tags
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim() ?? '';
}

function parseOfferPrice(offers: unknown): number | null {
  if (!offers) return null;
  const list = Array.isArray(offers) ? offers : [offers];
  for (const o of list) {
    if (!o || typeof o !== 'object') continue;
    const obj = o as Record<string, unknown>;
    const raw = obj.price ?? obj.lowPrice ?? obj.highPrice;
    if (typeof raw === 'number' && raw > 0) return raw;
    if (typeof raw === 'string') {
      const n = parseFloat(raw.replace(/[^0-9.]/g, ''));
      if (!isNaN(n) && n > 0) return n;
    }
  }
  return null;
}

function walkJsonLdForProductPrice(node: unknown): number | null {
  if (node == null) return null;
  if (Array.isArray(node)) {
    for (const x of node) {
      const p = walkJsonLdForProductPrice(x);
      if (p != null) return p;
    }
    return null;
  }
  if (typeof node !== 'object') return null;
  const o = node as Record<string, unknown>;
  if (o['@graph']) {
    const p = walkJsonLdForProductPrice(o['@graph']);
    if (p != null) return p;
  }
  const types = o['@type'];
  const typeStr = Array.isArray(types) ? types.join(' ') : String(types ?? '');
  if (/\bProduct\b/i.test(typeStr)) {
    const fromOffers = parseOfferPrice(o.offers);
    if (fromOffers != null) return fromOffers;
  }
  for (const v of Object.values(o)) {
    const p = walkJsonLdForProductPrice(v);
    if (p != null) return p;
  }
  return null;
}

/** Prefer schema.org Product offers (many retailers, including Nike) over generic meta tags. */
function extractJsonLdProductPrice(html: string): number | null {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    if (!raw) continue;
    try {
      const data = JSON.parse(raw) as unknown;
      const price = walkJsonLdForProductPrice(data);
      if (price != null) return price;
    } catch {
      /* ignore invalid JSON */
    }
  }
  return null;
}

// GET /api/scrape?url=...
router.get('/', async (req, res) => {
  const { url } = req.query as { url?: string };
  if (!url) return res.status(400).json({ error: 'url query param required' });

  try {
    new URL(url); // validate
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Upstream returned ${response.status}` });
    }

    const html = await response.text();

    const title =
      extractMeta(html, 'og:title') ||
      extractMeta(html, 'twitter:title') ||
      extractTitle(html);

    const description =
      extractMeta(html, 'og:description') ||
      extractMeta(html, 'twitter:description') ||
      extractMeta(html, 'description');

    const image =
      extractMeta(html, 'og:image') ||
      extractMeta(html, 'twitter:image') ||
      extractMeta(html, 'twitter:image:src');

    const jsonLdPrice = extractJsonLdProductPrice(html);
    const metaPriceStr =
      extractMeta(html, 'og:price:amount') ||
      extractMeta(html, 'product:price:amount') ||
      extractMeta(html, 'twitter:data1');
    const metaPrice = metaPriceStr ? parseFloat(metaPriceStr) : null;
    const price =
      jsonLdPrice ??
      (metaPrice != null && !isNaN(metaPrice) && metaPrice > 0 ? metaPrice : null);

    const currency =
      extractMeta(html, 'og:price:currency') ||
      extractMeta(html, 'product:price:currency') ||
      'USD';

    res.json({
      url,
      title: title || null,
      description: description || null,
      image: image || null,
      price,
      currency,
    });
  } catch (err: any) {
    console.error('Scrape error:', err?.message);
    res.status(500).json({ error: 'Failed to fetch URL' });
  }
});

export default router;
