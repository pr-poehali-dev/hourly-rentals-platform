import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AdminPanelHeaderProps {
  adminInfo: any;
  hasPermission: (permission: string) => boolean;
  activeTab: 'listings' | 'moderation' | 'owners' | 'employees' | 'bonuses' | 'all-actions';
  onTabChange: (tab: 'listings' | 'moderation' | 'owners' | 'employees' | 'bonuses' | 'all-actions') => void;
  onLogout: () => void;
}

export default function AdminPanelHeader({ adminInfo, hasPermission, activeTab, onTabChange, onLogout }: AdminPanelHeaderProps) {
  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-purple-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">⏰</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Админ-панель 120 минут
                </h1>
                <p className="text-xs text-muted-foreground">
                  {adminInfo?.name} • {adminInfo?.role === 'superadmin' ? 'Суперадминистратор' : 'Сотрудник'}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <Icon name="LogOut" size={18} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pt-8">
        <div className="flex items-center gap-3 mb-6 border-b">
          {hasPermission('listings') && (
            <>
              <Button
                variant={activeTab === 'listings' ? 'default' : 'ghost'}
                onClick={() => onTabChange('listings')}
                className="rounded-b-none"
              >
                <Icon name="Hotel" size={18} className="mr-2" />
                Объекты
              </Button>
              <Button
                variant={activeTab === 'moderation' ? 'default' : 'ghost'}
                onClick={() => onTabChange('moderation')}
                className="rounded-b-none"
              >
                <Icon name="Shield" size={18} className="mr-2" />
                Модерация
              </Button>
            </>
          )}
          {hasPermission('owners') && (
            <Button
              variant={activeTab === 'owners' ? 'default' : 'ghost'}
              onClick={() => onTabChange('owners')}
              className="rounded-b-none"
            >
              <Icon name="Users" size={18} className="mr-2" />
              Владельцы
            </Button>
          )}
          {adminInfo?.role === 'superadmin' && (
            <>
              <Button
                variant={activeTab === 'employees' ? 'default' : 'ghost'}
                onClick={() => onTabChange('employees')}
                className="rounded-b-none"
              >
                <Icon name="UserCog" size={18} className="mr-2" />
                Сотрудники
              </Button>
              <Button
                variant={activeTab === 'bonuses' ? 'default' : 'ghost'}
                onClick={() => onTabChange('bonuses')}
                className="rounded-b-none"
              >
                <Icon name="DollarSign" size={18} className="mr-2" />
                Выплаты
              </Button>
              <Button
                variant={activeTab === 'all-actions' ? 'default' : 'ghost'}
                onClick={() => onTabChange('all-actions')}
                className="rounded-b-none"
              >
                <Icon name="ListChecks" size={18} className="mr-2" />
                Общая работа
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
