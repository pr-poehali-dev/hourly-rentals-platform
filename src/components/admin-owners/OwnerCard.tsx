import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Owner {
  id: number;
  email: string;
  login?: string;
  full_name: string;
  phone?: string;
  balance: number;
  bonus_balance: number;
  hotels_count: number;
  hotels?: Array<{ id: number; title: string; city: string }>;
  created_at: string;
  last_login?: string;
  is_archived: boolean;
}

interface OwnerCardProps {
  owner: Owner;
  onEdit: (owner: Owner) => void;
  onArchive: (owner: Owner) => void;
  onAssignListings: (owner: Owner) => void;
  onAddBonus: (owner: Owner) => void;
}

export default function OwnerCard({
  owner,
  onEdit,
  onArchive,
  onAssignListings,
  onAddBonus,
}: OwnerCardProps) {
  return (
    <Card className={owner.is_archived ? 'opacity-60' : ''}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold">{owner.full_name}</h3>
                  {owner.is_archived && (
                    <Badge variant="secondary">Архив</Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{owner.email}</p>
                {owner.login && (
                  <p className="text-sm text-muted-foreground">Логин: {owner.login}</p>
                )}
              </div>

              <div className="flex items-center gap-6 text-sm">
                {owner.phone && (
                  <div className="flex items-center gap-2">
                    <Icon name="Phone" size={14} />
                    <span>{owner.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Icon name="Wallet" size={14} />
                  <span>Баланс: {owner.balance} ₽</span>
                </div>
                {owner.bonus_balance > 0 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Icon name="Gift" size={14} />
                    <span>Бонусы: {owner.bonus_balance} ₽</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                Регистрация: {new Date(owner.created_at).toLocaleDateString('ru-RU')}
                {owner.last_login && (
                  <> • Последний вход: {new Date(owner.last_login).toLocaleDateString('ru-RU')}</>
                )}
              </div>

              {owner.hotels && owner.hotels.length > 0 && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Hotel" size={16} className="text-purple-600" />
                    <span className="font-semibold text-sm">Привязанные отели ({owner.hotels.length})</span>
                  </div>
                  <div className="space-y-1">
                    {owner.hotels.map((hotel) => (
                      <div key={hotel.id} className="text-sm flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{hotel.city}</Badge>
                        <span>{hotel.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              size="sm"
              onClick={() => onAssignListings(owner)}
            >
              <Icon name="Link" size={16} className="mr-2" />
              Привязать отели
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddBonus(owner)}
              className="bg-green-50 hover:bg-green-100 border-green-300"
            >
              <Icon name="Gift" size={16} className="mr-1" />
              Бонусы
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(owner)}
            >
              <Icon name="Edit" size={16} />
            </Button>
            <Button
              variant={owner.is_archived ? 'default' : 'destructive'}
              size="sm"
              onClick={() => onArchive(owner)}
            >
              <Icon name={owner.is_archived ? 'ArchiveRestore' : 'Archive'} size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
