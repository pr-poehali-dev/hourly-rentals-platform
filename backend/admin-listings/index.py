import json
import os
import jwt
import psycopg2
from psycopg2.extras import RealDictCursor

# Admin listings management
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
    '''API для управления объектами (CRUD операции)'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    # Проверка авторизации
    auth_header = event.get('headers', {}).get('X-Authorization', '')
    token = auth_header.replace('Bearer ', '') if auth_header else ''
    admin = verify_token(token)
    
    if not admin:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуется авторизация'}),
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # GET - получение списка объектов
        if method == 'GET':
            show_archived = event.get('queryStringParameters', {}).get('archived') == 'true'
            
            if show_archived:
                cur.execute("SELECT * FROM listings ORDER BY created_at DESC")
            else:
                cur.execute("SELECT * FROM listings WHERE is_archived = false ORDER BY auction ASC")
            
            listings = cur.fetchall()
            
            # Получаем комнаты для каждого объекта
            for listing in listings:
                cur.execute("SELECT * FROM rooms WHERE listing_id = %s", (listing['id'],))
                listing['rooms'] = cur.fetchall()
                
                cur.execute("SELECT * FROM listing_photos WHERE listing_id = %s", (listing['id'],))
                listing['photos'] = cur.fetchall()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(listings, default=str),
                'isBase64Encoded': False
            }
        
        # POST - создание нового объекта
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            cur.execute("""
                INSERT INTO listings (title, type, city, district, price, rating, reviews, 
                                     auction, image_url, metro, metro_walk, has_parking, 
                                     features, lat, lng, min_hours, phone, telegram, logo_url)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                body['title'], body['type'], body['city'], body['district'], 
                body['price'], body.get('rating', 0), body.get('reviews', 0),
                body.get('auction', 999), body.get('image_url'), body.get('metro'),
                body.get('metro_walk', 0), body.get('has_parking', False),
                body.get('features', []), body.get('lat'), body.get('lng'),
                body.get('min_hours', 1), body.get('phone'), body.get('telegram'),
                body.get('logo_url')
            ))
            
            new_listing = cur.fetchone()
            listing_id = new_listing['id']
            
            # Добавление комнат
            if 'rooms' in body:
                for room in body['rooms']:
                    cur.execute("""
                        INSERT INTO rooms (listing_id, type, price, description, image_url)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (listing_id, room['type'], room['price'], 
                          room.get('description'), room.get('image_url')))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(new_listing, default=str),
                'isBase64Encoded': False
            }
        
        # PUT - обновление объекта
        elif method == 'PUT':
            listing_id = event.get('queryStringParameters', {}).get('id')
            if not listing_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID объекта обязателен'}),
                    'isBase64Encoded': False
                }
            
            body = json.loads(event.get('body', '{}'))
            
            cur.execute("""
                UPDATE listings SET 
                    title=%s, type=%s, city=%s, district=%s, price=%s, rating=%s, 
                    reviews=%s, auction=%s, image_url=%s, metro=%s, metro_walk=%s, 
                    has_parking=%s, features=%s, lat=%s, lng=%s, min_hours=%s, 
                    phone=%s, telegram=%s, logo_url=%s, is_archived=%s, updated_at=CURRENT_TIMESTAMP
                WHERE id=%s
                RETURNING *
            """, (
                body['title'], body['type'], body['city'], body['district'],
                body['price'], body.get('rating', 0), body.get('reviews', 0),
                body.get('auction', 999), body.get('image_url'), body.get('metro'),
                body.get('metro_walk', 0), body.get('has_parking', False),
                body.get('features', []), body.get('lat'), body.get('lng'),
                body.get('min_hours', 1), body.get('phone'), body.get('telegram'),
                body.get('logo_url'), body.get('is_archived', False),
                listing_id
            ))
            
            updated_listing = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(updated_listing, default=str),
                'isBase64Encoded': False
            }
        
        # DELETE - архивация объекта
        elif method == 'DELETE':
            listing_id = event.get('queryStringParameters', {}).get('id')
            if not listing_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID объекта обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "UPDATE listings SET is_archived = true WHERE id = %s RETURNING *",
                (listing_id,)
            )
            
            archived_listing = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(archived_listing, default=str),
                'isBase64Encoded': False
            }
        
    except Exception as e:
        if conn:
            conn.close()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }