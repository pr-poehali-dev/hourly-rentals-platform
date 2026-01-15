import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface SubscriptionDialogProps {
  open: boolean;
  listing: any | null;
  subscriptionDays: number;
  formatSubscriptionStatus: (listing: any) => { text: string; variant: 'destructive' | 'default' | 'secondary'; daysLeft: number | null };
  onClose: () => void;
  onDaysChange: (days: number) => void;
  onSubmit: () => void;
}

export default function SubscriptionDialog({
  open,
  listing,
  subscriptionDays,
  formatSubscriptionStatus,
  onClose,
  onDaysChange,
  onSubmit,
}: SubscriptionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Установить подписку</DialogTitle>
          <DialogDescription>
            {listing?.title}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {listing?.subscription_expires_at && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-900">
                Текущая подписка: <strong>{formatSubscriptionStatus(listing).text}</strong>
              </div>
              <div className="text-xs text-blue-700 mt-1">
                Новое время добавится к существующему
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-2 block">Количество дней</label>
            <Input
              type="number"
              min="1"
              value={subscriptionDays}
              onChange={(e) => onDaysChange(Number(e.target.value))}
              placeholder="30"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onDaysChange(30)}>30 дней</Button>
            <Button size="sm" variant="outline" onClick={() => onDaysChange(90)}>90 дней</Button>
            <Button size="sm" variant="outline" onClick={() => onDaysChange(365)}>1 год</Button>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Отмена
          </Button>
          <Button onClick={onSubmit} className="flex-1">
            Установить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
