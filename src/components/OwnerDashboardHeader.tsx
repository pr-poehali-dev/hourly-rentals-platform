import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Owner {
  id: number;
  email: string;
  full_name: string;
  balance: number;
  bonus_balance: number;
  phone?: string;
}

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  balance_after: number;
  created_at: string;
  related_bid_id: number | null;
}

interface OwnerDashboardHeaderProps {
  owner: Owner;
  onLogout: () => void;
  onTopup: (amount: string) => Promise<void>;
  isTopupLoading: boolean;
  showCashbackAnimation: boolean;
  cashbackAmount: number;
  transactions: Transaction[];
}

export default function OwnerDashboardHeader({
  owner,
  onLogout,
  onTopup,
  isTopupLoading,
  showCashbackAnimation,
  cashbackAmount,
  transactions,
}: OwnerDashboardHeaderProps) {
  const [topupAmount, setTopupAmount] = useState('');
  const [showTransactionsDialog, setShowTransactionsDialog] = useState(false);
  const totalBalance = owner.balance + owner.bonus_balance;

  const handleTopupClick = async () => {
    await onTopup(topupAmount);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-purple-200 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">⏰</div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Личный кабинет
              </h1>
              <p className="text-xs text-muted-foreground">{owner.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Card className="px-6 py-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 relative">
              {showCashbackAnimation && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
                  <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <Icon name="Gift" size={20} />
                    <span className="font-bold">+{cashbackAmount}₽ кэшбэк!</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">Баланс</div>
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {totalBalance}<span className="text-xl">₽</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>{owner.balance}<span className="text-[10px]">₽</span> основной</div>
                    <div className="text-purple-600 font-medium">{owner.bonus_balance}<span className="text-[10px]">₽</span> бонусный</div>
                  </div>
                </div>
                <div className="border-l border-purple-200 pl-6">
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTransactionsDialog(true)}
                      className="w-full mb-1 border-purple-300 hover:bg-purple-50"
                    >
                      <Icon name="Receipt" size={14} className="mr-1" />
                      История операций
                    </Button>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Сумма"
                        value={topupAmount}
                        onChange={(e) => setTopupAmount(e.target.value)}
                        className="w-32 bg-white"
                        min="100"
                      />
                      <Button
                        onClick={handleTopupClick}
                        disabled={isTopupLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isTopupLoading ? (
                          <Icon name="Loader2" size={16} className="animate-spin" />
                        ) : (
                          <>
                            <Icon name="Wallet" size={16} className="mr-1" />
                            Пополнить
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[11px] text-purple-700 bg-purple-100 px-2 py-1 rounded leading-tight">
                        <Icon name="Gift" size={11} className="inline mr-1" />
                        Используйте бонусный счет на все платные услуги сайта: продление/продвижение объекта.
                      </div>
                      <div className="text-[11px] text-purple-700 bg-purple-100 px-2 py-1 rounded leading-tight">
                        1 бонусный рубль равен 1 рублю.
                      </div>
                      <div className="text-[11px] text-green-700 bg-green-100 px-2 py-1 rounded leading-tight">
                        <Icon name="TrendingUp" size={11} className="inline mr-1" />
                        При пополнении баланса начисляется кэшбэк на бонусный счет 10%.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            <Button variant="outline" onClick={onLogout}>
              <Icon name="LogOut" size={18} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showTransactionsDialog} onOpenChange={setShowTransactionsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>История операций</DialogTitle>
            <DialogDescription>Последние 50 транзакций</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 overflow-y-auto flex-1 pr-2">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Receipt" size={48} className="mx-auto mb-2 opacity-20" />
                <p>Операций пока нет</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'deposit' ? 'bg-green-100' :
                      tx.type === 'bonus' ? 'bg-purple-100' :
                      'bg-red-100'
                    }`}>
                      <Icon
                        name={
                          tx.type === 'deposit' ? 'ArrowDownToLine' :
                          tx.type === 'bonus' ? 'Gift' :
                          'ArrowUpFromLine'
                        }
                        size={18}
                        className={
                          tx.type === 'deposit' ? 'text-green-600' :
                          tx.type === 'bonus' ? 'text-purple-600' :
                          'text-red-600'
                        }
                      />
                    </div>
                    <div>
                      <div className="font-medium">{tx.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      tx.type === 'deposit' || tx.type === 'bonus' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'deposit' || tx.type === 'bonus' ? '+' : '-'}{Math.abs(tx.amount)} ₽
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Баланс: {tx.balance_after} ₽
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}