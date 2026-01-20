import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface OwnerModerationDialogProps {
  open: boolean;
  listing: any | null;
  moderationStatus: string;
  moderationComment: string;
  token: string;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onCommentChange: (comment: string) => void;
  onSubmit: () => Promise<void>;
}

export default function OwnerModerationDialog({
  open,
  listing,
  moderationStatus,
  moderationComment,
  token,
  onClose,
  onStatusChange,
  onCommentChange,
  onSubmit,
}: OwnerModerationDialogProps) {
  const [localComment, setLocalComment] = useState(moderationComment);
  const [sendEmail, setSendEmail] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLocalComment(moderationComment);
    setSendEmail(moderationStatus === 'approved');
  }, [moderationComment, moderationStatus, open]);

  const handleCommentChange = (value: string) => {
    setLocalComment(value);
    onCommentChange(value);
  };

  const handleSubmit = async () => {
    setIsSending(true);
    
    try {
      // Сначала сохраняем статус модерации
      await onSubmit();
      
      // Если одобрено и создано владельцем, отправляем email
      if (moderationStatus === 'approved' && listing?.created_by_owner && sendEmail) {
        const response = await fetch('https://functions.poehali.dev/be8d7c03-13d9-42fe-a041-a17c5e5ff5b2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listing_id: listing.id }),
        });
        
        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        toast({
          title: 'Email отправлен',
          description: `Учетные данные отправлены владельцу на ${listing.owner_email || 'email'}`,
        });
      }
      
      onClose();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось обработать модерацию',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const isOwnerListing = listing?.created_by_owner;
  const willSendEmail = moderationStatus === 'approved' && isOwnerListing && sendEmail;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Модерация объекта</DialogTitle>
          <DialogDescription>
            {listing?.title}
          </DialogDescription>
        </DialogHeader>
        
        {isOwnerListing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <Icon name="Info" size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Заявка от владельца</p>
              <p>Объект создан владельцем самостоятельно. После одобрения владельцу автоматически отправятся учетные данные для входа.</p>
            </div>
          </div>
        )}
        
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Статус модерации</label>
            <Select value={moderationStatus} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">
                  <div className="flex items-center gap-2">
                    <Icon name="CheckCircle" size={16} className="text-green-600" />
                    Одобрено
                  </div>
                </SelectItem>
                <SelectItem value="rejected">
                  <div className="flex items-center gap-2">
                    <Icon name="AlertCircle" size={16} className="text-red-600" />
                    Отклонено
                  </div>
                </SelectItem>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <Icon name="Clock" size={16} className="text-gray-600" />
                    На проверке
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isOwnerListing && moderationStatus === 'approved' && (
            <div className="flex items-start gap-3 p-3 border rounded-lg bg-green-50">
              <Checkbox
                id="send-email"
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(checked as boolean)}
              />
              <label htmlFor="send-email" className="text-sm cursor-pointer flex-1">
                <span className="font-medium block mb-1">Отправить email владельцу</span>
                <span className="text-muted-foreground text-xs">
                  После одобрения владелец получит письмо с логином и паролем для входа в экстранет
                </span>
              </label>
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              Комментарий {moderationStatus === 'rejected' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              className="w-full min-h-[100px] p-3 border rounded-md resize-y"
              placeholder={moderationStatus === 'rejected' ? 'Обязательно укажите причину отклонения...' : 'Дополнительные комментарии...'}
              value={localComment}
              onChange={(e) => handleCommentChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {moderationStatus === 'rejected' 
                ? 'Владелец/сотрудник увидит этот комментарий и сможет внести правки' 
                : 'Необязательное поле для внутренних заметок'}
            </p>
          </div>
        </div>
        
        {willSendEmail && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2 text-sm">
            <Icon name="Mail" size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <span className="text-yellow-800">
              После сохранения владелец получит email с данными для входа
            </span>
          </div>
        )}
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1"
            disabled={isSending}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700"
            disabled={isSending || (moderationStatus === 'rejected' && !localComment.trim())}
          >
            {isSending ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Обработка...
              </>
            ) : (
              <>
                <Icon name="Check" size={16} className="mr-2" />
                Сохранить
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
