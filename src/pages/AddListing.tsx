import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import OwnerInfoStep from '@/components/listing-steps/OwnerInfoStep';
import ListingBasicInfoStep from '@/components/listing-steps/ListingBasicInfoStep';
import ListingLocationStep from '@/components/listing-steps/ListingLocationStep';
import ListingRoomsStep from '@/components/listing-steps/ListingRoomsStep';
import ListingContactsStep from '@/components/listing-steps/ListingContactsStep';
import ListingReviewStep from '@/components/listing-steps/ListingReviewStep';

const STEPS = [
  { id: 'owner', title: 'О вас', icon: 'User' },
  { id: 'basic', title: 'Основная информация', icon: 'Home' },
  { id: 'location', title: 'Местоположение', icon: 'MapPin' },
  { id: 'rooms', title: 'Номера', icon: 'Bed' },
  { id: 'contacts', title: 'Контакты', icon: 'Phone' },
  { id: 'review', title: 'Проверка', icon: 'CheckCircle2' },
];

export default function AddListing() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Владелец
    owner_full_name: '',
    owner_email: '',
    owner_phone: '',
    owner_telegram: '',
    
    // Основная информация
    title: '',
    type: '',
    city: '',
    district: '',
    description: '',
    features: [] as string[],
    
    // Местоположение
    address: '',
    lat: null as number | null,
    lng: null as number | null,
    metro_stations: [] as Array<{ station_name: string; walk_minutes: number }>,
    has_parking: false,
    parking_type: 'none',
    parking_price_per_hour: 0,
    
    // Номера
    rooms: [] as Array<{
      type: string;
      price: number;
      description: string;
      images: string[];
      square_meters: number;
      features: string[];
      min_hours: number;
      payment_methods: string;
      cancellation_policy: string;
    }>,
    
    // Контакты
    phone: '',
    telegram: '',
    logo_url: '',
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/ee10a4fa-4437-4fe1-87b7-36ebaf726da9', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: 'Заявка отправлена!',
        description: 'Мы проверим ваш объект и отправим данные для входа на указанную почту.',
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось отправить заявку',
        variant: 'destructive',
      });
    }
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'owner':
        return <OwnerInfoStep data={formData} onUpdate={updateFormData} onNext={handleNext} />;
      case 'basic':
        return <ListingBasicInfoStep data={formData} onUpdate={updateFormData} onNext={handleNext} onBack={handleBack} />;
      case 'location':
        return <ListingLocationStep data={formData} onUpdate={updateFormData} onNext={handleNext} onBack={handleBack} />;
      case 'rooms':
        return <ListingRoomsStep data={formData} onUpdate={updateFormData} onNext={handleNext} onBack={handleBack} />;
      case 'contacts':
        return <ListingContactsStep data={formData} onUpdate={updateFormData} onNext={handleNext} onBack={handleBack} />;
      case 'review':
        return <ListingReviewStep data={formData} onSubmit={handleSubmit} onBack={handleBack} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-purple-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="https://cdn.poehali.dev/projects/1a35ca30-983f-4a91-b0b4-3c6fa1c9a65b/files/69bb67c0-3011-44dd-8807-0323986ac305.jpg" 
                alt="120 минут" 
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Добавить объект
                </h1>
                <p className="text-sm text-muted-foreground">Шаг {currentStep + 1} из {STEPS.length}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => navigate('/')}>
              <Icon name="X" size={20} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className={`flex items-center gap-2 ${index <= currentStep ? 'text-purple-600' : 'text-gray-400'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index < currentStep 
                        ? 'bg-green-500 text-white' 
                        : index === currentStep 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-200'
                    }`}>
                      {index < currentStep ? (
                        <Icon name="Check" size={20} />
                      ) : (
                        <Icon name={step.icon} size={20} />
                      )}
                    </div>
                    <span className="hidden md:block text-sm font-medium">{step.title}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {renderStep()}
      </main>
    </div>
  );
}