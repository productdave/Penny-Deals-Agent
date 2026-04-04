import { Menu, Search, User, CircleHelp } from 'lucide-react';

interface HeaderProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export function Header({ currentScreen, onNavigate }: HeaderProps) {
  const isLanding = currentScreen === 'landing';

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#131313]">
      {isLanding ? (
        <>
          <div 
            className="text-2xl font-black text-primary tracking-widest font-headline uppercase cursor-pointer"
            onClick={() => onNavigate('landing')}
          >
            PENNY
          </div>
          <div className="flex items-center gap-4">
            <CircleHelp className="text-on-surface cursor-pointer hover:text-primary transition-colors w-6 h-6" />
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <Menu className="text-primary cursor-pointer w-6 h-6" />
            <h1 
              className="font-headline font-black uppercase tracking-widest text-2xl text-primary cursor-pointer hidden sm:block"
              onClick={() => onNavigate('landing')}
            >
              PENNY
            </h1>
          </div>
          
          <h1 
            className="font-headline font-black uppercase tracking-widest text-2xl text-primary cursor-pointer sm:hidden"
            onClick={() => onNavigate('landing')}
          >
            PENNY
          </h1>

          <div className="flex items-center gap-4">
            {currentScreen === 'chat' && (
              <div className="w-8 h-8 bg-surface-container-high flex items-center justify-center border border-outline-variant/15 cursor-pointer hover:border-primary/50 transition-colors">
                <Search className="text-on-surface w-4 h-4" />
              </div>
            )}
            <div className="w-8 h-8 bg-surface-container-highest flex items-center justify-center border border-outline-variant/20 overflow-hidden cursor-pointer">
              {currentScreen === 'chat' ? (
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZMo9pW8eonAcWO2VDYczE3GZuT1LnOgZr28DFJRrSTjQIS7Hw3EVZeJHdjcx8yXKvh2OD1EJ-q64CQR27CTJExy24AjATpRYjyUX1JJdPe2XVDbC1h_3d6M83YaIToruNpJTuIQEjOnZw00U3UBtAm-n7zb86gh1x_qy13FdQveQ8lN3VM7ZxJ45lqwVg49OvJ6jn_7ymwLc0NPEQTn9D5ybKPmSYaHa3jgws8xoGvkCfKqz5zGN8c5tSmIYzp3OgXH7xqNdSQEYE" 
                  alt="User profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="text-on-surface w-4 h-4" />
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
