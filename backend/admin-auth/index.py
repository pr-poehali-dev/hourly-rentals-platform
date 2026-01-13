import json
import os
import jwt
import psycopg2
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
        body = json.loads(event.get('body', '{}'))
        login = body.get('email') or body.get('login')  # Поддержка логина и email
        password = body.get('password')
        
        if not login or not password:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Логин и пароль обязательны'}),
                'isBase64Encoded': False
            }
        
        # Подключение к БД
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        # Проверка администратора (по логину или email)
        cur.execute(
            "SELECT id, email, name, role, permissions, is_active FROM t_p39732784_hourly_rentals_platf.admins WHERE (login = %s OR email = %s) AND password_hash = %s AND is_active = true",
            (login, login, password)
        )
        admin = cur.fetchone()
        
        if not admin:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверные учётные данные'}),
                'isBase64Encoded': False
            }
        
        # Обновление времени последнего входа
        cur.execute(
            "UPDATE t_p39732784_hourly_rentals_platf.admins SET last_login = CURRENT_TIMESTAMP WHERE id = %s",
            (admin[0],)
        )
        conn.commit()
        
        cur.close()
        conn.close()
        
        # Генерация JWT токена с ролью и правами
        jwt_secret = os.environ['JWT_SECRET']
        token = jwt.encode({
            'admin_id': admin[0],
            'email': admin[1],
            'name': admin[2],
            'role': admin[3],
            'permissions': admin[4],
            'exp': datetime.utcnow() + timedelta(days=7)
        }, jwt_secret, algorithm='HS256')
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
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
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }