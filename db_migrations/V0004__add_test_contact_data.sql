-- Добавляем тестовые контактные данные для проверки кнопок
UPDATE listings 
SET phone = '+79991234567', 
    telegram = '@myhotel' 
WHERE id = 1;