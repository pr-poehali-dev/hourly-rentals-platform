import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useListingForm } from '@/hooks/useListingForm';
import SortableRoomItem from '@/components/admin/SortableRoomItem';
import PhotoGallery from '@/components/admin/PhotoGallery';
import RoomFormDialog from '@/components/admin/RoomFormDialog';
import ListingBasicFields from '@/components/admin/ListingBasicFields';
import ListingDetailsFields from '@/components/admin/ListingDetailsFields';

interface AdminListingFormProps {
  listing: any;
  token: string;
  onClose: (shouldReload?: boolean) => void;
}

// BUILD VERSION: 6f87249-QUICK-BUTTONS-v4
export default function AdminListingForm({ listing, token, onClose }: AdminListingFormProps) {
  console.log('✅ AdminListingForm component loaded - VERSION 4.0 - BUILD 6f87249 - Быстрые ярлыки добавлены');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const {
    formData,
    setFormData,
    isLoading,
    uploadingPhoto,
    uploadingLogo,
    isDragging,
    editingRoomIndex,
    fileInputRef,
    logoInputRef,
    setEditingRoomIndex,
    handleSubmit,
    handlePhotoUpload,
    handleLogoUpload,
    removePhoto,
    reorderPhotos,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    addRoom,
    updateRoom,
    removeRoom,
    duplicateRoom,
    handleDragEnd,
    addMetroStation,
    updateMetroStation,
    removeMetroStation,
  } = useListingForm(listing, token, onClose);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto p-4">
      <Card className="w-full max-w-4xl my-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Редактирование объекта</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onClose()}>
            <Icon name="X" size={20} />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <ListingBasicFields
              formData={formData}
              setFormData={setFormData}
            />

            <ListingDetailsFields
              formData={formData}
              setFormData={setFormData}
              uploadingLogo={uploadingLogo}
              logoInputRef={logoInputRef}
              handleLogoUpload={handleLogoUpload}
              addMetroStation={addMetroStation}
              updateMetroStation={updateMetroStation}
              removeMetroStation={removeMetroStation}
            />

            <PhotoGallery
              images={formData.images}
              onUpload={handlePhotoUpload}
              onRemove={removePhoto}
              onReorder={reorderPhotos}
              uploadingPhoto={uploadingPhoto}
              isDragging={isDragging}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">
                  <Icon name="Bed" size={16} className="inline mr-1" />
                  Комнаты ({formData.rooms.length})
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRoom}
                >
                  <Icon name="Plus" size={16} className="mr-1" />
                  Добавить комнату
                </Button>
              </div>

              {formData.rooms.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={formData.rooms.map((_: any, idx: number) => `room-${idx}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {formData.rooms.map((room: any, index: number) => (
                        <SortableRoomItem
                          key={`room-${index}`}
                          room={room}
                          index={index}
                          onEdit={(idx) => setEditingRoomIndex(idx)}
                          onRemove={removeRoom}
                          onDuplicate={duplicateRoom}
                          isEditing={editingRoomIndex === index}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Icon name="Save" size={16} className="mr-2" />
                    Сохранить изменения
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose()}
              >
                Отмена
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {editingRoomIndex !== null && (
        <RoomFormDialog
          room={formData.rooms[editingRoomIndex]}
          onSave={(updatedRoom) => {
            updateRoom(editingRoomIndex, updatedRoom);
            setEditingRoomIndex(null);
          }}
          onCancel={() => setEditingRoomIndex(null)}
        />
      )}
    </div>
  );
}