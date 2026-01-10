import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InteractiveMap from '@/components/InteractiveMap';

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
            <section className="mb-12 text-center animate-fade-in">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent leading-tight">
                  ПОЧАСОВАЯ АРЕНДА
                </h2>
                <h3 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent leading-tight">
                  ОТЕЛЕЙ И АПАРТАМЕНТОВ
                </h3>
                <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-6">
                  <div className="flex items-center gap-2 text-lg md:text-xl font-semibold text-purple-700">
                    <Icon name="CheckCircle2" size={24} className="text-green-500" />
                    <span>БЕЗ ПОСРЕДНИКОВ</span>
                  </div>
                  <div className="flex items-center gap-2 text-lg md:text-xl font-semibold text-purple-700">
                    <Icon name="CheckCircle2" size={24} className="text-green-500" />
                    <span>БЕЗ РЕГИСТРАЦИИ НА САЙТЕ</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 md:gap-6 mb-8 text-base md:text-lg font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center font-bold">1</div>
                    <span>ВЫБИРАЕТЕ</span>
                  </div>
                  <Icon name="ArrowRight" size={20} className="text-purple-600" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center font-bold">2</div>
                    <span>СВЯЗЫВАЕТЕСЬ</span>
                  </div>
                  <Icon name="ArrowRight" size={20} className="text-purple-600" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center font-bold">3</div>
                    <span>БРОНИРУЕТЕ</span>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-100">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Город, адрес, метро..."
                          className="pl-10 h-12 text-lg border-purple-200"
                          value={searchCity}
                          onChange={(e) => setSearchCity(e.target.value)}
                        />
                      </div>
                    </div>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="w-full md:w-[180px] h-12 border-purple-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все типы</SelectItem>
                        <SelectItem value="hotel">Отели</SelectItem>
                        <SelectItem value="apartment">Апартаменты</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger className="w-full md:w-[200px] h-12 border-purple-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="lg" className="h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      <Icon name="Search" size={20} className="mr-2" />
                      Найти
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="secondary" className="cursor-pointer hover:bg-purple-100">
                      <Icon name="MapPin" size={14} className="mr-1" />
                      Рядом с метро
                    </Badge>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-purple-100">
                      <Icon name="Star" size={14} className="mr-1" />
                      Высокий рейтинг
                    </Badge>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-purple-100">
                      <Icon name="Wifi" size={14} className="mr-1" />
                      С Wi-Fi
                    </Badge>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-purple-100" onClick={() => setShowMap(!showMap)}>
                      <Icon name="Map" size={14} className="mr-1" />
                      {showMap ? 'Показать списком' : 'Показать на карте'}
                    </Badge>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Доступные объекты</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Icon name="TrendingUp" size={20} className="text-purple-600" />
                    <span className="text-sm text-muted-foreground">Отсортировано по аукционной позиции</span>
                  </div>
                  <Button 
                    variant={showMap ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setShowMap(!showMap)}
                    className={showMap ? 'bg-gradient-to-r from-purple-600 to-pink-600' : ''}
                  >
                    <Icon name={showMap ? 'List' : 'Map'} size={18} className="mr-2" />
                    {showMap ? 'Списком' : 'На карте'}
                  </Button>
                </div>
              </div>

              {showMap ? (
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
                    {filteredListings.map((listing, index) => (
                      <Card 
                        key={listing.id} 
                        className={`overflow-hidden cursor-pointer border-2 transition-all ${
                          selectedListing === listing.id 
                            ? 'border-purple-500 shadow-lg scale-[1.02]' 
                            : 'border-purple-100 hover:border-purple-300'
                        }`}
                        onClick={() => setSelectedListing(listing.id)}
                      >
                        <div className="flex gap-4 p-4">
                          <div className="relative w-24 h-24 flex-shrink-0">
                            <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 rounded-lg flex items-center justify-center text-3xl">
                              {listing.image}
                            </div>
                            {listing.auction <= 3 && (
                              <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-xs">
                                ТОП-{listing.auction}
                              </Badge>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold mb-1 truncate">{listing.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Icon name="MapPin" size={14} />
                              <span className="truncate">{listing.city}, {listing.district}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-lg font-bold text-purple-600">{listing.price} ₽<span className="text-xs font-normal">/час</span></div>
                              <div className="flex items-center gap-1">
                                <Icon name="Star" size={14} className="text-orange-500 fill-orange-500" />
                                <span className="font-bold text-sm">{listing.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="sticky top-24 h-[700px]">
                    <InteractiveMap 
                      listings={filteredListings} 
                      selectedId={selectedListing}
                      onSelectListing={setSelectedListing}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing, index) => (
                  <Card 
                    key={listing.id} 
                    className="group overflow-hidden cursor-pointer border-2 border-purple-100 hover:border-purple-300 transition-all animate-fade-in hover:shadow-xl flex flex-col" 
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => {
                      setSelectedHotel(listing);
                      setDialogOpen(true);
                    }}
                  >
                    <div className="relative overflow-hidden">
                      <div className="h-48 bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-300">
                        {listing.image}
                      </div>
                      {listing.auction <= 3 && (
                        <Badge className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold">
                          <Icon name="Trophy" size={14} className="mr-1" />
                          ТОП-{listing.auction}
                        </Badge>
                      )}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold">
                        🎯 Место #{listing.auction}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                        <span className="text-white font-bold text-lg animate-fade-in">Посмотреть все предложения</span>
                      </div>
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="group/title relative">
                            <h4 className="font-bold text-lg mb-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all duration-300">{listing.title}</h4>
                            <div className="opacity-0 group-hover/title:opacity-100 transition-opacity text-xs text-purple-600 font-semibold">
                              Смотреть все предложения отеля
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Icon name="MapPin" size={14} />
                            <span>{listing.city}, {listing.district}</span>
                          </div>
                          {listing.metro !== '-' && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <span className="text-blue-600">Ⓜ️</span>
                              <span>{listing.metro}</span>
                            </div>
                          )}
                        </div>
                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold">
                          от {listing.minHours}ч
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="mb-4">
                        <div className="text-xs font-semibold text-muted-foreground mb-2">Категории номеров:</div>
                        <div className="space-y-2">
                          {listing.rooms.map((room, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                              <span className="text-sm font-medium">{room.type}</span>
                              <span className="text-sm font-bold text-purple-600">{room.price} ₽/час</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {listing.features.map(feature => (
                          <Badge key={feature} variant="outline" className="text-xs">{feature}</Badge>
                        ))}
                      </div>
                      <div className="flex-1"></div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-xs text-muted-foreground">от</div>
                          <div className="text-2xl font-bold text-purple-600">{listing.price} ₽</div>
                          <div className="text-xs text-muted-foreground">за час · мин. {listing.minHours}ч</div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Icon name="Star" size={16} className="text-orange-500 fill-orange-500" />
                            <span className="font-bold">{listing.rating}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{listing.reviews} отзывов</div>
                        </div>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        Забронировать
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                </div>
              )}
            </section>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedHotel && (
            <>
              <DialogHeader>
                <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {selectedHotel.title}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                <div className="relative">
                  <div className="h-64 bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center text-9xl rounded-xl">
                    {selectedHotel.image}
                  </div>
                  {selectedHotel.auction <= 3 && (
                    <Badge className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-lg px-4 py-2">
                      <Icon name="Trophy" size={20} className="mr-2" />
                      ТОП-{selectedHotel.auction}
                    </Badge>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                      <Icon name="MapPin" size={20} className="text-purple-600" />
                      Местоположение
                    </h3>
                    <div className="space-y-2 text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <Icon name="Building2" size={16} />
                        {selectedHotel.city}, {selectedHotel.district}
                      </p>
                      {selectedHotel.metro !== '-' && (
                        <p className="flex items-center gap-2">
                          <span className="text-blue-600">Ⓜ️</span>
                          {selectedHotel.metro}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                      <Icon name="Star" size={20} className="text-orange-500 fill-orange-500" />
                      Рейтинг
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold text-purple-600">{selectedHotel.rating}</div>
                      <div className="text-muted-foreground">
                        <div className="font-semibold">{selectedHotel.reviews} отзывов</div>
                        <div className="text-sm">Отличные оценки</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <Icon name="Sparkles" size={20} className="text-purple-600" />
                    Удобства
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedHotel.features.map(feature => (
                      <Badge key={feature} variant="secondary" className="text-sm px-3 py-1">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Icon name="Bed" size={20} className="text-purple-600" />
                    Категории номеров
                  </h3>
                  <div className="space-y-3">
                    {selectedHotel.rooms.map((room, idx) => (
                      <div key={idx} className="border-2 border-purple-100 rounded-xl p-4 hover:border-purple-300 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-lg font-bold">{room.type}</h4>
                            <p className="text-sm text-muted-foreground">Комфортабельный номер</p>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-purple-600">{room.price} ₽</div>
                            <div className="text-sm text-muted-foreground">за час</div>
                          </div>
                        </div>
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                          <Icon name="Calendar" size={18} className="mr-2" />
                          Забронировать {room.type}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-100">
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <Icon name="Info" size={20} className="text-purple-600" />
                    Важная информация
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle2" size={16} className="text-green-500 mt-0.5" />
                      <span>Минимальное время бронирования — 1 час</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle2" size={16} className="text-green-500 mt-0.5" />
                      <span>Оплата наличными или картой при заселении</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle2" size={16} className="text-green-500 mt-0.5" />
                      <span>Бесплатная отмена за 1 час до заселения</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle2" size={16} className="text-green-500 mt-0.5" />
                      <span>Круглосуточная поддержка клиентов</span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-lg py-6"
                  >
                    <Icon name="Phone" size={20} className="mr-2" />
                    Позвонить владельцу
                  </Button>
                  <Button 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg py-6"
                  >
                    <Icon name="MessageCircle" size={20} className="mr-2" />
                    Написать в WhatsApp
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}