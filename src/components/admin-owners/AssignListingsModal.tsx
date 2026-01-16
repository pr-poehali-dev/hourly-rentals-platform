import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';

interface Owner {
  id: number;
  full_name: string;
}

interface Listing {
  id: number;
  title: string;
  city: string;
  district: string;
  owner_id: number | null;
  owner_name?: string;
}

interface AssignListingsModalProps {
  selectedOwner: Owner;
  availableListings: Listing[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  selectedListingIds: number[];
  handleToggleListing: (listingId: number) => void;
  handleToggleAll: () => void;
  handleAssignListing: (listing: Listing) => void;
  handleUnassignListing: (listing: Listing) => void;
  handleBulkAssign: () => void;
  onClose: () => void;
}

export default function AssignListingsModal({
  selectedOwner,
  availableListings,
  searchQuery,
  setSearchQuery,
  selectedCity,
  setSelectedCity,
  selectedListingIds,
  handleToggleListing,
  handleToggleAll,
  handleAssignListing,
  handleUnassignListing,
  handleBulkAssign,
  onClose,
}: AssignListingsModalProps) {
  const cities = Array.from(new Set(availableListings.map(l => l.city))).sort();

  const filteredListings = availableListings.filter((listing) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      listing.title.toLowerCase().includes(query) ||
      listing.city.toLowerCase().includes(query) ||
      listing.district.toLowerCase().includes(query);
    
    const matchesCity = selectedCity === 'all' || listing.city === selectedCity;
    
    return matchesSearch && matchesCity;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Привязка отелей к {selectedOwner.full_name}</CardTitle>
            <Button variant="outline" onClick={onClose}>
              <Icon name="X" size={18} className="mr-2" />
              Закрыть
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Город</Label>
              <select
                id="city"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="all">Все города ({availableListings.length})</option>
                {cities.map(city => {
                  const count = availableListings.filter(l => l.city === city).length;
                  return (
                    <option key={city} value={city}>{city} ({count})</option>
                  );
                })}
              </select>
            </div>
            <div>
              <Label htmlFor="search">Поиск по названию</Label>
              <Input
                id="search"
                placeholder="Введите название отеля..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {selectedListingIds.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <span className="font-semibold">Выбрано отелей: {selectedListingIds.length}</span>
              <Button onClick={handleBulkAssign}>
                <Icon name="Link" size={16} className="mr-2" />
                Привязать выбранные
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2 pb-2">
            <Checkbox
              checked={selectedListingIds.length === filteredListings.filter(l => l.owner_id === null).length && filteredListings.filter(l => l.owner_id === null).length > 0}
              onCheckedChange={handleToggleAll}
            />
            <Label className="cursor-pointer" onClick={handleToggleAll}>
              Выбрать все свободные отели
            </Label>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredListings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Отели не найдены</p>
            ) : (
              filteredListings.map((listing) => (
                <Card key={listing.id} className={listing.owner_id === selectedOwner.id ? 'border-purple-500' : ''}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      {listing.owner_id === null && (
                        <Checkbox
                          checked={selectedListingIds.includes(listing.id)}
                          onCheckedChange={() => handleToggleListing(listing.id)}
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{listing.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {listing.city}, {listing.district}
                        </p>
                        {listing.owner_name && listing.owner_id !== selectedOwner.id && (
                          <p className="text-xs text-orange-600 mt-1">
                            Привязан к: {listing.owner_name}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {listing.owner_id === selectedOwner.id ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleUnassignListing(listing)}
                          >
                            <Icon name="Unlink" size={16} className="mr-2" />
                            Отвязать
                          </Button>
                        ) : listing.owner_id === null ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleAssignListing(listing)}
                          >
                            <Icon name="Link" size={16} className="mr-2" />
                            Привязать
                          </Button>
                        ) : (
                          <Badge variant="secondary">Занят</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
