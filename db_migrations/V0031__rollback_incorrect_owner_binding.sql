-- Откат: отвязываем все объекты в Екатеринбурге обратно (кроме изначального объекта с id=1)
UPDATE listings 
SET owner_id = NULL 
WHERE city ILIKE '%Екатеринбург%' AND id != 1;

-- Откат бонусов
UPDATE owners
SET bonus_balance = 20500
WHERE id = 2;