-- Обновляем таблицу виртуальных номеров реальными номерами из Exolve
UPDATE t_p39732784_hourly_rentals_platf.virtual_numbers SET phone = '+79587589276' WHERE id = 1;
UPDATE t_p39732784_hourly_rentals_platf.virtual_numbers SET phone = '+79587610865' WHERE id = 2;
UPDATE t_p39732784_hourly_rentals_platf.virtual_numbers SET phone = '+79587623955' WHERE id = 3;
UPDATE t_p39732784_hourly_rentals_platf.virtual_numbers SET phone = '+79862293061' WHERE id = 4;
UPDATE t_p39732784_hourly_rentals_platf.virtual_numbers SET phone = '+79587579160' WHERE id = 5;

-- Сбрасываем все назначения, чтобы начать с чистого листа
UPDATE t_p39732784_hourly_rentals_platf.virtual_numbers 
SET is_busy = false, assigned_listing_id = NULL, assigned_at = NULL, assigned_until = NULL;