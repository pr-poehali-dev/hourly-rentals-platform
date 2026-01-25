import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export default function AboutSection() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center mb-8">
          <img 
            src="https://cdn.poehali.dev/projects/1a35ca30-983f-4a91-b0b4-3c6fa1c9a65b/files/8251a8b2-9b61-4cee-9e68-aae6e7ec6e96.jpg" 
            alt="120 минут" 
            className="h-20 w-20 object-contain mb-4"
          />
          <h2 className="text-4xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            О платформе 120 минут
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="border-purple-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                <Icon name="Clock" size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-purple-900">Быстрое бронирование</h3>
              <p className="text-muted-foreground">
                Забронируйте номер всего за пару минут. Без лишних формальностей и ожидания.
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                <Icon name="MapPin" size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-purple-900">По всей России</h3>
              <p className="text-muted-foreground">
                Сотни проверенных отелей и апартаментов в разных городах страны.
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                <Icon name="Shield" size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-purple-900">Проверенные объекты</h3>
              <p className="text-muted-foreground">
                Все отели проходят модерацию. Мы гарантируем качество и безопасность.
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                <Icon name="DollarSign" size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-purple-900">Выгодные цены</h3>
              <p className="text-muted-foreground">
                Прозрачные цены без скрытых комиссий. Оплата напрямую владельцу.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-8 border border-purple-200">
          <h3 className="text-2xl font-semibold mb-4 text-purple-900">Как это работает?</h3>
          <ol className="space-y-4 text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center font-semibold">1</span>
              <span>Выберите город и тип размещения</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center font-semibold">2</span>
              <span>Просмотрите доступные объекты с фотографиями и ценами</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center font-semibold">3</span>
              <span>Свяжитесь с владельцем по телефону или в Telegram</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center font-semibold">4</span>
              <span>Забронируйте номер на нужное количество часов</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}