import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface ListingDetailsFieldsProps {
  formData: any;
  setFormData: (data: any) => void;
  uploadingLogo: boolean;
  logoInputRef: React.RefObject<HTMLInputElement>;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addMetroStation: () => void;
  updateMetroStation: (index: number, field: string, value: string | number) => void;
  removeMetroStation: (index: number) => void;
}

export default function ListingDetailsFields({
  formData,
  setFormData,
  uploadingLogo,
  logoInputRef,
  handleLogoUpload,
  addMetroStation,
  updateMetroStation,
  removeMetroStation,
}: ListingDetailsFieldsProps) {
  return (
    <>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Описание</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Подробное описание объекта"
            className="w-full px-3 py-2 border rounded-md"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Правила проживания</label>
          <textarea
            value={formData.rules}
            onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
            placeholder="Правила и условия"
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Политика отмены</label>
          <textarea
            value={formData.cancellation_policy}
            onChange={(e) => setFormData({ ...formData, cancellation_policy: e.target.value })}
            placeholder="Условия отмены бронирования"
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium mb-1">
          <Icon name="Building2" size={16} className="inline mr-1" />
          Логотип отеля
        </label>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => logoInputRef.current?.click()}
          disabled={uploadingLogo}
          className="w-full"
        >
          {uploadingLogo ? (
            <>
              <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
              Загрузка...
            </>
          ) : (
            <>
              <Icon name="Upload" size={16} className="mr-2" />
              Загрузить логотип
            </>
          )}
        </Button>
        {formData.logo_url && (
          <div className="mt-2">
            <img src={formData.logo_url} alt="Logo" className="h-20 object-contain border rounded p-2" />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">
            <Icon name="Train" size={16} className="inline mr-1" />
            Метро
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addMetroStation}
          >
            <Icon name="Plus" size={16} className="mr-1" />
            Добавить станцию
          </Button>
        </div>

        {formData.metro_stations && formData.metro_stations.length > 0 && (
          <div className="space-y-2">
            {formData.metro_stations.map((station: any, index: number) => (
              <div key={index} className="flex gap-2 items-start p-3 border rounded-lg bg-gray-50">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input
                    value={station.station_name}
                    onChange={(e) => updateMetroStation(index, 'station_name', e.target.value)}
                    placeholder="Название станции"
                  />
                  <Input
                    type="number"
                    value={station.walk_minutes}
                    onChange={(e) => updateMetroStation(index, 'walk_minutes', Number(e.target.value))}
                    placeholder="Минут пешком"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMetroStation(index)}
                >
                  <Icon name="Trash2" size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
          <input
            type="checkbox"
            checked={formData.has_parking}
            onChange={(e) => setFormData({ ...formData, has_parking: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm flex items-center gap-1">
            <Icon name="Car" size={16} />
            Парковка
          </span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
          <input
            type="checkbox"
            checked={formData.has_minibar}
            onChange={(e) => setFormData({ ...formData, has_minibar: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm flex items-center gap-1">
            <Icon name="Wine" size={16} />
            Минибар
          </span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
          <input
            type="checkbox"
            checked={formData.has_breakfast}
            onChange={(e) => setFormData({ ...formData, has_breakfast: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm flex items-center gap-1">
            <Icon name="Coffee" size={16} />
            Завтрак
          </span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
          <input
            type="checkbox"
            checked={formData.has_wifi}
            onChange={(e) => setFormData({ ...formData, has_wifi: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm flex items-center gap-1">
            <Icon name="Wifi" size={16} />
            WiFi
          </span>
        </label>
      </div>
    </>
  );
}