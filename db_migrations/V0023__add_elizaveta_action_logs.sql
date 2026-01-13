-- Добавление записей о действиях сотрудника Елизаветы (admin_id=3) для отелей в Екатеринбурге

-- Транс Отель (listing_id=15)
INSERT INTO t_p39732784_hourly_rentals_platf.admin_action_logs 
(admin_id, action_type, entity_type, entity_id, entity_name, description, metadata, created_at)
VALUES (
    3,
    'create',
    'listing',
    15,
    'Транс Отель',
    'Добавлен новый объект "Транс Отель" в городе Екатеринбург',
    '{"type": "hotel", "city": "Екатеринбург", "district": "Центральный", "price": 1500}',
    '2026-01-13 18:53:53'
);

-- Live эко-отель (listing_id=16)
INSERT INTO t_p39732784_hourly_rentals_platf.admin_action_logs 
(admin_id, action_type, entity_type, entity_id, entity_name, description, metadata, created_at)
VALUES (
    3,
    'create',
    'listing',
    16,
    'Live эко-отель',
    'Добавлен новый объект "Live эко-отель" в городе Екатеринбург',
    '{"type": "hotel", "city": "Екатеринбург", "district": "Центральный", "price": 1800}',
    '2026-01-13 19:10:32'
);

-- Suite Hotel (listing_id=17)
INSERT INTO t_p39732784_hourly_rentals_platf.admin_action_logs 
(admin_id, action_type, entity_type, entity_id, entity_name, description, metadata, created_at)
VALUES (
    3,
    'create',
    'listing',
    17,
    'Suite Hotel',
    'Добавлен новый объект "Suite Hotel" в городе Екатеринбург',
    '{"type": "hotel", "city": "Екатеринбург", "district": "Центральный", "price": 2000}',
    '2026-01-13 19:20:02'
);

-- Начисление бонусов за добавление отелей (200 рублей за отель)
INSERT INTO t_p39732784_hourly_rentals_platf.employee_bonuses
(admin_id, entity_type, entity_id, entity_name, bonus_amount, notes, created_at)
VALUES 
(3, 'listing', 15, 'Транс Отель', 200, 'Добавление: hotel в городе Екатеринбург', '2026-01-13 18:53:53'),
(3, 'listing', 16, 'Live эко-отель', 200, 'Добавление: hotel в городе Екатеринбург', '2026-01-13 19:10:32'),
(3, 'listing', 17, 'Suite Hotel', 200, 'Добавление: hotel в городе Екатеринбург', '2026-01-13 19:20:02');