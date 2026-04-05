import { useState, useEffect } from 'react';
import { BadgeCheck, ShoppingCart, Activity, ArrowRightLeft, Sparkles, ArrowLeft, Eye, Clock, X, Loader2, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TrackedItem } from '../types';
import { effectiveTargetDisplay, formatTargetLabel, buildTrackedItemFromParentAlternative } from '../targetSpec';
import { fetchPriceHistory, fetchAlternatives, createItem, type PriceHistoryRow, type AlternativePick } from '../api';

interface ReportScreenProps {
  item: TrackedItem | null;
  onBack: () => void;
  onOpenChatWithMessage: (text: string) => void;
  onTrackedItemsChange?: () => void;
}

function isPurchaseUrl(url: string | undefined): url is string {
  if (!url?.trim()) return false;
  try {
    const u = new URL(url.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseRecordedAt(row: PriceHistoryRow): number {
  const v = row.recordedAt as unknown;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return new Date(v).getTime();
  if (v && typeof v === 'object' && 'getTime' in (v as Date)) return (v as Date).getTime();
  return Date.now();
}

function PriceHistoryChart({ rows }: { rows: PriceHistoryRow[] }) {
  if (rows.length === 0) return null;
  const w = 320;
  const h = 140;
  const pad = 28;
  const times = rows.map(parseRecordedAt);
  const prices = rows.map(r => r.price);
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const pMin = Math.min(...prices);
  const pMax = Math.max(...prices);
  const pPad = pMax === pMin ? Math.max(pMin * 0.05, 1) : (pMax - pMin) * 0.08;
  const y0 = pMin - pPad;
  const y1 = pMax + pPad;
  const xScale = (t: number) => {
    if (tMax === tMin) return pad + (w - 2 * pad) / 2;
    return pad + ((t - tMin) / (tMax - tMin)) * (w - 2 * pad);
  };
  const yScale = (p: number) => h - pad - ((p - y0) / (y1 - y0)) * (h - 2 * pad);
  const pts = rows.map((r, i) => `${xScale(times[i])},${yScale(r.price)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-md mx-auto text-primary" aria-hidden>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={pts}
      />
      {rows.map((r, i) => (
        <circle key={i} cx={xScale(times[i])} cy={yScale(r.price)} r="3" fill="currentColor" />
      ))}
    </svg>
  );
}

function ItemImage({ src, alt }: { src: string; alt: string }) {
  return src ? (
    <img
      src={src}
      alt={alt}
      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-surface-container-highest">
      <span className="font-headline text-6xl font-black text-primary/30 select-none">
        {alt?.charAt(0).toUpperCase() ?? '?'}
      </span>
    </div>
  );
}

const verdictStyles: Record<string, { color: string; icon: React.ReactNode }> = {
  BUY:   { color: 'text-green-400', icon: <ShoppingCart className="w-6 h-6" /> },
  WAIT:  { color: 'text-yellow-400', icon: <Clock className="w-6 h-6" /> },
  TRACK: { color: 'text-primary',   icon: <Eye className="w-6 h-6" /> },
};

export function ReportScreen({ item, onBack, onOpenChatWithMessage, onTrackedItemsChange }: ReportScreenProps) {
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [priceRows, setPriceRows] = useState<PriceHistoryRow[]>([]);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  const [altModalOpen, setAltModalOpen] = useState(false);
  const [altLoading, setAltLoading] = useState(false);
  const [altError, setAltError] = useState<string | null>(null);
  const [altMarkdown, setAltMarkdown] = useState('');
  const [altPicks, setAltPicks] = useState<AlternativePick[]>([]);
  const [quickTrackKey, setQuickTrackKey] = useState<string | null>(null);

  useEffect(() => {
    if (!priceModalOpen || !item) return;
    let cancelled = false;
    setPriceLoading(true);
    setPriceError(null);
    fetchPriceHistory(item.id)
      .then((rows) => { if (!cancelled) setPriceRows(rows); })
      .catch((e: Error) => { if (!cancelled) setPriceError(e.message ?? 'Failed to load'); })
      .finally(() => { if (!cancelled) setPriceLoading(false); });
    return () => { cancelled = true; };
  }, [priceModalOpen, item?.id]);

  useEffect(() => {
    if (!altModalOpen || !item) return;
    let cancelled = false;
    setAltLoading(true);
    setAltError(null);
    setAltMarkdown('');
    setAltPicks([]);
    fetchAlternatives(item.id)
      .then((data) => {
        if (!cancelled) {
          setAltMarkdown(data.messageMarkdown);
          setAltPicks(data.alternatives);
        }
      })
      .catch((e: Error) => { if (!cancelled) setAltError(e.message ?? 'Failed to load'); })
      .finally(() => { if (!cancelled) setAltLoading(false); });
    return () => { cancelled = true; };
  }, [altModalOpen, item?.id]);

  if (!item) {
    return (
      <div className="pt-8 pb-16 px-6 max-w-4xl mx-auto text-center">
        <p className="text-on-surface-variant text-sm">No item selected.</p>
        <button type="button" onClick={onBack} className="mt-4 text-primary text-xs font-bold uppercase tracking-widest">← Back</button>
      </div>
    );
  }

  const purchaseHref = isPurchaseUrl(item.url) ? item.url.trim() : null;

  const handleQuickTrack = async (pick: AlternativePick) => {
    if (!pick.url || pick.estimated_price == null) return;
    const key = pick.title;
    setQuickTrackKey(key);
    try {
      const payload = buildTrackedItemFromParentAlternative(item, {
        title: pick.title,
        url: pick.url!,
        estimatedPrice: pick.estimated_price!,
        notes: pick.notes,
      });
      await createItem(payload);
      onTrackedItemsChange?.();
      setAltModalOpen(false);
    } catch {
      setAltError('Could not add to portfolio. Try continuing in chat.');
    } finally {
      setQuickTrackKey(null);
    }
  };

  const handoffMessage = (pick: AlternativePick) => {
    const parts = [
      `I'm comparing alternatives for "${item.name}".`,
      `Help me track "${pick.title}"${pick.url ? ` — ${pick.url}` : ''}.`,
      pick.estimated_price != null ? `Estimated around $${pick.estimated_price.toFixed(2)}.` : '',
    ];
    return parts.filter(Boolean).join(' ');
  };

  const targetThreshold = effectiveTargetDisplay(item);
  const savingsAmt = item.bestPrice - targetThreshold;
  const savingsPct = targetThreshold > 0 ? Math.round((savingsAmt / targetThreshold) * 100) : 0;
  const atOrBelowTarget = item.bestPrice <= targetThreshold;
  const targetLabel = formatTargetLabel(item);

  // Derive a simple verdict from the item state
  const verdict = item.status.includes('Drop') ? 'BUY'
    : item.status.includes('Stable') ? 'WAIT'
    : 'TRACK';
  const vs = verdictStyles[verdict] ?? verdictStyles.TRACK;

  return (
    <div className="pt-8 pb-16 px-6 max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-on-surface-variant hover:text-primary text-xs font-bold uppercase tracking-widest mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Portfolio
      </button>

      {/* Header */}
      <section className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-4 border-primary pl-6">
          <div>
            <span className="text-primary font-bold tracking-[0.2em] text-xs uppercase mb-2 block">Intelligence Report</span>
            <h2 className="text-4xl md:text-5xl font-black font-headline leading-tight">{item.name}</h2>
            <p className="text-on-surface-variant mt-2 font-body text-lg italic">{item.description}</p>
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Recommendation Card */}
        <div className="md:col-span-8 bg-surface-container-high p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4">
            <BadgeCheck className="text-primary/20 w-32 h-32 scale-150 rotate-12" strokeWidth={1} />
          </div>
          <div>
            <h3 className="text-primary font-bold tracking-widest text-xs uppercase mb-8">Status Report</h3>
            <div className="flex items-center gap-4 mb-4">
              <span className={`text-7xl font-black tracking-tighter font-headline ${vs.color}`}>{verdict}</span>
              <div className="h-1 w-24 bg-primary mb-3" />
            </div>
            <div className="flex items-center gap-2 mb-8">
              <span className="text-on-surface-variant uppercase text-xs tracking-widest font-bold">Status:</span>
              <span className="bg-primary-container text-primary px-3 py-1 text-xs font-black uppercase tracking-widest">{item.status}</span>
            </div>
          </div>
          <div className="space-y-4 relative z-10">
            <p className="text-on-surface text-xl leading-relaxed font-body">
              {atOrBelowTarget
                ? `Best price of $${item.bestPrice.toFixed(2)} is at or below your target (${targetLabel}). This is an optimal acquisition window.`
                : `Best price of $${item.bestPrice.toFixed(2)} is $${Math.abs(savingsAmt).toFixed(2)} above your target (${targetLabel}). Monitoring for a better entry point.`}
            </p>
            <div className="pt-4 border-t border-outline-variant/30 flex gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Last Updated</span>
                <span className="text-sm font-bold">{item.updatedAt}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">vs Target</span>
                <span className={`text-sm font-bold ${atOrBelowTarget ? 'text-green-400' : 'text-yellow-400'}`}>
                  {atOrBelowTarget ? `−${Math.abs(savingsPct)}%` : `+${Math.abs(savingsPct)}%`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="md:col-span-4 bg-surface-container-low p-8 border-t-2 border-primary">
          <h3 className="text-on-surface-variant font-bold tracking-widest text-xs uppercase mb-6">Pricing Summary</h3>
          <div className="space-y-6">
            <div>
              <span className="text-[10px] text-primary uppercase tracking-widest block mb-1">Best Price Found</span>
              <span className="text-3xl font-black font-headline tracking-tight">${item.bestPrice.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">Your Target</span>
              <span className={`text-2xl font-medium tracking-tight ${atOrBelowTarget ? 'text-green-400' : 'opacity-50 line-through'}`}>
                ${targetThreshold.toFixed(2)}
              </span>
              {item.targetMode === 'percent_off' &&
                item.targetPercent != null &&
                item.targetReferencePrice != null && (
                <span className="block text-xs text-on-surface-variant mt-1 opacity-80">
                  {item.targetPercent}% below ${item.targetReferencePrice.toFixed(2)} reference
                </span>
              )}
            </div>
            {!atOrBelowTarget && (
              <div className="pt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant">Gap to target</span>
                  <span className="font-bold text-yellow-400">${Math.abs(savingsAmt).toFixed(2)}</span>
                </div>
                <div className="w-full bg-surface-container-highest h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all"
                    style={{ width: `${Math.min(100, (targetThreshold / item.bestPrice) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant italic">Tracking until target is reached.</p>
              </div>
            )}
            {atOrBelowTarget && (
              <div className="pt-4">
                <span className="text-[10px] text-green-400 uppercase tracking-widest font-bold">✓ Target reached</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <div className="bg-surface-container-highest p-8">
            <h3 className="text-on-surface font-bold tracking-widest text-xs uppercase mb-6">Strategic Actions</h3>
            <div className="space-y-4">
              {purchaseHref ? (
                <a
                  href={purchaseHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-br from-primary to-[#a38300] text-on-primary-fixed py-4 px-6 font-black uppercase text-sm tracking-widest hover:opacity-90 transition-opacity flex items-center justify-between"
                >
                  <span>Execute Purchase</span>
                  <ShoppingCart className="w-5 h-5 shrink-0" />
                </a>
              ) : (
                <div className="space-y-2">
                  <div
                    className="w-full bg-surface-container-low text-on-surface-variant py-4 px-6 font-black uppercase text-sm tracking-widest flex items-center justify-between border border-outline-variant/30 opacity-70 cursor-not-allowed"
                    aria-disabled
                  >
                    <span>Execute Purchase</span>
                    <ShoppingCart className="w-5 h-5 shrink-0" />
                  </div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">No product link on file</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => setPriceModalOpen(true)}
                className="w-full border border-outline text-on-surface py-4 px-6 font-bold uppercase text-sm tracking-widest hover:bg-surface-variant transition-colors flex items-center justify-between"
              >
                <span>Track Price Fluctuations</span>
                <Activity className="w-5 h-5 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => setAltModalOpen(true)}
                className="w-full border border-outline text-on-surface py-4 px-6 font-bold uppercase text-sm tracking-widest hover:bg-surface-variant transition-colors flex items-center justify-between"
              >
                <span>Compare Alternatives</span>
                <ArrowRightLeft className="w-5 h-5 shrink-0" />
              </button>
            </div>
          </div>

          {/* Product Image */}
          <div className="relative h-64 bg-surface-container-low overflow-hidden">
            <ItemImage src={item.image} alt={item.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
              <span className="text-[10px] text-primary font-bold uppercase tracking-[0.3em]">Penny Intelligence</span>
            </div>
          </div>
        </div>

        {/* Item Details */}
        <div className="md:col-span-7 bg-surface p-8 border border-outline-variant/10">
          <h3 className="text-primary font-bold tracking-widest text-xs uppercase mb-6">Item Details</h3>
          <div className="space-y-4">
            {[
              { label: 'Product Name', value: item.name },
              { label: 'Description', value: item.description },
              { label: 'Best Price', value: `$${item.bestPrice.toFixed(2)}` },
              { label: 'Target', value: targetLabel },
              { label: 'Status', value: item.status },
              { label: 'Last Updated', value: item.updatedAt },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-4 border-b border-outline-variant/10 pb-4">
                <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase w-32 shrink-0 pt-0.5">{label}</span>
                <span className="text-sm text-on-surface leading-relaxed">{value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="mt-12 flex justify-center">
        <div className="bg-secondary-container text-on-secondary-container px-6 py-2 flex items-center gap-3">
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em]">AI-Synthesis verified by Penny Core v4.2</span>
        </div>
      </div>

      {/* Price history modal */}
      {priceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70" role="dialog" aria-modal="true" aria-labelledby="price-history-title">
          <div className="bg-surface-container-highest border border-outline-variant/30 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-outline-variant/20">
              <h2 id="price-history-title" className="text-on-surface font-bold tracking-widest text-xs uppercase">Price history</h2>
              <button type="button" onClick={() => setPriceModalOpen(false)} className="p-2 text-on-surface-variant hover:text-primary" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {priceLoading && (
                <div className="flex items-center gap-3 text-on-surface-variant text-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  Loading history…
                </div>
              )}
              {priceError && <p className="text-sm text-red-400">{priceError}</p>}
              {!priceLoading && !priceError && priceRows.length === 0 && (
                <p className="text-sm text-on-surface-variant">No price snapshots yet for this item.</p>
              )}
              {!priceLoading && priceRows.length > 0 && (
                <>
                  <PriceHistoryChart rows={priceRows} />
                  <table className="w-full text-xs text-left border-collapse">
                    <caption className="sr-only">Price history data</caption>
                    <thead>
                      <tr className="text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/20">
                        <th className="py-2 pr-2 font-bold">Date</th>
                        <th className="py-2 pr-2 font-bold">Price</th>
                        <th className="py-2 font-bold">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceRows.map((row) => (
                        <tr key={row.id} className="border-b border-outline-variant/10 text-on-surface">
                          <td className="py-2 pr-2 whitespace-nowrap">{new Date(parseRecordedAt(row)).toLocaleString()}</td>
                          <td className="py-2 pr-2 font-mono">${row.price.toFixed(2)}</td>
                          <td className="py-2 text-on-surface-variant">{row.source ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Alternatives modal */}
      {altModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70" role="dialog" aria-modal="true" aria-labelledby="alt-title">
          <div className="bg-surface-container-highest border border-outline-variant/30 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-outline-variant/20">
              <h2 id="alt-title" className="text-on-surface font-bold tracking-widest text-xs uppercase">Compare alternatives</h2>
              <button type="button" onClick={() => setAltModalOpen(false)} className="p-2 text-on-surface-variant hover:text-primary" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {altLoading && (
                <div className="flex items-center gap-3 text-on-surface-variant text-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  Penny is searching…
                </div>
              )}
              {altError && <p className="text-sm text-red-400">{altError}</p>}
              {!altLoading && altMarkdown && (
                <div className="prose prose-invert prose-sm max-w-none
                  prose-headings:font-headline prose-headings:text-primary prose-headings:text-sm prose-headings:tracking-wider prose-headings:uppercase
                  prose-p:text-on-surface prose-p:leading-relaxed prose-strong:text-primary">
                  <ReactMarkdown>{altMarkdown}</ReactMarkdown>
                </div>
              )}
              {!altLoading && altPicks.length > 0 && (
                <ul className="space-y-4 list-none p-0 m-0">
                  {altPicks.map((pick, idx) => {
                    const canQuick = Boolean(pick.url && pick.estimated_price != null);
                    return (
                      <li key={`${pick.title}-${idx}`} className="border border-outline-variant/20 p-4 space-y-3">
                        <div className="font-bold text-on-surface text-sm">{pick.title}</div>
                        {pick.estimated_price != null && (
                          <div className="text-xs text-on-surface-variant">~${pick.estimated_price.toFixed(2)}</div>
                        )}
                        {pick.notes && <p className="text-xs text-on-surface-variant leading-relaxed">{pick.notes}</p>}
                        <div className="flex flex-wrap gap-2">
                          {canQuick && (
                            <button
                              type="button"
                              disabled={quickTrackKey === pick.title}
                              onClick={() => handleQuickTrack(pick)}
                              className="text-[10px] font-bold tracking-widest uppercase px-3 py-2 bg-primary text-on-primary hover:opacity-90 disabled:opacity-50"
                            >
                              {quickTrackKey === pick.title ? 'Adding…' : 'Track'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setAltModalOpen(false);
                              onOpenChatWithMessage(handoffMessage(pick));
                            }}
                            className="text-[10px] font-bold tracking-widest uppercase px-3 py-2 border border-outline text-on-surface hover:bg-surface-variant flex items-center gap-2"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Continue in chat
                          </button>
                          {pick.url && (
                            <a
                              href={pick.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold tracking-widest uppercase px-3 py-2 border border-outline text-primary hover:bg-surface-variant inline-flex items-center"
                            >
                              Open link
                            </a>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
