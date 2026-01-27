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
    
    # Логируем весь входящий запрос от MTS Exolve
    print(f"[ROUTE] Incoming webhook data: {json.dumps(data, ensure_ascii=False)}")
    
    # МТС Exolve отправляет JSON-RPC формат:
    # {"method": "getControlCallFollowMe", "params": {"numberA": "79141965172", "sip_id": "79587579160"}}
    params = data.get('params', {})
    client_phone = params.get('numberA') or data.get('from') or data.get('caller')
    virtual_number = params.get('sip_id') or data.get('to') or data.get('callee')
    
    # Добавляем + к номерам, если его нет
    if client_phone and not client_phone.startswith('+'):
        client_phone = '+' + client_phone
    if virtual_number and not virtual_number.startswith('+'):
        virtual_number = '+' + virtual_number
    
    print(f"[ROUTE] Parsed: client={client_phone}, virtual={virtual_number}")
    
    if not client_phone or not virtual_number:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'numberA and sip_id parameters are required'})
        }
    
    try:
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Ищем активное назначение виртуального номера на объект
        cur.execute("""
            SELECT 
                vn.assigned_listing_id as listing_id,
                vn.assigned_until as expires_at,
                l.short_title,
                l.phone as owner_phone,
                l.id as listing_number,
                (vn.assigned_until > NOW()) as is_valid
            FROM virtual_numbers vn
            JOIN listings l ON vn.assigned_listing_id = l.id
            WHERE vn.phone = %s 
              AND vn.is_busy = TRUE
            LIMIT 1
        """, (virtual_number,))
        
        result = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if result:
            # Проверяем, действителен ли номер (не истёк ли срок 30 минут)
            if result['is_valid']:
                # Номер действителен - записываем звонок в историю
                conn = psycopg2.connect(os.environ['DATABASE_URL'])
                cur = conn.cursor()
                cur.execute("""
                    INSERT INTO call_tracking 
                    (virtual_number, listing_id, client_phone, shown_at, called_at, expires_at)
                    VALUES (%s, %s, %s, NOW(), NOW(), %s)
                    ON CONFLICT DO NOTHING
                """, (virtual_number, result['listing_id'], client_phone, result['expires_at']))
                conn.commit()
                cur.close()
                conn.close()
                
                # Формат ответа для МТС Exolve JSON-RPC
                print(f"[ROUTE] Forwarding {virtual_number} -> {result['owner_phone']} (listing {result['listing_id']})")
                
                # Конвертируем номер в международный формат для МТС Exolve
                owner_phone = result['owner_phone'].replace('+', '').replace(' ', '')
                if owner_phone.startswith('8'):
                    owner_phone = '7' + owner_phone[1:]  # 89104676860 -> 79104676860
                
                print(f"[ROUTE] Converted phone: {result['owner_phone']} -> {owner_phone}")
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'jsonrpc': '2.0',
                        'id': data.get('id', ''),
                        'result': {
                            'redirect_type': 1,
                            'event_extended': False,
                            'masking': False,
                            'file_to_A': '287404',
                            'file_to_B': '287372',
                            'answer': False,
                            'followme_struct': [1, [{
                                'I_FOLLOW_ORDER': 1,
                                'ACTIVE': True,
                                'NAME': f'Listing {result["listing_id"]}',
                                'REDIRECT_NUMBER': owner_phone,
                                'PERIOD': 'always',
                                'PERIOD_DESCRIPTION': 'always',
                                'TIMEOUT': 60
                            }]]
                        }
                    })
                }
            else:
                # Номер истёк - завершаем звонок
                print(f"[ROUTE] Number expired for {virtual_number}")
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'jsonrpc': '2.0',
                        'id': data.get('id', ''),
                        'result': {
                            'action': 'hangup'
                        }
                    })
                }
        else:
            # Номер не найден в истории - завершаем звонок
            print(f"[ROUTE] No history found for {virtual_number} from {client_phone}")
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'jsonrpc': '2.0',
                    'id': data.get('id', ''),
                    'result': {
                        'action': 'hangup'
                    }
                })
            }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }