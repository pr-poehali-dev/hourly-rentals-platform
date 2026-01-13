-- Добавление полей для ролей администраторов
ALTER TABLE t_p39732784_hourly_rentals_platf.admins 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'employee',
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"listings": true, "owners": false, "settings": false}'::jsonb,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS login VARCHAR(255);

-- Обновление существующих администраторов (делаем их суперадминами)
UPDATE t_p39732784_hourly_rentals_platf.admins 
SET role = 'superadmin', 
    permissions = '{"listings": true, "owners": true, "settings": true}'::jsonb,
    login = email
WHERE role IS NULL;

-- Добавление сотрудника Елизаветы с ограниченными правами
INSERT INTO t_p39732784_hourly_rentals_platf.admins (login, email, password_hash, name, role, permissions, is_active) 
VALUES (
    '89636667256',
    'elizaveta@120min.ru',
    '29938172', 
    'Елизавета',
    'employee',
    '{"listings": true, "owners": false, "settings": false}'::jsonb,
    true
);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_admins_login ON t_p39732784_hourly_rentals_platf.admins(login);
CREATE INDEX IF NOT EXISTS idx_admins_role ON t_p39732784_hourly_rentals_platf.admins(role);