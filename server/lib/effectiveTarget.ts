import { trackedItems } from '../db/schema';

export type TrackedItemRow = typeof trackedItems.$inferSelect;

/** Dollar threshold used for alerts and comparisons. */
export function effectiveTargetPrice(item: TrackedItemRow): number {
  if (
    item.targetMode === 'percent_off' &&
    item.targetPercent != null &&
    item.targetReferencePrice != null
  ) {
    const p = item.targetPercent;
    const r = item.targetReferencePrice;
    if (p > 0 && p < 100 && r > 0) return r * (1 - p / 100);
  }
  return item.targetPrice;
}
