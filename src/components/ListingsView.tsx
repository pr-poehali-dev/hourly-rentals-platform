import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import InteractiveMap from '@/components/InteractiveMap';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Listing = {
  id: number;
  title: string;
  type: string;
  city: string;
  district: string;
  price: number;
  auction: number;
  image_url: string;
  logo_url?: string;
  metro: string;
  metroWalk: number;
  hasParking: boolean;
  features: string[];
  lat: number;
  lng: number;
  minHours: number;
  rooms: { type: string; price: number }[];
  phone?: string;
  telegram?: string;
};

interface ListingsViewProps {
  filteredListings: Listing[];
  showMap: boolean;
  setShowMap: (value: boolean) => void;
  selectedListing: number | null;
  setSelectedListing: (id: number | null) => void;
  onCardClick: (listing: Listing) => void;
}

export default function ListingsView({
  filteredListings,
  showMap,
  setShowMap,
  selectedListing,
  setSelectedListing,
  onCardClick,
}: ListingsViewProps) {
  const [sortBy, setSortBy] = useState<string>('auction');
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState('');

  // Получаем первую фотографию из массива или строку
  const getFirstImage = (imageUrl: any) => {
    if (!imageUrl) return null;
    
    // Если это строка, пытаемся распарсить как JSON
    if (typeof imageUrl === 'string') {
      try {
        const parsed = JSON.parse(imageUrl);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0];
        }
      } catch {
        // Если не JSON, возвращаем как есть
        return imageUrl;
      }
    }
    
    // Если это уже массив
    if (Array.isArray(imageUrl) && imageUrl.length > 0) {
      return imageUrl[0];
    }
    
    return null;
  };

  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;

      case 'auction':
      default:
        if (a.city !== b.city) {
          return a.city.localeCompare(b.city);
        }
        return a.auction - b.auction;
    }
  });

  const getPositionInCity = (listing: Listing, index: number): number => {
    const sameCity = sortedListings.filter(l => l.city === listing.city);
    return sameCity.findIndex(l => l.id === listing.id) + 1;
  };

  const groupedByCity = sortedListings.reduce((acc, listing) => {
    if (!acc[listing.city]) {
      acc[listing.city] = [];
    }
    acc[listing.city].push(listing);
    return acc;
  }, {} as Record<string, Listing[]>);

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Доступные объекты</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Icon name="ArrowUpDown" size={18} className="text-purple-600" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auction">По позиции</SelectItem>
                <SelectItem value="price-asc">Цена: по возрастанию</SelectItem>
                <SelectItem value="price-desc">Цена: по убыванию</SelectItem>

              </SelectContent>
            </Select>
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

      {filteredListings.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-8xl mb-6">🔍</div>
          <h3 className="text-3xl font-bold mb-3 text-purple-600">Ничего не найдено</h3>
          <p className="text-muted-foreground text-lg mb-6">
            Попробуйте изменить параметры поиска или фильтры
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              Попробуйте выбрать другой город
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              Уберите часть фильтров
            </Badge>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              Измените тип объекта
            </Badge>
          </div>
        </div>
      ) : showMap ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
            {sortedListings.map((listing) => (
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
                    {getFirstImage(listing.image_url) ? (
                      <img src={getFirstImage(listing.image_url)!} alt={listing.title} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 rounded-lg flex items-center justify-center text-3xl">
                        🏨
                      </div>
                    )}
                    {getPositionInCity(listing, index) <= 3 && (
                      <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-xs">
                        ТОП-{getPositionInCity(listing, index)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold mb-1 truncate">{listing.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Icon name="MapPin" size={14} />
                      <span className="truncate">{listing.city}, {listing.district}</span>
                    </div>
                    <div className="text-lg font-bold text-purple-600">{listing.price} ₽<span className="text-xs font-normal">/час</span></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="sticky top-24 h-[700px]">
            <InteractiveMap 
              listings={sortedListings} 
              selectedId={selectedListing}
              onSelectListing={setSelectedListing}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedByCity).map(([city, cityListings]) => (
            <div key={city}>
              <div className="flex items-center gap-3 mb-6">
                <Icon name="MapPin" size={24} className="text-purple-600" />
                <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {city}
                </h3>
                <Badge variant="outline" className="text-base px-3 py-1">
                  {cityListings.length} {cityListings.length === 1 ? 'объект' : cityListings.length < 5 ? 'объекта' : 'объектов'}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cityListings.map((listing, index) => (
          <Card 
            key={listing.id} 
            className="group overflow-hidden cursor-pointer border-2 border-purple-100 hover:border-purple-300 transition-all animate-fade-in hover:shadow-xl flex flex-col" 
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => onCardClick(listing)}
          >
            <div className="relative overflow-hidden">
              {getFirstImage(listing.image_url) ? (
                <img src={getFirstImage(listing.image_url)!} alt={listing.title} className="h-48 w-full object-cover group-hover:scale-110 transition-transform duration-300" />
              ) : (
                <div className="h-48 bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-300">
                  🏨
                </div>
              )}
              {getPositionInCity(listing, index) <= 3 && (
                <Badge className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold">
                  <Icon name="Trophy" size={14} className="mr-1" />
                  ТОП-{getPositionInCity(listing, index)}
                </Badge>
              )}
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold">
                🎯 {listing.city}: #{getPositionInCity(listing, index)}
              </div>
            </div>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="group/title">
                    <h4 className="font-bold text-lg mb-1 group-hover/title:text-purple-600 transition-colors">{listing.title}</h4>
                    <div className="text-xs text-muted-foreground opacity-0 group-hover/title:opacity-100 translate-y-1 group-hover/title:translate-y-0 transition-all duration-300">
                      Посмотреть все предложения отеля
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="MapPin" size={14} />
                    <span>{listing.city}, {listing.district}</span>
                  </div>
                  {listing.metro_stations && listing.metro_stations.length > 0 ? (
                    <div className="flex flex-col gap-1 mt-1">
                      {listing.metro_stations.map((station: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="text-blue-600">Ⓜ️</span>
                          <span>{station.station_name}</span>
                          <Icon name="PersonStanding" size={14} className="ml-1" />
                          <span>{station.walk_minutes} мин</span>
                        </div>
                      ))}
                    </div>
                  ) : listing.metro !== '-' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span className="text-blue-600">Ⓜ️</span>
                      <span>{listing.metro}</span>
                      <Icon name="PersonStanding" size={14} className="ml-1" />
                      <span>{listing.metroWalk} мин</span>
                    </div>
                  )}
                  {listing.hasParking && (
                    <div className="flex items-center gap-1 text-sm text-green-600 font-semibold mt-1">
                      <Icon name="Car" size={14} />
                      <span>Парковка</span>
                    </div>
                  )}
                </div>
                {listing.logo_url && (
                  <div className="flex-shrink-0 w-16 h-16 border rounded-lg bg-white p-1 flex items-center justify-center">
                    <img src={listing.logo_url} alt={`${listing.title} logo`} className="max-w-full max-h-full object-contain" />
                  </div>
                )}
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
              <div className="flex-1"></div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-muted-foreground">от</div>
                  <div className="text-2xl font-bold text-purple-600">{listing.price} ₽</div>
                  <div className="text-xs text-muted-foreground">за час</div>
                </div>
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold">
                  от {listing.minHours}ч
                </Badge>
              </div>
              <div className="flex gap-2">
                {listing.phone && (
                  <Button 
                    onClick={() => {
                      setSelectedPhone(listing.phone!);
                      setPhoneModalOpen(true);
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Icon name="Phone" size={16} className="mr-1" />
                    Позвонить
                  </Button>
                )}
                {listing.telegram && (
                  <Button 
                    asChild
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    <a href={listing.telegram.startsWith('http') ? listing.telegram : `https://t.me/${listing.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                      <Icon name="Send" size={16} className="mr-1" />
                      Telegram
                    </a>
                  </Button>
                )}
                {!listing.phone && !listing.telegram && (
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Подробнее
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={phoneModalOpen} onOpenChange={setPhoneModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Номер телефона</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-6 text-center">
              <Icon name="Phone" size={48} className="mx-auto mb-3 text-purple-600" />
              <a href={`tel:${selectedPhone}`} className="text-3xl font-bold text-purple-600 hover:text-purple-700 transition-colors">
                {selectedPhone}
              </a>
            </div>
            <Button 
              asChild
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-6"
            >
              <a href={`tel:${selectedPhone}`}>
                <Icon name="Phone" size={20} className="mr-2" />
                Позвонить сейчас
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}