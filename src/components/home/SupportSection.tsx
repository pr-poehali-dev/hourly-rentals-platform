import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

export default function SupportSection() {
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
            Поддержка
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-purple-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                <Icon name="MessageCircle" size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-purple-900">Telegram</h3>
              <p className="text-muted-foreground mb-4">
                Свяжитесь с нами в Telegram для быстрой поддержки
              </p>
              <a href="https://t.me/HELP120MINUT" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full border-purple-300">
                  <Icon name="Send" size={18} className="mr-2" />
                  Написать в Telegram
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                <Icon name="Mail" size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-purple-900">Email</h3>
              <p className="text-muted-foreground mb-4">
                Напишите нам на электронную почту
              </p>
              <a href="mailto:support@120minut.ru">
                <Button variant="outline" className="w-full border-purple-300">
                  <Icon name="Mail" size={18} className="mr-2" />
                  support@120minut.ru
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-8 border border-purple-200">
          <h3 className="text-2xl font-semibold mb-6 text-purple-900">Часто задаваемые вопросы</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2 text-purple-800">Как забронировать номер?</h4>
              <p className="text-muted-foreground">
                Выберите интересующий объект в каталоге и свяжитесь с владельцем напрямую по указанному телефону или через Telegram. Бронирование происходит напрямую с владельцем.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-purple-800">Какой минимальный срок аренды?</h4>
              <p className="text-muted-foreground">
                Минимальный срок зависит от конкретного объекта. Обычно это от 2 часов. Точную информацию можно увидеть в карточке отеля.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-purple-800">Как оплачивать бронирование?</h4>
              <p className="text-muted-foreground">
                Оплата происходит напрямую владельцу отеля согласованным способом (наличные, карта, переводом). Платформа не взимает комиссию с гостей.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-purple-800">Можно ли отменить бронирование?</h4>
              <p className="text-muted-foreground">
                Условия отмены зависят от политики конкретного отеля. Уточните этот вопрос при бронировании с владельцем.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-purple-800">Как добавить свой отель на платформу?</h4>
              <p className="text-muted-foreground">
                Перейдите на страницу "Партнерам" и нажмите "Добавить объект". Заполните форму с информацией о вашем отеле, и после модерации он появится в каталоге.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-start gap-4">
            <Icon name="HelpCircle" size={24} className="text-purple-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold mb-2 text-purple-900">Не нашли ответ?</h4>
              <p className="text-muted-foreground mb-4">
                Свяжитесь с нами любым удобным способом, и мы ответим на все ваши вопросы
              </p>
              <div className="flex flex-wrap gap-2">
                <a href="https://t.me/HELP120MINUT" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="border-purple-300">
                    <Icon name="Send" size={16} className="mr-2" />
                    Telegram
                  </Button>
                </a>
                <a href="mailto:support@120minut.ru">
                  <Button size="sm" variant="outline" className="border-purple-300">
                    <Icon name="Mail" size={16} className="mr-2" />
                    Email
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}