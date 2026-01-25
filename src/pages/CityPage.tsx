import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useEffect } from 'react';

const cities = {
  'moskva': {
    name: 'Москва',
    nameEn: 'Moscow',
    region: 'Центральный федеральный округ',
    description: 'Почасовая аренда номеров в отелях Москвы от 2 часов. Более 150 проверенных объектов в разных районах столицы.',
    features: ['Более 150 отелей', 'От 500₽ за 2 часа', 'Центр и районы', 'Круглосуточно'],
    keywords: 'почасовая аренда Москва, отель на час Москва, снять номер на 2 часа Москва, гостиница почасовая Москва'
  },
  'sankt-peterburg': {
    name: 'Санкт-Петербург',
    nameEn: 'Saint Petersburg',
    region: 'Северо-Западный федеральный округ',
    description: 'Почасовая аренда номеров в отелях Санкт-Петербурга от 2 часов. Удобное расположение, проверенные объекты.',
    features: ['Более 100 отелей', 'От 450₽ за 2 часа', 'Центр и Васильевский остров', '24/7'],
    keywords: 'почасовая аренда СПб, отель на час Санкт-Петербург, снять номер Питер'
  },
  'kazan': {
    name: 'Казань',
    nameEn: 'Kazan',
    region: 'Приволжский федеральный округ',
    description: 'Почасовая аренда номеров в отелях Казани от 2 часов. Доступные цены, удобные локации.',
    features: ['50+ отелей', 'От 400₽ за 2 часа', 'Центр и районы', 'Быстрое бронирование'],
    keywords: 'почасовая аренда Казань, отель на час Казань, снять номер Казань'
  },
  'ekaterinburg': {
    name: 'Екатеринбург',
    nameEn: 'Ekaterinburg',
    region: 'Уральский федеральный округ',
    description: 'Почасовая аренда номеров в отелях Екатеринбурга от 2 часов. Широкий выбор вариантов размещения.',
    features: ['70+ отелей', 'От 350₽ за 2 часа', 'Все районы города', 'Без комиссии'],
    keywords: 'почасовая аренда Екатеринбург, отель на час Екб, снять номер Екатеринбург'
  },
  'novosibirsk': {
    name: 'Новосибирск',
    nameEn: 'Novosibirsk',
    region: 'Сибирский федеральный округ',
    description: 'Почасовая аренда номеров в отелях Новосибирска от 2 часов. Качественные номера по доступным ценам.',
    features: ['60+ отелей', 'От 350₽ за 2 часа', 'Правый и левый берег', 'Проверенные объекты'],
    keywords: 'почасовая аренда Новосибирск, отель на час НСК, снять номер Новосибирск'
  },
  'nizhniy-novgorod': {
    name: 'Нижний Новгород',
    nameEn: 'Nizhny Novgorod',
    region: 'Приволжский федеральный округ',
    description: 'Почасовая аренда номеров в отелях Нижнего Новгорода от 2 часов.',
    features: ['40+ отелей', 'От 300₽ за 2 часа', 'Центр и районы', 'Онлайн бронирование'],
    keywords: 'почасовая аренда Нижний Новгород, отель на час НН'
  },
  'chelyabinsk': {
    name: 'Челябинск',
    nameEn: 'Chelyabinsk',
    region: 'Уральский федеральный округ',
    description: 'Почасовая аренда номеров в отелях Челябинска от 2 часов.',
    features: ['35+ отелей', 'От 300₽ за 2 часа', 'Все районы', 'Без комиссии'],
    keywords: 'почасовая аренда Челябинск, отель на час Челябинск'
  },
  'samara': {
    name: 'Самара',
    nameEn: 'Samara',
    region: 'Приволжский федеральный округ',
    description: 'Почасовая аренда номеров в отелях Самары от 2 часов.',
    features: ['45+ отелей', 'От 350₽ за 2 часа', 'Центр и районы', 'Круглосуточно'],
    keywords: 'почасовая аренда Самара, отель на час Самара'
  },
  'omsk': {
    name: 'Омск',
    nameEn: 'Omsk',
    region: 'Сибирский федеральный округ',
    description: 'Почасовая аренда номеров в отелях Омска от 2 часов.',
    features: ['30+ отелей', 'От 300₽ за 2 часа', 'Разные районы', 'Быстрое бронирование'],
    keywords: 'почасовая аренда Омск, отель на час Омск'
  },
  'rostov-na-donu': {
    name: 'Ростов-на-Дону',
    nameEn: 'Rostov-on-Don',
    region: 'Южный федеральный округ',
    description: 'Почасовая аренда номеров в отелях Ростова-на-Дону от 2 часов.',
    features: ['50+ отелей', 'От 350₽ за 2 часа', 'Центр и районы', 'Проверенные объекты'],
    keywords: 'почасовая аренда Ростов, отель на час Ростов-на-Дону'
  },
  'ufa': {
    name: 'Уфа',
    nameEn: 'Ufa',
    region: 'Приволжский федеральный округ',
    description: 'Почасовая аренда номеров в отелях Уфы от 2 часов.',
    features: ['40+ отелей', 'От 300₽ за 2 часа', 'Все районы', 'Без комиссии'],
    keywords: 'почасовая аренда Уфа, отель на час Уфа'
  },
  'krasnoyarsk': {
    name: 'Красноярск',
    nameEn: 'Krasnoyarsk',
    region: 'Сибирский федеральный округ',
    description: 'Почасовая аренда номеров в отелях Красноярска от 2 часов.',
    features: ['35+ отелей', 'От 300₽ за 2 часа', 'Левый и правый берег', 'Круглосуточно'],
    keywords: 'почасовая аренда Красноярск, отель на час Красноярск'
  },
  'perm': {
    name: 'Пермь',
    nameEn: 'Perm',
    region: 'Приволжский федеральный округ',
    description: 'Почасовая аренда номеров в отелях Перми от 2 часов.',
    features: ['30+ отелей', 'От 300₽ за 2 часа', 'Центр и районы', 'Онлайн бронирование'],
    keywords: 'почасовая аренда Пермь, отель на час Пермь'
  },
  'voronezh': {
    name: 'Воронеж',
    nameEn: 'Voronezh',
    region: 'Центральный федеральный округ',
    description: 'Почасовая аренда номеров в отелях Воронежа от 2 часов.',
    features: ['40+ отелей', 'От 300₽ за 2 часа', 'Разные районы', 'Проверенные объекты'],
    keywords: 'почасовая аренда Воронеж, отель на час Воронеж'
  },
  'volgograd': {
    name: 'Волгоград',
    nameEn: 'Volgograd',
    region: 'Южный федеральный округ',
    description: 'Почасовая аренда номеров в отелях Волгограда от 2 часов.',
    features: ['35+ отелей', 'От 300₽ за 2 часа', 'Все районы', 'Без комиссии'],
    keywords: 'почасовая аренда Волгоград, отель на час Волгоград'
  },
  'krasnodar': {
    name: 'Краснодар',
    nameEn: 'Krasnodar',
    region: 'Южный федеральный округ',
    description: 'Почасовая аренда номеров в отелях Краснодара от 2 часов.',
    features: ['60+ отелей', 'От 350₽ за 2 часа', 'Центр и районы', 'Быстрое бронирование'],
    keywords: 'почасовая аренда Краснодар, отель на час Краснодар'
  },
  'sochi': {
    name: 'Сочи',
    nameEn: 'Sochi',
    region: 'Южный федеральный округ',
    description: 'Почасовая аренда номеров в отелях Сочи от 2 часов. Курортные объекты у моря.',
    features: ['80+ отелей', 'От 400₽ за 2 часа', 'У моря и центр', 'Круглый год'],
    keywords: 'почасовая аренда Сочи, отель на час Сочи, снять номер у моря'
  },
  'tyumen': {
    name: 'Тюмень',
    nameEn: 'Tyumen',
    region: 'Уральский федеральный округ',
    description: 'Почасовая аренда номеров в отелях Тюмени от 2 часов.',
    features: ['30+ отелей', 'От 300₽ за 2 часа', 'Центр и районы', 'Проверенные объекты'],
    keywords: 'почасовая аренда Тюмень, отель на час Тюмень'
  },
  'barnaul': {
    name: 'Барнаул',
    nameEn: 'Barnaul',
    region: 'Сибирский федеральный округ',
    description: 'Почасовая аренда номеров в отелях Барнаула от 2 часов.',
    features: ['25+ отелей', 'От 250₽ за 2 часа', 'Разные районы', 'Без комиссии'],
    keywords: 'почасовая аренда Барнаул, отель на час Барнаул'
  },
  'vladivostok': {
    name: 'Владивосток',
    nameEn: 'Vladivostok',
    region: 'Дальневосточный федеральный округ',
    description: 'Почасовая аренда номеров в отелях Владивостока от 2 часов.',
    features: ['35+ отелей', 'От 350₽ за 2 часа', 'Центр и бухты', 'Круглосуточно'],
    keywords: 'почасовая аренда Владивосток, отель на час Владивосток'
  },
  'irkutsk': {
    name: 'Иркутск',
    nameEn: 'Irkutsk',
    region: 'Сибирский федеральный округ',
    description: 'Почасовая аренда номеров в отелях Иркутска от 2 часов.',
    features: ['30+ отелей', 'От 300₽ за 2 часа', 'Центр и районы', 'Онлайн бронирование'],
    keywords: 'почасовая аренда Иркутск, отель на час Иркутск'
  },
};

export default function CityPage() {
  const { citySlug } = useParams();
  const city = citySlug ? cities[citySlug as keyof typeof cities] : null;

  useEffect(() => {
    if (city) {
      document.title = `Почасовая аренда отелей в ${city.name} от 2 часов | 120 МИНУТ`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', city.description);
      }
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute('content', city.keywords);
      }
    }
  }, [city]);

  if (!city) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Icon name="MapPin" size={48} className="mx-auto mb-4 text-purple-600" />
            <h1 className="text-2xl font-bold mb-2">Город не найден</h1>
            <p className="text-muted-foreground mb-6">К сожалению, для этого города пока нет объявлений</p>
            <Link to="/">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Icon name="Home" size={18} className="mr-2" />
                На главную
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-purple-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img 
                src="https://cdn.poehali.dev/projects/1a35ca30-983f-4a91-b0b4-3c6fa1c9a65b/files/8251a8b2-9b61-4cee-9e68-aae6e7ec6e96.jpg" 
                alt="120 минут" 
                className="h-16 w-16 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  120 минут
                </h1>
                <p className="text-xs text-muted-foreground">Почасовая аренда по всей России</p>
              </div>
            </Link>
            <Link to="/">
              <Button variant="outline">
                <Icon name="ArrowLeft" size={18} className="mr-2" />
                На главную
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link to="/" className="hover:text-purple-600">Главная</Link>
              <Icon name="ChevronRight" size={16} />
              <span>{city.name}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Почасовая аренда отелей в {city.name}
            </h1>
            <p className="text-lg text-muted-foreground mb-2">{city.description}</p>
            <p className="text-sm text-muted-foreground">{city.region}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {city.features.map((feature, index) => (
              <Card key={index} className="border-purple-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-2">
                    {index === 0 && '🏨'}
                    {index === 1 && '💰'}
                    {index === 2 && '📍'}
                    {index === 3 && '⏰'}
                  </div>
                  <p className="font-semibold text-purple-900">{feature}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-purple-200 bg-white/80 backdrop-blur-sm mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-purple-900">
                Как арендовать номер в {city.name}?
              </h2>
              <ol className="space-y-4 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center font-semibold">1</span>
                  <span>Выберите подходящий отель в каталоге на главной странице</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center font-semibold">2</span>
                  <span>Просмотрите фотографии, цены и условия размещения</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center font-semibold">3</span>
                  <span>Свяжитесь с владельцем напрямую по телефону или в Telegram</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center font-semibold">4</span>
                  <span>Договоритесь о времени заезда и оплате — без комиссии платформы</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-purple-900">
                Почему выбирают 120 МИНУТ в {city.name}?
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex gap-3">
                  <Icon name="CheckCircle2" size={24} className="text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Проверенные объекты</h3>
                    <p className="text-sm text-muted-foreground">Все отели проходят модерацию перед публикацией</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Icon name="DollarSign" size={24} className="text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Без комиссии</h3>
                    <p className="text-sm text-muted-foreground">Оплата напрямую владельцу, без наценок</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Icon name="Clock" size={24} className="text-purple-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">От 2 часов</h3>
                    <p className="text-sm text-muted-foreground">Минимальный срок аренды от 2 часов</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Icon name="Shield" size={24} className="text-purple-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Безопасно</h3>
                    <p className="text-sm text-muted-foreground">Прямая связь с владельцами, никаких посредников</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-12 text-center">
            <Link to="/">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Icon name="Search" size={20} className="mr-2" />
                Смотреть все отели в {city.name}
              </Button>
            </Link>
          </div>

          <div className="mt-12 prose prose-purple max-w-none">
            <h2 className="text-2xl font-bold text-purple-900">О почасовой аренде отелей в {city.name}</h2>
            <p className="text-muted-foreground">
              Сервис 120 МИНУТ предоставляет удобную платформу для поиска и бронирования номеров в отелях {city.name} 
              на почасовой основе. Все объекты в каталоге проходят тщательную проверку перед публикацией. 
              Вы можете выбрать подходящий вариант по фотографиям, описанию и ценам, а затем связаться 
              с владельцем напрямую для бронирования.
            </p>
            <p className="text-muted-foreground">
              Почасовая аренда номеров — это удобный формат размещения для тех, кому нужен номер на несколько часов. 
              Это может быть деловая встреча, отдых между рейсами, романтическое свидание или просто отдых после долгой дороги. 
              В {city.name} представлены отели разного уровня комфорта и ценового сегмента.
            </p>
            <h3 className="text-xl font-bold text-purple-900">Популярные вопросы</h3>
            <p className="text-muted-foreground">
              <strong>Какой минимальный срок аренды?</strong> Обычно от 2 часов, но зависит от конкретного объекта.
            </p>
            <p className="text-muted-foreground">
              <strong>Нужно ли бронировать заранее?</strong> Рекомендуем связаться с владельцем заранее для уточнения наличия свободных номеров.
            </p>
            <p className="text-muted-foreground">
              <strong>Как происходит оплата?</strong> Напрямую владельцу удобным для вас способом — наличные, карта или перевод.
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-white/80 backdrop-blur-sm border-t border-purple-200 mt-12 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 120 МИНУТ — Почасовая аренда отелей в {city.name}</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link to="/company-info" className="hover:text-purple-600">О компании</Link>
            <Link to="/offer" className="hover:text-purple-600">Договор оферты</Link>
            <Link to="/add-listing" className="hover:text-purple-600">Добавить объект</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
