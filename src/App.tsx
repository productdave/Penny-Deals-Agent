import { useState } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { LandingScreen } from './components/LandingScreen';
import { ChatScreen } from './components/ChatScreen';
import { ReportScreen } from './components/ReportScreen';
import { TrackedScreen } from './components/TrackedScreen';
import { TrackedItem, Message, ChatFlowState } from './types';

const INITIAL_TRACKED_ITEMS: TrackedItem[] = [
  {
    id: '1',
    name: 'Veloce Runner Pro',
    description: 'Carbon-fiber infused elite training shoes in Midnight Crimson.',
    status: 'Price Drop!',
    updatedAt: 'Updated 2h ago',
    bestPrice: 129.00,
    targetPrice: 180.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzyuLy094biJjOR_jf7VYjoXeCwiAS5FVhvyCIcc40fpG6AfbPzLZTUhy3JgjxgbD6n6S-E7N4THeJ5aAh8wv5nDKFvvW1gC5o8vpJTH1Rmz9yINVvBYFA43ZhGh5jCHUNnnFqZIqdsCsiJ4tLU_3RFAtzSfphob5ft9laJLa8z3_GJr2ARxtHqYk0vJRsYSyAqKeBy4t4u_tmL_FNj39ME8g3KmBVnsGly0bqUIYFkq8s9jiU7GrEWx4Bd4zyd5Yf2nn03NB0Ksoa'
  },
  {
    id: '2',
    name: 'Architect Chrono',
    description: 'Brushed stainless steel case with matte white dial and leather strap.',
    status: 'Stable',
    updatedAt: 'Updated 1d ago',
    bestPrice: 450.00,
    targetPrice: 399.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBV-36NJyrC26mY1OrFG9T1KcplypymX4mgjMCuXMvYM5nVF1AdHExerLo66zrchEP43Bv-WxtIUpWhJ89-jnJ8JKYXNZP4gINHZlRViKzKrg6M4VUCSeeYI9fAtXFHRzrhQ7a9BurQJYfKKtkeOyvaHPOEXxrrN8OCfZPOQfwXC1IDi4URv_qnlbjLb7z-WdZmVKE6hBoZJeUpZqDrhmPl-H_Va1BmOxsEx5TTCajsvDGd85jPpn_DfuIDvmTLA1lWmR745UOveTvB'
  },
  {
    id: '3',
    name: 'Sonos Studio Over-Ear',
    description: 'High-fidelity wireless audio with active noise cancellation.',
    status: 'Waiting for Deal',
    updatedAt: 'Updated 5m ago',
    bestPrice: 349.99,
    targetPrice: 299.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9HsIyZZ1q1V3K_dXhyupm02URfrWg4VrkSC7em7mV3FlEGjGUFBojMoBx3g_JXGd7j8JKxgopDnpPvuJj6FWI5ifH81K24eMiCBHc0qSp_NhOv0MkeacP-kDQbzvXrz0sGOP_-2M9snMp4jfpHOoW6FHDwQI7f6PkvNZR3BJV7lbejiZbWKd3Gqle3GUj2n68FV6DvrJWZ0I2eq3dqVfzsd7WsSdOxhN7G_6x1zGemtqrttyOCpvAyYq4DEYgEzTs88coMcdXvu_g'
  }
];

const INITIAL_MESSAGES: Message[] = [
  { id: '1', sender: 'PENNY', text: "Welcome back! Send me a product name, a URL, or a photo, and I'll get to work.", isChipActive: true },
  { id: '2', sender: 'YOU', text: "I'm looking for a vintage 1960s mechanical watch. Something minimalist but bold." },
  { id: '3', sender: 'PENNY', text: "Excellent choice. I've curated a few pieces that match that mid-century aesthetic. High-contrast dials and sharp lugs seem to be your preference.", hasCards: true }
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [trackedItems, setTrackedItems] = useState<TrackedItem[]>(INITIAL_TRACKED_ITEMS);
  
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [chatFlowState, setChatFlowState] = useState<ChatFlowState>('IDLE');
  const [pendingTargetPrice, setPendingTargetPrice] = useState(0);

  const handleTrackItem = (item: TrackedItem) => {
    setTrackedItems(prev => [item, ...prev]);
  };

  return (
    <div className="bg-background text-on-surface font-body min-h-screen selection:bg-primary selection:text-on-primary flex flex-col">
      <Header currentScreen={currentScreen} onNavigate={setCurrentScreen} />
      
      <main className="flex-1 overflow-y-auto pt-16 pb-24">
        {currentScreen === 'landing' && <LandingScreen onGetStarted={() => setCurrentScreen('chat')} />}
        {currentScreen === 'chat' && (
          <ChatScreen 
            messages={messages}
            setMessages={setMessages}
            flowState={chatFlowState}
            setFlowState={setChatFlowState}
            pendingTargetPrice={pendingTargetPrice}
            setPendingTargetPrice={setPendingTargetPrice}
            onTrackItem={handleTrackItem} 
          />
        )}
        {currentScreen === 'report' && <ReportScreen />}
        {currentScreen === 'tracked' && <TrackedScreen items={trackedItems} onSelectItem={() => setCurrentScreen('report')} />}
      </main>

      {currentScreen !== 'landing' && (
        <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />
      )}
    </div>
  );
}
