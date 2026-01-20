import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface ListingContactsStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ListingContactsStep({ data, onUpdate, onNext, onBack }: ListingContactsStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!data.phone?.trim()) {
      newErrors.phone = 'Укажите телефон для гостей';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate({ logo_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    onUpdate({ logo_url: '' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Phone" size={24} className="text-purple-600" />
          Контактная информация
        </CardTitle>
        <CardDescription>
          Эти данные будут видны гостям для связи с вами
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="phone">Телефон для гостей *</Label>
          <Input
            id="phone"
            placeholder="+7 (900) 123-45-67"
            value={data.phone || ''}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && (
            <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Этот номер увидят гости для бронирования
          </p>
        </div>

        <div>
          <Label htmlFor="telegram">Telegram (необязательно)</Label>
          <Input
            id="telegram"
            placeholder="@username или https://t.me/username"
            value={data.telegram || ''}
            onChange={(e) => onUpdate({ telegram: e.target.value })}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Гости смогут связаться с вами через Telegram
          </p>
        </div>

        <div>
          <Label htmlFor="logo">Логотип отеля (необязательно)</Label>
          <Input
            id="logo"
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="cursor-pointer"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Рекомендуемый размер: 400×400 пикселей
          </p>
          
          {data.logo_url && (
            <div className="mt-3 relative inline-block">
              <img 
                src={data.logo_url} 
                alt="Logo preview" 
                className="w-32 h-32 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={removeLogo}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            </div>
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
