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
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
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
            params = event.get('queryStringParameters', {}) or {}
            show_archived = params.get('archived') == 'true'
            moderation_filter = params.get('moderation')
            
            if moderation_filter == 'pending':
                # Только объекты на модерации
                print(f"[DEBUG] Fetching pending moderation listings")
                cur.execute("""
                    SELECT l.*, 
                           a.name as created_by_employee_name,
                           o.full_name as owner_name
                    FROM t_p39732784_hourly_rentals_platf.listings l
                    LEFT JOIN t_p39732784_hourly_rentals_platf.admins a ON l.created_by_employee_id = a.id
                    LEFT JOIN t_p39732784_hourly_rentals_platf.owners o ON l.owner_id = o.id
                    WHERE l.moderation_status = %s
                    ORDER BY l.updated_at DESC
                """, (moderation_filter,))
            elif show_archived:
                cur.execute("SELECT * FROM t_p39732784_hourly_rentals_platf.listings ORDER BY created_at DESC")
            else:
                cur.execute("SELECT * FROM t_p39732784_hourly_rentals_platf.listings WHERE is_archived = false ORDER BY auction ASC")
            
            listings = cur.fetchall()
            print(f"[DEBUG] Total listings fetched: {len(listings)}, moderation_filter={moderation_filter}")
            
            if not listings:
                cur.close()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([]),
                    'isBase64Encoded': False
                }
            
            # Получаем все комнаты одним запросом (БЕЗ images для оптимизации)
            listing_ids = [l['id'] for l in listings]
            placeholders = ','.join(['%s'] * len(listing_ids))
            cur.execute(
                f"""SELECT id, listing_id, type, price, description, square_meters, features, 
                           min_hours, payment_methods, cancellation_policy, images,
                           expert_photo_rating, expert_photo_feedback,
                           expert_fullness_rating, expert_fullness_feedback
                    FROM t_p39732784_hourly_rentals_platf.rooms 
                    WHERE listing_id IN ({placeholders})""",
                listing_ids
            )
            all_rooms = cur.fetchall()
            
            # Получаем все станции метро одним запросом
            cur.execute(
                f"""SELECT listing_id, station_name, walk_minutes 
                    FROM t_p39732784_hourly_rentals_platf.metro_stations 
                    WHERE listing_id IN ({placeholders})""",
                listing_ids
            )
            all_metro = cur.fetchall()
            
            # Группируем по listing_id
            rooms_by_listing = {}
            for room in all_rooms:
                lid = room.pop('listing_id')
                if lid not in rooms_by_listing:
                    rooms_by_listing[lid] = []
                rooms_by_listing[lid].append(room)
            
            metro_by_listing = {}
            for metro in all_metro:
                lid = metro.pop('listing_id')
                if lid not in metro_by_listing:
                    metro_by_listing[lid] = []
                metro_by_listing[lid].append(metro)
            
            # Присваиваем данные каждому объекту
            for listing in listings:
                listing['rooms'] = rooms_by_listing.get(listing['id'], [])
                listing['metro_stations'] = metro_by_listing.get(listing['id'], [])
            
            print(f"[DEBUG] About to serialize {len(listings)} listings")
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
                INSERT INTO t_p39732784_hourly_rentals_platf.listings (title, type, city, district, price, rating, reviews, 
                                     auction, image_url, metro, metro_walk, has_parking, 
                                     parking_type, parking_price_per_hour,
                                     features, lat, lng, min_hours, phone, telegram, logo_url,
                                     price_warning_holidays, price_warning_daytime)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                body['title'].strip() if isinstance(body.get('title'), str) else body['title'], 
                body['type'], 
                body['city'].strip() if isinstance(body.get('city'), str) else body['city'], 
                body['district'].strip() if isinstance(body.get('district'), str) else body['district'], 
                body['price'], body.get('rating', 0), body.get('reviews', 0),
                body.get('auction', 999), body.get('image_url'), body.get('metro'),
                body.get('metro_walk', 0), body.get('has_parking', False),
                body.get('parking_type', 'none'), body.get('parking_price_per_hour', 0),
                body.get('features', []), body.get('lat'), body.get('lng'),
                body.get('min_hours', 1), body.get('phone'), body.get('telegram'),
                body.get('logo_url'), body.get('price_warning_holidays', False),
                body.get('price_warning_daytime', False)
            ))
            
            new_listing = cur.fetchone()
            listing_id = new_listing['id']
            
            # Добавление станций метро
            if 'metro_stations' in body and body['metro_stations']:
                for station in body['metro_stations']:
                    cur.execute(
                        "INSERT INTO t_p39732784_hourly_rentals_platf.metro_stations (listing_id, station_name, walk_minutes) VALUES (%s, %s, %s)",
                        (listing_id, station['station_name'], station['walk_minutes'])
                    )
            
            # Удаление старых комнат и добавление новых
            if 'rooms' in body:
                cur.execute("DELETE FROM t_p39732784_hourly_rentals_platf.rooms WHERE listing_id = %s", (listing_id,))
                for room in body['rooms']:
                    cur.execute("""
                        INSERT INTO t_p39732784_hourly_rentals_platf.rooms (listing_id, type, price, description, images, 
                                         square_meters, features, min_hours, payment_methods, cancellation_policy)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (listing_id, room['type'], room['price'], 
                          room.get('description'), room.get('images', []),
                          room.get('square_meters', 0), room.get('features', []),
                          room.get('min_hours', 1), room.get('payment_methods', 'Наличные, банковская карта при заселении'),
                          room.get('cancellation_policy', 'Бесплатная отмена за 1 час до заселения')))
            
            # Логирование действия
            cur.execute("""
                INSERT INTO t_p39732784_hourly_rentals_platf.admin_action_logs 
                (admin_id, action_type, entity_type, entity_id, entity_name, description, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                admin.get('admin_id'),
                'create',
                'listing',
                listing_id,
                body['title'],
                f'Добавлен новый объект "{body["title"]}" в городе {body["city"]}',
                json.dumps({
                    'type': body['type'],
                    'city': body['city'],
                    'district': body['district'],
                    'price': body['price']
                })
            ))
            
            # Начисление бонуса сотруднику за добавление объекта
            listing_type = body.get('type', '').lower()
            bonus_amount = 0
            
            if 'отель' in listing_type or 'гостиница' in listing_type or 'hotel' in listing_type:
                bonus_amount = 200
            elif 'апартамент' in listing_type or 'apartment' in listing_type or 'квартира' in listing_type:
                bonus_amount = 100
            
            if bonus_amount > 0:
                cur.execute("""
                    INSERT INTO t_p39732784_hourly_rentals_platf.employee_bonuses
                    (admin_id, entity_type, entity_id, entity_name, bonus_amount, notes)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    admin.get('admin_id'),
                    'listing',
                    listing_id,
                    body['title'],
                    bonus_amount,
                    f'Добавление: {body["type"]} в городе {body["city"]}'
                ))
            
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
            
            print(f'=== UPDATE LISTING ID {listing_id} ===')
            print(f'Body keys: {body.keys()}')
            print(f'Has rooms: {"rooms" in body}')
            if 'rooms' in body:
                print(f'Rooms count: {len(body["rooms"])}')
                print(f'Rooms data: {body["rooms"]}')
            
            # Если это обновление экспертных оценок (есть хотя бы одно поле expert_*)
            if any(key.startswith('expert_') for key in body.keys()) and 'title' not in body:
                # Обновление экспертных оценок объекта
                cur.execute("""
                    UPDATE t_p39732784_hourly_rentals_platf.listings SET 
                        expert_photo_rating=%s,
                        expert_photo_feedback=%s,
                        expert_fullness_rating=%s,
                        expert_fullness_feedback=%s,
                        expert_rated_by=%s,
                        expert_rated_at=CURRENT_TIMESTAMP,
                        updated_at=CURRENT_TIMESTAMP
                    WHERE id=%s
                    RETURNING *
                """, (
                    body.get('expert_photo_rating'),
                    body.get('expert_photo_feedback'),
                    body.get('expert_fullness_rating'),
                    body.get('expert_fullness_feedback'),
                    admin.get('admin_id'),
                    listing_id
                ))
                
                updated_listing = cur.fetchone()
                
                # Обновление экспертных оценок номеров
                if 'rooms' in body and body['rooms']:
                    for room_data in body['rooms']:
                        if room_data.get('id'):
                            cur.execute("""
                                UPDATE t_p39732784_hourly_rentals_platf.rooms SET
                                    expert_photo_rating=%s,
                                    expert_photo_feedback=%s,
                                    expert_fullness_rating=%s,
                                    expert_fullness_feedback=%s,
                                    expert_rated_by=%s,
                                    expert_rated_at=CURRENT_TIMESTAMP
                                WHERE id=%s
                            """, (
                                room_data.get('expert_photo_rating'),
                                room_data.get('expert_photo_feedback'),
                                room_data.get('expert_fullness_rating'),
                                room_data.get('expert_fullness_feedback'),
                                admin.get('admin_id'),
                                room_data['id']
                            ))
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(updated_listing, default=str),
                    'isBase64Encoded': False
                }
            else:
                # Полное обновление объекта
                cur.execute("""
                    UPDATE t_p39732784_hourly_rentals_platf.listings SET 
                        title=%s, type=%s, city=%s, district=%s, price=%s, rating=%s, 
                        reviews=%s, auction=%s, image_url=%s, metro=%s, metro_walk=%s, 
                        has_parking=%s, parking_type=%s, parking_price_per_hour=%s,
                        features=%s, lat=%s, lng=%s, min_hours=%s, 
                        phone=%s, telegram=%s, logo_url=%s, is_archived=%s,
                        price_warning_holidays=%s, price_warning_daytime=%s, updated_at=CURRENT_TIMESTAMP
                    WHERE id=%s
                    RETURNING *
                """, (
                    body['title'].strip() if isinstance(body.get('title'), str) else body['title'],
                    body['type'], 
                    body['city'].strip() if isinstance(body.get('city'), str) else body['city'],
                    body['district'].strip() if isinstance(body.get('district'), str) else body['district'],
                    body['price'], body.get('rating', 0), body.get('reviews', 0),
                    body.get('auction', 999), body.get('image_url'), body.get('metro'),
                    body.get('metro_walk', 0), body.get('has_parking', False),
                    body.get('parking_type', 'none'), body.get('parking_price_per_hour', 0),
                    body.get('features', []), body.get('lat'), body.get('lng'),
                    body.get('min_hours', 1), body.get('phone'), body.get('telegram'),
                    body.get('logo_url'), body.get('is_archived', False),
                    body.get('price_warning_holidays', False), body.get('price_warning_daytime', False),
                    listing_id
                ))
            
            updated_listing = cur.fetchone()
            
            # Обновление станций метро
            if 'metro_stations' in body:
                cur.execute("DELETE FROM t_p39732784_hourly_rentals_platf.metro_stations WHERE listing_id = %s", (listing_id,))
                for station in body['metro_stations']:
                    cur.execute(
                        "INSERT INTO t_p39732784_hourly_rentals_platf.metro_stations (listing_id, station_name, walk_minutes) VALUES (%s, %s, %s)",
                        (listing_id, station['station_name'], station['walk_minutes'])
                    )
            
            # Обновление комнат
            if 'rooms' in body:
                cur.execute("DELETE FROM t_p39732784_hourly_rentals_platf.rooms WHERE listing_id = %s", (listing_id,))
                for room in body['rooms']:
                    cur.execute("""
                        INSERT INTO t_p39732784_hourly_rentals_platf.rooms (listing_id, type, price, description, images, 
                                         square_meters, features, min_hours, payment_methods, cancellation_policy)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (listing_id, room['type'], room['price'], 
                          room.get('description'), room.get('images', []),
                          room.get('square_meters', 0), room.get('features', []),
                          room.get('min_hours', 1), room.get('payment_methods', 'Наличные, банковская карта при заселении'),
                          room.get('cancellation_policy', 'Бесплатная отмена за 1 час до заселения')))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(updated_listing, default=str),
                'isBase64Encoded': False
            }
        
        # PATCH - изменение позиции объекта или модерация
        elif method == 'PATCH':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'submit_for_moderation':
                listing_id = body.get('listing_id')
                
                if not listing_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Требуется listing_id'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    UPDATE t_p39732784_hourly_rentals_platf.listings
                    SET submitted_for_moderation = TRUE, 
                        submitted_at = CURRENT_TIMESTAMP,
                        moderation_status = 'pending'
                    WHERE id = %s
                    RETURNING id, title, moderation_status
                """, (listing_id,))
                
                result = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': 'Объект отправлен на модерацию',
                        'listing': dict(result)
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'submit_for_recheck':
                listing_id = event.get('queryStringParameters', {}).get('id')
                
                if not listing_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Требуется ID объекта'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    UPDATE t_p39732784_hourly_rentals_platf.listings
                    SET moderation_status = 'awaiting_recheck',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING id, title, moderation_status
                """, (listing_id,))
                
                result = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': 'Объект отправлен на повторную проверку',
                        'listing': dict(result)
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'moderate':
                listing_id = body.get('listing_id')
                moderation_status = body.get('status')
                moderation_comment = body.get('comment', '')
                
                if not listing_id or not moderation_status:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Требуется listing_id и status'}),
                        'isBase64Encoded': False
                    }
                
                if moderation_status not in ['approved', 'rejected', 'pending']:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный статус модерации'}),
                        'isBase64Encoded': False
                    }
                
                # Проверка роли: только superadmin может модерировать
                cur.execute("SELECT role FROM t_p39732784_hourly_rentals_platf.admins WHERE id = %s", (admin.get('admin_id'),))
                admin_data = cur.fetchone()
                
                if not admin_data or admin_data['role'] != 'superadmin':
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Недостаточно прав для модерации'}),
                        'isBase64Encoded': False
                    }
                
                # Проверка подписки при одобрении
                if moderation_status == 'approved':
                    cur.execute("""
                        SELECT subscription_expires_at 
                        FROM t_p39732784_hourly_rentals_platf.listings 
                        WHERE id = %s
                    """, (listing_id,))
                    listing_data = cur.fetchone()
                    
                    if not listing_data or not listing_data['subscription_expires_at']:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Невозможно одобрить объект: подписка не активна'}),
                            'isBase64Encoded': False
                        }
                    
                    from datetime import datetime
                    expires_at = listing_data['subscription_expires_at']
                    if isinstance(expires_at, str):
                        expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
                    
                    if expires_at <= datetime.now(expires_at.tzinfo):
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Невозможно одобрить объект: срок подписки истёк'}),
                            'isBase64Encoded': False
                        }
                
                cur.execute("""
                    UPDATE t_p39732784_hourly_rentals_platf.listings
                    SET moderation_status = %s,
                        moderation_comment = %s,
                        moderated_by = %s,
                        moderated_at = CURRENT_TIMESTAMP,
                        submitted_for_moderation = FALSE
                    WHERE id = %s
                    RETURNING id, title, moderation_status, moderation_comment, subscription_expires_at
                """, (moderation_status, moderation_comment, admin.get('admin_id'), listing_id))
                
                result = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': 'Модерация обновлена',
                        'listing': dict(result)
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'update_position':
                listing_id = body.get('listing_id')
                new_position = body.get('position')
                
                if not listing_id or not new_position:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Требуется listing_id и position'}),
                        'isBase64Encoded': False
                    }
                
                # Получаем текущую позицию и город
                cur.execute("SELECT auction, city FROM t_p39732784_hourly_rentals_platf.listings WHERE id = %s", (listing_id,))
                listing = cur.fetchone()
                
                if not listing:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Объект не найден'}),
                        'isBase64Encoded': False
                    }
                
                old_position = listing['auction']
                city = listing['city']
                
                # Если позиция не изменилась
                if old_position == new_position:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'message': 'Позиция не изменилась'}),
                        'isBase64Encoded': False
                    }
                
                # Обновляем позиции в городе
                if old_position < new_position:
                    # Перемещение вниз: сдвигаем вверх объекты между old и new
                    cur.execute("""
                        UPDATE t_p39732784_hourly_rentals_platf.listings 
                        SET auction = auction - 1
                        WHERE city = %s 
                          AND auction > %s 
                          AND auction <= %s
                          AND id != %s
                    """, (city, old_position, new_position, listing_id))
                else:
                    # Перемещение вверх: сдвигаем вниз объекты между new и old
                    cur.execute("""
                        UPDATE t_p39732784_hourly_rentals_platf.listings 
                        SET auction = auction + 1
                        WHERE city = %s 
                          AND auction >= %s 
                          AND auction < %s
                          AND id != %s
                    """, (city, new_position, old_position, listing_id))
                
                # Устанавливаем новую позицию
                cur.execute("""
                    UPDATE t_p39732784_hourly_rentals_platf.listings 
                    SET auction = %s
                    WHERE id = %s
                    RETURNING id, title, auction
                """, (new_position, listing_id))
                
                result = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': f'Позиция изменена с #{old_position} на #{new_position}',
                        'listing': dict(result)
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
                "UPDATE t_p39732784_hourly_rentals_platf.listings SET is_archived = true WHERE id = %s RETURNING *",
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