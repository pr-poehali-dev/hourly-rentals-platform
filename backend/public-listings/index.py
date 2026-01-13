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
        # Сначала платные позиции (с активными ставками), затем бесплатные по порядку создания
        cur.execute("""
            WITH paid_positions AS (
                SELECT DISTINCT listing_id
                FROM auction_bids
                WHERE status = 'active' 
                  AND created_at::date = CURRENT_DATE
            )
            SELECT 
                l.id, l.title, l.type, l.city, l.district, l.price, l.rating, l.reviews, 
                l.auction, l.image_url, l.logo_url, l.metro, l.metro_walk as "metroWalk", 
                l.has_parking as "hasParking", l.features, l.lat, l.lng, 
                l.min_hours as "minHours", l.phone, l.telegram,
                l.price_warning_holidays, l.price_warning_daytime,
                CASE WHEN pp.listing_id IS NOT NULL THEN 0 ELSE 1 END as is_free
            FROM listings l
            LEFT JOIN paid_positions pp ON pp.listing_id = l.id
            WHERE l.is_archived = false 
            ORDER BY is_free ASC, l.auction ASC, l.id ASC
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