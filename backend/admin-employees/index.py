import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import hashlib

def handler(event: dict, context) -> dict:
    '''API для управления сотрудниками (админами) - просмотр, создание, редактирование, удаление'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    # Проверка авторизации
    auth_header = event.get('headers', {}).get('X-Authorization', '')
    token = auth_header.replace('Bearer ', '') if auth_header else ''
    
    if not token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Проверка прав доступа - только superadmin
            cur.execute("""
                SELECT role FROM t_p39732784_hourly_rentals_platf.admins 
                WHERE login = %s AND is_active = true
            """, (token,))
            admin = cur.fetchone()
            
            if not admin or admin['role'] != 'superadmin':
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Access denied'}),
                    'isBase64Encoded': False
                }
            
            # GET - получить список всех сотрудников
            if method == 'GET':
                cur.execute("""
                    SELECT id, email, name, role, permissions, is_active, 
                           created_at, last_login, login
                    FROM t_p39732784_hourly_rentals_platf.admins
                    ORDER BY created_at DESC
                """)
                employees = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(e) for e in employees], default=str),
                    'isBase64Encoded': False
                }
            
            # POST - создать нового сотрудника
            elif method == 'POST':
                data = json.loads(event.get('body', '{}'))
                email = data.get('email')
                name = data.get('name')
                password = data.get('password')
                role = data.get('role', 'employee')
                permissions = data.get('permissions', {'owners': False, 'listings': True, 'settings': False})
                login = data.get('login')
                
                if not email or not name or not password or not login:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Missing required fields'}),
                        'isBase64Encoded': False
                    }
                
                # Проверка на существование
                cur.execute("""
                    SELECT id FROM t_p39732784_hourly_rentals_platf.admins 
                    WHERE email = %s OR login = %s
                """, (email, login))
                if cur.fetchone():
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email or login already exists'}),
                        'isBase64Encoded': False
                    }
                
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                
                cur.execute("""
                    INSERT INTO t_p39732784_hourly_rentals_platf.admins 
                    (email, name, password_hash, role, permissions, login, is_active)
                    VALUES (%s, %s, %s, %s, %s, %s, true)
                    RETURNING id, email, name, role, permissions, is_active, created_at, login
                """, (email, name, password_hash, role, json.dumps(permissions), login))
                
                new_employee = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(new_employee), default=str),
                    'isBase64Encoded': False
                }
            
            # PUT - обновить сотрудника
            elif method == 'PUT':
                data = json.loads(event.get('body', '{}'))
                employee_id = data.get('id')
                
                if not employee_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Missing employee id'}),
                        'isBase64Encoded': False
                    }
                
                updates = []
                values = []
                
                if 'name' in data:
                    updates.append('name = %s')
                    values.append(data['name'])
                if 'email' in data:
                    updates.append('email = %s')
                    values.append(data['email'])
                if 'role' in data:
                    updates.append('role = %s')
                    values.append(data['role'])
                if 'permissions' in data:
                    updates.append('permissions = %s')
                    values.append(json.dumps(data['permissions']))
                if 'is_active' in data:
                    updates.append('is_active = %s')
                    values.append(data['is_active'])
                if 'password' in data and data['password']:
                    updates.append('password_hash = %s')
                    values.append(hashlib.sha256(data['password'].encode()).hexdigest())
                
                if not updates:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'No fields to update'}),
                        'isBase64Encoded': False
                    }
                
                values.append(employee_id)
                query = f"""
                    UPDATE t_p39732784_hourly_rentals_platf.admins 
                    SET {', '.join(updates)}
                    WHERE id = %s
                    RETURNING id, email, name, role, permissions, is_active, created_at, last_login, login
                """
                
                cur.execute(query, values)
                updated_employee = cur.fetchone()
                conn.commit()
                
                if not updated_employee:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Employee not found'}),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(updated_employee), default=str),
                    'isBase64Encoded': False
                }
            
            # DELETE - удалить сотрудника
            elif method == 'DELETE':
                query_params = event.get('queryStringParameters', {})
                employee_id = query_params.get('id')
                
                if not employee_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Missing employee id'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    DELETE FROM t_p39732784_hourly_rentals_platf.admins 
                    WHERE id = %s
                    RETURNING id
                """, (employee_id,))
                
                deleted = cur.fetchone()
                conn.commit()
                
                if not deleted:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Employee not found'}),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    finally:
        conn.close()
