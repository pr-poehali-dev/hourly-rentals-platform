import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

export default function AdminLogin() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [phonePassword, setPhonePassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LOGIN] Попытка входа с логином:', login);
    setIsLoading(true);

    try {
      console.log('[LOGIN] Отправляю запрос к API...');
      const data = await api.login(login, password);
      console.log('[LOGIN] Получен ответ:', data);

      if (data.token) {
        localStorage.setItem('adminToken', data.token);
        toast({
          title: 'Успешный вход',
          description: 'Добро пожаловать в админ-панель',
        });
        navigate('/admin');
      } else {
        toast({
          title: 'Ошибка входа',
          description: data.error || 'Неверные учётные данные',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Detailed login error:', error);
      toast({
        title: 'Ошибка подключения',
        description: error?.message || 'Не удалось подключиться к серверу. Проверьте консоль браузера (F12)',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="https://cdn.poehali.dev/projects/1a35ca30-983f-4a91-b0b4-3c6fa1c9a65b/files/8251a8b2-9b61-4cee-9e68-aae6e7ec6e96.jpg" 
              alt="120 минут" 
              className="h-20 w-20 object-contain"
            />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            120 минут
          </CardTitle>
          <p className="text-muted-foreground mt-2">Вход в админ-панель</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">
                <Icon name="User" size={16} className="mr-2" />
                Логин
              </TabsTrigger>
              <TabsTrigger value="phone">
                <Icon name="Phone" size={16} className="mr-2" />
                Телефон
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label className="text-sm font-medium mb-2 block">Логин или Email</label>
              <div className="relative">
                <Icon name="User" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Логин или email"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="pl-10"
                  autoComplete="username"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Пароль</label>
              <div className="relative">
                <Icon name="Lock" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  autoComplete="current-password"
                  required
                />
              </div>
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
                <>
                  <Icon name="LogIn" size={18} className="mr-2" />
                  Войти
                </>
              )}
            </Button>
          </form>
            </TabsContent>
            
            <TabsContent value="phone">
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label className="text-sm font-medium mb-2 block">Номер телефона</label>
              <div className="relative">
                <Icon name="Phone" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="89991234567"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setLogin(e.target.value);
                  }}
                  className="pl-10"
                  autoComplete="tel"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Пароль</label>
              <div className="relative">
                <Icon name="Lock" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={phonePassword}
                  onChange={(e) => {
                    setPhonePassword(e.target.value);
                    setPassword(e.target.value);
                  }}
                  className="pl-10"
                  autoComplete="current-password"
                  required
                />
              </div>
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
                <>
                  <Icon name="LogIn" size={18} className="mr-2" />
                  Войти
                </>
              )}
            </Button>
          </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}