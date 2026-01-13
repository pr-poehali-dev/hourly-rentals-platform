import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timezone, timedelta

def get_position_price(position: int, total_positions: int) -> int:
    '''Расчет стоимости позиции: последнее место = 20₽, каждая позиция выше +5₽'''
    base_price = 20
    step = 5
    return base_price + (total_positions - position) * step

def handler(event: dict, context) -> dict:
    '''API для аукционной системы бронирования позиций (обновляется в 00:00 МСК)'''
    
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
            city = event.get('queryStringParameters', {}).get('city', '')
            
            if not city:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'City parameter required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                SELECT COUNT(*) as total
                FROM listings 
                WHERE city = %s AND is_archived = false
            """, (city,))
            total_positions = cur.fetchone()['total']
            
            cur.execute("""
                SELECT 
                    ab.position,
                    ab.listing_id,
                    l.title as listing_title,
                    ab.bid_amount,
                    ab.owner_id,
                    ab.created_at::date as booked_date
                FROM auction_bids ab
                JOIN listings l ON l.id = ab.listing_id
                WHERE ab.city = %s 
                  AND ab.status = 'active'
                  AND ab.created_at::date = CURRENT_DATE
                ORDER BY ab.position ASC
            """, (city,))
            
            booked_positions = {}
            for row in cur.fetchall():
                booked_positions[row['position']] = {
                    'listing_id': row['listing_id'],
                    'listing_title': row['listing_title'],
                    'owner_id': row['owner_id'],
                    'paid_amount': row['bid_amount']
                }
            
            positions = []
            for pos in range(1, total_positions + 1):
                price = get_position_price(pos, total_positions)
                position_data = {
                    'position': pos,
                    'price': price,
                    'is_booked': pos in booked_positions
                }
                
                if pos in booked_positions:
                    position_data['booking_info'] = booked_positions[pos]
                
                positions.append(position_data)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'positions': positions,
                    'total_positions': total_positions,
                    'city': city
                }, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            owner_id = body.get('owner_id')
            
            if not owner_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unauthorized'}),
                    'isBase64Encoded': False
                }
            
            if action == 'place_bid':
                listing_id = body.get('listing_id')
                city = body.get('city')
                target_position = body.get('target_position')
                
                if not listing_id or not city or not target_position:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Missing required fields'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("SELECT owner_id FROM listings WHERE id = %s", (listing_id,))
                listing_owner = cur.fetchone()
                if not listing_owner or listing_owner['owner_id'] != owner_id:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Not your listing'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    SELECT COUNT(*) as total
                    FROM listings 
                    WHERE city = %s AND is_archived = false
                """, (city,))
                total_positions = cur.fetchone()['total']
                
                position_price = get_position_price(target_position, total_positions)
                
                cur.execute("SELECT balance, bonus_balance FROM owners WHERE id = %s", (owner_id,))
                owner = cur.fetchone()
                total_balance = owner['balance'] + owner['bonus_balance']
                
                if total_balance < position_price:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': f'Insufficient balance. Need {position_price} ₽'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    SELECT id, listing_id, owner_id
                    FROM auction_bids 
                    WHERE city = %s 
                      AND position = %s 
                      AND status = 'active'
                      AND created_at::date = CURRENT_DATE
                """, (city, target_position))
                
                existing_bid = cur.fetchone()
                
                if existing_bid:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': f'Position {target_position} already booked'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    SELECT id
                    FROM auction_bids 
                    WHERE listing_id = %s 
                      AND city = %s
                      AND status = 'active'
                      AND created_at::date = CURRENT_DATE
                """, (listing_id, city))
                
                previous_bid = cur.fetchone()
                if previous_bid:
                    cur.execute("""
                        UPDATE auction_bids 
                        SET status = 'cancelled'
                        WHERE id = %s
                    """, (previous_bid['id'],))
                
                bonus_used = min(owner['bonus_balance'], position_price)
                balance_used = position_price - bonus_used
                
                cur.execute("""
                    UPDATE owners 
                    SET balance = balance - %s, bonus_balance = bonus_balance - %s
                    WHERE id = %s
                """, (balance_used, bonus_used, owner_id))
                
                cur.execute("""
                    INSERT INTO auction_bids (listing_id, owner_id, city, position, bid_amount, status)
                    VALUES (%s, %s, %s, %s, %s, 'active')
                    RETURNING id
                """, (listing_id, owner_id, city, target_position, position_price))
                
                bid_id = cur.fetchone()['id']
                
                cur.execute("""
                    INSERT INTO transactions (owner_id, amount, type, description, balance_after, related_bid_id)
                    VALUES (%s, %s, 'bid_payment', %s, 
                            (SELECT balance + bonus_balance FROM owners WHERE id = %s), %s)
                """, (owner_id, -position_price, f'Бронирование позиции #{target_position} в городе {city}', owner_id, bid_id))
                
                cur.execute("""
                    UPDATE listings SET auction = %s WHERE id = %s
                """, (target_position, listing_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': f'Позиция #{target_position} успешно забронирована за {position_price} ₽',
                        'bid_id': bid_id
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
    finally:
        cur.close()
        conn.close()