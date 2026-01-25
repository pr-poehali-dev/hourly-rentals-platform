import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def get_room_details(listing_id: str, room_index: str) -> dict:
    '''Получить детали конкретного номера с фотографиями'''
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Получаем все комнаты для этого объекта
        cur.execute(
            """SELECT type, price, square_meters, min_hours, features, images, description
               FROM t_p39732784_hourly_rentals_platf.rooms 
               WHERE listing_id = %s
               ORDER BY id""",
            (listing_id,)
        )
        rooms = cur.fetchall()
        
        cur.close()
        conn.close()
        
        if not rooms or int(room_index) >= len(rooms):
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Room not found'}),
                'isBase64Encoded': False
            }
        
        room = dict(rooms[int(room_index)])
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(room, default=str),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

def handler(event: dict, context) -> dict:
    '''Публичный API для получения списка активных объектов и деталей номеров'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    # Получение деталей конкретного номера
    params = event.get('queryStringParameters', {}) or {}
    listing_id = params.get('listing_id')
    room_index = params.get('room_index')
    
    if listing_id and room_index is not None:
        return get_room_details(listing_id, room_index)
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Получаем все активные объекты одним запросом (БЕЗ тяжелых полей features, image_url оптимизируем)
        cur.execute("""
            SELECT 
                l.id, l.title, l.type, l.city, l.district, l.price, l.rating, l.reviews, 
                l.auction, 
                CASE 
                    WHEN l.image_url LIKE '[%' THEN (l.image_url::json->>0)
                    ELSE l.image_url
                END as image_url,
                l.logo_url, l.metro, l.metro_walk as "metroWalk", 
                l.has_parking as "hasParking", l.parking_type, l.parking_price_per_hour,
                l.lat, l.lng, 
                l.min_hours as "minHours", l.phone, l.telegram,
                l.price_warning_holidays, l.price_warning_daytime
            FROM t_p39732784_hourly_rentals_platf.listings l
            WHERE l.is_archived = false 
            AND (l.moderation_status IS NULL OR l.moderation_status = 'approved')
            ORDER BY l.city ASC, l.auction ASC, l.id ASC
        """)
        listings = cur.fetchall()
        
        if not listings:
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([]),
                'isBase64Encoded': False
            }
        
        # Получаем все комнаты одним запросом (БЕЗ images и description для оптимизации)
        listing_ids = [l['id'] for l in listings]
        placeholders = ','.join(['%s'] * len(listing_ids))
        cur.execute(
            f"""SELECT listing_id, type, price, square_meters, min_hours, features
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
            room_dict = dict(room)
            lid = room_dict.pop('listing_id')
            if lid not in rooms_by_listing:
                rooms_by_listing[lid] = []
            rooms_by_listing[lid].append(room_dict)
        
        metro_by_listing = {}
        for metro in all_metro:
            metro_dict = dict(metro)
            lid = metro_dict.pop('listing_id')
            if lid not in metro_by_listing:
                metro_by_listing[lid] = []
            metro_by_listing[lid].append(metro_dict)
        
        # Присваиваем данные каждому объекту
        result = []
        for listing in listings:
            listing_dict = dict(listing)
            listing_dict['rooms'] = rooms_by_listing.get(listing_dict['id'], [])
            listing_dict['metro_stations'] = metro_by_listing.get(listing_dict['id'], [])
            result.append(listing_dict)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(result, default=str),
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