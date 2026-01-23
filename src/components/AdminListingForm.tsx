import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableRoomItem from '@/components/admin/SortableRoomItem';
import PhotoGallery from '@/components/admin/PhotoGallery';
import RoomFormDialog from '@/components/admin/RoomFormDialog';

interface AdminListingFormProps {
  listing: any;
  token: string;
  onClose: (shouldReload?: boolean) => void;
}

// BUILD VERSION: 6f87249-QUICK-BUTTONS-v4
export default function AdminListingForm({ listing, token, onClose }: AdminListingFormProps) {
  console.log('✅ AdminListingForm component loaded - VERSION 4.0 - BUILD 6f87249 - Быстрые ярлыки добавлены');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [formData, setFormData] = useState(() => {
    console.log('=== INITIALIZING FORM DATA ===');
    console.log('Listing prop:', listing);
    console.log('Listing rooms:', listing?.rooms);
    if (listing?.rooms && listing.rooms.length > 0) {
      console.log('First room data:', listing.rooms[0]);
    }
    return {
      title: listing?.title || '',
      type: listing?.type || 'hotel',
      city: listing?.city || '',
      district: listing?.district || '',
      price: listing?.price || 0,
      auction: listing?.auction || 999,
      image_url: listing?.image_url || '',
      logo_url: listing?.logo_url || '',
      metro: listing?.metro || '',
      metro_walk: listing?.metro_walk || 0,
      metro_stations: listing?.metro_stations || [],
      has_parking: listing?.has_parking || false,
      has_minibar: listing?.has_minibar || false,
      has_breakfast: listing?.has_breakfast || false,
      has_wifi: listing?.has_wifi || false,
      rooms: listing?.rooms || [],
      images: listing?.images || [],
      rating: listing?.rating || 4.5,
      check_in: listing?.check_in || '14:00',
      check_out: listing?.check_out || '12:00',
      address: listing?.address || '',
      phone: listing?.phone || '',
      email: listing?.email || '',
      website: listing?.website || '',
      description: listing?.description || '',
      rules: listing?.rules || '',
      cancellation_policy: listing?.cancellation_policy || '',
    };
  });

  const [editingRoomIndex, setEditingRoomIndex] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Submitting form data:', formData);
      
      let response;
      if (listing && listing.id) {
        response = await api.updateListing(token, listing.id, formData);
        console.log('Update response:', response);

        toast({
          title: "Объект обновлен",
          description: "Изменения успешно сохранены",
        });
      } else {
        response = await api.createListing(token, formData);
        console.log('Create response:', response);

        if (response.error) {
          throw new Error(response.error);
        }

        toast({
          title: "Объект создан",
          description: "Новый объект успешно добавлен",
        });
      }

      onClose(true);
    } catch (error: any) {
      console.error('Failed to save listing:', error);
      toast({
        title: "Ошибка сохранения",
        description: error.message || "Не удалось сохранить объект",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhoto(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('https://functions.poehali.dev/image-storage?action=upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Ошибка загрузки фото: ${response.statusText}`);
        }

        const data = await response.json();
        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      toast({
        title: "Фото загружено",
        description: `Добавлено ${uploadedUrls.length} фото`,
      });
    } catch (error: any) {
      console.error('Ошибка загрузки фото:', error);
      toast({
        title: "Ошибка загрузки",
        description: error.message || "Не удалось загрузить фото",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('https://functions.poehali.dev/image-storage?action=upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Ошибка загрузки логотипа: ${response.statusText}`);
      }

      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        logo_url: data.url
      }));

      toast({
        title: "Логотип загружен",
        description: "Логотип успешно обновлен",
      });
    } catch (error: any) {
      console.error('Ошибка загрузки логотипа:', error);
      toast({
        title: "Ошибка загрузки",
        description: error.message || "Не удалось загрузить логотип",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const reorderPhotos = (fromIndex: number, toIndex: number) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      const [movedItem] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedItem);
      return { ...prev, images: newImages };
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );

    if (files.length === 0) return;

    setUploadingPhoto(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('https://functions.poehali.dev/image-storage?action=upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Ошибка загрузки фото: ${response.statusText}`);
        }

        const data = await response.json();
        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      toast({
        title: "Фото загружено",
        description: `Добавлено ${uploadedUrls.length} фото`,
      });
    } catch (error: any) {
      console.error('Ошибка загрузки фото:', error);
      toast({
        title: "Ошибка загрузки",
        description: error.message || "Не удалось загрузить фото",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const addRoom = () => {
    const newRoom = {
      type: '',
      price: 0,
      square_meters: 0,
      description: '',
      images: [],
      features: []
    };
    setFormData(prev => ({
      ...prev,
      rooms: [...prev.rooms, newRoom]
    }));
    setEditingRoomIndex(formData.rooms.length);
  };

  const updateRoom = (index: number, updatedRoom: any) => {
    setFormData(prev => ({
      ...prev,
      rooms: prev.rooms.map((room: any, i: number) => i === index ? updatedRoom : room)
    }));
  };

  const removeRoom = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rooms: prev.rooms.filter((_: any, i: number) => i !== index)
    }));
    if (editingRoomIndex === index) {
      setEditingRoomIndex(null);
    }
  };

  const duplicateRoom = (index: number) => {
    const roomToDuplicate = formData.rooms[index];
    const duplicatedRoom = { ...roomToDuplicate };
    setFormData(prev => ({
      ...prev,
      rooms: [...prev.rooms, duplicatedRoom]
    }));
    toast({
      title: "Комната дублирована",
      description: "Комната успешно скопирована",
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.rooms.findIndex((_: any, idx: number) => `room-${idx}` === active.id);
        const newIndex = prev.rooms.findIndex((_: any, idx: number) => `room-${idx}` === over.id);

        return {
          ...prev,
          rooms: arrayMove(prev.rooms, oldIndex, newIndex)
        };
      });
    }
  };

  const addMetroStation = () => {
    setFormData(prev => ({
      ...prev,
      metro_stations: [...prev.metro_stations, { name: '', walk_time: 0, line: '' }]
    }));
  };

  const updateMetroStation = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      metro_stations: prev.metro_stations.map((station: any, i: number) => 
        i === index ? { ...station, [field]: value } : station
      )
    }));
  };

  const removeMetroStation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      metro_stations: prev.metro_stations.filter((_: any, i: number) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <Card className="w-full max-w-6xl my-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Редактирование объекта</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onClose()}>
            <Icon name="X" size={20} />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Название *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Название объекта"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Тип *</label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hotel">Отель</SelectItem>
                    <SelectItem value="apartment">Апартаменты</SelectItem>
                    <SelectItem value="hostel">Хостел</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Город *</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Москва"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Район</label>
                <Input
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="Центральный"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Цена от (₽)</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Приоритет (Auction) *</label>
                <Input
                  type="number"
                  value={formData.auction}
                  onChange={(e) => setFormData({ ...formData, auction: Number(e.target.value) })}
                  placeholder="999"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Адрес</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Полный адрес"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Телефон</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Веб-сайт</label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Заезд</label>
                <Input
                  value={formData.check_in}
                  onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                  placeholder="14:00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Выезд</label>
                <Input
                  value={formData.check_out}
                  onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                  placeholder="12:00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Рейтинг</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                  placeholder="4.5"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Описание</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Подробное описание объекта"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Правила проживания</label>
                <textarea
                  value={formData.rules}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  placeholder="Правила и условия"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Политика отмены</label>
                <textarea
                  value={formData.cancellation_policy}
                  onChange={(e) => setFormData({ ...formData, cancellation_policy: e.target.value })}
                  placeholder="Условия отмены бронирования"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium mb-1">
                <Icon name="Building2" size={16} className="inline mr-1" />
                Логотип отеля
              </label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="w-full"
              >
                {uploadingLogo ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Icon name="Upload" size={16} className="mr-2" />
                    Загрузить логотип
                  </>
                )}
              </Button>
              {formData.logo_url && (
                <div className="mt-2">
                  <img src={formData.logo_url} alt="Logo" className="h-20 object-contain border rounded p-2" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">
                  <Icon name="Train" size={16} className="inline mr-1" />
                  Метро
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMetroStation}
                >
                  <Icon name="Plus" size={16} className="mr-1" />
                  Добавить станцию
                </Button>
              </div>

              {formData.metro_stations && formData.metro_stations.length > 0 && (
                <div className="space-y-2">
                  {formData.metro_stations.map((station: any, index: number) => (
                    <div key={index} className="flex gap-2 items-start p-3 border rounded-lg bg-gray-50">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <Input
                          value={station.name}
                          onChange={(e) => updateMetroStation(index, 'name', e.target.value)}
                          placeholder="Название станции"
                        />
                        <Input
                          type="number"
                          value={station.walk_time}
                          onChange={(e) => updateMetroStation(index, 'walk_time', Number(e.target.value))}
                          placeholder="Минут пешком"
                        />
                        <Input
                          value={station.line}
                          onChange={(e) => updateMetroStation(index, 'line', e.target.value)}
                          placeholder="Линия (например: red)"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMetroStation(index)}
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.has_parking}
                  onChange={(e) => setFormData({ ...formData, has_parking: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm flex items-center gap-1">
                  <Icon name="Car" size={16} />
                  Парковка
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.has_minibar}
                  onChange={(e) => setFormData({ ...formData, has_minibar: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm flex items-center gap-1">
                  <Icon name="Wine" size={16} />
                  Минибар
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.has_breakfast}
                  onChange={(e) => setFormData({ ...formData, has_breakfast: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm flex items-center gap-1">
                  <Icon name="Coffee" size={16} />
                  Завтрак
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.has_wifi}
                  onChange={(e) => setFormData({ ...formData, has_wifi: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm flex items-center gap-1">
                  <Icon name="Wifi" size={16} />
                  WiFi
                </span>
              </label>
            </div>

            <PhotoGallery
              images={formData.images}
              onUpload={handlePhotoUpload}
              onRemove={removePhoto}
              onReorder={reorderPhotos}
              uploadingPhoto={uploadingPhoto}
              isDragging={isDragging}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">
                  <Icon name="Bed" size={16} className="inline mr-1" />
                  Комнаты ({formData.rooms.length})
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRoom}
                >
                  <Icon name="Plus" size={16} className="mr-1" />
                  Добавить комнату
                </Button>
              </div>

              {formData.rooms.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={formData.rooms.map((_: any, idx: number) => `room-${idx}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {formData.rooms.map((room: any, index: number) => (
                        <SortableRoomItem
                          key={`room-${index}`}
                          room={room}
                          index={index}
                          onEdit={(idx) => setEditingRoomIndex(idx)}
                          onRemove={removeRoom}
                          onDuplicate={duplicateRoom}
                          isEditing={editingRoomIndex === index}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Icon name="Save" size={16} className="mr-2" />
                    Сохранить изменения
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose()}
              >
                Отмена
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {editingRoomIndex !== null && (
        <RoomFormDialog
          room={formData.rooms[editingRoomIndex]}
          onSave={(updatedRoom) => {
            updateRoom(editingRoomIndex, updatedRoom);
            setEditingRoomIndex(null);
          }}
          onCancel={() => setEditingRoomIndex(null)}
        />
      )}
    </div>
  );
}