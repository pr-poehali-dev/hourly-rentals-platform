import json
import os
import psycopg2
from datetime import datetime, timedelta

def handler(event: dict, context) -> dict:
    '''API для аукционной системы поднятия объявлений'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': ''
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            city = event.get('queryStringParameters', {}).get('city', '')
            
            if not city:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'City parameter required'})
                }
            
            cur.execute("""
                SELECT 
                    l.id, l.title, l.auction as current_position,
                    ab.bid_amount, ab.position as target_position,
                    o.full_name as owner_name
                FROM listings l
                LEFT JOIN auction_bids ab ON l.id = ab.listing_id AND ab.city = %s AND ab.status = 'active'
                LEFT JOIN owners o ON ab.owner_id = o.id
                WHERE l.city = %s AND l.is_archived = false
                ORDER BY l.auction ASC
            """, (city, city))
            
            listings = []
            for row in cur.fetchall():
                listings.append({
                    'id': row[0],
                    'title': row[1],
                    'current_position': row[2],
                    'bid_amount': row[3],
                    'target_position': row[4],
                    'owner_name': row[5]
                })
            
            min_bid = 20
            if listings and listings[0]['bid_amount']:
                min_bid = listings[0]['bid_amount'] + 5
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'listings': listings,
                    'min_bid_for_top': min_bid
                })
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            token = event.get('headers', {}).get('X-Authorization', '').replace('Bearer ', '')
            owner_id = body.get('owner_id')
            
            if not owner_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unauthorized'})
                }
            
            if action == 'place_bid':
                listing_id = body.get('listing_id')
                city = body.get('city')
                bid_amount = body.get('bid_amount')
                target_position = body.get('target_position', 1)
                
                if not listing_id or not city or not bid_amount:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Missing required fields'})
                    }
                
                cur.execute("SELECT owner_id FROM listings WHERE id = %s", (listing_id,))
                listing_owner = cur.fetchone()
                if not listing_owner or listing_owner[0] != owner_id:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Not your listing'})
                    }
                
                cur.execute("SELECT balance, bonus_balance FROM owners WHERE id = %s", (owner_id,))
                owner = cur.fetchone()
                total_balance = owner[0] + owner[1]
                
                if total_balance < bid_amount:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Insufficient balance'})
                    }
                
                cur.execute("""
                    SELECT id, owner_id, listing_id, bid_amount 
                    FROM auction_bids 
                    WHERE city = %s AND position = %s AND status = 'active'
                    ORDER BY bid_amount DESC LIMIT 1
                """, (city, target_position))
                
                current_top_bid = cur.fetchone()
                
                if current_top_bid and current_top_bid[3] >= bid_amount:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'error': f'Bid too low. Minimum: {current_top_bid[3] + 5} руб'
                        })
                    }
                
                if current_top_bid:
                    cur.execute("""
                        UPDATE auction_bids SET status = 'outbid' WHERE id = %s
                    """, (current_top_bid[0],))
                    
                    cur.execute("""
                        INSERT INTO notifications (owner_id, type, title, message, related_listing_id)
                        VALUES (%s, 'bid_outbid', 'Ваша ставка перебита', 
                                'Кто-то предложил более высокую ставку за позицию в городе %s', %s)
                    """, (current_top_bid[1], city, current_top_bid[2]))
                    
                    cur.execute("""
                        UPDATE listings SET auction = auction + 1 WHERE id = %s
                    """, (current_top_bid[2],))
                
                expires_at = datetime.now() + timedelta(days=30)
                
                cur.execute("""
                    INSERT INTO auction_bids (listing_id, owner_id, city, position, bid_amount, expires_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (listing_id, city) DO UPDATE 
                    SET bid_amount = EXCLUDED.bid_amount, 
                        position = EXCLUDED.position,
                        status = 'active',
                        expires_at = EXCLUDED.expires_at
                    RETURNING id
                """, (listing_id, owner_id, city, target_position, bid_amount, expires_at))
                
                bid_id = cur.fetchone()[0]
                
                bonus_used = min(owner[1], bid_amount)
                balance_used = bid_amount - bonus_used
                
                cur.execute("""
                    UPDATE owners 
                    SET balance = balance - %s, bonus_balance = bonus_balance - %s
                    WHERE id = %s
                """, (balance_used, bonus_used, owner_id))
                
                cur.execute("""
                    INSERT INTO transactions (owner_id, amount, type, description, balance_after, related_bid_id)
                    VALUES (%s, %s, 'bid_payment', 'Оплата позиции #%s в городе %s', 
                            (SELECT balance + bonus_balance FROM owners WHERE id = %s), %s)
                """, (owner_id, -bid_amount, target_position, city, owner_id, bid_id))
                
                cur.execute("""
                    UPDATE listings SET auction = %s WHERE id = %s
                """, (target_position, listing_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': f'Позиция #{target_position} успешно куплена',
                        'bid_id': bid_id
                    })
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unknown action'})
                }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    finally:
        cur.close()
        conn.close()
