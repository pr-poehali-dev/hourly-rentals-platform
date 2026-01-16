-- Таблица для бронирования ТОП-20 позиций
CREATE TABLE IF NOT EXISTS t_p39732784_hourly_rentals_platf.top20_bookings (
    id SERIAL PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 1 AND position <= 20),
    listing_id INTEGER NOT NULL REFERENCES t_p39732784_hourly_rentals_platf.listings(id),
    owner_id INTEGER NOT NULL REFERENCES t_p39732784_hourly_rentals_platf.owners(id),
    paid_amount INTEGER NOT NULL,
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_top20_city_position ON t_p39732784_hourly_rentals_platf.top20_bookings(city, position) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_top20_listing ON t_p39732784_hourly_rentals_platf.top20_bookings(listing_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_top20_expires ON t_p39732784_hourly_rentals_platf.top20_bookings(expires_at) WHERE is_active = TRUE;