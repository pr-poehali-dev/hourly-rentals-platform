-- Добавление полей модерации в таблицу listings
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS moderation_comment TEXT,
ADD COLUMN IF NOT EXISTS moderated_by INTEGER REFERENCES t_p39732784_hourly_rentals_platf.admins(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS submitted_for_moderation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;

-- Комментарий: moderation_status может быть: 'pending', 'approved', 'needs_changes'
-- submitted_for_moderation = TRUE когда сотрудник отправил на модерацию

-- Индекс для быстрого поиска объектов на модерации
CREATE INDEX IF NOT EXISTS idx_listings_moderation_status ON listings(moderation_status);
CREATE INDEX IF NOT EXISTS idx_listings_submitted_for_moderation ON listings(submitted_for_moderation);