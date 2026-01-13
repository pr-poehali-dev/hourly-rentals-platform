import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface Owner {
  id: number;
  email: string;
  full_name: string;
  balance: number;
  bonus_balance: number;
  phone?: string;
}

interface OwnerDashboardHeaderProps {
  owner: Owner;
  onLogout: () => void;
  onTopup: (amount: string) => Promise<void>;
  isTopupLoading: boolean;
  showCashbackAnimation: boolean;
  cashbackAmount: number;
}

export default function OwnerDashboardHeader({
  owner,
  onLogout,
  onTopup,
  isTopupLoading,
  showCashbackAnimation,
  cashbackAmount,
}: OwnerDashboardHeaderProps) {
  const [topupAmount, setTopupAmount] = useState('');
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
    </header>
  );
}
