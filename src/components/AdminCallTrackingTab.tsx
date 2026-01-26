import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const API_URL = 'https://functions.poehali.dev/118f6961-69ab-4912-bbec-0481012af402';

interface CallRecord {
  id: number;
  virtual_number: string;
  client_phone: string;
  listing_id: number;
  listing_title: string;
  shown_at: string;
  called_at: string | null;
  expires_at: string;
}

export default function AdminCallTrackingTab() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total_shown: 0,
    total_called: 0,
    conversion_rate: 0,
    active_sessions: 0,
  });

  const loadCallStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}?action=stats`);
      const data = await response.json();
      
      setCalls(data.calls || []);
      setStats({
        total_shown: data.total_shown || 0,
        total_called: data.total_called || 0,
        conversion_rate: data.conversion_rate || 0,
        active_sessions: data.active_sessions || 0,
      });
    } catch (error) {
      console.error('Failed to load call stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCallStats();
    const interval = setInterval(loadCallStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPhone = (phone: string) => {
    if (phone.startsWith('anon_')) {
      return `🔒 ${phone.substring(0, 12)}...`;
    }
    return phone;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader2" size={48} className="animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Статистика звонков</h2>
          <p className="text-muted-foreground">Отслеживание подменных номеров</p>
        </div>
        <Button onClick={loadCallStats} variant="outline">
          <Icon name="RefreshCw" size={18} className="mr-2" />
          Обновить
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Показано номеров</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Icon name="Eye" size={24} className="text-purple-600" />
              <div className="text-3xl font-bold">{stats.total_shown}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Совершено звонков</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Icon name="Phone" size={24} className="text-green-600" />
              <div className="text-3xl font-bold">{stats.total_called}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Конверсия</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Icon name="TrendingUp" size={24} className="text-orange-600" />
              <div className="text-3xl font-bold">{stats.conversion_rate.toFixed(1)}%</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Активные сессии</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Icon name="Activity" size={24} className="text-blue-600" />
              <div className="text-3xl font-bold">{stats.active_sessions}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Таблица звонков */}
      <Card>
        <CardHeader>
          <CardTitle>История звонков</CardTitle>
        </CardHeader>
        <CardContent>
          {calls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="PhoneOff" size={48} className="mx-auto mb-3 opacity-50" />
              <p>Пока нет данных о звонках</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Объект</TableHead>
                    <TableHead>Виртуальный номер</TableHead>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Показан</TableHead>
                    <TableHead>Звонок</TableHead>
                    <TableHead>Истекает</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium">
                        {call.listing_title || `ID ${call.listing_id}`}
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {call.virtual_number}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatPhone(call.client_phone)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(call.shown_at)}
                      </TableCell>
                      <TableCell>
                        {call.called_at ? (
                          <span className="text-sm text-green-600 font-medium">
                            {formatDate(call.called_at)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(call.expires_at)}
                      </TableCell>
                      <TableCell>
                        {call.called_at ? (
                          <Badge className="bg-green-100 text-green-700">
                            <Icon name="Phone" size={12} className="mr-1" />
                            Звонок
                          </Badge>
                        ) : new Date(call.expires_at) > new Date() ? (
                          <Badge variant="secondary">
                            <Icon name="Clock" size={12} className="mr-1" />
                            Активен
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Icon name="XCircle" size={12} className="mr-1" />
                            Истек
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
