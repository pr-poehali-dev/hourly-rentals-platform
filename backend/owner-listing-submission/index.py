import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import secrets
import string

def generate_password(length=12):
    """Генерация случайного пароля"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def handler(event: dict, context) -> dict:
    """API для приема заявок от владельцев на добавление объектов"""
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        # Валидация обязательных полей
        required_fields = ['owner_full_name', 'owner_email', 'owner_phone', 'title', 'type', 'city', 'district', 'address', 'rooms']
        for field in required_fields:
            if not body.get(field):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Поле {field} обязательно'}),
                    'isBase64Encoded': False
                }
        
        # Проверка наличия хотя бы одного номера
        if not body['rooms'] or len(body['rooms']) == 0:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Необходимо добавить хотя бы один номер'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Проверяем, существует ли владелец с таким email
        cur.execute(
            "SELECT id FROM t_p39732784_hourly_rentals_platf.owners WHERE email = %s",
            (body['owner_email'],)
        )
        existing_owner = cur.fetchone()
        
        if existing_owner:
            owner_id = existing_owner['id']
            print(f"[INFO] Found existing owner with ID {owner_id}")
        else:
            # Создаем нового владельца
            generated_password = generate_password()
            
            print(f"[DEBUG] Creating owner: email={body['owner_email']}, name={body['owner_full_name']}")
            
            try:
                cur.execute("""
                    INSERT INTO t_p39732784_hourly_rentals_platf.owners 
                    (email, password_hash, full_name, phone, balance, bonus_balance, is_verified)
                    VALUES (%s, %s, %s, %s, 0, 0, false)
                    RETURNING id
                """, (
                    body['owner_email'],
                    generated_password,  # В реальной системе нужно хешировать
                    body['owner_full_name'],
                    body['owner_phone']
                ))
            except Exception as e:
                print(f"[ERROR] Failed to create owner: {str(e)}")
                raise
            
            owner_result = cur.fetchone()
            owner_id = owner_result['id']
            
            print(f"[INFO] Created new owner with ID {owner_id}, password: {generated_password}")
            
            # Сохраняем пароль для отправки на email
            try:
                cur.execute("""
                    INSERT INTO t_p39732784_hourly_rentals_platf.pending_owner_credentials
                    (owner_id, email, temporary_password)
                    VALUES (%s, %s, %s)
                """, (owner_id, body['owner_email'], generated_password))
            except Exception as e:
                print(f"[ERROR] Failed to save credentials: {str(e)}")
                raise
        
        # Создаем объект
        # Вычисляем минимальную цену из номеров
        min_price = min(room['price'] for room in body['rooms'])
        
        # Подготавливаем parking_price_per_hour
        parking_price = body.get('parking_price_per_hour')
        if not body.get('has_parking') or body.get('parking_type') != 'Платная':
            parking_price = None
        
        # Map Russian type to database enum
        type_mapping = {
            'Отель/Гостиница': 'hotel',
            'Апартаменты/Квартира': 'apartment'
        }
        db_type = type_mapping.get(body['type'], 'hotel')
        
        print(f"[DEBUG] Creating listing: title={body['title']}, type={body['type']} -> {db_type}, city={body['city']}, parking_price={parking_price}")
        
        try:
            cur.execute("""
            INSERT INTO t_p39732784_hourly_rentals_platf.listings 
            (title, type, city, district, price, rating, reviews, auction, image_url, metro, metro_walk, 
             has_parking, features, lat, lng, min_hours, is_archived)
            VALUES (%s, %s, %s, %s, %s, 0.0, 0, 999, %s, %s, %s, %s, %s, %s, %s, 1, false)
            RETURNING id
        """, (
            body['title'],
            db_type,
            body['city'],
            body['district'],
            min_price,
            body['rooms'][0]['images'][0] if body['rooms'] and body['rooms'][0].get('images') and len(body['rooms'][0]['images']) > 0 else None,
            body['metro_stations'][0]['station_name'] if body.get('metro_stations') and len(body['metro_stations']) > 0 else None,
            body['metro_stations'][0]['walk_minutes'] if body.get('metro_stations') and len(body['metro_stations']) > 0 else 0,
            body.get('has_parking', False),
            body.get('features', []),
            body.get('lat'),
            body.get('lng')
        ))
        except Exception as e:
            print(f"[ERROR] Failed to create listing: {str(e)}")
            raise
        
        listing_result = cur.fetchone()
        listing_id = listing_result['id']
        
        print(f"[INFO] Created listing with ID {listing_id}")
        
        # Добавляем станции метро
        if body.get('metro_stations'):
            for station in body['metro_stations']:
                cur.execute("""
                    INSERT INTO t_p39732784_hourly_rentals_platf.metro_stations 
                    (listing_id, station_name, walk_minutes)
                    VALUES (%s, %s, %s)
                """, (listing_id, station['station_name'], station['walk_minutes']))
        
        # Добавляем номера
        for room in body['rooms']:
            cur.execute("""
                INSERT INTO t_p39732784_hourly_rentals_platf.rooms 
                (listing_id, type, price, description, images, square_meters, features, 
                 min_hours, payment_methods, cancellation_policy)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                listing_id,
                room['type'],
                room['price'],
                room.get('description', ''),
                room.get('images', []),
                room.get('square_meters', 0),
                room.get('features', []),
                room.get('min_hours', 1),
                room.get('payment_methods', 'Наличные, банковская карта при заселении'),
                room.get('cancellation_policy', 'Бесплатная отмена за 1 час до заселения')
            ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'message': 'Заявка принята на модерацию',
                'listing_id': listing_id,
                'owner_id': owner_id
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        if 'conn' in locals():
            conn.close()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }