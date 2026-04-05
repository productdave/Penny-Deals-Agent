import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { trackedItems, priceHistory } from '../db/schema';
import { randomUUID } from 'crypto';

const router = Router();

// GET /api/items
router.get('/', async (_req, res) => {
  try {
    const items = await db.select().from(trackedItems).orderBy(trackedItems.createdAt);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// POST /api/items
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      status,
      bestPrice,
      targetPrice,
      targetMode,
      targetPercent,
      targetReferencePrice,
      image,
      updatedAt,
      url,
      alertEmail,
    } = req.body;
    const id = randomUUID();
    const [item] = await db.insert(trackedItems).values({
      id,
      name,
      description,
      status: status ?? 'Waiting for Deal',
      bestPrice,
      targetPrice,
      targetMode: targetMode ?? 'absolute',
      targetPercent: targetPercent ?? null,
      targetReferencePrice: targetReferencePrice ?? null,
      image: image ?? '',
      url: url ?? '',
      alertEmail: alertEmail ?? '',
      updatedAt: updatedAt ?? 'Just now',
    }).returning();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PUT /api/items/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const [item] = await db.update(trackedItems).set(updates).where(eq(trackedItems.id, id)).returning();
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /api/items/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(trackedItems).where(eq(trackedItems.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// GET /api/items/:id/price-history
router.get('/:id/price-history', async (req, res) => {
  try {
    const { id } = req.params;
    const history = await db.select().from(priceHistory)
      .where(eq(priceHistory.itemId, id))
      .orderBy(priceHistory.recordedAt);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

// POST /api/items/:id/price-history
router.post('/:id/price-history', async (req, res) => {
  try {
    const { id } = req.params;
    const { price, source } = req.body;
    const [entry] = await db.insert(priceHistory).values({
      itemId: id,
      price,
      source: source ?? 'manual',
    }).returning();
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to record price' });
  }
});

export default router;
