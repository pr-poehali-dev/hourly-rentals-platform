import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface Listing {
  id: number;
  title: string;
  city: string;
  auction: number;
  type: string;
  image_url: string;
  district: string;
  subscription_expires_at: string | null;
  is_archived: boolean;
}

interface AuctionInfo {
  positions: Array<{
    position: number;
    base_price: number;
    current_bid: number | null;
    min_overbid: number | null;
    is_booked: boolean;
    booking_info?: {
      listing_id: number;
      listing_title: string;
      owner_id: number;
      paid_amount: number;
    };
  }>;
  total_positions: number;
  city: string;
}

interface Stats {
  stats: Array<{
    date: string;
    views: number;
    clicks: number;
    phone_clicks: number;
    telegram_clicks: number;
  }>;
  summary: {
    total_views: number;
    total_clicks: number;
    phone_clicks: number;
    telegram_clicks: number;
    ctr: number;
    period_days: number;
  };
}

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  balance_after: number;
  created_at: string;
  related_bid_id: number | null;
}

interface OwnerAuctionTabProps {
  listings: Listing[];
  selectedListing: Listing | null;
  auctionInfo: AuctionInfo | null;
  stats: Stats | null;
  transactions: Transaction[];
  timeUntilReset: string;
  isLoading: boolean;
  selectedPosition: number | null;
  onSelectListing: (listing: Listing) => void;
  onBookPosition: (position: number, offeredAmount: number) => Promise<void>;
}

export default function OwnerAuctionTab({
  listings,
  selectedListing,
  auctionInfo,
  stats,
  transactions,
  timeUntilReset,
  isLoading,
  selectedPosition,
  onSelectListing,
  onBookPosition,
}: OwnerAuctionTabProps) {
  const [bidAmounts, setBidAmounts] = useState<Record<number, string>>({});

  const handleBidChange = (position: number, value: string) => {
    setBidAmounts(prev => ({ ...prev, [position]: value }));
  };

  const handleBookClick = async (position: number) => {
    const amount = parseInt(bidAmounts[position] || '0');
    if (amount > 0) {
      await onBookPosition(position, amount);
      setBidAmounts(prev => ({ ...prev, [position]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <Label>Выберите отель для аукциона:</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            {listings.map((listing) => (
              <Button
                key={listing.id}
                variant={selectedListing?.id === listing.id ? 'default' : 'outline'}
                onClick={() => onSelectListing(listing)}
                className="justify-start h-auto py-3"
              >
                <div className="text-left">
                  <div className="font-semibold">{listing.title}</div>
                  <div className="text-xs opacity-70">{listing.city}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedListing ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>История операций</CardTitle>
                <CardDescription>Последние 50 транзакций</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Icon name="Receipt" size={48} className="mx-auto mb-2 opacity-20" />
                      <p>Операций пока нет</p>
                    </div>
                  ) : (
                    transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.type === 'deposit' ? 'bg-green-100' :
                            tx.type === 'bonus' ? 'bg-purple-100' :
                            'bg-red-100'
                          }`}>
                            <Icon
                              name={
                                tx.type === 'deposit' ? 'ArrowDownToLine' :
                                tx.type === 'bonus' ? 'Gift' :
                                'ArrowUpFromLine'
                              }
                              size={18}
                              className={
                                tx.type === 'deposit' ? 'text-green-600' :
                                tx.type === 'bonus' ? 'text-purple-600' :
                                'text-red-600'
                              }
                            />
                          </div>
                          <div>
                            <div className="font-medium">{tx.description}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(tx.created_at).toLocaleString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            tx.type === 'deposit' || tx.type === 'bonus' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {tx.type === 'deposit' || tx.type === 'bonus' ? '+' : '-'}{Math.abs(tx.amount)} ₽
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Баланс: {tx.balance_after} ₽
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Мои объекты</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    onClick={() => onSelectListing(listing)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedListing?.id === listing.id
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-semibold">{listing.title}</div>
                    <div className="text-sm text-muted-foreground">{listing.city}</div>
                    <Badge variant="outline" className="mt-2">
                      Позиция #{listing.auction || '—'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Бронирование позиций - {selectedListing.city}</CardTitle>
                <CardDescription>
                  Забронируйте позицию вашего отеля. Обновление в 00:00 МСК
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {auctionInfo && (
                  <>
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-purple-700">До обновления позиций</div>
                          <div className="text-xl font-bold text-purple-900">{timeUntilReset}</div>
                        </div>
                        <Icon name="Timer" size={32} className="text-purple-600" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {auctionInfo.positions.map((pos) => {
                        const isMyListing = pos.booking_info?.listing_id === selectedListing.id;
                        const minPrice = pos.min_overbid || pos.base_price;

                        return (
                          <div
                            key={pos.position}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              isMyListing
                                ? 'border-purple-600 bg-purple-50'
                                : pos.is_booked
                                ? 'border-gray-300 bg-gray-50'
                                : 'border-green-300 bg-green-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                                  isMyListing
                                    ? 'bg-purple-200 text-purple-900'
                                    : pos.is_booked
                                    ? 'bg-gray-200 text-gray-700'
                                    : 'bg-green-200 text-green-900'
                                }`}>
                                  #{pos.position}
                                </div>
                                <div>
                                  {pos.is_booked && pos.booking_info ? (
                                    <>
                                      <div className="font-semibold">{pos.booking_info.listing_title}</div>
                                      <div className="text-sm text-muted-foreground">
                                        Забронировано за {pos.booking_info.paid_amount} ₽
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="font-semibold text-green-700">Свободна</div>
                                      <div className="text-sm text-muted-foreground">
                                        Базовая цена: {pos.base_price} ₽
                                      </div>
                                    </>
                                  )}
                                  {isMyListing && (
                                    <Badge className="mt-1 bg-purple-600">Ваша позиция</Badge>
                                  )}
                                </div>
                              </div>

                              {!isMyListing && (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    placeholder={`мин. ${minPrice}`}
                                    value={bidAmounts[pos.position] || ''}
                                    onChange={(e) => handleBidChange(pos.position, e.target.value)}
                                    className="w-28"
                                    min={minPrice}
                                  />
                                  <Button
                                    onClick={() => handleBookClick(pos.position)}
                                    disabled={isLoading && selectedPosition === pos.position}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                  >
                                    {isLoading && selectedPosition === pos.position ? (
                                      <Icon name="Loader2" size={16} className="animate-spin" />
                                    ) : (
                                      'Забронировать'
                                    )}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Статистика просмотров</CardTitle>
                <CardDescription>Последние 7 дней</CardDescription>
              </CardHeader>
              <CardContent>
                {stats ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <Icon name="Eye" size={24} className="mx-auto mb-2 text-purple-600" />
                        <div className="text-2xl font-bold text-purple-600">{stats.summary.total_views}</div>
                        <div className="text-sm text-muted-foreground">Просмотров</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <Icon name="MousePointerClick" size={24} className="mx-auto mb-2 text-green-600" />
                        <div className="text-2xl font-bold text-green-600">{stats.summary.total_clicks}</div>
                        <div className="text-sm text-muted-foreground">Кликов</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <Icon name="Phone" size={24} className="mx-auto mb-2 text-orange-600" />
                        <div className="text-2xl font-bold text-orange-600">{stats.summary.phone_clicks}</div>
                        <div className="text-sm text-muted-foreground">Звонков</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Icon name="MessageCircle" size={24} className="mx-auto mb-2 text-blue-600" />
                        <div className="text-2xl font-bold text-blue-600">{stats.summary.telegram_clicks}</div>
                        <div className="text-sm text-muted-foreground">Telegram</div>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                      <div className="text-sm text-purple-700 mb-1">Конверсия (CTR)</div>
                      <div className="text-3xl font-bold text-purple-900">{stats.summary.ctr}%</div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Загрузка статистики...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Выберите отель в разделе "Мои объекты"</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
