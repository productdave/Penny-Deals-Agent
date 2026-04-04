import { MessageSquare, LineChart, Settings } from 'lucide-react';

interface BottomNavProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  const navItems = [
    { id: 'chat', icon: MessageSquare, label: 'CHAT' },
    { id: 'tracked', icon: LineChart, label: 'TRACKED' },
    { id: 'settings', icon: Settings, label: 'SETTINGS' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 px-4 pb-4 bg-[#131313] border-t border-surface-container-high">
      {navItems.map((item) => {
        const isActive = currentScreen === item.id || (currentScreen === 'report' && item.id === 'tracked');
        const Icon = item.icon;
        
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center p-2 transition-all duration-300 w-20 ${
              isActive 
                ? 'text-primary border-t-2 border-primary' 
                : 'text-on-surface opacity-50 hover:opacity-100 border-t-2 border-transparent'
            }`}
          >
            <Icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
            <span className="font-body text-[10px] font-bold tracking-[0.1em] uppercase">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
