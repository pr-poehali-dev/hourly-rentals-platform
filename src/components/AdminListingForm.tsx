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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AdminListingFormProps {
  listing: any;
  token: string;
  onClose: () => void;
}

interface SortableRoomItemProps {
  room: any;
  index: number;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  onDuplicate: (index: number) => void;
  isEditing: boolean;
}

function SortableRoomItem({ room, index, onEdit, onRemove, onDuplicate, isEditing }: SortableRoomItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `room-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 border rounded-lg transition-all ${
        isEditing 
          ? 'bg-purple-100 border-purple-400 border-2 shadow-md' 
          : 'bg-purple-50 border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-purple-600 transition-colors"
          >
            <Icon name="GripVertical" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="font-semibold text-lg">{room.type}</div>
              {isEditing && (
                <Badge variant="default" className="bg-purple-600">
                  <Icon name="Edit" size={12} className="mr-1" />
                  Редактируется
                </Badge>
              )}
            </div>
            <div className="text-purple-600 font-bold text-xl">{room.price} ₽/час</div>
            {room.square_meters > 0 && (
              <Badge variant="secondary" className="mt-1">
                {room.square_meters} м²
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(index)}
            title="Редактировать"
          >
            <Icon name="Edit" size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(index)}
            title="Дублировать"
          >
            <Icon name="Copy" size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            title="Удалить"
          >
            <Icon name="Trash2" size={16} />
          </Button>
        </div>
      </div>
      
      {room.images && Array.isArray(room.images) && room.images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mb-3 ml-8">
          {room.images.map((img: string, imgIdx: number) => (
            <div key={imgIdx} className="relative flex-shrink-0">
              <img 
                src={img} 
                alt={`${room.type} ${imgIdx + 1}`} 
                className="w-24 h-24 object-cover rounded border-2 border-purple-200" 
              />
              <div className="absolute top-1 left-1 bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {imgIdx + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {room.features && Array.isArray(room.features) && room.features.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {room.features.map((feature: string, fIdx: number) => (
            <Badge key={fIdx} variant="outline" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
      )}

      {room.description && (
        <p className="text-sm text-muted-foreground ml-8">{room.description}</p>
      )}
    </div>
  );
}

export default function AdminListingForm({ listing, token, onClose }: AdminListingFormProps) {
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

  const [formData, setFormData] = useState({
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
    has_parking: listing?.has_parking || false,
    features: listing?.features || [],
    lat: listing?.lat || 0,
    lng: listing?.lng || 0,
    min_hours: listing?.min_hours || 1,
    rooms: listing?.rooms || [],
    phone: listing?.phone || '',
    telegram: listing?.telegram || '',
  });

  const [newRoom, setNewRoom] = useState({ 
    type: '', 
    price: 0, 
    description: '', 
    images: [] as string[], 
    square_meters: 0,
    features: [] as string[],
    min_hours: 1,
    payment_methods: 'Наличные, банковская карта при заселении' as string,
    cancellation_policy: 'Бесплатная отмена за 1 час до заселения' as string
  });
  const [uploadingRoomPhotos, setUploadingRoomPhotos] = useState(false);
  const [editingRoomIndex, setEditingRoomIndex] = useState<number | null>(null);
  const [draggingPhotoIndex, setDraggingPhotoIndex] = useState<number | null>(null);

  const roomTemplates = [
    {
      name: 'Стандарт',
      type: 'Стандарт',
      description: 'Комфортный номер с базовым набором удобств',
      square_meters: 18,
      features: ['WiFi', 'Двуспальная кровать', 'Смарт ТВ', 'Кондиционер', 'Душевая кабина', 'Фен', 'Холодильник', 'Чайник'],
    },
    {
      name: 'Комфорт',
      type: 'Комфорт',
      description: 'Улучшенный номер с расширенным набором удобств',
      square_meters: 25,
      features: ['WiFi', 'Двуспальная кровать', 'Смарт ТВ', 'Кондиционер', 'Душевая кабина', 'Фен', 'Халаты', 'Тапочки', 'Холодильник', 'Микроволновка', 'Чайник', 'Посуда', 'Сейф'],
    },
    {
      name: 'Люкс',
      type: 'Люкс',
      description: 'Роскошный номер премиум класса',
      square_meters: 35,
      features: ['WiFi', 'Двуспальная кровать', 'Смарт ТВ', 'Кондиционер', 'Джакузи', 'Фен', 'Халаты', 'Тапочки', 'Холодильник', 'Микроволновка', 'Чайник', 'Посуда', 'Сейф', 'Зеркала', 'Музыкальная система'],
    },
    {
      name: 'Студия',
      type: 'Студия',
      description: 'Просторный номер с кухонной зоной',
      square_meters: 30,
      features: ['WiFi', 'Двуспальная кровать', 'Смарт ТВ', 'Кондиционер', 'Душевая кабина', 'Фен', 'Холодильник', 'Микроволновка', 'Чайник', 'Посуда', 'Обеденный стол', 'Диван'],
    },
    {
      name: 'Романтик',
      type: 'Романтик',
      description: 'Номер с романтической атмосферой для пар',
      square_meters: 28,
      features: ['WiFi', 'Двуспальная кровать', 'Смарт ТВ', 'Кондиционер', 'Джакузи', 'Фен', 'Халаты', 'Тапочки', 'Холодильник', 'Чайник', 'Зеркала', 'Музыкальная система', 'Ароматерапия'],
    },
    {
      name: 'VIP',
      type: 'VIP',
      description: 'Эксклюзивный номер с максимальным комфортом',
      square_meters: 45,
      features: ['WiFi', 'Двуспальная кровать', 'Смарт ТВ', 'Кондиционер', 'Джакузи', 'Фен', 'Халаты', 'Тапочки', 'Холодильник', 'Микроволновка', 'Чайник', 'Посуда', 'Сейф', 'Зеркала', 'Музыкальная система', 'PlayStation', 'Настольные игры', 'Диван', 'Обеденный стол'],
    },
  ];

  const availableFeatures = [
    'WiFi',
    'Двуспальная кровать',
    '2 односпальные кровати',
    'Смарт ТВ',
    'Кондиционер',
    'Джакузи',
    'Душевая кабина',
    'Фен',
    'Халаты',
    'Тапочки',
    'Холодильник',
    'Микроволновка',
    'Чайник',
    'Посуда',
    'Сейф',
    'Зеркала',
    'Музыкальная система',
    'Настольные игры',
    'PlayStation',
    'Бар',
    'Косметика',
    'Полотенца',
    'Постельное бельё',
    'Кухня',
  ];

  const geocodeAddress = async (city: string, address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const fullAddress = `${city}, ${address}`;
      const response = await fetch(
        `https://geocode-maps.yandex.ru/1.x/?apikey=99b1f0e4-c9e6-4e09-b735-29881250fb58&geocode=${encodeURIComponent(fullAddress)}&format=json`
      );
      const data = await response.json();
      const geoObject = data.response.GeoObjectCollection.featureMember[0];
      if (geoObject) {
        const coords = geoObject.GeoObject.Point.pos.split(' ');
        return { lat: parseFloat(coords[1]), lng: parseFloat(coords[0]) };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let finalData = { ...formData };

      console.log('=== SAVING LISTING ===');
      console.log('formData.rooms:', formData.rooms);
      console.log('formData.rooms length:', formData.rooms?.length);
      console.log('Full formData:', finalData);

      if (formData.city && formData.district) {
        const coords = await geocodeAddress(formData.city, formData.district);
        if (coords) {
          finalData = { ...finalData, lat: coords.lat, lng: coords.lng };
          toast({
            title: 'Координаты определены',
            description: `Объект размещён на карте`,
          });
        }
      }

      console.log('Sending to server:', finalData);
      console.log('Rooms count:', finalData.rooms?.length);

      if (listing) {
        await api.updateListing(token, listing.id, finalData);
        toast({
          title: 'Успешно',
          description: 'Объект обновлён',
        });
      } else {
        await api.createListing(token, finalData);
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result?.toString().split(',')[1];
        if (!base64) return;

        const result = await api.uploadPhoto(token, base64, file.type);
        
        if (result.url) {
          setFormData({ ...formData, logo_url: result.url });
          toast({
            title: 'Успешно',
            description: 'Логотип загружен',
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить логотип',
        variant: 'destructive',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const uploadRoomPhotosFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const currentImages = Array.isArray(newRoom.images) ? newRoom.images : [];
    if (currentImages.length + files.length > 10) {
      toast({
        title: 'Ошибка',
        description: 'Максимум 10 фото на номер',
        variant: 'destructive',
      });
      return;
    }

    setUploadingRoomPhotos(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const reader = new FileReader();
        const result = await new Promise<string>((resolve, reject) => {
          reader.onload = async (event) => {
            const base64 = event.target?.result?.toString().split(',')[1];
            if (!base64) {
              reject('Ошибка чтения файла');
              return;
            }

            try {
              const uploadResult = await api.uploadPhoto(token, base64, file.type);
              if (uploadResult.url) {
                resolve(uploadResult.url);
              } else {
                reject('Не удалось загрузить');
              }
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        uploadedUrls.push(result);
      }

      setNewRoom({ ...newRoom, images: [...currentImages, ...uploadedUrls] });
      toast({
        title: 'Успешно',
        description: `Загружено ${uploadedUrls.length} фото`,
      });
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить фото',
        variant: 'destructive',
      });
    } finally {
      setUploadingRoomPhotos(false);
    }
  };

  const handleNewRoomPhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await uploadRoomPhotosFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      await uploadRoomPhotosFiles(files);
    }
  };

  const removeNewRoomPhoto = (index: number) => {
    const currentImages = Array.isArray(newRoom.images) ? newRoom.images : [];
    setNewRoom({
      ...newRoom,
      images: currentImages.filter((_, i) => i !== index),
    });
  };

  const handlePhotoDragStart = (index: number) => {
    setDraggingPhotoIndex(index);
  };

  const handlePhotoDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggingPhotoIndex === null || draggingPhotoIndex === index) return;

    const currentImages = Array.isArray(newRoom.images) ? newRoom.images : [];
    const newImages = [...currentImages];
    const draggedImage = newImages[draggingPhotoIndex];
    newImages.splice(draggingPhotoIndex, 1);
    newImages.splice(index, 0, draggedImage);

    setNewRoom({ ...newRoom, images: newImages });
    setDraggingPhotoIndex(index);
  };

  const handlePhotoDragEnd = () => {
    setDraggingPhotoIndex(null);
  };

  const toggleNewRoomFeature = (feature: string) => {
    const features = Array.isArray(newRoom.features) ? newRoom.features : [];
    if (features.includes(feature)) {
      setNewRoom({
        ...newRoom,
        features: features.filter((f) => f !== feature),
      });
    } else {
      setNewRoom({
        ...newRoom,
        features: [...features, feature],
      });
    }
  };

  const addRoom = () => {
    if (newRoom.type && newRoom.price > 0) {
      const roomToAdd = {
        type: newRoom.type,
        price: newRoom.price,
        description: newRoom.description,
        images: [...(Array.isArray(newRoom.images) ? newRoom.images : [])],
        square_meters: newRoom.square_meters,
        features: [...(Array.isArray(newRoom.features) ? newRoom.features : [])],
        min_hours: newRoom.min_hours,
        payment_methods: newRoom.payment_methods,
        cancellation_policy: newRoom.cancellation_policy
      };
      
      const updatedRooms = [...formData.rooms, roomToAdd];
      console.log('Adding room. Current rooms:', formData.rooms.length, 'After add:', updatedRooms.length);
      console.log('Room added:', roomToAdd);
      
      setFormData({
        ...formData,
        rooms: updatedRooms,
      });
      
      setNewRoom({ 
        type: '', 
        price: 0, 
        description: '', 
        images: [], 
        square_meters: 0,
        features: [],
        min_hours: 1,
        payment_methods: 'Наличные, банковская карта при заселении',
        cancellation_policy: 'Бесплатная отмена за 1 час до заселения'
      });
      
      toast({
        title: 'Успешно',
        description: `Категория "${roomToAdd.type}" добавлена (всего: ${updatedRooms.length})`,
      });
    } else {
      toast({
        title: 'Ошибка',
        description: 'Заполните название категории и цену',
        variant: 'destructive',
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id.toString().replace('room-', ''));
      const newIndex = parseInt(over.id.toString().replace('room-', ''));

      setFormData({
        ...formData,
        rooms: arrayMove(formData.rooms, oldIndex, newIndex),
      });

      toast({
        title: 'Порядок изменён',
        description: 'Перетащите номера в нужном порядке',
      });
    }
  };

  const startEditRoom = (index: number) => {
    const room = formData.rooms[index];
    setNewRoom({
      type: room.type || '',
      price: room.price || 0,
      description: room.description || '',
      images: Array.isArray(room.images) ? room.images : [],
      square_meters: room.square_meters || 0,
      features: Array.isArray(room.features) ? room.features : [],
      min_hours: room.min_hours || 1,
      payment_methods: room.payment_methods || 'Наличные, банковская карта при заселении',
      cancellation_policy: room.cancellation_policy || 'Бесплатная отмена за 1 час до заселения'
    });
    setEditingRoomIndex(index);
  };

  const saveEditedRoom = () => {
    if (editingRoomIndex !== null && newRoom.type && newRoom.price > 0) {
      const updatedRooms = [...formData.rooms];
      updatedRooms[editingRoomIndex] = {
        type: newRoom.type,
        price: newRoom.price,
        description: newRoom.description,
        images: [...(Array.isArray(newRoom.images) ? newRoom.images : [])],
        square_meters: newRoom.square_meters,
        features: [...(Array.isArray(newRoom.features) ? newRoom.features : [])],
        min_hours: newRoom.min_hours,
        payment_methods: newRoom.payment_methods,
        cancellation_policy: newRoom.cancellation_policy
      };
      setFormData({
        ...formData,
        rooms: updatedRooms,
      });
      setEditingRoomIndex(null);
      setNewRoom({ 
        type: '', 
        price: 0, 
        description: '', 
        images: [], 
        square_meters: 0,
        features: [],
        min_hours: 1,
        payment_methods: 'Наличные, банковская карта при заселении',
        cancellation_policy: 'Бесплатная отмена за 1 час до заселения'
      });
      toast({
        title: 'Успешно',
        description: 'Категория обновлена',
      });
    }
  };

  const cancelEditRoom = () => {
    setEditingRoomIndex(null);
    setNewRoom({ 
      type: '', 
      price: 0, 
      description: '', 
      images: [], 
      square_meters: 0,
      features: [],
      min_hours: 1,
      payment_methods: 'Наличные, банковская карта при заселении',
      cancellation_policy: 'Бесплатная отмена за 1 час до заселения'
    });
  };

  const applyTemplate = (templateName: string) => {
    const template = roomTemplates.find(t => t.name === templateName);
    if (!template) return;

    const currentImages = Array.isArray(newRoom.images) ? newRoom.images : [];
    setNewRoom({
      type: template.type,
      price: newRoom.price || 0,
      description: template.description,
      images: [...currentImages],
      square_meters: template.square_meters,
      features: [...template.features],
      min_hours: newRoom.min_hours || 1,
      payment_methods: newRoom.payment_methods || 'Наличные, банковская карта при заселении',
      cancellation_policy: newRoom.cancellation_policy || 'Бесплатная отмена за 1 час до заселения'
    });

    toast({
      title: 'Шаблон применён',
      description: `Загружены настройки для категории "${template.name}"`,
    });
  };

  const removeRoom = (index: number) => {
    setFormData({
      ...formData,
      rooms: formData.rooms.filter((_: any, i: number) => i !== index),
    });
  };

  const duplicateRoom = (index: number) => {
    const roomToDuplicate = { ...formData.rooms[index] };
    roomToDuplicate.type = `${roomToDuplicate.type} (копия)`;
    setFormData({
      ...formData,
      rooms: [...formData.rooms.slice(0, index + 1), roomToDuplicate, ...formData.rooms.slice(index + 1)],
    });
    toast({
      title: 'Успешно',
      description: 'Категория дублирована',
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
                <label className="text-sm font-medium mb-2 block">Адрес</label>
                <Input
                  placeholder="ул. Ленина, 25"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Icon name="Phone" size={16} className="text-green-600" />
                    Телефон
                    {formData.phone && (
                      <Badge variant="secondary" className="ml-auto">
                        <Icon name="Check" size={12} className="mr-1 text-green-600" />
                        Заполнено
                      </Badge>
                    )}
                  </label>
                  <Input
                    placeholder="+79991234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={formData.phone ? 'border-green-300 bg-green-50' : ''}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Icon name="Send" size={16} className="text-blue-600" />
                    Telegram (username или ссылка)
                    {formData.telegram && (
                      <Badge variant="secondary" className="ml-auto">
                        <Icon name="Check" size={12} className="mr-1 text-green-600" />
                        Заполнено
                      </Badge>
                    )}
                  </label>
                  <Input
                    placeholder="@username или https://t.me/username"
                    value={formData.telegram}
                    onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                    className={formData.telegram ? 'border-blue-300 bg-blue-50' : ''}
                  />
                </div>
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

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Главное фото</label>
                  <div className="flex flex-col gap-3">
                    {formData.image_url && (
                      <img src={formData.image_url} alt="Preview" className="w-full h-32 object-cover rounded" />
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
                      className="w-full"
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

                <div>
                  <label className="text-sm font-medium mb-2 block">Логотип (PNG с прозрачностью)</label>
                  <div className="flex flex-col gap-3">
                    {formData.logo_url && (
                      <div className="w-full h-32 border rounded flex items-center justify-center bg-gray-50">
                        <img src={formData.logo_url} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
                      </div>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/svg+xml,image/webp"
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
                          <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                          Загрузка...
                        </>
                      ) : (
                        <>
                          <Icon name="Upload" size={18} className="mr-2" />
                          Загрузить логотип
                        </>
                      )}
                    </Button>
                  </div>
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
              <CardTitle>Контакты для гостей</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  <Icon name="Phone" size={16} className="inline mr-1" />
                  Телефон для связи
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+7 (999) 123-45-67"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Гости смогут позвонить по этому номеру
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  <Icon name="Send" size={16} className="inline mr-1" />
                  Telegram (опционально)
                </label>
                <Input
                  value={formData.telegram}
                  onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                  placeholder="@hotel_name или https://t.me/hotel_name"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Укажите username (@hotel_name) или ссылку на Telegram для кнопки "Написать в Telegram"
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Категории номеров</CardTitle>
                {formData.rooms && formData.rooms.length > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Icon name="GripVertical" size={14} />
                    Перетащите для сортировки
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                console.log('Rendering rooms list. Total rooms:', formData.rooms?.length || 0);
                console.log('Rooms array:', formData.rooms);
                return null;
              })()}
              {formData.rooms && formData.rooms.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={formData.rooms.map((_: any, idx: number) => `room-${idx}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    {formData.rooms.map((room: any, index: number) => (
                      <div key={`room-${index}`} className="space-y-4">
                        <SortableRoomItem
                          room={room}
                          index={index}
                          onEdit={startEditRoom}
                          onRemove={removeRoom}
                          onDuplicate={duplicateRoom}
                          isEditing={editingRoomIndex === index}
                        />
                        
                        {editingRoomIndex === index && (
                          <div className="ml-8 space-y-4 p-4 border-2 border-purple-300 rounded-lg bg-purple-50 animate-fade-in">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Icon name="Edit" size={20} className="text-purple-600" />
                                Редактирование категории
                              </h3>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditRoom}
                              >
                                <Icon name="X" size={16} className="mr-1" />
                                Отмена
                              </Button>
                            </div>

                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Icon name="Sparkles" size={18} className="text-purple-600" />
                                <label className="text-sm font-semibold">Выберите готовый шаблон</label>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {roomTemplates.map((template) => (
                                  <Button
                                    key={template.name}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => applyTemplate(template.name)}
                                    className="h-auto py-3 flex flex-col items-start gap-1 hover:bg-purple-100 hover:border-purple-400 transition-all relative group"
                                    title={`${template.features?.length || 0} удобств`}
                                  >
                                    <span className="font-semibold text-sm">{template.name}</span>
                                    <div className="flex items-center gap-2 w-full">
                                      <span className="text-xs text-muted-foreground">{template.square_meters} м²</span>
                                      <Badge variant="secondary" className="text-xs h-4 px-1">
                                        {template.features?.length || 0}
                                      </Badge>
                                    </div>
                                  </Button>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                Шаблон загрузит настройки, площадь и удобства. Цена и фото не изменятся.
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
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
                            </div>

                            <Input
                              type="number"
                              placeholder="Площадь, м²"
                              value={newRoom.square_meters || ''}
                              onChange={(e) => setNewRoom({ ...newRoom, square_meters: parseInt(e.target.value) })}
                            />

                            <Input
                              placeholder="Описание (опционально)"
                              value={newRoom.description}
                              onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                            />

                            <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                              <div className="flex items-center gap-2 mb-3">
                                <Icon name="Settings" size={18} className="text-purple-600" />
                                <label className="text-sm font-semibold">Дополнительные параметры бронирования</label>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                                    <Icon name="Clock" size={14} className="text-purple-600" />
                                    Минимальное бронирование (часов)
                                    {newRoom.min_hours && newRoom.min_hours > 0 && (
                                      <Badge variant="secondary" className="ml-auto text-xs">
                                        {newRoom.min_hours}ч
                                      </Badge>
                                    )}
                                  </label>
                                  <Input
                                    type="number"
                                    placeholder="1"
                                    value={newRoom.min_hours || ''}
                                    onChange={(e) => setNewRoom({ ...newRoom, min_hours: parseInt(e.target.value) || 1 })}
                                    className={newRoom.min_hours ? 'border-purple-300 bg-white' : ''}
                                  />
                                </div>

                                <div>
                                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                                    <Icon name="CreditCard" size={14} className="text-purple-600" />
                                    Методы оплаты
                                    {newRoom.payment_methods && (
                                      <Badge variant="secondary" className="ml-auto">
                                        <Icon name="Check" size={10} className="mr-1 text-green-600" />
                                      </Badge>
                                    )}
                                  </label>
                                  <Input
                                    placeholder="Наличные, банковская карта при заселении"
                                    value={newRoom.payment_methods}
                                    onChange={(e) => setNewRoom({ ...newRoom, payment_methods: e.target.value })}
                                    className={newRoom.payment_methods ? 'border-purple-300 bg-white' : ''}
                                  />
                                </div>

                                <div>
                                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                                    <Icon name="CalendarX" size={14} className="text-purple-600" />
                                    Условия отмены
                                    {newRoom.cancellation_policy && (
                                      <Badge variant="secondary" className="ml-auto">
                                        <Icon name="Check" size={10} className="mr-1 text-green-600" />
                                      </Badge>
                                    )}
                                  </label>
                                  <Input
                                    placeholder="Бесплатная отмена за 1 час до заселения"
                                    value={newRoom.cancellation_policy}
                                    onChange={(e) => setNewRoom({ ...newRoom, cancellation_policy: e.target.value })}
                                    className={newRoom.cancellation_policy ? 'border-purple-300 bg-white' : ''}
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-2 block">Фото номера (до 10 шт)</label>
                              
                              {newRoom.images && newRoom.images.length > 0 && (
                                <div className="mb-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Icon name="GripVertical" size={16} className="text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      Перетащите фото для изменения порядка
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {newRoom.images.map((url, idx) => (
                                      <div
                                        key={idx}
                                        draggable
                                        onDragStart={() => handlePhotoDragStart(idx)}
                                        onDragOver={(e) => handlePhotoDragOver(e, idx)}
                                        onDragEnd={handlePhotoDragEnd}
                                        className={`relative group cursor-move transition-all ${
                                          draggingPhotoIndex === idx ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                                        }`}
                                      >
                                        <div className="relative w-24 h-24 rounded border-2 border-purple-200 hover:border-purple-400 transition-colors overflow-hidden">
                                          <img 
                                            src={url} 
                                            alt={`Room ${idx + 1}`} 
                                            className="w-full h-full object-cover" 
                                          />
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <Icon 
                                              name="GripVertical" 
                                              size={24} 
                                              className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            />
                                          </div>
                                          <div className="absolute top-1 left-1 bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                            {idx + 1}
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => removeNewRoomPhoto(idx)}
                                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-lg p-8 transition-all ${
                                  isDragging 
                                    ? 'border-purple-500 bg-purple-50 scale-[1.02]' 
                                    : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
                                } ${uploadingRoomPhotos || (newRoom.images && newRoom.images.length >= 10) ? 'opacity-50 pointer-events-none' : ''}`}
                              >
                                <div className="flex flex-col items-center justify-center gap-3">
                                  <div className={`p-4 rounded-full ${isDragging ? 'bg-purple-200' : 'bg-gray-100'} transition-colors`}>
                                    <Icon 
                                      name={isDragging ? "Download" : "Upload"} 
                                      size={32} 
                                      className={isDragging ? 'text-purple-600' : 'text-gray-400'}
                                    />
                                  </div>
                                  
                                  {uploadingRoomPhotos ? (
                                    <div className="text-center">
                                      <Icon name="Loader2" size={24} className="mx-auto mb-2 animate-spin text-purple-600" />
                                      <p className="text-sm font-medium text-purple-600">Загрузка фото...</p>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="text-center">
                                        <p className="text-base font-semibold mb-1">
                                          {isDragging ? 'Отпустите для загрузки' : 'Перетащите фото сюда'}
                                        </p>
                                        <p className="text-sm text-muted-foreground mb-1">
                                          или нажмите кнопку ниже
                                        </p>
                                        <p className="text-xs text-muted-foreground mb-3">
                                          JPG, PNG, WebP • Можно загружать несколько файлов сразу
                                        </p>
                                      </div>
                                      
                                      <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleNewRoomPhotosUpload}
                                        className="hidden"
                                        id={`room-photos-input-${index}`}
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => document.getElementById(`room-photos-input-${index}`)?.click()}
                                        disabled={newRoom.images && newRoom.images.length >= 10}
                                        className="border-purple-300 hover:bg-purple-100"
                                      >
                                        <Icon name="FolderOpen" size={18} className="mr-2" />
                                        Выбрать файлы ({newRoom.images?.length || 0}/10)
                                      </Button>
                                    </>
                                  )}

                                  {newRoom.images && newRoom.images.length >= 10 && (
                                    <p className="text-sm text-amber-600 font-medium">
                                      Достигнут лимит: 10 фото
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-2 block">Удобства в номере</label>
                              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                                {availableFeatures.map((feature) => (
                                  <label
                                    key={feature}
                                    className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-purple-50 transition-colors"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={newRoom.features && newRoom.features.includes(feature)}
                                      onChange={() => toggleNewRoomFeature(feature)}
                                      className="w-4 h-4 text-purple-600 rounded"
                                    />
                                    <span className="text-sm">{feature}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <Button 
                              type="button" 
                              onClick={saveEditedRoom} 
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                              <Icon name="Check" size={18} className="mr-2" />
                              Сохранить изменения
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon name="BedDouble" size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Категории номеров не добавлены</p>
                  <p className="text-sm">Добавьте первую категорию ниже</p>
                </div>
              )}

              {editingRoomIndex === null && (
                <div className="space-y-4 p-4 border rounded-lg bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">
                    Добавить категорию номера
                  </h3>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="Sparkles" size={18} className="text-purple-600" />
                    <label className="text-sm font-semibold">Выберите готовый шаблон</label>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {roomTemplates.map((template) => (
                      <Button
                        key={template.name}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyTemplate(template.name)}
                        className="h-auto py-3 flex flex-col items-start gap-1 hover:bg-purple-100 hover:border-purple-400 transition-all relative group"
                        title={`${template.features?.length || 0} удобств`}
                      >
                        <span className="font-semibold text-sm">{template.name}</span>
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-xs text-muted-foreground">{template.square_meters} м²</span>
                          <Badge variant="secondary" className="text-xs h-4 px-1">
                            {template.features?.length || 0}
                          </Badge>
                        </div>
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Шаблон загрузит настройки, площадь и удобства. Цена и фото не изменятся.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
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
                </div>

                <Input
                  type="number"
                  placeholder="Площадь, м²"
                  value={newRoom.square_meters || ''}
                  onChange={(e) => setNewRoom({ ...newRoom, square_meters: parseInt(e.target.value) })}
                />

                <Input
                  placeholder="Описание (опционально)"
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                />

                <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="Settings" size={18} className="text-purple-600" />
                    <label className="text-sm font-semibold">Дополнительные параметры бронирования</label>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                        <Icon name="Clock" size={14} className="text-purple-600" />
                        Минимальное бронирование (часов)
                        {newRoom.min_hours && newRoom.min_hours > 0 && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {newRoom.min_hours}ч
                          </Badge>
                        )}
                      </label>
                      <Input
                        type="number"
                        placeholder="1"
                        value={newRoom.min_hours || ''}
                        onChange={(e) => setNewRoom({ ...newRoom, min_hours: parseInt(e.target.value) || 1 })}
                        className={newRoom.min_hours ? 'border-purple-300 bg-white' : ''}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                        <Icon name="CreditCard" size={14} className="text-purple-600" />
                        Методы оплаты
                        {newRoom.payment_methods && (
                          <Badge variant="secondary" className="ml-auto">
                            <Icon name="Check" size={10} className="mr-1 text-green-600" />
                          </Badge>
                        )}
                      </label>
                      <Input
                        placeholder="Наличные, банковская карта при заселении"
                        value={newRoom.payment_methods}
                        onChange={(e) => setNewRoom({ ...newRoom, payment_methods: e.target.value })}
                        className={newRoom.payment_methods ? 'border-purple-300 bg-white' : ''}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                        <Icon name="CalendarX" size={14} className="text-purple-600" />
                        Условия отмены
                        {newRoom.cancellation_policy && (
                          <Badge variant="secondary" className="ml-auto">
                            <Icon name="Check" size={10} className="mr-1 text-green-600" />
                          </Badge>
                        )}
                      </label>
                      <Input
                        placeholder="Бесплатная отмена за 1 час до заселения"
                        value={newRoom.cancellation_policy}
                        onChange={(e) => setNewRoom({ ...newRoom, cancellation_policy: e.target.value })}
                        className={newRoom.cancellation_policy ? 'border-purple-300 bg-white' : ''}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Фото номера (до 10 шт)</label>
                  
                  {newRoom.images && newRoom.images.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="GripVertical" size={16} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Перетащите фото для изменения порядка
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {newRoom.images.map((url, idx) => (
                          <div
                            key={idx}
                            draggable
                            onDragStart={() => handlePhotoDragStart(idx)}
                            onDragOver={(e) => handlePhotoDragOver(e, idx)}
                            onDragEnd={handlePhotoDragEnd}
                            className={`relative group cursor-move transition-all ${
                              draggingPhotoIndex === idx ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                            }`}
                          >
                            <div className="relative w-24 h-24 rounded border-2 border-purple-200 hover:border-purple-400 transition-colors overflow-hidden">
                              <img 
                                src={url} 
                                alt={`Room ${idx + 1}`} 
                                className="w-full h-full object-cover" 
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <Icon 
                                  name="GripVertical" 
                                  size={24} 
                                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                              </div>
                              <div className="absolute top-1 left-1 bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {idx + 1}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeNewRoomPhoto(idx)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 transition-all ${
                      isDragging 
                        ? 'border-purple-500 bg-purple-50 scale-[1.02]' 
                        : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
                    } ${uploadingRoomPhotos || (newRoom.images && newRoom.images.length >= 10) ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className={`p-4 rounded-full ${isDragging ? 'bg-purple-200' : 'bg-gray-100'} transition-colors`}>
                        <Icon 
                          name={isDragging ? "Download" : "Upload"} 
                          size={32} 
                          className={isDragging ? 'text-purple-600' : 'text-gray-400'}
                        />
                      </div>
                      
                      {uploadingRoomPhotos ? (
                        <div className="text-center">
                          <Icon name="Loader2" size={24} className="mx-auto mb-2 animate-spin text-purple-600" />
                          <p className="text-sm font-medium text-purple-600">Загрузка фото...</p>
                        </div>
                      ) : (
                        <>
                          <div className="text-center">
                            <p className="text-base font-semibold mb-1">
                              {isDragging ? 'Отпустите для загрузки' : 'Перетащите фото сюда'}
                            </p>
                            <p className="text-sm text-muted-foreground mb-1">
                              или нажмите кнопку ниже
                            </p>
                            <p className="text-xs text-muted-foreground mb-3">
                              JPG, PNG, WebP • Можно загружать несколько файлов сразу
                            </p>
                          </div>
                          
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleNewRoomPhotosUpload}
                            className="hidden"
                            id="room-photos-input"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('room-photos-input')?.click()}
                            disabled={newRoom.images && newRoom.images.length >= 10}
                            className="border-purple-300 hover:bg-purple-100"
                          >
                            <Icon name="FolderOpen" size={18} className="mr-2" />
                            Выбрать файлы ({newRoom.images?.length || 0}/10)
                          </Button>
                        </>
                      )}

                      {newRoom.images && newRoom.images.length >= 10 && (
                        <p className="text-sm text-amber-600 font-medium">
                          Достигнут лимит: 10 фото
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Удобства в номере</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                    {availableFeatures.map((feature) => (
                      <label
                        key={feature}
                        className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-purple-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={newRoom.features && newRoom.features.includes(feature)}
                          onChange={() => toggleNewRoomFeature(feature)}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <span className="text-sm">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button type="button" onClick={addRoom} variant="outline" className="w-full">
                  <Icon name="Plus" size={18} className="mr-2" />
                  Добавить категорию
                </Button>
              </div>
              )}
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