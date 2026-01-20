-- Добавляем поле для отметки объектов, созданных владельцами
ALTER TABLE t_p39732784_hourly_rentals_platf.listings 
ADD COLUMN IF NOT EXISTS created_by_owner BOOLEAN DEFAULT false;

-- Создаем таблицу для хранения временных паролей владельцев (до активации)
CREATE TABLE IF NOT EXISTS t_p39732784_hourly_rentals_platf.pending_owner_credentials (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES t_p39732784_hourly_rentals_platf.owners(id),
    email VARCHAR(255) NOT NULL,
    temporary_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    UNIQUE(owner_id)
);

-- Добавляем комментарии
COMMENT ON TABLE t_p39732784_hourly_rentals_platf.pending_owner_credentials IS 'Временные пароли для новых владельцев, ожидающих модерации';
COMMENT ON COLUMN t_p39732784_hourly_rentals_platf.listings.created_by_owner IS 'Флаг, что объект создан самим владельцем (не администратором)';
