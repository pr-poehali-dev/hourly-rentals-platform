import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

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
  features?: string[];
  lat: number;
  lng: number;
  minHours: number;
  rooms: { type: string; price: number }[];
  phone?: string;
  telegram?: string;
};

interface ListingCardProps {
  listing: Listing;
  showPosition?: boolean;
  position?: number;
  onCardClick: (listing: Listing) => void;
  onPhoneClick?: (phone: string, e: React.MouseEvent) => void;
}

const getFirstImage = (imageUrl: any) => {
  if (!imageUrl) return null;
  
  if (typeof imageUrl === 'string') {
    try {
      const parsed = JSON.parse(imageUrl);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      }
    } catch {
      return imageUrl;
    }
  }
  
  if (Array.isArray(imageUrl) && imageUrl.length > 0) {
    return imageUrl[0];
  }
  
  return null;
};

export default function ListingCard({ 
  listing, 
  showPosition = true, 
  position = 0,
  onCardClick,
  onPhoneClick 
}: ListingCardProps) {
  const isTopThree = position <= 3;

  return (
    <Card 
      className="overflow-hidden cursor-pointer border-2 border-purple-100 hover:border-purple-300 transition-all hover:shadow-xl group"
      onClick={() => onCardClick(listing)}
    >
      <div className="relative">
        {getFirstImage(listing.image_url) ? (
          <img 
            src={getFirstImage(listing.image_url)!} 
            alt={listing.title} 
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center text-6xl">
            🏨
          </div>
        )}
        {showPosition && isTopThree && position > 0 && (
          <Badge className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold shadow-lg">
            ТОП-{position}
          </Badge>
        )}
        {listing.logo_url && (
          <div className="absolute top-3 left-3 w-12 h-12 bg-white rounded-full shadow-lg overflow-hidden border-2 border-white">
            <img src={listing.logo_url} alt="logo" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h4 className="font-bold text-lg line-clamp-2 flex-1">{listing.title}</h4>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Icon name="MapPin" size={14} />
          <span className="truncate">{listing.city}, {listing.district}</span>
        </div>

        {listing.metro && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span className="text-blue-600">Ⓜ️</span>
            <span>{listing.metro}</span>
            <span className="text-xs">• {listing.metroWalk} мин</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          {listing.hasParking && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              <Icon name="Car" size={12} className="mr-1" />
              Парковка
            </Badge>
          )}
          {listing.features && listing.features.slice(0, 2).map((feature, idx) => (
            <Badge key={idx} variant="secondary">{feature}</Badge>
          ))}
        </div>

        <div className="border-t pt-3 mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-600">
              {listing.price.toLocaleString('ru-RU')} ₽
            </span>
            <span className="text-sm text-muted-foreground">
              / {listing.minHours}ч
            </span>
          </div>
          
          {listing.rooms && listing.rooms.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {listing.rooms.slice(0, 3).map((room, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {room.type}: {room.price.toLocaleString('ru-RU')} ₽
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {listing.phone && onPhoneClick && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => onPhoneClick(listing.phone!, e)}
            >
              <Icon name="Phone" size={14} className="mr-1" />
              Позвонить
            </Button>
          )}
          {listing.telegram && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://t.me/${listing.telegram.replace('@', '')}`, '_blank');
              }}
            >
              <Icon name="Send" size={14} className="mr-1" />
              Telegram
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}