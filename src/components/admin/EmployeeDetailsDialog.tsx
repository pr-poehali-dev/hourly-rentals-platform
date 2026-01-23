import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface EmployeeAction {
  id: number;
  action_type: string;
  entity_type: string;
  entity_id: number;
  entity_name: string;
  description: string;
  created_at: string;
  metadata: any;
}

interface EmployeeDetailsDialogProps {
  show: boolean;
  employee: Employee | null;
  actions: EmployeeAction[];
  onClose: () => void;
}

export default function EmployeeDetailsDialog({
  show,
  employee,
  actions,
  onClose,
}: EmployeeDetailsDialogProps) {
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return 'Plus';
      case 'update':
        return 'Edit';
      case 'delete':
        return 'Trash2';
      case 'approve':
        return 'Check';
      case 'reject':
        return 'X';
      default:
        return 'Activity';
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return 'text-green-600';
      case 'update':
        return 'text-blue-600';
      case 'delete':
        return 'text-red-600';
      case 'approve':
        return 'text-green-600';
      case 'reject':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Информация о сотруднике</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Имя</div>
              <div className="font-semibold">{employee.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Email</div>
              <div className="font-semibold">{employee.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Логин</div>
              <div className="font-semibold">@{employee.login}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Роль</div>
              <Badge variant={employee.role === 'superadmin' ? 'default' : 'secondary'}>
                {employee.role === 'superadmin' ? 'Суперадмин' : 'Сотрудник'}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Создан</div>
              <div className="font-semibold">
                {new Date(employee.created_at).toLocaleString('ru-RU')}
              </div>
            </div>
            {employee.last_login && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Последний вход</div>
                <div className="font-semibold">
                  {new Date(employee.last_login).toLocaleString('ru-RU')}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="text-sm font-semibold mb-3">Права доступа</div>
            <div className="flex flex-wrap gap-2">
              {employee.permissions.owners && (
                <Badge variant="outline">
                  <Icon name="Users" size={14} className="mr-1" />
                  Владельцы
                </Badge>
              )}
              {employee.permissions.listings && (
                <Badge variant="outline">
                  <Icon name="Building" size={14} className="mr-1" />
                  Объекты
                </Badge>
              )}
              {employee.permissions.settings && (
                <Badge variant="outline">
                  <Icon name="Settings" size={14} className="mr-1" />
                  Настройки
                </Badge>
              )}
            </div>
          </div>

          <div>
            <div className="text-lg font-semibold mb-3">
              История действий ({actions.length})
            </div>
            {actions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Нет записей о действиях
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {actions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`mt-1 ${getActionColor(action.action_type)}`}>
                      <Icon name={getActionIcon(action.action_type)} size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{action.description}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {action.entity_type}: {action.entity_name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(action.created_at).toLocaleString('ru-RU')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
