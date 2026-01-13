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
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.ownerLogin(identifier, password);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">⏰</div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Вход для владельцев
          </CardTitle>
          <CardDescription>
            Управляйте своими объявлениями
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Телефон или Email</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="+7 999 123-45-67 или owner@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                  Вход...
                </>
              ) : (
                'Войти'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <Link to="/owner/forgot-password" className="text-purple-600 hover:underline">
                Забыли пароль?
              </Link>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Нет аккаунта?{' '}
              <Link to="/owner/register" className="text-purple-600 hover:underline">
                Зарегистрироваться
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}