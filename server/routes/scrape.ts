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

    const price =
      extractMeta(html, 'og:price:amount') ||
      extractMeta(html, 'product:price:amount') ||
      extractMeta(html, 'twitter:data1');

    const currency =
      extractMeta(html, 'og:price:currency') ||
      extractMeta(html, 'product:price:currency') ||
      'USD';

    res.json({
      url,
      title: title || null,
      description: description || null,
      image: image || null,
      price: price ? parseFloat(price) : null,
      currency,
    });
  } catch (err: any) {
    console.error('Scrape error:', err?.message);
    res.status(500).json({ error: 'Failed to fetch URL' });
  }
});

export default router;
