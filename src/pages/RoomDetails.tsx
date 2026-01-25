import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

export default function RoomDetails() {
  const { listingId, roomIndex } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);

  useEffect(() => {
    const loadListing = async () => {
      try {
        const listings = await api.getPublicListings();
        const foundListing = listings.find((l: any) => l.id === parseInt(listingId || '0'));
        
        // Загружаем полные детали номера с фотографиями
        const roomDetails = await api.getRoomDetails(parseInt(listingId || '0'), parseInt(roomIndex || '0'));
        
        console.log('Room details with images:', roomDetails);
        console.log('Room images:', roomDetails?.images);
        
        setListing(foundListing);
        setRoom(roomDetails);
      } catch (error) {
        console.error('Failed to load listing:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadListing();
  }, [listingId, roomIndex]);

  const featureIcons: Record<string, string> = {
    'WiFi': 'Wifi',
    'Двуспальная кровать': 'Bed',
    '2 односпальные кровати': 'BedDouble',
    'Смарт ТВ': 'Tv',
    'Кондиционер': 'Wind',
    'Джакузи': 'Bath',
    'Душевая кабина': 'ShowerHead',
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
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <Icon name="Loader2" size={48} className="animate-spin text-purple-600" />
      </div>
    );
  }

  if (!room || !listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Номер не найден</h2>
          <Button onClick={() => navigate('/')}>
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            На главную
          </Button>
        </div>
      </div>
    );
  }

  const roomImages = room.images && Array.isArray(room.images) && room.images.length > 0 
    ? room.images 
    : [listing.image_url];

  console.log('Final roomImages array:', roomImages);
  console.log('roomImages length:', roomImages.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-purple-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(`/`)}>
              <Icon name="ArrowLeft" size={20} />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{listing.title}</h1>
              <p className="text-sm text-muted-foreground">{listing.city}, {listing.district}</p>
            </div>
            {listing.logo_url && (
              <div className="w-16 h-16 border rounded-lg bg-white p-1 flex items-center justify-center">
                <img src={listing.logo_url} alt={`${listing.title} logo`} className="max-w-full max-h-full object-contain" />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Левая колонка: Фото */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={roomImages[selectedImageIndex]}
                    alt={room.type}
                    className="w-full h-[400px] object-cover cursor-pointer"
                    onClick={() => setImageGalleryOpen(true)}
                  />
                  {roomImages.length > 1 && (
                    <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {selectedImageIndex + 1} / {roomImages.length}
                    </div>
                  )}
                  <button
                    onClick={() => setImageGalleryOpen(true)}
                    className="absolute bottom-4 right-4 bg-white/90 hover:bg-white px-4 py-2 rounded-lg shadow-lg font-medium flex items-center gap-2 transition-all"
                  >
                    <Icon name="Maximize2" size={18} />
                    Смотреть все фото
                  </button>
                </div>

                {roomImages.length > 1 && (
                  <div className="p-4 flex gap-2 overflow-x-auto">
                    {roomImages.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === idx ? 'border-purple-600 scale-105' : 'border-gray-200 hover:border-purple-400'
                        }`}
                      >
                        <img src={img} alt={`${room.type} ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Удобства */}
            {room.features && room.features.length > 0 && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                    <Icon name="Sparkles" size={20} className="text-purple-600" />
                    Удобства в номере
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {room.features.map((feature: string, idx: number) => {
                      const iconName = featureIcons[feature] || 'Check';
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          <Icon name={iconName} size={20} className="text-purple-600 flex-shrink-0" />
                          <span className="text-sm font-medium">{feature}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Описание */}
            {room.description && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl mb-3">Описание</h3>
                  <p className="text-muted-foreground leading-relaxed">{room.description}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Правая колонка: Информация и бронирование */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-3xl font-bold mb-3">{room.type}</h2>
                  
                  <div className="flex items-center gap-3 mb-4">
                    {room.square_meters > 0 && (
                      <Badge variant="secondary" className="text-base px-3 py-1">
                        <Icon name="Square" size={16} className="mr-1" />
                        {room.square_meters} м²
                      </Badge>
                    )}
                    {room.min_hours > 0 && (
                      <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-base px-3 py-1">
                        <Icon name="Clock" size={16} className="mr-1" />
                        от {room.min_hours}ч
                      </Badge>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4">
                    <div className="text-sm text-muted-foreground mb-1">Стоимость</div>
                    <div className="text-4xl font-bold text-purple-600">{room.price} ₽</div>
                    <div className="text-sm text-muted-foreground">за час</div>
                  </div>

                  {/* Предупреждения о ценах */}
                  {(listing?.price_warning_holidays || listing?.price_warning_daytime) && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 mb-4 space-y-2">
                      {listing.price_warning_holidays && (
                        <div className="flex items-start gap-2">
                          <Icon name="AlertCircle" size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm font-semibold text-red-700">
                            Внимание: Цены в праздничные и выходные дни могут отличаться
                          </p>
                        </div>
                      )}
                      {listing.price_warning_daytime && (
                        <div className="flex items-start gap-2">
                          <Icon name="AlertCircle" size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm font-semibold text-red-700">
                            Цены указаны на дневной тариф
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    {room.payment_methods && (
                      <div className="flex gap-3">
                        <Icon name="CreditCard" size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-sm">Оплата</div>
                          <div className="text-sm text-muted-foreground">{room.payment_methods}</div>
                        </div>
                      </div>
                    )}
                    {room.cancellation_policy && (
                      <div className="flex gap-3">
                        <Icon name="CalendarX" size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-sm">Отмена</div>
                          <div className="text-sm text-muted-foreground">{room.cancellation_policy}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    {listing.phone && (
                      <Button 
                        onClick={() => setPhoneModalOpen(true)}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-lg py-6"
                      >
                        <Icon name="Phone" size={20} className="mr-2" />
                        Позвонить
                      </Button>
                    )}
                    {listing.telegram && (
                      <Button 
                        asChild
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg py-6"
                      >
                        <a href={listing.telegram.startsWith('http') ? listing.telegram : `https://t.me/${listing.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                          <Icon name="Send" size={20} className="mr-2" />
                          Написать в Telegram
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Информация об отеле */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Icon name="MapPin" size={18} className="text-purple-600" />
                    Местоположение
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">{listing.city}</p>
                    <p className="text-muted-foreground">{listing.district}</p>
                    {listing.metro && listing.metro !== '-' && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-blue-600">Ⓜ️</span>
                        <span>{listing.metro}</span>
                        {listing.metroWalk > 0 && (
                          <>
                            <Icon name="PersonStanding" size={14} className="ml-1" />
                            <span>{listing.metroWalk} мин</span>
                          </>
                        )}
                      </div>
                    )}
                    {listing.hasParking && (
                      <div className="flex items-center gap-2 text-green-600 font-semibold">
                        <Icon name="Car" size={16} />
                        <span>Есть парковка</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Модальное окно с телефоном */}
      <Dialog open={phoneModalOpen} onOpenChange={setPhoneModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Номер телефона</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-6 text-center">
              <Icon name="Phone" size={48} className="mx-auto mb-3 text-green-600" />
              <a href={`tel:${listing.phone}`} className="text-3xl font-bold text-green-600 hover:text-green-700 transition-colors">
                {listing.phone}
              </a>
            </div>
            <Button 
              asChild
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-lg py-6"
            >
              <a href={`tel:${listing.phone}`}>
                <Icon name="Phone" size={20} className="mr-2" />
                Позвонить сейчас
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Галерея фото */}
      <Dialog open={imageGalleryOpen} onOpenChange={setImageGalleryOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{room.type} - Фото {selectedImageIndex + 1} из {roomImages.length}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <img
              src={roomImages[selectedImageIndex]}
              alt={`${room.type} ${selectedImageIndex + 1}`}
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
            {roomImages.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? roomImages.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all"
                >
                  <Icon name="ChevronLeft" size={24} />
                </button>
                <button
                  onClick={() => setSelectedImageIndex((prev) => (prev === roomImages.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all"
                >
                  <Icon name="ChevronRight" size={24} />
                </button>
              </>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto py-2">
            {roomImages.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImageIndex === idx ? 'border-purple-600 scale-105' : 'border-gray-200 hover:border-purple-400'
                }`}
              >
                <img src={img} alt={`${room.type} ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}