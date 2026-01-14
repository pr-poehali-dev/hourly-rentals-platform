import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';

interface OwnerEditListingDialogProps {
  listing: {
    id: number;
    title: string;
    price: number;
    square_meters?: number;
    image_url: string;
    logo_url?: string;
    features?: string[];
    district: string;
    city: string;
    metro?: string;
    metro_walk?: number;
    has_parking?: boolean;
    min_hours?: number;
    lat?: number;
    lng?: number;
    moderation_status?: string;
  } | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
}

export default function OwnerEditListingDialog({
  listing,
  open,
  onClose,
  onSuccess,
  token,
}: OwnerEditListingDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    price: 0,
    square_meters: 0,
    district: '',
    city: '',
    metro: '',
    metro_walk: 0,
    has_parking: false,
    min_hours: 1,
    features: [] as string[],
  });

  const [newFeature, setNewFeature] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    if (listing && open) {
      setFormData({
        title: listing.title || '',
        price: listing.price || 0,
        square_meters: listing.square_meters || 0,
        district: listing.district || '',
        city: listing.city || '',
        metro: listing.metro || '',
        metro_walk: listing.metro_walk || 0,
        has_parking: listing.has_parking || false,
        min_hours: listing.min_hours || 1,
        features: listing.features || [],
      });

      try {
        const urls = typeof listing.image_url === 'string' 
          ? JSON.parse(listing.image_url) 
          : listing.image_url;
        setImageUrls(Array.isArray(urls) ? urls : [listing.image_url]);
      } catch {
        setImageUrls([listing.image_url]);
      }
    }
  }, [listing, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;

    setIsLoading(true);
    try {
      await api.ownerUpdateListing(token, listing.id, {
        ...formData,
        image_urls: imageUrls,
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

  const addImage = () => {
    if (newImageUrl.trim()) {
      setImageUrls([...imageUrls, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData({ ...formData, features: [...formData.features, newFeature.trim()] });
      setNewFeature('');
    }
  };

  const removeFeature = (feature: string) => {
    setFormData({ ...formData, features: formData.features.filter(f => f !== feature) });
  };

  if (!listing) return null;

  const isPending = listing.moderation_status === 'pending';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать объект</DialogTitle>
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="price">Цена за час (₽)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <Label htmlFor="square_meters">Площадь (м²)</Label>
              <Input
                id="square_meters"
                type="number"
                value={formData.square_meters}
                onChange={(e) => setFormData({ ...formData, square_meters: parseInt(e.target.value) || 0 })}
              />
            </div>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_hours">Минимум часов</Label>
              <Input
                id="min_hours"
                type="number"
                value={formData.min_hours}
                onChange={(e) => setFormData({ ...formData, min_hours: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.has_parking}
                  onChange={(e) => setFormData({ ...formData, has_parking: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Есть парковка</span>
              </label>
            </div>
          </div>

          <div>
            <Label>Фотографии</Label>
            <div className="space-y-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <img src={url} alt={`Photo ${index + 1}`} className="w-16 h-16 object-cover rounded" />
                  <Input value={url} readOnly className="flex-1" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeImage(index)}
                  >
                    <Icon name="X" size={16} />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="URL фотографии"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                />
                <Button type="button" onClick={addImage} size="sm">
                  <Icon name="Plus" size={16} />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label>Удобства</Label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {formData.features.map((feature) => (
                  <div key={feature} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full flex items-center gap-2 text-sm">
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeature(feature)}
                      className="hover:text-purple-900"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Добавить удобство"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                />
                <Button type="button" onClick={addFeature} size="sm">
                  <Icon name="Plus" size={16} />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Icon name="Save" size={16} className="mr-2" />
                  Сохранить и отправить на модерацию
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-900">
            <Icon name="Info" size={16} className="inline mr-2" />
            После отправки изменений объект будет временно снят с публикации до проверки администратором. 
            Подписка продолжит работать.
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
