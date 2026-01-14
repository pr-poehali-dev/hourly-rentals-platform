-- Добавляем колонку created_by_employee_id для отслеживания сотрудника, создавшего объект
ALTER TABLE listings ADD COLUMN IF NOT EXISTS created_by_employee_id INTEGER;