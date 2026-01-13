-- Добавление поля is_archived для владельцев
ALTER TABLE owners ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Создание индекса для быстрого поиска активных владельцев
CREATE INDEX IF NOT EXISTS idx_owners_archived ON owners(is_archived);