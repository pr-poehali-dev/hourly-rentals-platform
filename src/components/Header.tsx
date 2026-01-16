import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-purple-200 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <img 
              src="https://cdn.poehali.dev/projects/1a35ca30-983f-4a91-b0b4-3c6fa1c9a65b/files/4275be5a-5d13-4ada-b309-ce0e431a053f.jpg" 
              alt="120 минут" 
              className="h-16 w-16 md:h-20 md:w-20 rounded-xl object-cover shadow-md"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                120 минут
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">Почасовая аренда по всей России</p>
            </div>
          </a>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="border-purple-300 hover:bg-purple-50"
            >
              <Icon name="Home" size={18} className="mr-2" />
              Главная
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.href = '/top20'}
              className="border-yellow-400 hover:bg-yellow-50 bg-gradient-to-r from-yellow-50 to-orange-50"
            >
              <Icon name="Crown" size={18} className="mr-2 text-yellow-600" />
              <div className="text-left">
                <div className="font-semibold text-yellow-700">ТОП-20</div>
                <div className="text-[10px] text-muted-foreground -mt-0.5">премиум объекты</div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
