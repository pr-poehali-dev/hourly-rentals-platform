import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import AdminListingCard from '@/components/admin/AdminListingCard';

interface AdminListingsContentProps {
  isLoading: boolean;
  groupedByCity: { [city: string]: any[] };
  cityTotals: { [city: string]: number };
  adminInfo: any;
  formatSubscriptionStatus: (listing: any) => { text: string; variant: 'destructive' | 'default' | 'secondary'; daysLeft: number | null };
  onEdit: (listing: any) => void;
  onArchive: (id: number) => void;
  onDelete?: (id: number) => void;
  onChangePosition: (listingId: number, newPosition: number) => void;
  onSetSubscription: (listing: any) => void;
  onModerate: (listing: any) => void;
  onExpertRate: (listing: any) => void;
}

export default function AdminListingsContent({
  isLoading,
  groupedByCity,
  cityTotals,
  adminInfo,
  formatSubscriptionStatus,
  onEdit,
  onArchive,
  onDelete,
  onChangePosition,
  onSetSubscription,
  onModerate,
  onExpertRate,
}: AdminListingsContentProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icon name="Loader2" size={48} className="animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedByCity).sort(([cityA], [cityB]) => cityA.localeCompare(cityB)).map(([city, cityListings]) => (
        <div key={city}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Icon name="MapPin" size={20} className="text-purple-600" />
              <h3 className="text-2xl font-bold">{city}</h3>
            </div>
            <Badge variant="secondary" className="text-base px-3 py-1">
              {cityTotals[city] || 0}
            </Badge>
          </div>
          <div className="relative">
            <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-purple-100">
              <div className="flex gap-6" style={{ minWidth: 'min-content' }}>
                {cityListings.map((listing) => (
                  <div key={listing.id} className="flex-none w-[350px]">
                    <AdminListingCard
                      listing={listing}
                      cityListings={cityListings}
                      adminInfo={adminInfo}
                      formatSubscriptionStatus={formatSubscriptionStatus}
                      onEdit={onEdit}
                      onArchive={onArchive}
                      onDelete={adminInfo?.role === 'superadmin' ? onDelete : undefined}
                      onChangePosition={onChangePosition}
                      onSetSubscription={onSetSubscription}
                      onModerate={onModerate}
                      onExpertRate={onExpertRate}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
