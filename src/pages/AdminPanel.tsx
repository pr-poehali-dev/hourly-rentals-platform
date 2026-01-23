import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminListings } from '@/hooks/useAdminListings';
import AdminListingForm from '@/components/AdminListingForm';
import AdminOwnersTab from '@/components/AdminOwnersTab';
import AdminEmployeesTab from '@/components/AdminEmployeesTab';
import AdminBonusesTab from '@/components/AdminBonusesTab';
import AdminAllActionsTab from '@/components/AdminAllActionsTab';
import AdminModerationTab from '@/components/AdminModerationTab';
import AdminPanelHeader from '@/components/admin/AdminPanelHeader';
import AdminListingsFilters from '@/components/admin/AdminListingsFilters';
import AdminListingsContent from '@/components/admin/AdminListingsContent';
import SubscriptionDialog from '@/components/admin/SubscriptionDialog';
import ModerationDialog from '@/components/admin/ModerationDialog';
import OwnerModerationDialog from '@/components/admin/OwnerModerationDialog';
import ExpertRatingDialogFull from '@/components/ExpertRatingDialogFull';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'listings' | 'moderation' | 'recheck' | 'rejected' | 'owners' | 'employees' | 'bonuses' | 'all-actions'>('listings');
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [subscriptionDialog, setSubscriptionDialog] = useState<{ open: boolean; listing: any | null }>({ open: false, listing: null });
  const [subscriptionDays, setSubscriptionDays] = useState<number>(30);
  const [moderationDialog, setModerationDialog] = useState<{ open: boolean; listing: any | null }>({ open: false, listing: null });
  const [moderationStatus, setModerationStatus] = useState<string>('approved');
  const [moderationComment, setModerationComment] = useState<string>('');
  const [expertRatingDialog, setExpertRatingDialog] = useState<{ open: boolean; listing: any | null }>({ open: false, listing: null });
  const { toast } = useToast();

  const { adminInfo, token, hasPermission, handleLogout } = useAdminAuth();
  
  const {
    listings,
    isLoading,
    selectedCity,
    selectedType,
    showArchived,
    showOnlyUnrated,
    cities,
    filteredListings,
    groupedByCity,
    cityTotals,
    setSelectedCity,
    setSelectedType,
    setShowArchived,
    setShowOnlyUnrated,
    loadListings,
    handleArchive,
    handleDelete,
    handleChangePosition,
    handleModerationUpdate,
    handleSubscriptionUpdate,
    formatSubscriptionStatus,
  } = useAdminListings(token);

  useEffect(() => {
    if (token && adminInfo) {
      loadListings();
    }
  }, [token, adminInfo]);

  const handleEdit = (listing: any) => {
    console.log('=== OPENING EDIT FORM ===');
    console.log('Listing to edit:', listing);
    console.log('Listing rooms:', listing.rooms);
    setSelectedListing(listing);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedListing(null);
    setShowForm(true);
  };

  const handleFormClose = (shouldReload = false) => {
    setShowForm(false);
    setSelectedListing(null);
    if (shouldReload) loadListings();
  };

  const handleModerate = (listing: any) => {
    setModerationDialog({ open: true, listing });
    setModerationStatus(listing.moderation_status || 'approved');
    setModerationComment(listing.moderation_comment || '');
  };

  const handleModerationSubmit = async () => {
    if (!moderationDialog.listing) return;

    try {
      await api.moderateListing(
        token!,
        moderationDialog.listing.id,
        moderationStatus,
        moderationComment
      );

      toast({
        title: 'Успешно',
        description: 'Модерация обновлена',
      });

      setModerationDialog({ open: false, listing: null });
      setModerationComment('');
      
      handleModerationUpdate(moderationDialog.listing.id, moderationStatus, moderationComment);
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось обновить модерацию',
        variant: 'destructive',
      });
    }
  };

  const handleSetSubscription = async () => {
    if (!subscriptionDialog.listing || subscriptionDays < 1) {
      toast({
        title: 'Ошибка',
        description: 'Укажите количество дней',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.adminSetSubscription(token!, subscriptionDialog.listing.id, subscriptionDays);
      toast({
        title: 'Успешно',
        description: `Подписка установлена на ${subscriptionDays} дней`,
      });
      
      handleSubscriptionUpdate(subscriptionDialog.listing.id, subscriptionDays);
      
      setSubscriptionDialog({ open: false, listing: null });
      setSubscriptionDays(30);
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось установить подписку',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <AdminPanelHeader
        adminInfo={adminInfo}
        hasPermission={hasPermission}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      <main className="container mx-auto px-4 py-8">
        {(() => {
          console.log('[AdminPanel] Current activeTab:', activeTab);
          console.log('[AdminPanel] hasPermission(listings):', hasPermission('listings'));
        })()}
        {showForm ? (
          <AdminListingForm
            listing={selectedListing}
            token={token!}
            onClose={handleFormClose}
          />
        ) : activeTab === 'moderation' && hasPermission('listings') ? (
          <AdminModerationTab token={token!} adminInfo={adminInfo} />
        ) : activeTab === 'recheck' && hasPermission('listings') ? (
          <AdminModerationTab token={token!} adminInfo={adminInfo} moderationFilter="awaiting_recheck" />
        ) : activeTab === 'rejected' && hasPermission('listings') ? (
          <AdminModerationTab token={token!} adminInfo={adminInfo} moderationFilter="rejected" />
        ) : activeTab === 'owners' && hasPermission('owners') ? (
          <AdminOwnersTab token={token!} />
        ) : activeTab === 'employees' && adminInfo?.role === 'superadmin' ? (
          <AdminEmployeesTab token={token!} />
        ) : activeTab === 'bonuses' && adminInfo?.role === 'superadmin' ? (
          <AdminBonusesTab token={token!} />
        ) : activeTab === 'all-actions' && adminInfo?.role === 'superadmin' ? (
          <AdminAllActionsTab token={token!} />
        ) : hasPermission('listings') ? (
        <>
        <AdminListingsFilters
          filteredCount={filteredListings.length}
          totalCount={listings.length}
          selectedCity={selectedCity}
          selectedType={selectedType}
          showArchived={showArchived}
          showOnlyUnrated={showOnlyUnrated}
          cities={cities}
          onCityChange={setSelectedCity}
          onTypeChange={setSelectedType}
          onArchiveToggle={() => setShowArchived(!showArchived)}
          onUnratedToggle={() => setShowOnlyUnrated(!showOnlyUnrated)}
          onCreate={handleCreate}
        />

        <AdminListingsContent
          isLoading={isLoading}
          groupedByCity={groupedByCity}
          cityTotals={cityTotals}
          adminInfo={adminInfo}
          formatSubscriptionStatus={formatSubscriptionStatus}
          onEdit={handleEdit}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onChangePosition={handleChangePosition}
          onSetSubscription={(listing) => setSubscriptionDialog({ open: true, listing })}
          onModerate={handleModerate}
          onExpertRate={(listing) => setExpertRatingDialog({ open: true, listing })}
        />

        <SubscriptionDialog
          open={subscriptionDialog.open}
          listing={subscriptionDialog.listing}
          subscriptionDays={subscriptionDays}
          formatSubscriptionStatus={formatSubscriptionStatus}
          onClose={() => setSubscriptionDialog({ open: false, listing: null })}
          onDaysChange={setSubscriptionDays}
          onSubmit={handleSetSubscription}
        />

        {moderationDialog.listing?.created_by_owner ? (
          <OwnerModerationDialog
            open={moderationDialog.open}
            listing={moderationDialog.listing}
            moderationStatus={moderationStatus}
            moderationComment={moderationComment}
            token={token!}
            onClose={() => setModerationDialog({ open: false, listing: null })}
            onStatusChange={setModerationStatus}
            onCommentChange={setModerationComment}
            onSubmit={handleModerationSubmit}
          />
        ) : (
          <ModerationDialog
            open={moderationDialog.open}
            listing={moderationDialog.listing}
            moderationStatus={moderationStatus}
            moderationComment={moderationComment}
            onClose={() => setModerationDialog({ open: false, listing: null })}
            onStatusChange={setModerationStatus}
            onCommentChange={setModerationComment}
            onSubmit={handleModerationSubmit}
          />
        )}

        <ExpertRatingDialogFull
          open={expertRatingDialog.open}
          listing={expertRatingDialog.listing}
          token={token!}
          onClose={() => setExpertRatingDialog({ open: false, listing: null })}
          onSuccess={() => {
            setExpertRatingDialog({ open: false, listing: null });
            loadListings();
          }}
        />

        {!isLoading && filteredListings.length === 0 && listings.length > 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-2">Объекты не найдены</h3>
            <p className="text-muted-foreground mb-6">Попробуйте изменить фильтры</p>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCity('all');
                setSelectedType('all');
              }}
            >
              <Icon name="X" size={18} className="mr-2" />
              Сбросить фильтры
            </Button>
          </div>
        )}

        {!isLoading && listings.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-2xl font-bold mb-2">Объектов пока нет</h3>
            <p className="text-muted-foreground mb-6">Добавьте первый объект для начала работы</p>
            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={handleCreate}
            >
              <Icon name="Plus" size={18} className="mr-2" />
              Добавить объект
            </Button>
          </div>
        )}
        </>
        ) : null}
      </main>
    </div>
  );
}
