import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import SearchHero from '@/components/SearchHero';
import ListingsView from '@/components/ListingsView';
import HotelModal from '@/components/HotelModal';

const mockListings = [
  { id: 1, title: 'Отель «Арбат Плаза»', type: 'hotel', city: 'Москва', district: 'Арбат', price: 2500, rating: 4.9, reviews: 124, auction: 1, image: '🏙️', metro: 'Арбатская', features: ['Wi-Fi', 'Кондиционер', 'Кухня'], lat: 55.7522, lng: 37.6156, minHours: 2, rooms: [{type: 'Стандарт', price: 2500}, {type: 'Улучшенный', price: 3200}, {type: 'Полулюкс', price: 4500}] },
  { id: 2, title: 'Апарт-отель «Невский»', type: 'apartment', city: 'Санкт-Петербург', district: 'Центральный', price: 2200, rating: 4.8, reviews: 89, auction: 2, image: '🏛️', metro: 'Невский проспект', features: ['Wi-Fi', 'Кухня', 'Джакузи'], lat: 59.9343, lng: 30.3351, minHours: 3, rooms: [{type: 'Стандарт', price: 2200}, {type: 'Улучшенный', price: 2900}, {type: 'Полулюкс', price: 3800}] },
  { id: 3, title: 'Гостиница «Горный приют»', type: 'hotel', city: 'Сочи', district: 'Красная Поляна', price: 4500, rating: 5.0, reviews: 201, auction: 3, image: '🏔️', metro: '-', features: ['Вид на горы', 'Сауна', 'Парковка'], lat: 43.6850, lng: 40.2645, minHours: 4, rooms: [{type: 'Стандарт', price: 4500}, {type: 'Улучшенный', price: 5500}, {type: 'Люкс', price: 7500}] },
  { id: 4, title: 'Отель «Тверская»', type: 'hotel', city: 'Москва', district: 'ЦАО', price: 1800, rating: 4.7, reviews: 56, auction: 5, image: '🌆', metro: 'Тверская', features: ['Wi-Fi', 'Кондиционер'], lat: 55.7658, lng: 37.6050, minHours: 1, rooms: [{type: 'Стандарт', price: 1800}, {type: 'Улучшенный', price: 2400}] },
  { id: 5, title: 'Бизнес-отель «Центр»', type: 'hotel', city: 'Екатеринбург', district: 'Центр', price: 1600, rating: 4.6, reviews: 43, auction: 8, image: '🏢', metro: 'Площадь 1905 года', features: ['Фитнес', 'Кухня', 'Wi-Fi'], lat: 56.8389, lng: 60.6057, minHours: 2, rooms: [{type: 'Стандарт', price: 1600}, {type: 'Полулюкс', price: 2500}] },
  { id: 6, title: 'Апартаменты «Кремлевские»', type: 'apartment', city: 'Казань', district: 'Вахитовский', price: 2000, rating: 4.9, reviews: 78, auction: 4, image: '🌃', metro: 'Кремлёвская', features: ['Вид на Кремль', 'Wi-Fi', 'Паркинг'], lat: 55.7887, lng: 49.1221, minHours: 3, rooms: [{type: 'Стандарт', price: 2000}, {type: 'Улучшенный', price: 2700}, {type: 'Полулюкс', price: 3500}] },
];

const cities = ['Все города', 'Москва', 'Санкт-Петербург', 'Сочи', 'Екатеринбург', 'Казань'];

export default function Index() {
  const [searchCity, setSearchCity] = useState('');
  const [selectedCity, setSelectedCity] = useState('Все города');
  const [selectedType, setSelectedType] = useState('all');
  const [activeTab, setActiveTab] = useState('catalog');
  const [showMap, setShowMap] = useState(false);
  const [selectedListing, setSelectedListing] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<typeof mockListings[0] | null>(null);

  const filteredListings = mockListings
    .filter(l => selectedCity === 'Все города' || l.city === selectedCity)
    .filter(l => selectedType === 'all' || l.type === selectedType)
    .filter(l => l.title.toLowerCase().includes(searchCity.toLowerCase()) || l.city.toLowerCase().includes(searchCity.toLowerCase()))
    .sort((a, b) => a.auction - b.auction);

  const handleCardClick = (listing: typeof mockListings[0]) => {
    setSelectedHotel(listing);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-purple-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">⏰</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ЧасАренда
                </h1>
                <p className="text-xs text-muted-foreground">Почасовая аренда по всей России</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <Button variant="ghost" onClick={() => setActiveTab('catalog')}>Каталог</Button>
              <Button variant="ghost" onClick={() => setActiveTab('about')}>О платформе</Button>
              <Button variant="ghost" onClick={() => setActiveTab('partners')}>Партнерам</Button>
              <Button variant="ghost" onClick={() => setActiveTab('support')}>Поддержка</Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Icon name="User" size={18} className="mr-2" />
                    Личный кабинет
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>Личный кабинет</SheetTitle>
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
                          <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                            Войти
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </SheetContent>
              </Sheet>
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
              cities={cities}
              showMap={showMap}
              setShowMap={setShowMap}
            />
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

        {activeTab === 'about' && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-4xl font-bold mb-6">О платформе ЧасАренда</h2>
            <Card className="p-8">
              <p className="text-lg mb-4">
                ЧасАренда — крупнейшая всероссийская платформа почасовой аренды отелей и апартаментов.
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
    </div>
  );
}
