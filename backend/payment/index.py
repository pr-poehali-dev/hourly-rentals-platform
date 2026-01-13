import json
import os
import psycopg2
import uuid
import base64
import urllib.request
import urllib.error

def handler(event: dict, context) -> dict:
    '''API для пополнения баланса через ЮKassa'''
    
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
    
    shop_id = os.environ.get('YOOKASSA_SHOP_ID')
    secret_key = os.environ.get('YOOKASSA_SECRET_KEY')
    
    if not shop_id or not secret_key:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Payment gateway not configured'})
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        if action == 'create_payment':
            owner_id = body.get('owner_id')
            amount = body.get('amount')
            
            if not owner_id or not amount or amount < 1:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid amount'})
                }
            
            cur.execute("SELECT email, full_name FROM owners WHERE id = %s", (owner_id,))
            owner = cur.fetchone()
            
            if not owner:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Owner not found'})
                }
            
            idempotence_key = str(uuid.uuid4())
            
            payment_data = {
                'amount': {
                    'value': f'{amount}.00',
                    'currency': 'RUB'
                },
                'confirmation': {
                    'type': 'redirect',
                    'return_url': 'https://preview--hourly-rentals-platform.poehali.dev/owner/dashboard'
                },
                'capture': True,
                'description': f'Пополнение баланса для {owner[1]}',
                'metadata': {
                    'owner_id': str(owner_id),
                    'type': 'balance_topup'
                }
            }
            
            auth_string = f'{shop_id}:{secret_key}'
            auth_header = 'Basic ' + base64.b64encode(auth_string.encode()).decode()
            
            req = urllib.request.Request(
                'https://api.yookassa.ru/v3/payments',
                data=json.dumps(payment_data).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'Idempotence-Key': idempotence_key,
                    'Authorization': auth_header
                }
            )
            
            try:
                with urllib.request.urlopen(req) as response:
                    result = json.loads(response.read().decode('utf-8'))
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'payment_id': result['id'],
                            'confirmation_url': result['confirmation']['confirmation_url'],
                            'status': result['status']
                        })
                    }
            except urllib.error.HTTPError as e:
                error_body = e.read().decode('utf-8')
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Payment creation failed', 'details': error_body})
                }
        
        elif action == 'webhook':
            payment_data = body.get('object', {})
            payment_id = payment_data.get('id')
            status = payment_data.get('status')
            metadata = payment_data.get('metadata', {})
            owner_id = metadata.get('owner_id')
            
            if status == 'succeeded' and owner_id:
                amount_value = payment_data.get('amount', {}).get('value', '0')
                amount = int(float(amount_value))
                
                cashback = int(amount * 0.10)
                
                cur.execute("""
                    UPDATE owners 
                    SET balance = balance + %s, bonus_balance = bonus_balance + %s 
                    WHERE id = %s
                """, (amount, cashback, owner_id))
                
                cur.execute("""
                    INSERT INTO transactions (owner_id, amount, type, description, balance_after)
                    VALUES (%s, %s, 'deposit', 'Пополнение баланса через ЮKassa', 
                            (SELECT balance + bonus_balance FROM owners WHERE id = %s))
                """, (owner_id, amount, owner_id))
                
                if cashback > 0:
                    cur.execute("""
                        INSERT INTO transactions (owner_id, amount, type, description, balance_after)
                        VALUES (%s, %s, 'bonus', 'Кэшбэк 10% от пополнения', 
                                (SELECT balance + bonus_balance FROM owners WHERE id = %s))
                    """, (owner_id, cashback, owner_id))
                
                conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'status': 'ok'})
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