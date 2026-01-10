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
        cur.execute("""
            SELECT 
                id, title, type, city, district, price, rating, reviews, 
                auction, image_url, logo_url, metro, metro_walk as "metroWalk", 
                has_parking as "hasParking", features, lat, lng, 
                min_hours as "minHours", phone, telegram
            FROM listings 
            WHERE is_archived = false 
            ORDER BY auction ASC
        """)
        
        listings = cur.fetchall()
        
        # Получаем комнаты для каждого объекта
        for listing in listings:
            cur.execute(
                "SELECT type, price, description, image_url FROM rooms WHERE listing_id = %s",
                (listing['id'],)
            )
            rooms = cur.fetchall()
            listing['rooms'] = [{'type': r['type'], 'price': r['price']} for r in rooms]
        
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