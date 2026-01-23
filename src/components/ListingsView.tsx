import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import ListingCard from '@/components/ListingCard';
import CityCarousel from '@/components/CityCarousel';
import MapView from '@/components/MapView';
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
  selectedCity: string;
  showMap: boolean;
  selectedListing: number | null;
  onListingSelect: (id: number | null) => void;
  onToggleMap: () => void;
  onCardClick: (listing: Listing) => void;
  isLoading?: boolean;
}

export default function ListingsView({
  filteredListings,
  selectedCity,
  showMap,
  selectedListing,
  onListingSelect,
  onToggleMap,
  onCardClick,
  isLoading = false,
}: ListingsViewProps) {
  const [sortBy, setSortBy] = useState<string>('auction');
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 30;

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

  const groupedByCity = sortedListings.reduce((acc, listing) => {
    if (!acc[listing.city]) {
      acc[listing.city] = [];
    }
    acc[listing.city].push(listing);
    return acc;
  }, {} as Record<string, Listing[]>);

  const getPositionInCity = (listing: Listing): number => {
    const sameCity = groupedByCity[listing.city] || [];
    return sameCity.findIndex(l => l.id === listing.id) + 1;
  };

  const handlePhoneClick = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhone(phone);
    setPhoneModalOpen(true);
  };

  const showCityCarousels = selectedCity === 'Все города';

  const totalPages = Math.ceil(sortedListings.length / ITEMS_PER_PAGE);
  const paginatedListings = sortedListings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (showMap) {
    return (
      <MapView
        listings={filteredListings}
        selectedListing={selectedListing}
        onListingSelect={onListingSelect}
        onToggleMap={onToggleMap}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mb-4"></div>
        <p className="text-gray-500">Загрузка объектов...</p>
      </div>
    );
  }

  if (sortedListings.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-2xl font-bold mb-2">Ничего не найдено</h3>
        <p className="text-muted-foreground">Попробуйте изменить параметры поиска</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Icon name="Building2" size={18} className="mr-2" />
            {sortedListings.length} объектов
          </Badge>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auction">По рейтингу</SelectItem>
              <SelectItem value="price-asc">Цена: по возрастанию</SelectItem>
              <SelectItem value="price-desc">Цена: по убыванию</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            onClick={onToggleMap}
            className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100"
          >
            <Icon name="Map" size={18} className="mr-2" />
            Показать на карте
          </Button>
        </div>
      </div>

      {showCityCarousels ? (
        <div className="space-y-12">
          {Object.entries(groupedByCity).map(([city, cityListings]) => (
            <CityCarousel 
              key={city} 
              city={city} 
              cityListings={cityListings}
              onCardClick={onCardClick}
              onPhoneClick={handlePhoneClick}
              getPositionInCity={getPositionInCity}
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                position={getPositionInCity(listing)}
                onCardClick={onCardClick}
                onPhoneClick={handlePhoneClick}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <Icon name="ChevronLeft" size={18} />
                Назад
              </Button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Вперёд
                <Icon name="ChevronRight" size={18} />
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={phoneModalOpen} onOpenChange={setPhoneModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Номер телефона</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg text-center">
              <a 
                href={`tel:${selectedPhone}`}
                className="text-2xl font-bold text-purple-600 hover:text-purple-700"
              >
                {selectedPhone}
              </a>
            </div>
            <Button 
              className="w-full" 
              onClick={() => window.location.href = `tel:${selectedPhone}`}
            >
              <Icon name="Phone" size={18} className="mr-2" />
              Позвонить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
