import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Listing {
  id: number;
  title: string;
  city: string;
  subscription_expires_at: string | null;
}

interface Top20Position {
  position: number;
  price: number;
  is_booked: boolean;
  booking_info?: {
    listing_id: number;
    listing_title: string;
    expires_at: string;
  } | null;
}

interface OwnerTop20TabProps {
  listings: Listing[];
  selectedListing: Listing | null;
  onSelectListing: (listing: Listing) => void;
  token: string;
  ownerId: number;
  onBalanceUpdate: () => void;
}

export default function OwnerTop20Tab({
  listings,
  selectedListing,
  onSelectListing,
  token,
  ownerId,
  onBalanceUpdate,
}: OwnerTop20TabProps) {
  const [positions, setPositions] = useState<Top20Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedListing) {
      loadTop20Positions(selectedListing.city);
    }
  }, [selectedListing]);

  const loadTop20Positions = async (city: string) => {
    try {
      const response = await fetch(
        `https://functions.poehali.dev/3a7d0c03-532a-459f-9580-a416ebac4e41?city=${encodeURIComponent(city)}`
      );
      const data = await response.json();
      setPositions(data.positions || []);
    } catch (error) {
      console.error('Failed to load TOP-20 positions:', error);
    }
  };

  const handleBookPosition = async (position: number, price: number) => {
    if (!selectedListing) return;

    const daysLeft = selectedListing.subscription_expires_at
      ? Math.floor((new Date(selectedListing.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;

    if (daysLeft < 30) {
      toast({
        title: 'Недостаточно времени подписки',
        description: `У вас осталось ${daysLeft} дней подписки. Для покупки ТОП-20 нужно минимум 30 дней активной подписки.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setSelectedPosition(position);

    try {
      const response = await fetch('https://functions.poehali.dev/3a7d0c03-532a-459f-9580-a416ebac4e41', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'book_position',
          city: selectedListing.city,
          position: position,
          listing_id: selectedListing.id,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Успешно!',
        description: data.message,
      });

      onBalanceUpdate();
      loadTop20Positions(selectedListing.city);
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось забронировать позицию',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setSelectedPosition(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Crown" size={24} className="text-yellow-500" />
            ТОП-20 - Премиальное размещение
          </CardTitle>
          <CardDescription>
            Гарантированная позиция на 30 дней без возможности перебивания в аукционе
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Icon name="Info" size={18} />
            <AlertDescription>
              <div className="space-y-2 text-sm">
                <p><strong>Преимущества ТОП-20:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Гарантированная позиция на 30 дней</li>
                  <li>Другие владельцы не могут перебить вашу ставку</li>
                  <li>Ваш объект отображается в специальном разделе "ТОП-20"</li>
                  <li>Повышенная видимость и больше обращений клиентов</li>
                  <li>Фиксированная цена - никаких доплат или перебиваний</li>
                </ul>
                <p className="mt-3 text-orange-700 font-medium">
                  <Icon name="AlertTriangle" size={14} className="inline mr-1" />
                  Важно: убедитесь, что подписка активна минимум на 30 дней. При меньшем сроке покупка ТОП-20 недоступна.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          <div>
            <label className="text-sm font-medium mb-3 block">Выберите объект:</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {listings.map((listing) => {
                const daysLeft = listing.subscription_expires_at
                  ? Math.floor((new Date(listing.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : 0;
                const hasEnoughDays = daysLeft >= 30;

                return (
                  <Button
                    key={listing.id}
                    variant={selectedListing?.id === listing.id ? 'default' : 'outline'}
                    onClick={() => onSelectListing(listing)}
                    className="justify-start h-auto py-3"
                    disabled={!hasEnoughDays}
                  >
                    <div className="text-left w-full">
                      <div className="font-semibold">{listing.title}</div>
                      <div className="text-xs opacity-70">{listing.city}</div>
                      {!hasEnoughDays && (
                        <Badge variant="destructive" className="mt-1 text-[10px]">
                          Подписка &lt; 30 дней
                        </Badge>
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedListing && (
        <Card>
          <CardHeader>
            <CardTitle>Доступные позиции - {selectedListing.city}</CardTitle>
            <CardDescription>
              Выберите позицию для вашего объекта "{selectedListing.title}"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {positions.map((pos) => {
                const isMyBooking = pos.booking_info?.listing_id === selectedListing.id;

                return (
                  <div
                    key={pos.position}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isMyBooking
                        ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50'
                        : pos.is_booked
                        ? 'border-gray-200 bg-gray-50/50'
                        : 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 hover:border-yellow-400 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                            isMyBooking
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                              : pos.is_booked
                              ? 'bg-gray-300 text-gray-600'
                              : 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white'
                          }`}
                        >
                          {pos.position}
                        </div>
                        <div>
                          {pos.is_booked && pos.booking_info ? (
                            <>
                              <div className="font-semibold text-sm">
                                {pos.booking_info.listing_title}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                До {new Date(pos.booking_info.expires_at).toLocaleDateString('ru-RU')}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-bold text-lg text-yellow-700">
                                {pos.price} ₽
                              </div>
                              <div className="text-xs text-muted-foreground">на 30 дней</div>
                            </>
                          )}
                          {isMyBooking && (
                            <Badge className="mt-1 bg-purple-600">
                              <Icon name="Crown" size={10} className="mr-1" />
                              Ваша позиция
                            </Badge>
                          )}
                        </div>
                      </div>

                      {!isMyBooking && !pos.is_booked && (
                        <Button
                          onClick={() => handleBookPosition(pos.position, pos.price)}
                          disabled={isLoading && selectedPosition === pos.position}
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                        >
                          {isLoading && selectedPosition === pos.position ? (
                            <Icon name="Loader2" size={16} className="animate-spin" />
                          ) : (
                            <>
                              <Icon name="ShoppingCart" size={16} className="mr-2" />
                              Купить
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
