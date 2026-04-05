export type TargetSpec =
  | { kind: 'absolute'; amount: number }
  | { kind: 'percent_off'; percent: number; referencePrice: number };

export function parseTargetFromUserText(text: string, fallbackReference: number): TargetSpec | null {
  const lower = text.toLowerCase();
  const pctMatch =
    text.match(/(\d+(?:\.\d+)?)\s*%/) ||
    lower.match(/(\d+(?:\.\d+)?)\s*(?:percent|pct)\b/);
  const relativeCue = /\b(lower|less|cheaper|off|discount|below|under|drop|reduction|save)\b/.test(lower);
  const looksPercent = Boolean(pctMatch && (relativeCue || text.includes('%')));

  const dollarNums: number[] = [];
  for (const m of text.matchAll(/\$?\s*([\d,]+\.?\d*)\b/g)) {
    const n = parseFloat(m[1].replace(/,/g, ''));
    if (!isNaN(n) && n > 0) dollarNums.push(n);
  }

  if (looksPercent && pctMatch) {
    const percent = parseFloat(pctMatch[1]);
    if (!(percent > 0 && percent < 100)) return null;
    const refFromText = dollarNums[0];
    const referencePrice = refFromText ?? (fallbackReference > 0 ? fallbackReference : 0);
    if (referencePrice <= 0) return null;
    return { kind: 'percent_off', percent, referencePrice };
  }

  const stripped = text.replace(/[^0-9.]/g, '');
  const priceOnly = parseFloat(stripped);
  if (!isNaN(priceOnly) && priceOnly > 0) return { kind: 'absolute', amount: priceOnly };
  return null;
}

function coerceApiTarget(raw: unknown, fallbackReference: number): TargetSpec | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const kind = o.kind;
  if (kind === 'absolute') {
    const amount = typeof o.amount === 'number' ? o.amount : parseFloat(String(o.amount ?? ''));
    if (amount > 0) return { kind: 'absolute', amount };
  }
  if (kind === 'percent_off') {
    const percent = typeof o.percent === 'number' ? o.percent : parseFloat(String(o.percent ?? ''));
    if (!(percent > 0 && percent < 100)) return null;
    let ref =
      typeof o.reference_price === 'number' && o.reference_price > 0
        ? o.reference_price
        : parseFloat(String(o.reference_price ?? ''));
    if (!(ref > 0) && fallbackReference > 0) ref = fallbackReference;
    if (ref > 0) return { kind: 'percent_off', percent, referencePrice: ref };
  }
  return null;
}

export function resolveTargetSpec(
  apiTarget: unknown,
  userText: string,
  fallbackReference: number,
): TargetSpec | null {
  return coerceApiTarget(apiTarget, fallbackReference) ?? parseTargetFromUserText(userText, fallbackReference);
}

export function buildTrackedItemFromSpec(
  spec: TargetSpec,
  meta: {
    id: string;
    name: string;
    description: string;
    image: string;
    url?: string;
  },
) {
  if (spec.kind === 'absolute') {
    return {
      id: meta.id,
      name: meta.name,
      description: meta.description,
      status: 'Tracking Active',
      updatedAt: 'Just now',
      bestPrice: spec.amount * 1.15,
      targetPrice: spec.amount,
      targetMode: 'absolute' as const,
      targetPercent: null as number | null,
      targetReferencePrice: null as number | null,
      image: meta.image,
      url: meta.url ?? '',
    };
  }
  const targetPrice = spec.referencePrice * (1 - spec.percent / 100);
  return {
    id: meta.id,
    name: meta.name,
    description: meta.description,
    status: 'Tracking Active',
    updatedAt: 'Just now',
    bestPrice: spec.referencePrice,
    targetPrice,
    targetMode: 'percent_off' as const,
    targetPercent: spec.percent,
    targetReferencePrice: spec.referencePrice,
    image: meta.image,
    url: meta.url ?? '',
  };
}

export function effectiveTargetDisplay(item: {
  targetMode?: string | null;
  targetPercent?: number | null;
  targetReferencePrice?: number | null;
  targetPrice: number;
}): number {
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

export function formatTargetLabel(item: {
  targetMode?: string | null;
  targetPercent?: number | null;
  targetReferencePrice?: number | null;
  targetPrice: number;
}): string {
  const t = effectiveTargetDisplay(item);
  if (
    item.targetMode === 'percent_off' &&
    item.targetPercent != null &&
    item.targetReferencePrice != null
  ) {
    return `${item.targetPercent}% below $${item.targetReferencePrice.toFixed(2)} → $${t.toFixed(2)}`;
  }
  return `$${t.toFixed(2)}`;
}
