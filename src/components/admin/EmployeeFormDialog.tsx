import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface Employee {
  id: number;
  email: string;
  name: string;
  login: string;
  role: 'superadmin' | 'employee';
  permissions: {
    owners: boolean;
    listings: boolean;
    settings: boolean;
  };
  is_active: boolean;
  created_at: string;
  last_login?: string;
  action_count?: number;
}

interface FormData {
  email: string;
  name: string;
  login: string;
  password: string;
  loginType: 'phone' | 'email';
  role: 'employee' | 'superadmin';
  permissions: {
    owners: boolean;
    listings: boolean;
    settings: boolean;
  };
  is_active: boolean;
}

interface EmployeeFormDialogProps {
  show: boolean;
  editingEmployee: Employee | null;
  formData: FormData;
  onFormDataChange: (data: Partial<FormData>) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function EmployeeFormDialog({
  show,
  editingEmployee,
  formData,
  onFormDataChange,
  onSave,
  onClose,
}: EmployeeFormDialogProps) {
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('7')) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('8')) {
      return '+7' + cleaned.slice(1);
    } else if (cleaned.length > 0) {
      return '+7' + cleaned;
    }
    return value;
  };

  const handleLoginChange = (value: string) => {
    if (formData.loginType === 'phone') {
      onFormDataChange({ login: formatPhoneNumber(value) });
    } else {
      onFormDataChange({ login: value });
    }
  };

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingEmployee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Имя</Label>
              <Input
                value={formData.name}
                onChange={(e) => onFormDataChange({ name: e.target.value })}
                placeholder="Иван Иванов"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => onFormDataChange({ email: e.target.value })}
                placeholder="ivan@example.com"
              />
            </div>
          </div>

          <div>
            <Label>Тип логина</Label>
            <Select
              value={formData.loginType}
              onValueChange={(value: 'phone' | 'email') => 
                onFormDataChange({ loginType: value, login: '' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Телефон</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>
              {formData.loginType === 'phone' ? 'Телефон для входа' : 'Email для входа'}
            </Label>
            <Input
              value={formData.login}
              onChange={(e) => handleLoginChange(e.target.value)}
              placeholder={
                formData.loginType === 'phone' ? '+79991234567' : 'login@example.com'
              }
            />
          </div>

          <div>
            <Label>
              Пароль {editingEmployee && '(оставьте пустым, чтобы не менять)'}
            </Label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => onFormDataChange({ password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          <div>
            <Label>Роль</Label>
            <Select
              value={formData.role}
              onValueChange={(value: 'employee' | 'superadmin') =>
                onFormDataChange({ role: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Сотрудник</SelectItem>
                <SelectItem value="superadmin">Суперадмин</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Права доступа</Label>
            <div className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="Users" size={16} />
                  <span>Владельцы</span>
                </div>
                <Switch
                  checked={formData.permissions.owners}
                  onCheckedChange={(checked) =>
                    onFormDataChange({
                      permissions: { ...formData.permissions, owners: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="Building" size={16} />
                  <span>Объекты</span>
                </div>
                <Switch
                  checked={formData.permissions.listings}
                  onCheckedChange={(checked) =>
                    onFormDataChange({
                      permissions: { ...formData.permissions, listings: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="Settings" size={16} />
                  <span>Настройки</span>
                </div>
                <Switch
                  checked={formData.permissions.settings}
                  onCheckedChange={(checked) =>
                    onFormDataChange({
                      permissions: { ...formData.permissions, settings: checked },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Icon name="Power" size={16} />
              <span>Активен</span>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => onFormDataChange({ is_active: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={onSave}>
            {editingEmployee ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
