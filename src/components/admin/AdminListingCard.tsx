import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import LiveCountdown from './LiveCountdown';

interface AdminListingCardProps {
  listing: any;
  cityListings: any[];
  adminInfo: any;
  formatSubscriptionStatus: (listing: any) => { text: string; variant: 'destructive' | 'default' | 'secondary'; daysLeft: number | null };
  onEdit: (listing: any) => void;
  onArchive: (id: number) => void;
  onDelete?: (id: number) => void;
  onChangePosition: (listingId: number, newPosition: number) => void;
  onSetSubscription: (listing: any) => void;
  onModerate: (listing: any) => void;
  onExpertRate?: (listing: any) => void;
}

export default function AdminListingCard({
  listing,
  cityListings,
  adminInfo,
  formatSubscriptionStatus,
  onEdit,
  onArchive,
  onDelete,
  onChangePosition,
  onSetSubscription,
  onModerate,
  onExpertRate,
}: AdminListingCardProps) {
  return (
    <Card className={listing.is_archived ? 'opacity-60' : ''}>
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
        {listing.moderation_status === 'pending' && !listing.is_archived && (
          <Badge className="absolute top-3 left-3 bg-orange-500">
            <Icon name="Clock" size={12} className="mr-1" />
            На модерации
          </Badge>
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
              onValueChange={(value) => onChangePosition(listing.id, parseInt(value))}
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
                onClick={() => onEdit(listing)}
              >
                <Icon name="Edit" size={16} className="mr-1" />
                Редактировать
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSetSubscription(listing)}
                title="Установить подписку"
              >
                <Icon name="Clock" size={16} />
              </Button>
              {!listing.is_archived ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onArchive(listing.id)}
                >
                  <Icon name="Archive" size={16} />
                </Button>
              ) : adminInfo?.role === 'superadmin' && onDelete ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(listing.id)}
                  title="Удалить навсегда"
                >
                  <Icon name="Trash2" size={16} />
                </Button>
              ) : null}
            </div>
            
            {listing.submitted_for_moderation && adminInfo?.role === 'superadmin' && (
              <Button
                variant={listing.moderation_status === 'approved' ? 'secondary' : 'default'}
                size="sm"
                className="w-full"
                onClick={() => onModerate(listing)}
              >
                <Icon name="CheckCircle" size={16} className="mr-1" />
                {listing.moderation_status === 'approved' ? 'Изменить модерацию' : 'Модерировать'}
              </Button>
            )}
            
            {onExpertRate && (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                onClick={() => onExpertRate(listing)}
              >
                <Icon name="Award" size={16} className="mr-1" />
                {listing.expert_fullness_rating ? 'Изменить оценку' : 'Экспертная оценка'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}