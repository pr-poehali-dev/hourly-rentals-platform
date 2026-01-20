import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface OwnerInfoStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

export default function OwnerInfoStep({ data, onUpdate, onNext }: OwnerInfoStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!data.owner_full_name.trim()) {
      newErrors.owner_full_name = 'Укажите ваше имя';
    }

    if (!data.owner_email.trim()) {
      newErrors.owner_email = 'Укажите email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.owner_email)) {
      newErrors.owner_email = 'Неверный формат email';
    }

    if (!data.owner_phone.trim()) {
      newErrors.owner_phone = 'Укажите телефон';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="User" size={24} className="text-purple-600" />
          Расскажите о себе
        </CardTitle>
        <CardDescription>
          Эти данные нужны для создания вашего аккаунта в системе управления объектами
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="owner_full_name">Ваше имя *</Label>
          <Input
            id="owner_full_name"
            placeholder="Иван Иванов"
            value={data.owner_full_name}
            onChange={(e) => onUpdate({ owner_full_name: e.target.value })}
            className={errors.owner_full_name ? 'border-red-500' : ''}
          />
          {errors.owner_full_name && (
            <p className="text-sm text-red-500 mt-1">{errors.owner_full_name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="owner_email">Email *</Label>
          <Input
            id="owner_email"
            type="email"
            placeholder="ivan@example.com"
            value={data.owner_email}
            onChange={(e) => onUpdate({ owner_email: e.target.value })}
            className={errors.owner_email ? 'border-red-500' : ''}
          />
          {errors.owner_email && (
            <p className="text-sm text-red-500 mt-1">{errors.owner_email}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            На этот адрес мы отправим данные для входа после модерации
          </p>
        </div>

        <div>
          <Label htmlFor="owner_phone">Телефон *</Label>
          <Input
            id="owner_phone"
            placeholder="+7 (900) 123-45-67"
            value={data.owner_phone}
            onChange={(e) => onUpdate({ owner_phone: e.target.value })}
            className={errors.owner_phone ? 'border-red-500' : ''}
          />
          {errors.owner_phone && (
            <p className="text-sm text-red-500 mt-1">{errors.owner_phone}</p>
          )}
        </div>

        <div>
          <Label htmlFor="owner_telegram">Telegram (необязательно)</Label>
          <Input
            id="owner_telegram"
            placeholder="@username или https://t.me/username"
            value={data.owner_telegram}
            onChange={(e) => onUpdate({ owner_telegram: e.target.value })}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleNext} className="bg-gradient-to-r from-purple-600 to-pink-600">
            Продолжить
            <Icon name="ArrowRight" size={18} className="ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
