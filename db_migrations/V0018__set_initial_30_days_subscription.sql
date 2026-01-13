-- Установить всем активным объектам подписку на 30 дней
UPDATE listings 
SET subscription_expires_at = NOW() + INTERVAL '30 days'
WHERE is_archived = FALSE AND subscription_expires_at IS NULL;