import { useState, useRef, useEffect } from 'react';
import { Link2, Image as ImageIcon, Send } from 'lucide-react';
import { TrackedItem, Message, ChatFlowState } from '../types';

interface ChatScreenProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  flowState: ChatFlowState;
  setFlowState: React.Dispatch<React.SetStateAction<ChatFlowState>>;
  pendingTargetPrice: number;
  setPendingTargetPrice: React.Dispatch<React.SetStateAction<number>>;
  onTrackItem: (item: TrackedItem) => void;
}

export function ChatScreen({ 
  messages, 
  setMessages, 
  flowState, 
  setFlowState, 
  pendingTargetPrice, 
  setPendingTargetPrice, 
  onTrackItem 
}: ChatScreenProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    const userText = inputValue;
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'YOU', text: userText }]);
    setInputValue('');

    setTimeout(() => {
      if (flowState === 'IDLE') {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'PENNY', text: 'I can track this product for you. What is your target purchase price?' }]);
        setFlowState('ASKED_PRICE');
      } else if (flowState === 'ASKED_PRICE') {
        const price = parseFloat(userText.replace(/[^0-9.]/g, '')) || 0;
        setPendingTargetPrice(price);
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'PENNY', text: `Noted. Target set to $${price}. Would you like me to alert you for any price drop, or only when it hits your target?` }]);
        setFlowState('ASKED_ALERT');
      } else if (flowState === 'ASKED_ALERT') {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'PENNY', text: 'Tracking initiated. I have added this to your tracked portfolio.' }]);
        setFlowState('IDLE');
        onTrackItem({
          id: Date.now().toString(),
          name: 'New Tracked Item',
          description: 'Product tracked via Concierge Terminal.',
          status: 'Tracking Active',
          updatedAt: 'Just now',
          bestPrice: pendingTargetPrice > 0 ? pendingTargetPrice + 50 : 299.99,
          targetPrice: pendingTargetPrice || 250,
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=60'
        });
      }
    }, 800);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-4 lg:px-0">
      <div className="flex-1 overflow-y-auto chat-scroll py-8 flex flex-col gap-10">
        <div className="flex flex-col items-center mb-12">
          <div className="text-[10px] font-bold tracking-[0.2em] text-primary/60 uppercase mb-4">Monday, 14 Oct</div>
          <div className="p-4 bg-surface-container-low border-l-2 border-primary/30 max-w-xs text-center">
            <p className="text-xs italic opacity-60 leading-relaxed">Encrypted connection established with your personal concierge.</p>
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full">
          {messages.map((msg) => (
            msg.sender === 'PENNY' ? (
              <div key={msg.id} className="flex flex-col items-start max-w-[85%] lg:max-w-[70%]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold tracking-widest text-primary uppercase">PENNY</span>
                  <div className="h-[1px] w-4 bg-primary/30"></div>
                </div>
                <div className="bg-surface-container-high p-6 shadow-2xl space-y-4 relative">
                  <p className="text-lg leading-relaxed text-on-surface">{msg.text}</p>
                  {msg.hasCards && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="bg-surface-container p-4 border border-outline-variant/10 cursor-pointer hover:border-primary/50 transition-colors">
                        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGIc-0ink_5zrOVU47Z8dJw3oF0oGEuTup-Bgf0DBu--VMiGY756WIjXHepwIj4VG1DKNHF-DJWms_eP79egf18GCBdQVdA2tEKlTZXVbLQQrL0GwGTVu-NNlHyPk4270Ba1n270Qo5optdJw876vChVLO1lafavaPD146QndiwkiA1W9dHNDojgUP-hwnTevdRXiTZ5J2Cc8r1FT2GIrUISf2PdrW25-GQzaf-kGfX9tnQPHkOHHhS_CN_G0OhFV6KFl0xVJCHvyJ" alt="Omega Seamaster" className="w-full h-32 object-cover mb-3 grayscale contrast-125" />
                        <h4 className="font-headline text-sm mb-1 uppercase tracking-tight">Omega Seamaster '65</h4>
                        <p className="text-[10px] opacity-60">Pristine mechanical movement</p>
                      </div>
                      <div className="bg-surface-container p-4 border border-outline-variant/10 cursor-pointer hover:border-primary/50 transition-colors">
                        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhsG4ui0OSDtqUD9MJfUn_e6LSXYEO2SSFL1tL9v8OJJpVwcYwv8xgGYzyFm7eRlz3RWRozp98xoLMufptrRK3Dton500ti4AMjSWdnIZtrt82S__8FQLwC1htBxndG7m_eBt_UMn4X5XxQvczRBJXjWo-4hjnu6XSLPWaDxsdhl9gWD9fc18-Hil4fIj0tAnbQONONB_PNDkLfwK2Yg1EOYu5j6LtbNn9tlLRTQ0N1qBnM-zQMtqFkI7gccrSmLCzj1fnsRQxwdv-" alt="Grand Seiko" className="w-full h-32 object-cover mb-3 grayscale contrast-125" />
                        <h4 className="font-headline text-sm mb-1 uppercase tracking-tight">Grand Seiko 44GS</h4>
                        <p className="text-[10px] opacity-60">The grammar of design</p>
                      </div>
                    </div>
                  )}
                </div>
                {msg.isChipActive && (
                  <div className="mt-2 flex gap-3">
                    <div className="bg-secondary-container px-3 py-1 flex items-center gap-2">
                      <div className="w-1 h-1 bg-on-secondary-container"></div>
                      <span className="text-[10px] font-bold tracking-tighter text-on-secondary-container uppercase">Intelligence Chip Active</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div key={msg.id} className="flex flex-col items-end w-full">
                <div className="flex flex-col items-end max-w-[85%] lg:max-w-[70%]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-[1px] w-4 bg-outline/30"></div>
                    <span className="text-[10px] font-bold tracking-widest text-outline uppercase">YOU</span>
                  </div>
                  <div className="bg-primary p-6 text-on-primary">
                    <p className="text-lg font-medium leading-relaxed break-all sm:break-words">{msg.text}</p>
                  </div>
                </div>
              </div>
            )
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="px-4 pb-8 mt-auto shrink-0">
        <div className="bg-surface-container-highest/50 backdrop-blur-md border-t-2 border-primary/20 p-4 shadow-2xl relative">
          <div className="flex items-end gap-4">
            <div className="flex flex-col gap-4 mb-1 shrink-0">
              <button className="hover:text-primary transition-colors duration-300">
                <Link2 className="w-5 h-5" />
              </button>
              <button className="hover:text-primary transition-colors duration-300">
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <textarea 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="w-full bg-transparent border-none border-b border-outline/30 focus:ring-0 focus:border-primary py-2 px-0 text-on-surface placeholder:text-outline/50 resize-none font-body text-base outline-none" 
                placeholder="Message Penny..." 
                rows={1}
              />
            </div>
            <button 
              onClick={handleSend}
              className="bg-primary text-on-primary w-12 h-12 flex items-center justify-center transition-all active:scale-95 shrink-0"
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
