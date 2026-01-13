import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import func2url from '../../backend/func2url.json';

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
}

interface AdminEmployeesTabProps {
  token: string;
}

export default function AdminEmployeesTab({ token }: AdminEmployeesTabProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    login: '',
    password: '',
    role: 'employee' as 'employee' | 'superadmin',
    permissions: {
      owners: false,
      listings: true,
      settings: false,
    },
    is_active: true,
  });

  const apiUrl = func2url['admin-employees'];

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEmployee(null);
    setFormData({
      email: '',
      name: '',
      login: '',
      password: '',
      role: 'employee',
      permissions: {
        owners: false,
        listings: true,
        settings: false,
      },
      is_active: true,
    });
    setShowDialog(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      email: employee.email,
      name: employee.name,
      login: employee.login,
      password: '',
      role: employee.role,
      permissions: employee.permissions,
      is_active: employee.is_active,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      const payload = editingEmployee
        ? { id: editingEmployee.id, ...formData }
        : formData;

      const response = await fetch(apiUrl, {
        method: editingEmployee ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowDialog(false);
        fetchEmployees();
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при сохранении');
      }
    } catch (error) {
      console.error('Failed to save employee:', error);
      alert('Ошибка при сохранении');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого сотрудника?')) return;

    try {
      const response = await fetch(`${apiUrl}?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchEmployees();
      }
    } catch (error) {
      console.error('Failed to delete employee:', error);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'superadmin' ? 'default' : 'secondary';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold">Сотрудники</h2>
          <Badge variant="secondary" className="text-lg px-4 py-1">
            {employees.length}
          </Badge>
        </div>
        <Button
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          onClick={handleCreate}
        >
          <Icon name="UserPlus" size={18} className="mr-2" />
          Добавить сотрудника
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Icon name="Loader2" size={48} className="animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <Card key={employee.id} className={!employee.is_active ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl mb-2">{employee.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Icon name="Mail" size={14} />
                      <span className="truncate">{employee.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon name="User" size={14} />
                      <span>@{employee.login}</span>
                    </div>
                  </div>
                  <Badge variant={getRoleBadgeVariant(employee.role)}>
                    {employee.role === 'superadmin' ? 'Суперадмин' : 'Сотрудник'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold mb-2">Права доступа:</div>
                    <div className="flex flex-wrap gap-2">
                      {employee.permissions.owners && (
                        <Badge variant="outline" className="text-xs">
                          <Icon name="Users" size={12} className="mr-1" />
                          Владельцы
                        </Badge>
                      )}
                      {employee.permissions.listings && (
                        <Badge variant="outline" className="text-xs">
                          <Icon name="Building" size={12} className="mr-1" />
                          Объекты
                        </Badge>
                      )}
                      {employee.permissions.settings && (
                        <Badge variant="outline" className="text-xs">
                          <Icon name="Settings" size={12} className="mr-1" />
                          Настройки
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Статус:</span>
                    <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                      {employee.is_active ? 'Активен' : 'Неактивен'}
                    </Badge>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(employee)}
                    >
                      <Icon name="Edit" size={16} className="mr-1" />
                      Редактировать
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(employee.id)}
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && employees.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-2xl font-bold mb-2">Сотрудников пока нет</h3>
          <p className="text-muted-foreground mb-6">
            Добавьте первого сотрудника для начала работы
          </p>
          <Button
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={handleCreate}
          >
            <Icon name="UserPlus" size={18} className="mr-2" />
            Добавить сотрудника
          </Button>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'Редактировать сотрудника' : 'Новый сотрудник'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Имя</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Иван Иванов"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="login">Логин</Label>
                <Input
                  id="login"
                  value={formData.login}
                  onChange={(e) =>
                    setFormData({ ...formData, login: e.target.value })
                  }
                  placeholder="username"
                  disabled={!!editingEmployee}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Пароль {editingEmployee && '(оставьте пустым для сохранения текущего)'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Роль</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'employee' | 'superadmin') =>
                  setFormData({ ...formData, role: value })
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
              <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="Users" size={16} />
                    <span className="text-sm">Управление владельцами</span>
                  </div>
                  <Switch
                    checked={formData.permissions.owners}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        permissions: { ...formData.permissions, owners: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="Building" size={16} />
                    <span className="text-sm">Управление объектами</span>
                  </div>
                  <Switch
                    checked={formData.permissions.listings}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        permissions: { ...formData.permissions, listings: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="Settings" size={16} />
                    <span className="text-sm">Настройки системы</span>
                  </div>
                  <Switch
                    checked={formData.permissions.settings}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        permissions: { ...formData.permissions, settings: checked },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Icon name="UserCheck" size={16} />
                <span className="text-sm">Активный аккаунт</span>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Отмена
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={handleSave}
            >
              {editingEmployee ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
