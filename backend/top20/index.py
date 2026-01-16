import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta

def verify_owner_token(token: str):
    '''Проверка токена владельца'''
    if not token:
        return None
    
    try:
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        conn.autocommit = True
        cur = conn.cursor()
        
        cur.execute(
            "SELECT id, email, full_name, phone, balance, bonus_balance FROM owners WHERE token = %s",
            (token,)
        )
        row = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if row:
            return {
                'id': row[0], 
                'email': row[1], 
                'full_name': row[2], 
                'phone': row[3],
                'balance': float(row[4]),
                'bonus_balance': float(row[5])
            }
        return None
    except Exception as e:
        print(f'[ERROR] verify_owner_token failed: {type(e).__name__}: {str(e)}')
        return None

def get_position_price(position: int) -> int:
    '''Расчет цены позиции в ТОП-20'''
    if position < 1 or position > 20:
        return 0
    
    prices = {
        1: 3000, 2: 2900, 3: 2800, 4: 2700, 5: 2600,
        6: 2500, 7: 2400, 8: 2300, 9: 2200, 10: 2100,
        11: 2050, 12: 2000, 13: 1950, 14: 1900, 15: 1850,
        16: 1800, 17: 1750, 18: 1700, 19: 1650, 20: 1600
    }
    return prices.get(position, 0)

def handler(event: dict, context) -> dict:
    '''API для управления ТОП-20 позициями'''
    
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
    
    try:
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            city = event.get('queryStringParameters', {}).get('city')
            
            if not city:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'city parameter required'}),
                    'isBase64Encoded': False
                }
            
            now = datetime.utcnow()
            
            cur.execute(
                """
                SELECT 
                    tb.id, tb.position, tb.listing_id, tb.paid_amount, 
                    tb.booked_at, tb.expires_at,
                    l.title as listing_title, l.image_url, l.district, l.type,
                    l.price, l.square_meters, l.features, l.metro, l.metro_walk,
                    l.has_parking, l.logo_url, o.full_name as owner_name
                FROM t_p39732784_hourly_rentals_platf.top20_bookings tb
                JOIN t_p39732784_hourly_rentals_platf.listings l ON tb.listing_id = l.id
                JOIN t_p39732784_hourly_rentals_platf.owners o ON tb.owner_id = o.id
                WHERE tb.city = %s AND tb.is_active = TRUE AND tb.expires_at > %s
                ORDER BY tb.position ASC
                """,
                (city, now)
            )
            bookings = cur.fetchall()
            
            positions = []
            for pos_num in range(1, 21):
                booking = next((b for b in bookings if b['position'] == pos_num), None)
                positions.append({
                    'position': pos_num,
                    'price': get_position_price(pos_num),
                    'is_booked': booking is not None,
                    'booking_info': dict(booking) if booking else None
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'positions': positions, 'city': city}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            token = event.get('headers', {}).get('X-Authorization', '').replace('Bearer ', '')
            owner = verify_owner_token(token)
            
            if not owner:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация владельца'}),
                    'isBase64Encoded': False
                }
            
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'book_position':
                city = body.get('city')
                position = body.get('position')
                listing_id = body.get('listing_id')
                
                if not all([city, position, listing_id]):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'city, position, listing_id required'}),
                        'isBase64Encoded': False
                    }
                
                if position < 1 or position > 20:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'position must be between 1 and 20'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "SELECT * FROM t_p39732784_hourly_rentals_platf.listings WHERE id = %s AND owner_id = %s",
                    (listing_id, owner['id'])
                )
                listing = cur.fetchone()
                
                if not listing:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Listing not found or not owned by you'}),
                        'isBase64Encoded': False
                    }
                
                if listing['subscription_expires_at']:
                    sub_expires = listing['subscription_expires_at']
                    days_left = (sub_expires - datetime.utcnow()).days
                    if days_left < 30:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': f'Подписка должна быть активна минимум 30 дней. У вас осталось {days_left} дней'}),
                            'isBase64Encoded': False
                        }
                else:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Подписка не активна. Продлите подписку минимум на 30 дней'}),
                        'isBase64Encoded': False
                    }
                
                now = datetime.utcnow()
                cur.execute(
                    """
                    SELECT * FROM t_p39732784_hourly_rentals_platf.top20_bookings 
                    WHERE city = %s AND position = %s AND is_active = TRUE AND expires_at > %s
                    """,
                    (city, position, now)
                )
                existing = cur.fetchone()
                
                if existing:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Эта позиция уже забронирована'}),
                        'isBase64Encoded': False
                    }
                
                price = get_position_price(position)
                total_balance = owner['balance'] + owner['bonus_balance']
                
                if total_balance < price:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': f'Недостаточно средств. Нужно {price} ₽, у вас {total_balance} ₽'}),
                        'isBase64Encoded': False
                    }
                
                bonus_used = min(owner['bonus_balance'], price)
                real_balance_used = price - bonus_used
                
                cur.execute(
                    "UPDATE t_p39732784_hourly_rentals_platf.owners SET balance = balance - %s, bonus_balance = bonus_balance - %s WHERE id = %s",
                    (real_balance_used, bonus_used, owner['id'])
                )
                
                cur.execute(
                    "SELECT balance, bonus_balance FROM t_p39732784_hourly_rentals_platf.owners WHERE id = %s",
                    (owner['id'],)
                )
                new_balances = cur.fetchone()
                new_total = float(new_balances['balance']) + float(new_balances['bonus_balance'])
                
                expires_at = now + timedelta(days=30)
                
                cur.execute(
                    """
                    INSERT INTO t_p39732784_hourly_rentals_platf.top20_bookings 
                    (city, position, listing_id, owner_id, paid_amount, expires_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (city, position, listing_id, owner['id'], price, expires_at)
                )
                booking_id = cur.fetchone()['id']
                
                cur.execute(
                    """
                    INSERT INTO t_p39732784_hourly_rentals_platf.transactions 
                    (owner_id, amount, type, description, balance_after)
                    VALUES (%s, %s, 'top20', %s, %s)
                    """,
                    (owner['id'], -price, f'ТОП-20 позиция #{position} в {city}', new_total)
                )
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': f'Позиция #{position} успешно забронирована на 30 дней',
                        'booking_id': booking_id,
                        'new_balance': float(new_balances['balance']),
                        'new_bonus_balance': float(new_balances['bonus_balance'])
                    }),
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
