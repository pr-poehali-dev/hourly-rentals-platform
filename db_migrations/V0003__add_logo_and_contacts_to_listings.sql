-- Добавление полей logo_url, phone и telegram в таблицу listings
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS telegram VARCHAR(255);