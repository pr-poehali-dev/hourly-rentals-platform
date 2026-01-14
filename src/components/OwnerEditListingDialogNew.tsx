import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import ImageUploader from '@/components/ImageUploader';
import RoomCategoriesManager, { RoomCategory } from '@/components/RoomCategoriesManager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OwnerEditListingDialogNewProps {
  listing: {
    id: number;
    title: string;
    price: number;
    image_url: string;
    district: string;
    city: string;
    metro?: string;
    metro_walk?: number;
    min_hours?: number;
    moderation_status?: string;
    moderation_comment?: string;
    parking_type?: string;
    parking_price_per_hour?: number;
  } | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
}

export default function OwnerEditListingDialogNew({
  listing,
  open,
  onClose,
  onSuccess,
  token,
}: OwnerEditListingDialogNewProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    district: '',
    city: '',
    metro: '',
    metro_walk: 0,
    parking_type: 'none' as 'free' | 'paid' | 'street' | 'none',
    parking_price_per_hour: 0,
  });

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [roomCategories, setRoomCategories] = useState<RoomCategory[]>([]);

  useEffect(() => {
    if (listing && open) {
      setFormData({
        title: listing.title || '',
        district: listing.district || '',
        city: listing.city || '',
        metro: listing.metro || '',
        metro_walk: listing.metro_walk || 0,
        parking_type: listing.parking_type as any || 'none',
        parking_price_per_hour: listing.parking_price_per_hour || 0,
      });

      try {
        const urls = typeof listing.image_url === 'string' 
          ? JSON.parse(listing.image_url) 
          : listing.image_url;
        setImageUrls(Array.isArray(urls) ? urls : [listing.image_url]);
      } catch {
        setImageUrls([listing.image_url]);
      }

      loadRoomCategories();
    }
  }, [listing, open]);

  const loadRoomCategories = async () => {
    if (!listing) return;

    try {
      const response = await fetch(
        `https://functions.poehali.dev/6e7f9cac-b774-46cc-bb47-154f93adb2c9?listing_id=${listing.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRoomCategories(data);
      }
    } catch (error) {
      console.error('Failed to load room categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;

    setIsLoading(true);
    try {
      await api.ownerUpdateListing(token, listing.id, {
        ...formData,
        image_urls: imageUrls,
      });

      await fetch('https://functions.poehali.dev/6e7f9cac-b774-46cc-bb47-154f93adb2c9', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          listing_id: listing.id,
          categories: roomCategories,
        }),
      });

      toast({
        title: 'Изменения отправлены на модерацию',
        description: 'После проверки объект снова станет активным',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  if (!listing) return null;

  const isPending = listing.moderation_status === 'pending';
  const isRejected = listing.moderation_status === 'rejected';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isRejected ? 'Исправить объект и отправить повторно' : 'Редактировать объект'}
          </DialogTitle>
        </DialogHeader>

        {isPending && (
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg flex items-start gap-2">
            <Icon name="Clock" size={20} className="text-orange-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-orange-900">Объект на модерации</p>
              <p className="text-orange-700">Изменения будут применены после проверки администратором</p>
            </div>
          </div>
        )}

        {isRejected && listing.moderation_comment && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-2">
            <Icon name="AlertCircle" size={20} className="text-red-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-red-900">Объект был отклонён</p>
              <p className="text-red-700 mt-1">
                <strong>Комментарий модератора:</strong><br />
                {listing.moderation_comment}
              </p>
              <p className="text-red-700 mt-2">
                Исправьте указанные замечания и отправьте объект на проверку повторно
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="main" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="main">Основная информация</TabsTrigger>
              <TabsTrigger value="rooms">Категории номеров</TabsTrigger>
            </TabsList>

            <TabsContent value="main" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">Название</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Город</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="district">Район</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="metro">Метро</Label>
                  <Input
                    id="metro"
                    value={formData.metro}
                    onChange={(e) => setFormData({ ...formData, metro: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="metro_walk">Пешком до метро (мин)</Label>
                  <Input
                    id="metro_walk"
                    type="number"
                    value={formData.metro_walk}
                    onChange={(e) => setFormData({ ...formData, metro_walk: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Паркинг</Label>
                <Select
                  value={formData.parking_type}
                  onValueChange={(value: any) => setFormData({ ...formData, parking_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип паркинга" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Паркинга нет</SelectItem>
                    <SelectItem value="free">Паркинг бесплатный</SelectItem>
                    <SelectItem value="paid">Паркинг платный</SelectItem>
                    <SelectItem value="street">Стихийная парковка</SelectItem>
                  </SelectContent>
                </Select>
                {formData.parking_type === 'paid' && (
                  <div>
                    <Label htmlFor="parking_price">Стоимость паркинга (₽/час)</Label>
                    <Input
                      id="parking_price"
                      type="number"
                      value={formData.parking_price_per_hour}
                      onChange={(e) => setFormData({ ...formData, parking_price_per_hour: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Фотографии объекта</Label>
                <ImageUploader
                  multiple
                  onUpload={(url) => setImageUrls([...imageUrls, url])}
                />
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt=""
                        className="w-full h-24 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Icon name="Trash2" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rooms" className="space-y-4 mt-4">
              <RoomCategoriesManager
                categories={roomCategories}
                onChange={setRoomCategories}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : isRejected ? (
                'Исправить и отправить'
              ) : (
                'Сохранить'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}