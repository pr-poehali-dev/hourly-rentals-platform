import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';

type Hotel = {
  id: number;
  title: string;
  type: string;
  city: string;
  district: string;
  price: number;
  auction: number;
  image: string;
  logo?: string;
  metro: string;
  features: string[];
  lat: number;
  lng: number;
  minHours: number;
  rooms: { type: string; price: number }[];
};

interface HotelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotel: Hotel | null;
}

export default function HotelModal({ open, onOpenChange, hotel }: HotelModalProps) {
  const navigate = useNavigate();
  
  if (!hotel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {hotel.title}
            </DialogTitle>
            {hotel.logo && (
              <div className="w-20 h-20 border rounded-lg bg-white p-2 flex items-center justify-center flex-shrink-0">
                <img src={hotel.logo} alt={`${hotel.title} logo`} className="max-w-full max-h-full object-contain" />
              </div>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="relative">
            <div className="h-64 bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center text-9xl rounded-xl">
              {hotel.image}
            </div>
            {hotel.auction <= 3 && (
              <Badge className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-lg px-4 py-2">
                <Icon name="Trophy" size={20} className="mr-2" />
                ТОП-{hotel.auction}
              </Badge>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Icon name="MapPin" size={20} className="text-purple-600" />
                Местоположение
              </h3>
              <div className="space-y-2 text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Icon name="Building2" size={16} />
                  {hotel.city}, {hotel.district}
                </p>
                {hotel.metro !== '-' && (
                  <p className="flex items-center gap-2">
                    <span className="text-blue-600">Ⓜ️</span>
                    {hotel.metro}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Icon name="Star" size={20} className="text-orange-500 fill-orange-500" />
                Рейтинг
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-purple-600">{hotel.rating}</div>
                <div className="text-muted-foreground">
                  <div className="font-semibold">{hotel.reviews} отзывов</div>
                  <div className="text-sm">Отличные оценки</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Icon name="Sparkles" size={20} className="text-purple-600" />
              Удобства
            </h3>
            <div className="flex flex-wrap gap-2">
              {hotel.features.map(feature => (
                <Badge key={feature} variant="secondary" className="text-sm px-3 py-1">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Icon name="Bed" size={20} className="text-purple-600" />
              Категории номеров
            </h3>
            <div className="space-y-3">
              {hotel.rooms.map((room, idx) => (
                <div 
                  key={idx} 
                  className="border-2 border-purple-100 rounded-xl p-4 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/listing/${hotel.id}/room/${idx}`);
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-bold">{room.type}</h4>
                      <p className="text-sm text-muted-foreground">Нажмите для просмотра деталей</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-purple-600">{room.price} ₽</div>
                      <div className="text-sm text-muted-foreground">за час</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-purple-600 font-medium">
                    <Icon name="Eye" size={18} />
                    <span>Смотреть детали номера</span>
                    <Icon name="ArrowRight" size={18} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-100">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Icon name="Info" size={20} className="text-purple-600" />
              Важная информация
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Icon name="CheckCircle2" size={16} className="text-green-500 mt-0.5" />
                <span>Минимальное время бронирования — 1 час</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="CheckCircle2" size={16} className="text-green-500 mt-0.5" />
                <span>Оплата наличными или картой при заселении</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="CheckCircle2" size={16} className="text-green-500 mt-0.5" />
                <span>Бесплатная отмена за 1 час до заселения</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="CheckCircle2" size={16} className="text-green-500 mt-0.5" />
                <span>Круглосуточная поддержка клиентов</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button 
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-lg py-6"
            >
              <Icon name="Phone" size={20} className="mr-2" />
              Позвонить владельцу
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg py-6"
            >
              <Icon name="MessageCircle" size={20} className="mr-2" />
              Написать в WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}