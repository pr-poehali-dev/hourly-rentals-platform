import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import OwnerDashboardHeader from '@/components/OwnerDashboardHeader';
import OwnerOverviewTab from '@/components/OwnerOverviewTab';
import OwnerAuctionTab from '@/components/OwnerAuctionTab';
import OwnerEditListingDialog from '@/components/OwnerEditListingDialog';

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
  type: string;
  image_url: string;
  district: string;
  subscription_expires_at: string | null;
  is_archived: boolean;
  moderation_status?: string;
  price?: number;
  square_meters?: number;
  logo_url?: string;
  features?: string[];
  metro?: string;
  metro_walk?: number;
  has_parking?: boolean;
  min_hours?: number;
  lat?: number;
  lng?: number;
}

interface SubscriptionInfo {
  days_left: number | null;
  price_per_month: number;
  prices: {
    '30_days': number;
    '90_days': number;
  };
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

export default function OwnerDashboard() {
  const [owner, setOwner] = useState<Owner | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [auctionInfo, setAuctionInfo] = useState<AuctionInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showCashbackAnimation, setShowCashbackAnimation] = useState(false);
  const [cashbackAmount, setCashbackAmount] = useState(0);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<Map<number, SubscriptionInfo>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isTopupLoading, setIsTopupLoading] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'auction'>('overview');
  const [editingListing, setEditingListing] = useState<any | null>(null);
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

      const subMap = new Map<number, SubscriptionInfo>();
      for (const listing of ownerListings) {
        try {
          const subInfo = await api.getSubscriptionInfo(listing.id);
          subMap.set(listing.id, subInfo);
        } catch (error) {
          console.error(`Failed to load subscription for listing ${listing.id}:`, error);
        }
      }
      setSubscriptionInfo(subMap);

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

  const handleBookPosition = async (position: number, offeredAmount: number) => {
    if (!selectedListing) return;

    const totalBalance = (owner?.balance || 0) + (owner?.bonus_balance || 0);

    if (offeredAmount > totalBalance) {
      toast({
        title: 'Недостаточно средств',
        description: `Нужно ${offeredAmount} ₽, у вас ${totalBalance} ₽`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setSelectedPosition(position);

    try {
      const response = await fetch('https://functions.poehali.dev/8e5ad1a2-e9bb-462c-baba-212ad26ae9a7', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'place_bid',
          owner_id: parseInt(ownerId!),
          listing_id: selectedListing.id,
          city: selectedListing.city,
          target_position: position,
          offered_amount: offeredAmount
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

      const updatedOwnerData = {
        ...owner!,
        balance: Math.max(0, owner!.balance - (offeredAmount - Math.min(owner!.bonus_balance, offeredAmount))),
        bonus_balance: Math.max(0, owner!.bonus_balance - Math.min(owner!.bonus_balance, offeredAmount))
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

  const handleTopup = async (amount: string) => {
    const amountNum = parseInt(amount);
    if (!amountNum || amountNum < 100) {
      toast({
        title: 'Ошибка',
        description: 'Минимальная сумма пополнения: 100 ₽',
        variant: 'destructive',
      });
      return;
    }

    setIsTopupLoading(true);

    try {
      const cashback = Math.floor(amountNum * 0.1);
      setCashbackAmount(cashback);
      setShowCashbackAnimation(true);
      
      setTimeout(() => {
        setShowCashbackAnimation(false);
      }, 3000);

      const response = await api.createPayment(parseInt(ownerId!), amountNum);

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
      setShowCashbackAnimation(false);
    }
  };

  const handleExtendSubscription = async (listingId: number, days: number) => {
    setIsLoading(true);
    try {
      const response = await api.extendSubscription(token!, parseInt(ownerId!), listingId, days);
      
      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: 'Успешно!',
        description: response.message,
      });

      await loadOwnerListings();
      await loadTransactions();
      
      const ownerData = localStorage.getItem('ownerData');
      if (ownerData) {
        const updatedOwner = JSON.parse(ownerData);
        setOwner(updatedOwner);
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось продлить подписку',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditListing = (listing: any) => {
    setEditingListing(listing);
  };

  const handleEditSuccess = async () => {
    await loadOwnerListings();
    toast({
      title: 'Изменения отправлены',
      description: 'Объект будет проверен администратором',
    });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <OwnerDashboardHeader
        owner={owner}
        onLogout={handleLogout}
        onTopup={handleTopup}
        isTopupLoading={isTopupLoading}
        showCashbackAnimation={showCashbackAnimation}
        cashbackAmount={cashbackAmount}
      />

      <main className="container mx-auto px-4 py-8">
        {listings.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle>У вас пока нет объектов</CardTitle>
              <CardDescription>Свяжитесь с администратором для добавления объекта</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'overview' | 'auction')} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="overview">Мои объекты</TabsTrigger>
              <TabsTrigger value="auction">Аукцион</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OwnerOverviewTab
                listings={listings}
                subscriptionInfo={subscriptionInfo}
                transactions={transactions}
                isLoading={isLoading}
                onExtendSubscription={handleExtendSubscription}
                onEditListing={handleEditListing}
              />
            </TabsContent>

            <TabsContent value="auction">
              <OwnerAuctionTab
                listings={listings}
                selectedListing={selectedListing}
                auctionInfo={auctionInfo}
                stats={stats}
                transactions={transactions}
                timeUntilReset={timeUntilReset}
                isLoading={isLoading}
                selectedPosition={selectedPosition}
                onSelectListing={handleListingSelect}
                onBookPosition={handleBookPosition}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>

      <OwnerEditListingDialog
        listing={editingListing}
        open={!!editingListing}
        onClose={() => setEditingListing(null)}
        onSuccess={handleEditSuccess}
        token={token!}
      />
    </div>
  );
}