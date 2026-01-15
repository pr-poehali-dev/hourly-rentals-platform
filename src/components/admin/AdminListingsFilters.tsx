import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface AdminListingsFiltersProps {
  filteredCount: number;
  totalCount: number;
  selectedCity: string;
  selectedType: string;
  showArchived: boolean;
  cities: string[];
  onCityChange: (city: string) => void;
  onTypeChange: (type: string) => void;
  onArchiveToggle: () => void;
  onCreate: () => void;
}

export default function AdminListingsFilters({
  filteredCount,
  totalCount,
  selectedCity,
  selectedType,
  showArchived,
  cities,
  onCityChange,
  onTypeChange,
  onArchiveToggle,
  onCreate,
}: AdminListingsFiltersProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h2 className="text-3xl font-bold">Объекты</h2>
        <Badge variant="secondary" className="text-lg px-4 py-1">
          {filteredCount} из {totalCount}
        </Badge>
      </div>
      <div className="flex items-center gap-3">
        <Select value={selectedCity} onValueChange={onCityChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Город" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Icon name="MapPin" size={14} />
                Все города
              </div>
            </SelectItem>
            {cities.map(city => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedType} onValueChange={onTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Тип" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Icon name="Building" size={14} />
                Все типы
              </div>
            </SelectItem>
            <SelectItem value="hotel">
              <div className="flex items-center gap-2">
                <Icon name="Hotel" size={14} />
                Отели
              </div>
            </SelectItem>
            <SelectItem value="apartment">
              <div className="flex items-center gap-2">
                <Icon name="Home" size={14} />
                Апартаменты
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={showArchived ? 'default' : 'outline'}
          onClick={onArchiveToggle}
        >
          <Icon name="Archive" size={18} className="mr-2" />
          {showArchived ? 'Скрыть архив' : 'Показать архив'}
        </Button>
        <Button
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          onClick={onCreate}
        >
          <Icon name="Plus" size={18} className="mr-2" />
          Добавить объект
        </Button>
      </div>
    </div>
  );
}
