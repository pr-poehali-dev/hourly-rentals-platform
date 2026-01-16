import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface Owner {
  id: number;
  full_name: string;
  balance: number;
  bonus_balance: number;
}

interface BonusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOwner: Owner | null;
  bonusAmount: string;
  setBonusAmount: (amount: string) => void;
  onAddBonus: () => void;
}

export default function BonusDialog({
  open,
  onOpenChange,
  selectedOwner,
  bonusAmount,
  setBonusAmount,
  onAddBonus,
}: BonusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Начислить бонусы</DialogTitle>
          <DialogDescription>
            {selectedOwner?.full_name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {selectedOwner && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-sm text-purple-900">
                Текущий баланс: <strong>{selectedOwner.balance} ₽</strong>
              </div>
              <div className="text-sm text-purple-900">
                Бонусный баланс: <strong>{selectedOwner.bonus_balance} ₽</strong>
              </div>
              <div className="text-xs text-purple-700 mt-1">
                1 бонусный рубль = 1 обычному рублю
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-2 block">Сумма бонусов (₽)</label>
            <Input
              type="number"
              min="1"
              step="1"
              value={bonusAmount}
              onChange={(e) => setBonusAmount(e.target.value)}
              placeholder="100"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setBonusAmount('100')}>100₽</Button>
            <Button size="sm" variant="outline" onClick={() => setBonusAmount('500')}>500₽</Button>
            <Button size="sm" variant="outline" onClick={() => setBonusAmount('1000')}>1000₽</Button>
            <Button size="sm" variant="outline" onClick={() => setBonusAmount('5000')}>5000₽</Button>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Отмена
          </Button>
          <Button onClick={onAddBonus} className="flex-1 bg-green-600 hover:bg-green-700">
            Начислить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
