import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export default function PartnersSection() {
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
            Для владельцев отелей
          </h2>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-8 border border-purple-200 mb-8">
          <h3 className="text-2xl font-semibold mb-6 text-purple-900">Преимущества размещения</h3>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="flex gap-3">
              <Icon name="Users" size={24} className="text-purple-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Больше клиентов</h4>
                <p className="text-sm text-muted-foreground">Доступ к тысячам потенциальных гостей по всей России</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Icon name="TrendingUp" size={24} className="text-purple-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Увеличение дохода</h4>
                <p className="text-sm text-muted-foreground">Заполняемость номеров и дополнительный доход от почасовой аренды</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Icon name="Smartphone" size={24} className="text-purple-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Удобное управление</h4>
                <p className="text-sm text-muted-foreground">Личный кабинет для управления объявлениями и ценами</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Icon name="Award" size={24} className="text-purple-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Повышение рейтинга</h4>
                <p className="text-sm text-muted-foreground">Система отзывов и рейтингов для привлечения новых гостей</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-semibold mb-4 text-purple-900">Как начать работу?</h4>
            <ol className="space-y-3 text-muted-foreground mb-6">
              <li className="flex gap-2">
                <span className="font-semibold text-purple-600">1.</span>
                <span>Зарегистрируйтесь в экстранете для владельцев</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-purple-600">2.</span>
                <span>Добавьте информацию о вашем отеле и номерах</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-purple-600">3.</span>
                <span>Дождитесь модерации (обычно 1-2 рабочих дня)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-purple-600">4.</span>
                <span>Начните принимать бронирования!</span>
              </li>
            </ol>

            <div className="flex flex-col sm:flex-row gap-3">
              <a href="/add-listing" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Icon name="Plus" size={18} className="mr-2" />
                  Добавить объект
                </Button>
              </a>
              <a href="/owner/login" className="flex-1">
                <Button variant="outline" className="w-full border-purple-300">
                  Войти в экстранет
                </Button>
              </a>
            </div>
          </div>
        </div>

        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Icon name="Info" size={24} className="text-purple-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-2 text-purple-900">Условия размещения</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Размещение объектов на платформе бесплатное. Мы не берем комиссию с бронирований.
                </p>
                <p className="text-sm text-muted-foreground">
                  Владельцы платят только за продвижение объявлений (опционально) и участие в рейтинговом аукционе за топовые позиции в каталоге.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}