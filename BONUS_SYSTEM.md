# Система бонусов

## Как работает бонусная система

### 1. Бонусные рубли

**Основные принципы:**
- 1 бонусный рубль = 1 обычному рублю
- Бонусы можно использовать для оплаты любых услуг:
  - Подписка на размещение (2000₽/месяц для отелей, 1000₽/месяц для апартаментов)
  - Аукцион позиций
  - Другие платные услуги
- Бонусы списываются в первую очередь перед основным балансом

### 2. Начисление бонусов администратором

**Интерфейс:**
- Админ-панель → Вкладка "Владельцы"
- Кнопка **"Бонусы"** (зелёная с иконкой подарка) на карточке владельца
- Диалоговое окно с:
  - Текущий баланс и бонусный баланс
  - Поле ввода суммы
  - Быстрые кнопки: 100₽, 500₽, 1000₽, 5000₽

**Backend API:**
```typescript
api.adminAddBonus(token, ownerId, amount)
```

**Backend функция:**
- URL: `https://functions.poehali.dev/25475092-b74f-493d-a43c-082847302085`
- Метод: `PATCH`
- Body:
```json
{
  "action": "add_bonus",
  "owner_id": 123,
  "amount": 1000
}
```

**Что происходит:**
1. Администратор вводит сумму бонусов
2. Backend обновляет поле `bonus_balance` у владельца
3. Создаётся запись в таблице `transactions`:
   - Тип: `bonus`
   - Описание: "Начисление бонусов администратором (ID: ADMIN_ID)"
   - Amount: положительное число
4. Владелец видит обновлённый баланс в личном кабинете

### 3. Использование бонусов

**Приоритет списания:**
1. Сначала списываются бонусы
2. Затем основной баланс

**Пример:**
- Баланс: 1000₽
- Бонусный баланс: 500₽
- Оплата подписки: 2000₽ на 30 дней

**Списание:**
1. Бонусы: -500₽ (весь бонусный баланс)
2. Баланс: -1500₽ (остаток суммы)
3. Итого: 500₽ + 1500₽ = 2000₽

**Код в backend:**
```python
bonus_used = min(owner['bonus_balance'], total_cost)
balance_used = total_cost - bonus_used

cur.execute("""
    UPDATE owners 
    SET balance = balance - %s, bonus_balance = bonus_balance - %s
    WHERE id = %s
""", (balance_used, bonus_used, owner_id))
```

### 4. Отображение баланса

**Админ-панель:**
- Баланс: XXX ₽
- Бонусный баланс: YYY ₽

**Личный кабинет владельца:**
- Большая карточка с общим балансом: `XXX ₽`
- Детализация: "XXX ₽ + YYY бонусных"

**API ответ:**
```json
{
  "id": 123,
  "full_name": "Иван Иванов",
  "balance": 1000,
  "bonus_balance": 500
}
```

### 5. История транзакций

**Типы операций с бонусами:**

| Тип | Описание | Amount |
|-----|----------|--------|
| `bonus` | Начисление бонусов администратором | Положительное |
| `deposit` | Пополнение баланса (с кэшбэком 10%) | Положительное |
| `subscription` | Оплата подписки | Отрицательное |
| `bid_payment` | Оплата аукциона | Отрицательное |

**SQL запрос для истории:**
```sql
SELECT 
  id, owner_id, amount, type, description, 
  balance_after, created_at
FROM transactions
WHERE owner_id = 123
ORDER BY created_at DESC
LIMIT 50;
```

### 6. Автоматическое начисление бонусов

**Кэшбэк при пополнении:**
- При пополнении баланса через Robokassa начисляется 10% кэшбэк на бонусный счёт
- Реализовано в `backend/payment/index.py`

**Пример:**
1. Владелец пополняет баланс на 10000₽
2. Основной баланс: +10000₽
3. Бонусный баланс: +1000₽ (10% кэшбэк)

```python
# После успешной оплаты
cashback = int(amount * 0.10)
cur.execute("""
    UPDATE owners 
    SET balance = balance + %s, bonus_balance = bonus_balance + %s
    WHERE id = %s
""", (amount, cashback, owner_id))

# Запись транзакции кэшбэка
cur.execute("""
    INSERT INTO transactions (owner_id, amount, type, description, balance_after)
    VALUES (%s, %s, 'bonus', '10% кэшбэк от пополнения', ...)
""", (owner_id, cashback))
```

## SQL Таблицы

### owners
```sql
CREATE TABLE owners (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  balance NUMERIC(10, 2) DEFAULT 0,
  bonus_balance NUMERIC(10, 2) DEFAULT 0,
  ...
);
```

### transactions
```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES owners(id),
  amount NUMERIC(10, 2) NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  balance_after NUMERIC(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Проверка системы

**SQL для проверки баланса:**
```sql
SELECT 
  id, full_name, 
  balance, 
  bonus_balance,
  balance + bonus_balance as total_balance
FROM owners
WHERE id = 123;
```

**SQL для проверки транзакций:**
```sql
SELECT 
  type, 
  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as credited,
  SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as debited
FROM transactions
WHERE owner_id = 123
GROUP BY type;
```

## Рекомендации

1. **Начисляйте бонусы обдуманно** — они равны реальным деньгам
2. **Используйте быстрые кнопки** (100₽, 500₽, 1000₽, 5000₽) для стандартных сумм
3. **Проверяйте историю** перед начислением, чтобы избежать дублирования
4. **Документируйте причину** начисления в описании транзакции (автоматически добавляется ID администратора)

## Примеры использования

### Поощрение активного владельца
```
Администратор начисляет 1000₽ бонусов владельцу за:
- 10 новых отелей в системе
- Активное использование аукциона
- Положительные отзывы
```

### Компенсация проблем
```
Администратор начисляет 500₽ бонусов за:
- Технические проблемы с подпиской
- Ошибку в биллинге
- Извинения за сбой системы
```

### Промо-акции
```
Администратор начисляет 2000₽ бонусов новым владельцам:
- Бесплатный первый месяц подписки
- Подарок при регистрации
- Праздничная акция
```
