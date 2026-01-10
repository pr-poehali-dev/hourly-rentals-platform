import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface AdminListingFormProps {
  listing: any;
  token: string;
  onClose: () => void;
}

export default function AdminListingForm({ listing, token, onClose }: AdminListingFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    title: listing?.title || '',
    type: listing?.type || 'hotel',
    city: listing?.city || '',
    district: listing?.district || '',
    price: listing?.price || 0,
    rating: listing?.rating || 0,
    reviews: listing?.reviews || 0,
    auction: listing?.auction || 999,
    image_url: listing?.image_url || '',
    metro: listing?.metro || '',
    metro_walk: listing?.metro_walk || 0,
    has_parking: listing?.has_parking || false,
    features: listing?.features || [],
    lat: listing?.lat || 0,
    lng: listing?.lng || 0,
    min_hours: listing?.min_hours || 1,
    rooms: listing?.rooms || [],
  });

  const [newFeature, setNewFeature] = useState('');
  const [newRoom, setNewRoom] = useState({ type: '', price: 0, description: '', image_url: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (listing) {
        await api.updateListing(token, listing.id, formData);
        toast({
          title: 'Успешно',
          description: 'Объект обновлён',
        });
      } else {
        await api.createListing(token, formData);
        toast({
          title: 'Успешно',
          description: 'Объект создан',
        });
      }
      onClose();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось сохранить объект',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isRoomPhoto = false, roomIndex?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result?.toString().split(',')[1];
        if (!base64) return;

        const result = await api.uploadPhoto(token, base64, file.type);
        
        if (result.url) {
          if (isRoomPhoto && roomIndex !== undefined) {
            const updatedRooms = [...formData.rooms];
            updatedRooms[roomIndex].image_url = result.url;
            setFormData({ ...formData, rooms: updatedRooms });
          } else {
            setFormData({ ...formData, image_url: result.url });
          }
          toast({
            title: 'Успешно',
            description: 'Фото загружено',
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить фото',
        variant: 'destructive',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_: any, i: number) => i !== index),
    });
  };

  const addRoom = () => {
    if (newRoom.type && newRoom.price > 0) {
      setFormData({
        ...formData,
        rooms: [...formData.rooms, newRoom],
      });
      setNewRoom({ type: '', price: 0, description: '', image_url: '' });
    }
  };

  const removeRoom = (index: number) => {
    setFormData({
      ...formData,
      rooms: formData.rooms.filter((_: any, i: number) => i !== index),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-purple-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={onClose}>
              <Icon name="ArrowLeft" size={20} />
            </Button>
            <h1 className="text-2xl font-bold">
              {listing ? 'Редактирование объекта' : 'Новый объект'}
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Название</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Тип</label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hotel">Отель</SelectItem>
                      <SelectItem value="apartment">Апартаменты</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Город</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Район</label>
                <Input
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Цена (₽/час)</label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Мин. часов</label>
                  <Input
                    type="number"
                    value={formData.min_hours}
                    onChange={(e) => setFormData({ ...formData, min_hours: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Позиция</label>
                  <Input
                    type="number"
                    value={formData.auction}
                    onChange={(e) => setFormData({ ...formData, auction: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Главное фото</label>
                <div className="flex items-center gap-4">
                  {formData.image_url && (
                    <img src={formData.image_url} alt="Preview" className="w-32 h-32 object-cover rounded" />
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? (
                      <>
                        <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                        Загрузка...
                      </>
                    ) : (
                      <>
                        <Icon name="Upload" size={18} className="mr-2" />
                        Загрузить фото
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="parking"
                  checked={formData.has_parking}
                  onChange={(e) => setFormData({ ...formData, has_parking: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="parking" className="text-sm font-medium">Есть парковка</label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Метро</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Станция метро</label>
                  <Input
                    value={formData.metro}
                    onChange={(e) => setFormData({ ...formData, metro: e.target.value })}
                    placeholder="Арбатская"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Минут пешком</label>
                  <Input
                    type="number"
                    value={formData.metro_walk}
                    onChange={(e) => setFormData({ ...formData, metro_walk: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Координаты</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Широта</label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Долгота</label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Удобства</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.features.map((feature: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="ml-2 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Добавить удобство"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                />
                <Button type="button" onClick={addFeature} variant="outline">
                  <Icon name="Plus" size={18} />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Категории номеров</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.rooms.map((room: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg bg-purple-50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold">{room.type}</div>
                      <div className="text-purple-600 font-bold">{room.price} ₽/час</div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRoom(index)}
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                  {room.image_url && (
                    <img src={room.image_url} alt={room.type} className="w-full h-32 object-cover rounded mb-2" />
                  )}
                  {room.description && (
                    <p className="text-sm text-muted-foreground">{room.description}</p>
                  )}
                </div>
              ))}

              <div className="space-y-3 p-4 border rounded-lg">
                <Input
                  placeholder="Тип номера (например: Стандарт)"
                  value={newRoom.type}
                  onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Цена за час"
                  value={newRoom.price || ''}
                  onChange={(e) => setNewRoom({ ...newRoom, price: parseInt(e.target.value) })}
                />
                <Input
                  placeholder="Описание (опционально)"
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                />
                <Button type="button" onClick={addRoom} variant="outline" className="w-full">
                  <Icon name="Plus" size={18} className="mr-2" />
                  Добавить категорию
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Icon name="Save" size={18} className="mr-2" />
                  Сохранить
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
