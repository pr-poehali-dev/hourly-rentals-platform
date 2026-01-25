import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''Публичный API для получения списка активных объектов'''
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
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Получаем все активные объекты одним запросом (только нужные поля для списка)
        cur.execute("""
            SELECT 
                l.id, l.title, l.type, l.city, l.district, l.price, l.rating, l.reviews, 
                l.auction, l.image_url, l.logo_url, l.metro, l.metro_walk as "metroWalk", 
                l.has_parking as "hasParking", l.parking_type, l.parking_price_per_hour,
                l.features, l.lat, l.lng, 
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
        
        # Получаем все комнаты одним запросом (с features для фильтрации, но БЕЗ images и description)
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