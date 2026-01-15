-- Удаляем пробелы в конце названий городов
UPDATE listings 
SET city = TRIM(city) 
WHERE city != TRIM(city);