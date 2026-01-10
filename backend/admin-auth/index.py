import json
import os
import jwt
import psycopg2
from datetime import datetime, timedelta

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
        email = body.get('email')
        password = body.get('password')
        
        if not email or not password:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Email и пароль обязательны'}),
                'isBase64Encoded': False
            }
        
        # Подключение к БД
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        # Проверка администратора
        cur.execute(
            "SELECT id, email, name FROM admins WHERE email = %s AND password_hash = %s",
            (email, password)
        )
        admin = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if not admin:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверные учётные данные'}),
                'isBase64Encoded': False
            }
        
        # Генерация JWT токена
        jwt_secret = os.environ['JWT_SECRET']
        token = jwt.encode({
            'admin_id': admin[0],
            'email': admin[1],
            'name': admin[2],
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
                    'name': admin[2]
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
