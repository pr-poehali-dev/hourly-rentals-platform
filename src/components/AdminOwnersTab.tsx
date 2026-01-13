import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface Owner {
  id: number;
  email: string;
  login?: string;
  full_name: string;
  phone?: string;
  balance: number;
  bonus_balance: number;
  hotels_count: number;
  created_at: string;
  last_login?: string;
  is_archived: boolean;
}

interface Listing {
  id: number;
  title: string;
  city: string;
  district: string;
  owner_id: number | null;
  owner_name?: string;
}

export default function AdminOwnersTab({ token }: { token: string }) {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [availableListings, setAvailableListings] = useState<Listing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedListingIds, setSelectedListingIds] = useState<number[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    login: '',
    password: '',
    full_name: '',
    phone: '',
  });

  useEffect(() => {
    loadOwners();
  }, []);

  const loadOwners = async () => {
    setIsLoading(true);
    try {
      const data = await api.getOwners(token);
      if (data.error) throw new Error(data.error);
      setOwners(data);
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось загрузить владельцев',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedOwner(null);
    setFormData({ email: '', login: '', password: '', full_name: '', phone: '' });
    setShowForm(true);
  };

  const handleEdit = (owner: Owner) => {
    setSelectedOwner(owner);
    setFormData({
      email: owner.email,
      login: owner.login || '',
      password: '',
      full_name: owner.full_name,
      phone: owner.phone || '',
    });
    setShowForm(true);
  };

  const handleArchive = async (owner: Owner) => {
    try {
      await api.archiveOwner(token, owner.id);
      toast({
        title: 'Успешно',
        description: owner.is_archived ? 'Владелец восстановлен из архива' : 'Владелец перемещён в архив',
      });
      loadOwners();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось изменить статус',
        variant: 'destructive',
      });
    }
  };

  const handleAssignListings = async (owner: Owner) => {
    setSelectedOwner(owner);
    setShowAssignModal(true);
    setSearchQuery('');
    setSelectedCity('all');
    setSelectedListingIds([]);
    try {
      const data = await api.getAvailableListings(token);
      setAvailableListings(data);
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось загрузить список отелей',
        variant: 'destructive',
      });
    }
  };

  const handleAssignListing = async (listing: Listing) => {
    if (!selectedOwner) return;
    
    try {
      await api.assignListingToOwner(token, listing.id, selectedOwner.id);
      toast({
        title: 'Успешно',
        description: `Отель "${listing.title}" привязан к владельцу ${selectedOwner.full_name}`,
      });
      
      const data = await api.getAvailableListings(token);
      setAvailableListings(data);
      loadOwners();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось привязать отель',
        variant: 'destructive',
      });
    }
  };

  const handleUnassignListing = async (listing: Listing) => {
    try {
      await api.assignListingToOwner(token, listing.id, null);
      toast({
        title: 'Успешно',
        description: `Отель "${listing.title}" отвязан от владельца`,
      });
      
      const data = await api.getAvailableListings(token);
      setAvailableListings(data);
      loadOwners();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось отвязать отель',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedOwner || selectedListingIds.length === 0) return;
    
    try {
      await Promise.all(
        selectedListingIds.map(id => 
          api.assignListingToOwner(token, id, selectedOwner.id)
        )
      );
      toast({
        title: 'Успешно',
        description: `Привязано отелей: ${selectedListingIds.length}`,
      });
      
      setSelectedListingIds([]);
      const data = await api.getAvailableListings(token);
      setAvailableListings(data);
      loadOwners();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось привязать отели',
        variant: 'destructive',
      });
    }
  };

  const handleToggleListing = (listingId: number) => {
    setSelectedListingIds(prev => 
      prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const handleToggleAll = () => {
    const unassignedListings = filteredListings.filter(l => l.owner_id === null);
    if (selectedListingIds.length === unassignedListings.length) {
      setSelectedListingIds([]);
    } else {
      setSelectedListingIds(unassignedListings.map(l => l.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedOwner) {
        await api.updateOwner(token, { ...formData, id: selectedOwner.id });
        toast({ title: 'Успешно', description: 'Владелец обновлён' });
      } else {
        await api.createOwner(token, formData);
        toast({ title: 'Успешно', description: 'Владелец создан' });
      }
      setShowForm(false);
      loadOwners();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось сохранить владельца',
        variant: 'destructive',
      });
    }
  };

  const cities = Array.from(new Set(availableListings.map(l => l.city))).sort();

  const filteredListings = availableListings.filter((listing) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      listing.title.toLowerCase().includes(query) ||
      listing.city.toLowerCase().includes(query) ||
      listing.district.toLowerCase().includes(query);
    
    const matchesCity = selectedCity === 'all' || listing.city === selectedCity;
    
    return matchesSearch && matchesCity;
  });

  if (showAssignModal && selectedOwner) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Привязка отелей к {selectedOwner.full_name}</CardTitle>
              <Button variant="outline" onClick={() => setShowAssignModal(false)}>
                <Icon name="X" size={18} className="mr-2" />
                Закрыть
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Город</Label>
                <select
                  id="city"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="all">Все города ({availableListings.length})</option>
                  {cities.map(city => {
                    const count = availableListings.filter(l => l.city === city).length;
                    return (
                      <option key={city} value={city}>{city} ({count})</option>
                    );
                  })}
                </select>
              </div>
              <div>
                <Label htmlFor="search">Поиск по названию</Label>
                <Input
                  id="search"
                  placeholder="Введите название отеля..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {selectedListingIds.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <span className="font-semibold">Выбрано отелей: {selectedListingIds.length}</span>
                <Button onClick={handleBulkAssign}>
                  <Icon name="Link" size={16} className="mr-2" />
                  Привязать выбранные
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                checked={selectedListingIds.length === filteredListings.filter(l => l.owner_id === null).length && filteredListings.filter(l => l.owner_id === null).length > 0}
                onCheckedChange={handleToggleAll}
              />
              <Label className="cursor-pointer" onClick={handleToggleAll}>
                Выбрать все свободные отели
              </Label>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {filteredListings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Отели не найдены</p>
              ) : (
                filteredListings.map((listing) => (
                  <Card key={listing.id} className={listing.owner_id === selectedOwner.id ? 'border-purple-500' : ''}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        {listing.owner_id === null && (
                          <Checkbox
                            checked={selectedListingIds.includes(listing.id)}
                            onCheckedChange={() => handleToggleListing(listing.id)}
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold">{listing.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {listing.city}, {listing.district}
                          </p>
                          {listing.owner_name && listing.owner_id !== selectedOwner.id && (
                            <p className="text-xs text-orange-600 mt-1">
                              Привязан к: {listing.owner_name}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {listing.owner_id === selectedOwner.id ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleUnassignListing(listing)}
                            >
                              <Icon name="Unlink" size={16} className="mr-2" />
                              Отвязать
                            </Button>
                          ) : listing.owner_id === null ? (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAssignListing(listing)}
                            >
                              <Icon name="Link" size={16} className="mr-2" />
                              Привязать
                            </Button>
                          ) : (
                            <Badge variant="secondary">Занят</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedOwner ? 'Редактировать владельца' : 'Создать владельца'}
              </CardTitle>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                <Icon name="X" size={18} className="mr-2" />
                Отмена
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="login">Логин (опционально)</Label>
                <Input
                  id="login"
                  value={formData.login}
                  onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                />
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
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold">Владельцы отелей</h2>
          <Badge variant="secondary" className="text-lg px-4 py-1">
            {owners.length}
          </Badge>
        </div>
        <Button
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          onClick={handleCreate}
        >
          <Icon name="Plus" size={18} className="mr-2" />
          Добавить владельца
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Icon name="Loader2" size={48} className="animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="grid gap-4">
          {owners.map((owner) => (
            <Card key={owner.id} className={owner.is_archived ? 'opacity-60' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold">{owner.full_name}</h3>
                        {owner.is_archived && (
                          <Badge variant="secondary">Архив</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{owner.email}</p>
                      {owner.login && (
                        <p className="text-sm text-muted-foreground">Логин: {owner.login}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      {owner.phone && (
                        <div className="flex items-center gap-2">
                          <Icon name="Phone" size={14} />
                          <span>{owner.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Icon name="Hotel" size={14} />
                        <span>Отелей: {owner.hotels_count}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="Wallet" size={14} />
                        <span>Баланс: {owner.balance} ₽</span>
                      </div>
                      {owner.bonus_balance > 0 && (
                        <div className="flex items-center gap-2 text-green-600">
                          <Icon name="Gift" size={14} />
                          <span>Бонусы: {owner.bonus_balance} ₽</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Регистрация: {new Date(owner.created_at).toLocaleDateString('ru-RU')}
                      {owner.last_login && (
                        <> • Последний вход: {new Date(owner.last_login).toLocaleDateString('ru-RU')}</>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssignListings(owner)}
                    >
                      <Icon name="Link" size={16} className="mr-2" />
                      Привязать отели
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(owner)}
                    >
                      <Icon name="Edit" size={16} />
                    </Button>
                    <Button
                      variant={owner.is_archived ? 'default' : 'destructive'}
                      size="sm"
                      onClick={() => handleArchive(owner)}
                    >
                      <Icon name={owner.is_archived ? 'ArchiveRestore' : 'Archive'} size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}