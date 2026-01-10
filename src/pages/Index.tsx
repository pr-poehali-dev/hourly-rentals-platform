import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InteractiveMap from '@/components/InteractiveMap';

const mockListings = [
  { id: 1, title: 'Студия в центре Москвы', city: 'Москва', district: 'Арбат', price: 2500, rating: 4.9, reviews: 124, auction: 1, image: '🏙️', metro: 'Арбатская', features: ['Wi-Fi', 'Кондиционер', 'Кухня'], lat: 55.7522, lng: 37.6156 },
  { id: 2, title: 'Апартаменты у Невского', city: 'Санкт-Петербург', district: 'Центральный', price: 2200, rating: 4.8, reviews: 89, auction: 2, image: '🏛️', metro: 'Невский проспект', features: ['Wi-Fi', 'Кухня', 'Джакузи'], lat: 59.9343, lng: 30.3351 },
  { id: 3, title: 'Люкс на Красной Поляне', city: 'Сочи', district: 'Красная Поляна', price: 4500, rating: 5.0, reviews: 201, auction: 3, image: '🏔️', metro: '-', features: ['Вид на горы', 'Сауна', 'Парковка'], lat: 43.6850, lng: 40.2645 },
  { id: 4, title: 'Уютная квартира на Тверской', city: 'Москва', district: 'ЦАО', price: 1800, rating: 4.7, reviews: 56, auction: 5, image: '🌆', metro: 'Тверская', features: ['Wi-Fi', 'Кондиционер'], lat: 55.7658, lng: 37.6050 },
  { id: 5, title: 'Апарт-отель Деловой центр', city: 'Екатеринбург', district: 'Центр', price: 1600, rating: 4.6, reviews: 43, auction: 8, image: '🏢', metro: 'Площадь 1905 года', features: ['Фитнес', 'Кухня', 'Wi-Fi'], lat: 56.8389, lng: 60.6057 },
  { id: 6, title: 'Панорамные апартаменты', city: 'Казань', district: 'Вахитовский', price: 2000, rating: 4.9, reviews: 78, auction: 4, image: '🌃', metro: 'Кремлёвская', features: ['Вид на Кремль', 'Wi-Fi', 'Паркинг'], lat: 55.7887, lng: 49.1221 },
];

const cities = ['Все города', 'Москва', 'Санкт-Петербург', 'Сочи', 'Екатеринбург', 'Казань'];

export default function Index() {
  const [searchCity, setSearchCity] = useState('');
  const [selectedCity, setSelectedCity] = useState('Все города');
  const [activeTab, setActiveTab] = useState('catalog');
  const [showMap, setShowMap] = useState(false);
  const [selectedListing, setSelectedListing] = useState<number | null>(null);

  const filteredListings = mockListings
    .filter(l => selectedCity === 'Все города' || l.city === selectedCity)
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
                  <AdminPanel />
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
                <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                  Аренда жилья на час
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  Найди идеальное место для встречи, работы или отдыха в любом городе России
                </p>

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
                  <Card key={listing.id} className="overflow-hidden hover-scale cursor-pointer border-2 border-purple-100 hover:border-purple-300 transition-all animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="relative">
                      <div className="h-48 bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center text-6xl">
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
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-lg mb-1">{listing.title}</h4>
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
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {listing.features.map(feature => (
                          <Badge key={feature} variant="outline" className="text-xs">{feature}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-purple-600">{listing.price} ₽</div>
                          <div className="text-xs text-muted-foreground">за час</div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Icon name="Star" size={16} className="text-orange-500 fill-orange-500" />
                            <span className="font-bold">{listing.rating}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{listing.reviews} отзывов</div>
                        </div>
                      </div>
                      <Button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
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
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">Контакты</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Icon name="Phone" size={20} className="text-purple-600" />
                      <span>8-800-555-35-35</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Icon name="Mail" size={20} className="text-purple-600" />
                      <span>support@chasarenda.ru</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Icon name="MessageCircle" size={20} className="text-purple-600" />
                      <span>Онлайн-чат (24/7)</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Часто задаваемые вопросы</h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-purple-600 pl-4">
                      <h4 className="font-semibold">Как забронировать объект?</h4>
                      <p className="text-sm text-muted-foreground">Выберите объект, укажите время и оплатите онлайн</p>
                    </div>
                    <div className="border-l-4 border-pink-600 pl-4">
                      <h4 className="font-semibold">Минимальное время аренды?</h4>
                      <p className="text-sm text-muted-foreground">От 1 часа в зависимости от объекта</p>
                    </div>
                    <div className="border-l-4 border-orange-600 pl-4">
                      <h4 className="font-semibold">Как стать партнером?</h4>
                      <p className="text-sm text-muted-foreground">Заполните заявку в разделе "Партнерам"</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      <footer className="mt-20 bg-gradient-to-r from-purple-900 to-pink-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-4">ЧасАренда</h4>
              <p className="text-sm text-purple-200">Почасовая аренда жилья по всей России</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Компания</h4>
              <div className="space-y-2 text-sm text-purple-200">
                <div>О нас</div>
                <div>Партнерам</div>
                <div>Вакансии</div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Поддержка</h4>
              <div className="space-y-2 text-sm text-purple-200">
                <div>Помощь</div>
                <div>Контакты</div>
                <div>FAQ</div>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Социальные сети</h4>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                  VK
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                  TG
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                  OK
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/20 text-center text-sm text-purple-200">
            © 2026 ЧасАренда. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
}

function AdminPanel() {
  const [userListings] = useState([
    { id: 1, title: 'Мои апартаменты', city: 'Москва', price: 2500, auction: 8, active: true },
    { id: 2, title: 'Студия на Тверской', city: 'Москва', price: 1800, auction: 12, active: true },
  ]);

  return (
    <div className="mt-6 space-y-6">
      <Tabs defaultValue="listings">
        <TabsList className="w-full">
          <TabsTrigger value="listings" className="flex-1">Мои объекты</TabsTrigger>
          <TabsTrigger value="add" className="flex-1">Добавить</TabsTrigger>
          <TabsTrigger value="auction" className="flex-1">Аукцион</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            У вас {userListings.length} активных объектов
          </div>
          {userListings.map(listing => (
            <Card key={listing.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold">{listing.title}</h4>
                    <div className="text-sm text-muted-foreground">{listing.city}</div>
                  </div>
                  <Badge variant={listing.active ? "default" : "secondary"}>
                    {listing.active ? 'Активно' : 'Неактивно'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold">{listing.price} ₽</span> / час
                  </div>
                  <div className="text-muted-foreground">
                    Позиция: #{listing.auction}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Icon name="Edit" size={14} className="mr-2" />
                    Редактировать
                  </Button>
                  <Button size="sm" className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600">
                    <Icon name="TrendingUp" size={14} className="mr-2" />
                    Поднять
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Название объекта</label>
              <Input placeholder="Например: Студия в центре" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Город</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите город" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moscow">Москва</SelectItem>
                  <SelectItem value="spb">Санкт-Петербург</SelectItem>
                  <SelectItem value="sochi">Сочи</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Цена за час (₽)</label>
              <Input type="number" placeholder="2000" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Адрес</label>
              <Input placeholder="ул. Тверская, д. 10" />
            </div>
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Icon name="Plus" size={18} className="mr-2" />
              Добавить объект
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="auction" className="space-y-4">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="font-bold text-lg mb-2">Система аукциона</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Поднимите объявление выше, заплатив больше конкурентов
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="font-semibold">ТОП-1</span>
                    <span className="text-orange-600 font-bold">500 ₽/день</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="font-semibold">ТОП-3</span>
                    <span className="text-pink-600 font-bold">300 ₽/день</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="font-semibold">ТОП-5</span>
                    <span className="text-purple-600 font-bold">150 ₽/день</span>
                  </div>
                </div>
                <Button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Участвовать в аукционе
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}