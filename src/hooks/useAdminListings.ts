import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export function useAdminListings(token: string | null) {
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [showOnlyUnrated, setShowOnlyUnrated] = useState(false);
  const { toast } = useToast();

  const loadListings = async () => {
    setIsLoading(true);
    try {
      const limit = 1000;
      
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

  const handleModerationUpdate = (listingId: number, moderationStatus: string, moderationComment: string) => {
    setListings(prev => prev.map(l => 
      l.id === listingId 
        ? { ...l, moderation_status: moderationStatus, moderation_comment: moderationComment }
        : l
    ));
  };

  const handleSubscriptionUpdate = (listingId: number, subscriptionDays: number) => {
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + subscriptionDays);
    
    setListings(prev => prev.map(l => 
      l.id === listingId 
        ? { ...l, subscription_expires_at: newExpiresAt.toISOString() }
        : l
    ));
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
      if (showArchived) {
        const isInactive = !listing.subscription_expires_at || 
                          new Date(listing.subscription_expires_at) < new Date();
        const isRejected = listing.moderation_status === 'rejected';
        const isPending = listing.moderation_status === 'pending';
        
        if (!isInactive && !isRejected && !isPending) {
          return false;
        }
      } else {
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

  const cityTotals = useMemo(() => {
    const totals: { [city: string]: number } = {};
    listings.forEach(listing => {
      if (!showArchived && listing.is_archived) return;
      totals[listing.city] = (totals[listing.city] || 0) + 1;
    });
    return totals;
  }, [listings, showArchived]);

  return {
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
  };
}
