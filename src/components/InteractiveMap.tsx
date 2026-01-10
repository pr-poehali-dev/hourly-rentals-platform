import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Listing {
  id: number;
  title: string;
  city: string;
  price: number;
  auction: number;
  lat: number;
  lng: number;
  rating: number;
}

interface InteractiveMapProps {
  listings: Listing[];
  selectedId: number | null;
  onSelectListing: (id: number) => void;
}

export default function InteractiveMap({ listings, selectedId, onSelectListing }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=&lang=ru_RU`;
    script.async = true;
    script.onload = initMap;
    document.head.appendChild(script);

    function initMap() {
      const ymaps = (window as any).ymaps;
      if (!ymaps) return;

      ymaps.ready(() => {
        const bounds = listings.map(l => [l.lat, l.lng]);
        const map = new ymaps.Map(mapRef.current, {
          center: bounds.length ? bounds[0] : [55.75, 37.62],
          zoom: 5,
          controls: ['zoomControl', 'fullscreenControl']
        });

        listings.forEach((listing) => {
          const placemark = new ymaps.Placemark(
            [listing.lat, listing.lng],
            {
              balloonContentHeader: `<strong>${listing.title}</strong>`,
              balloonContentBody: `
                <div style="padding: 8px;">
                  <p style="margin: 4px 0;">📍 ${listing.city}</p>
                  <p style="margin: 4px 0;">💰 <strong>${listing.price} ₽</strong> / час</p>
                  <p style="margin: 4px 0;">⭐ ${listing.rating}</p>
                  ${listing.auction <= 3 ? `<p style="margin: 4px 0; color: #f97316;"><strong>🏆 ТОП-${listing.auction}</strong></p>` : ''}
                </div>
              `,
              hintContent: listing.title
            },
            {
              preset: listing.auction <= 3 ? 'islands#redIcon' : 'islands#violetIcon',
              iconColor: listing.id === selectedId ? '#F97316' : (listing.auction <= 3 ? '#D946EF' : '#8B5CF6')
            }
          );

          placemark.events.add('click', () => {
            onSelectListing(listing.id);
          });

          map.geoObjects.add(placemark);
        });

        if (bounds.length > 1) {
          map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 50 });
        }
      });
    }

    return () => {
      script.remove();
    };
  }, [listings, selectedId, onSelectListing]);

  return (
    <Card className="h-full overflow-hidden border-2 border-purple-200">
      <div className="relative w-full h-full">
        <div ref={mapRef} className="w-full h-full" />
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 max-w-[200px]">
          <div className="text-xs font-semibold mb-2">Легенда карты:</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500"></div>
              <span>ТОП-1/2/3</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-600"></div>
              <span>Обычные</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Выбранный</span>
            </div>
          </div>
        </div>
        {listings.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="text-center p-8">
              <div className="text-4xl mb-3">🗺️</div>
              <p className="text-muted-foreground">Нет объектов для отображения</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
