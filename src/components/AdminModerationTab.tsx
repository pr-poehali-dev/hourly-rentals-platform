import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface Listing {
  id: number;
  title: string;
  type: string;
  city: string;
  district: string;
  price: number;
  image_url: string;
  moderation_status: string;
  moderation_comment?: string;
  submitted_at?: string;
  created_by_employee_id?: number;
  created_by_employee_name?: string;
}

interface ModerationTabProps {
  token: string;
  adminInfo?: any;
  moderationFilter?: 'pending' | 'awaiting_recheck' | 'rejected';
}

export default function AdminModerationTab({ token, adminInfo, moderationFilter = 'pending' }: ModerationTabProps) {
  const isSuperAdmin = adminInfo?.role === 'superadmin';
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [moderationStatus, setModerationStatus] = useState<'approved' | 'rejected' | 'pending'>('pending');
  const [moderationComment, setModerationComment] = useState('');
  const [subscriptionDays, setSubscriptionDays] = useState<number>(30);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [subscriptionListing, setSubscriptionListing] = useState<Listing | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPendingListings();
  }, [moderationFilter]);

  const loadPendingListings = async () => {
    setIsLoading(true);
    try {
      console.log('[AdminModerationTab] Loading listings with filter:', moderationFilter);
      const data = await api.getPendingModerationListings(token, moderationFilter);
      console.log('[AdminModerationTab] Received listings:', data.length);
      setListings(data);
    } catch (error: any) {
      console.error('[AdminModerationTab] Error loading listings:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось загрузить объекты',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModerate = (listing: Listing) => {
    setSelectedListing(listing);
    setModerationStatus(listing.moderation_status as any || 'pending');
    setModerationComment(listing.moderation_comment || '');
  };

  const handleModerationSubmit = async () => {
    if (!selectedListing) return;

    if (moderationStatus === 'rejected' && !moderationComment.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Укажите причину отклонения в комментарии',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.moderateListing(
        token,
        selectedListing.id,
        moderationStatus,
        moderationComment
      );

      toast({
        title: 'Успешно',
        description: moderationStatus === 'approved' 
          ? 'Объект одобрен и опубликован' 
          : moderationStatus === 'rejected'
          ? 'Объект отклонен, владелец сможет исправить и отправить повторно'
          : 'Статус модерации обновлен',
      });

      setSelectedListing(null);
      setModerationComment('');
      loadPendingListings();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось обновить модерацию',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Одобрено</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Отклонено</Badge>;
      default:
        return <Badge variant="outline">На модерации</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {moderationFilter === 'rejected' ? 'Отклонённые объекты' : moderationFilter === 'awaiting_recheck' ? 'Повторная проверка' : 'Модерация объектов'}
          </h2>
          <p className="text-muted-foreground">
            {moderationFilter === 'rejected' 
              ? 'Объекты, которые были отклонены при модерации' 
              : 'Проверяйте объекты, добавленные сотрудниками, или изменённые владельцами'}
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {listings.length} {moderationFilter === 'rejected' ? 'отклонено' : 'на проверке'}
        </Badge>
      </div>

      {moderationFilter === 'pending' && (
        <Card className="p-6 bg-blue-50 border-blue-200 mb-4">
          <div className="flex gap-4">
            <Icon name="Info" size={24} className="text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Заявки от владельцев</h3>
              <p className="text-sm text-blue-800 mb-3">
                Объекты с меткой "Заявка владельца" созданы самими владельцами через форму добавления. 
                После одобрения владелец получит на почту логин и пароль для входа в экстранет.
              </p>
              <div className="space-y-1 text-sm text-blue-800">
                <p>• Проверьте контактные данные владельца</p>
                <p>• Убедитесь в наличии активной подписки перед одобрением</p>
                <p>• При отклонении укажите причину в комментарии</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {listings.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Icon name="CheckCircle" size={64} className="mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-xl font-semibold mb-2">
              {moderationFilter === 'rejected' ? 'Нет отклонённых объектов' : 'Нет объектов на модерации'}
            </h3>
            <p className="text-muted-foreground">
              {moderationFilter === 'rejected' ? 'Все объекты одобрены' : 'Все объекты проверены'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {listings.map((listing) => (
            <Card key={listing.id} className="p-6">
              <div className="flex gap-6">
                <img
                  src={listing.image_url}
                  alt={listing.title}
                  className="w-48 h-36 object-cover rounded-lg"
                />
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{listing.title}</h3>
                      <p className="text-muted-foreground">
                        {listing.city}, {listing.district}
                      </p>
                    </div>
                    {getStatusBadge(listing.moderation_status)}
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Icon name="Tag" size={16} />
                      <span>{listing.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="Ruble" size={16} />
                      <span className="font-semibold">{listing.price.toLocaleString()} ₽/час</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="Calendar" size={16} />
                      <Badge variant={listing.subscription_expires_at ? 'default' : 'destructive'}>
                        {listing.subscription_expires_at ? 'Подписка активна' : 'Нет подписки'}
                      </Badge>
                    </div>
                    {listing.created_by_employee_name && (
                      <div className="flex items-center gap-2">
                        <Icon name="User" size={16} />
                        <span>Добавил: {listing.created_by_employee_name}</span>
                      </div>
                    )}
                    {listing.owner_name && !listing.created_by_employee_name && (
                      <div className="flex items-center gap-2">
                        <Icon name="UserCog" size={16} />
                        <span>Изменил: {listing.owner_name}</span>
                      </div>
                    )}
                    {listing.submitted_at && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Icon name="Clock" size={16} />
                        <span>
                          {new Date(listing.submitted_at).toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {listing.moderation_comment && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">
                        <span className="font-semibold">Комментарий: </span>
                        {listing.moderation_comment}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/listing/${listing.id}`, '_blank')}
                    >
                      <Icon name="ExternalLink" size={16} className="mr-2" />
                      Посмотреть
                    </Button>
                    {isSuperAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSubscriptionListing(listing);
                          setShowSubscriptionDialog(true);
                        }}
                      >
                        <Icon name="Calendar" size={16} className="mr-2" />
                        Подписка
                      </Button>
                    )}
                    {isSuperAdmin && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={async () => {
                            try {
                              await api.moderateListing(token, listing.id, 'approved', '');
                              toast({
                                title: 'Успешно',
                                description: 'Объект одобрен и опубликован',
                              });
                              loadPendingListings();
                            } catch (error: any) {
                              toast({
                                title: 'Ошибка',
                                description: error.message,
                                variant: 'destructive',
                              });
                            }
                          }}
                          disabled={listing.moderation_status === 'approved'}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Icon name="CheckCircle" size={16} className="mr-2" />
                          Одобрить
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleModerate(listing)}
                        >
                          <Icon name="XCircle" size={16} className="mr-2" />
                          Отклонить с комментарием
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedListing} onOpenChange={() => setSelectedListing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Модерация объекта</DialogTitle>
          </DialogHeader>
          
          {selectedListing && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">{selectedListing.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedListing.city}, {selectedListing.district}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Статус модерации</label>
                <div className="flex gap-2">
                  <Button
                    variant={moderationStatus === 'approved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setModerationStatus('approved')}
                    className="flex-1"
                  >
                    <Icon name="CheckCircle" size={16} className="mr-2" />
                    Одобрить
                  </Button>
                  <Button
                    variant={moderationStatus === 'rejected' ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => setModerationStatus('rejected')}
                    className="flex-1"
                  >
                    <Icon name="XCircle" size={16} className="mr-2" />
                    Отклонить
                  </Button>
                  <Button
                    variant={moderationStatus === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setModerationStatus('pending')}
                    className="flex-1"
                  >
                    <Icon name="Clock" size={16} className="mr-2" />
                    На проверке
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Комментарий {moderationStatus === 'rejected' && <span className="text-red-500">(обязательно)</span>}
                </label>
                <Textarea
                  value={moderationComment}
                  onChange={(e) => setModerationComment(e.target.value)}
                  placeholder={
                    moderationStatus === 'rejected'
                      ? 'Укажите причину отклонения...'
                      : 'Добавьте комментарий (необязательно)...'
                  }
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedListing(null)}>
              Отмена
            </Button>
            <Button
              onClick={handleModerationSubmit}
              disabled={moderationStatus === 'rejected' && !moderationComment.trim()}
            >
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Установить подписку</DialogTitle>
          </DialogHeader>
          
          {subscriptionListing && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">{subscriptionListing.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {subscriptionListing.city}, {subscriptionListing.district}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Количество дней</label>
                <Input
                  type="number"
                  min="1"
                  value={subscriptionDays}
                  onChange={(e) => setSubscriptionDays(parseInt(e.target.value) || 30)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubscriptionDialog(false)}>
              Отмена
            </Button>
            <Button
              onClick={async () => {
                if (!subscriptionListing) return;
                try {
                  await api.adminSetSubscription(token, subscriptionListing.id, subscriptionDays);
                  toast({
                    title: 'Успешно',
                    description: `Подписка установлена на ${subscriptionDays} дней`,
                  });
                  setShowSubscriptionDialog(false);
                  loadPendingListings();
                } catch (error: any) {
                  toast({
                    title: 'Ошибка',
                    description: error.message,
                    variant: 'destructive',
                  });
                }
              }}
            >
              Установить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}