-- Исправление города для объектов с пробелами и опечатками
UPDATE t_p39732784_hourly_rentals_platf.listings 
SET city = 'Екатеринбург' 
WHERE city IN ('Екатеринбург ', 'Екатернибург');