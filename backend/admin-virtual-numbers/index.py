import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor


def handler(event: dict, context) -> dict:
    """
    Управление виртуальными номерами (добавление, просмотр, удаление)
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # GET - список всех номеров
        if method == 'GET':
            cur.execute("""
                SELECT 
                    phone,
                    is_busy,
                    assigned_listing_id,
                    assigned_at,
                    assigned_until,
                    created_at
                FROM virtual_numbers
                ORDER BY created_at DESC
            """)
            
            numbers = cur.fetchall()
            
            # Конвертируем datetime в строки
            for num in numbers:
                for key in ['assigned_at', 'assigned_until', 'created_at']:
                    if num.get(key):
                        num[key] = num[key].isoformat()
            
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'numbers': numbers,
                    'total': len(numbers)
                })
            }
        
        # POST - добавить новый номер
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            phone = body.get('phone')
            
            if not phone:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'phone is required'})
                }
            
            # Проверяем, что номер не существует
            cur.execute("SELECT phone FROM virtual_numbers WHERE phone = %s", (phone,))
            existing = cur.fetchone()
            
            if existing:
                conn.close()
                return {
                    'statusCode': 409,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Phone number already exists'})
                }
            
            # Добавляем номер
            cur.execute("""
                INSERT INTO virtual_numbers (phone, is_busy)
                VALUES (%s, FALSE)
            """, (phone,))
            
            conn.commit()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': f'Phone number {phone} added successfully'
                })
            }
        
        # DELETE - удалить номер
        elif method == 'DELETE':
            query_params = event.get('queryStringParameters', {})
            phone = query_params.get('phone') if query_params else None
            
            if not phone:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'phone parameter is required'})
                }
            
            cur.execute("DELETE FROM virtual_numbers WHERE phone = %s", (phone,))
            
            if cur.rowcount == 0:
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Phone number not found'})
                }
            
            conn.commit()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': f'Phone number {phone} deleted successfully'
                })
            }
        
        else:
            conn.close()
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
