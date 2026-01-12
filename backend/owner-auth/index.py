import json
import os
import psycopg2
import hashlib
import secrets
from datetime import datetime, timedelta

def handler(event: dict, context) -> dict:
    '''API для регистрации и авторизации владельцев отелей'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body = json.loads(event.get('body', '{}'))
    action = body.get('action')
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        if action == 'register':
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')
            full_name = body.get('full_name', '')
            phone = body.get('phone', '')
            
            if not email or not password or not full_name:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заполните все обязательные поля'})
                }
            
            cur.execute("SELECT id FROM owners WHERE email = %s", (email,))
            if cur.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email уже зарегистрирован'})
                }
            
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            verification_token = secrets.token_urlsafe(32)
            
            cur.execute("""
                INSERT INTO owners (email, password_hash, full_name, phone, verification_token, bonus_balance)
                VALUES (%s, %s, %s, %s, %s, 100)
                RETURNING id, email, full_name, balance, bonus_balance
            """, (email, password_hash, full_name, phone, verification_token))
            
            owner = cur.fetchone()
            conn.commit()
            
            token = secrets.token_urlsafe(32)
            cur.execute("""
                INSERT INTO transactions (owner_id, amount, type, description, balance_after)
                VALUES (%s, 100, 'bonus', 'Бонус за регистрацию', 100)
            """, (owner[0],))
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'token': token,
                    'owner': {
                        'id': owner[0],
                        'email': owner[1],
                        'full_name': owner[2],
                        'balance': owner[3],
                        'bonus_balance': owner[4]
                    }
                })
            }
        
        elif action == 'login':
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')
            
            if not email or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Введите email и пароль'})
                }
            
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            cur.execute("""
                SELECT id, email, full_name, balance, bonus_balance, phone
                FROM owners WHERE email = %s AND password_hash = %s
            """, (email, password_hash))
            
            owner = cur.fetchone()
            if not owner:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверный email или пароль'})
                }
            
            cur.execute("UPDATE owners SET last_login = CURRENT_TIMESTAMP WHERE id = %s", (owner[0],))
            conn.commit()
            
            token = secrets.token_urlsafe(32)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'token': token,
                    'owner': {
                        'id': owner[0],
                        'email': owner[1],
                        'full_name': owner[2],
                        'balance': owner[3],
                        'bonus_balance': owner[4],
                        'phone': owner[5]
                    }
                })
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unknown action'})
            }
    
    finally:
        cur.close()
        conn.close()
