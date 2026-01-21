import json
import os
import jwt
import psycopg2
import hashlib
from datetime import datetime, timedelta

# Admin authentication handler
def handler(event: dict, context) -> dict:
    '''API для авторизации администраторов'''
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        raw_body = event.get('body', '{}')
        if not raw_body or raw_body.strip() == '':
            raw_body = '{}'
        
        body = json.loads(raw_body)
        login = body.get('email') or body.get('login')  # Поддержка логина и email
        password = body.get('password')
        
        print(f"[AUTH] Попытка входа - Логин: {login}")
        
        if not login or not password:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Логин и пароль обязательны'}),
                'isBase64Encoded': False
            }
        
        # Подключение к БД
        conn = None
        cur = None
        try:
            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            cur = conn.cursor()
            
            # Хеширование пароля для проверки
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            # Проверка администратора (по логину, email или телефону)
            login_escaped = login.replace("'", "''")
            password_hash_escaped = password_hash.replace("'", "''")
            cur.execute(
                f"SELECT id, email, name, role, permissions, is_active FROM t_p39732784_hourly_rentals_platf.admins WHERE (login = '{login_escaped}' OR email = '{login_escaped}') AND password_hash = '{password_hash_escaped}' AND is_active = true"
            )
            admin = cur.fetchone()
            
            print(f"[AUTH] Результат поиска: {admin}")
            
            if not admin:
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                    },
                    'body': json.dumps({'error': 'Неверные учётные данные'}),
                    'isBase64Encoded': False
                }
            
            # Обновление времени последнего входа
            cur.execute(
                f"UPDATE t_p39732784_hourly_rentals_platf.admins SET last_login = CURRENT_TIMESTAMP WHERE id = {admin[0]}"
            )
            conn.commit()
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()
        
        # Генерация JWT токена с ролью и правами
        jwt_secret = os.environ.get('JWT_SECRET', 'default-secret-key-change-in-production')
        token = jwt.encode({
            'admin_id': admin[0],
            'email': admin[1],
            'name': admin[2],
            'role': admin[3],
            'permissions': admin[4],
            'exp': datetime.utcnow() + timedelta(days=7)
        }, jwt_secret, algorithm='HS256')
        
        print(f"[AUTH] Успешный вход для {admin[1]}, токен сгенерирован")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps({
                'token': token,
                'admin': {
                    'id': admin[0],
                    'email': admin[1],
                    'name': admin[2],
                    'role': admin[3],
                    'permissions': admin[4]
                }
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        print(f"[AUTH ERROR] {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps({'error': f'{type(e).__name__}: {str(e)}'}),
            'isBase64Encoded': False
        }