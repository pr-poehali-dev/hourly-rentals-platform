-- Добавляем поля для управления подпиской объектов
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_auto_renew BOOLEAN DEFAULT FALSE;

-- Добавляем комментарии
COMMENT ON COLUMN listings.subscription_expires_at IS 'Дата истечения подписки (объект уходит в архив)';
COMMENT ON COLUMN listings.subscription_auto_renew IS 'Автопродление подписки';
