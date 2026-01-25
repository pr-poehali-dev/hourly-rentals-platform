import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import Icon from '@/components/ui/icon';

export default function OwnerLogin() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.ownerLogin(login, password);

      if (response.error) {
        throw new Error(response.error);
      }

      localStorage.setItem('ownerToken', response.token);
      localStorage.setItem('ownerId', response.owner.id.toString());
      localStorage.setItem('ownerData', JSON.stringify(response.owner));

      toast({
        title: 'Вход выполнен',
        description: `Добро пожаловать, ${response.owner.full_name}!`,
      });

      navigate('/owner/dashboard');
    } catch (error: any) {
      toast({
        title: 'Ошибка входа',
        description: error.message || 'Не удалось войти',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-3 sm:p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2 sm:space-y-3 pb-4 sm:pb-6">
          <img 
            src="https://cdn.poehali.dev/projects/1a35ca30-983f-4a91-b0b4-3c6fa1c9a65b/files/77574b92-3610-4b79-8c59-819891e5ebca.jpg" 
            alt="120 минут" 
            className="h-16 w-16 sm:h-20 sm:w-20 object-contain mx-auto mb-2 sm:mb-4"
          />
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Вход для владельцев
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Управляйте своими объявлениями
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="login" className="text-sm sm:text-base">Логин (номер телефона)</Label>
              <Input
                id="login"
                type="text"
                placeholder="89991234567"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                className="h-10 sm:h-11 text-sm sm:text-base"
              />
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Логин выдаёт администратор
              </p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="password" className="text-sm sm:text-base">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-10 sm:h-11 text-sm sm:text-base font-medium shadow-md hover:shadow-lg transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Вход...
                </>
              ) : (
                <>
                  <Icon name="LogIn" size={16} className="mr-2" />
                  Войти
                </>
              )}
            </Button>

            <div className="text-center text-xs sm:text-sm text-muted-foreground pt-2">
              <Link to="/owner/forgot-password" className="text-purple-600 hover:underline hover:text-purple-700 transition-colors">
                Забыли пароль?
              </Link>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 text-xs sm:text-sm text-blue-900">
              <Icon name="Info" size={14} className="inline mr-1" />
              Для регистрации нажмите <Link to="/add-listing" className="text-purple-600 hover:underline font-medium">"Добавить объект"</Link> на главной странице
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}