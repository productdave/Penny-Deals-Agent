import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { LandingScreen } from './components/LandingScreen';
import { ChatScreen } from './components/ChatScreen';
import { ReportScreen } from './components/ReportScreen';
import { TrackedScreen } from './components/TrackedScreen';
import { TrackedItem, Message, ChatFlowState } from './types';
import { fetchItems, createItem, fetchMessages, saveMessage, createChatSession } from './api';

const WELCOME_MESSAGES: Message[] = [
  { id: '1', sender: 'PENNY', text: "Welcome back! Send me a product name, a URL, or a photo, and I'll get to work.", isChipActive: true },
];

const SESSION_KEY = 'penny_chat_session_id';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [trackedItems, setTrackedItems] = useState<TrackedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<TrackedItem | null>(null);
  const [messages, setMessages] = useState<Message[]>(WELCOME_MESSAGES);
  const [chatFlowState, setChatFlowState] = useState<ChatFlowState>('IDLE');
  const [pendingTargetPrice, setPendingTargetPrice] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Load tracked items from API on mount
  useEffect(() => {
    fetchItems()
      .then(setTrackedItems)
      .catch(() => setTrackedItems([]));
  }, []);

  // Load or create a chat session, then load its messages
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      setSessionId(stored);
      fetchMessages(stored)
        .then(msgs => { if (msgs.length > 0) setMessages(msgs); })
        .catch(() => {});
    } else {
      createChatSession().then(({ id }) => {
        sessionStorage.setItem(SESSION_KEY, id);
        setSessionId(id);
      }).catch(() => {});
    }
  }, []);

  const handleTrackItem = async (item: TrackedItem) => {
    try {
      const saved = await createItem(item);
      setTrackedItems(prev => [saved, ...prev]);
    } catch {
      // Fallback: keep in local state even if save fails
      setTrackedItems(prev => [item, ...prev]);
    }
  };

  const handleSetMessages: typeof setMessages = (updater) => {
    setMessages(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // Persist the newest message if we have a session
      if (sessionId && next.length > prev.length) {
        const newest = next[next.length - 1];
        saveMessage(sessionId, newest).catch(() => {});
      }
      return next;
    });
  };

  return (
    <div className="bg-background text-on-surface font-body min-h-screen selection:bg-primary selection:text-on-primary flex flex-col">
      <Header currentScreen={currentScreen} onNavigate={setCurrentScreen} />

      <main className="flex-1 overflow-y-auto pt-16 pb-24">
        {currentScreen === 'landing' && <LandingScreen onGetStarted={() => setCurrentScreen('chat')} />}
        {currentScreen === 'chat' && (
          <ChatScreen
            messages={messages}
            setMessages={handleSetMessages}
            flowState={chatFlowState}
            setFlowState={setChatFlowState}
            pendingTargetPrice={pendingTargetPrice}
            setPendingTargetPrice={setPendingTargetPrice}
            onTrackItem={handleTrackItem}
            sessionId={sessionId}
          />
        )}
        {currentScreen === 'report' && <ReportScreen item={selectedItem} onBack={() => setCurrentScreen('tracked')} />}
        {currentScreen === 'tracked' && <TrackedScreen items={trackedItems} onSelectItem={(item) => { setSelectedItem(item); setCurrentScreen('report'); }} />}
      </main>

      {currentScreen !== 'landing' && (
        <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />
      )}
    </div>
  );
}
