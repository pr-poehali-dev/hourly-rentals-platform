import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';

interface ListingBasicInfoStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const FEATURES = [
  'Wi-Fi',
  'Кондиционер',
  'Телевизор',
  'Мини-бар',
  'Сейф',
  'Фен',
  'Халаты',
  'Тапочки',
  'Утюг',
  'Балкон',
  'Душ',
  'Ванна',
  'Джакузи',
  'Сауна',
  'Бассейн',
  'Фитнес-зал',
  'Ресторан',
  'Бар',
  'Завтрак включен',
  'Круглосуточный ресепшн',
  'Консьерж',
  'Трансфер',
  'Прачечная',
  'Химчистка',
  'Room service',
  'Лифт',
  'Детская кроватка',
  'Разрешены животные',
  'Курение запрещено',
  'Гипоаллергенные номера'
];

export default function ListingBasicInfoStep({ data, onUpdate, onNext, onBack }: ListingBasicInfoStepProps) {
  const selectedCount = (data.features || []).length;
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!data.title?.trim()) {
      newErrors.title = 'Укажите название объекта';
    }

    if (!data.type) {
      newErrors.type = 'Выберите тип объекта';
    }

    if (!data.city?.trim()) {
      newErrors.city = 'Укажите город';
    }

    if (!data.district?.trim()) {
      newErrors.district = 'Укажите район';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const toggleFeature = (feature: string) => {
    const features = data.features || [];
    const newFeatures = features.includes(feature)
      ? features.filter((f: string) => f !== feature)
      : [...features, feature];
    onUpdate({ features: newFeatures });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Building2" size={24} className="text-purple-600" />
          Основная информация об объекте
        </CardTitle>
        <CardDescription>
          Расскажите о вашем объекте размещения
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">Название объекта *</Label>
          <Input
            id="title"
            placeholder="Отель Премиум"
            value={data.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className="text-sm text-red-500 mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <Label htmlFor="type">Тип объекта *</Label>
          <Select value={data.type || ''} onValueChange={(value) => onUpdate({ type: value })}>
            <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
              <SelectValue placeholder="Выберите тип" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Отель/Гостиница">Отель/Гостиница</SelectItem>
              <SelectItem value="Апартаменты/Квартира">Апартаменты/Квартира</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-red-500 mt-1">{errors.type}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">Город *</Label>
            <Input
              id="city"
              placeholder="Москва"
              value={data.city || ''}
              onChange={(e) => onUpdate({ city: e.target.value })}
              className={errors.city ? 'border-red-500' : ''}
            />
            {errors.city && (
              <p className="text-sm text-red-500 mt-1">{errors.city}</p>
            )}
          </div>

          <div>
            <Label htmlFor="district">Район *</Label>
            <Input
              id="district"
              placeholder="Центральный"
              value={data.district || ''}
              onChange={(e) => onUpdate({ district: e.target.value })}
              className={errors.district ? 'border-red-500' : ''}
            />
            {errors.district && (
              <p className="text-sm text-red-500 mt-1">{errors.district}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="description">Описание (необязательно)</Label>
          <Textarea
            id="description"
            placeholder="Опишите ваш объект размещения..."
            rows={4}
            value={data.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
          />
        </div>

        <div>
          <Label>Удобства объекта (необязательно)</Label>
          <p className="text-sm text-muted-foreground mb-3">Выберите все подходящие удобства, которые есть в вашем объекте</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2 max-h-[400px] overflow-y-auto p-2 border rounded-lg">
            {FEATURES.map((feature) => (
              <div key={feature} className="flex items-center space-x-2">
                <Checkbox
                  id={`feature-${feature}`}
                  checked={(data.features || []).includes(feature)}
                  onCheckedChange={() => toggleFeature(feature)}
                />
                <Label
                  htmlFor={`feature-${feature}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {feature}
                </Label>
              </div>
            ))}
          </div>
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