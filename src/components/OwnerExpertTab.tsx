import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import ImageLightbox from '@/components/ImageLightbox';

interface Room {
  id: number;
  type: string;
  price: number;
  images?: string[];
  description?: string;
  expert_photo_rating?: number;
  expert_photo_feedback?: string;
  expert_fullness_rating?: number;
  expert_fullness_feedback?: string;
}

interface Listing {
  id: number;
  title: string;
  city: string;
  district?: string;
  image_url: string;
  type: string;
  expert_photo_rating?: number;
  expert_photo_feedback?: string;
  expert_fullness_rating?: number;
  expert_fullness_feedback?: string;
  moderation_status?: string;
  rooms?: Room[];
}

interface OwnerExpertTabProps {
  listings: Listing[];
  token: string;
  ownerId: number;
  onUpdate: () => void;
}

const renderStars = (score: number) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name="Star"
          size={20}
          className={star <= score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
        />
      ))}
    </div>
  );
};

const getScoreColor = (score: number) => {
  if (score <= 2) return 'text-red-600';
  if (score === 3) return 'text-orange-600';
  if (score === 4) return 'text-blue-600';
  return 'text-green-600';
};

const getScoreBgColor = (score: number) => {
  if (score <= 2) return 'bg-red-50 border-red-200';
  if (score === 3) return 'bg-orange-50 border-orange-200';
  if (score === 4) return 'bg-blue-50 border-blue-200';
  return 'bg-green-50 border-green-200';
};

const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
  if (score <= 2) return 'destructive';
  if (score === 3) return 'secondary';
  return 'default';
};

const RatingCard = ({ 
  icon, 
  iconColor, 
  iconBg, 
  title, 
  subtitle, 
  rating, 
  feedback,
  image,
  text,
  images,
  onImageClick
}: { 
  icon: string; 
  iconColor: string; 
  iconBg: string; 
  title: string; 
  subtitle?: string;
  rating: number; 
  feedback: string;
  image?: string;
  text?: string;
  images?: string[];
  onImageClick?: (imgs: string[], idx: number) => void;
}) => (
  <div className="bg-white border rounded-lg p-6 hover:border-purple-300 transition-colors">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center`}>
          <Icon name={icon as any} size={24} className={iconColor} />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <Badge variant={getScoreBadgeVariant(rating)} className="text-sm px-3 py-1">
        {rating} из 5
      </Badge>
    </div>

    {(image || images || text) && (
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
        <p className="text-sm font-medium mb-3 flex items-center gap-2">
          <Icon name="Eye" size={16} className="text-purple-600" />
          Оцениваемый контент:
        </p>
        {image && (
          <img 
            src={image} 
            alt={title} 
            className="w-full h-48 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => onImageClick?.([image], 0)}
          />
        )}
        {images && images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {images.slice(0, 6).map((img, idx) => (
              <img 
                key={idx} 
                src={img} 
                alt={`${title} ${idx + 1}`} 
                className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onImageClick?.(images, idx)}
              />
            ))}
          </div>
        )}
        {text && (
          <div className="text-sm text-gray-700 whitespace-pre-line">
            {text}
          </div>
        )}
      </div>
    )}
    
    <div className="mb-4 flex items-center gap-2">
      {renderStars(rating)}
      <span className={`font-bold text-lg ml-2 ${getScoreColor(rating)}`}>
        {rating} звезд{rating === 1 ? 'а' : rating <= 4 ? 'ы' : ''}
      </span>
    </div>
    
    <div className={`p-4 rounded-lg border ${getScoreBgColor(rating)}`}>
      <div className="flex items-start gap-3">
        <Icon 
          name={rating >= 4 ? "ThumbsUp" : "AlertCircle"} 
          size={20} 
          className={getScoreColor(rating)}
        />
        <div>
          <h4 className={`font-semibold mb-1 ${getScoreColor(rating)}`}>
            Обратная связь эксперта:
          </h4>
          <p className="text-sm whitespace-pre-line">{feedback}</p>
          {rating < 4 && (
            <p className="text-xs mt-3 text-gray-600 italic">
              💡 Исправьте указанные замечания и нажмите кнопку "Исправлено" внизу карточки для повторной проверки
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default function OwnerExpertTab({ listings, token, ownerId, onUpdate }: OwnerExpertTabProps) {
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [submittingRecheck, setSubmittingRecheck] = useState<number | null>(null);
  const { toast } = useToast();

  const handleImageClick = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleMarkAsFixed = async (listingId: number, listingTitle: string) => {
    try {
      setSubmittingRecheck(listingId);
      
      await api.submitListingForRecheck(token, listingId);
      
      toast({
        title: 'Успешно!',
        description: `Объект "${listingTitle}" отправлен на повторную проверку`,
      });
      
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось отправить на проверку',
        variant: 'destructive',
      });
    } finally {
      setSubmittingRecheck(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Icon name="Award" size={32} className="text-purple-600" />
              <div>
                <CardTitle className="text-2xl">Экспертная оценка ваших объектов</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Улучшите свои объекты с помощью рекомендаций от экспертов
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
              onClick={() => window.open('https://t.me/your_expert_channel', '_blank')}
            >
              <div className="text-left">
                <div className="font-bold text-base">Я ПРОДАМ ВСЕ</div>
                <div className="text-xs opacity-90 -mt-0.5">
                  используйте советы от ведущего эксперта для ведения успешного бизнеса в почасовой аренде
                </div>
              </div>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Icon name="Building" size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">У вас пока нет объектов для оценки</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {listings.map((listing) => {
            const hasPhotoRating = listing.expert_photo_rating && listing.expert_photo_rating > 0;
            const hasFullnessRating = listing.expert_fullness_rating && listing.expert_fullness_rating > 0;
            const hasAnyRating = hasPhotoRating || hasFullnessRating;
            const hasRoomRatings = listing.rooms?.some(room => 
              (room.expert_photo_rating && room.expert_photo_rating > 0) || 
              (room.expert_fullness_rating && room.expert_fullness_rating > 0)
            );
            
            return (
              <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-1">{listing.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon name="MapPin" size={14} />
                        <span>{listing.city}</span>
                        <Badge variant="outline">{listing.type}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {!hasAnyRating && !hasRoomRatings ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Icon name="Clock" size={48} className="mx-auto mb-3 opacity-20" />
                      <p>Эксперт ещё не оценил этот объект</p>
                      <p className="text-sm mt-1">Оценка появится после проверки</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Оценки основного объекта */}
                      {hasAnyRating && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Icon name="Building" size={20} className="text-purple-600" />
                            Основной объект
                          </h3>
                          
                          {hasPhotoRating && (
                            <RatingCard
                              icon="Camera"
                              iconColor="text-purple-600"
                              iconBg="bg-purple-100"
                              title="Главное фото"
                              subtitle="Оценка от эксперта"
                              rating={listing.expert_photo_rating!}
                              feedback={listing.expert_photo_feedback!}
                              image={listing.image_url}
                              onImageClick={handleImageClick}
                            />
                          )}

                          {hasFullnessRating && (
                            <RatingCard
                              icon="ListChecks"
                              iconColor="text-blue-600"
                              iconBg="bg-blue-100"
                              title="Описание объекта"
                              subtitle="Оценка от эксперта"
                              rating={listing.expert_fullness_rating!}
                              feedback={listing.expert_fullness_feedback!}
                              text={`${listing.title}\n\n${listing.type}, ${listing.city}${listing.district ? `, ${listing.district}` : ''}`}
                            />
                          )}
                        </div>
                      )}

                      {/* Оценки номеров */}
                      {hasRoomRatings && (
                        <div className="space-y-4 pt-4 border-t">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Icon name="Bed" size={20} className="text-green-600" />
                            Категории номеров
                          </h3>
                          
                          {listing.rooms?.map((room, idx) => {
                            const hasRoomPhotoRating = room.expert_photo_rating && room.expert_photo_rating > 0;
                            const hasRoomFullnessRating = room.expert_fullness_rating && room.expert_fullness_rating > 0;
                            
                            if (!hasRoomPhotoRating && !hasRoomFullnessRating) return null;
                            
                            return (
                              <Card key={idx} className="border-2">
                                <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 pb-3">
                                  <CardTitle className="text-base flex items-center justify-between">
                                    <span>{room.type}</span>
                                    <span className="text-sm font-normal text-muted-foreground">{room.price} ₽/час</span>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                  {hasRoomPhotoRating && (
                                    <RatingCard
                                      icon="Camera"
                                      iconColor="text-purple-600"
                                      iconBg="bg-purple-100"
                                      title="Фотографии номера"
                                      rating={room.expert_photo_rating!}
                                      feedback={room.expert_photo_feedback!}
                                      images={room.images}
                                      onImageClick={handleImageClick}
                                    />
                                  )}

                                  {hasRoomFullnessRating && (
                                    <RatingCard
                                      icon="ListChecks"
                                      iconColor="text-blue-600"
                                      iconBg="bg-blue-100"
                                      title="Описание номера"
                                      rating={room.expert_fullness_rating!}
                                      feedback={room.expert_fullness_feedback!}
                                      text={room.description || `${room.type} - ${room.price} ₽/час`}
                                    />
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}

                      {listing.moderation_status !== 'awaiting_recheck' && (
                        <div className="pt-6 border-t">
                          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-4">
                                <Icon name="CheckCircle" size={24} className="text-green-600 flex-shrink-0" />
                                <div className="flex-1">
                                  <h4 className="font-semibold text-lg mb-2">Исправили замечания?</h4>
                                  <p className="text-sm text-gray-600 mb-4">
                                    Внесите изменения в объект согласно рекомендациям эксперта, затем нажмите кнопку ниже. 
                                    Ваш объект будет отправлен на повторную проверку.
                                  </p>
                                  <Button 
                                    onClick={() => handleMarkAsFixed(listing.id, listing.title)}
                                    disabled={submittingRecheck === listing.id}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {submittingRecheck === listing.id ? (
                                      <>
                                        <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                                        Отправка...
                                      </>
                                    ) : (
                                      <>
                                        <Icon name="Send" size={16} className="mr-2" />
                                        Исправлено, отправить на проверку
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {listing.moderation_status === 'awaiting_recheck' && (
                        <div className="pt-6 border-t">
                          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-4">
                                <Icon name="Clock" size={24} className="text-blue-600 flex-shrink-0" />
                                <div>
                                  <h4 className="font-semibold text-lg mb-2">Ожидает повторной проверки</h4>
                                  <p className="text-sm text-gray-600">
                                    Объект отправлен эксперту на повторную проверку. 
                                    Результаты появятся в ближайшее время.
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      </div>

      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />
    </>
  );
}