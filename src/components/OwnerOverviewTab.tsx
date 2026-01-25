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
  transactions?: Transaction[];
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
  const activeListings = listings.filter(l => !l.is_archived);
  const archivedListings = listings.filter(l => l.is_archived);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Active Listings */}
      {activeListings.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Icon name="Building" size={20} />
            Активные объекты ({activeListings.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {activeListings.map((listing) => (
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
        </div>
      )}

      {/* Archived Listings */}
      {archivedListings.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
            <Icon name="Archive" size={20} />
            Архив ({archivedListings.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 opacity-60">
            {archivedListings.map((listing) => (
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
        </div>
      )}

      {activeListings.length === 0 && archivedListings.length === 0 && (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>У вас пока нет объектов</CardTitle>
            <CardDescription>Свяжитесь с администратором для добавления объекта</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}