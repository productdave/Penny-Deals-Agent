import { Microscope, BarChart3, ShieldCheck } from 'lucide-react';

interface LandingScreenProps {
  onGetStarted: () => void;
}

export function LandingScreen({ onGetStarted }: LandingScreenProps) {
  return (
    <div className="relative min-h-screen pt-16 flex flex-col md:flex-row overflow-hidden bg-surface">
      <section className="relative w-full md:w-1/2 min-h-[442px] md:min-h-[calc(100vh-64px)] flex items-center justify-center p-8 md:p-16 z-10">
        <div className="max-w-xl">
          <div className="inline-block px-3 py-1 mb-8 bg-secondary-container text-on-secondary-container text-[10px] font-bold tracking-[0.2em] uppercase">
            System Active
          </div>
          
          <h1 className="font-headline text-5xl md:text-7xl font-black text-on-surface mb-6 leading-[1.1] tracking-tight">
            Penny: Your Personal <span className="text-primary italic">Shopping Intelligence</span>
          </h1>
          
          <p className="text-on-surface-variant text-lg md:text-xl font-light leading-relaxed mb-10 max-w-lg">
            A sophisticated concierge designed for the modern acquisition. Research products, compare global pricing, and receive precise directives: <span className="text-on-surface font-bold">Buy, Wait, or Track.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <button 
              onClick={onGetStarted}
              className="gold-gradient px-10 py-4 text-on-primary font-bold text-sm tracking-[0.15em] uppercase hover:opacity-90 active:scale-95 transition-all shadow-xl"
            >
              Get Started
            </button>
            <button className="text-primary-fixed-dim font-bold text-xs tracking-[0.15em] uppercase border-b border-transparent hover:border-primary transition-all py-2">
              Learn More
            </button>
          </div>
          
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="space-y-2">
              <Microscope className="text-primary w-8 h-8" strokeWidth={1.5} />
              <h3 className="text-[10px] font-black tracking-widest uppercase text-on-surface">Deep Research</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">Neural analysis of market trends and specifications.</p>
            </div>
            <div className="space-y-2">
              <BarChart3 className="text-primary w-8 h-8" strokeWidth={1.5} />
              <h3 className="text-[10px] font-black tracking-widest uppercase text-on-surface">Price Synthesis</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">Global arbitrage detection across all luxury channels.</p>
            </div>
            <div className="space-y-2">
              <ShieldCheck className="text-primary w-8 h-8" strokeWidth={1.5} />
              <h3 className="text-[10px] font-black tracking-widest uppercase text-on-surface">Action Intel</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">Data-driven signals for optimal purchasing windows.</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="relative w-full md:w-1/2 min-h-[530px] md:min-h-[calc(100vh-64px)] bg-surface-container-lowest overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCYtTcucmbS-cYHyZnVghJR-hVs6sN81V8sqbubcSj1OitHgPwZpNAByUojCYeQAAZax6Vp_qzxJwbMFqQfmNylMsNqH3ir4ZJ-W02rCfIrDNbY5Cc2tXC_w5IN8zRaqI7yZgqyc7Km2UTwz7lc84dhWCiU-KMni2HmM5nyjFlRdMBcFZy0LCmZGygphh4cW4GAwZ_FEaRr_COF4edV6wuiRVg5SEqVokSsC2sfLwsPF0_K-PMFByEH9Q7VCpYbqCW5oxzZGokaHXy" 
            alt="Minimalist luxury watches" 
            className="w-full h-full object-cover grayscale opacity-40 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
        </div>
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center pointer-events-none">
          <div className="relative w-[80%] h-[80%] border-[0.5px] border-outline-variant opacity-20"></div>
          <div className="absolute w-[60%] h-[60%] border-[0.5px] border-primary opacity-10"></div>
        </div>
        
        <div className="absolute bottom-12 right-12 text-right hidden md:block">
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-primary mb-2">Reference Mode: Alpha</p>
          <div className="h-[1px] w-32 bg-primary ml-auto"></div>
          <p className="text-[10px] text-on-surface-variant mt-2 font-mono">ENCRYPTED CONNECTION ESTABLISHED</p>
        </div>
      </section>

      <footer className="fixed bottom-0 left-0 w-full z-50 flex justify-between items-center px-8 h-12 bg-transparent pointer-events-none">
        <div className="text-[10px] font-medium tracking-[0.2em] text-on-surface-variant uppercase">
          © 1965 PENNY INTELLIGENCE
        </div>
        <div className="flex gap-6 pointer-events-auto">
          <button className="text-[10px] font-medium tracking-[0.2em] text-on-surface-variant uppercase hover:text-primary transition-colors">Privacy</button>
          <button className="text-[10px] font-medium tracking-[0.2em] text-on-surface-variant uppercase hover:text-primary transition-colors">Terms</button>
        </div>
      </footer>
      
      <div className="fixed top-0 left-0 w-full h-screen pointer-events-none opacity-[0.03] z-[100] bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]"></div>
    </div>
  );
}
