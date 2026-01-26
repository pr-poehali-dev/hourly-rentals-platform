import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AdminPanelHeaderProps {
  adminInfo: any;
  hasPermission: (permission: string) => boolean;
  activeTab: 'listings' | 'moderation' | 'recheck' | 'rejected' | 'owners' | 'employees' | 'bonuses' | 'all-actions' | 'call-tracking';
  onTabChange: (tab: 'listings' | 'moderation' | 'recheck' | 'rejected' | 'owners' | 'employees' | 'bonuses' | 'all-actions' | 'call-tracking') => void;
  onLogout: () => void;
}

export default function AdminPanelHeader({ adminInfo, hasPermission, activeTab, onTabChange, onLogout }: AdminPanelHeaderProps) {
  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-purple-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://cdn.poehali.dev/projects/1a35ca30-983f-4a91-b0b4-3c6fa1c9a65b/files/8251a8b2-9b61-4cee-9e68-aae6e7ec6e96.jpg" 
                alt="120 минут" 
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Админ-панель
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
              <Button
                variant={activeTab === 'recheck' ? 'default' : 'ghost'}
                onClick={() => onTabChange('recheck')}
                className="rounded-b-none"
              >
                <Icon name="RefreshCw" size={18} className="mr-2" />
                Повторная проверка
              </Button>
              <Button
                variant={activeTab === 'rejected' ? 'default' : 'ghost'}
                onClick={() => {
                  console.log('[HEADER] Clicked rejected tab');
                  onTabChange('rejected');
                }}
                className="rounded-b-none"
              >
                <Icon name="XCircle" size={18} className="mr-2" />
                Отклонённые
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
              <Button
                variant={activeTab === 'call-tracking' ? 'default' : 'ghost'}
                onClick={() => onTabChange('call-tracking')}
                className="rounded-b-none"
              >
                <Icon name="Phone" size={18} className="mr-2" />
                Звонки
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}