-- Создание таблицы администраторов
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы объектов (отели и апартаменты)
CREATE TABLE IF NOT EXISTS listings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('hotel', 'apartment')),
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  price INTEGER NOT NULL,
  rating DECIMAL(2,1) DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  auction INTEGER DEFAULT 999,
  image_url TEXT,
  metro VARCHAR(100),
  metro_walk INTEGER DEFAULT 0,
  has_parking BOOLEAN DEFAULT false,
  features TEXT[],
  lat DECIMAL(10, 7),
  lng DECIMAL(10, 7),
  min_hours INTEGER DEFAULT 1,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы категорий номеров
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id),
  type VARCHAR(100) NOT NULL,
  price INTEGER NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы фотографий объектов
CREATE TABLE IF NOT EXISTS listing_photos (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id),
  photo_url TEXT NOT NULL,
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_archived ON listings(is_archived);
CREATE INDEX IF NOT EXISTS idx_rooms_listing_id ON rooms(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_photos_listing_id ON listing_photos(listing_id);

-- Вставка тестового администратора (пароль: admin123)
INSERT INTO admins (email, password_hash, name) 
VALUES ('admin@120min.ru', '$2b$10$rKZK9qE0hXxGqF5rJZqYJeYvXqHqZ0LqTVYqZHVYqZHVYqZHVYqZH', 'Главный администратор')
ON CONFLICT (email) DO NOTHING;
