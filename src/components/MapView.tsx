import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import InteractiveMap from '@/components/InteractiveMap';

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

interface MapViewProps {
  listings: Listing[];
  selectedListing: number | null;
  onListingSelect: (id: number | null) => void;
  onToggleMap: () => void;
}

export default function MapView({ 
  listings, 
  selectedListing, 
  onListingSelect, 
  onToggleMap 
}: MapViewProps) {
  return (
    <div className="relative h-[600px] rounded-xl overflow-hidden border-2 border-purple-200 shadow-xl">
      <InteractiveMap
        locations={listings.map(l => ({
          id: l.id,
          lat: l.lat,
          lng: l.lng,
          title: l.title,
          price: l.price,
        }))}
        selectedId={selectedListing}
        onMarkerClick={onListingSelect}
      />
      <Button
        variant="secondary"
        className="absolute top-4 right-4 z-[1000] bg-white hover:bg-gray-100 shadow-lg"
        onClick={onToggleMap}
      >
        <Icon name="List" size={18} className="mr-2" />
        Показать список
      </Button>
    </div>
  );
}
