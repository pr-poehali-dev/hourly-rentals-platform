import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface Owner {
  id: number;
  email: string;
  login?: string;
  full_name: string;
  phone?: string;
}

interface FormData {
  email: string;
  login: string;
  password: string;
  full_name: string;
  phone: string;
}

interface OwnerFormProps {
  selectedOwner: Owner | null;
  formData: FormData;
  setFormData: (data: FormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function OwnerForm({
  selectedOwner,
  formData,
  setFormData,
  onSubmit,
  onCancel,
}: OwnerFormProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {selectedOwner ? 'Редактировать владельца' : 'Создать владельца'}
            </CardTitle>
            <Button variant="outline" onClick={onCancel}>
              <Icon name="X" size={18} className="mr-2" />
              Отмена
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="login">Логин (номер телефона для входа) *</Label>
              <Input
                id="login"
                placeholder="89991234567"
                value={formData.login}
                onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Этот номер владелец будет использовать для входа в личный кабинет
              </p>
            </div>

            <div>
              <Label htmlFor="password">
                Пароль {selectedOwner ? '(оставьте пустым, чтобы не менять)' : '*'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!selectedOwner}
              />
            </div>

            <div>
              <Label htmlFor="full_name">Полное имя *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                <Icon name="Save" size={18} className="mr-2" />
                {selectedOwner ? 'Сохранить' : 'Создать'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Отмена
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
