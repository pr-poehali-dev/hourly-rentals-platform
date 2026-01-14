import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def verify_owner_token(token: str):
    '''Проверка токена владельца'''
    if not token:
        return None
    
    try:
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(
            "SELECT * FROM t_p39732784_hourly_rentals_platf.owners WHERE token = %s",
            (token,)
        )
        owner = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return dict(owner) if owner else None
    except Exception as e:
        print(f'[ERROR] verify_owner_token failed: {type(e).__name__}: {str(e)}')
        import traceback
        traceback.print_exc()
        return None

def handler(event: dict, context) -> dict:
    '''API для управления категориями номеров владельцем'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
        
        if method == 'GET':
            listing_id = event.get('queryStringParameters', {}).get('listing_id')
            print(f"[DEBUG] GET room categories for listing_id={listing_id}, owner_id={owner['id']}")
            
            if not listing_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'listing_id required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "SELECT * FROM t_p39732784_hourly_rentals_platf.listings WHERE id = %s AND owner_id = %s",
                (listing_id, owner['id'])
            )
            listing = cur.fetchone()
            
            if not listing:
                print(f"[DEBUG] Listing {listing_id} not found or not owned by owner {owner['id']}")
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Listing not found'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "SELECT * FROM t_p39732784_hourly_rentals_platf.room_categories WHERE listing_id = %s ORDER BY id",
                (listing_id,)
            )
            categories = cur.fetchall()
            print(f"[DEBUG] Found {len(categories)} categories for listing {listing_id}")
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(c) for c in categories], default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            listing_id = body.get('listing_id')
            categories = body.get('categories', [])
            
            if not listing_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'listing_id required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "SELECT * FROM t_p39732784_hourly_rentals_platf.listings WHERE id = %s AND owner_id = %s",
                (listing_id, owner['id'])
            )
            listing = cur.fetchone()
            
            if not listing:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Listing not found'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "DELETE FROM t_p39732784_hourly_rentals_platf.room_categories WHERE listing_id = %s",
                (listing_id,)
            )
            
            for category in categories:
                cur.execute(
                    """
                    INSERT INTO t_p39732784_hourly_rentals_platf.room_categories 
                    (listing_id, name, price_per_hour, square_meters, features, image_urls)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        listing_id,
                        category.get('name'),
                        category.get('price_per_hour'),
                        category.get('square_meters'),
                        category.get('features', []),
                        category.get('image_urls', [])
                    )
                )
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
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