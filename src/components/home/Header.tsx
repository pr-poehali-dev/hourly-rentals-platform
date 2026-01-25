import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-purple-200 shadow-sm">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <img 
              src="https://cdn.poehali.dev/projects/1a35ca30-983f-4a91-b0b4-3c6fa1c9a65b/files/8251a8b2-9b61-4cee-9e68-aae6e7ec6e96.jpg" 
              alt="120 минут" 
              className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 object-contain hover:scale-110 transition-transform duration-300 cursor-pointer"
            />
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                120 минут
              </h1>
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground whitespace-nowrap">Почасовая аренда по всей России</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="sm">
                  <Icon name="Menu" size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Меню</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-6">
                  <Button 
                    variant={activeTab === 'catalog' ? 'default' : 'ghost'} 
                    onClick={() => onTabChange('catalog')}
                    className="w-full justify-start"
                  >
                    Каталог
                  </Button>
                  <Button 
                    variant={activeTab === 'about' ? 'default' : 'ghost'} 
                    onClick={() => onTabChange('about')}
                    className="w-full justify-start"
                  >
                    О платформе
                  </Button>
                  <Button 
                    variant={activeTab === 'partners' ? 'default' : 'ghost'} 
                    onClick={() => onTabChange('partners')}
                    className="w-full justify-start"
                  >
                    Партнерам
                  </Button>
                  <Button 
                    variant={activeTab === 'support' ? 'default' : 'ghost'} 
                    onClick={() => onTabChange('support')}
                    className="w-full justify-start"
                  >
                    Поддержка
                  </Button>
                  <div className="border-t pt-4 mt-4 space-y-2">
                    <a href="/add-listing" className="block">
                      <Button variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800">
                        <Icon name="Plus" size={18} className="mr-2" />
                        Добавить объект
                      </Button>
                    </a>
                    <a href="/owner/login" className="block">
                      <Button variant="outline" className="w-full">
                        Экстранет для владельцев
                      </Button>
                    </a>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            <nav className="hidden md:flex items-center gap-3">
            <Button 
              variant={activeTab === 'catalog' ? 'default' : 'ghost'} 
              onClick={() => onTabChange('catalog')}
              className={activeTab === 'catalog' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' : 'text-purple-700 hover:bg-purple-50 hover:text-purple-800'}
            >
              Каталог
            </Button>
            <Button 
              variant={activeTab === 'about' ? 'default' : 'ghost'} 
              onClick={() => onTabChange('about')}
              className={activeTab === 'about' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' : 'text-purple-700 hover:bg-purple-50 hover:text-purple-800'}
            >
              О платформе
            </Button>
            <Button 
              variant={activeTab === 'partners' ? 'default' : 'ghost'} 
              onClick={() => onTabChange('partners')}
              className={activeTab === 'partners' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' : 'text-purple-700 hover:bg-purple-50 hover:text-purple-800'}
            >
              Партнерам
            </Button>
            <Button 
              variant={activeTab === 'support' ? 'default' : 'ghost'} 
              onClick={() => onTabChange('support')}
              className={activeTab === 'support' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' : 'text-purple-700 hover:bg-purple-50 hover:text-purple-800'}
            >
              Поддержка
            </Button>
            <a href="/add-listing">
              <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800">
                <Icon name="Plus" size={18} className="mr-2" />
                Добавить объект
              </Button>
            </a>
            <a href="/owner/login">
              <Button variant="outline">
                Экстранет для владельцев
              </Button>
            </a>
          </nav>
          </div>
        </div>
      </div>
    </header>
  );
}