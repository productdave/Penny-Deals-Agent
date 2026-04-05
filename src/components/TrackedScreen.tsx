import { BellRing, Bell, Trash2, ExternalLink, SlidersHorizontal, TrendingUp, Plus } from 'lucide-react';
import { useState } from 'react';
import { TrackedItem } from '../types';
import { effectiveTargetDisplay } from '../targetSpec';

function ItemImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(!src);
  const initial = alt?.charAt(0).toUpperCase() ?? '?';

  if (failed) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface-container-highest">
        <span className="font-headline text-6xl font-black text-primary/30 select-none">{initial}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
    />
  );
}

interface TrackedScreenProps {
  items: TrackedItem[];
  onSelectItem: (item: TrackedItem) => void;
}

const getBadgeStyle = (status: string) => {
  if (status.includes('Drop')) return 'bg-primary/10 text-primary border-primary/20';
  if (status.includes('Stable')) return 'bg-surface-variant text-on-surface-variant border-outline-variant/20';
  if (status.includes('Waiting')) return 'bg-secondary-container text-on-secondary-container border-transparent';
  return 'bg-primary text-on-primary border-transparent';
};

export function TrackedScreen({ items, onSelectItem }: TrackedScreenProps) {
  const portfolioValue = items.reduce((sum, item) => sum + effectiveTargetDisplay(item), 0);

  return (
    <div className="pt-8 pb-16 px-6 max-w-5xl mx-auto">
      <section className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="text-primary font-bold tracking-[0.2em] text-xs uppercase">Intelligent Monitoring</span>
            <h1 className="font-headline text-5xl font-black text-on-surface leading-tight">TRACKED<br/>PRODUCTS</h1>
          </div>
          <div className="flex gap-4">
            <button className="bg-surface-container-high px-6 py-3 text-xs font-bold tracking-widest uppercase border border-outline-variant/30 hover:border-primary transition-all">
              Sort: Recent
            </button>
            <button className="gold-gradient text-on-primary px-8 py-3 text-xs font-bold tracking-widest uppercase shadow-xl active:scale-95 transition-transform">
              Add New Item
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6">
        {items.map(item => (
          <article key={item.id} className="bg-surface-container-low group flex flex-col md:flex-row relative overflow-hidden transition-all duration-500 hover:bg-surface-container-high">
            <div className="w-full md:w-64 h-64 md:h-auto bg-surface-container-highest overflow-hidden cursor-pointer shrink-0" onClick={() => onSelectItem(item)}>
              <ItemImage src={item.image} alt={item.name} />
            </div>
            <div className="flex-1 p-8 flex flex-col justify-between overflow-hidden">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 border uppercase ${getBadgeStyle(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="text-on-surface-variant text-[10px] uppercase tracking-widest font-medium whitespace-nowrap">{item.updatedAt}</span>
                  </div>
                  <h2 className="font-headline text-2xl font-bold text-on-surface cursor-pointer hover:text-primary transition-colors truncate" onClick={() => onSelectItem(item)}>{item.name}</h2>
                  <p className="text-on-surface-variant text-sm mt-1 max-w-md truncate">{item.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="w-10 h-10 flex items-center justify-center bg-surface-container-highest text-on-surface hover:text-primary transition-colors">
                    {item.status.includes('Drop') ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  </button>
                  <button className="w-10 h-10 flex items-center justify-center bg-surface-container-highest text-on-surface hover:text-error transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="mt-8 flex items-baseline gap-6 border-t border-outline-variant/10 pt-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">Best Price</span>
                  <span className="text-3xl font-black text-primary tracking-tight">${item.bestPrice.toFixed(2)}</span>
                </div>
                <div className="flex flex-col opacity-50">
                  <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">Target</span>
                  <span className="text-xl font-medium line-through tracking-tight">${effectiveTargetDisplay(item).toFixed(2)}</span>
                  {item.targetMode === 'percent_off' && item.targetPercent != null && item.targetReferencePrice != null && (
                    <span className="text-[10px] text-on-surface-variant mt-0.5">
                      {item.targetPercent}% below ${item.targetReferencePrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-4">
                  <button className="text-xs font-bold tracking-widest uppercase text-on-surface hover:text-primary transition-colors flex items-center gap-2">
                    {item.status.includes('Drop') ? 'Store Link' : item.status.includes('Stable') ? 'Settings' : 'Price History'}
                    {item.status.includes('Drop') ? <ExternalLink className="w-4 h-4" /> : item.status.includes('Stable') ? <SlidersHorizontal className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-high p-6 border-l-4 border-primary">
          <h4 className="text-[10px] font-bold tracking-widest text-primary uppercase mb-2">Portfolio Value</h4>
          <p className="text-2xl font-black font-headline">${portfolioValue.toFixed(2)}</p>
          <p className="text-xs text-on-surface-variant mt-1">Sum of tracked target prices</p>
        </div>
        <div className="bg-surface-container-high p-6">
          <h4 className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mb-2">Total Savings</h4>
          <p className="text-2xl font-black font-headline text-primary">+$152.00</p>
          <p className="text-xs text-on-surface-variant mt-1">Based on current price drops</p>
        </div>
        <div className="bg-surface-container-high p-6">
          <h4 className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mb-2">Alert Frequency</h4>
          <p className="text-2xl font-black font-headline">Real-Time</p>
          <p className="text-xs text-on-surface-variant mt-1">Instant push notifications active</p>
        </div>
      </aside>

      <button className="fixed right-6 bottom-24 w-14 h-14 gold-gradient text-on-primary flex items-center justify-center shadow-2xl active:scale-95 transition-transform z-40">
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
}
