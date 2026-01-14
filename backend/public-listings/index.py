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
        
        # Получаем только активные объекты (не в архиве)
        # Показываем только одобренные объекты или те, что не проходили модерацию
        # Сортировка: сначала по городу (алфавит), затем по позиции auction внутри города
        cur.execute("""
            SELECT 
                l.id, l.title, l.type, l.city, l.district, l.price, l.rating, l.reviews, 
                l.auction, l.image_url, l.logo_url, l.metro, l.metro_walk as "metroWalk", 
                l.has_parking as "hasParking", l.features, l.lat, l.lng, 
                l.min_hours as "minHours", l.phone, l.telegram,
                l.price_warning_holidays, l.price_warning_daytime
            FROM listings l
            WHERE l.is_archived = false 
            AND (l.moderation_status IS NULL OR l.moderation_status = 'approved')
            ORDER BY l.city ASC, l.auction ASC, l.id ASC
        """)
        
        listings = cur.fetchall()
        
        # Получаем комнаты и станции метро для каждого объекта
        for listing in listings:
            cur.execute(
                """SELECT type, price, description, images, square_meters, features, 
                          min_hours, payment_methods, cancellation_policy 
                   FROM rooms WHERE listing_id = %s""",
                (listing['id'],)
            )
            rooms = cur.fetchall()
            listing['rooms'] = rooms
            
            cur.execute(
                """SELECT station_name, walk_minutes FROM metro_stations WHERE listing_id = %s""",
                (listing['id'],)
            )
            metro_stations = cur.fetchall()
            listing['metro_stations'] = metro_stations
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(listings, default=str),
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