import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface ListingReviewStepProps {
  data: any;
  onBack: () => void;
  onSubmit: () => void;
  onEdit: (step: number) => void;
}

export default function ListingReviewStep({ data, onBack, onSubmit, onEdit }: ListingReviewStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="CheckCircle2" size={24} className="text-purple-600" />
          Проверьте данные перед отправкой
        </CardTitle>
        <CardDescription>
          Убедитесь, что вся информация указана корректно
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Owner Info */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Icon name="User" size={18} className="text-purple-600" />
              Информация о владельце
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onEdit(0)}>
              <Icon name="Pencil" size={14} className="mr-1" />
              Изменить
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Имя:</span> <strong>{data.owner_full_name}</strong></p>
            <p><span className="text-muted-foreground">Email:</span> <strong>{data.owner_email}</strong></p>
            <p><span className="text-muted-foreground">Телефон:</span> <strong>{data.owner_phone}</strong></p>
            {data.owner_telegram && (
              <p><span className="text-muted-foreground">Telegram:</span> <strong>{data.owner_telegram}</strong></p>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Icon name="Building2" size={18} className="text-purple-600" />
              Основная информация
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onEdit(1)}>
              <Icon name="Pencil" size={14} className="mr-1" />
              Изменить
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Название:</span> <strong>{data.title}</strong></p>
            <p><span className="text-muted-foreground">Тип:</span> <strong>{data.type}</strong></p>
            <p><span className="text-muted-foreground">Город:</span> <strong>{data.city}</strong></p>
            <p><span className="text-muted-foreground">Район:</span> <strong>{data.district}</strong></p>
            {data.description && (
              <p><span className="text-muted-foreground">Описание:</span> {data.description}</p>
            )}
            {data.features && data.features.length > 0 && (
              <div>
                <span className="text-muted-foreground">Удобства:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.features.map((feature: string) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Icon name="MapPin" size={18} className="text-purple-600" />
              Местоположение
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onEdit(2)}>
              <Icon name="Pencil" size={14} className="mr-1" />
              Изменить
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Адрес:</span> <strong>{data.address}</strong></p>
            {data.lat && data.lng && (
              <p><span className="text-muted-foreground">Координаты:</span> {data.lat}, {data.lng}</p>
            )}
            {data.metro_stations && data.metro_stations.length > 0 && (
              <div>
                <span className="text-muted-foreground">Станции метро:</span>
                <ul className="list-disc list-inside mt-1">
                  {data.metro_stations.map((station: any, idx: number) => (
                    <li key={idx}>
                      {station.station_name} ({station.walk_minutes} мин пешком)
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.has_parking && (
              <div>
                <p><span className="text-muted-foreground">Парковка:</span> {data.parking_type}</p>
                {data.parking_type === 'Платная' && data.parking_price_per_hour && (
                  <p><span className="text-muted-foreground">Стоимость:</span> {data.parking_price_per_hour} ₽/час</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Rooms */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Icon name="Hotel" size={18} className="text-purple-600" />
              Номера ({data.rooms?.length || 0})
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onEdit(3)}>
              <Icon name="Pencil" size={14} className="mr-1" />
              Изменить
            </Button>
          </div>
          {data.rooms && data.rooms.length > 0 ? (
            <div className="space-y-3">
              {data.rooms.map((room: any, idx: number) => (
                <div key={idx} className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <strong>{room.type}</strong>
                    <Badge>{room.price} ₽/час</Badge>
                  </div>
                  {room.description && (
                    <p className="text-sm text-muted-foreground mb-1">{room.description}</p>
                  )}
                  {room.square_meters && (
                    <p className="text-sm text-muted-foreground">Площадь: {room.square_meters} м²</p>
                  )}
                  <p className="text-sm text-muted-foreground">Минимум часов: {room.min_hours}</p>
                  {room.features && room.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {room.features.map((feature: string) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {room.images && room.images.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {room.images.map((img: string, imgIdx: number) => (
                        <img
                          key={imgIdx}
                          src={img}
                          alt={`Room ${idx + 1} - ${imgIdx + 1}`}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Номера не добавлены</p>
          )}
        </div>

        {/* Contacts */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Icon name="Phone" size={18} className="text-purple-600" />
              Контактная информация
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onEdit(4)}>
              <Icon name="Pencil" size={14} className="mr-1" />
              Изменить
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Телефон для гостей:</span> <strong>{data.phone}</strong></p>
            {data.telegram && (
              <p><span className="text-muted-foreground">Telegram:</span> <strong>{data.telegram}</strong></p>
            )}
            {data.logo_url && (
              <div>
                <span className="text-muted-foreground block mb-2">Логотип:</span>
                <img src={data.logo_url} alt="Logo" className="w-24 h-24 object-cover rounded-lg border" />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-2 text-blue-800 mb-2">
            <Icon name="Info" size={18} />
            <p className="text-sm font-semibold">Что дальше?</p>
          </div>
          <p className="text-sm text-blue-700">
            После отправки заявки мы проверим указанные данные. Обычно модерация занимает до 24 часов.
            После одобрения вы получите доступ к личному кабинету на указанный email.
          </p>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            Назад
          </Button>
          <Button 
            onClick={onSubmit} 
            className="bg-gradient-to-r from-purple-600 to-pink-600"
            size="lg"
          >
            <Icon name="Send" size={18} className="mr-2" />
            Отправить на модерацию
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
