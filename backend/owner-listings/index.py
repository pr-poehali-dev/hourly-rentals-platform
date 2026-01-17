import json
import os
import jwt
import psycopg2
from psycopg2.extras import RealDictCursor

def verify_token(token: str) -> dict:
    '''Проверка JWT токена администратора'''
    if not token:
        return None
    try:
        jwt_secret = os.environ['JWT_SECRET']
        payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        return payload
    except:
        return None

def handler(event: dict, context) -> dict:
    '''API для управления привязкой отелей к владельцам'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    auth_header = event.get('headers', {}).get('X-Authorization', '')
    token = auth_header.replace('Bearer ', '') if auth_header else ''
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            owner_id = event.get('queryStringParameters', {}).get('owner_id')
            print(f'GET request for owner_id: {owner_id}')
            
            if owner_id:
                # Получить отели конкретного владельца (доступно всем с токеном)
                cur.execute("""
                    SELECT id, title, city, district, owner_id, is_archived, auction,
                           type, image_url, subscription_expires_at, moderation_status,
                           moderation_comment, price, square_meters, logo_url, features, 
                           metro, metro_walk, has_parking, min_hours, lat, lng,
                           expert_photo_rating, expert_photo_feedback,
                           expert_fullness_rating, expert_fullness_feedback
                    FROM listings
                    WHERE owner_id = %s AND is_archived = FALSE
                    ORDER BY title
                """, (owner_id,))
                listings = cur.fetchall()
                print(f'Found {len(listings)} listings for owner {owner_id}')
                
                # Загружаем комнаты с экспертными оценками
                if listings:
                    listing_ids = [l['id'] for l in listings]
                    placeholders = ','.join(['%s'] * len(listing_ids))
                    cur.execute(
                        f"""SELECT id, listing_id, type, price, description, images,
                                   expert_photo_rating, expert_photo_feedback,
                                   expert_fullness_rating, expert_fullness_feedback
                            FROM rooms 
                            WHERE listing_id IN ({placeholders})
                            ORDER BY listing_id, type""",
                        listing_ids
                    )
                    all_rooms = cur.fetchall()
                    print(f'[DEBUG] Found {len(all_rooms)} rooms')
                    if all_rooms:
                        print(f'[DEBUG] First room sample: {all_rooms[0]}')
                    
                    # Группируем комнаты по listing_id
                    rooms_by_listing = {}
                    for room in all_rooms:
                        lid = room.pop('listing_id')
                        if lid not in rooms_by_listing:
                            rooms_by_listing[lid] = []
                        rooms_by_listing[lid].append(room)
                    
                    # Добавляем комнаты к каждому листингу
                    for listing in listings:
                        listing['rooms'] = rooms_by_listing.get(listing['id'], [])
                        print(f'[DEBUG] Listing {listing["id"]} has {len(listing["rooms"])} rooms')
            else:
                # Получить все отели для привязки (только для админа)
                admin = verify_token(token)
                if not admin:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Требуется авторизация администратора'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    SELECT 
                        l.id, l.title, l.city, l.district, l.owner_id, l.is_archived,
                        o.full_name as owner_name
                    FROM listings l
                    LEFT JOIN owners o ON o.id = l.owner_id
                    WHERE l.is_archived = FALSE
                    ORDER BY l.title
                """)
                listings = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(row) for row in listings], default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PATCH':
            # PATCH требует авторизации админа
            admin = verify_token(token)
            if not admin:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация администратора'}),
                    'isBase64Encoded': False
                }
            body = json.loads(event.get('body', '{}'))
            listing_id = body.get('listing_id')
            owner_id = body.get('owner_id')
            
            if not listing_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID отеля не указан'}),
                    'isBase64Encoded': False
                }
            
            # Получаем старого владельца перед обновлением
            cur.execute("SELECT owner_id FROM listings WHERE id = %s", (listing_id,))
            old_owner = cur.fetchone()
            old_owner_id = old_owner['owner_id'] if old_owner else None
            
            # Если owner_id = None, значит отвязываем отель
            cur.execute("""
                UPDATE listings 
                SET owner_id = %s
                WHERE id = %s
                RETURNING id, title, owner_id
            """, (owner_id, listing_id))
            
            result = cur.fetchone()
            
            # Если привязываем к новому владельцу (не отвязываем), начисляем бонус 5000₽
            if owner_id is not None and old_owner_id != owner_id:
                cur.execute("""
                    UPDATE owners 
                    SET bonus_balance = bonus_balance + 5000
                    WHERE id = %s
                """, (owner_id,))
                
                cur.execute("""
                    INSERT INTO transactions (owner_id, amount, type, description, balance_after)
                    VALUES (%s, %s, 'bonus', %s, 
                            (SELECT balance + bonus_balance FROM owners WHERE id = %s))
                """, (owner_id, 5000, f'Приветственный бонус за добавление объекта "{result["title"]}"', owner_id))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(result), default=str),
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