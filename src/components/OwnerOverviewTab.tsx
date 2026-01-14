import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import HotelSubscriptionCard from '@/components/HotelSubscriptionCard';

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
  moderation_comment?: string;
}

interface SubscriptionInfo {
  days_left: number | null;
  price_per_month: number;
  prices: {
    '30_days': number;
    '90_days': number;
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

interface OwnerOverviewTabProps {
  listings: Listing[];
  subscriptionInfo: Map<number, SubscriptionInfo>;
  transactions: Transaction[];
  isLoading: boolean;
  onExtendSubscription: (listingId: number, days: number) => Promise<void>;
  onEditListing?: (listing: any) => void;
}

export default function OwnerOverviewTab({
  listings,
  subscriptionInfo,
  transactions,
  isLoading,
  onExtendSubscription,
  onEditListing,
}: OwnerOverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <HotelSubscriptionCard
            key={listing.id}
            listing={listing}
            subscriptionInfo={subscriptionInfo.get(listing.id) || null}
            onExtend={onExtendSubscription}
            onEdit={onEditListing}
            isLoading={isLoading}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>История операций</CardTitle>
          <CardDescription>Последние транзакции</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="Receipt" size={48} className="mx-auto mb-2 opacity-20" />
                <p>Операций пока нет</p>
              </div>
            ) : (
              transactions.slice(0, 10).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      name={
                        tx.type === 'deposit' ? 'ArrowDownToLine' :
                        tx.type === 'subscription' ? 'CalendarCheck' :
                        tx.type === 'bid_payment' ? 'TrendingUp' :
                        tx.type === 'bonus' ? 'Gift' :
                        'Circle'
                      }
                      size={18}
                      className={
                        tx.type === 'deposit' || tx.type === 'bonus' ? 'text-green-600' :
                        'text-orange-600'
                      }
                    />
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount >= 0 ? '+' : ''}{tx.amount} ₽
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Баланс: {tx.balance_after} ₽
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}