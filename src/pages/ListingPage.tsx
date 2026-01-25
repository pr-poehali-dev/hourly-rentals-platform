import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import ListingHeader from '@/components/ListingHeader';
import ListingInfoCard from '@/components/ListingInfoCard';
import RoomCategoryCard from '@/components/RoomCategoryCard';
import ImageGalleryModal from '@/components/ImageGalleryModal';

export default function ListingPage() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [galleryRoomIndex, setGalleryRoomIndex] = useState(0);

  useEffect(() => {
    const loadListing = async () => {
      try {
        const listings = await api.getPublicListings();
        const foundListing = listings.find((l: any) => l.id === parseInt(listingId || '0'));
        
        // Загружаем детали всех номеров с фотографиями
        if (foundListing && foundListing.rooms) {
          const roomsWithImages = await Promise.all(
            foundListing.rooms.map(async (_: any, index: number) => {
              try {
                return await api.getRoomDetails(foundListing.id, index);
              } catch (error) {
                console.error(`Failed to load room ${index}:`, error);
                return foundListing.rooms[index]; // Fallback к данным без фото
              }
            })
          );
          foundListing.rooms = roomsWithImages;
        }
        
        setListing(foundListing);
      } catch (error) {
        console.error('Failed to load listing:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadListing();
  }, [listingId]);

  const openGallery = (roomIndex: number) => {
    setGalleryRoomIndex(roomIndex);
    setImageGalleryOpen(true);
  };

  const getFirstImage = (imageUrl: any) => {
    if (!imageUrl) return null;
    
    if (typeof imageUrl === 'string') {
      try {
        const parsed = JSON.parse(imageUrl);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0];
        }
      } catch {
        return imageUrl;
      }
    }
    
    if (Array.isArray(imageUrl) && imageUrl.length > 0) {
      return imageUrl[0];
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <Icon name="Loader2" size={48} className="animate-spin text-purple-600" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Отель не найден</h2>
          <Button onClick={() => navigate('/')}>
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            На главную
          </Button>
        </div>
      </div>
    );
  }

  const firstImage = getFirstImage(listing.image_url);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <ListingHeader
        title={listing.title}
        city={listing.city}
        district={listing.district}
        logoUrl={listing.logo_url}
        onBack={() => navigate('/')}
      />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <ListingInfoCard listing={listing} />

        {/* Описание объекта */}
        {listing.description && (
          <div className="mb-6 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Icon name="FileText" size={20} className="text-purple-600" />
              Об объекте
            </h2>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
              {listing.description}
            </p>
          </div>
        )}

        {/* Список категорий номеров */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Icon name="Bed" size={24} className="text-purple-600" />
            Категории номеров
          </h2>

          {listing.rooms && listing.rooms.length > 0 ? (
            listing.rooms.map((room: any, roomIndex: number) => (
              <RoomCategoryCard
                key={roomIndex}
                room={room}
                roomIndex={roomIndex}
                listingImageUrl={firstImage || listing.image_url}
                listingPriceWarningHolidays={listing.price_warning_holidays}
                listingPriceWarningDaytime={listing.price_warning_daytime}
                onOpenGallery={openGallery}
              />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="Bed" size={48} className="mx-auto mb-4 opacity-20" />
              <p>Информация о категориях номеров отсутствует</p>
            </div>
          )}
        </div>
      </main>

      <ImageGalleryModal
        open={imageGalleryOpen}
        onOpenChange={setImageGalleryOpen}
        room={listing.rooms?.[galleryRoomIndex]}
        listingImageUrl={firstImage || listing.image_url}
      />
    </div>
  );
}