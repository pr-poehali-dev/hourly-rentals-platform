import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import ListingCard from '@/components/ListingCard';

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

interface CityCarouselProps {
  city: string;
  cityListings: Listing[];
  onCardClick: (listing: Listing) => void;
  onPhoneClick: (phone: string, e: React.MouseEvent) => void;
  getPositionInCity: (listing: Listing) => number;
}

export default function CityCarousel({ 
  city, 
  cityListings, 
  onCardClick, 
  onPhoneClick,
  getPositionInCity 
}: CityCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const topListings = cityListings.slice(0, 5);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 340;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Icon name="MapPin" size={24} className="text-purple-600 flex-shrink-0" />
        <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {city}
        </h3>
        <Badge variant="outline" className="text-base px-3 py-1">
          {cityListings.length}
        </Badge>
      </div>

      <div className="relative group">
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('left')}
        >
          <Icon name="ChevronLeft" size={24} />
        </Button>

        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide scroll-smooth"
        >
          {topListings.map((listing) => (
            <div key={listing.id} className="flex-shrink-0 w-[320px] snap-start">
              <ListingCard 
                listing={listing} 
                onCardClick={onCardClick}
                onPhoneClick={onPhoneClick}
                position={getPositionInCity(listing)}
              />
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll('right')}
        >
          <Icon name="ChevronRight" size={24} />
        </Button>
      </div>

      {cityListings.length > 5 && (
        <div className="text-center mt-4">
          <Button 
            variant="outline" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-purple-600 hover:text-purple-700"
          >
            Показать все {cityListings.length} объектов в {city}
            <Icon name="ChevronUp" size={16} className="ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
