import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  onUpload: (url: string) => void;
  multiple?: boolean;
}

export default function ImageUploader({ onUpload, multiple = false }: ImageUploaderProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setTotalFiles(files.length);

    const uploadPromises: Promise<void>[] = [];
    let completed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Ошибка',
          description: 'Можно загружать только изображения',
          variant: 'destructive',
        });
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Ошибка',
          description: 'Размер файла не должен превышать 10 МБ',
          variant: 'destructive',
        });
        continue;
      }

      const uploadPromise = new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const base64 = event.target?.result as string;
            
            const response = await fetch('https://functions.poehali.dev/32a4bee5-4d04-4b73-a903-52cec9a5cef6', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                image: base64,
                filename: file.name,
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              let errorMessage = 'Ошибка загрузки';
              try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || errorMessage;
              } catch {
                errorMessage = errorText || errorMessage;
              }
              throw new Error(errorMessage);
            }

            const data = await response.json();
            onUpload(data.url);
            completed++;
            setUploadProgress(Math.round((completed / totalFiles) * 100));
            toast({
              title: 'Успешно',
              description: 'Фото загружено',
            });
            resolve();
          } catch (error: any) {
            console.error('Upload error:', error);
            toast({
              title: 'Ошибка загрузки',
              description: error.message || 'Не удалось загрузить фото',
              variant: 'destructive',
            });
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Ошибка чтения файла'));
        reader.readAsDataURL(file);
      });

      uploadPromises.push(uploadPromise);
    }

    try {
      await Promise.allSettled(uploadPromises);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setTotalFiles(0);
      e.target.value = '';
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileChange}
        id="image-upload"
        className="hidden"
      />
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
          onClick={() => document.getElementById('image-upload')?.click()}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
              Загрузка... {uploadProgress}%
            </>
          ) : (
            <>
              <Icon name="Upload" size={16} className="mr-2" />
              Загрузить {multiple ? 'фото' : 'фото'}
            </>
          )}
        </Button>
        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}