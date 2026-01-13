import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import SearchHero from '@/components/SearchHero';
import ListingsView from '@/components/ListingsView';
import HotelModal from '@/components/HotelModal';
import { api } from '@/lib/api';

export default function Index() {
  const [searchCity, setSearchCity] = useState('');
  const [selectedCity, setSelectedCity] = useState('Все города');
  const [selectedType, setSelectedType] = useState('all');
  const [hasParking, setHasParking] = useState(false);
  const [minHours, setMinHours] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('catalog');
  const [showMap, setShowMap] = useState(false);
  const [selectedListing, setSelectedListing] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      const data = await api.getPublicListings();
      setAllListings(data);
    } catch (error) {
      console.error('Failed to load listings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const uniqueCities = ['Все города', ...new Set(allListings.map(l => l.city))];

  const filteredListings = allListings
    .filter(l => !l.is_archived)
    .filter(l => selectedCity === 'Все города' || l.city === selectedCity)
    .filter(l => selectedType === 'all' || l.type === selectedType)
    .filter(l => !hasParking || l.hasParking)
    .filter(l => minHours === null || l.minHours <= minHours)
    .filter(l => l.title.toLowerCase().includes(searchCity.toLowerCase()) || l.city.toLowerCase().includes(searchCity.toLowerCase()))
    .filter(l => {
      if (selectedFeatures.length === 0) return true;
      return l.rooms && l.rooms.some((room: any) => 
        selectedFeatures.every((feature) => room.features && room.features.includes(feature))
      );
    });

  const handleCardClick = (listing: any) => {
    window.location.href = `/listing/${listing.id}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-purple-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="https://cdn.poehali.dev/projects/1a35ca30-983f-4a91-b0b4-3c6fa1c9a65b/files/4275be5a-5d13-4ada-b309-ce0e431a053f.jpg" 
                alt="120 минут" 
                className="h-16 w-16 md:h-20 md:w-20 rounded-xl object-cover shadow-md hover:rotate-[360deg] transition-transform duration-700 cursor-pointer"
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  120 минут
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground">Почасовая аренда по всей России</p>
              </div>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="border-purple-300 hover:bg-purple-50">
                  <div className="text-left">
                    <div className="font-semibold text-purple-700">Экстранет</div>
                    <div className="text-[10px] text-muted-foreground -mt-0.5">для владельцев</div>
                  </div>
                </Button>
              </SheetTrigger>
                  <SheetContent className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                      <SheetTitle>Личный кабинет для владельцев</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-4xl mb-3">👤</div>
                            <h3 className="font-bold text-lg mb-2">Войдите в аккаунт</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Управляйте своими объектами и бронированиями
                            </p>
                            <Button 
                              onClick={() => window.location.href = '/owner/login'}
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg transition-all"
                            >
                              Войти
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      <div className="pt-4 border-t space-y-2 text-center text-sm text-muted-foreground">
                        <a href="/company-info" className="block hover:text-purple-600 transition-colors">
                          <Icon name="Building2" size={16} className="inline mr-1" />
                          Реквизиты компании
                        </a>
                        <a href="/offer" className="block hover:text-purple-600 transition-colors">
                          <Icon name="FileText" size={16} className="inline mr-1" />
                          Публичная оферта
                        </a>
                        <a href="/company-info" className="block hover:text-purple-600 transition-colors">
                          <Icon name="Shield" size={16} className="inline mr-1" />
                          Политика конфиденциальности
                        </a>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

            <nav className="hidden md:flex items-center gap-3">
              <Button 
                variant={activeTab === 'catalog' ? 'default' : 'ghost'} 
                onClick={() => setActiveTab('catalog')}
                className={activeTab === 'catalog' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' : 'text-purple-700 hover:bg-purple-50 hover:text-purple-800'}
              >
                Каталог
              </Button>
              <Button 
                variant={activeTab === 'about' ? 'default' : 'ghost'} 
                onClick={() => setActiveTab('about')}
                className={activeTab === 'about' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' : 'text-purple-700 hover:bg-purple-50 hover:text-purple-800'}
              >
                О платформе
              </Button>
              <Button 
                variant={activeTab === 'partners' ? 'default' : 'ghost'} 
                onClick={() => setActiveTab('partners')}
                className={activeTab === 'partners' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' : 'text-purple-700 hover:bg-purple-50 hover:text-purple-800'}
              >
                Партнерам
              </Button>
              <Button 
                variant={activeTab === 'support' ? 'default' : 'ghost'} 
                onClick={() => setActiveTab('support')}
                className={activeTab === 'support' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' : 'text-purple-700 hover:bg-purple-50 hover:text-purple-800'}
              >
                Поддержка
              </Button>
            </nav>

            <Button variant="ghost" size="icon" className="md:hidden">
              <Icon name="Menu" size={24} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'catalog' && (
          <>
            <SearchHero
              searchCity={searchCity}
              setSearchCity={setSearchCity}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              selectedCity={selectedCity}
              setSelectedCity={setSelectedCity}
              cities={uniqueCities}
              showMap={showMap}
              setShowMap={setShowMap}
              hasParking={hasParking}
              setHasParking={setHasParking}
              minHours={minHours}
              setMinHours={setMinHours}
              selectedFeatures={selectedFeatures}
              setSelectedFeatures={setSelectedFeatures}
            />
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Icon name="Loader2" size={48} className="animate-spin text-purple-600" />
              </div>
            ) : (
              <>
                {(selectedCity !== 'Все города' || selectedType !== 'all' || hasParking || minHours !== null || selectedFeatures.length > 0 || searchCity) && (
                  <div className="mb-6 flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100">
                    <div className="flex items-center gap-3">
                      <Icon name="Filter" size={20} className="text-purple-600" />
                      <span className="text-sm font-medium">
                        Найдено объектов: <span className="text-lg font-bold text-purple-600">{filteredListings.length}</span>
                      </span>
                      {selectedFeatures.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          • С удобствами: {selectedFeatures.join(', ')}
                        </span>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedCity('Все города');
                        setSelectedType('all');
                        setHasParking(false);
                        setMinHours(null);
                        setSelectedFeatures([]);
                        setSearchCity('');
                      }}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <Icon name="X" size={16} className="mr-1" />
                      Сбросить фильтры
                    </Button>
                  </div>
                )}
                <ListingsView
                  filteredListings={filteredListings}
                  showMap={showMap}
                  setShowMap={setShowMap}
                  selectedListing={selectedListing}
                  setSelectedListing={setSelectedListing}
                  onCardClick={handleCardClick}
                />
              </>
            )}
          </>
        )}

        {activeTab === 'about' && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-4xl font-bold mb-6">О платформе 120 минут</h2>
            <Card className="p-8">
              <p className="text-lg mb-4">
                120 минут — крупнейшая всероссийская платформа почасовой аренды отелей и апартаментов.
              </p>
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="text-4xl mb-3">🏢</div>
                  <div className="text-3xl font-bold text-purple-600">5000+</div>
                  <div className="text-sm text-muted-foreground">Объектов</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-3">🌍</div>
                  <div className="text-3xl font-bold text-pink-600">100+</div>
                  <div className="text-sm text-muted-foreground">Городов России</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-3">⭐</div>
                  <div className="text-3xl font-bold text-orange-600">4.8</div>
                  <div className="text-sm text-muted-foreground">Средний рейтинг</div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'partners' && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-4xl font-bold mb-6">Партнерам</h2>
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-4">Разместите свой объект</h3>
              <p className="mb-4">Станьте партнером ЧасАренда и получите доступ к миллионам клиентов по всей России.</p>
              <div className="space-y-4 mt-6">
                <div className="flex gap-4">
                  <div className="text-3xl">💰</div>
                  <div>
                    <h4 className="font-bold">Система аукциона</h4>
                    <p className="text-sm text-muted-foreground">Управляйте позицией вашего объекта в поиске через аукцион</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-3xl">📊</div>
                  <div>
                    <h4 className="font-bold">Аналитика и статистика</h4>
                    <p className="text-sm text-muted-foreground">Полный контроль над бронированиями и доходами</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-3xl">🎯</div>
                  <div>
                    <h4 className="font-bold">ТОП размещение</h4>
                    <p className="text-sm text-muted-foreground">Поднимайте объявления для максимальной видимости</p>
                  </div>
                </div>
              </div>
              <Button size="lg" className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Стать партнером
              </Button>
            </Card>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-4xl font-bold mb-6">Поддержка</h2>
            <Card className="p-8">
              <p className="text-lg">Свяжитесь с нами для получения помощи</p>
            </Card>
          </div>
        )}
      </main>

      <HotelModal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        hotel={selectedHotel}
      />

      <footer className="bg-white border-t border-purple-200 py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">⏰</div>
              <div>
                <div className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  120 минут
                </div>
                <p className="text-xs text-muted-foreground">© 2024 Все права защищены</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-purple-600"
              onClick={() => window.location.href = '/admin/login'}
            >
              <Icon name="ShieldCheck" size={16} className="mr-2" />
              Вход для администратора
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}