import { BadgeCheck, PieChart, ShoppingCart, Activity, ArrowRightLeft, Sparkles } from 'lucide-react';

export function ReportScreen() {
  return (
    <div className="pt-8 pb-16 px-6 max-w-4xl mx-auto">
      {/* Header Section */}
      <section className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-4 border-primary pl-6">
          <div>
            <span className="text-primary font-bold tracking-[0.2em] text-xs uppercase mb-2 block">Intelligence Report</span>
            <h2 className="text-4xl md:text-5xl font-black font-headline leading-tight">Sony WH-1000XM5 Headphones</h2>
            <p className="text-on-surface-variant mt-2 font-body text-lg italic">Premium Noise Canceling Wireless Over-Ear Headphones</p>
          </div>
        </div>
      </section>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Centerpiece: Recommendation Card */}
        <div className="md:col-span-8 bg-surface-container-high p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4">
            <BadgeCheck className="text-primary/20 w-32 h-32 scale-150 rotate-12" strokeWidth={1} />
          </div>
          <div>
            <h3 className="text-primary font-bold tracking-widest text-xs uppercase mb-8">Executive Recommendation</h3>
            <div className="flex items-baseline gap-4 mb-4">
              <span className="text-7xl font-black text-primary tracking-tighter font-headline">BUY</span>
              <div className="h-1 w-24 bg-primary mb-3"></div>
            </div>
            <div className="flex items-center gap-2 mb-8">
              <span className="text-on-surface-variant uppercase text-xs tracking-widest font-bold">Confidence Rating:</span>
              <span className="bg-primary-container text-primary px-3 py-1 text-xs font-black uppercase tracking-widest">High</span>
            </div>
          </div>
          <div className="space-y-4 relative z-10">
            <p className="text-on-surface text-xl leading-relaxed font-body">
              Current market conditions and historical price patterns indicate an optimal entry point. Pricing has stabilized at a 15% discount from MSRP.
            </p>
            <div className="pt-4 border-t border-outline-variant/30 flex gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Market Status</span>
                <span className="text-sm font-bold">Post-Launch Plateau</span>
              </div>
              <div className="flex flex-col">
                <span class="text-[10px] text-on-surface-variant uppercase tracking-widest">Supply Chain</span>
                <span className="text-sm font-bold">Stable Inventory</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Summary Card */}
        <div className="md:col-span-4 bg-surface-container-low p-8 border-t-2 border-primary">
          <h3 className="text-on-surface-variant font-bold tracking-widest text-xs uppercase mb-6">Pricing Summary</h3>
          <div className="space-y-6">
            <div>
              <span className="text-[10px] text-primary uppercase tracking-widest block mb-1">Current Best</span>
              <span className="text-3xl font-black font-headline tracking-tight">$348.00</span>
            </div>
            <div>
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block mb-1">MSRP</span>
              <span className="text-lg font-medium opacity-50 line-through">$399.99</span>
            </div>
            <div className="pt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">Yearly Low</span>
                <span className="font-bold">$298.00</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1.5 overflow-hidden">
                <div className="bg-primary h-full w-[85%]"></div>
              </div>
              <p className="text-[10px] text-on-surface-variant italic">Top 12% of recorded deals in the last 6 months.</p>
            </div>
          </div>
        </div>

        {/* Key Findings & Reasoning */}
        <div className="md:col-span-7 bg-surface p-8 border border-outline-variant/10">
          <div className="prose prose-invert max-w-none">
            <h3 className="text-primary font-bold tracking-widest text-xs uppercase mb-8 flex items-center gap-2">
              <PieChart className="w-4 h-4" /> Analysis Deep-Dive
            </h3>
            
            <div className="mb-10">
              <h4 className="text-xl font-bold font-headline mb-4 text-on-surface uppercase tracking-tight">Key Findings</h4>
              <ul className="space-y-4 list-none p-0">
                <li className="flex gap-4">
                  <span className="text-primary font-black">01</span>
                  <span className="text-on-surface-variant leading-relaxed">Superior noise cancellation performance vs competition (Bose/Apple) validated by 48 independent reviews.</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-primary font-black">02</span>
                  <span className="text-on-surface-variant leading-relaxed">Hardware reliability scores are 14% higher than previous M4 generation models.</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-primary font-black">03</span>
                  <span className="text-on-surface-variant leading-relaxed">Software ecosystem support for LDAC and Multipoint is currently the industry standard.</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-xl font-bold font-headline mb-4 text-on-surface uppercase tracking-tight">Reasoning</h4>
              <p className="text-on-surface-variant leading-relaxed mb-4">
                The WH-1000XM5 occupies a unique position in the market. While the upcoming seasonal sales might see a further 5% dip, the current "Buy" recommendation is triggered by the high likelihood of stock shortages during the holiday peak.
              </p>
              <p className="text-on-surface-variant leading-relaxed">
                Our cross-vendor analysis shows Amazon and Best Buy have synchronized pricing, suggesting a manufacturer-authorized discount period that typically lasts 14 days.
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps & Actions */}
        <div className="md:col-span-5 flex flex-col gap-6">
          
          {/* Action Buttons */}
          <div className="bg-surface-container-highest p-8">
            <h3 className="text-on-surface font-bold tracking-widest text-xs uppercase mb-6">Strategic Actions</h3>
            <div className="space-y-4">
              <button className="w-full bg-gradient-to-br from-primary to-[#a38300] text-on-primary-fixed py-4 px-6 font-black uppercase text-sm tracking-widest hover:opacity-90 transition-opacity flex items-center justify-between">
                <span>Execute Purchase</span>
                <ShoppingCart className="w-5 h-5" />
              </button>
              <button className="w-full border border-outline text-on-surface py-4 px-6 font-bold uppercase text-sm tracking-widest hover:bg-surface-variant transition-colors flex items-center justify-between">
                <span>Track Price Fluctuations</span>
                <Activity className="w-5 h-5" />
              </button>
              <button className="w-full border border-outline text-on-surface py-4 px-6 font-bold uppercase text-sm tracking-widest hover:bg-surface-variant transition-colors flex items-center justify-between">
                <span>Compare Alternatives</span>
                <ArrowRightLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Product Visual */}
          <div className="relative h-full min-h-[240px] bg-surface-container-low overflow-hidden">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBh3KJrgM8zXY3J-ULES9mH8Dk2PHdEuCSmk3kyS-KWzlFB5wTb_TJvX2Zm76mTYit9NxsSgEF_mZvbHaSl5WzFJv_MjLvz08Zy5eu3KU-Gq8nRse4DZZcgrzZb5lj90NZTHQMpxqI6dW6tvonHfu-hwbm6P6xa_phugsbm0FaJa9jbRoJQj2clBHTlC5ApO1zhZGhaBQTdMS-BHH0rW7dYTlXqaLtOWINo22TKjAneVrB3eZCIq8I_kgcjQ3jZa69GErkXZXjl2zQV" 
              alt="Sony WH-1000XM5" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
              <span className="text-[10px] text-primary font-bold uppercase tracking-[0.3em]">Verified Product Match</span>
            </div>
          </div>
        </div>

      </div>

      {/* Intelligence Chip / Footer Note */}
      <div className="mt-12 flex justify-center">
        <div className="bg-secondary-container text-on-secondary-container px-6 py-2 flex items-center gap-3">
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em]">AI-Synthesis verified by Penny Core v4.2</span>
        </div>
      </div>
    </div>
  );
}
