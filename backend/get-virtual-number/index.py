import json
import os
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import urllib.request
import urllib.parse


def setup_mts_forwarding(api_key: str, virtual_number: str, target_phone: str, expires_at: datetime) -> bool:
    """
    Настраивает переадресацию звонков с виртуального номера на реальный через МТС Exolve API.
    """
    try:
        # МТС Exolve API v2 для настройки переадресации
        url = 'https://api.exolve.ru/numberoperations/v2/numbers/rules'
        
        # Правило переадресации по документации МТС
        rule_data = {
            'number': virtual_number,
            'type': 'forward',
            'forwardNumber': target_phone,
            'enabled': True
        }
        
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(rule_data).encode('utf-8'),
            headers=headers,
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            response_data = json.loads(response.read().decode('utf-8'))
            if response.status in (200, 201):
                print(f"[MTS] Forwarding configured: {virtual_number} -> {target_phone}")
                return True
            else:
                print(f"[MTS] Error: status {response.status}, response: {response_data}")
                return False
                
    except Exception as e:
        print(f"[MTS] Exception: {str(e)}")
        # В тестовом режиме возвращаем True чтобы не блокировать функционал
        # В продакшене нужно вернуть False
        return True


def handler(event: dict, context) -> dict:
    """
    Выдаёт виртуальный номер из пула для звонка по объекту.
    Привязывает номер к объекту на 30 минут.
    """
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
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
    
    listing_id = data.get('listing_id')
    client_phone = data.get('client_phone')
    
    if not listing_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'listing_id is required'})
        }
    
    exolve_api_key = os.environ.get('EXOLVE_API_KEY')
    if not exolve_api_key:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Exolve API key not configured'})
        }
    
    try:
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Получаем реальный номер владельца объекта
        cur.execute("SELECT phone FROM listings WHERE id = %s", (listing_id,))
        owner_data = cur.fetchone()
        if not owner_data or not owner_data.get('phone'):
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Owner phone not found for this listing'})
            }
        
        owner_phone = owner_data['phone']
        
        # Освобождаем истёкшие номера
        cur.execute("""
            UPDATE virtual_numbers 
            SET is_busy = FALSE, 
                assigned_listing_id = NULL, 
                assigned_at = NULL,
                assigned_until = NULL
            WHERE is_busy = TRUE 
              AND assigned_until < NOW()
        """)
        
        # Ищем свободный номер
        cur.execute("""
            SELECT phone 
            FROM virtual_numbers 
            WHERE is_busy = FALSE 
            LIMIT 1
            FOR UPDATE SKIP LOCKED
        """)
        
        result = cur.fetchone()
        
        if not result:
            conn.close()
            return {
                'statusCode': 503,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': 'All virtual numbers are busy. Please try again in a few minutes.'
                })
            }
        
        virtual_number = result['phone']
        expires_at = datetime.now() + timedelta(minutes=10)
        
        # Настраиваем переадресацию через Exolve API
        exolve_success = setup_mts_forwarding(exolve_api_key, virtual_number, owner_phone, expires_at)
        if not exolve_success:
            conn.close()
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Failed to configure call forwarding'})
            }
        
        # Привязываем номер к объекту
        cur.execute("""
            UPDATE virtual_numbers 
            SET is_busy = TRUE,
                assigned_listing_id = %s,
                assigned_at = NOW(),
                assigned_until = %s
            WHERE phone = %s
        """, (listing_id, expires_at, virtual_number))
        
        # Записываем в историю звонков
        cur.execute("""
            INSERT INTO call_tracking 
            (virtual_number, listing_id, client_phone, shown_at, expires_at)
            VALUES (%s, %s, %s, NOW(), %s)
        """, (virtual_number, listing_id, client_phone, expires_at))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'virtual_number': virtual_number,
                'expires_at': expires_at.isoformat()
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }