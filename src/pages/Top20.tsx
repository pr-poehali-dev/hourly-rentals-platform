import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';

interface Top20Listing {
  listing_id: number;
  listing_title: string;
  image_url: string;
  district: string;
  type: string;
  price: number;
  square_meters: number;
  features: string[];
  metro?: string;
  metro_walk?: number;
  has_parking: boolean;
  logo_url?: string;
  owner_name: string;
  position: number;
  expires_at: string;
}

const CITIES = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород'];

export default function Top20() {
  const [selectedCity, setSelectedCity] = useState('Москва');
  const [listings, setListings] = useState<Top20Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cityParam = params.get('city');
    if (cityParam && CITIES.includes(cityParam)) {
      setSelectedCity(cityParam);
    }
  }, []);

  useEffect(() => {
    loadTop20Listings(selectedCity);
  }, [selectedCity]);

  const loadTop20Listings = async (city: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://functions.poehali.dev/3a7d0c03-532a-459f-9580-a416ebac4e41?city=${encodeURIComponent(city)}`
      );
      const data = await response.json();
      
      const bookedListings = data.positions
        .filter((pos: any) => pos.is_booked && pos.booking_info)
        .map((pos: any) => ({
          ...pos.booking_info,
          position: pos.position,
        }));
      
      setListings(bookedListings);
    } catch (error) {
      console.error('Failed to load TOP-20 listings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleListingClick = (listingId: number) => {
    navigate(`/listing/${listingId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <Icon name="Crown" size={48} className="text-yellow-500" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                ТОП-20
              </h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Лучшие объекты с премиальным размещением
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Выберите город</CardTitle>
              <CardDescription>
                ТОП-20 объектов с гарантированным размещением на месяц
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {CITIES.map((city) => (
                  <Button
                    key={city}
                    variant={selectedCity === city ? 'default' : 'outline'}
                    onClick={() => setSelectedCity(city)}
                    className="h-auto py-3"
                  >
                    {city}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Icon name="Loader2" size={48} className="animate-spin text-purple-600" />
            </div>
          ) : listings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Icon name="Building2" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg text-muted-foreground">
                  В ТОП-20 для города {selectedCity} пока нет объектов
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <Card
                  key={listing.listing_id}
                  className="cursor-pointer hover:shadow-xl transition-all border-2 border-yellow-300 bg-gradient-to-br from-white to-yellow-50"
                  onClick={() => handleListingClick(listing.listing_id)}
                >
                  <div className="relative">
                    <img
                      src={listing.image_url || '/placeholder-hotel.jpg'}
                      alt={listing.listing_title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <Badge className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-lg px-3 py-1">
                      <Icon name="Crown" size={16} className="mr-1" />
                      #{listing.position}
                    </Badge>
                    {listing.logo_url && (
                      <img
                        src={listing.logo_url}
                        alt="Логотип"
                        className="absolute top-3 right-3 w-12 h-12 rounded-full bg-white border-2 border-white shadow-lg object-cover"
                      />
                    )}
                  </div>

                  <CardHeader>
                    <CardTitle className="text-xl">{listing.listing_title}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-1 text-sm">
                        <Icon name="MapPin" size={14} />
                        {listing.district}
                      </div>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{listing.type}</span>
                      <Badge variant="outline">{listing.square_meters} м²</Badge>
                    </div>

                    {listing.metro && (
                      <div className="flex items-center gap-2 text-sm">
                        <Icon name="Train" size={14} className="text-purple-600" />
                        <span>{listing.metro}</span>
                        {listing.metro_walk && (
                          <span className="text-muted-foreground">• {listing.metro_walk} мин</span>
                        )}
                      </div>
                    )}

                    <div className="text-2xl font-bold text-purple-600">
                      от {listing.price} ₽<span className="text-sm font-normal text-muted-foreground">/час</span>
                    </div>

                    {listing.features && listing.features.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {listing.features.slice(0, 3).map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {listing.has_parking && (
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <Icon name="ParkingCircle" size={14} />
                        Парковка
                      </div>
                    )}

                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      В ТОП-20 до {new Date(listing.expires_at).toLocaleDateString('ru-RU')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
