import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor


def handler(event: dict, context) -> dict:
    """
    Webhook для маршрутизации входящих звонков с МТС Exolve.
    Определяет объект по истории звонков и переадресует на владельца.
    """
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    # GET - статистика звонков для админки
    if method == 'GET':
        query_params = event.get('queryStringParameters', {})
        action = query_params.get('action') if query_params else None
        
        if action == 'stats':
            try:
                conn = psycopg2.connect(os.environ['DATABASE_URL'])
                cur = conn.cursor(cursor_factory=RealDictCursor)
                
                # Общая статистика
                cur.execute("""
                    SELECT 
                        COUNT(*) as total_shown,
                        COUNT(called_at) as total_called,
                        COUNT(CASE WHEN expires_at > NOW() AND called_at IS NULL THEN 1 END) as active_sessions
                    FROM call_tracking
                    WHERE shown_at >= NOW() - INTERVAL '30 days'
                """)
                stats = cur.fetchone()
                
                # Последние 50 звонков
                cur.execute("""
                    SELECT 
                        ct.id,
                        ct.virtual_number,
                        ct.client_phone,
                        ct.listing_id,
                        ct.shown_at,
                        ct.called_at,
                        ct.expires_at,
                        l.short_title as listing_title
                    FROM call_tracking ct
                    LEFT JOIN listings l ON ct.listing_id = l.id
                    ORDER BY ct.shown_at DESC
                    LIMIT 50
                """)
                calls = cur.fetchall()
                
                # Конвертируем datetime в строки
                for call in calls:
                    for key in ['shown_at', 'called_at', 'expires_at']:
                        if call.get(key):
                            call[key] = call[key].isoformat()
                
                conversion_rate = 0
                if stats['total_shown'] > 0:
                    conversion_rate = (stats['total_called'] / stats['total_shown']) * 100
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'total_shown': stats['total_shown'],
                        'total_called': stats['total_called'],
                        'conversion_rate': conversion_rate,
                        'active_sessions': stats['active_sessions'],
                        'calls': calls
                    })
                }
            except Exception as e:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': str(e)})
                }
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid action parameter'})
            }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body = event.get('body', '{}')
    if not body or body == '':
        body = '{}'
    
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid JSON'})
        }
    
    client_phone = data.get('from')
    virtual_number = data.get('to')
    
    if not client_phone or not virtual_number:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'from and to parameters are required'})
        }
    
    try:
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Ищем в истории последний показ этого номера этому клиенту
        cur.execute("""
            SELECT 
                ct.listing_id,
                l.short_title,
                l.phone as owner_phone,
                l.id as listing_number
            FROM call_tracking ct
            JOIN listings l ON ct.listing_id = l.id
            WHERE ct.client_phone = %s 
              AND ct.virtual_number = %s
            ORDER BY ct.shown_at DESC
            LIMIT 1
        """, (client_phone, virtual_number))
        
        result = cur.fetchone()
        
        # Обновляем время звонка
        if result:
            cur.execute("""
                UPDATE call_tracking 
                SET called_at = NOW()
                WHERE listing_id = %s 
                  AND client_phone = %s
                  AND virtual_number = %s
                  AND called_at IS NULL
            """, (result['listing_id'], client_phone, virtual_number))
            conn.commit()
        
        cur.close()
        conn.close()
        
        if result:
            # Формат ответа для МТС Exolve webhook
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'destination': result['owner_phone'],
                    'listing_id': result['listing_id'],
                    'listing_title': result['short_title']
                })
            }
        else:
            # Номер не найден в истории - МТС не переадресует
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': 'No call history found'
                })
            }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }