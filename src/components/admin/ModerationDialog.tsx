import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

interface ModerationDialogProps {
  open: boolean;
  listing: any | null;
  moderationStatus: string;
  moderationComment: string;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onCommentChange: (comment: string) => void;
  onSubmit: () => void;
}

export default function ModerationDialog({
  open,
  listing,
  moderationStatus,
  moderationComment,
  onClose,
  onStatusChange,
  onCommentChange,
  onSubmit,
}: ModerationDialogProps) {
  const [localComment, setLocalComment] = useState(moderationComment);

  useEffect(() => {
    setLocalComment(moderationComment);
  }, [moderationComment, open]);

  const handleCommentChange = (value: string) => {
    setLocalComment(value);
    onCommentChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Модерация объекта</DialogTitle>
          <DialogDescription>
            {listing?.title}
          </DialogDescription>
        </DialogHeader>
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
          
          <div>
            <label className="text-sm font-medium mb-2 block">Комментарий для сотрудника</label>
            <textarea
              className="w-full min-h-[100px] p-3 border rounded-md resize-y"
              placeholder="Укажите, что нужно исправить..."
              value={localComment}
              onChange={(e) => handleCommentChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Сотрудник увидит этот комментарий и сможет внести правки
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1"
          >
            Отмена
          </Button>
          <Button 
            onClick={onSubmit} 
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700"
          >
            <Icon name="Check" size={16} className="mr-2" />
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}