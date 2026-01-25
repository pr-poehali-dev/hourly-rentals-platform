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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const totalBalance = owner.balance + owner.bonus_balance;

  const handleTopupClick = async () => {
    await onTopup(topupAmount);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-purple-200 shadow-sm">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src="https://cdn.poehali.dev/projects/1a35ca30-983f-4a91-b0b4-3c6fa1c9a65b/files/8251a8b2-9b61-4cee-9e68-aae6e7ec6e96.jpg" 
                alt="120 минут" 
                className="h-10 w-10 sm:h-14 sm:w-14 object-contain flex-shrink-0"
              />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Экстранет
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-none">{owner.full_name}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Icon name={showMobileMenu ? "X" : "Menu"} size={24} />
            </Button>
          </div>
          <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 ${showMobileMenu ? 'flex bg-gradient-to-br from-purple-50/95 to-pink-50/95 backdrop-blur-sm p-3 rounded-lg border border-purple-100 shadow-lg' : 'hidden md:flex'}`}>
            <Card className="px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 relative">
              {showCashbackAnimation && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
                  <div className="bg-green-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-lg flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                    <Icon name="Gift" size={16} />
                    <span className="font-bold">+{cashbackAmount}₽ кэшбэк!</span>
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
                <div className="text-center sm:text-right">
                  <div className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1 flex items-center gap-1 justify-center sm:justify-end">
                    <span>Баланс</span>
                    {owner.bonus_balance > 0 && (
                      <Icon name="Gift" size={14} className="text-green-500" />
                    )}
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-purple-600 mb-0.5 sm:mb-1">
                    {totalBalance}<span className="text-lg sm:text-xl">₽</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5 flex gap-3 sm:gap-0 sm:flex-col justify-center sm:justify-start">
                    <div>{owner.balance}<span className="text-[10px]">₽</span> осн.</div>
                    {owner.bonus_balance > 0 && (
                      <div className="text-green-600 font-semibold animate-pulse">
                        {owner.bonus_balance}<span className="text-[10px]">₽</span> бонус
                      </div>
                    )}
                  </div>
                </div>
                <div className="border-t sm:border-t-0 sm:border-l border-purple-200 pt-3 sm:pt-0 sm:pl-6">
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTransactionsDialog(true)}
                      className="w-full mb-1 border-purple-300 hover:bg-purple-50 text-xs sm:text-sm h-8"
                    >
                      <Icon name="Receipt" size={14} className="mr-1" />
                      <span className="hidden sm:inline">История операций</span>
                      <span className="sm:hidden">История</span>
                    </Button>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Сумма"
                        value={topupAmount}
                        onChange={(e) => setTopupAmount(e.target.value)}
                        className="flex-1 sm:w-32 bg-white h-8 text-sm"
                        min="100"
                      />
                      <Button
                        onClick={handleTopupClick}
                        disabled={isTopupLoading}
                        className="bg-green-600 hover:bg-green-700 h-8 text-xs sm:text-sm px-2 sm:px-4"
                      >
                        {isTopupLoading ? (
                          <Icon name="Loader2" size={14} className="animate-spin" />
                        ) : (
                          <>
                            <Icon name="Wallet" size={14} className="sm:mr-1" />
                            <span className="hidden sm:inline">Пополнить</span>
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="space-y-1 hidden sm:block">
                      <div className="text-[11px] text-green-700 bg-green-100 px-2 py-1 rounded leading-tight font-semibold">
                        <Icon name="Gift" size={11} className="inline mr-1" />
                        5000₽ бонус за регистрацию и добавление объекта!
                      </div>
                      <div className="text-[11px] text-purple-700 bg-purple-100 px-2 py-1 rounded leading-tight">
                        <Icon name="Sparkles" size={11} className="inline mr-1" />
                        Используйте бонусы на продление и продвижение объекта.
                      </div>
                      <div className="text-[11px] text-purple-700 bg-purple-100 px-2 py-1 rounded leading-tight">
                        1 бонусный рубль = 1 рублю.
                      </div>
                      <div className="text-[11px] text-green-700 bg-green-100 px-2 py-1 rounded leading-tight">
                        <Icon name="TrendingUp" size={11} className="inline mr-1" />
                        Кэшбэк 10% на бонусный счёт при пополнении.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            <Button variant="outline" onClick={onLogout} className="w-full sm:w-auto h-8 text-xs sm:text-sm">
              <Icon name="LogOut" size={14} className="sm:mr-2" />
              <span className="hidden sm:inline">Выйти</span>
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