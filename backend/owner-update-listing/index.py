"""
API для обновления объекта владельцем с отправкой на модерацию
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def verify_owner_token(token: str):
    """Проверка токена владельца"""
    if not token:
        return None
    
    try:
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("SELECT * FROM owners WHERE token = %s", (token,))
        owner = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return dict(owner) if owner else None
    except Exception:
        return None

def handler(event: dict, context) -> dict:
    """
    Обновление объекта владельцем с отправкой на повторную модерацию
    PUT /owner-update-listing - обновление данных объекта
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        token = event.get('headers', {}).get('X-Authorization', '').replace('Bearer ', '')
        owner = verify_owner_token(token)
        
        if not owner:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Требуется авторизация владельца'}),
                'isBase64Encoded': False
            }
        
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            listing_id = body.get('listing_id')
            
            if not listing_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID объекта не указан'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT * FROM listings WHERE id = %s AND owner_id = %s", (listing_id, owner['id']))
            listing = cur.fetchone()
            
            if not listing:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Объект не найден или не принадлежит вам'}),
                    'isBase64Encoded': False
                }
            
            title = body.get('title')
            description = body.get('description')
            price = body.get('price')
            square_meters = body.get('square_meters')
            image_urls = body.get('image_urls')
            logo_url = body.get('logo_url')
            features = body.get('features')
            district = body.get('district')
            city = body.get('city')
            metro = body.get('metro')
            metro_walk = body.get('metro_walk')
            has_parking = body.get('has_parking')
            parking_type = body.get('parking_type')
            parking_price_per_hour = body.get('parking_price_per_hour')
            min_hours = body.get('min_hours')
            lat = body.get('lat')
            lng = body.get('lng')
            
            update_fields = []
            update_values = []
            
            if title is not None:
                update_fields.append("title = %s")
                update_values.append(title)
            
            if description is not None:
                update_fields.append("description = %s")
                update_values.append(description)
            
            if price is not None:
                update_fields.append("price = %s")
                update_values.append(price)
            
            if square_meters is not None:
                update_fields.append("square_meters = %s")
                update_values.append(square_meters)
            
            if image_urls is not None:
                update_fields.append("image_url = %s")
                update_values.append(json.dumps(image_urls) if isinstance(image_urls, list) else image_urls)
            
            if logo_url is not None:
                update_fields.append("logo_url = %s")
                update_values.append(logo_url)
            
            if features is not None:
                update_fields.append("features = %s")
                update_values.append(features)
            
            if district is not None:
                update_fields.append("district = %s")
                update_values.append(district)
            
            if city is not None:
                update_fields.append("city = %s")
                update_values.append(city.strip() if isinstance(city, str) else city)
            
            if metro is not None:
                update_fields.append("metro = %s")
                update_values.append(metro)
            
            if metro_walk is not None:
                update_fields.append("metro_walk = %s")
                update_values.append(metro_walk)
            
            if has_parking is not None:
                update_fields.append("has_parking = %s")
                update_values.append(has_parking)
            
            if parking_type is not None:
                update_fields.append("parking_type = %s")
                update_values.append(parking_type)
            
            if parking_price_per_hour is not None:
                update_fields.append("parking_price_per_hour = %s")
                update_values.append(parking_price_per_hour)
            
            if min_hours is not None:
                update_fields.append("min_hours = %s")
                update_values.append(min_hours)
            
            if lat is not None:
                update_fields.append("lat = %s")
                update_values.append(lat)
            
            if lng is not None:
                update_fields.append("lng = %s")
                update_values.append(lng)
            
            update_fields.append("moderation_status = %s")
            update_values.append('pending')
            
            update_fields.append("submitted_for_moderation = %s")
            update_values.append(True)
            
            update_fields.append("submitted_at = %s")
            update_values.append(datetime.now())
            
            update_fields.append("updated_at = %s")
            update_values.append(datetime.now())
            
            update_values.append(listing_id)
            
            query = f"""
                UPDATE listings 
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING *
            """
            
            cur.execute(query, update_values)
            updated_listing = cur.fetchone()
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(updated_listing), default=str),
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