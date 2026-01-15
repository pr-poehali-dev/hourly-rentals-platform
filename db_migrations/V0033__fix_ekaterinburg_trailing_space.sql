-- Убираем пробел в названии города для объекта ID 69
UPDATE t_p39732784_hourly_rentals_platf.listings 
SET city = 'Екатеринбург' 
WHERE id = 69;