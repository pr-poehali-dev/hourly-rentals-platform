import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';

interface ListingLocationStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ListingLocationStep({ data, onUpdate, onNext, onBack }: ListingLocationStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!data.address?.trim()) {
      newErrors.address = 'Укажите адрес';
    }

    if (data.has_parking && data.parking_type === 'Платная' && !data.parking_price_per_hour) {
      newErrors.parking_price_per_hour = 'Укажите стоимость парковки';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const addMetroStation = () => {
    const stations = data.metro_stations || [];
    onUpdate({
      metro_stations: [...stations, { station_name: '', walk_minutes: '' }]
    });
  };

  const updateMetroStation = (index: number, field: string, value: string) => {
    const stations = [...(data.metro_stations || [])];
    stations[index] = { ...stations[index], [field]: value };
    onUpdate({ metro_stations: stations });
  };

  const removeMetroStation = (index: number) => {
    const stations = data.metro_stations || [];
    onUpdate({
      metro_stations: stations.filter((_: any, i: number) => i !== index)
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="MapPin" size={24} className="text-purple-600" />
          Местоположение
        </CardTitle>
        <CardDescription>
          Укажите, где находится ваш объект
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="address">Адрес *</Label>
          <Input
            id="address"
            placeholder="ул. Тверская, д. 10"
            value={data.address || ''}
            onChange={(e) => onUpdate({ address: e.target.value })}
            className={errors.address ? 'border-red-500' : ''}
          />
          {errors.address && (
            <p className="text-sm text-red-500 mt-1">{errors.address}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lat">Широта (необязательно)</Label>
            <Input
              id="lat"
              type="number"
              step="0.000001"
              placeholder="55.751244"
              value={data.lat || ''}
              onChange={(e) => onUpdate({ lat: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="lng">Долгота (необязательно)</Label>
            <Input
              id="lng"
              type="number"
              step="0.000001"
              placeholder="37.618423"
              value={data.lng || ''}
              onChange={(e) => onUpdate({ lng: e.target.value })}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground -mt-2">
          Если не указано, координаты будут определены автоматически по адресу
        </p>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Станции метро (необязательно)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMetroStation}
            >
              <Icon name="Plus" size={16} className="mr-1" />
              Добавить станцию
            </Button>
          </div>

          {(data.metro_stations || []).map((station: any, index: number) => (
            <div key={index} className="flex gap-2 mb-2">
              <Input
                placeholder="Название станции"
                value={station.station_name}
                onChange={(e) => updateMetroStation(index, 'station_name', e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Минут пешком"
                value={station.walk_minutes}
                onChange={(e) => updateMetroStation(index, 'walk_minutes', e.target.value)}
                className="w-32"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeMetroStation(index)}
              >
                <Icon name="Trash2" size={16} className="text-red-500" />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_parking"
              checked={data.has_parking || false}
              onCheckedChange={(checked) => {
                onUpdate({ 
                  has_parking: checked,
                  ...(checked ? {} : { parking_type: '', parking_price_per_hour: '' })
                });
              }}
            />
            <Label htmlFor="has_parking" className="text-sm font-normal cursor-pointer">
              Есть парковка
            </Label>
          </div>

          {data.has_parking && (
            <>
              <div>
                <Label htmlFor="parking_type">Тип парковки</Label>
                <Select 
                  value={data.parking_type || ''} 
                  onValueChange={(value) => {
                    onUpdate({ 
                      parking_type: value,
                      ...(value !== 'Платная' ? { parking_price_per_hour: '' } : {})
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Бесплатная">Бесплатная</SelectItem>
                    <SelectItem value="Платная">Платная</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {data.parking_type === 'Платная' && (
                <div>
                  <Label htmlFor="parking_price_per_hour">Стоимость за час (₽)</Label>
                  <Input
                    id="parking_price_per_hour"
                    type="number"
                    placeholder="100"
                    value={data.parking_price_per_hour || ''}
                    onChange={(e) => onUpdate({ parking_price_per_hour: e.target.value })}
                    className={errors.parking_price_per_hour ? 'border-red-500' : ''}
                  />
                  {errors.parking_price_per_hour && (
                    <p className="text-sm text-red-500 mt-1">{errors.parking_price_per_hour}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            Назад
          </Button>
          <Button onClick={handleNext} className="bg-gradient-to-r from-purple-600 to-pink-600">
            Продолжить
            <Icon name="ArrowRight" size={18} className="ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
