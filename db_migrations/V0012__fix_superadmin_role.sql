-- Обновление главного администратора
UPDATE t_p39732784_hourly_rentals_platf.admins 
SET 
  role = 'superadmin',
  permissions = '{"listings": true, "owners": true, "settings": true}'::jsonb,
  login = 'admin',
  is_active = true
WHERE id = 1;