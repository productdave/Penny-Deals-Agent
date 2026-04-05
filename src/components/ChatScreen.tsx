import { useState, useRef, useEffect } from 'react';
import { Link2, Image as ImageIcon, Send, ShoppingCart, Clock, Eye, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TrackedItem, Message, ChatFlowState, PennyResponse } from '../types';

interface ChatScreenProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  flowState: ChatFlowState;
  setFlowState: React.Dispatch<React.SetStateAction<ChatFlowState>>;
  pendingTargetPrice: number;
  setPendingTargetPrice: React.Dispatch<React.SetStateAction<number>>;
  onTrackItem: (item: TrackedItem) => void;
  sessionId: string | null;
}

function isURL(text: string) {
  try { new URL(text); return true; } catch { return false; }
}

function toOpenAIMessages(messages: Message[]) {
  return messages.filter(m => m.text).map(m => ({
    role: m.sender === 'YOU' ? 'user' as const : 'assistant' as const,
    content: m.text,
  }));
}

// ── Verdict badge ─────────────────────────────────────────────────────────────
function VerdictBadge({ conclusion, confidence }: { conclusion: string; confidence?: string | null }) {
  const styles: Record<string, { bg: string; icon: React.ReactNode; label: string }> = {
    BUY:   { bg: 'bg-green-900/40 border-green-500/40 text-green-400', icon: <ShoppingCart className="w-3.5 h-3.5" />, label: 'BUY' },
    WAIT:  { bg: 'bg-yellow-900/40 border-yellow-500/40 text-yellow-400', icon: <Clock className="w-3.5 h-3.5" />, label: 'WAIT' },
    TRACK: { bg: 'bg-primary/20 border-primary/40 text-primary', icon: <Eye className="w-3.5 h-3.5" />, label: 'TRACK' },
  };
  const s = styles[conclusion] ?? styles.TRACK;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 border text-[11px] font-black tracking-[0.2em] ${s.bg}`}>
      {s.icon}
      {s.label}
      {confidence && <span className="opacity-60 font-medium">· {confidence} confidence</span>}
    </div>
  );
}

// ── Penny message bubble ──────────────────────────────────────────────────────
function PennyMessage({ msg, onTrack }: { msg: Message; onTrack: () => void }) {
  const [showReasoning, setShowReasoning] = useState(false);
  const pr = msg.pennyResponse;

  return (
    <div className="flex flex-col items-start max-w-[90%] lg:max-w-[75%]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold tracking-widest text-primary uppercase">PENNY</span>
        <div className="h-[1px] w-4 bg-primary/30" />
      </div>

      <div className="bg-surface-container-high shadow-2xl w-full">
        {/* Verdict bar */}
        {pr?.conclusion && (
          <div className="px-6 pt-5 pb-0">
            <VerdictBadge conclusion={pr.conclusion} confidence={pr.confidence} />
          </div>
        )}

        {/* Main markdown body */}
        <div className="px-6 py-5 prose prose-invert prose-sm max-w-none
          prose-headings:font-headline prose-headings:text-primary prose-headings:text-sm prose-headings:tracking-wider prose-headings:uppercase prose-headings:mb-2
          prose-p:text-on-surface prose-p:leading-relaxed prose-p:text-base
          prose-strong:text-primary prose-strong:font-bold
          prose-li:text-on-surface prose-li:leading-relaxed
          prose-ul:my-2 prose-li:my-0.5">
          <ReactMarkdown>{msg.text}</ReactMarkdown>
        </div>

        {/* Reasoning */}
        {pr?.reasoning && (
          <div className="border-t border-outline-variant/10 px-6 py-3">
            <button
              onClick={() => setShowReasoning(v => !v)}
              className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase flex items-center gap-1 hover:text-primary transition-colors"
            >
              <ChevronRight className={`w-3 h-3 transition-transform ${showReasoning ? 'rotate-90' : ''}`} />
              Reasoning
            </button>
            {showReasoning && (
              <p className="mt-2 text-sm text-on-surface-variant italic leading-relaxed">{pr.reasoning}</p>
            )}
          </div>
        )}

        {/* Next steps */}
        {pr?.next_steps && pr.next_steps.length > 0 && (
          <div className="border-t border-outline-variant/10 px-6 py-4 space-y-2">
            <p className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mb-2">Next Steps</p>
            {pr.next_steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-on-surface">
                <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        )}

        {/* Track CTA — only show after a recommendation */}
        {pr?.conclusion && (
          <div className="border-t border-outline-variant/10 px-6 py-3">
            <button
              onClick={onTrack}
              className="text-[10px] font-bold tracking-widest uppercase text-primary hover:text-on-primary hover:bg-primary px-3 py-1.5 border border-primary/40 transition-all"
            >
              + Add to Tracked Portfolio
            </button>
          </div>
        )}
      </div>

      {msg.isChipActive && (
        <div className="mt-2">
          <div className="bg-secondary-container px-3 py-1 flex items-center gap-2">
            <div className="w-1 h-1 bg-on-secondary-container" />
            <span className="text-[10px] font-bold tracking-tighter text-on-secondary-container uppercase">Intelligence Chip Active</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ChatScreen({
  messages, setMessages,
  flowState, setFlowState,
  pendingTargetPrice, setPendingTargetPrice,
  onTrackItem, sessionId,
}: ChatScreenProps) {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const flowRef = useRef(flowState);
  const priceRef = useRef(pendingTargetPrice);
  const pendingProductRef = useRef<{ name: string; image: string; description: string }>({
    name: 'Tracked Item', image: '', description: 'Product tracked via Penny Concierge.',
  });

  useEffect(() => { flowRef.current = flowState; }, [flowState]);
  useEffect(() => { priceRef.current = pendingTargetPrice; }, [pendingTargetPrice]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const addMessage = (msg: Omit<Message, 'id'>) =>
    setMessages(prev => [...prev, { ...msg, id: Date.now().toString() + Math.random() }]);

  // Called when user clicks "+ Add to Tracked Portfolio" on a message
  const handleTrackFromMessage = (msg: Message) => {
    const name = pendingProductRef.current.name !== 'Tracked Item'
      ? pendingProductRef.current.name
      : msg.text.split('\n')[0].replace(/[#*]/g, '').trim().slice(0, 60) || 'Tracked Item';

    addMessage({
      sender: 'PENNY',
      text: `Understood. What is your target acquisition price for the ${name}?`,
      pennyResponse: { flow_action: 'ask_price' } as any,
    });
    setFlowState('ASKED_PRICE');
    flowRef.current = 'ASKED_PRICE';
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    setInputValue('');
    setIsLoading(true);

    const currentFlow = flowRef.current;

    // Scrape URL if pasted in IDLE state
    if (isURL(text) && currentFlow === 'IDLE') {
      addMessage({ sender: 'YOU', text });
      try {
        const scrapeRes = await fetch(`/api/scrape?url=${encodeURIComponent(text)}`);
        if (scrapeRes.ok) {
          const product = await scrapeRes.json();
          if (product.title) pendingProductRef.current.name = product.title;
          if (product.image) pendingProductRef.current.image = product.image;
          if (product.description) pendingProductRef.current.description = product.description;
        }
      } catch { /* silent */ }
    } else {
      addMessage({ sender: 'YOU', text });
    }

    // Parse price if in price-asking flow
    if (currentFlow === 'ASKED_PRICE') {
      const price = parseFloat(text.replace(/[^0-9.]/g, ''));
      if (!isNaN(price) && price > 0) {
        setPendingTargetPrice(price);
        priceRef.current = price;
      }
    }

    try {
      const history = toOpenAIMessages([...messages, { id: 'tmp', sender: 'YOU', text }]);

      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, sessionId }),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      const { reply, reasoning, conclusion, confidence, next_steps, productName, flowAction } = data;

      // Update pending product name from AI
      if (productName) pendingProductRef.current.name = productName;

      const pennyResponse: PennyResponse = { reasoning, conclusion, confidence, next_steps };
      addMessage({ sender: 'PENNY', text: reply, pennyResponse });

      // Flow transitions via explicit signal
      if (flowAction === 'ask_price') {
        setFlowState('ASKED_PRICE');
        flowRef.current = 'ASKED_PRICE';
      } else if (flowAction === 'tracking_confirmed' || currentFlow === 'ASKED_PRICE') {
        onTrackItem({
          id: Date.now().toString(),
          name: pendingProductRef.current.name,
          description: pendingProductRef.current.description,
          status: 'Tracking Active',
          updatedAt: 'Just now',
          bestPrice: priceRef.current > 0 ? priceRef.current * 1.15 : 299.99,
          targetPrice: priceRef.current || 250,
          image: pendingProductRef.current.image,
        });
        setFlowState('IDLE');
        flowRef.current = 'IDLE';
        pendingProductRef.current = { name: 'Tracked Item', image: '', description: 'Product tracked via Penny Concierge.' };
      }

    } catch {
      addMessage({ sender: 'PENNY', text: 'My intelligence systems are temporarily offline. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-4 lg:px-0">
      <div className="flex-1 overflow-y-auto chat-scroll py-8 flex flex-col gap-10">
        <div className="flex flex-col items-center mb-8">
          <div className="text-[10px] font-bold tracking-[0.2em] text-primary/60 uppercase mb-4">Intelligence Terminal</div>
          <div className="p-4 bg-surface-container-low border-l-2 border-primary/30 max-w-sm text-center">
            <p className="text-xs italic opacity-60 leading-relaxed">Send a product name, URL, or paste an image to get a Buy / Wait / Track recommendation.</p>
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full">
          {messages.map(msg =>
            msg.sender === 'PENNY' ? (
              <PennyMessage key={msg.id} msg={msg} onTrack={() => handleTrackFromMessage(msg)} />
            ) : (
              <div key={msg.id} className="flex flex-col items-end w-full">
                <div className="flex flex-col items-end max-w-[85%] lg:max-w-[70%]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-[1px] w-4 bg-outline/30" />
                    <span className="text-[10px] font-bold tracking-widest text-outline uppercase">YOU</span>
                  </div>
                  <div className="bg-primary p-5 text-on-primary max-w-full">
                    <p className="text-base font-medium leading-relaxed break-all sm:break-words">{msg.text}</p>
                  </div>
                </div>
              </div>
            )
          )}

          {isLoading && (
            <div className="flex flex-col items-start max-w-[85%]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold tracking-widest text-primary uppercase">PENNY</span>
                <div className="h-[1px] w-4 bg-primary/30" />
              </div>
              <div className="bg-surface-container-high p-6 shadow-2xl">
                <div className="flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-8 mt-auto shrink-0">
        <div className="bg-surface-container-highest/50 backdrop-blur-md border-t-2 border-primary/20 p-4 shadow-2xl relative">
          <div className="flex items-end gap-4">
            <div className="flex flex-col gap-4 mb-1 shrink-0">
              <button className="hover:text-primary transition-colors duration-300" title="Paste URL">
                <Link2 className="w-5 h-5" />
              </button>
              <button className="hover:text-primary transition-colors duration-300" title="Upload image">
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <textarea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                className="w-full bg-transparent border-none border-b border-outline/30 focus:ring-0 focus:border-primary py-2 px-0 text-on-surface placeholder:text-outline/50 resize-none font-body text-base outline-none"
                placeholder={isLoading ? 'Penny is researching...' : 'Product name, URL, or paste a link...'}
                rows={1}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="bg-primary text-on-primary w-12 h-12 flex items-center justify-center transition-all active:scale-95 shrink-0 disabled:opacity-50"
            >
              <Send className="w-5 h-5 fill-current" />
            </button>
          </div>
          <div className="absolute -top-3 left-6">
            <div className="bg-primary text-on-primary text-[8px] font-black tracking-[0.3em] px-2 py-0.5 uppercase">
              Concierge Terminal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
