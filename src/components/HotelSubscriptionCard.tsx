import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface HotelSubscriptionCardProps {
  listing: {
    id: number;
    title: string;
    city: string;
    district: string;
    type: string;
    image_url: string;
    subscription_expires_at: string | null;
    is_archived: boolean;
    auction: number;
    moderation_status?: string;
    moderation_comment?: string;
  };
  subscriptionInfo: {
    days_left: number | null;
    price_per_month: number;
    prices: {
      '30_days': number;
      '90_days': number;
    };
  } | null;
  onExtend: (listingId: number, days: number) => void;
  onEdit?: (listing: any) => void;
  isLoading: boolean;
}

export default function HotelSubscriptionCard({ listing, subscriptionInfo, onExtend, onEdit, isLoading }: HotelSubscriptionCardProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!listing.subscription_expires_at) {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const expiresAt = new Date(listing.subscription_expires_at!);
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Истекла');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}д ${hours}ч ${minutes}м`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}ч ${minutes}м ${seconds}с`);
      } else {
        setTimeLeft(`${minutes}м ${seconds}с`);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000); // Обновление каждую секунду

    return () => clearInterval(timer);
  }, [listing.subscription_expires_at]);

  const daysLeft = subscriptionInfo?.days_left ?? null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
  const isExpired = daysLeft === 0 || listing.is_archived;

  return (
    <Card className={`overflow-hidden ${isExpired ? 'opacity-60' : ''}`}>
      <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100">
        {listing.image_url ? (
          <img 
            src={listing.image_url} 
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-4xl">
            🏨
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          {listing.moderation_status === 'pending' ? (
            <Badge className="bg-orange-500">
              На проверке
            </Badge>
          ) : listing.moderation_status === 'rejected' ? (
            <Badge variant="destructive" className="bg-red-600">
              Отклонено
            </Badge>
          ) : isExpired ? (
            <Badge variant="destructive" className="bg-red-600">
              Неактивно
            </Badge>
          ) : isExpiringSoon ? (
            <Badge className="bg-orange-500">
              Заканчивается
            </Badge>
          ) : (
            <Badge className="bg-green-600">
              Активно
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-lg">{listing.title}</h3>
          <p className="text-sm text-muted-foreground">{listing.city}, {listing.district}</p>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {listing.type === 'hotel' ? 'Отель' : 'Апартаменты'}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Позиция #{listing.auction || '—'}
            </Badge>
          </div>
        </div>

        {daysLeft !== null && !isExpired && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="Clock" size={18} className="text-purple-600" />
                <span className="text-sm font-medium">Осталось:</span>
              </div>
              <div className={`text-right ${isExpiringSoon ? 'text-orange-600' : 'text-purple-600'}`}>
                <div className="font-bold">{timeLeft}</div>
                <div className="text-xs text-muted-foreground">{daysLeft} дней</div>
              </div>
            </div>
          </div>
        )}

        {subscriptionInfo && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                onClick={() => onExtend(listing.id, 30)}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isLoading ? (
                  <Icon name="Loader2" size={14} className="animate-spin" />
                ) : (
                  <>
                    <Icon name="Plus" size={14} className="mr-1" />
                    30 дней
                  </>
                )}
              </Button>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Стоимость</div>
                <div className="font-bold text-sm">{subscriptionInfo.prices['30_days']} ₽</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onExtend(listing.id, 90)}
                disabled={isLoading}
                className="border-2 border-purple-300 hover:bg-purple-50"
              >
                {isLoading ? (
                  <Icon name="Loader2" size={14} className="animate-spin" />
                ) : (
                  <>
                    <Icon name="Sparkles" size={14} className="mr-1" />
                    90 дней
                  </>
                )}
              </Button>
              <div className="text-right">
                <div className="text-xs text-green-600 font-medium">Скидка 15%</div>
                <div className="font-bold text-sm">{subscriptionInfo.prices['90_days']} ₽</div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
              <Icon name="Info" size={12} className="inline mr-1" />
              {isExpired ? 
                'При оплате объект снова станет активным на 30 дней' :
                'Время накапливается, можно продлить заранее'
              }
            </div>
          </div>
        )}

        {listing.moderation_status === 'pending' && (
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon name="Clock" size={18} className="text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-900">
                <p className="font-medium">Объект на проверке</p>
                <p className="text-orange-700">Ожидает одобрения модератора</p>
              </div>
            </div>
          </div>
        )}

        {listing.moderation_status === 'rejected' && listing.moderation_comment && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon name="AlertCircle" size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-900">
                <p className="font-medium">Объект отклонён</p>
                <p className="text-red-700 mt-1">
                  <strong>Комментарий модератора:</strong><br />
                  {listing.moderation_comment}
                </p>
              </div>
            </div>
          </div>
        )}

        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(listing)}
            className="w-full mt-2"
          >
            <Icon name="Edit" size={14} className="mr-2" />
            {listing.moderation_status === 'rejected' ? 'Исправить и отправить повторно' : 'Редактировать объект'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}