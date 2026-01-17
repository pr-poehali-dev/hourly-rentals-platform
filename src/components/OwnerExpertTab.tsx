import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Listing {
  id: number;
  title: string;
  city: string;
  image_url: string;
  type: string;
}

interface ExpertRating {
  category: string;
  score: number;
  description: string;
  recommendation: string;
}

interface OwnerExpertTabProps {
  listings: Listing[];
}

const getPhotoRating = (listing: Listing): ExpertRating => {
  const hasImage = listing.image_url && listing.image_url.length > 50;
  
  if (!hasImage) {
    return {
      category: 'Фотографии',
      score: 1,
      description: 'Все очень плохо',
      recommendation: 'Ваши фотографии совсем грустные, обновите фотографии, ведь Вы теряете гостей.'
    };
  }

  const imageLength = listing.image_url.length;
  
  if (imageLength < 100) {
    return {
      category: 'Фотографии',
      score: 2,
      description: 'Фотографии плохого качества',
      recommendation: 'Ваши фотографии являются не очень красивой оберткой. Рекомендую обновить фотографии, ведь Вы теряете гостей.'
    };
  } else if (imageLength < 200) {
    return {
      category: 'Фотографии',
      score: 3,
      description: 'Фотографии удовлетворительного качества',
      recommendation: 'Ваши фотографии являются не очень красивой оберткой. Рекомендую обновить фотографии, ведь Вы теряете гостей.'
    };
  } else if (imageLength < 300) {
    return {
      category: 'Фотографии',
      score: 4,
      description: 'Хорошие фотографии',
      recommendation: 'У Вас хорошие фотографии, но могут быть еще лучше.'
    };
  }
  
  return {
    category: 'Фотографии',
    score: 5,
    description: 'Идеально',
    recommendation: 'Нет слов, превосходно. Вы знаете как привлечь гостей.'
  };
};

const renderStars = (score: number) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name="Star"
          size={24}
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

const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
  if (score <= 2) return 'destructive';
  if (score === 3) return 'secondary';
  return 'default';
};

export default function OwnerExpertTab({ listings }: OwnerExpertTabProps) {
  return (
    <div className="space-y-6">
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Icon name="Award" size={32} className="text-purple-600" />
            <div>
              <CardTitle className="text-2xl">Экспертная оценка ваших объектов</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Улучшите свои объекты с помощью рекомендаций от экспертов
              </p>
            </div>
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
            const photoRating = getPhotoRating(listing);
            
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
                  <div className="space-y-6">
                    <div className="bg-white border rounded-lg p-6 hover:border-purple-300 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <Icon name="Camera" size={24} className="text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{photoRating.category}</h3>
                            <p className="text-sm text-muted-foreground">{photoRating.description}</p>
                          </div>
                        </div>
                        <Badge variant={getScoreBadgeVariant(photoRating.score)} className="text-sm px-3 py-1">
                          {photoRating.score} из 5
                        </Badge>
                      </div>
                      
                      <div className="mb-4 flex items-center gap-2">
                        {renderStars(photoRating.score)}
                        <span className={`font-bold text-lg ml-2 ${getScoreColor(photoRating.score)}`}>
                          {photoRating.score} звезд{photoRating.score === 1 ? 'а' : photoRating.score <= 4 ? 'ы' : ''}
                        </span>
                      </div>
                      
                      <div className={`p-4 rounded-lg ${
                        photoRating.score <= 2 ? 'bg-red-50 border border-red-200' :
                        photoRating.score === 3 ? 'bg-orange-50 border border-orange-200' :
                        photoRating.score === 4 ? 'bg-blue-50 border border-blue-200' :
                        'bg-green-50 border border-green-200'
                      }`}>
                        <div className="flex items-start gap-3">
                          <Icon 
                            name={photoRating.score >= 4 ? "ThumbsUp" : "AlertCircle"} 
                            size={20} 
                            className={getScoreColor(photoRating.score)}
                          />
                          <div>
                            <h4 className={`font-semibold mb-1 ${getScoreColor(photoRating.score)}`}>
                              Рекомендация эксперта:
                            </h4>
                            <p className="text-sm">{photoRating.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
