import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import AdminListingForm from '@/components/AdminListingForm';
import AdminOwnersTab from '@/components/AdminOwnersTab';
import AdminEmployeesTab from '@/components/AdminEmployeesTab';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'listings' | 'owners' | 'employees'>('listings');
  const [listings, setListings] = useState<any[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = localStorage.getItem('adminToken');
  
  // Проверка прав доступа
  const hasPermission = (permission: string) => {
    if (!adminInfo?.permissions) return false;
    return adminInfo.permissions[permission] === true;
  };

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    // Загрузка информации об администраторе из токена
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      setAdminInfo(tokenPayload);
    } catch (e) {
      console.error('Invalid token', e);
      handleLogout();
      return;
    }
    
    loadListings();
  }, [showArchived, token, navigate]);

  const loadListings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getListings(token!, showArchived);
      console.log('=== LOADED LISTINGS FROM API ===');
      console.log('Total listings:', data.length);
      if (data.length > 0) {
        console.log('First listing rooms:', data[0].rooms);
      }
      if (data.error) {
        throw new Error(data.error);
      }
      const sortedData = [...data].sort((a, b) => b.id - a.id);
      setListings(sortedData);
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось загрузить объекты',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const handleArchive = async (id: number) => {
    try {
      await api.archiveListing(token!, id);
      toast({
        title: 'Успешно',
        description: 'Объект перемещён в архив',
      });
      loadListings();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось архивировать объект',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (listing: any) => {
    console.log('=== OPENING EDIT FORM ===');
    console.log('Listing to edit:', listing);
    console.log('Listing rooms:', listing.rooms);
    setSelectedListing(listing);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedListing(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedListing(null);
    loadListings();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
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
            <Button variant="outline" onClick={handleLogout}>
              <Icon name="LogOut" size={18} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6 border-b">
          {hasPermission('listings') && (
            <Button
              variant={activeTab === 'listings' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('listings')}
              className="rounded-b-none"
            >
              <Icon name="Hotel" size={18} className="mr-2" />
              Объекты
            </Button>
          )}
          {hasPermission('owners') && (
            <Button
              variant={activeTab === 'owners' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('owners')}
              className="rounded-b-none"
            >
              <Icon name="Users" size={18} className="mr-2" />
              Владельцы
            </Button>
          )}
          {adminInfo?.role === 'superadmin' && (
            <Button
              variant={activeTab === 'employees' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('employees')}
              className="rounded-b-none"
            >
              <Icon name="UserCog" size={18} className="mr-2" />
              Сотрудники
            </Button>
          )}
        </div>

        {showForm ? (
          <AdminListingForm
            listing={selectedListing}
            token={token!}
            onClose={handleFormClose}
          />
        ) : activeTab === 'owners' && hasPermission('owners') ? (
          <AdminOwnersTab token={token!} />
        ) : activeTab === 'employees' && adminInfo?.role === 'superadmin' ? (
          <AdminEmployeesTab token={token!} />
        ) : hasPermission('listings') ? (
        <>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold">Объекты</h2>
            <Badge variant="secondary" className="text-lg px-4 py-1">
              {listings.length}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={showArchived ? 'default' : 'outline'}
              onClick={() => setShowArchived(!showArchived)}
            >
              <Icon name="Archive" size={18} className="mr-2" />
              {showArchived ? 'Скрыть архив' : 'Показать архив'}
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={handleCreate}
            >
              <Icon name="Plus" size={18} className="mr-2" />
              Добавить объект
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Icon name="Loader2" size={48} className="animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Card key={listing.id} className={listing.is_archived ? 'opacity-60' : ''}>
                <div className="relative">
                  {listing.image_url ? (
                    <img src={listing.image_url} alt={listing.title} className="h-48 w-full object-cover" />
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center text-6xl">
                      🏨
                    </div>
                  )}
                  {listing.logo_url && (
                    <div className="absolute top-3 right-3 w-12 h-12 border rounded bg-white/90 backdrop-blur-sm p-1 flex items-center justify-center">
                      <img src={listing.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                  {listing.is_archived && (
                    <Badge variant="secondary" className="absolute top-3 left-3">Архив</Badge>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl mb-2">{listing.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon name="MapPin" size={14} />
                        <span>{listing.city}, {listing.district}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Цена:</span>
                      <span className="text-lg font-bold text-purple-600">{listing.price} ₽/час</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Рейтинг:</span>
                      <div className="flex items-center gap-1">
                        <Icon name="Star" size={14} className="text-yellow-500" />
                        <span className="font-semibold">{listing.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Позиция:</span>
                      <Badge variant="outline">#{listing.auction}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Номеров:</span>
                      <span className="font-semibold">{listing.rooms?.length || 0}</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(listing)}
                      >
                        <Icon name="Edit" size={16} className="mr-1" />
                        Редактировать
                      </Button>
                      {!listing.is_archived && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleArchive(listing.id)}
                        >
                          <Icon name="Archive" size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && listings.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-2xl font-bold mb-2">Объектов пока нет</h3>
            <p className="text-muted-foreground mb-6">Добавьте первый объект для начала работы</p>
            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={handleCreate}
            >
              <Icon name="Plus" size={18} className="mr-2" />
              Добавить объект
            </Button>
          </div>
        )}
        </>
        ) : null}
      </main>
    </div>
  );
}