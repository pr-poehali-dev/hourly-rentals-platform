import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import InteractiveMap from '@/components/InteractiveMap';

type Listing = {
  id: number;
  title: string;
  type: string;
  city: string;
  district: string;
  price: number;
  rating: number;
  reviews: number;
  auction: number;
  image: string;
  metro: string;
  features: string[];
  lat: number;
  lng: number;
  minHours: number;
  rooms: { type: string; price: number }[];
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
  return (
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
            {filteredListings.map((listing) => (
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
            onClick={() => onCardClick(listing)}
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
  );
}
