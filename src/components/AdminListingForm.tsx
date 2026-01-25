import { useState, useRef, useEffect } from 'react';
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

  const featureIcons: Record<string, string> = {
    'WiFi': 'Wifi',
    'Двуспальная кровать': 'BedDouble',
    '2 односпальные кровати': 'BedSingle',
    'Смарт ТВ': 'Tv',
    'Телевизор': 'Monitor',
    'Кондиционер': 'Wind',
    'Джакузи': 'Bath',
    'Душевая кабина': 'ShowerHead',
    'Ванная': 'Bath',
    'Сауна': 'Flame',
    'Фен': 'Wind',
    'Халаты': 'Shirt',
    'Тапочки': 'Footprints',
    'Холодильник': 'Refrigerator',
    'Микроволновка': 'Microwave',
    'Чайник': 'Coffee',
    'Посуда': 'UtensilsCrossed',
    'Сейф': 'Lock',
    'Зеркала': 'Sparkles',
    'Музыкальная система': 'Music',
    'Настольные игры': 'Dices',
    'PlayStation': 'Gamepad2',
    'Бар': 'Wine',
    'Косметика': 'Sparkles',
    'Полотенца': 'Sheet',
    'Постельное бельё': 'Bed',
    'Кухня': 'ChefHat',
    'Обеденный стол': 'Utensils',
    'Диван': 'Sofa',
    'Ароматерапия': 'Flower',
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
        <div className="flex flex-wrap gap-2 mb-2 ml-8">
          {room.features.map((feature: string, fIdx: number) => {
            const iconName = featureIcons[feature] || 'Check';
            return (
              <div
                key={fIdx}
                className="group relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 transition-all cursor-help"
                title={feature}
              >
                <Icon name={iconName} size={14} className="text-purple-600" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {feature}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {room.description && (
        <p className="text-sm text-muted-foreground ml-8">{room.description}</p>
      )}
    </div>
  );
}

export default function AdminListingForm({ listing, token, onClose }: AdminListingFormProps) {
  console.log('✅ AdminListingForm component loaded - RESTORED VERSION');
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
      parking_type: listing?.parking_type || 'none',
      parking_price_per_hour: listing?.parking_price_per_hour || 0,
      features: listing?.features || [],
      lat: listing?.lat || 0,
      lng: listing?.lng || 0,
      min_hours: listing?.min_hours || 1,
      rooms: listing?.rooms || [],
      phone: listing?.phone || '',
      telegram: listing?.telegram || '',
      price_warning_holidays: listing?.price_warning_holidays || false,
      price_warning_daytime: listing?.price_warning_daytime || false,
    };
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

  // Обновляем formData при изменении listing (загрузка полных данных)
  useEffect(() => {
    if (listing) {
      console.log('=== UPDATING FORM DATA FROM LISTING PROP ===');
      console.log('Listing:', listing);
      console.log('Rooms:', listing.rooms);
      
      setFormData({
        title: listing.title || '',
        type: listing.type || 'hotel',
        city: listing.city || '',
        district: listing.district || '',
        price: listing.price || 0,
        auction: listing.auction || 999,
        image_url: listing.image_url || '',
        logo_url: listing.logo_url || '',
        metro: listing.metro || '',
        metro_walk: listing.metro_walk || 0,
        metro_stations: listing.metro_stations || [],
        has_parking: listing.has_parking || false,
        parking_type: listing.parking_type || 'none',
        parking_price_per_hour: listing.parking_price_per_hour || 0,
        features: listing.features || [],
        lat: listing.lat || 0,
        lng: listing.lng || 0,
        min_hours: listing.min_hours || 1,
        rooms: listing.rooms || [],
        phone: listing.phone || '',
        telegram: listing.telegram || '',
        price_warning_holidays: listing.price_warning_holidays || false,
        price_warning_daytime: listing.price_warning_daytime || false,
      });
    }
  }, [listing]);

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
      features: ['WiFi', 'Двуспальная кровать', 'Смарт ТВ', 'Кондиционер', 'Душевая кабина', 'Фен', 'Холодильник', 'Микроволновка', 'Чайник', 'Посуда', 'Обеденный стол', 'Диван', 'Кухня'],
    },
    {
      name: 'Романтик',
      type: 'Романтик',
      description: 'Номер с романтической атмосферой для пар',
      square_meters: 28,
      features: ['WiFi', 'Двуспальная кровать', 'Смарт ТВ', 'Кондиционер', 'Джакузи', 'Фен', 'Халаты', 'Тапочки', 'Холодильник', 'Чайник', 'Зеркала', 'Музыкальная система', 'Ароматерапия', 'Косметика'],
    },
    {
      name: 'VIP',
      type: 'VIP',
      description: 'Эксклюзивный номер с максимальным комфортом',
      square_meters: 45,
      features: ['WiFi', 'Двуспальная кровать', 'Смарт ТВ', 'Кондиционер', 'Джакузи', 'Фен', 'Халаты', 'Тапочки', 'Холодильник', 'Микроволновка', 'Чайник', 'Посуда', 'Сейф', 'Зеркала', 'Музыкальная система', 'PlayStation', 'Настольные игры', 'Диван', 'Обеденный стол', 'Бар', 'Косметика', 'Полотенца', 'Постельное бельё'],
    },
  ];

  const availableFeatures = [
    'WiFi',
    'Двуспальная кровать',
    '2 односпальные кровати',
    'Смарт ТВ',
    'Телевизор',
    'Кондиционер',
    'Джакузи',
    'Душевая кабина',
    'Ванная',
    'Сауна',
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
    'Обеденный стол',
    'Диван',
    'Ароматерапия',
  ];

  const featureIcons: Record<string, string> = {
    'WiFi': 'Wifi',
    'Двуспальная кровать': 'BedDouble',
    '2 односпальные кровати': 'BedSingle',
    'Смарт ТВ': 'Tv',
    'Телевизор': 'Monitor',
    'Кондиционер': 'Wind',
    'Джакузи': 'Bath',
    'Душевая кабина': 'ShowerHead',
    'Ванная': 'Bath',
    'Сауна': 'Flame',
    'Фен': 'Wind',
    'Халаты': 'Shirt',
    'Тапочки': 'Footprints',
    'Холодильник': 'Refrigerator',
    'Микроволновка': 'Microwave',
    'Чайник': 'Coffee',
    'Посуда': 'UtensilsCrossed',
    'Сейф': 'Lock',
    'Зеркала': 'Sparkles',
    'Музыкальная система': 'Music',
    'Настольные игры': 'Dices',
    'PlayStation': 'Gamepad2',
    'Бар': 'Wine',
    'Косметика': 'Sparkles',
    'Полотенца': 'Sheet',
    'Постельное бельё': 'Bed',
    'Кухня': 'ChefHat',
    'Обеденный стол': 'Utensils',
    'Диван': 'Sofa',
    'Ароматерапия': 'Flower',
  };

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
    
    const debugInfo = {
      editingRoomIndex,
      newRoomType: newRoom.type,
      newRoomPrice: newRoom.price,
      currentRoomsCount: formData.rooms.length,
      willAutoAdd: !!(newRoom.type && newRoom.price > 0)
    };
    
    console.log('🚀 HANDLE SUBMIT CALLED - START');
    console.log('🔍 editingRoomIndex:', editingRoomIndex);
    console.log('🔍 newRoom state:', JSON.stringify(newRoom));
    console.log('🔍 formData.rooms.length:', formData.rooms.length);
    console.table(debugInfo);
    
    setIsLoading(true);

    try {
      let finalData = { ...formData };
      
      console.log('🔍 Checking newRoom:', {
        type: newRoom.type,
        price: newRoom.price,
        hasType: !!newRoom.type,
        hasPrice: newRoom.price > 0,
        willAutoAdd: !!(newRoom.type && newRoom.price > 0)
      });
      
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
        
        finalData = {
          ...finalData,
          rooms: [...finalData.rooms, roomToAdd]
        };
        
        console.log('⚠️ Auto-added unsaved room before submit:', roomToAdd.type);
        
        toast({
          title: 'Внимание',
          description: `Категория "${roomToAdd.type}" автоматически добавлена при сохранении`,
        });
      }

      console.log('=== SAVING LISTING ===');
      console.log('formData.rooms:', formData.rooms);
      console.log('formData.rooms length:', formData.rooms?.length);
      console.log('Full formData:', finalData);
      
      if (formData.rooms && formData.rooms.length > 0) {
        console.log('Rooms to save:');
        formData.rooms.forEach((room, idx) => {
          console.log(`  ${idx + 1}. ${room.type} - ${room.price} ₽`);
        });
      } else {
        console.warn('⚠️ NO ROOMS TO SAVE!');
      }

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

      const cleanRooms = finalData.rooms.map((room: any) => ({
        type: room.type,
        price: room.price,
        description: room.description || '',
        images: Array.isArray(room.images) ? room.images : [],
        square_meters: room.square_meters || 0,
        features: Array.isArray(room.features) ? room.features : [],
        min_hours: room.min_hours || 1,
        payment_methods: room.payment_methods || 'Наличные, банковская карта при заселении',
        cancellation_policy: room.cancellation_policy || 'Бесплатная отмена за 1 час до заселения'
      }));

      finalData = { ...finalData, rooms: cleanRooms };

      console.log('Sending to server:', finalData);
      console.log('Rooms count:', finalData.rooms?.length);

      let createdOrUpdatedId = listing?.id;
      
      if (listing) {
        const updated = await api.updateListing(token, listing.id, finalData);
        console.log('✅ Server returned updated listing:', updated);
        
        toast({
          title: 'Успешно',
          description: `Объект обновлён. Категорий номеров: ${finalData.rooms.length}`,
        });
        
        const freshData = await api.getListings(token, false);
        console.log('🔄 Reloaded fresh data from server');
      } else {
        const created = await api.createListing(token, finalData);
        createdOrUpdatedId = created.id;
        
        toast({
          title: 'Успешно',
          description: 'Объект создан',
        });
      }
      
      if (createdOrUpdatedId) {
        try {
          await api.submitForModeration(token, createdOrUpdatedId);
          toast({
            title: 'Отправлено на модерацию',
            description: 'Объект отправлен на проверку модератору',
          });
        } catch (error) {
          console.error('Failed to submit for moderation:', error);
        }
      }
      
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
      setEditingRoomIndex(null);
      
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
      const uploadPromise = new Promise<string>((resolve, reject) => {
        reader.onload = async (event) => {
          try {
            const base64 = event.target?.result?.toString().split(',')[1];
            if (!base64) {
              reject('Ошибка чтения файла');
              return;
            }

            const result = await api.uploadPhoto(token, base64, file.type);
            
            if (result.url) {
              resolve(result.url);
            } else {
              reject('Не удалось получить URL фото');
            }
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject('Ошибка чтения файла');
      });
      
      reader.readAsDataURL(file);
      const url = await uploadPromise;
      
      if (isRoomPhoto && roomIndex !== undefined) {
        const updatedRooms = [...formData.rooms];
        updatedRooms[roomIndex].image_url = url;
        setFormData({ ...formData, rooms: updatedRooms });
      } else {
        setFormData({ ...formData, image_url: url });
      }
      
      toast({
        title: 'Успешно',
        description: 'Фото загружено',
      });
    } catch (error: any) {
      console.error('Photo upload error:', error);
      toast({
        title: 'Ошибка',
        description: error?.message || 'Не удалось загрузить фото',
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
      const uploadPromise = new Promise<string>((resolve, reject) => {
        reader.onload = async (event) => {
          try {
            const base64 = event.target?.result?.toString().split(',')[1];
            if (!base64) {
              reject('Ошибка чтения файла');
              return;
            }

            const result = await api.uploadPhoto(token, base64, file.type);
            
            if (result.url) {
              resolve(result.url);
            } else {
              reject('Не удалось получить URL логотипа');
            }
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject('Ошибка чтения файла');
      });
      
      reader.readAsDataURL(file);
      const url = await uploadPromise;
      
      setFormData({ ...formData, logo_url: url });
      toast({
        title: 'Успешно',
        description: 'Логотип загружен',
      });
    } catch (error: any) {
      console.error('Logo upload error:', error);
      toast({
        title: 'Ошибка',
        description: error?.message || 'Не удалось загрузить логотип',
        variant: 'destructive',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const compressImage = (file: File, maxWidth = 1920, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject('Ошибка сжатия');
                return;
              }
              const reader2 = new FileReader();
              reader2.onload = () => {
                const base64 = reader2.result?.toString().split(',')[1];
                if (base64) {
                  resolve(base64);
                } else {
                  reject('Ошибка чтения');
                }
              };
              reader2.onerror = reject;
              reader2.readAsDataURL(blob);
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadRoomPhotosFiles = async (files: File[]) => {
    console.log('=== UPLOAD ROOM PHOTOS START ===');
    console.log('Files count:', files.length);
    
    if (files.length === 0) {
      console.log('No files selected');
      return;
    }
    
    const currentImages = Array.isArray(newRoom.images) ? newRoom.images : [];
    console.log('Current room images:', currentImages.length);
    
    if (currentImages.length + files.length > 10) {
      console.log('Too many photos:', currentImages.length + files.length);
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
        console.log('Processing file:', file.name, file.type, file.size);
        
        // Сжимаем изображение
        console.log('Compressing image...');
        const base64 = await compressImage(file);
        console.log('Compressed base64 length:', base64.length);

        try {
          console.log('Calling api.uploadPhoto...');
          const uploadResult = await api.uploadPhoto(token, base64, 'image/jpeg');
          console.log('Upload result:', uploadResult);
          
          if (uploadResult.url) {
            console.log('Photo uploaded successfully:', uploadResult.url);
            uploadedUrls.push(uploadResult.url);
          } else {
            console.error('No URL in upload result:', uploadResult);
            throw new Error('Не удалось загрузить');
          }
        } catch (err) {
          console.error('Upload API error:', err);
          throw err;
        }
      }

      console.log('All photos uploaded:', uploadedUrls);
      setNewRoom({ ...newRoom, images: [...currentImages, ...uploadedUrls] });
      toast({
        title: 'Успешно',
        description: `Загружено ${uploadedUrls.length} фото`,
      });
    } catch (error: any) {
      console.error('=== UPLOAD ROOM PHOTOS ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      toast({
        title: 'Ошибка',
        description: error?.message || 'Не удалось загрузить фото',
        variant: 'destructive',
      });
    } finally {
      setUploadingRoomPhotos(false);
      console.log('=== UPLOAD ROOM PHOTOS END ===');
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
    toast({
      title: 'Фото удалено',
      description: `Осталось ${currentImages.length - 1} фото`,
    });
  };

  const replaceRoomPhoto = async (index: number, file: File) => {
    setUploadingRoomPhotos(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result?.toString().split(',')[1];
        if (!base64) return;

        const result = await api.uploadPhoto(token, base64, file.type);
        
        if (result.url) {
          const currentImages = Array.isArray(newRoom.images) ? newRoom.images : [];
          const updatedImages = [...currentImages];
          updatedImages[index] = result.url;
          
          setNewRoom({
            ...newRoom,
            images: updatedImages,
          });

          toast({
            title: 'Фото заменено',
            description: 'Новое фото успешно загружено',
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось заменить фото',
        variant: 'destructive',
      });
    } finally {
      setUploadingRoomPhotos(false);
    }
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

              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Icon name="Car" size={16} className="text-blue-600" />
                  Паркинг
                </label>
                <Select
                  value={formData.parking_type}
                  onValueChange={(value) => setFormData({ ...formData, parking_type: value })}
                >
                  <SelectTrigger className="w-full">
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
                  <div className="mt-2">
                    <label className="text-sm font-medium mb-1 block">Стоимость паркинга (₽/час)</label>
                    <Input
                      type="number"
                      value={formData.parking_price_per_hour}
                      onChange={(e) => setFormData({ ...formData, parking_price_per_hour: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                )}
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

              <div className="space-y-3">
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
                
                <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-red-800">⚠️ Важные уведомления о ценах</label>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="priceWarningHolidays"
                      checked={formData.price_warning_holidays}
                      onChange={(e) => setFormData({ ...formData, price_warning_holidays: e.target.checked })}
                      className="w-5 h-5 mt-0.5 cursor-pointer"
                    />
                    <label htmlFor="priceWarningHolidays" className="text-sm font-medium text-red-700 cursor-pointer flex-1">
                      Внимание: Цены в праздничные и выходные дни могут отличаться
                    </label>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="priceWarningDaytime"
                      checked={formData.price_warning_daytime}
                      onChange={(e) => setFormData({ ...formData, price_warning_daytime: e.target.checked })}
                      className="w-5 h-5 mt-0.5 cursor-pointer"
                    />
                    <label htmlFor="priceWarningDaytime" className="text-sm font-medium text-red-700 cursor-pointer flex-1">
                      Цены указаны на дневной тариф
                    </label>
                  </div>
                  
                  <p className="text-xs text-red-600">
                    Эти отметки будут показаны красным цветом на странице объекта
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="BedDouble" size={24} className="text-purple-600" />
                Категории номеров
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.rooms && formData.rooms.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={formData.rooms.map((_, index) => `room-${index}`)}
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
                          <div className="space-y-4 p-4 border-2 border-purple-400 rounded-lg bg-white shadow-md">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-lg text-purple-900 flex items-center gap-2">
                                <Icon name="Edit" size={20} className="text-purple-600" />
                                Редактирование категории
                              </h3>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditRoom}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <Icon name="X" size={18} />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                placeholder="Тип номера"
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
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium">Фото номера (до 10 шт)</label>
                                {newRoom.images && newRoom.images.length > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-purple-50 px-2 py-1 rounded">
                                    <Icon name="Info" size={12} />
                                    <span>Наведите на фото для действий</span>
                                  </div>
                                )}
                              </div>
                              
                              {newRoom.images && newRoom.images.length > 0 && (
                                <div className="mb-3 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-200">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <Icon name="Images" size={18} className="text-purple-600" />
                                      <span className="text-sm font-semibold text-purple-900">
                                        Галерея номера ({newRoom.images.length}/10)
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Icon name="GripVertical" size={14} />
                                      <span>Перетащите для сортировки</span>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {newRoom.images.map((url, idx) => (
                                      <div
                                        key={idx}
                                        draggable
                                        onDragStart={() => handlePhotoDragStart(idx)}
                                        onDragOver={(e) => handlePhotoDragOver(e, idx)}
                                        onDragEnd={handlePhotoDragEnd}
                                        className={`relative group cursor-move transition-all ${
                                          draggingPhotoIndex === idx ? 'opacity-50 scale-95' : 'opacity-100 scale-100 hover:scale-105'
                                        }`}
                                      >
                                        <div className="relative aspect-square rounded-lg border-2 border-purple-300 hover:border-purple-500 transition-all overflow-hidden shadow-sm hover:shadow-md">
                                          <img 
                                            src={url} 
                                            alt={`Room ${idx + 1}`} 
                                            className="w-full h-full object-cover" 
                                          />
                                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                                              <Icon 
                                                name="Move" 
                                                size={28} 
                                                className="text-white drop-shadow-lg"
                                              />
                                              <span className="text-white text-[10px] font-medium drop-shadow">
                                                Перетащите
                                              </span>
                                            </div>
                                          </div>
                                          <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                                            {idx + 1}
                                          </div>
                                          {idx === 0 && (
                                            <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                                              Главное
                                            </div>
                                          )}
                                        </div>
                                        <div className="absolute -top-2 -right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) replaceRoomPhoto(idx, file);
                                            }}
                                            className="hidden"
                                            id={`replace-photo-${idx}`}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => document.getElementById(`replace-photo-${idx}`)?.click()}
                                            className="bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-blue-600 hover:scale-110 transition-all shadow-lg group/btn relative"
                                            title="Заменить фото"
                                          >
                                            <Icon name="RefreshCw" size={13} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => removeNewRoomPhoto(idx)}
                                            className="bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all shadow-lg"
                                            title="Удалить фото"
                                          >
                                            <Icon name="Trash2" size={13} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {(!newRoom.images || newRoom.images.length < 10) && (
                                <div
                                  onDragOver={handleDragOver}
                                  onDragLeave={handleDragLeave}
                                  onDrop={handleDrop}
                                  className={`border-2 border-dashed rounded-xl transition-all ${
                                    isDragging 
                                      ? 'border-purple-500 bg-gradient-to-br from-purple-100 to-pink-100 scale-[1.01] shadow-lg' 
                                      : 'border-purple-300 hover:border-purple-400 bg-gradient-to-br from-gray-50 to-purple-50/30 hover:shadow-md'
                                  } ${uploadingRoomPhotos ? 'opacity-50 pointer-events-none' : ''} p-6`}
                                >
                                  <div className="flex flex-col items-center justify-center gap-3">
                                    <div className={`p-3 rounded-full transition-all ${
                                      isDragging 
                                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg scale-110' 
                                        : 'bg-gradient-to-br from-purple-100 to-pink-100'
                                    }`}>
                                      <Icon 
                                        name={isDragging ? "Download" : "ImagePlus"} 
                                        size={28} 
                                        className={isDragging ? 'text-white' : 'text-purple-600'}
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
                                          <p className="text-base font-semibold mb-1 text-gray-900">
                                            {isDragging ? '✨ Отпустите для загрузки' : 'Добавить фотографии'}
                                          </p>
                                          <p className="text-sm text-muted-foreground mb-1">
                                            Перетащите файлы или нажмите кнопку
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            JPG, PNG, WebP • До 10 фото на номер
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
                                          onClick={() => document.getElementById(`room-photos-input-${index}`)?.click()}
                                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all mt-2"
                                        >
                                          <Icon name="Upload" size={16} className="mr-2" />
                                          Выбрать фото ({newRoom.images?.length || 0}/10)
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {newRoom.images && newRoom.images.length >= 10 && (
                                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-center">
                                  <Icon name="AlertCircle" size={24} className="mx-auto mb-2 text-amber-600" />
                                  <p className="text-sm text-amber-800 font-medium">
                                    Достигнут лимит: 10 фотографий
                                  </p>
                                  <p className="text-xs text-amber-700 mt-1">
                                    Удалите ненужные фото, чтобы загрузить новые
                                  </p>
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-2 block">Удобства в номере</label>
                              
                              <div className="flex flex-wrap gap-2 mb-3">
                                {['WiFi', 'Смарт ТВ', 'Кондиционер', 'Душевая кабина', 'Холодильник', 'Двуспальная кровать'].map((quickFeature) => {
                                  const isSelected = newRoom.features && newRoom.features.includes(quickFeature);
                                  const iconName = featureIcons[quickFeature] || 'Check';
                                  return (
                                    <Button
                                      key={quickFeature}
                                      type="button"
                                      variant={isSelected ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => toggleNewRoomFeature(quickFeature)}
                                      className={isSelected ? 'bg-purple-600 hover:bg-purple-700' : 'hover:bg-purple-50'}
                                    >
                                      <Icon name={iconName} size={14} className="mr-1" />
                                      {quickFeature}
                                    </Button>
                                  );
                                })}
                              </div>
                              
                              <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
                                {availableFeatures.map((feature) => {
                                  const iconName = featureIcons[feature] || 'Check';
                                  const isChecked = newRoom.features && newRoom.features.includes(feature);
                                  return (
                                    <div
                                      key={feature}
                                      onClick={() => toggleNewRoomFeature(feature)}
                                      className={`group relative inline-flex items-center justify-center w-12 h-12 rounded-full cursor-pointer transition-all hover:scale-110 ${
                                        isChecked 
                                          ? 'bg-purple-600 text-white shadow-lg' 
                                          : 'bg-white hover:bg-purple-100 text-purple-600'
                                      }`}
                                      title={feature}
                                    >
                                      <Icon name={iconName} size={20} />
                                      {isChecked && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                          <Icon name="Check" size={12} className="text-white" />
                                        </div>
                                      )}
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        {feature}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                      </div>
                                    </div>
                                  );
                                })}
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
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Фото номера (до 10 шт)</label>
                      {newRoom.images && newRoom.images.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-purple-50 px-2 py-1 rounded">
                          <Icon name="Info" size={12} />
                          <span>Наведите на фото для действий</span>
                        </div>
                      )}
                    </div>
                    
                    {newRoom.images && newRoom.images.length > 0 && (
                      <div className="mb-3 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Icon name="Images" size={18} className="text-purple-600" />
                            <span className="text-sm font-semibold text-purple-900">
                              Галерея номера ({newRoom.images.length}/10)
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Icon name="GripVertical" size={14} />
                            <span>Перетащите для сортировки</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                          {newRoom.images.map((url, idx) => (
                            <div
                              key={idx}
                              draggable
                              onDragStart={() => handlePhotoDragStart(idx)}
                              onDragOver={(e) => handlePhotoDragOver(e, idx)}
                              onDragEnd={handlePhotoDragEnd}
                              className={`relative group cursor-move transition-all ${
                                draggingPhotoIndex === idx ? 'opacity-50 scale-95' : 'opacity-100 scale-100 hover:scale-105'
                              }`}
                            >
                              <div className="relative aspect-square rounded-lg border-2 border-purple-300 hover:border-purple-500 transition-all overflow-hidden shadow-sm hover:shadow-md">
                                <img 
                                  src={url} 
                                  alt={`Room ${idx + 1}`} 
                                  className="w-full h-full object-cover" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                                    <Icon 
                                      name="Move" 
                                      size={28} 
                                      className="text-white drop-shadow-lg"
                                    />
                                    <span className="text-white text-[10px] font-medium drop-shadow">
                                      Перетащите
                                    </span>
                                  </div>
                                </div>
                                <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                                  {idx + 1}
                                </div>
                                {idx === 0 && (
                                  <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                                    Главное
                                  </div>
                                )}
                              </div>
                              <div className="absolute -top-2 -right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) replaceRoomPhoto(idx, file);
                                  }}
                                  className="hidden"
                                  id={`replace-photo-new-${idx}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => document.getElementById(`replace-photo-new-${idx}`)?.click()}
                                  className="bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-blue-600 hover:scale-110 transition-all shadow-lg"
                                  title="Заменить фото"
                                >
                                  <Icon name="RefreshCw" size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeNewRoomPhoto(idx)}
                                  className="bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all shadow-lg"
                                  title="Удалить фото"
                                >
                                  <Icon name="Trash2" size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!newRoom.images || newRoom.images.length < 10) && (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl transition-all ${
                          isDragging 
                            ? 'border-purple-500 bg-gradient-to-br from-purple-100 to-pink-100 scale-[1.01] shadow-lg' 
                            : 'border-purple-300 hover:border-purple-400 bg-gradient-to-br from-gray-50 to-purple-50/30 hover:shadow-md'
                        } ${uploadingRoomPhotos ? 'opacity-50 pointer-events-none' : ''} p-6`}
                      >
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className={`p-3 rounded-full transition-all ${
                            isDragging 
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg scale-110' 
                              : 'bg-gradient-to-br from-purple-100 to-pink-100'
                          }`}>
                            <Icon 
                              name={isDragging ? "Download" : "ImagePlus"} 
                              size={28} 
                              className={isDragging ? 'text-white' : 'text-purple-600'}
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
                                <p className="text-base font-semibold mb-1 text-gray-900">
                                  {isDragging ? '✨ Отпустите для загрузки' : 'Добавить фотографии'}
                                </p>
                                <p className="text-sm text-muted-foreground mb-1">
                                  Перетащите файлы или нажмите кнопку
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  JPG, PNG, WebP • До 10 фото на номер
                                </p>
                              </div>
                              
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleNewRoomPhotosUpload}
                                className="hidden"
                                id="room-photos-input-new"
                              />
                              <Button
                                type="button"
                                onClick={() => document.getElementById('room-photos-input-new')?.click()}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all mt-2"
                              >
                                <Icon name="Upload" size={16} className="mr-2" />
                                Выбрать фото ({newRoom.images?.length || 0}/10)
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {newRoom.images && newRoom.images.length >= 10 && (
                      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-center">
                        <Icon name="AlertCircle" size={24} className="mx-auto mb-2 text-amber-600" />
                        <p className="text-sm text-amber-800 font-medium">
                          Достигнут лимит: 10 фотографий
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          Удалите ненужные фото, чтобы загрузить новые
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Удобства в номере</label>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {['WiFi', 'Смарт ТВ', 'Кондиционер', 'Душевая кабина', 'Холодильник', 'Двуспальная кровать'].map((quickFeature) => {
                        const isSelected = newRoom.features && newRoom.features.includes(quickFeature);
                        const iconName = featureIcons[quickFeature] || 'Check';
                        return (
                          <Button
                            key={quickFeature}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleNewRoomFeature(quickFeature)}
                            className={isSelected ? 'bg-purple-600 hover:bg-purple-700' : 'hover:bg-purple-50'}
                          >
                            <Icon name={iconName} size={14} className="mr-1" />
                            {quickFeature}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
                      {availableFeatures.map((feature) => {
                        const iconName = featureIcons[feature] || 'Check';
                        const isChecked = newRoom.features && newRoom.features.includes(feature);
                        return (
                          <div
                            key={feature}
                            onClick={() => toggleNewRoomFeature(feature)}
                            className={`group relative inline-flex items-center justify-center w-12 h-12 rounded-full cursor-pointer transition-all hover:scale-110 ${
                              isChecked 
                                ? 'bg-purple-600 text-white shadow-lg' 
                                : 'bg-white hover:bg-purple-100 text-purple-600'
                            }`}
                            title={feature}
                          >
                            <Icon name={iconName} size={20} />
                            {isChecked && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <Icon name="Check" size={12} className="text-white" />
                              </div>
                            )}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              {feature}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    onClick={addRoom} 
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Icon name="Plus" size={18} className="mr-2" />
                    Добавить категорию
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
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