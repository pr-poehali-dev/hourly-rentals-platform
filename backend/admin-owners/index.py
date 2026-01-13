import json
import os
import jwt
import psycopg2
import hashlib
from psycopg2.extras import RealDictCursor

def verify_token(token: str) -> dict:
    '''Проверка JWT токена администратора'''
    if not token:
        return None
    try:
        jwt_secret = os.environ['JWT_SECRET']
        payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        return payload
    except:
        return None

def handler(event: dict, context) -> dict:
    '''API для управления владельцами отелей в админ-панели'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    auth_header = event.get('headers', {}).get('X-Authorization', '')
    token = auth_header.replace('Bearer ', '') if auth_header else ''
    admin = verify_token(token)
    
    if not admin:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуется авторизация'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            cur.execute("""
                SELECT 
                    o.id, o.email, o.login, o.full_name, o.phone, 
                    o.balance, o.bonus_balance, o.created_at, o.last_login, o.is_archived,
                    COUNT(DISTINCT l.id) as hotels_count
                FROM owners o
                LEFT JOIN listings l ON l.owner_id = o.id AND l.is_archived = FALSE
                GROUP BY o.id
                ORDER BY o.is_archived, o.id DESC
            """)
            owners = cur.fetchall()
            
            # Добавляем список отелей для каждого владельца
            for owner in owners:
                cur.execute("""
                    SELECT id, title, city 
                    FROM listings 
                    WHERE owner_id = %s AND is_archived = FALSE
                    ORDER BY title
                """, (owner['id'],))
                owner['hotels'] = [dict(row) for row in cur.fetchall()]
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(row) for row in owners], default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            email = body.get('email', '').strip().lower()
            login = body.get('login', '').strip()
            password = body.get('password', '')
            full_name = body.get('full_name', '')
            phone = body.get('phone', '')
            
            if not email or not password or not full_name:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заполните обязательные поля'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT id FROM owners WHERE email = %s", (email,))
            if cur.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email уже используется'}),
                    'isBase64Encoded': False
                }
            
            if login:
                cur.execute("SELECT id FROM owners WHERE login = %s", (login,))
                if cur.fetchone():
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Логин уже используется'}),
                        'isBase64Encoded': False
                    }
            
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            cur.execute("""
                INSERT INTO owners (email, login, password_hash, full_name, phone, bonus_balance)
                VALUES (%s, %s, %s, %s, %s, 0)
                RETURNING id, email, login, full_name, phone, balance, bonus_balance, created_at
            """, (email, login or None, password_hash, full_name, phone))
            
            owner = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(owner), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            owner_id = body.get('id')
            email = body.get('email', '').strip().lower()
            login = body.get('login', '').strip()
            password = body.get('password')
            full_name = body.get('full_name', '')
            phone = body.get('phone', '')
            
            if not owner_id or not email or not full_name:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заполните обязательные поля'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT id FROM owners WHERE email = %s AND id != %s", (email, owner_id))
            if cur.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email уже используется'}),
                    'isBase64Encoded': False
                }
            
            if login:
                cur.execute("SELECT id FROM owners WHERE login = %s AND id != %s", (login, owner_id))
                if cur.fetchone():
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Логин уже используется'}),
                        'isBase64Encoded': False
                    }
            
            if password:
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                cur.execute("""
                    UPDATE owners 
                    SET email = %s, login = %s, password_hash = %s, full_name = %s, phone = %s
                    WHERE id = %s
                    RETURNING id, email, login, full_name, phone, balance, bonus_balance
                """, (email, login or None, password_hash, full_name, phone, owner_id))
            else:
                cur.execute("""
                    UPDATE owners 
                    SET email = %s, login = %s, full_name = %s, phone = %s
                    WHERE id = %s
                    RETURNING id, email, login, full_name, phone, balance, bonus_balance
                """, (email, login or None, full_name, phone, owner_id))
            
            owner = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(owner), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PATCH':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            owner_id = body.get('owner_id')
            
            if action == 'add_bonus':
                amount = body.get('amount')
                
                if not owner_id or not amount:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Укажите owner_id и amount'}),
                        'isBase64Encoded': False
                    }
                
                if amount <= 0:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Сумма должна быть положительной'}),
                        'isBase64Encoded': False
                    }
                
                # Начисляем бонусы
                cur.execute("""
                    UPDATE owners 
                    SET bonus_balance = bonus_balance + %s
                    WHERE id = %s
                    RETURNING id, full_name, bonus_balance, balance
                """, (amount, owner_id))
                
                owner = cur.fetchone()
                
                if not owner:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Владелец не найден'}),
                        'isBase64Encoded': False
                    }
                
                # Записываем транзакцию
                cur.execute("""
                    INSERT INTO transactions (owner_id, amount, type, description, balance_after)
                    VALUES (%s, %s, 'bonus', %s, %s)
                """, (
                    owner_id, 
                    amount, 
                    f'Начисление бонусов администратором (ID: {admin["id"]})',
                    owner['balance'] + owner['bonus_balance']
                ))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': f'Начислено {amount} бонусных рублей',
                        'owner': dict(owner)
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unknown action'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'DELETE':
            body = json.loads(event.get('body', '{}'))
            owner_id = body.get('id')
            
            if not owner_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID владельца не указан'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                UPDATE owners 
                SET is_archived = NOT is_archived
                WHERE id = %s
                RETURNING id, is_archived
            """, (owner_id,))
            
            result = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(result), default=str),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        print(f'ERROR: {type(e).__name__}: {str(e)}')
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()