import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';

export function useListingForm(listing: any, token: string, onClose: (shouldReload?: boolean) => void) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editingRoomIndex, setEditingRoomIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState(() => {
    console.log('=== INITIALIZING FORM DATA ===');
    console.log('Listing prop:', listing);
    console.log('Listing rooms:', listing?.rooms);
    if (listing?.rooms && listing.rooms.length > 0) {
      console.log('First room data:', listing.rooms[0]);
    }
    return {
      title: listing?.title || '',
      type: listing?.type || 'hotel',
      city: listing?.city || '',
      district: listing?.district || '',
      price: listing?.price || 0,
      auction: listing?.auction || 999,
      image_url: listing?.image_url || '',
      logo_url: listing?.logo_url || '',
      metro: listing?.metro || '',
      metro_walk: listing?.metro_walk || 0,
      metro_stations: listing?.metro_stations || [],
      has_parking: listing?.has_parking || false,
      has_minibar: listing?.has_minibar || false,
      has_breakfast: listing?.has_breakfast || false,
      has_wifi: listing?.has_wifi || false,
      rooms: listing?.rooms || [],
      images: listing?.images || [],
      rating: listing?.rating || 4.5,
      check_in: listing?.check_in || '14:00',
      check_out: listing?.check_out || '12:00',
      address: listing?.address || '',
      phone: listing?.phone || '',
      email: listing?.email || '',
      website: listing?.website || '',
      description: listing?.description || '',
      rules: listing?.rules || '',
      cancellation_policy: listing?.cancellation_policy || '',
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Submitting form data:', formData);
      
      let response;
      if (listing && listing.id) {
        response = await api.updateListing(token, listing.id, formData);
        console.log('Update response:', response);

        toast({
          title: "Объект обновлен",
          description: "Изменения успешно сохранены",
        });
      } else {
        response = await api.createListing(token, formData);
        console.log('Create response:', response);

        if (response.error) {
          throw new Error(response.error);
        }

        toast({
          title: "Объект создан",
          description: "Новый объект успешно добавлен",
        });
      }

      onClose(true);
    } catch (error: any) {
      console.error('Failed to save listing:', error);
      toast({
        title: "Ошибка сохранения",
        description: error.message || "Не удалось сохранить объект",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhoto(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('https://functions.poehali.dev/image-storage?action=upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Ошибка загрузки фото: ${response.statusText}`);
        }

        const data = await response.json();
        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      toast({
        title: "Фото загружено",
        description: `Добавлено ${uploadedUrls.length} фото`,
      });
    } catch (error: any) {
      console.error('Ошибка загрузки фото:', error);
      toast({
        title: "Ошибка загрузки",
        description: error.message || "Не удалось загрузить фото",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('https://functions.poehali.dev/image-storage?action=upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Ошибка загрузки логотипа: ${response.statusText}`);
      }

      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        logo_url: data.url
      }));

      toast({
        title: "Логотип загружен",
        description: "Логотип успешно обновлен",
      });
    } catch (error: any) {
      console.error('Ошибка загрузки логотипа:', error);
      toast({
        title: "Ошибка загрузки",
        description: error.message || "Не удалось загрузить логотип",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const reorderPhotos = (fromIndex: number, toIndex: number) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      const [movedItem] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedItem);
      return { ...prev, images: newImages };
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );

    if (files.length === 0) return;

    setUploadingPhoto(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('https://functions.poehali.dev/image-storage?action=upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Ошибка загрузки фото: ${response.statusText}`);
        }

        const data = await response.json();
        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      toast({
        title: "Фото загружено",
        description: `Добавлено ${uploadedUrls.length} фото`,
      });
    } catch (error: any) {
      console.error('Ошибка загрузки фото:', error);
      toast({
        title: "Ошибка загрузки",
        description: error.message || "Не удалось загрузить фото",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const addRoom = () => {
    const newRoom = {
      type: '',
      price: 0,
      square_meters: 0,
      description: '',
      images: [],
      features: []
    };
    setFormData(prev => ({
      ...prev,
      rooms: [...prev.rooms, newRoom]
    }));
    setEditingRoomIndex(formData.rooms.length);
  };

  const updateRoom = (index: number, updatedRoom: any) => {
    setFormData(prev => ({
      ...prev,
      rooms: prev.rooms.map((room: any, i: number) => i === index ? updatedRoom : room)
    }));
  };

  const removeRoom = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rooms: prev.rooms.filter((_: any, i: number) => i !== index)
    }));
    if (editingRoomIndex === index) {
      setEditingRoomIndex(null);
    }
  };

  const duplicateRoom = (index: number) => {
    const roomToDuplicate = formData.rooms[index];
    const duplicatedRoom = { ...roomToDuplicate };
    setFormData(prev => ({
      ...prev,
      rooms: [...prev.rooms, duplicatedRoom]
    }));
    toast({
      title: "Комната дублирована",
      description: "Комната успешно скопирована",
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.rooms.findIndex((_: any, idx: number) => `room-${idx}` === active.id);
        const newIndex = prev.rooms.findIndex((_: any, idx: number) => `room-${idx}` === over.id);

        return {
          ...prev,
          rooms: arrayMove(prev.rooms, oldIndex, newIndex)
        };
      });
    }
  };

  const addMetroStation = () => {
    setFormData(prev => ({
      ...prev,
      metro_stations: [...prev.metro_stations, { station_name: '', walk_minutes: 5 }]
    }));
  };

  const updateMetroStation = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      metro_stations: prev.metro_stations.map((station: any, i: number) => 
        i === index ? { ...station, [field]: value } : station
      )
    }));
  };

  const removeMetroStation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      metro_stations: prev.metro_stations.filter((_: any, i: number) => i !== index)
    }));
  };

  return {
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
  };
}