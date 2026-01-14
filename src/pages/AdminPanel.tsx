import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import AdminListingForm from '@/components/AdminListingForm';
import AdminOwnersTab from '@/components/AdminOwnersTab';
import AdminEmployeesTab from '@/components/AdminEmployeesTab';
import AdminBonusesTab from '@/components/AdminBonusesTab';
import AdminAllActionsTab from '@/components/AdminAllActionsTab';
import AdminModerationTab from '@/components/AdminModerationTab';

function LiveCountdown({ expiresAt }: { expiresAt: string | null }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(expiresAt);
      const diff = expires.getTime() - now.getTime();

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
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return timeLeft ? <div className="text-xs mt-1">{timeLeft}</div> : null;
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'listings' | 'moderation' | 'owners' | 'employees' | 'bonuses' | 'all-actions'>('listings');
  const [listings, setListings] = useState<any[]>([]);
  const [showArchived, setShowArchived] = useState(false);
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
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = localStorage.getItem('adminToken');
  
  // Проверка прав доступа
  const hasPermission = (permission: string) => {
    if (!adminInfo?.permissions) return false;
    return adminInfo.permissions[permission] === true;
  };

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    // Загрузка информации об администраторе из токена
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      setAdminInfo(tokenPayload);
    } catch (e) {
      console.error('Invalid token', e);
      handleLogout();
      return;
    }
    
    loadListings();
  }, [showArchived, token, navigate]);

  const loadListings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getListings(token!, showArchived);
      console.log('=== LOADED LISTINGS FROM API ===');
      console.log('Total listings:', data.length);
      if (data.length > 0) {
        console.log('First listing rooms:', data[0].rooms);
      }
      if (data.error) {
        throw new Error(data.error);
      }
      const sortedData = [...data].sort((a, b) => b.id - a.id);
      setListings(sortedData);
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось загрузить объекты',
        variant: 'destructive',
      });
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

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedListing(null);
    loadListings();
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
      loadListings();
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
      loadListings();
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
      setSubscriptionDialog({ open: false, listing: null });
      setSubscriptionDays(30);
      loadListings();
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

  // Получение уникальных городов
  const cities = useMemo(() => {
    const uniqueCities = [...new Set(listings.map(l => l.city))].sort();
    return uniqueCities;
  }, [listings]);

  // Фильтрация объектов
  const filteredListings = useMemo(() => {
    return listings.filter(listing => {
      const cityMatch = selectedCity === 'all' || listing.city === selectedCity;
      const typeMatch = selectedType === 'all' || listing.type === selectedType;
      return cityMatch && typeMatch;
    });
  }, [listings, selectedCity, selectedType]);

  // Группировка объектов по городам
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-purple-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">⏰</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Админ-панель 120 минут
                </h1>
                <p className="text-xs text-muted-foreground">
                  {adminInfo?.name} • {adminInfo?.role === 'superadmin' ? 'Суперадминистратор' : 'Сотрудник'}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <Icon name="LogOut" size={18} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6 border-b">
          {hasPermission('listings') && (
            <>
              <Button
                variant={activeTab === 'listings' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('listings')}
                className="rounded-b-none"
              >
                <Icon name="Hotel" size={18} className="mr-2" />
                Объекты
              </Button>
              <Button
                variant={activeTab === 'moderation' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('moderation')}
                className="rounded-b-none"
              >
                <Icon name="Shield" size={18} className="mr-2" />
                Модерация
              </Button>
            </>
          )}
          {hasPermission('owners') && (
            <Button
              variant={activeTab === 'owners' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('owners')}
              className="rounded-b-none"
            >
              <Icon name="Users" size={18} className="mr-2" />
              Владельцы
            </Button>
          )}
          {adminInfo?.role === 'superadmin' && (
            <>
              <Button
                variant={activeTab === 'employees' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('employees')}
                className="rounded-b-none"
              >
                <Icon name="UserCog" size={18} className="mr-2" />
                Сотрудники
              </Button>
              <Button
                variant={activeTab === 'bonuses' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('bonuses')}
                className="rounded-b-none"
              >
                <Icon name="DollarSign" size={18} className="mr-2" />
                Выплаты
              </Button>
              <Button
                variant={activeTab === 'all-actions' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('all-actions')}
                className="rounded-b-none"
              >
                <Icon name="ListChecks" size={18} className="mr-2" />
                Общая работа
              </Button>
            </>
          )}
        </div>

        {showForm ? (
          <AdminListingForm
            listing={selectedListing}
            token={token!}
            onClose={handleFormClose}
          />
        ) : activeTab === 'moderation' && hasPermission('listings') ? (
          <AdminModerationTab token={token!} />
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold">Объекты</h2>
            <Badge variant="secondary" className="text-lg px-4 py-1">
              {filteredListings.length} из {listings.length}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Город" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Icon name="MapPin" size={14} />
                    Все города
                  </div>
                </SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Icon name="Building" size={14} />
                    Все типы
                  </div>
                </SelectItem>
                <SelectItem value="hotel">
                  <div className="flex items-center gap-2">
                    <Icon name="Hotel" size={14} />
                    Отели
                  </div>
                </SelectItem>
                <SelectItem value="apartment">
                  <div className="flex items-center gap-2">
                    <Icon name="Home" size={14} />
                    Апартаменты
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showArchived ? 'default' : 'outline'}
              onClick={() => setShowArchived(!showArchived)}
            >
              <Icon name="Archive" size={18} className="mr-2" />
              {showArchived ? 'Скрыть архив' : 'Показать архив'}
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={handleCreate}
            >
              <Icon name="Plus" size={18} className="mr-2" />
              Добавить объект
            </Button>
          </div>
        </div>

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
                    {cityListings.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cityListings.map((listing) => (
                    <Card key={listing.id} className={listing.is_archived ? 'opacity-60' : ''}>
                      <div className="relative">
                        {listing.image_url ? (
                          <img src={listing.image_url} alt={listing.title} className="h-48 w-full object-cover" />
                        ) : (
                          <div className="h-48 bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center text-6xl">
                            🏨
                          </div>
                        )}
                        {listing.logo_url && (
                          <div className="absolute top-3 right-3 w-12 h-12 border rounded bg-white/90 backdrop-blur-sm p-1 flex items-center justify-center">
                            <img src={listing.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                          </div>
                        )}
                        {listing.is_archived && (
                          <Badge variant="secondary" className="absolute top-3 left-3">Архив</Badge>
                        )}
                      </div>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-xl mb-2">{listing.title}</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Icon name="Building" size={14} />
                              <span>{listing.district}</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Тип:</span>
                            <Badge variant="outline">
                              {listing.type === 'hotel' ? '🏨 Отель' : '🏠 Апартаменты'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Цена:</span>
                            <span className="text-lg font-bold text-purple-600">{listing.price} ₽/час</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Рейтинг:</span>
                            <div className="flex items-center gap-1">
                              <Icon name="Star" size={14} className="text-yellow-500" />
                              <span className="font-semibold">{listing.rating}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Позиция:</span>
                            <Select 
                              value={String(listing.auction)} 
                              onValueChange={(value) => handleChangePosition(listing.id, parseInt(value))}
                            >
                              <SelectTrigger className="w-[100px] h-8">
                                <SelectValue>#{listing.auction}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: cityListings.length }, (_, i) => i + 1).map((pos) => (
                                  <SelectItem key={pos} value={String(pos)}>
                                    #{pos}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Номеров:</span>
                            <span className="font-semibold">{listing.rooms?.length || 0}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-sm text-muted-foreground">Подписка:</span>
                            <div className="text-right">
                              <Badge variant={formatSubscriptionStatus(listing).variant}>
                                {formatSubscriptionStatus(listing).text}
                              </Badge>
                              <LiveCountdown expiresAt={listing.subscription_expires_at} />
                            </div>
                          </div>
                          
                          {listing.submitted_for_moderation && (
                            <div className="pt-2 border-t">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold">Модерация:</span>
                                <Badge variant={
                                  listing.moderation_status === 'approved' ? 'default' :
                                  listing.moderation_status === 'needs_changes' ? 'destructive' : 'secondary'
                                }>
                                  {listing.moderation_status === 'approved' ? '✓ Одобрено' :
                                   listing.moderation_status === 'needs_changes' ? '⚠ Нужны правки' : '⏳ На проверке'}
                                </Badge>
                              </div>
                              {listing.moderation_comment && (
                                <div className="text-xs text-muted-foreground bg-yellow-50 p-2 rounded border border-yellow-200">
                                  <div className="font-semibold mb-1">Комментарий модератора:</div>
                                  {listing.moderation_comment}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex flex-col gap-2 mt-4">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleEdit(listing)}
                              >
                                <Icon name="Edit" size={16} className="mr-1" />
                                Редактировать
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSubscriptionDialog({ open: true, listing })}
                                title="Установить подписку"
                              >
                                <Icon name="Clock" size={16} />
                              </Button>
                              {!listing.is_archived && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleArchive(listing.id)}
                                >
                                  <Icon name="Archive" size={16} />
                                </Button>
                              )}
                            </div>
                            
                            {listing.submitted_for_moderation && adminInfo?.role === 'superadmin' && (
                              <Button
                                variant={listing.moderation_status === 'approved' ? 'secondary' : 'default'}
                                size="sm"
                                className="w-full"
                                onClick={() => handleModerate(listing)}
                              >
                                <Icon name="CheckCircle" size={16} className="mr-1" />
                                {listing.moderation_status === 'approved' ? 'Изменить модерацию' : 'Модерировать'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={subscriptionDialog.open} onOpenChange={(open) => setSubscriptionDialog({ open, listing: subscriptionDialog.listing })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Установить подписку</DialogTitle>
              <DialogDescription>
                {subscriptionDialog.listing?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {subscriptionDialog.listing?.subscription_expires_at && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-900">
                    Текущая подписка: <strong>{formatSubscriptionStatus(subscriptionDialog.listing).text}</strong>
                  </div>
                  <div className="text-xs text-blue-700 mt-1">
                    Новое время добавится к существующему
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-2 block">Количество дней</label>
                <Input
                  type="number"
                  min="1"
                  value={subscriptionDays}
                  onChange={(e) => setSubscriptionDays(Number(e.target.value))}
                  placeholder="30"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSubscriptionDays(30)}>30 дней</Button>
                <Button size="sm" variant="outline" onClick={() => setSubscriptionDays(90)}>90 дней</Button>
                <Button size="sm" variant="outline" onClick={() => setSubscriptionDays(365)}>1 год</Button>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSubscriptionDialog({ open: false, listing: null })} className="flex-1">
                Отмена
              </Button>
              <Button onClick={handleSetSubscription} className="flex-1">
                Установить
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={moderationDialog.open} onOpenChange={(open) => setModerationDialog({ open, listing: moderationDialog.listing })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Модерация объекта</DialogTitle>
              <DialogDescription>
                {moderationDialog.listing?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Статус модерации</label>
                <Select value={moderationStatus} onValueChange={setModerationStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">
                      <div className="flex items-center gap-2">
                        <Icon name="CheckCircle" size={16} className="text-green-600" />
                        Одобрено
                      </div>
                    </SelectItem>
                    <SelectItem value="needs_changes">
                      <div className="flex items-center gap-2">
                        <Icon name="AlertCircle" size={16} className="text-red-600" />
                        Нужны правки
                      </div>
                    </SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <Icon name="Clock" size={16} className="text-gray-600" />
                        На проверке
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Комментарий для сотрудника</label>
                <textarea
                  className="w-full min-h-[100px] p-3 border rounded-md resize-y"
                  placeholder="Укажите, что нужно исправить..."
                  value={moderationComment}
                  onChange={(e) => setModerationComment(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Сотрудник увидит этот комментарий и сможет внести правки
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setModerationDialog({ open: false, listing: null })} 
                className="flex-1"
              >
                Отмена
              </Button>
              <Button 
                onClick={handleModerationSubmit} 
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700"
              >
                <Icon name="Check" size={16} className="mr-2" />
                Сохранить
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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