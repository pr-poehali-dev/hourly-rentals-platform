import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import AdminListingForm from '@/components/AdminListingForm';
import AdminOwnersTab from '@/components/AdminOwnersTab';
import AdminEmployeesTab from '@/components/AdminEmployeesTab';
import AdminBonusesTab from '@/components/AdminBonusesTab';
import AdminAllActionsTab from '@/components/AdminAllActionsTab';
import AdminModerationTab from '@/components/AdminModerationTab';
import AdminPanelHeader from '@/components/admin/AdminPanelHeader';
import AdminListingsFilters from '@/components/admin/AdminListingsFilters';
import AdminListingCard from '@/components/admin/AdminListingCard';
import SubscriptionDialog from '@/components/admin/SubscriptionDialog';
import ModerationDialog from '@/components/admin/ModerationDialog';
import OwnerModerationDialog from '@/components/admin/OwnerModerationDialog';
import ExpertRatingDialogFull from '@/components/ExpertRatingDialogFull';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'listings' | 'moderation' | 'recheck' | 'rejected' | 'owners' | 'employees' | 'bonuses' | 'all-actions'>('listings');
  const [listings, setListings] = useState<any[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showOnlyUnrated, setShowOnlyUnrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [subscriptionDialog, setSubscriptionDialog] = useState<{ open: boolean; listing: any | null }>({ open: false, listing: null });
  const [subscriptionDays, setSubscriptionDays] = useState<number>(30);
  const [moderationDialog, setModerationDialog] = useState<{ open: boolean; listing: any | null }>({ open: false, listing: null });
  const [moderationStatus, setModerationStatus] = useState<string>('approved');
  const [moderationComment, setModerationComment] = useState<string>('');
  const [expertRatingDialog, setExpertRatingDialog] = useState<{ open: boolean; listing: any | null }>({ open: false, listing: null });
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = localStorage.getItem('adminToken');
  
  const hasPermission = (permission: string) => {
    if (!adminInfo?.permissions) return false;
    return adminInfo.permissions[permission] === true;
  };

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      setAdminInfo(tokenPayload);
    } catch (e) {
      console.error('Invalid token', e);
      handleLogout();
      return;
    }
    
    loadListings();
  }, [token, navigate]);

  const loadListings = async () => {
    setIsLoading(true);
    try {
      const limit = 200;
      
      const [activeData, archivedData] = await Promise.all([
        api.getListings(token!, false, limit, 0),
        api.getListings(token!, true, limit, 0)
      ]);
      
      if (activeData.error || archivedData.error) {
        throw new Error(activeData.error || archivedData.error);
      }
      
      if (!Array.isArray(activeData) || !Array.isArray(archivedData)) {
        throw new Error('API вернул некорректный формат данных');
      }
      
      const allListings = [...activeData, ...archivedData.filter((l: any) => l.is_archived)];
      const sortedData = [...allListings].sort((a, b) => b.id - a.id);
      setListings(sortedData);
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось загрузить объекты',
        variant: 'destructive',
      });
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const handleArchive = async (id: number) => {
    try {
      await api.archiveListing(token!, id);
      toast({
        title: 'Успешно',
        description: 'Объект перемещён в архив',
      });
      loadListings();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось архивировать объект',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены? Удаление объекта нельзя отменить!')) {
      return;
    }
    
    try {
      await api.deleteListing(token!, id);
      toast({
        title: 'Успешно',
        description: 'Объект удалён навсегда',
      });
      loadListings();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось удалить объект',
        variant: 'destructive',
      });
    }
  };

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
      
      setListings(prev => prev.map(l => 
        l.id === moderationDialog.listing.id 
          ? { ...l, moderation_status: moderationStatus, moderation_comment: moderationComment }
          : l
      ));
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось обновить модерацию',
        variant: 'destructive',
      });
    }
  };

  const handleChangePosition = async (listingId: number, newPosition: number) => {
    try {
      await api.updateListingPosition(token!, listingId, newPosition);
      toast({
        title: 'Успешно',
        description: `Позиция изменена на #${newPosition}`,
      });
      
      setListings(prev => prev.map(l => 
        l.id === listingId ? { ...l, auction: newPosition } : l
      ));
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось изменить позицию',
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
      
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + subscriptionDays);
      
      setListings(prev => prev.map(l => 
        l.id === subscriptionDialog.listing.id 
          ? { ...l, subscription_expires_at: newExpiresAt.toISOString() }
          : l
      ));
      
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

  const formatSubscriptionStatus = (listing: any) => {
    if (!listing.subscription_expires_at) {
      return { text: 'Не активна', variant: 'destructive' as const, daysLeft: null };
    }
    
    const now = new Date();
    const expiresAt = new Date(listing.subscription_expires_at);
    const diff = expiresAt.getTime() - now.getTime();
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) {
      return { text: 'Истекла', variant: 'destructive' as const, daysLeft: 0 };
    } else if (daysLeft <= 3) {
      return { text: `${daysLeft}д`, variant: 'destructive' as const, daysLeft };
    } else if (daysLeft <= 7) {
      return { text: `${daysLeft}д`, variant: 'default' as const, daysLeft };
    } else {
      return { text: `${daysLeft}д`, variant: 'secondary' as const, daysLeft };
    }
  };

  const cities = useMemo(() => {
    const uniqueCities = [...new Set(listings.map(l => l.city))].sort();
    return uniqueCities;
  }, [listings]);

  const filteredListings = useMemo(() => {
    return listings.filter(listing => {
      // Если включён архив - показываем только неактивные объекты
      if (showArchived) {
        const isInactive = !listing.subscription_expires_at || 
                          new Date(listing.subscription_expires_at) < new Date();
        const isRejected = listing.moderation_status === 'rejected';
        const isPending = listing.moderation_status === 'pending';
        
        // Архив = объекты без подписки, отклонённые или на модерации
        if (!isInactive && !isRejected && !isPending) {
          return false;
        }
      } else {
        // В основном списке НЕ показываем архивные
        if (listing.is_archived) return false;
      }
      
      const cityMatch = selectedCity === 'all' || listing.city === selectedCity;
      const typeMatch = selectedType === 'all' || listing.type === selectedType;
      
      if (showOnlyUnrated) {
        const hasMainRating = (listing.expert_photo_rating && listing.expert_photo_rating > 0) || 
                              (listing.expert_fullness_rating && listing.expert_fullness_rating > 0);
        const hasRoomRatings = listing.rooms?.some((room: any) => 
          (room.expert_photo_rating && room.expert_photo_rating > 0) || 
          (room.expert_fullness_rating && room.expert_fullness_rating > 0)
        );
        const ratedMatch = !hasMainRating && !hasRoomRatings;
        return cityMatch && typeMatch && ratedMatch;
      }
      
      return cityMatch && typeMatch;
    });
  }, [listings, selectedCity, selectedType, showOnlyUnrated, showArchived]);
  




  const groupedByCity = useMemo(() => {
    const groups: { [city: string]: any[] } = {};
    filteredListings.forEach(listing => {
      if (!groups[listing.city]) {
        groups[listing.city] = [];
      }
      groups[listing.city].push(listing);
    });
    return groups;
  }, [filteredListings]);

  // Подсчёт всех объектов по городам (из всех объектов, не только отфильтрованных)
  const cityTotals = useMemo(() => {
    const totals: { [city: string]: number } = {};
    listings.forEach(listing => {
      if (!showArchived && listing.is_archived) return;
      totals[listing.city] = (totals[listing.city] || 0) + 1;
    });
    return totals;
  }, [listings, showArchived]);

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

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Icon name="Loader2" size={48} className="animate-spin text-purple-600" />
          </div>
        ) : (
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
                            onEdit={handleEdit}
                            onArchive={handleArchive}
                            onDelete={adminInfo?.role === 'superadmin' ? handleDelete : undefined}
                            onChangePosition={handleChangePosition}
                            onSetSubscription={(listing) => setSubscriptionDialog({ open: true, listing })}
                            onModerate={handleModerate}
                            onExpertRate={(listing) => setExpertRatingDialog({ open: true, listing })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            

          </div>
        )}

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