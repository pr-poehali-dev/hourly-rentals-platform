import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface Owner {
  id: number;
  email: string;
  full_name: string;
  balance: number;
  bonus_balance: number;
  phone?: string;
}

interface Listing {
  id: number;
  title: string;
  city: string;
  auction: number;
}

interface AuctionInfo {
  positions: Array<{
    position: number;
    price: number;
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

export default function OwnerDashboard() {
  const [owner, setOwner] = useState<Owner | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [auctionInfo, setAuctionInfo] = useState<AuctionInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTopupLoading, setIsTopupLoading] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = localStorage.getItem('ownerToken');
  const ownerId = localStorage.getItem('ownerId');

  useEffect(() => {
    console.log('Dashboard loaded. Token:', token ? 'exists' : 'missing', 'OwnerId:', ownerId);
    
    if (!token || !ownerId) {
      console.log('Missing credentials, redirecting to login');
      navigate('/owner/login');
      return;
    }

    const ownerData = localStorage.getItem('ownerData');
    if (ownerData) {
      setOwner(JSON.parse(ownerData));
    }

    loadOwnerListings();
    loadTransactions();

    const updateTimer = () => {
      const now = new Date();
      const moscowTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
      const tomorrow = new Date(moscowTime);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - moscowTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeUntilReset(`${hours}ч ${minutes}м ${seconds}с`);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [token, ownerId, navigate]);

  const loadOwnerListings = async () => {
    try {
      console.log('Loading listings for owner:', ownerId);
      const ownerListings = await api.getOwnerListings(token!, parseInt(ownerId!));
      console.log('Received listings:', ownerListings);
      setListings(ownerListings);

      if (ownerListings.length > 0) {
        setSelectedListing(ownerListings[0]);
        loadAuctionInfo(ownerListings[0].city);
        loadStats(ownerListings[0].id);
      }
    } catch (error) {
      console.error('Failed to load listings:', error);
    }
  };

  const loadAuctionInfo = async (city: string) => {
    try {
      const info = await api.getAuctionInfo(city);
      setAuctionInfo(info);
    } catch (error) {
      console.error('Failed to load auction info:', error);
    }
  };

  const loadStats = async (listingId: number) => {
    try {
      const statistics = await api.getStatistics(listingId, 7);
      setStats(statistics);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await api.getOwnerTransactions(token!, parseInt(ownerId!), 50);
      setTransactions(response.transactions || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const handleListingSelect = (listing: Listing) => {
    setSelectedListing(listing);
    loadAuctionInfo(listing.city);
    loadStats(listing.id);
  };

  const handleBookPosition = async (position: number, price: number) => {
    if (!selectedListing) return;

    const totalBalance = (owner?.balance || 0) + (owner?.bonus_balance || 0);

    if (price > totalBalance) {
      toast({
        title: 'Недостаточно средств',
        description: `Нужно ${price} ₽, у вас ${totalBalance} ₽`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setSelectedPosition(position);

    try {
      const response = await api.placeBid(
        token!,
        parseInt(ownerId!),
        selectedListing.id,
        selectedListing.city,
        position
      );

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: 'Успешно!',
        description: response.message,
      });

      const updatedOwnerData = {
        ...owner!,
        balance: Math.max(0, owner!.balance - (price - Math.min(owner!.bonus_balance, price))),
        bonus_balance: Math.max(0, owner!.bonus_balance - Math.min(owner!.bonus_balance, price))
      };
      setOwner(updatedOwnerData);
      localStorage.setItem('ownerData', JSON.stringify(updatedOwnerData));

      loadOwnerListings();
      loadAuctionInfo(selectedListing.city);
      loadTransactions();
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

  const handleTopup = async () => {
    const amount = parseInt(topupAmount);
    if (!amount || amount < 100) {
      toast({
        title: 'Ошибка',
        description: 'Минимальная сумма пополнения: 100 ₽',
        variant: 'destructive',
      });
      return;
    }

    setIsTopupLoading(true);

    try {
      const response = await api.createPayment(parseInt(ownerId!), amount);

      if (response.error) {
        throw new Error(response.error);
      }

      window.location.href = response.confirmation_url;
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось создать платёж',
        variant: 'destructive',
      });
      setIsTopupLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ownerToken');
    localStorage.removeItem('ownerId');
    localStorage.removeItem('ownerData');
    navigate('/owner/login');
  };

  if (!owner) {
    return <div className="min-h-screen flex items-center justify-center">
      <Icon name="Loader2" size={48} className="animate-spin text-purple-600" />
    </div>;
  }

  const totalBalance = owner.balance + owner.bonus_balance;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-purple-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">⏰</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Личный кабинет
                </h1>
                <p className="text-xs text-muted-foreground">{owner.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Card className="px-4 py-3">
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Баланс</div>
                    <div className="text-xl font-bold text-purple-600">
                      {totalBalance} ₽
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {owner.balance} ₽ + {owner.bonus_balance} бонусных
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Сумма"
                        value={topupAmount}
                        onChange={(e) => setTopupAmount(e.target.value)}
                        className="w-28"
                        min="100"
                      />
                      <Button
                        onClick={handleTopup}
                        disabled={isTopupLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isTopupLoading ? (
                          <Icon name="Loader2" size={16} className="animate-spin" />
                        ) : (
                          <>
                            <Icon name="Wallet" size={16} className="mr-1" />
                            Пополнить
                          </>
                        )}
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground text-center">мин. 100₽</span>
                  </div>
                </div>
              </Card>
              <Button variant="outline" onClick={handleLogout}>
                <Icon name="LogOut" size={18} className="mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {listings.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle>У вас пока нет объектов</CardTitle>
              <CardDescription>Свяжитесь с администратором для добавления объекта</CardDescription>
            </CardHeader>
          </Card>
        ) : (
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
                      onClick={() => handleListingSelect(listing)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedListing?.id === listing.id
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="font-semibold">{listing.title}</div>
                      <div className="text-sm text-muted-foreground">{listing.city}</div>
                      <Badge variant="outline" className="mt-2">
                        Позиция #{listing.auction}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {selectedListing && (
                <>
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
                          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-sm text-purple-700">Всего позиций</div>
                                <div className="text-2xl font-bold text-purple-900">{auctionInfo.total_positions}</div>
                              </div>
                              <div>
                                <div className="text-sm text-purple-700">Ваша текущая</div>
                                <div className="text-2xl font-bold text-purple-900">
                                  #{auctionInfo.positions.find(p => p.booking_info?.listing_id === selectedListing.id)?.position || selectedListing.auction}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-purple-700">До обновления</div>
                                <div className="text-lg font-bold text-purple-900">{timeUntilReset}</div>
                              </div>
                            </div>
                          </div>

                          <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold">Доступные позиции:</h3>
                              <div className="text-xs text-muted-foreground">
                                Прокрутите, чтобы увидеть все
                              </div>
                            </div>
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                              {[...auctionInfo.positions].reverse().map((posInfo) => {
                                const isMyPosition = posInfo.booking_info?.listing_id === selectedListing.id;
                                const isBooked = posInfo.is_booked && !isMyPosition;
                                
                                return (
                                  <div
                                    key={posInfo.position}
                                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                                      isMyPosition ? 'bg-purple-50 border-purple-400' :
                                      isBooked ? 'bg-gray-100 border-gray-300 opacity-60' :
                                      'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                                        posInfo.position === 1 ? 'bg-yellow-400 text-yellow-900' :
                                        posInfo.position === 2 ? 'bg-gray-300 text-gray-700' :
                                        posInfo.position === 3 ? 'bg-orange-400 text-orange-900' :
                                        isMyPosition ? 'bg-purple-600 text-white' :
                                        'bg-gray-200 text-gray-700'
                                      }`}>
                                        {posInfo.position}
                                      </div>
                                      <div>
                                        <div className="font-semibold text-lg">{posInfo.price} ₽</div>
                                        <div className="text-xs text-muted-foreground">
                                          {isMyPosition ? '✓ Ваша позиция' :
                                           isBooked ? '✗ Занято' :
                                           '○ Свободно'}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {isMyPosition ? (
                                      <Badge className="bg-purple-600">Активна</Badge>
                                    ) : isBooked ? (
                                      <Badge variant="secondary">Занято</Badge>
                                    ) : (
                                      <Button
                                        size="sm"
                                        onClick={() => handleBookPosition(posInfo.position, posInfo.price)}
                                        disabled={isLoading}
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                      >
                                        {isLoading && selectedPosition === posInfo.position ? (
                                          <Icon name="Loader2" size={16} className="animate-spin" />
                                        ) : (
                                          <>
                                            <Icon name="Check" size={16} className="mr-1" />
                                            Забронировать
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
                            <Icon name="Info" size={14} className="inline mr-1" />
                            Бронирование действует до 00:00 по Москве. Бонусы списываются первыми.
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Статистика за 7 дней</CardTitle>
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
                            <div className="text-center p-4 bg-pink-50 rounded-lg">
                              <Icon name="MousePointerClick" size={24} className="mx-auto mb-2 text-pink-600" />
                              <div className="text-2xl font-bold text-pink-600">{stats.summary.total_clicks}</div>
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
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}