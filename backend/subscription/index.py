import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta

SUBSCRIPTION_PRICES = {
    'hotel': 2000,  # 2000₽/месяц для отелей
    'apartment': 1000  # 1000₽/месяц для апартаментов
}

CASHBACK_PERCENT = 10  # 10% кэшбэк на бонусный счет
DISCOUNT_90_DAYS = 15  # 15% скидка при оплате на 90 дней

def handler(event: dict, context) -> dict:
    '''API для управления подписками на объекты'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            listing_id = event.get('queryStringParameters', {}).get('listing_id')
            
            if not listing_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'listing_id required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                SELECT 
                    id, title, type, subscription_expires_at, is_archived,
                    image_url, city, district
                FROM listings 
                WHERE id = %s
            """, (listing_id,))
            
            listing = cur.fetchone()
            
            if not listing:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Listing not found'}),
                    'isBase64Encoded': False
                }
            
            days_left = None
            if listing['subscription_expires_at']:
                delta = listing['subscription_expires_at'] - datetime.now()
                days_left = max(0, delta.days)
            
            price_per_month = SUBSCRIPTION_PRICES.get(listing['type'], 2000)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'listing': dict(listing),
                    'days_left': days_left,
                    'price_per_month': price_per_month,
                    'prices': {
                        '30_days': price_per_month,
                        '90_days': int(price_per_month * 3 * (1 - DISCOUNT_90_DAYS / 100))
                    }
                }, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'extend_subscription':
                listing_id = body.get('listing_id')
                owner_id = body.get('owner_id')
                days = body.get('days', 30)
                
                if not listing_id or not owner_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Missing required fields'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    SELECT owner_id, type, subscription_expires_at, is_archived
                    FROM listings 
                    WHERE id = %s
                """, (listing_id,))
                
                listing = cur.fetchone()
                
                if not listing or listing['owner_id'] != owner_id:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Access denied'}),
                        'isBase64Encoded': False
                    }
                
                price_per_month = SUBSCRIPTION_PRICES.get(listing['type'], 2000)
                
                if days == 90:
                    total_cost = int(price_per_month * 3 * (1 - DISCOUNT_90_DAYS / 100))
                else:
                    total_cost = price_per_month
                
                cur.execute("SELECT balance, bonus_balance FROM owners WHERE id = %s", (owner_id,))
                owner = cur.fetchone()
                total_balance = owner['balance'] + owner['bonus_balance']
                
                if total_balance < total_cost:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'error': 'Insufficient balance',
                            'required': total_cost,
                            'available': total_balance
                        }),
                        'isBase64Encoded': False
                    }
                
                bonus_used = min(owner['bonus_balance'], total_cost)
                balance_used = total_cost - bonus_used
                
                cur.execute("""
                    UPDATE owners 
                    SET balance = balance - %s, bonus_balance = bonus_balance - %s
                    WHERE id = %s
                """, (balance_used, bonus_used, owner_id))
                
                if listing['subscription_expires_at'] and listing['subscription_expires_at'] > datetime.now():
                    new_expires_at = listing['subscription_expires_at'] + timedelta(days=days)
                else:
                    new_expires_at = datetime.now() + timedelta(days=days)
                
                cur.execute("""
                    UPDATE listings 
                    SET subscription_expires_at = %s, is_archived = FALSE
                    WHERE id = %s
                """, (new_expires_at, listing_id))
                
                cur.execute("""
                    INSERT INTO transactions (owner_id, amount, type, description, balance_after)
                    VALUES (%s, %s, 'subscription', %s, 
                            (SELECT balance + bonus_balance FROM owners WHERE id = %s))
                """, (owner_id, -total_cost, f'Продление подписки на {days} дней', owner_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': f'Подписка продлена на {days} дней',
                        'expires_at': new_expires_at.isoformat()
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
