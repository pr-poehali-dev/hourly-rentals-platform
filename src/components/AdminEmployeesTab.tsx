import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import EmployeeCard from '@/components/admin/EmployeeCard';
import EmployeeFormDialog from '@/components/admin/EmployeeFormDialog';
import EmployeeDetailsDialog from '@/components/admin/EmployeeDetailsDialog';

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

interface AdminEmployeesTabProps {
  token: string;
}

export default function AdminEmployeesTab({ token }: AdminEmployeesTabProps) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeActions, setEmployeeActions] = useState<EmployeeAction[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    login: '',
    password: '',
    loginType: 'phone' as 'phone' | 'email',
    role: 'employee' as 'employee' | 'superadmin',
    permissions: {
      owners: false,
      listings: true,
      settings: false,
    },
    is_active: true,
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const data = await api.getEmployees(token);
      console.log('Employees data:', data);
      setEmployees(data);
    } catch (error: any) {
      console.error('Failed to fetch employees:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось загрузить сотрудников',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployeeDetails = async (employeeId: number) => {
    try {
      const data = await api.getEmployeeDetails(token, employeeId);
      setSelectedEmployee(data.employee);
      setEmployeeActions(data.actions);
      setShowDetailsDialog(true);
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось загрузить данные',
        variant: 'destructive',
      });
    }
  };

  const handleCreate = () => {
    setEditingEmployee(null);
    setFormData({
      email: '',
      name: '',
      login: '',
      password: '',
      loginType: 'phone',
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
    const loginType = employee.login.includes('@') ? 'email' : 'phone';
    setFormData({
      email: employee.email,
      name: employee.name,
      login: employee.login,
      password: '',
      loginType: loginType,
      role: employee.role,
      permissions: employee.permissions,
      is_active: employee.is_active,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingEmployee) {
        await api.updateEmployee(token, editingEmployee.id, formData);
      } else {
        await api.createEmployee(token, formData);
      }
      
      toast({
        title: 'Успешно',
        description: editingEmployee ? 'Сотрудник обновлен' : 'Сотрудник создан',
      });
      
      setShowDialog(false);
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось сохранить',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого сотрудника?')) return;

    try {
      await api.deleteEmployee(token, id);
      toast({
        title: 'Успешно',
        description: 'Сотрудник удален',
      });
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось удалить',
        variant: 'destructive',
      });
    }
  };

  const handleFormDataChange = (data: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
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
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewDetails={fetchEmployeeDetails}
            />
          ))}
        </div>
      )}

      <EmployeeFormDialog
        show={showDialog}
        editingEmployee={editingEmployee}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        onSave={handleSave}
        onClose={() => setShowDialog(false)}
      />

      <EmployeeDetailsDialog
        show={showDetailsDialog}
        employee={selectedEmployee}
        actions={employeeActions}
        onClose={() => setShowDetailsDialog(false)}
      />
    </div>
  );
}
