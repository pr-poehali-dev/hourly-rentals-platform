import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface SearchHeroProps {
  searchCity: string;
  setSearchCity: (value: string) => void;
  selectedType: string;
  setSelectedType: (value: string) => void;
  selectedCity: string;
  setSelectedCity: (value: string) => void;
  cities: string[];
  showMap: boolean;
  setShowMap: (value: boolean) => void;
  hasParking: boolean;
  setHasParking: (value: boolean) => void;
  minHours: number | null;
  setMinHours: (value: number | null) => void;
  selectedFeatures: string[];
  setSelectedFeatures: (value: string[]) => void;
}

export default function SearchHero({
  searchCity,
  setSearchCity,
  selectedType,
  setSelectedType,
  selectedCity,
  setSelectedCity,
  cities,
  showMap,
  setShowMap,
  hasParking,
  setHasParking,
  minHours,
  setMinHours,
  selectedFeatures,
  setSelectedFeatures,
}: SearchHeroProps) {
  const popularFeatures = [
    { name: 'WiFi', icon: 'Wifi' },
    { name: 'Джакузи', icon: 'Bath' },
    { name: 'Кондиционер', icon: 'Wind' },
    { name: 'Двуспальная кровать', icon: 'BedDouble' },
    { name: 'Смарт ТВ', icon: 'Tv' },
    { name: 'Холодильник', icon: 'Refrigerator' },
    { name: 'Кухня', icon: 'ChefHat' },
    { name: 'PlayStation', icon: 'Gamepad2' },
  ];

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };
  return (
    <section className="mb-12 text-center animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent leading-tight">
          ПОЧАСОВАЯ АРЕНДА
        </h2>
        <h3 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent leading-tight">
          ОТЕЛЕЙ И АПАРТАМЕНТОВ
        </h3>
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-6">
          <div className="flex items-center gap-2 text-lg md:text-xl font-semibold text-purple-700">
            <Icon name="CheckCircle2" size={24} className="text-green-500" />
            <span>БЕЗ ПОСРЕДНИКОВ</span>
          </div>
          <div className="flex items-center gap-2 text-lg md:text-xl font-semibold text-purple-700">
            <Icon name="CheckCircle2" size={24} className="text-green-500" />
            <span>БЕЗ РЕГИСТРАЦИИ НА САЙТЕ</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 md:gap-6 mb-8 text-base md:text-lg font-medium">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center font-bold">1</div>
            <span>ВЫБИРАЕТЕ</span>
          </div>
          <Icon name="ArrowRight" size={20} className="text-purple-600" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center font-bold">2</div>
            <span>СВЯЗЫВАЕТЕСЬ</span>
          </div>
          <Icon name="ArrowRight" size={20} className="text-purple-600" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center font-bold">3</div>
            <span>БРОНИРУЕТЕ</span>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Город, адрес, метро..."
                  className="pl-10 h-12 text-lg border-purple-200"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-[180px] h-12 border-purple-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="hotel">Отели</SelectItem>
                <SelectItem value="apartment">Апартаменты</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-full md:w-[200px] h-12 border-purple-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="lg" className="h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Icon name="Search" size={20} className="mr-2" />
              Найти
            </Button>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex items-center gap-2">
              <Icon name="MapPin" size={16} className="text-purple-600" />
              <span className="text-sm font-semibold text-purple-700">Популярные города:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Уфа', 'Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург', 'Новосибирск'].map(city => (
                <Badge
                  key={city}
                  variant={selectedCity === city ? "default" : "secondary"}
                  className={`cursor-pointer ${selectedCity === city ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'hover:bg-purple-100'}`}
                  onClick={() => setSelectedCity(city)}
                >
                  {city}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Icon name="Filter" size={16} className="text-purple-600" />
              <span className="text-sm font-semibold text-purple-700">Фильтры:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={hasParking ? "default" : "secondary"} 
                className={`cursor-pointer ${hasParking ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'hover:bg-purple-100'}`}
                onClick={() => setHasParking(!hasParking)}
              >
                <Icon name="Car" size={14} className="mr-1" />
                С парковкой
              </Badge>
              <Badge 
                variant={minHours === 1 ? "default" : "secondary"} 
                className={`cursor-pointer ${minHours === 1 ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'hover:bg-purple-100'}`}
                onClick={() => setMinHours(minHours === 1 ? null : 1)}
              >
                <Icon name="Clock" size={14} className="mr-1" />
                От 1 часа
              </Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-purple-100" onClick={() => setShowMap(!showMap)}>
                <Icon name="Map" size={14} className="mr-1" />
                {showMap ? 'Показать списком' : 'Показать на карте'}
              </Badge>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Icon name="Sparkles" size={16} className="text-purple-600" />
              <span className="text-sm font-semibold text-purple-700">Удобства в номере:</span>
              {selectedFeatures.length > 0 && (
                <button
                  onClick={() => setSelectedFeatures([])}
                  className="text-xs text-purple-600 hover:text-purple-800 underline"
                >
                  Очистить ({selectedFeatures.length})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {popularFeatures.map((feature) => {
                const isSelected = selectedFeatures.includes(feature.name);
                return (
                  <Badge
                    key={feature.name}
                    variant={isSelected ? "default" : "secondary"}
                    className={`cursor-pointer group relative ${isSelected ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'hover:bg-purple-100'}`}
                    onClick={() => toggleFeature(feature.name)}
                  >
                    <Icon name={feature.icon} size={14} className="mr-1" />
                    {feature.name}
                    {isSelected && (
                      <Icon name="X" size={12} className="ml-1" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}